package main

import (
	"context"
	"os"
	"path/filepath"
	"strings"

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
