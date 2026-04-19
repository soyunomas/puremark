# PureMark

A clean, native Markdown viewer and editor for Linux built with [Wails](https://wails.io) (Go + WebKit).

Designed for reading notes, studying, and presenting documents with maximum readability.

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Platform](https://img.shields.io/badge/platform-Linux-lightgrey.svg) ![Go](https://img.shields.io/badge/Go-1.23-00ADD8.svg)

## Features

- **Native file association** — Double-click any `.md` file to open it instantly
- **Elegant rendering** — Markdown to HTML with clean typography (Inter + JetBrains Mono)
- **Edit mode** — Toggle between view and edit with a built-in Markdown toolbar (Bold, Italic, Strikethrough, Headings, Quotes, Lists, Links, Code)
- **Smart formatting** — Place your cursor on a word and apply formatting; it wraps the whole word automatically
- **Undo / Redo** — Full `Ctrl+Z` / `Ctrl+Y` support with a custom undo stack
- **Rich text copy** — Copy rendered content as `text/html` + `text/plain` for pasting into Word, email, etc.
- **Context menu** — Right-click for Cut, Copy, Paste, Copy as Rich Text, Select All
- **Unsaved changes protection** — Prompts to save before closing if there are pending edits
- **Zoom controls** — `Ctrl++`, `Ctrl+-`, `Ctrl+0`, and `Ctrl+Mouse Wheel`
- **9 color themes** — Default, Nord, Solarized, Dracula, Rosé Pine, Catppuccin, Oceanic, Sunset Coral, Emerald
- **Light / Dark mode** — Per-theme toggle
- **Print support** — Optimized `@media print` CSS
- **Multi-language UI** — Spanish and English
- **Preferences persistence** — Theme, language, zoom, and last directory remembered across sessions
- **Frameless window** — Clean look with custom window controls and double-click to maximize

## Installation

### Option A: `.deb` package (recommended)

Download the latest `.deb` from [Releases](https://github.com/soyunomas/puremark/releases) and install:

```bash
sudo dpkg -i puremark_1.0.0_amd64.deb
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

Generates `puremark_1.0.0_amd64.deb` in the project directory.

## Usage

**From file manager:** Double-click any `.md` file (after installation, PureMark is the default handler).

**From terminal:**

```bash
puremark path/to/file.md
```

**Without arguments:** Opens a welcome screen — use `Ctrl+O` or **File → Open** to pick a file.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+O` | Open file |
| `Ctrl+S` | Save file |
| `Ctrl+E` | Toggle edit mode |
| `Ctrl+P` | Print |
| `Ctrl+Q` | Quit |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
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
- **Frontend:** TypeScript + [Marked.js](https://marked.js.org) + [DOMPurify](https://github.com/cure53/DOMPurify)
- **Runtime:** WebKit2GTK (Linux)

## Project Structure

```
puremark/
├── app.go              # Go backend (file I/O, dialogs)
├── main.go             # Wails app entry point
├── frontend/
│   └── src/
│       ├── main.ts     # Frontend logic (UI, editor, undo stack, i18n)
│       └── style.css   # All styles, themes, and context menu
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
