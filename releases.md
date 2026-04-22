# PureMark — Release Notes

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
