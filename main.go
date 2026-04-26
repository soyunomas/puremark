package main

import (
	"embed"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Single-instance: si ya hay otra ventana, le pasamos los args y salimos.
	if trySendToPrimary() {
		os.Exit(0)
	}

	app := NewApp()

	err := wails.Run(&options.App{
		Title:     "PureMark",
		Width:     960,
		Height:    700,
		MinWidth:  400,
		MinHeight: 300,
		Frameless: true,
		AssetServer: &assetserver.Options{
			Assets:  assets,
			Handler: http.HandlerFunc(localFileHandler),
		},
		BackgroundColour: &options.RGBA{R: 255, G: 255, B: 255, A: 1},
		OnStartup:        app.startup,
		OnShutdown:       app.shutdown,
		DragAndDrop: &options.DragAndDrop{
			EnableFileDrop:     true,
			DisableWebViewDrop: false,
		},
		Bind: []interface{}{
			app,
		},
		Linux: &linux.Options{
			ProgramName: "PureMark",
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}

// localFileHandler sirve archivos locales (imágenes referenciadas por markdown)
// vía /__local/?p=<absolute-path>. Es la única ruta personalizada del AssetServer:
// permite que `<img src>` use una URL same-origin sin caer en restricciones de file://.
func localFileHandler(w http.ResponseWriter, r *http.Request) {
	if !strings.HasPrefix(r.URL.Path, "/__local/") && r.URL.Path != "/__local" {
		http.NotFound(w, r)
		return
	}
	p := r.URL.Query().Get("p")
	if p == "" {
		http.Error(w, "missing p", http.StatusBadRequest)
		return
	}
	abs, err := filepath.Abs(p)
	if err != nil {
		http.Error(w, "bad path", http.StatusBadRequest)
		return
	}
	info, err := os.Stat(abs)
	if err != nil || info.IsDir() {
		http.NotFound(w, r)
		return
	}
	http.ServeFile(w, r, abs)
}
