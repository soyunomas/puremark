# Variables
APP_NAME = puremark
BIN_DIR = $(HOME)/.local/bin
DESKTOP_DIR = $(HOME)/.local/share/applications

.PHONY: help build install uninstall dev clean deb

help: ## ❓ Muestra este menú de ayuda
	@echo "Comandos disponibles para $(APP_NAME):"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""

build: ## 🔨 Compila la aplicación para producción
	@echo "🔨 Construyendo $(APP_NAME)..."
	wails build

install: build ## 📦 Compila e instala la aplicación en el sistema local
	@echo "📦 Instalando binario..."
	mkdir -p $(BIN_DIR)
	cp build/bin/$(APP_NAME) $(BIN_DIR)/$(APP_NAME)
	chmod +x $(BIN_DIR)/$(APP_NAME)
	@echo "🖥️  Instalando acceso directo de escritorio..."
	mkdir -p $(DESKTOP_DIR)
	cp $(APP_NAME).desktop $(DESKTOP_DIR)/$(APP_NAME).desktop
	@echo "📄 Configurando $(APP_NAME) como visor predeterminado para archivos .md..."
	xdg-mime default $(APP_NAME).desktop text/markdown
	xdg-mime default $(APP_NAME).desktop text/x-markdown
	@echo ""
	@echo "✅ ¡$(APP_NAME) instalado con éxito!"
	@echo "   Binario:   $(BIN_DIR)/$(APP_NAME)"
	@echo "   Desktop:   $(DESKTOP_DIR)/$(APP_NAME).desktop"
	@echo "   💡 Asegúrate de que $(BIN_DIR) está en tu PATH."

uninstall: ## 🗑️ Desinstala la aplicación del sistema
	@echo "🗑️  Desinstalando $(APP_NAME)..."
	rm -f $(BIN_DIR)/$(APP_NAME)
	rm -f $(DESKTOP_DIR)/$(APP_NAME).desktop
	@echo "✅ ¡Desinstalación completada!"

dev: ## 🚀 Ejecuta la aplicación en modo desarrollo (Live Reload)
	wails dev

deb: deb-40 ## 📦 Genera el .deb por defecto (webkit2gtk-4.0 / Mint 21 / Ubuntu 22.04)

deb-40: ## 📦 .deb contra libwebkit2gtk-4.0-37 (Mint 21 / Ubuntu 22.04)
	@echo "📦 Generando .deb (webkit2gtk-4.0)..."
	bash build-deb.sh 40

deb-41: ## 📦 .deb contra libwebkit2gtk-4.1-0 (Mint 22 / Ubuntu 24.04)
	@echo "📦 Generando .deb (webkit2gtk-4.1)..."
	bash build-deb.sh 41

deb-all: deb-40 deb-41 ## 📦 Genera ambos .deb (4.0 y 4.1)

clean: ## 🧹 Limpia los archivos de compilación generados
	@echo "🧹 Limpiando binarios anteriores..."
	rm -rf build/bin/ $(APP_NAME)_*_amd64*.deb
	@echo "✅ Limpieza completada."
