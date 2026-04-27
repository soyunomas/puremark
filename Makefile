# Variables
APP_NAME = puremark
BIN_DIR = $(HOME)/.local/bin
DESKTOP_DIR = $(HOME)/.local/share/applications

WAILS_FLAGS = -trimpath -ldflags="-s -w -buildid="

.PHONY: help build build-40 build-41 install install-40 install-41 install-files uninstall dev dev-40 dev-41 clean deb deb-40 deb-41 deb-all

help: ## ❓ Muestra este menú de ayuda
	@echo "Comandos disponibles para $(APP_NAME):"
	@echo ""
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""

build: build-40 ## 🔨 Compila por defecto usando webkit2gtk-4.0

build-40: ## 🔨 Compila para Mint antigua / Ubuntu 22.04 / webkit2gtk-4.0
	@echo "🔨 Construyendo $(APP_NAME) con webkit2gtk-4.0..."
	wails build $(WAILS_FLAGS)

build-41: ## 🔨 Compila para Mint nueva / Ubuntu 24.04 / webkit2gtk-4.1
	@echo "🔨 Construyendo $(APP_NAME) con webkit2gtk-4.1..."
	wails build -tags webkit2_41 $(WAILS_FLAGS)

install: install-40 ## 📦 Instala por defecto usando webkit2gtk-4.0

install-40: build-40 ## 📦 Compila e instala usando webkit2gtk-4.0
	$(MAKE) install-files

install-41: build-41 ## 📦 Compila e instala usando webkit2gtk-4.1
	$(MAKE) install-files

install-files: ## 📦 Instala los archivos ya compilados sin recompilar
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

dev: ## 🚀 Ejecuta la aplicación en modo desarrollo
	wails dev

dev-40: ## 🚀 Desarrollo con webkit2gtk-4.0
	wails dev

dev-41: ## 🚀 Desarrollo con webkit2gtk-4.1
	wails dev -tags webkit2_41

deb: deb-40 ## 📦 Genera el .deb por defecto webkit2gtk-4.0

deb-40: ## 📦 .deb contra libwebkit2gtk-4.0-37
	@echo "📦 Generando .deb (webkit2gtk-4.0)..."
	bash build-deb.sh 40

deb-41: ## 📦 .deb contra libwebkit2gtk-4.1-0
	@echo "📦 Generando .deb (webkit2gtk-4.1)..."
	bash build-deb.sh 41

deb-all: deb-40 deb-41 ## 📦 Genera ambos .deb

clean: ## 🧹 Limpia los archivos de compilación generados
	@echo "🧹 Limpiando binarios anteriores..."
	rm -rf build/bin/ $(APP_NAME)_*_amd64*.deb
	@echo "✅ Limpieza completada."
