package main

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx          context.Context
	lastDir      string
	startupPaths []string

	watcher       *fsnotify.Watcher
	watchedMu     sync.Mutex
	watchedPaths  map[string]struct{}
	lastEvent     map[string]time.Time
}

func NewApp() *App {
	return &App{
		watchedPaths: map[string]struct{}{},
		lastEvent:    map[string]time.Time{},
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	for _, arg := range os.Args[1:] {
		// Ignorar flags de Wails/GTK
		if strings.HasPrefix(arg, "-") {
			continue
		}
		abs, err := filepath.Abs(arg)
		if err != nil {
			continue
		}
		info, err := os.Stat(abs)
		if err != nil || info.IsDir() {
			continue
		}
		a.startupPaths = append(a.startupPaths, abs)
		a.lastDir = filepath.Dir(abs)
	}

	// IPC: escuchar nuevas instancias para ser ventana primaria.
	_ = startIPCServer(func(paths []string) {
		runtime.WindowShow(a.ctx)
		runtime.WindowUnminimise(a.ctx)
		runtime.EventsEmit(a.ctx, "open-paths", paths)
	})

	// File watcher para detectar cambios externos.
	if w, err := fsnotify.NewWatcher(); err == nil {
		a.watcher = w
		go a.watchLoop()
	}
}

func (a *App) shutdown(ctx context.Context) {
	if a.watcher != nil {
		_ = a.watcher.Close()
	}
	cleanupIPC()
}

// watchLoop dispatches fsnotify events to the frontend with simple debounce.
func (a *App) watchLoop() {
	for {
		select {
		case ev, ok := <-a.watcher.Events:
			if !ok {
				return
			}
			path := ev.Name
			a.watchedMu.Lock()
			last := a.lastEvent[path]
			now := time.Now()
			if now.Sub(last) < 500*time.Millisecond {
				a.watchedMu.Unlock()
				continue
			}
			a.lastEvent[path] = now
			a.watchedMu.Unlock()

			kind := "modified"
			switch {
			case ev.Op&fsnotify.Remove != 0, ev.Op&fsnotify.Rename != 0:
				kind = "removed"
			case ev.Op&fsnotify.Write != 0, ev.Op&fsnotify.Create != 0:
				kind = "modified"
			default:
				continue
			}
			runtime.EventsEmit(a.ctx, "file-changed", map[string]string{
				"path":  path,
				"event": kind,
			})
		case _, ok := <-a.watcher.Errors:
			if !ok {
				return
			}
		}
	}
}

// WatchFile registers a file path for external-change notifications.
func (a *App) WatchFile(path string) error {
	if a.watcher == nil || path == "" {
		return nil
	}
	a.watchedMu.Lock()
	defer a.watchedMu.Unlock()
	if _, ok := a.watchedPaths[path]; ok {
		return nil
	}
	if err := a.watcher.Add(path); err != nil {
		return err
	}
	a.watchedPaths[path] = struct{}{}
	return nil
}

// UnwatchFile stops monitoring a previously watched path.
func (a *App) UnwatchFile(path string) error {
	if a.watcher == nil || path == "" {
		return nil
	}
	a.watchedMu.Lock()
	defer a.watchedMu.Unlock()
	if _, ok := a.watchedPaths[path]; !ok {
		return nil
	}
	delete(a.watchedPaths, path)
	delete(a.lastEvent, path)
	return a.watcher.Remove(path)
}

// GetUserHome devuelve el directorio home del usuario.
func (a *App) GetUserHome() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	return home
}

// GetStartupPaths devuelve las rutas pasadas por CLI al iniciar la app.
func (a *App) GetStartupPaths() []string {
	out := make([]string, len(a.startupPaths))
	copy(out, a.startupPaths)
	return out
}

// ReadFileAt lee el contenido de un archivo dado su path absoluto.
func (a *App) ReadFileAt(path string) (string, error) {
	if path == "" {
		return "", nil
	}
	abs, err := filepath.Abs(path)
	if err == nil {
		path = abs
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// SaveFileAt guarda contenido en un archivo dado su path absoluto.
func (a *App) SaveFileAt(path string, content string) error {
	if path == "" {
		return nil
	}
	abs, err := filepath.Abs(path)
	if err == nil {
		path = abs
	}
	return os.WriteFile(path, []byte(content), 0644)
}

// OpenFilesDialog abre un diálogo para seleccionar uno o varios archivos Markdown.
// Devuelve las rutas seleccionadas o un slice vacío si se cancela.
func (a *App) OpenFilesDialog() ([]string, error) {
	if a.lastDir == "" {
		if home, err := os.UserHomeDir(); err == nil {
			a.lastDir = home
		}
	}

	paths, err := runtime.OpenMultipleFilesDialog(a.ctx, runtime.OpenDialogOptions{
		Title:            "Abrir archivos Markdown",
		DefaultDirectory: a.lastDir,
		Filters: []runtime.FileFilter{
			{DisplayName: "Markdown", Pattern: "*.md;*.markdown;*.mkd;*.txt"},
		},
	})

	if err != nil {
		return nil, err
	}
	if len(paths) == 0 {
		return []string{}, nil
	}

	a.lastDir = filepath.Dir(paths[0])
	return paths, nil
}

// SaveMarkdownDialog abre un diálogo para guardar un archivo Markdown.
func (a *App) SaveMarkdownDialog(defaultFilename string) (string, error) {
	if a.lastDir == "" {
		if home, err := os.UserHomeDir(); err == nil {
			a.lastDir = home
		}
	}
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Guardar como",
		DefaultDirectory: a.lastDir,
		DefaultFilename:  defaultFilename,
		Filters: []runtime.FileFilter{
			{DisplayName: "Markdown", Pattern: "*.md;*.markdown;*.txt"},
		},
	})
	if err != nil {
		return "", err
	}
	if path != "" {
		a.lastDir = filepath.Dir(path)
	}
	return path, nil
}

// SaveHTMLDialog abre un diálogo para exportar como HTML.
func (a *App) SaveHTMLDialog(defaultFilename string) (string, error) {
	if a.lastDir == "" {
		if home, err := os.UserHomeDir(); err == nil {
			a.lastDir = home
		}
	}
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Exportar como HTML",
		DefaultDirectory: a.lastDir,
		DefaultFilename:  defaultFilename,
		Filters: []runtime.FileFilter{
			{DisplayName: "HTML", Pattern: "*.html;*.htm"},
		},
	})
	if err != nil {
		return "", err
	}
	if path != "" {
		a.lastDir = filepath.Dir(path)
	}
	return path, nil
}

// SavePDFDialog abre un diálogo para exportar como PDF.
func (a *App) SavePDFDialog(defaultFilename string) (string, error) {
	if a.lastDir == "" {
		if home, err := os.UserHomeDir(); err == nil {
			a.lastDir = home
		}
	}
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:            "Exportar como PDF",
		DefaultDirectory: a.lastDir,
		DefaultFilename:  defaultFilename,
		Filters: []runtime.FileFilter{
			{DisplayName: "PDF", Pattern: "*.pdf"},
		},
	})
	if err != nil {
		return "", err
	}
	if path != "" {
		a.lastDir = filepath.Dir(path)
	}
	return path, nil
}

// findBrowser busca un navegador compatible con impresión headless.
func findBrowser() (path string, browserType string) {
	for _, name := range []string{"google-chrome-stable", "google-chrome", "chromium-browser", "chromium"} {
		if p, err := exec.LookPath(name); err == nil {
			return p, "chromium"
		}
	}
	for _, name := range []string{"firefox", "firefox-esr"} {
		if p, err := exec.LookPath(name); err == nil {
			return p, "firefox"
		}
	}
	return "", ""
}

// ExportPDF genera un PDF a partir de HTML usando el navegador del sistema en modo headless.
func (a *App) ExportPDF(pdfPath string, htmlContent string) error {
	browser, bType := findBrowser()
	if browser == "" {
		return fmt.Errorf("no_browser")
	}

	tmpFile, err := os.CreateTemp("", "puremark-export-*.html")
	if err != nil {
		return fmt.Errorf("temp file: %w", err)
	}
	defer os.Remove(tmpFile.Name())

	if _, err := tmpFile.WriteString(htmlContent); err != nil {
		tmpFile.Close()
		return fmt.Errorf("write temp: %w", err)
	}
	tmpFile.Close()

	inputURI := "file://" + tmpFile.Name()

	var cmd *exec.Cmd
	switch bType {
	case "chromium":
		cmd = exec.Command(browser,
			"--headless",
			"--disable-gpu",
			"--no-sandbox",
			"--run-all-compositor-stages-before-draw",
			"--print-to-pdf="+pdfPath,
			"--no-pdf-header-footer",
			inputURI,
		)
	case "firefox":
		cmd = exec.Command(browser,
			"--headless",
			"--print", inputURI, pdfPath,
		)
	}

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("pdf export failed: %s: %w", string(output), err)
	}

	return nil
}

// FileStats contiene estadísticas básicas de un archivo.
type FileStats struct {
	Lines        int    `json:"lines"`
	SizeKB       string `json:"sizeKB"`
	ModifiedDate string `json:"modifiedDate"`
}

// GetFileStats devuelve estadísticas del archivo sin saturar el GC.
// Lee en chunks de 32KB y cuenta líneas con bytes.Count (vectorizado SIMD)
// para evitar cargar archivos completos en el Heap.
func (a *App) GetFileStats(path string) (*FileStats, error) {
	if path == "" {
		return nil, nil
	}

	info, err := os.Stat(path)
	if err != nil {
		return nil, err
	}

	// 1. Cálculo de tamaño O(1)
	size := info.Size()
	var sizeStr string
	switch {
	case size < 1024:
		sizeStr = fmt.Sprintf("%d B", size)
	case size < 1024*1024:
		sizeStr = fmt.Sprintf("%.1f KB", float64(size)/1024)
	default:
		sizeStr = fmt.Sprintf("%.1f MB", float64(size)/(1024*1024))
	}

	// 2. Conteo de líneas Zero-Allocation
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	buf := make([]byte, 32*1024) // 32KB L1/L2 cache friendly
	lines := 0
	nl := []byte{'\n'}

	for {
		c, err := file.Read(buf)
		if c > 0 {
			lines += bytes.Count(buf[:c], nl)
		}
		if err != nil {
			if err != io.EOF {
				return nil, err
			}
			break
		}
	}

	// 3. Formateo de fecha
	mod := info.ModTime()
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	yesterday := today.AddDate(0, 0, -1)

	var dateStr string
	switch {
	case mod.After(today):
		dateStr = "hoy " + mod.Format("15:04")
	case mod.After(yesterday):
		dateStr = "ayer " + mod.Format("15:04")
	default:
		dateStr = mod.Format("2006-01-02 15:04")
	}

	return &FileStats{
		Lines:        lines + 1, // +1: la última línea puede no terminar en \n
		SizeKB:       sizeStr,
		ModifiedDate: dateStr,
	}, nil
}
