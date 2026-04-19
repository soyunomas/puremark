#!/bin/bash
set -e

BIN_DIR="$HOME/.local/bin"
DESKTOP_DIR="$HOME/.local/share/applications"

echo "🗑️  Uninstalling PureMark..."

if [ -f "$BIN_DIR/puremark" ]; then
  rm "$BIN_DIR/puremark"
  echo "   ✓ Binary removed: $BIN_DIR/puremark"
else
  echo "   ⚠ Binary not found: $BIN_DIR/puremark"
fi

if [ -f "$DESKTOP_DIR/puremark.desktop" ]; then
  rm "$DESKTOP_DIR/puremark.desktop"
  echo "   ✓ Desktop entry removed: $DESKTOP_DIR/puremark.desktop"
else
  echo "   ⚠ Desktop entry not found: $DESKTOP_DIR/puremark.desktop"
fi

echo "📄 Resetting default app for .md files..."
xdg-mime default org.gnome.gedit.desktop text/markdown 2>/dev/null || true
xdg-mime default org.gnome.gedit.desktop text/x-markdown 2>/dev/null || true

echo ""
echo "✅ PureMark uninstalled successfully."
