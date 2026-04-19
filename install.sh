#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BIN_DIR="$HOME/.local/bin"
DESKTOP_DIR="$HOME/.local/share/applications"

echo "🔨 Building PureMark..."
cd "$SCRIPT_DIR"
wails build

echo "📦 Installing binary..."
mkdir -p "$BIN_DIR"
cp build/bin/puremark "$BIN_DIR/puremark"
chmod +x "$BIN_DIR/puremark"

echo "🖥️  Installing desktop entry..."
mkdir -p "$DESKTOP_DIR"
cp puremark.desktop "$DESKTOP_DIR/puremark.desktop"

echo "📄 Setting PureMark as default for .md files..."
xdg-mime default puremark.desktop text/markdown
xdg-mime default puremark.desktop text/x-markdown

echo ""
echo "✅ PureMark installed successfully!"
echo "   Binary: $BIN_DIR/puremark"
echo "   Desktop: $DESKTOP_DIR/puremark.desktop"
echo ""
echo "   Make sure ~/.local/bin is in your PATH."
