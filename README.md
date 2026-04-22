# PureMark

A clean, native Markdown viewer and editor for Linux built with [Wails](https://wails.io) (Go + WebKit).

Designed for reading notes, studying, and presenting documents with maximum readability.

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Platform](https://img.shields.io/badge/platform-Linux-lightgrey.svg) ![Go](https://img.shields.io/badge/Go-1.23-00ADD8.svg) ![Version](https://img.shields.io/badge/version-1.1.0-green.svg)

## Features

### Viewing & Rendering
- **Native file association** — Double-click any `.md` file to open it instantly
- **Elegant rendering** — Markdown to HTML with clean typography (Inter + JetBrains Mono)
- **Syntax highlighting** — Code blocks with highlight.js, colors adapt to each theme
- **Rich text copy** — Copy rendered content as `text/html` + `text/plain` for pasting into Word, email, etc.
- **Print support** — Optimized `@media print` CSS with page-break control

### Editing
- **Edit mode** — Toggle between view and edit with `Ctrl+E`
- **Inline formatting toolbar** — Bold, Italic, Strikethrough, Headings, Quotes, Lists, Links, Code (inline and block)
- **Smart formatting** — Place your cursor on a word and apply formatting; it wraps the whole word automatically
- **Full undo / redo** — `Ctrl+Z` / `Ctrl+Y` with custom undo stack (native undo unreliable in WebKitGTK)
- **Unsaved changes protection** — Prompts to save before closing if there are pending edits

### Multi-Tab
- **Tabbed interface** — Open multiple files simultaneously
- **Per-tab state** — Each tab maintains its own content, mode, undo/redo stack, and dirty flag
- **Tab bar with scroll** — Horizontal scrolling with arrows and mouse wheel when many tabs are open
- **Quick open button** — `+` button on the tab bar to open new files
- **Drag & Drop** — Drop `.md` files onto the window to open them as new tabs

### UI & Customization
- **9 color themes** — Default, Nord, Solarized, Dracula, Rosé Pine, Catppuccin, Oceanic, Sunset Coral, Emerald
- **Light / Dark mode** — Per-theme toggle with one click
- **Zoom controls** — `Ctrl++`, `Ctrl+-`, `Ctrl+0`, `Ctrl+Mouse Wheel`, and status bar slider
- **Frameless window** — Clean look with custom title bar and window controls
- **Full menu bar** — File, Edit, View, Document, Format, Go, Tools, Help
- **Context menu** — Right-click for Cut, Copy, Paste, Copy as Rich Text, Select All
- **Status bar** — File path, line count, file size, modification date, zoom slider, fullscreen toggle
- **Multi-language UI** — Spanish and English
- **Preferences persistence** — Theme, color scheme, language, zoom level remembered across sessions

### System Integration
- **`.deb` package** with automatic desktop entry, icon registration, and MIME type association
- **CLI support** — Open files directly from terminal: `puremark file.md`
- **Multiple file arguments** — `puremark file1.md file2.md` opens both in tabs

## Installation

### Option A: `.deb` package (recommended)

Download the latest `.deb` from [Releases](https://github.com/soyunomas/puremark/releases) and install:

```bash
sudo dpkg -i puremark_1.1.0_amd64.deb
```

This will:
- Install the binary to `/usr/local/bin/puremark`
- Register PureMark as the default viewer for `.md` files
- Add the application icon and desktop entry

To uninstall:

```bash
sudo dpkg -r puremark
```

### Option B: Build from source

#### Prerequisites

- [Go](https://go.dev/dl/) 1.23+
- [Node.js](https://nodejs.org/) 18+
- [Wails CLI](https://wails.io/docs/gettingstarted/installation) v2
- WebKit2GTK dev libraries:

```bash
# Debian / Ubuntu / Mint
sudo apt install libwebkit2gtk-4.0-dev libgtk-3-dev
```

Verify your environment:

```bash
wails doctor
```

#### Build & Install

```bash
git clone https://github.com/soyunomas/puremark.git
cd puremark
make install
```

This compiles the app, copies the binary to `~/.local/bin/`, and registers the `.desktop` file.

Make sure `~/.local/bin` is in your `PATH`.

#### Build `.deb` locally

```bash
make deb
```

Generates `puremark_1.1.0_amd64.deb` in the project directory.

## Usage

**From file manager:** Double-click any `.md` file (after installation, PureMark is the default handler).

**From terminal:**

```bash
puremark path/to/file.md
puremark file1.md file2.md   # Opens both in tabs
```

**Without arguments:** Opens a welcome screen — use `Ctrl+O` or **File → Open** to pick a file.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+O` | Open file |
| `Ctrl+S` | Save file |
| `Ctrl+E` | Toggle edit mode |
| `Ctrl+W` | Close current tab |
| `Ctrl+P` | Print |
| `Ctrl+Q` | Quit |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl+B` | Bold (edit mode) |
| `Ctrl+I` | Italic (edit mode) |
| `Ctrl+A` | Select all (content only) |
| `Ctrl+Shift+C` | Copy as rich text |
| `Ctrl++` / `Ctrl+-` | Zoom in / out |
| `Ctrl+0` | Reset zoom |
| `Ctrl+Mouse Wheel` | Zoom |
| `F11` | Toggle fullscreen |
| `Esc` | Close menu / modal |

## Makefile Targets

```
make build      # Compile for production
make install    # Build + install locally
make uninstall  # Remove from system
make deb        # Generate .deb package
make dev        # Run in dev mode (live reload)
make clean      # Remove build artifacts
```

## Tech Stack

- **Backend:** Go + [Wails v2](https://wails.io)
- **Frontend:** TypeScript + [Marked.js](https://marked.js.org) + [DOMPurify](https://github.com/cure53/DOMPurify) + [highlight.js](https://highlightjs.org)
- **Runtime:** WebKit2GTK (Linux)

## Project Structure

```
puremark/
├── app.go              # Go backend (file I/O, dialogs, file stats)
├── main.go             # Wails app entry point
├── frontend/
│   └── src/
│       ├── main.ts     # Frontend logic (UI, tabs, editor, undo stack, i18n)
│       └── style.css   # All styles, themes, syntax highlighting
├── build/
│   └── appicon.png     # App icon
├── puremark.desktop    # Linux desktop entry
├── build-deb.sh        # .deb packaging script
├── install.sh          # Manual install script
├── uninstall.sh        # Manual uninstall script
├── Makefile            # Build automation
└── wails.json          # Wails config
```

## License

MIT
