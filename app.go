package main

import (
	"context"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx      context.Context
	filePath string
	lastDir  string // <-- Añadido para recordar el último directorio
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	if len(os.Args) > 1 {
		path := os.Args[len(os.Args)-1]
		absPath, err := filepath.Abs(path)
		if err == nil {
			a.filePath = absPath
		} else {
			a.filePath = path
		}
	}
}

func (a *App) ReadFile() (string, error) {
	if a.filePath == "" {
		return "", nil
	}
	data, err := os.ReadFile(a.filePath)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func (a *App) SaveFile(content string) error {
	if a.filePath == "" {
		return nil
	}
	return os.WriteFile(a.filePath, []byte(content), 0644)
}

func (a *App) GetFilePath() string {
	return a.filePath
}

func (a *App) OpenFile() (string, error) {
	// Si no hay directorio guardado, usar el HOME del usuario
	if a.lastDir == "" {
		home, err := os.UserHomeDir()
		if err == nil {
			a.lastDir = home
		}
	}

	selected, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title:            "Abrir archivo Markdown",
		DefaultDirectory: a.lastDir, // <-- Abre en el último directorio o HOME
		Filters: []runtime.FileFilter{
			{DisplayName: "Markdown", Pattern: "*.md;*.markdown;*.mkd;*.txt"},
		},
	})
	
	if err != nil {
		return "", err
	}
	if selected == "" {
		return "", nil
	}

	// Guardar el directorio del archivo seleccionado para la próxima vez
	a.lastDir = filepath.Dir(selected)

	a.filePath = selected
	data, err := os.ReadFile(a.filePath)
	if err != nil {
		return "", err
	}
	return string(data), nil
}
