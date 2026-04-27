# PureMark — Release Notes

---

## v1.2.0 — File Management, Enhanced Editor & PDF Export

New file management capabilities, an expanded formatting toolbar, native PDF export, and immersive fullscreen mode.

### ✨ New Features

- **New file** — Create untitled documents (`Ctrl+N`) with automatic "Save as" on first save
- **Save as** — Save to a new location with `Ctrl+Shift+S` and native file dialog
- **Export as PDF** — Direct PDF generation using system browser headless mode (Chrome/Chromium/Firefox), forced light theme, no print dialog. Falls back to `window.print()` if no browser is available
- **Export as HTML** — Self-contained HTML files with inline CSS, theme colors, and syntax highlighting rules
- **Find in document** — Floating search bar opened with `Ctrl+F`, available from the Edit menu, with match highlighting in rendered view and native selection in edit mode
- **Fullscreen Zen Mode** — Hides title bar, menu bar, toolbar, and status bar in fullscreen. Configurable via Settings checkbox
- **Enhanced formatting toolbar** — Heading dropdown (H1–H4), list dropdown (bullet, numbered, task list), plus Image, Table, and Horizontal rule buttons
- **Expanded Format menu** — H1–H4, ordered list, task list, image, table, horizontal rule added to menu bar
- **Single instance** — Opening multiple `.md` files from the file manager now reuses the existing window and stacks them as tabs (Unix-domain socket IPC, `/tmp/puremark-$USER.sock`)
- **External file watcher** — When a file is changed by another editor, PureMark silently reloads clean tabs and shows a non-modal conflict banner with **Reload from disk** / **Keep my changes** for dirty tabs. Removed files trigger a toast and force "Save as" on next save (powered by `fsnotify`)

### 🛠️ Improvements

- **Shared export HTML builder** — `buildExportHTML()` used by both HTML and PDF export with consistent styling
- **Syntax highlighting in exports** — `.hljs-*` CSS rules now included in exported HTML/PDF
- **Color emoji support** — `Noto Color Emoji` in font stack for export documents
- **PDF page layout** — `@page` rules with A4 size and 14mm margins for clean PDF output
- **Editor toolbar dropdowns** — Compact grouped UI with hover dropdowns for headings and lists
- **i18n** — All new features fully translated (Spanish and English)
- **Toolbar "New" button** — Added to main toolbar for quick file creation
- **Find dialog focus handling** — In edit mode, typing in the search field no longer loses focus while results are selected in the editor
- **Per-tab scroll preservation** — Reading/editing scroll position is saved continuously and restored when switching tabs
- **Startup layout stability** — Root webview scroll is locked so startup files do not render with the header off-screen or a large blank footer area

### 📦 Packaging

- `.deb` package (v1.2.0) updated and split into WebKitGTK variants:
  - `puremark_1.2.0_amd64.deb` for `libwebkit2gtk-4.0-37` (Linux Mint 21 / Ubuntu 22.04 / Debian 12)
  - `puremark_1.2.0_amd64_webkit41.deb` for `libwebkit2gtk-4.1-0` (Linux Mint 22 / Ubuntu 24.04)
- `build-deb.sh` version bumped to 1.2.0
- `build-deb.sh` now accepts `40` or `41`, builds with the matching Wails tags, and warns if the produced binary is linked against the wrong WebKit ABI
- `Makefile` now exposes explicit targets: `build-40`, `build-41`, `dev-40`, `dev-41`, `install-40`, `install-41`, `deb-40`, `deb-41`, `deb-all`
- `make help` now lists numbered targets correctly and includes `install-files` for installing an already-built binary without recompiling

---

## v1.1.0 — UI Redesign & Pro Features

Complete UI overhaul with a structured 6-row layout, multi-tab support, syntax highlighting, and a live status bar. This release transforms PureMark from a single-file viewer into a fully featured Markdown workstation.

### ✨ New Features

- **Multi-tab interface** — Open multiple files simultaneously with per-tab state (content, mode, undo/redo, dirty flag)
- **Tab bar** — Always visible with scroll arrows, mouse wheel navigation, `+` button for quick open, and dirty indicator (●)
- **Drag & Drop** — Drop `.md` files onto the window to open them as new tabs
- **Syntax highlighting** — Code blocks rendered with highlight.js, colors adapt automatically to each theme
- **Status bar** — Displays file path, line count, file size, modification date, zoom slider, and fullscreen toggle
- **File stats from backend** — `GetFileStats()` provides live metadata (lines, size, date with smart formatting: "today/yesterday HH:MM")
- **Zoom slider** — Interactive range slider in the status bar, bidirectionally synced with all zoom controls
- **Document info dialog** — View file path, lines, words, characters, and size
- **Format menu** — Bold, Italic, Strikethrough, Heading, Quote, List, Code, Code Block, Link (with keyboard shortcuts)
- **Go menu** — Jump to start or end of document
- **Tools menu** — Word count
- **Help menu** — Keyboard shortcuts reference and About dialog
- **Multiple CLI arguments** — `puremark file1.md file2.md` opens both in tabs

### 🎨 UI Redesign

- **6-row flex layout** — Title Bar → Menu Bar → Main Toolbar → Tab Bar → Content Area → Status Bar
- **Structured menu bar** — 8 menus: File, Edit, View, Document, Format, Go, Tools, Help
- **Main toolbar** — Grouped icon buttons (Open, Save, Print | Edit, Copy | Zoom ± | Theme, Fullscreen)
- **Active tab design** — White background merged with content area, accent-colored top border, rounded top corners
- **Frameless window** — Custom title bar with classic Linux window controls (─ □ ✕)

### 🛠️ Improvements

- **Full undo/redo system** — Custom stack with debounced snapshots (native undo unreliable in WebKitGTK)
- **Context menu** — Cut, Copy, Paste, Copy as Rich Text, Select All with proper selection preservation
- **Unsaved changes protection** — Per-tab dirty detection, confirm dialog on close/quit with Save All option
- **Ctrl+A scoped to content** — Prevents selecting toolbar/menu elements in frameless mode
- **Editor fills full height** — No wasted vertical space in edit mode
- **9 color themes** — Default, Nord, Solarized, Dracula, Rosé Pine, Catppuccin, Oceanic, Sunset Coral, Emerald

### 📦 Packaging

- `.deb` package (v1.1.0) with postinst/postrm scripts
- Automatic MIME type registration for all users
- Icon cache and desktop database updates

---

## v1.0.0 — Initial Release

Native Markdown viewer and editor for Linux. Built with Wails (Go + WebKit), this version focuses on delivering a fast, distraction-free reading and editing experience with a strong emphasis on typography, usability, and native system integration.

### ✨ Highlights

- Native Linux application with `.md` file association
- Clean and elegant Markdown rendering with carefully selected typography
- Seamless toggle between reading and editing modes
- Smart inline formatting with automatic word wrapping
- Full undo/redo system with custom stack
- Rich text copy support for external applications
- Multiple themes with light and dark variants
- Built-in zoom controls and print-friendly output
- Persistent user preferences (theme, language, zoom, last directory)
- Multi-language interface (English and Spanish)

### 🧩 System Integration

- `.deb` package for easy installation
- Automatic desktop entry and icon registration
- CLI support for opening files directly from terminal

### 🎯 Goal of this Release

This initial version establishes the core experience of PureMark: a minimal, fast, and polished Markdown tool that feels native on Linux while remaining simple and focused.
