import './style.css';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { ReadFileAt, SaveFileAt, OpenFilesDialog, GetStartupPaths, GetUserHome } from '../wailsjs/go/main/App';
import { Quit, WindowMinimise, WindowToggleMaximise, WindowFullscreen, WindowUnfullscreen, OnFileDrop } from '../wailsjs/runtime/runtime';

// ─── i18n ───────────────────────────────────────────────
type Locale = 'es' | 'en';

const translations: Record<Locale, Record<string, string>> = {
  es: {
    'menu.file': 'Archivo', 'menu.file.open': 'Abrir', 'menu.file.save': 'Guardar',
    'menu.file.print': 'Imprimir', 'menu.file.settings': 'Configuración', 'menu.file.quit': 'Salir',
    'menu.edit': 'Editar', 'menu.edit.mode': 'Modo edición',
    'menu.edit.copyRich': 'Copiar como Rich Text', 'menu.edit.selectAll': 'Seleccionar todo',
    'menu.view': 'Ver', 'menu.view.zoomIn': 'Acercar', 'menu.view.zoomOut': 'Alejar',
    'menu.view.zoomReset': 'Restablecer zoom', 'menu.view.themeDark': 'Tema oscuro',
    'menu.view.themeLight': 'Tema claro', 'menu.view.fullscreen': 'Pantalla completa',
    'menu.help': 'Ayuda', 'menu.help.shortcuts': 'Atajos de teclado', 'menu.help.about': 'Acerca de',
    'empty.text': 'Abre un archivo Markdown desde el gestor de archivos<br>o arrástralo a esta ventana.',
    'toast.copied': 'Copiado al portapapeles', 'toast.copiedText': 'Copiado (solo texto)',
    'toast.saved': 'Guardado ✓', 'toast.errorOpen': 'Error al abrir archivo', 'toast.errorSave': 'Error al guardar',
    'shortcuts.title': 'Atajos de teclado', 'shortcuts.open': 'Abrir archivo', 'shortcuts.save': 'Guardar',
    'shortcuts.print': 'Imprimir', 'shortcuts.quit': 'Salir', 'shortcuts.editMode': 'Modo edición',
    'shortcuts.copyRich': 'Copiar Rich Text', 'shortcuts.zoomIn': 'Acercar', 'shortcuts.zoomOut': 'Alejar',
    'shortcuts.zoomReset': 'Restablecer zoom', 'shortcuts.fullscreen': 'Pantalla completa',
    'shortcuts.closeMenu': 'Cerrar menú / modal',
    'shortcuts.closeTab': 'Cerrar pestaña',
    'about.subtitle': 'Visor de Markdown minimalista', 'about.version': 'Versión 1.2.0',
    'about.built': 'Construido con Wails + Go',
    'settings.title': 'Configuración', 'settings.language': 'Idioma', 'settings.colorTheme': 'Tema de color',
  },
  en: {
    'menu.file': 'File', 'menu.file.open': 'Open', 'menu.file.save': 'Save',
    'menu.file.print': 'Print', 'menu.file.settings': 'Settings', 'menu.file.quit': 'Quit',
    'menu.edit': 'Edit', 'menu.edit.mode': 'Edit mode',
    'menu.edit.copyRich': 'Copy as Rich Text', 'menu.edit.selectAll': 'Select all',
    'menu.view': 'View', 'menu.view.zoomIn': 'Zoom in', 'menu.view.zoomOut': 'Zoom out',
    'menu.view.zoomReset': 'Reset zoom', 'menu.view.themeDark': 'Dark theme',
    'menu.view.themeLight': 'Light theme', 'menu.view.fullscreen': 'Fullscreen',
    'menu.help': 'Help', 'menu.help.shortcuts': 'Keyboard shortcuts', 'menu.help.about': 'About',
    'empty.text': 'Open a Markdown file from the file manager<br>or drag it to this window.',
    'toast.copied': 'Copied to clipboard', 'toast.copiedText': 'Copied (text only)',
    'toast.saved': 'Saved ✓', 'toast.errorOpen': 'Error opening file', 'toast.errorSave': 'Error saving',
    'shortcuts.title': 'Keyboard shortcuts', 'shortcuts.open': 'Open file', 'shortcuts.save': 'Save',
    'shortcuts.print': 'Print', 'shortcuts.quit': 'Quit', 'shortcuts.editMode': 'Edit mode',
    'shortcuts.copyRich': 'Copy Rich Text', 'shortcuts.zoomIn': 'Zoom in', 'shortcuts.zoomOut': 'Zoom out',
    'shortcuts.zoomReset': 'Reset zoom', 'shortcuts.fullscreen': 'Fullscreen',
    'shortcuts.closeMenu': 'Close menu / modal',
    'shortcuts.closeTab': 'Close tab',
    'about.subtitle': 'Minimalist Markdown viewer', 'about.version': 'Version 1.2.0',
    'about.built': 'Built with Wails + Go',
    'settings.title': 'Settings', 'settings.language': 'Language', 'settings.colorTheme': 'Color theme',
  },
};

function t(key: string): string {
  return translations[locale][key] || key;
}

// ─── Color Themes ───────────────────────────────────────
interface ThemeColors {
  bg: string; bgSurface: string; bgHover: string; text: string; textMuted: string;
  textHeading: string; accent: string; accentHover: string; border: string; codeColor: string;
}

interface ColorTheme { name: string; light: ThemeColors; dark: ThemeColors; }

const colorThemes: Record<string, ColorTheme> = {
  default: {
    name: 'Default',
    light: { bg:'#ffffff', bgSurface:'#f4f4f5', bgHover:'#e4e4e7', text:'#18181b', textMuted:'#71717a', textHeading:'#09090b', accent:'#6366f1', accentHover:'#4f46e5', border:'#e4e4e7', codeColor:'#7c3aed' },
    dark:  { bg:'#000000', bgSurface:'#121212', bgHover:'#1e1e1e', text:'#e4e4e7', textMuted:'#a1a1aa', textHeading:'#ffffff', accent:'#818cf8', accentHover:'#6366f1', border:'#2e2e2e', codeColor:'#c4b5fd' },
  },
  nord: {
    name: 'Nord',
    light: { bg:'#eceff4', bgSurface:'#e5e9f0', bgHover:'#d8dee9', text:'#2e3440', textMuted:'#4c566a', textHeading:'#2e3440', accent:'#5e81ac', accentHover:'#81a1c1', border:'#d8dee9', codeColor:'#b48ead' },
    dark:  { bg:'#2e3440', bgSurface:'#3b4252', bgHover:'#434c5e', text:'#d8dee9', textMuted:'#81a1c1', textHeading:'#eceff4', accent:'#88c0d0', accentHover:'#5e81ac', border:'#434c5e', codeColor:'#b48ead' },
  },
  solarized: {
    name: 'Solarized',
    light: { bg:'#fdf6e3', bgSurface:'#eee8d5', bgHover:'#e0dbc8', text:'#657b83', textMuted:'#93a1a1', textHeading:'#073642', accent:'#268bd2', accentHover:'#2aa198', border:'#eee8d5', codeColor:'#d33682' },
    dark:  { bg:'#002b36', bgSurface:'#073642', bgHover:'#0a4050', text:'#839496', textMuted:'#586e75', textHeading:'#fdf6e3', accent:'#268bd2', accentHover:'#2aa198', border:'#073642', codeColor:'#d33682' },
  },
  dracula: {
    name: 'Dracula',
    light: { bg:'#f8f8f2', bgSurface:'#f0f0ea', bgHover:'#e6e6e0', text:'#282a36', textMuted:'#6272a4', textHeading:'#282a36', accent:'#bd93f9', accentHover:'#ff79c6', border:'#e0e0da', codeColor:'#ff79c6' },
    dark:  { bg:'#282a36', bgSurface:'#343746', bgHover:'#44475a', text:'#f8f8f2', textMuted:'#6272a4', textHeading:'#f8f8f2', accent:'#bd93f9', accentHover:'#ff79c6', border:'#44475a', codeColor:'#ff79c6' },
  },
  rosepine: {
    name: 'Rosé Pine',
    light: { bg:'#faf4ed', bgSurface:'#fffaf3', bgHover:'#f2e9e1', text:'#575279', textMuted:'#9893a5', textHeading:'#575279', accent:'#d7827e', accentHover:'#b4637a', border:'#f2e9e1', codeColor:'#907aa9' },
    dark:  { bg:'#191724', bgSurface:'#1f1d2e', bgHover:'#26233a', text:'#e0def4', textMuted:'#6e6a86', textHeading:'#e0def4', accent:'#ebbcba', accentHover:'#eb6f92', border:'#26233a', codeColor:'#c4a7e7' },
  },
  catppuccin: {
    name: 'Catppuccin',
    light: { bg:'#eff1f5', bgSurface:'#e6e9ef', bgHover:'#dce0e8', text:'#4c4f69', textMuted:'#6c6f85', textHeading:'#4c4f69', accent:'#8839ef', accentHover:'#7287fd', border:'#ccd0da', codeColor:'#ea76cb' },
    dark:  { bg:'#1e1e2e', bgSurface:'#313244', bgHover:'#45475a', text:'#cdd6f4', textMuted:'#6c7086', textHeading:'#cdd6f4', accent:'#cba6f7', accentHover:'#89b4fa', border:'#45475a', codeColor:'#f5c2e7' },
  },
  oceanic: {
    name: 'Oceanic',
    light: { bg:'#ffffff', bgSurface:'#f4f4f5', bgHover:'#e4e4e7', text:'#1e293b', textMuted:'#64748b', textHeading:'#0f172a', accent:'#0ea5e9', accentHover:'#0284c7', border:'#e2e8f0', codeColor:'#8b5cf6' },
    dark:  { bg:'#000000', bgSurface:'#121212', bgHover:'#1e1e1e', text:'#e2e8f0', textMuted:'#94a3b8', textHeading:'#ffffff', accent:'#38bdf8', accentHover:'#0ea5e9', border:'#2d2d2d', codeColor:'#a78bfa' },
  },
  sunset: {
    name: 'Sunset Coral',
    light: { bg:'#ffffff', bgSurface:'#f4f4f5', bgHover:'#e4e4e7', text:'#2d1b1b', textMuted:'#785a5a', textHeading:'#1a0f0f', accent:'#f43f5e', accentHover:'#e11d48', border:'#e4e4e7', codeColor:'#d946ef' },
    dark:  { bg:'#000000', bgSurface:'#121212', bgHover:'#1e1e1e', text:'#f8ecec', textMuted:'#a38888', textHeading:'#ffffff', accent:'#fb7185', accentHover:'#f43f5e', border:'#2d2d2d', codeColor:'#f0abfc' },
  },
  emerald: {
    name: 'Emerald',
    light: { bg:'#ffffff', bgSurface:'#f4f4f5', bgHover:'#e4e4e7', text:'#14241d', textMuted:'#4a6b5d', textHeading:'#08120e', accent:'#10b981', accentHover:'#059669', border:'#e4e4e7', codeColor:'#059669' },
    dark:  { bg:'#000000', bgSurface:'#121212', bgHover:'#1e1e1e', text:'#e6f0ec', textMuted:'#82a193', textHeading:'#ffffff', accent:'#34d399', accentHover:'#10b981', border:'#2d2d2d', codeColor:'#6ee7b7' },
  }
};

function applyColorTheme(themeName: string, darkMode: 'light' | 'dark') {
  const ct = colorThemes[themeName] || colorThemes['default'];
  const c = ct[darkMode];
  const s = document.documentElement.style;
  s.setProperty('--bg', c.bg); s.setProperty('--bg-surface', c.bgSurface);
  s.setProperty('--bg-hover', c.bgHover); s.setProperty('--text', c.text);
  s.setProperty('--text-muted', c.textMuted); s.setProperty('--text-heading', c.textHeading);
  s.setProperty('--accent', c.accent); s.setProperty('--accent-hover', c.accentHover);
  s.setProperty('--border', c.border); s.setProperty('--code-color', c.codeColor);
}

// ─── Preferences ────────────────────────────────────────
interface Prefs { locale: Locale; colorTheme: string; darkMode: 'light' | 'dark'; zoomLevel: number; }

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem('puremark-prefs');
    if (raw) {
      const p = JSON.parse(raw);
      return { locale: p.locale || 'es', colorTheme: p.colorTheme || 'default', darkMode: p.darkMode || 'light', zoomLevel: p.zoomLevel || 1.0 };
    }
  } catch { /* ignore */ }
  return { locale: 'es', colorTheme: 'default', darkMode: 'light', zoomLevel: 1.0 };
}

function savePrefs() {
  localStorage.setItem('puremark-prefs', JSON.stringify({ locale, colorTheme: currentColorTheme, darkMode: theme, zoomLevel }));
}

// ─── Tab Model ──────────────────────────────────────────
interface EditorSnapshot { text: string; selStart: number; selEnd: number; }

interface Tab {
  path: string;
  name: string;
  rawContent: string;
  savedContent: string;
  mode: 'view' | 'edit';
  undoStack: EditorSnapshot[];
  redoStack: EditorSnapshot[];
  lastSnapshotTime: number;
}

let tabs: Tab[] = [];
let activeTabPath: string | null = null;

function getActiveTab(): Tab | null {
  return tabs.find(t => t.path === activeTabPath) ?? null;
}

function basename(path: string): string {
  return path.split(/[/\\]/).pop() || path;
}

function isSupportedFile(path: string): boolean {
  return /\.(md|markdown|mkd|txt)$/i.test(path);
}

let userHome = '';

function prettyPath(path: string): string {
  if (userHome && path.startsWith(userHome)) {
    return '~' + path.substring(userHome.length);
  }
  return path;
}

const SNAPSHOT_DEBOUNCE = 400;

function pushUndo(tab: Tab, snap: EditorSnapshot) {
  if (tab.undoStack.length > 0 && tab.undoStack[tab.undoStack.length - 1].text === snap.text) return;
  tab.undoStack.push(snap);
  if (tab.undoStack.length > 200) tab.undoStack.shift();
  tab.redoStack.length = 0;
}

function editorUndo() {
  const tab = getActiveTab();
  const editor = document.getElementById('editor') as HTMLTextAreaElement | null;
  if (!tab || !editor || tab.undoStack.length === 0) return;
  tab.redoStack.push({ text: editor.value, selStart: editor.selectionStart, selEnd: editor.selectionEnd });
  const snap = tab.undoStack.pop()!;
  editor.value = snap.text;
  tab.rawContent = snap.text;
  editor.setSelectionRange(snap.selStart, snap.selEnd);
}

function editorRedo() {
  const tab = getActiveTab();
  const editor = document.getElementById('editor') as HTMLTextAreaElement | null;
  if (!tab || !editor || tab.redoStack.length === 0) return;
  tab.undoStack.push({ text: editor.value, selStart: editor.selectionStart, selEnd: editor.selectionEnd });
  const snap = tab.redoStack.pop()!;
  editor.value = snap.text;
  tab.rawContent = snap.text;
  editor.setSelectionRange(snap.selStart, snap.selEnd);
}

// ─── State (global, not per-tab) ────────────────────────
const prefs = loadPrefs();
let zoomLevel = prefs.zoomLevel;
let theme: 'light' | 'dark' = prefs.darkMode;
let locale: Locale = prefs.locale;
let currentColorTheme: string = prefs.colorTheme;
let zoomTimeout: ReturnType<typeof setTimeout> | null = null;
let isFullscreen = false;
let openMenu: string | null = null;

marked.setOptions({ gfm: true, breaks: true });

const appEl = document.getElementById('app')!;

// Apply initial theme
if (theme === 'dark') document.documentElement.classList.add('dark');
applyColorTheme(currentColorTheme, theme);

// ─── Unified open flow ──────────────────────────────────
async function openPaths(paths: string[]) {
  const unique = [...new Set(paths)].filter(isSupportedFile);
  let nextActive: string | null = activeTabPath;

  for (const path of unique) {
    const existing = tabs.find(t => t.path === path);
    if (existing) {
      nextActive = existing.path;
      continue;
    }
    try {
      const content = await ReadFileAt(path);
      tabs.push({
        path,
        name: basename(path),
        rawContent: content,
        savedContent: content,
        mode: 'view',
        undoStack: [],
        redoStack: [],
        lastSnapshotTime: 0,
      });
      nextActive = path;
    } catch {
      showToast(t('toast.errorOpen'));
    }
  }

  activeTabPath = nextActive;
  render();
}

function closeTab(path: string) {
  const tab = tabs.find(t => t.path === path);
  if (!tab) return;

  if (tab.rawContent !== tab.savedContent) {
    confirmCloseTab(tab);
    return;
  }

  removeTab(path);
}

function removeTab(path: string) {
  const idx = tabs.findIndex(t => t.path === path);
  if (idx === -1) return;
  tabs.splice(idx, 1);

  if (activeTabPath === path) {
    if (tabs.length > 0) {
      activeTabPath = tabs[Math.min(idx, tabs.length - 1)].path;
    } else {
      activeTabPath = null;
    }
  }
  render();
}

function confirmCloseTab(tab: Tab) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header"><h3>${locale === 'es' ? 'Cambios sin guardar' : 'Unsaved changes'}</h3></div>
      <div class="modal-body" style="text-align:center;">
        <p style="margin-bottom:4px;font-weight:500;font-size:13px;color:var(--text);">${escapeHtml(tab.name)}</p>
        <p style="margin-bottom:16px;color:var(--text-muted);font-size:13px;">${locale === 'es' ? '¿Deseas guardar los cambios?' : 'Do you want to save changes?'}</p>
        <div style="display:flex;gap:8px;justify-content:center;">
          <button class="settings-option" id="ct-discard">${locale === 'es' ? 'Descartar' : 'Discard'}</button>
          <button class="settings-option" id="ct-cancel">${locale === 'es' ? 'Cancelar' : 'Cancel'}</button>
          <button class="settings-option active" id="ct-save">${locale === 'es' ? 'Guardar y cerrar' : 'Save & Close'}</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => { overlay.remove(); document.removeEventListener('keydown', escH); };
  const escH = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', escH);
  overlay.querySelector('#ct-discard')?.addEventListener('click', () => { close(); removeTab(tab.path); });
  overlay.querySelector('#ct-cancel')?.addEventListener('click', close);
  overlay.querySelector('#ct-save')?.addEventListener('click', async () => {
    try { await SaveFileAt(tab.path, tab.rawContent); tab.savedContent = tab.rawContent; } catch { showToast(t('toast.errorSave')); }
    close(); removeTab(tab.path);
  });
}

// ─── Render ─────────────────────────────────────────────
function render() {
  const tab = getActiveTab();
  const titleText = tab ? tab.name : 'PureMark';
  const hasFile = tab !== null;
  const mode = tab?.mode || 'view';

  appEl.innerHTML = `
    <div class="toolbar">
      <div class="menu-bar">
        <div class="menu-item">
          <button class="menu-trigger" data-menu="file">${t('menu.file')}</button>
          <div class="menu-dropdown" id="menu-file">
            <button class="menu-dropdown-item" id="mi-open">${t('menu.file.open')}<span class="shortcut">Ctrl+O</span></button>
            <button class="menu-dropdown-item" id="mi-save" ${!hasFile ? 'disabled' : ''}>${t('menu.file.save')}<span class="shortcut">Ctrl+S</span></button>
            <div class="menu-separator"></div>
            <button class="menu-dropdown-item" id="mi-print" ${!hasFile ? 'disabled' : ''}>${t('menu.file.print')}<span class="shortcut">Ctrl+P</span></button>
            <div class="menu-separator"></div>
            <button class="menu-dropdown-item" id="mi-settings">${t('menu.file.settings')}</button>
            <div class="menu-separator"></div>
            <button class="menu-dropdown-item" id="mi-quit">${t('menu.file.quit')}<span class="shortcut">Ctrl+Q</span></button>
          </div>
        </div>
        <div class="menu-item">
          <button class="menu-trigger" data-menu="edit">${t('menu.edit')}</button>
          <div class="menu-dropdown" id="menu-edit">
            <button class="menu-dropdown-item" id="mi-toggle-edit" ${!hasFile ? 'disabled' : ''}>${mode === 'edit' ? '✓ ' : ''}${t('menu.edit.mode')}<span class="shortcut">Ctrl+E</span></button>
            <div class="menu-separator"></div>
            <button class="menu-dropdown-item" id="mi-copy" ${!hasFile || mode !== 'view' ? 'disabled' : ''}>${t('menu.edit.copyRich')}<span class="shortcut">Ctrl+Shift+C</span></button>
            <button class="menu-dropdown-item" id="mi-select-all" ${!hasFile ? 'disabled' : ''}>${t('menu.edit.selectAll')}<span class="shortcut">Ctrl+A</span></button>
          </div>
        </div>
        <div class="menu-item">
          <button class="menu-trigger" data-menu="view">${t('menu.view')}</button>
          <div class="menu-dropdown" id="menu-view">
            <button class="menu-dropdown-item" id="mi-zoom-in" ${!hasFile ? 'disabled' : ''}>${t('menu.view.zoomIn')}<span class="shortcut">Ctrl++</span></button>
            <button class="menu-dropdown-item" id="mi-zoom-out" ${!hasFile ? 'disabled' : ''}>${t('menu.view.zoomOut')}<span class="shortcut">Ctrl+−</span></button>
            <button class="menu-dropdown-item" id="mi-zoom-reset" ${!hasFile ? 'disabled' : ''}>${t('menu.view.zoomReset')} (${Math.round(zoomLevel * 100)}%)<span class="shortcut">Ctrl+0</span></button>
            <div class="menu-separator"></div>
            <button class="menu-dropdown-item" id="mi-theme">${theme === 'light' ? t('menu.view.themeDark') : t('menu.view.themeLight')}</button>
            <button class="menu-dropdown-item" id="mi-fullscreen">${isFullscreen ? '✓ ' : ''}${t('menu.view.fullscreen')}<span class="shortcut">F11</span></button>
          </div>
        </div>
        <div class="menu-item">
          <button class="menu-trigger" data-menu="help">${t('menu.help')}</button>
          <div class="menu-dropdown" id="menu-help">
            <button class="menu-dropdown-item" id="mi-shortcuts">${t('menu.help.shortcuts')}</button>
            <button class="menu-dropdown-item" id="mi-about">${t('menu.help.about')}</button>
          </div>
        </div>
      </div>
      <div class="toolbar-title">${tab ? escapeHtml(prettyPath(tab.path)) : titleText}</div>
      <div class="toolbar-right">
        <button class="wc-btn" id="btn-min" title="Minimizar">─</button>
        <button class="wc-btn" id="btn-max" title="Maximizar">□</button>
        <button class="wc-btn close" id="btn-close" title="Cerrar">✕</button>
      </div>
    </div>
    ${tabs.length > 1 ? renderTabBar() : ''}
    ${tab ? renderContent(tab) : renderEmpty()}
    <div class="zoom-indicator" id="zoom-indicator">${Math.round(zoomLevel * 100)}%</div>
    <div class="toast" id="toast"></div>
  `;
  appEl.classList.toggle('has-tabs', tabs.length > 1);
  bindRenderEvents();
}

function renderTabBar(): string {
  return `<div class="tabbar">${tabs.map(tab => {
    const isActive = tab.path === activeTabPath;
    const isDirty = tab.rawContent !== tab.savedContent;
    return `<div class="tab${isActive ? ' active' : ''}" data-tab-path="${escapeAttr(tab.path)}" title="${escapeAttr(prettyPath(tab.path))}">
      <span class="tab-name">${isDirty ? '● ' : ''}${escapeHtml(tab.name)}</span>
      <button class="tab-close" data-close-path="${escapeAttr(tab.path)}" title="">✕</button>
    </div>`;
  }).join('')}</div>`;
}

function renderEmpty(): string {
  return `<div class="empty-state"><div class="empty-state-icon">📄</div><div class="empty-state-text">${t('empty.text')}</div></div>`;
}

function renderContent(tab: Tab): string {
  document.documentElement.style.setProperty('--zoom', String(zoomLevel));
  if (tab.mode === 'view') {
    const html = DOMPurify.sanitize(marked.parse(tab.rawContent) as string);
    return `<div class="container view-container"><div class="prose" id="prose-content">${html}</div></div>`;
  } else {
    return `
      <div class="container edit-container">
        <div class="editor-wrapper">
          <div class="editor-toolbar">
            <button class="et-btn" data-action="bold" title="Negrita" style="font-weight: bold; font-family: 'Times New Roman', serif;">B</button>
            <button class="et-btn" data-action="italic" title="Cursiva" style="font-style: italic; font-family: 'Times New Roman', serif;">I</button>
            <button class="et-btn" data-action="strike" title="Tachado" style="text-decoration: line-through;">S</button>
            <div class="et-divider"></div>
            <button class="et-btn" data-action="h2" title="Título 2" style="font-weight: 600;">H<sub style="font-size: 0.65em; vertical-align: sub;">2</sub></button>
            <button class="et-btn" data-action="quote" title="Cita">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
            </button>
            <button class="et-btn" data-action="list" title="Lista">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
            <div class="et-divider"></div>
            <button class="et-btn" data-action="link" title="Enlace">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </button>
            <button class="et-btn et-code" data-action="code" title="Código Inline">&lt;&gt;</button>
            <button class="et-btn et-code" data-action="codeblock" title="Bloque de Código">&lt;/&gt;</button>
          </div>
          <textarea class="editor" id="editor" spellcheck="false">${escapeHtml(tab.rawContent)}</textarea>
        </div>
      </div>
    `;
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Markdown Logic ─────────────────────────────────────
function insertMarkdown(action: string) {
  const tab = getActiveTab();
  const editor = document.getElementById('editor') as HTMLTextAreaElement;
  if (!tab || !editor) return;

  let start = editor.selectionStart;
  let end = editor.selectionEnd;
  const text = editor.value;

  if (start === end) {
    const wordChars = /[^\s]/;
    let wStart = start;
    let wEnd = end;
    while (wStart > 0 && wordChars.test(text[wStart - 1])) wStart--;
    while (wEnd < text.length && wordChars.test(text[wEnd])) wEnd++;
    if (wStart !== wEnd) { start = wStart; end = wEnd; }
  }

  const selectedText = text.substring(start, end);

  let prefix = '';
  let suffix = '';

  const defaults: Record<string, Record<string, string>> = {
    bold:      { es: 'negrita',          en: 'bold' },
    italic:    { es: 'cursiva',          en: 'italic' },
    strike:    { es: 'tachado',          en: 'strikethrough' },
    h2:        { es: 'Título 2',         en: 'Heading 2' },
    quote:     { es: 'Cita',             en: 'Quote' },
    list:      { es: 'Elemento',         en: 'Item' },
    link:      { es: 'texto del enlace', en: 'link text' },
    code:      { es: 'código',           en: 'code' },
    codeblock: { es: 'código aquí',      en: 'code here' },
  };
  const defaultText = defaults[action]?.[locale] || defaults[action]?.['es'] || '';

  switch(action) {
    case 'bold': prefix = '**'; suffix = '**'; break;
    case 'italic': prefix = '*'; suffix = '*'; break;
    case 'strike': prefix = '~~'; suffix = '~~'; break;
    case 'h2': prefix = '\n## '; break;
    case 'quote': prefix = '\n> '; break;
    case 'list': prefix = '\n- '; break;
    case 'link': prefix = '['; suffix = '](url)'; break;
    case 'code': prefix = '`'; suffix = '`'; break;
    case 'codeblock': prefix = '\n```\n'; suffix = '\n```\n'; break;
  }

  if (start === 0 && prefix.startsWith('\n')) {
    prefix = prefix.substring(1);
  }

  const replacement = selectedText ? (prefix + selectedText + suffix) : (prefix + defaultText + suffix);

  pushUndo(tab, { text: text, selStart: start, selEnd: end });

  editor.focus();
  editor.setSelectionRange(start, end);
  document.execCommand('insertText', false, replacement);
  tab.rawContent = editor.value;

  if (selectedText) {
    editor.setSelectionRange(start, start + replacement.length);
  } else {
    editor.setSelectionRange(start + prefix.length, start + prefix.length + defaultText.length);
  }
}

// ─── Render Events (rebound on each render) ─────────────
function bindRenderEvents() {
  const tab = getActiveTab();

  document.getElementById('btn-close')?.addEventListener('click', () => confirmQuit());
  document.getElementById('btn-min')?.addEventListener('click', () => WindowMinimise());
  document.getElementById('btn-max')?.addEventListener('click', () => WindowToggleMaximise());

  document.querySelector('.toolbar')?.addEventListener('dblclick', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('.menu-item') || target.closest('.toolbar-right')) return;
    WindowToggleMaximise();
  });

  // Menu triggers
  document.querySelectorAll('.menu-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const m = (e.currentTarget as HTMLElement).dataset.menu!;
      if (openMenu === m) { closeMenu(); } else { openMenuByName(m); }
    });
    trigger.addEventListener('mouseenter', (e) => {
      if (openMenu !== null) {
        const m = (e.currentTarget as HTMLElement).dataset.menu!;
        if (openMenu !== m) openMenuByName(m);
      }
    });
  });

  // Menu items
  document.getElementById('mi-open')?.addEventListener('click', () => { closeMenu(); openFileDialog(); });
  document.getElementById('mi-save')?.addEventListener('click', () => { closeMenu(); saveActiveTab(); });
  document.getElementById('mi-print')?.addEventListener('click', () => { closeMenu(); printDocument(); });
  document.getElementById('mi-settings')?.addEventListener('click', () => { closeMenu(); showSettings(); });
  document.getElementById('mi-quit')?.addEventListener('click', () => { closeMenu(); confirmQuit(); });

  document.getElementById('mi-toggle-edit')?.addEventListener('click', () => { closeMenu(); toggleMode(); });
  document.getElementById('mi-copy')?.addEventListener('click', () => { closeMenu(); copyRichText(); });
  document.getElementById('mi-select-all')?.addEventListener('click', () => { closeMenu(); selectAll(); });

  document.getElementById('mi-zoom-in')?.addEventListener('click', () => { closeMenu(); adjustZoom(0.1); });
  document.getElementById('mi-zoom-out')?.addEventListener('click', () => { closeMenu(); adjustZoom(-0.1); });
  document.getElementById('mi-zoom-reset')?.addEventListener('click', () => { closeMenu(); resetZoom(); });
  document.getElementById('mi-theme')?.addEventListener('click', () => { closeMenu(); toggleTheme(); });
  document.getElementById('mi-fullscreen')?.addEventListener('click', () => { closeMenu(); toggleFullscreen(); });

  document.getElementById('mi-shortcuts')?.addEventListener('click', () => { closeMenu(); showShortcuts(); });
  document.getElementById('mi-about')?.addEventListener('click', () => { closeMenu(); showAbout(); });

  // Tab bar events
  const tabbar = document.querySelector('.tabbar') as HTMLElement | null;

  document.querySelectorAll('.tab').forEach(tabEl => {
    tabEl.addEventListener('click', (e) => {
      const closeBtn = (e.target as HTMLElement).closest('.tab-close');
      if (closeBtn) return;
      const path = (tabEl as HTMLElement).dataset.tabPath;
      if (path && path !== activeTabPath) {
        activeTabPath = path;
        render();
      }
    });
  });

  document.querySelectorAll('.tab-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const path = (btn as HTMLElement).dataset.closePath;
      if (path) closeTab(path);
    });
  });

  // Scroll horizontal con rueda del ratón en la barra de tabs
  if (tabbar) {
    tabbar.addEventListener('wheel', (e) => {
      e.preventDefault();
      tabbar.scrollLeft += e.deltaY;
    }, { passive: false });

    // Auto-scroll a la pestaña activa
    const activeEl = tabbar.querySelector('.tab.active') as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }
  }

  // Editor-specific events
  if (tab && tab.mode === 'edit') {
    document.querySelectorAll('.et-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = (e.currentTarget as HTMLElement).dataset.action;
        if (action) insertMarkdown(action);
      });
    });

    const editor = document.getElementById('editor') as HTMLTextAreaElement | null;
    if (editor) {
      tab.undoStack.length = 0;
      tab.redoStack.length = 0;
      pushUndo(tab, { text: editor.value, selStart: 0, selEnd: 0 });

      editor.addEventListener('input', () => {
        const now = Date.now();
        if (now - tab.lastSnapshotTime > SNAPSHOT_DEBOUNCE) {
          pushUndo(tab, { text: tab.rawContent, selStart: editor.selectionStart, selEnd: editor.selectionEnd });
          tab.lastSnapshotTime = now;
        }
        tab.rawContent = editor.value;
      });
    }
  }
}

function openMenuByName(name: string) {
  closeMenu();
  openMenu = name;
  const trigger = document.querySelector(`.menu-trigger[data-menu="${name}"]`);
  const dropdown = document.getElementById(`menu-${name}`);
  if (trigger) trigger.classList.add('open');
  if (dropdown) dropdown.classList.add('visible');
}

function closeMenu() {
  openMenu = null;
  document.querySelectorAll('.menu-dropdown').forEach(d => d.classList.remove('visible'));
  document.querySelectorAll('.menu-trigger').forEach(t => t.classList.remove('open'));
}

// ─── Actions ────────────────────────────────────────────
function toggleTheme() {
  theme = theme === 'light' ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark', theme === 'dark');
  applyColorTheme(currentColorTheme, theme);
  savePrefs();
  render();
}

function adjustZoom(delta: number) {
  zoomLevel = Math.max(0.5, Math.min(3.0, Math.round((zoomLevel + delta) * 10) / 10));
  document.documentElement.style.setProperty('--zoom', String(zoomLevel));
  savePrefs();
  const indicator = document.getElementById('zoom-indicator');
  if (indicator) {
    indicator.textContent = `${Math.round(zoomLevel * 100)}%`;
    indicator.classList.add('visible');
    if (zoomTimeout) clearTimeout(zoomTimeout);
    zoomTimeout = setTimeout(() => indicator.classList.remove('visible'), 1200);
  }
  const tab = getActiveTab();
  if (tab?.mode === 'edit') {
    const editor = document.getElementById('editor') as HTMLTextAreaElement | null;
    if (editor) editor.style.fontSize = `calc(0.95rem * ${zoomLevel})`;
  }
}

function resetZoom() {
  zoomLevel = 1.0;
  document.documentElement.style.setProperty('--zoom', '1');
  savePrefs();
  const indicator = document.getElementById('zoom-indicator');
  if (indicator) {
    indicator.textContent = '100%';
    indicator.classList.add('visible');
    if (zoomTimeout) clearTimeout(zoomTimeout);
    zoomTimeout = setTimeout(() => indicator.classList.remove('visible'), 1200);
  }
}

async function openFileDialog() {
  try {
    const paths = await OpenFilesDialog();
    if (paths && paths.length > 0) {
      await openPaths(paths);
    }
  } catch { showToast(t('toast.errorOpen')); }
}

function toggleMode() {
  const tab = getActiveTab();
  if (!tab) return;
  tab.mode = tab.mode === 'view' ? 'edit' : 'view';
  render();
}

async function copyRichText() {
  const proseEl = document.getElementById('prose-content');
  if (!proseEl) return;
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([proseEl.innerHTML], { type: 'text/html' }),
        'text/plain': new Blob([proseEl.innerText], { type: 'text/plain' }),
      }),
    ]);
    showToast(t('toast.copied'));
  } catch {
    await navigator.clipboard.writeText(proseEl.innerText);
    showToast(t('toast.copiedText'));
  }
}

async function saveActiveTab() {
  const tab = getActiveTab();
  if (!tab) return;
  try {
    await SaveFileAt(tab.path, tab.rawContent);
    tab.savedContent = tab.rawContent;
    showToast(t('toast.saved'));
    // Update dirty indicator in tab bar if visible
    const tabEl = document.querySelector(`.tab[data-tab-path="${CSS.escape(tab.path)}"] .tab-name`);
    if (tabEl) {
      tabEl.textContent = tab.name;
    }
  } catch { showToast(t('toast.errorSave')); }
}

function selectAll() {
  const tab = getActiveTab();
  if (!tab) return;
  if (tab.mode === 'edit') {
    const editor = document.getElementById('editor') as HTMLTextAreaElement | null;
    if (editor) { editor.focus(); editor.select(); }
  } else {
    const prose = document.getElementById('prose-content');
    if (prose) {
      const range = document.createRange();
      range.selectNodeContents(prose);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }
}

function showToast(message: string) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function printDocument() {
  if (getActiveTab()) window.print();
}

function hasAnyUnsavedChanges(): boolean {
  return tabs.some(tab => tab.rawContent !== tab.savedContent);
}

function confirmQuit() {
  if (!hasAnyUnsavedChanges()) { Quit(); return; }
  const dirtyCount = tabs.filter(t => t.rawContent !== t.savedContent).length;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header"><h3>${locale === 'es' ? 'Cambios sin guardar' : 'Unsaved changes'}</h3></div>
      <div class="modal-body" style="text-align:center;">
        <p style="margin-bottom:16px;color:var(--text-muted);font-size:13px;">${locale === 'es' ? `${dirtyCount} archivo(s) con cambios sin guardar.` : `${dirtyCount} file(s) with unsaved changes.`}</p>
        <div style="display:flex;gap:8px;justify-content:center;">
          <button class="settings-option" id="cq-discard">${locale === 'es' ? 'Descartar' : 'Discard'}</button>
          <button class="settings-option" id="cq-cancel">${locale === 'es' ? 'Cancelar' : 'Cancel'}</button>
          <button class="settings-option active" id="cq-save">${locale === 'es' ? 'Guardar todo y salir' : 'Save All & Quit'}</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => { overlay.remove(); document.removeEventListener('keydown', escH); };
  const escH = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', escH);
  overlay.querySelector('#cq-discard')?.addEventListener('click', () => { close(); Quit(); });
  overlay.querySelector('#cq-cancel')?.addEventListener('click', close);
  overlay.querySelector('#cq-save')?.addEventListener('click', async () => {
    for (const tab of tabs) {
      if (tab.rawContent !== tab.savedContent) {
        try { await SaveFileAt(tab.path, tab.rawContent); } catch { /* best effort */ }
      }
    }
    close(); Quit();
  });
}

async function toggleFullscreen() {
  if (isFullscreen) WindowUnfullscreen(); else WindowFullscreen();
  isFullscreen = !isFullscreen;
}

// ─── Modals ─────────────────────────────────────────────
function createModal(title: string, bodyHtml: string) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal"><div class="modal-header"><h3>${title}</h3><button class="modal-close" id="modal-close">✕</button></div><div class="modal-body">${bodyHtml}</div></div>`;
  document.body.appendChild(overlay);

  const close = () => { overlay.remove(); document.removeEventListener('keydown', escHandler); };
  overlay.querySelector('#modal-close')?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  const escHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', escHandler);
  return { overlay, close };
}

function showShortcuts() {
  createModal(t('shortcuts.title'), `
    <table class="shortcuts-table">
      <tr><td><kbd>Ctrl+O</kbd></td><td>${t('shortcuts.open')}</td></tr>
      <tr><td><kbd>Ctrl+S</kbd></td><td>${t('shortcuts.save')}</td></tr>
      <tr><td><kbd>Ctrl+P</kbd></td><td>${t('shortcuts.print')}</td></tr>
      <tr><td><kbd>Ctrl+Q</kbd></td><td>${t('shortcuts.quit')}</td></tr>
      <tr><td><kbd>Ctrl+W</kbd></td><td>${t('shortcuts.closeTab')}</td></tr>
      <tr><td><kbd>Ctrl+E</kbd></td><td>${t('shortcuts.editMode')}</td></tr>
      <tr><td><kbd>Ctrl+Shift+C</kbd></td><td>${t('shortcuts.copyRich')}</td></tr>
      <tr><td><kbd>Ctrl++</kbd> o <kbd>Ctrl+Rueda</kbd></td><td>${t('shortcuts.zoomIn')}</td></tr>
      <tr><td><kbd>Ctrl+−</kbd> o <kbd>Ctrl+Rueda</kbd></td><td>${t('shortcuts.zoomOut')}</td></tr>
      <tr><td><kbd>Ctrl+0</kbd></td><td>${t('shortcuts.zoomReset')}</td></tr>
      <tr><td><kbd>F11</kbd></td><td>${t('shortcuts.fullscreen')}</td></tr>
      <tr><td><kbd>Esc</kbd></td><td>${t('shortcuts.closeMenu')}</td></tr>
    </table>`);
}

function showAbout() {
  createModal('PureMark', `
    <div style="text-align:center;">
      <p style="font-size:2rem;margin-bottom:0.5rem;">📄</p>
      <p style="font-weight:600;font-size:1.1rem;">PureMark</p>
      <p style="color:var(--text-muted);margin-top:0.25rem;">${t('about.subtitle')}</p>
      <p style="color:var(--text-muted);font-size:0.85rem;margin-top:0.5rem;">${t('about.version')}</p>
      <p style="color:var(--text-muted);font-size:0.8rem;margin-top:1rem;">${t('about.built')}</p>
    </div>`);
}

function showSettings() {
  const themeKeys = Object.keys(colorThemes);
  const { overlay, close } = createModal(t('settings.title'), `
    <div class="settings-section">
      <label class="settings-label">${t('settings.language')}</label>
      <div class="settings-row">
        <button class="settings-option${locale === 'es' ? ' active' : ''}" data-locale="es">Español</button>
        <button class="settings-option${locale === 'en' ? ' active' : ''}" data-locale="en">English</button>
      </div>
    </div>
    <div class="settings-section" style="margin-top:20px;">
      <label class="settings-label">${t('settings.colorTheme')}</label>
      <div class="theme-grid">
        ${themeKeys.map(key => {
          const ct = colorThemes[key];
          const c = ct[theme];
          return `<button class="theme-card${currentColorTheme === key ? ' active' : ''}" data-theme="${key}">
            <div class="theme-preview" style="background:${c.bg};border-color:${c.border};">
              <div class="theme-preview-bar" style="background:${c.bgSurface};"></div>
              <div class="theme-preview-line" style="background:${c.textHeading};width:60%;"></div>
              <div class="theme-preview-line" style="background:${c.text};width:85%;"></div>
              <div class="theme-preview-line" style="background:${c.text};width:70%;"></div>
              <div class="theme-preview-accent" style="background:${c.accent};width:40%;"></div>
            </div>
            <span class="theme-name">${ct.name}</span>
          </button>`;
        }).join('')}
      </div>
    </div>`);

  overlay.querySelectorAll('[data-locale]').forEach(btn => {
    btn.addEventListener('click', () => {
      locale = (btn as HTMLElement).dataset.locale as Locale;
      savePrefs(); close(); render();
    });
  });

  overlay.querySelectorAll('[data-theme]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentColorTheme = (btn as HTMLElement).dataset.theme!;
      applyColorTheme(currentColorTheme, theme);
      savePrefs();
      overlay.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// ─── Global Events (bound once) ─────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && openMenu !== null) { closeMenu(); return; }

  const tab = getActiveTab();

  if (e.ctrlKey && e.key === 'z' && tab?.mode === 'edit') { e.preventDefault(); editorUndo(); return; }
  if (e.ctrlKey && e.key === 'y' && tab?.mode === 'edit') { e.preventDefault(); editorRedo(); return; }
  if (e.ctrlKey && e.shiftKey && e.key === 'Z' && tab?.mode === 'edit') { e.preventDefault(); editorRedo(); return; }
  if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveActiveTab(); }
  if (e.ctrlKey && (e.key === '+' || e.key === '=')) { e.preventDefault(); adjustZoom(0.1); }
  if (e.ctrlKey && e.key === '-') { e.preventDefault(); adjustZoom(-0.1); }
  if (e.ctrlKey && e.key === 'e') { e.preventDefault(); toggleMode(); }
  if (e.ctrlKey && e.key === '0') { e.preventDefault(); resetZoom(); }
  if (e.ctrlKey && e.key === 'o') { e.preventDefault(); openFileDialog(); }
  if (e.ctrlKey && e.key === 'p') { e.preventDefault(); printDocument(); }
  if (e.ctrlKey && e.key === 'q') { e.preventDefault(); confirmQuit(); }
  if (e.ctrlKey && e.key === 'w') { e.preventDefault(); if (activeTabPath) closeTab(activeTabPath); }
  if (e.ctrlKey && e.shiftKey && e.key === 'C') { e.preventDefault(); if (tab && tab.mode === 'view') copyRichText(); }
  if (e.ctrlKey && e.key === 'a') {
    e.preventDefault();
    selectAll();
  }
  if (e.key === 'F11') { e.preventDefault(); toggleFullscreen(); }
});

document.addEventListener('wheel', (e) => {
  if (e.ctrlKey) {
    e.preventDefault();
    if (e.deltaY < 0) adjustZoom(0.1);
    else if (e.deltaY > 0) adjustZoom(-0.1);
  }
}, { passive: false });

// Click outside menu closes it
document.addEventListener('click', (e) => {
  if (openMenu !== null && !(e.target as HTMLElement).closest('.menu-item')) closeMenu();
});

// ─── Context Menu ───────────────────────────────────────
function removeContextMenu() {
  document.getElementById('ctx-menu')?.remove();
}

document.addEventListener('contextmenu', (e) => {
  const target = e.target as HTMLElement;
  if (!target.closest('#prose-content') && !target.closest('#editor')) return;
  e.preventDefault();
  removeContextMenu();

  const tab = getActiveTab();
  if (!tab) return;

  const sel = window.getSelection();
  const selectedText = sel ? sel.toString() : '';
  const hasSelection = selectedText.length > 0;
  const inEditor = tab.mode === 'edit';

  const editor = document.getElementById('editor') as HTMLTextAreaElement | null;
  const editorSelStart = editor?.selectionStart ?? 0;
  const editorSelEnd = editor?.selectionEnd ?? 0;
  const editorSelectedText = inEditor && editor ? editor.value.substring(editorSelStart, editorSelEnd) : '';
  const effectiveSelection = inEditor ? editorSelectedText : selectedText;
  const hasEffective = effectiveSelection.length > 0;

  const menu = document.createElement('div');
  menu.id = 'ctx-menu';
  menu.className = 'ctx-menu';
  menu.innerHTML = `
    ${inEditor ? `<button class="ctx-item" data-action="cut" ${!hasEffective ? 'disabled' : ''}>${locale === 'es' ? 'Cortar' : 'Cut'}<span class="shortcut">Ctrl+X</span></button>` : ''}
    <button class="ctx-item" data-action="copy" ${!hasEffective ? 'disabled' : ''}>${locale === 'es' ? 'Copiar' : 'Copy'}<span class="shortcut">Ctrl+C</span></button>
    ${inEditor ? `<button class="ctx-item" data-action="paste">${locale === 'es' ? 'Pegar' : 'Paste'}<span class="shortcut">Ctrl+V</span></button>` : ''}
    ${!inEditor && hasSelection ? `<button class="ctx-item" data-action="copyRich">${locale === 'es' ? 'Copiar como Rich Text' : 'Copy as Rich Text'}</button>` : ''}
    <div class="menu-separator"></div>
    <button class="ctx-item" data-action="selectAll">${locale === 'es' ? 'Seleccionar todo' : 'Select all'}<span class="shortcut">Ctrl+A</span></button>
  `;

  menu.style.left = `${Math.min(e.clientX, window.innerWidth - 220)}px`;
  menu.style.top = `${Math.min(e.clientY, window.innerHeight - 200)}px`;
  document.body.appendChild(menu);

  menu.querySelectorAll('.ctx-item').forEach(btn => {
    btn.addEventListener('mousedown', (ev) => ev.preventDefault());
    btn.addEventListener('click', async () => {
      const action = (btn as HTMLElement).dataset.action;
      removeContextMenu();
      switch(action) {
        case 'cut':
          if (inEditor && editor && hasEffective) {
            pushUndo(tab, { text: editor.value, selStart: editorSelStart, selEnd: editorSelEnd });
            await navigator.clipboard.writeText(editorSelectedText);
            editor.focus();
            editor.setSelectionRange(editorSelStart, editorSelEnd);
            document.execCommand('insertText', false, '');
            tab.rawContent = editor.value;
          }
          break;
        case 'copy':
          if (inEditor && hasEffective) {
            await navigator.clipboard.writeText(editorSelectedText);
          } else if (hasSelection) {
            await navigator.clipboard.writeText(selectedText);
          }
          break;
        case 'paste':
          if (inEditor && editor) {
            try {
              pushUndo(tab, { text: editor.value, selStart: editorSelStart, selEnd: editorSelEnd });
              const text = await navigator.clipboard.readText();
              editor.focus();
              editor.setSelectionRange(editorSelStart, editorSelEnd);
              document.execCommand('insertText', false, text);
              tab.rawContent = editor.value;
            } catch { /* clipboard denied */ }
          }
          break;
        case 'copyRich': copyRichText(); break;
        case 'selectAll': selectAll(); break;
      }
    });
  });
});

document.addEventListener('click', (e) => {
  if (!(e.target as HTMLElement).closest('#ctx-menu')) removeContextMenu();
});

// ─── Drag & Drop (Wails native) ─────────────────────────
// Prevenir que el webview navegue al archivo soltado (bug Linux/WebKitGTK)
document.addEventListener('dragover', (e) => { e.preventDefault(); });
document.addEventListener('drop', (e) => { e.preventDefault(); });

OnFileDrop((_x: number, _y: number, paths: string[]) => {
  void openPaths(paths);
}, false);

// ─── Init ───────────────────────────────────────────────
async function init() {
  try {
    userHome = await GetUserHome();
    const startupPaths = await GetStartupPaths();
    if (startupPaths && startupPaths.length > 0) {
      await openPaths(startupPaths);
      return;
    }
  } catch (err) { console.error('Init error:', err); }
  render();
}

init();
