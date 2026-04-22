#!/bin/bash
set -euo pipefail

# ─── Config ───────────────────────────────────────────
APP_NAME="puremark"
VERSION="1.1.0"
ARCH="amd64"
MAINTAINER="soyunomas <https://github.com/soyunomas/puremark>"
DESCRIPTION="PureMark — Elegant Markdown Viewer for Linux"
PKG_DIR="${APP_NAME}_${VERSION}_${ARCH}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ─── Verificar binario ───────────────────────────────
BINARY="${SCRIPT_DIR}/build/bin/${APP_NAME}"
if [ ! -f "$BINARY" ]; then
    echo "⚠️  Binario no encontrado en ${BINARY}"
    echo "   Ejecutando 'wails build'..."
    cd "$SCRIPT_DIR"
    wails build
fi

# ─── Limpiar build anterior ──────────────────────────
cd "$SCRIPT_DIR"
rm -rf "$PKG_DIR" "${PKG_DIR}.deb"

# ─── Crear estructura de directorios ─────────────────
mkdir -p "${PKG_DIR}/DEBIAN"
mkdir -p "${PKG_DIR}/usr/local/bin"
mkdir -p "${PKG_DIR}/usr/share/applications"
mkdir -p "${PKG_DIR}/usr/share/icons/hicolor/256x256/apps"
mkdir -p "${PKG_DIR}/usr/share/doc/${APP_NAME}"

# ─── Copiar archivos ─────────────────────────────────
cp "$BINARY" "${PKG_DIR}/usr/local/bin/${APP_NAME}"
chmod 755 "${PKG_DIR}/usr/local/bin/${APP_NAME}"

# Desktop entry (con ruta absoluta para el icono instalado)
cat > "${PKG_DIR}/usr/share/applications/${APP_NAME}.desktop" <<EOF
[Desktop Entry]
Name=PureMark
Comment=Elegant Markdown Viewer
Exec=${APP_NAME} %f
Icon=${APP_NAME}
Terminal=false
Type=Application
Categories=Utility;TextEditor;
MimeType=text/markdown;text/x-markdown;
StartupNotify=true
EOF

# Icono (redimensionar a 256x256 para el paquete)
if command -v convert &>/dev/null; then
    convert "${SCRIPT_DIR}/build/appicon.png" -resize 256x256 \
        "${PKG_DIR}/usr/share/icons/hicolor/256x256/apps/${APP_NAME}.png"
else
    cp "${SCRIPT_DIR}/build/appicon.png" \
        "${PKG_DIR}/usr/share/icons/hicolor/256x256/apps/${APP_NAME}.png"
fi

# Doc
if [ -f "${SCRIPT_DIR}/README.md" ]; then
    cp "${SCRIPT_DIR}/README.md" "${PKG_DIR}/usr/share/doc/${APP_NAME}/README.md"
fi

# Copyright
cat > "${PKG_DIR}/usr/share/doc/${APP_NAME}/copyright" <<EOF
Format: https://www.debian.org/doc/packaging-manuals/copyright-format/1.0/
Upstream-Name: PureMark
Upstream-Contact: ${MAINTAINER}

Files: *
Copyright: 2024-2026 soyunomas
License: MIT
EOF

# ─── DEBIAN/control ──────────────────────────────────
INSTALLED_SIZE=$(du -sk "${PKG_DIR}/usr" | cut -f1)

cat > "${PKG_DIR}/DEBIAN/control" <<EOF
Package: ${APP_NAME}
Version: ${VERSION}
Section: utils
Priority: optional
Architecture: ${ARCH}
Depends: libwebkit2gtk-4.0-37, libgtk-3-0
Installed-Size: ${INSTALLED_SIZE}
Maintainer: ${MAINTAINER}
Description: ${DESCRIPTION}
 PureMark is a native desktop Markdown viewer built with Wails (Go + WebKit).
 Features rich text copy, edit mode, zoom controls, multiple themes, and
 seamless Linux integration as the default .md file handler.
Homepage: https://github.com/soyunomas/puremark
EOF

# ─── DEBIAN/postinst ─────────────────────────────────
cat > "${PKG_DIR}/DEBIAN/postinst" <<'EOF'
#!/bin/bash
set -e
# Actualizar caché de iconos
if command -v gtk-update-icon-cache &>/dev/null; then
    gtk-update-icon-cache -f -t /usr/share/icons/hicolor 2>/dev/null || true
fi
# Actualizar base de datos de desktop
if command -v update-desktop-database &>/dev/null; then
    update-desktop-database /usr/share/applications 2>/dev/null || true
fi
# Actualizar base de datos MIME
if command -v update-mime-database &>/dev/null; then
    update-mime-database /usr/share/mime 2>/dev/null || true
fi
# Registrar como visor por defecto de archivos .md para TODOS los usuarios existentes
for USER_HOME in /home/*; do
    USER_NAME="$(basename "$USER_HOME")"
    if id "$USER_NAME" &>/dev/null; then
        MIMEAPPS="$USER_HOME/.config/mimeapps.list"
        mkdir -p "$USER_HOME/.config"
        if [ -f "$MIMEAPPS" ]; then
            # Eliminar entradas previas de markdown para evitar duplicados
            sed -i '/^text\/markdown=/d; /^text\/x-markdown=/d' "$MIMEAPPS" 2>/dev/null || true
            # Asegurar sección [Default Applications]
            if ! grep -q '^\[Default Applications\]' "$MIMEAPPS" 2>/dev/null; then
                echo -e '\n[Default Applications]' >> "$MIMEAPPS"
            fi
            sed -i '/^\[Default Applications\]/a text\/x-markdown=puremark.desktop' "$MIMEAPPS"
            sed -i '/^\[Default Applications\]/a text\/markdown=puremark.desktop' "$MIMEAPPS"
        else
            cat > "$MIMEAPPS" <<MIME
[Default Applications]
text/markdown=puremark.desktop
text/x-markdown=puremark.desktop
MIME
        fi
        chown "$USER_NAME":"$USER_NAME" "$MIMEAPPS" 2>/dev/null || true
    fi
done
# También para root
if command -v xdg-mime &>/dev/null; then
    xdg-mime default puremark.desktop text/markdown 2>/dev/null || true
    xdg-mime default puremark.desktop text/x-markdown 2>/dev/null || true
fi
EOF
chmod 755 "${PKG_DIR}/DEBIAN/postinst"

# ─── DEBIAN/postrm ───────────────────────────────────
cat > "${PKG_DIR}/DEBIAN/postrm" <<'EOF'
#!/bin/bash
set -e
if [ "$1" = "remove" ] || [ "$1" = "purge" ]; then
    if command -v gtk-update-icon-cache &>/dev/null; then
        gtk-update-icon-cache -f -t /usr/share/icons/hicolor 2>/dev/null || true
    fi
    if command -v update-desktop-database &>/dev/null; then
        update-desktop-database /usr/share/applications 2>/dev/null || true
    fi
fi
EOF
chmod 755 "${PKG_DIR}/DEBIAN/postrm"

# ─── Construir .deb ──────────────────────────────────
dpkg-deb --build --root-owner-group "$PKG_DIR"

# ─── Limpiar directorio temporal ──────────────────────
rm -rf "$PKG_DIR"

# ─── Resultado ────────────────────────────────────────
DEB_FILE="${PKG_DIR}.deb"
echo ""
echo "══════════════════════════════════════════════════"
echo "  ✅ Paquete creado: ${DEB_FILE}"
echo "  📦 Tamaño: $(du -h "$DEB_FILE" | cut -f1)"
echo ""
echo "  Instalar:    sudo dpkg -i ${DEB_FILE}"
echo "  Desinstalar: sudo dpkg -r ${APP_NAME}"
echo "══════════════════════════════════════════════════"
