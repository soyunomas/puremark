package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx          context.Context
	lastDir      string
	startupPaths []string
}

func NewApp() *App {
	return &App{}
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

// FileStats contiene estadísticas básicas de un archivo.
type FileStats struct {
	Lines        int    `json:"lines"`
	SizeKB       string `json:"sizeKB"`
	ModifiedDate string `json:"modifiedDate"`
}

// GetFileStats devuelve estadísticas del archivo en la ruta indicada.
func (a *App) GetFileStats(path string) (*FileStats, error) {
	if path == "" {
		return nil, nil
	}

	info, err := os.Stat(path)
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	lines := strings.Count(string(data), "\n")

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
		Lines:        lines,
		SizeKB:       sizeStr,
		ModifiedDate: dateStr,
	}, nil
}
