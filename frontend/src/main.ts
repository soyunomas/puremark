import './style.css';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import { ReadFileAt, SaveFileAt, OpenFilesDialog, GetStartupPaths, GetUserHome, GetFileStats, SaveMarkdownDialog, SaveHTMLDialog, SavePDFDialog, ExportPDF, WatchFile, UnwatchFile } from '../wailsjs/go/main/App';
import { Quit, WindowMinimise, WindowToggleMaximise, WindowFullscreen, WindowUnfullscreen, OnFileDrop, EventsOn } from '../wailsjs/runtime/runtime';

// ─── i18n ───────────────────────────────────────────────
type Locale = 'es' | 'en';

const translations: Record<Locale, Record<string, string>> = {
  es: {
    'menu.file': 'Archivo', 'menu.file.new': 'Nuevo', 'menu.file.open': 'Abrir', 'menu.file.save': 'Guardar',
    'menu.file.saveAs': 'Guardar como...', 'menu.file.exportPDF': 'Exportar como PDF...',
    'menu.file.exportHTML': 'Exportar como HTML...',
    'menu.file.print': 'Imprimir', 'menu.file.settings': 'Configuración', 'menu.file.quit': 'Salir',
    'untitled': 'Sin título',
    'menu.edit': 'Editar', 'menu.edit.mode': 'Modo edición',
    'menu.edit.copyRich': 'Copiar como Rich Text', 'menu.edit.selectAll': 'Seleccionar todo',
    'menu.view': 'Ver', 'menu.view.zoomIn': 'Acercar', 'menu.view.zoomOut': 'Alejar',
    'menu.view.zoomReset': 'Restablecer zoom', 'menu.view.themeDark': 'Tema oscuro',
    'menu.view.themeLight': 'Tema claro', 'menu.view.fullscreen': 'Pantalla completa',
    'menu.document': 'Documento', 'menu.document.info': 'Información del archivo',
    'menu.format': 'Formato', 'menu.format.bold': 'Negrita', 'menu.format.italic': 'Cursiva',
    'menu.format.strike': 'Tachado', 'menu.format.heading': 'Título', 'menu.format.quote': 'Cita',
    'menu.format.list': 'Lista', 'menu.format.code': 'Código inline', 'menu.format.codeblock': 'Bloque de código',
    'menu.format.h1': 'Título 1', 'menu.format.h2': 'Título 2', 'menu.format.h3': 'Título 3', 'menu.format.h4': 'Título 4',
    'menu.format.ol': 'Lista numerada', 'menu.format.tasklist': 'Lista de tareas',
    'menu.format.hr': 'Línea horizontal', 'menu.format.image': 'Imagen', 'menu.format.table': 'Tabla',
    'menu.format.link': 'Enlace',
    'menu.go': 'Ir', 'menu.go.top': 'Inicio del documento', 'menu.go.bottom': 'Final del documento',
    'menu.tools': 'Herramientas', 'menu.tools.wordcount': 'Contar palabras',
    'toolbar.open': 'Abrir', 'toolbar.save': 'Guardar', 'toolbar.print': 'Imprimir',
    'toolbar.edit': 'Editar', 'toolbar.copy': 'Copiar', 'toolbar.theme': 'Tema', 'toolbar.fullscreen': 'Pantalla completa',
    'menu.help': 'Ayuda', 'menu.help.shortcuts': 'Atajos de teclado', 'menu.help.about': 'Acerca de',
    'empty.text': 'Abre un archivo Markdown desde el gestor de archivos<br>o arrástralo a esta ventana.',
    'toast.copied': 'Copiado al portapapeles', 'toast.copiedText': 'Copiado (solo texto)',
    'toast.saved': 'Guardado ✓', 'toast.errorOpen': 'Error al abrir archivo', 'toast.errorSave': 'Error al guardar',
    'toast.wordcount': 'palabras', 'toast.exported': 'Exportado ✓', 'toast.exportingPDF': 'Generando PDF...', 'toast.noBrowser': 'No se encontró navegador para generar PDF. Usando diálogo de impresión.',
    'toast.reloaded': 'Archivo recargado — modificado externamente',
    'toast.removed': 'El archivo ya no existe en disco',
    'banner.externalChange': 'fue modificado externamente.',
    'banner.reloadFromDisk': 'Recargar del disco',
    'banner.keepMyChanges': 'Conservar mis cambios',
    'toolbar.new': 'Nuevo',
    'shortcuts.title': 'Atajos de teclado', 'shortcuts.open': 'Abrir archivo', 'shortcuts.save': 'Guardar',
    'shortcuts.print': 'Imprimir', 'shortcuts.quit': 'Salir', 'shortcuts.editMode': 'Modo edición',
    'shortcuts.copyRich': 'Copiar Rich Text', 'shortcuts.zoomIn': 'Acercar', 'shortcuts.zoomOut': 'Alejar',
    'shortcuts.zoomReset': 'Restablecer zoom', 'shortcuts.fullscreen': 'Pantalla completa',
    'shortcuts.closeMenu': 'Cerrar menú / modal',
    'shortcuts.closeTab': 'Cerrar pestaña',
    'about.subtitle': 'Visor de Markdown minimalista', 'about.version': 'Versión 1.2.0',
    'about.built': 'Construido con Wails + Go',
    'settings.title': 'Configuración', 'settings.language': 'Idioma', 'settings.colorTheme': 'Tema de color',
    'settings.fullscreenShowUI': 'Mostrar barras en pantalla completa',
  },
  en: {
    'menu.file': 'File', 'menu.file.new': 'New', 'menu.file.open': 'Open', 'menu.file.save': 'Save',
    'menu.file.saveAs': 'Save as...', 'menu.file.exportPDF': 'Export as PDF...',
    'menu.file.exportHTML': 'Export as HTML...',
    'menu.file.print': 'Print', 'menu.file.settings': 'Settings', 'menu.file.quit': 'Quit',
    'untitled': 'Untitled',
    'menu.edit': 'Edit', 'menu.edit.mode': 'Edit mode',
    'menu.edit.copyRich': 'Copy as Rich Text', 'menu.edit.selectAll': 'Select all',
    'menu.view': 'View', 'menu.view.zoomIn': 'Zoom in', 'menu.view.zoomOut': 'Zoom out',
    'menu.view.zoomReset': 'Reset zoom', 'menu.view.themeDark': 'Dark theme',
    'menu.view.themeLight': 'Light theme', 'menu.view.fullscreen': 'Fullscreen',
    'menu.document': 'Document', 'menu.document.info': 'File information',
    'menu.format': 'Format', 'menu.format.bold': 'Bold', 'menu.format.italic': 'Italic',
    'menu.format.strike': 'Strikethrough', 'menu.format.heading': 'Heading', 'menu.format.quote': 'Quote',
    'menu.format.list': 'List', 'menu.format.code': 'Inline code', 'menu.format.codeblock': 'Code block',
    'menu.format.h1': 'Heading 1', 'menu.format.h2': 'Heading 2', 'menu.format.h3': 'Heading 3', 'menu.format.h4': 'Heading 4',
    'menu.format.ol': 'Ordered list', 'menu.format.tasklist': 'Task list',
    'menu.format.hr': 'Horizontal rule', 'menu.format.image': 'Image', 'menu.format.table': 'Table',
    'menu.format.link': 'Link',
    'menu.go': 'Go', 'menu.go.top': 'Start of document', 'menu.go.bottom': 'End of document',
    'menu.tools': 'Tools', 'menu.tools.wordcount': 'Word count',
    'toolbar.open': 'Open', 'toolbar.save': 'Save', 'toolbar.print': 'Print',
    'toolbar.edit': 'Edit', 'toolbar.copy': 'Copy', 'toolbar.theme': 'Theme', 'toolbar.fullscreen': 'Fullscreen',
    'menu.help': 'Help', 'menu.help.shortcuts': 'Keyboard shortcuts', 'menu.help.about': 'About',
    'empty.text': 'Open a Markdown file from the file manager<br>or drag it to this window.',
    'toast.copied': 'Copied to clipboard', 'toast.copiedText': 'Copied (text only)',
    'toast.saved': 'Saved ✓', 'toast.errorOpen': 'Error opening file', 'toast.errorSave': 'Error saving',
    'toast.wordcount': 'words', 'toast.exported': 'Exported ✓', 'toast.exportingPDF': 'Generating PDF...', 'toast.noBrowser': 'No browser found for PDF export. Using print dialog.',
    'toast.reloaded': 'File reloaded — modified externally',
    'toast.removed': 'File no longer exists on disk',
    'banner.externalChange': 'was modified externally.',
    'banner.reloadFromDisk': 'Reload from disk',
    'banner.keepMyChanges': 'Keep my changes',
    'toolbar.new': 'New',
    'shortcuts.title': 'Keyboard shortcuts', 'shortcuts.open': 'Open file', 'shortcuts.save': 'Save',
    'shortcuts.print': 'Print', 'shortcuts.quit': 'Quit', 'shortcuts.editMode': 'Edit mode',
    'shortcuts.copyRich': 'Copy Rich Text', 'shortcuts.zoomIn': 'Zoom in', 'shortcuts.zoomOut': 'Zoom out',
    'shortcuts.zoomReset': 'Reset zoom', 'shortcuts.fullscreen': 'Fullscreen',
    'shortcuts.closeMenu': 'Close menu / modal',
    'shortcuts.closeTab': 'Close tab',
    'about.subtitle': 'Minimalist Markdown viewer', 'about.version': 'Version 1.2.0',
    'about.built': 'Built with Wails + Go',
    'settings.title': 'Settings', 'settings.language': 'Language', 'settings.colorTheme': 'Color theme',
    'settings.fullscreenShowUI': 'Show toolbars in fullscreen',
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
    dark:  { bg:'#191919', bgSurface:'#212121', bgHover:'#2a2a2a', text:'#e4e4e7', textMuted:'#a1a1aa', textHeading:'#f5f5f5', accent:'#818cf8', accentHover:'#6366f1', border:'#333333', codeColor:'#c4b5fd' },
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
    dark:  { bg:'#191919', bgSurface:'#212121', bgHover:'#2a2a2a', text:'#e2e8f0', textMuted:'#94a3b8', textHeading:'#f5f5f5', accent:'#38bdf8', accentHover:'#0ea5e9', border:'#333333', codeColor:'#a78bfa' },
  },
  sunset: {
    name: 'Sunset Coral',
    light: { bg:'#ffffff', bgSurface:'#f4f4f5', bgHover:'#e4e4e7', text:'#2d1b1b', textMuted:'#785a5a', textHeading:'#1a0f0f', accent:'#f43f5e', accentHover:'#e11d48', border:'#e4e4e7', codeColor:'#d946ef' },
    dark:  { bg:'#191919', bgSurface:'#212121', bgHover:'#2a2a2a', text:'#f8ecec', textMuted:'#a38888', textHeading:'#f5f5f5', accent:'#fb7185', accentHover:'#f43f5e', border:'#333333', codeColor:'#f0abfc' },
  },
  emerald: {
    name: 'Emerald',
    light: { bg:'#ffffff', bgSurface:'#f4f4f5', bgHover:'#e4e4e7', text:'#14241d', textMuted:'#4a6b5d', textHeading:'#08120e', accent:'#10b981', accentHover:'#059669', border:'#e4e4e7', codeColor:'#059669' },
    dark:  { bg:'#191919', bgSurface:'#212121', bgHover:'#2a2a2a', text:'#e6f0ec', textMuted:'#82a193', textHeading:'#f5f5f5', accent:'#34d399', accentHover:'#10b981', border:'#333333', codeColor:'#6ee7b7' },
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
interface Prefs { locale: Locale; colorTheme: string; darkMode: 'light' | 'dark'; zoomLevel: number; fullscreenShowUI: boolean; }

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem('puremark-prefs');
    if (raw) {
      const p = JSON.parse(raw);
      return { locale: p.locale || 'es', colorTheme: p.colorTheme || 'default', darkMode: p.darkMode || 'light', zoomLevel: p.zoomLevel || 1.0, fullscreenShowUI: p.fullscreenShowUI ?? false };
    }
  } catch { /* ignore */ }
  return { locale: 'es', colorTheme: 'default', darkMode: 'light', zoomLevel: 1.0, fullscreenShowUI: false };
}

function savePrefs() {
  localStorage.setItem('puremark-prefs', JSON.stringify({ locale, colorTheme: currentColorTheme, darkMode: theme, zoomLevel, fullscreenShowUI }));
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
  // UI state preservation per tab
  scrollPos: number;
  selStart: number;
  selEnd: number;
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
let fullscreenShowUI: boolean = prefs.fullscreenShowUI;
let openMenu: string | null = null;
let untitledCounter = 0;

function isUntitled(tab: Tab): boolean {
  return tab.path.startsWith('untitled:');
}

function newFile() {
  untitledCounter++;
  const syntheticPath = `untitled:${untitledCounter}`;
  const name = `${t('untitled')} ${untitledCounter}`;
  tabs.push({
    path: syntheticPath,
    name,
    rawContent: '',
    savedContent: '',
    mode: 'edit',
    undoStack: [],
    redoStack: [],
    lastSnapshotTime: 0,
    scrollPos: 0,
    selStart: 0,
    selEnd: 0,
  });
  activeTabPath = syntheticPath;
  renderActive();
}

marked.setOptions({ gfm: true, breaks: true });

const renderer = new marked.Renderer();

// ─── Image href resolver ────────────────────────────────
// Convierte URLs relativas (./img.png, img.png, /abs/img.png o file://...) en
// rutas same-origin servidas por el AssetServer Go (/__local/?p=<absolute-path>).
// URLs http(s)/data se devuelven intactas.
function resolveImageHref(href: string): string {
  if (!href) return '';
  if (/^(https?:|data:|blob:)/i.test(href)) return href;
  if (/^\/__local\//.test(href)) return href;

  let abs = href;
  if (href.startsWith('file://')) {
    abs = decodeURIComponent(href.slice('file://'.length));
  } else if (href.startsWith('/')) {
    abs = href;
  } else {
    const tab = getActiveTab();
    if (!tab || isUntitled(tab)) return href;
    const baseDir = tab.path.replace(/[^/\\]+$/, '');
    abs = baseDir + href.replace(/^\.\//, '');
  }
  return '/__local/?p=' + encodeURIComponent(abs);
}

const origImageRenderer = renderer.image;
renderer.image = function (this: unknown, ...args: Parameters<typeof origImageRenderer>) {
  const token = args[0] as { href?: string; title?: string | null; text?: string };
  const newHref = resolveImageHref(token.href ?? '');
  const safeAlt = (token.text ?? '').replace(/"/g, '&quot;');
  const titleAttr = token.title ? ` title="${(token.title as string).replace(/"/g, '&quot;')}"` : '';
  return `<img src="${newHref}" alt="${safeAlt}"${titleAttr} loading="lazy" decoding="async">`;
};

const origCodeRenderer = renderer.code;
renderer.code = function (this: unknown, ...args: Parameters<typeof origCodeRenderer>) {
  const token = args[0];
  const lang = typeof token === 'object' && token !== null ? (token as { lang?: string }).lang : undefined;
  const text = typeof token === 'object' && token !== null ? (token as { text?: string }).text ?? '' : String(token);

  let highlighted: string;
  if (lang && hljs.getLanguage(lang)) {
    // Lenguaje conocido → rápido (lexer dirigido).
    highlighted = hljs.highlight(text, { language: lang }).value;
  } else if (text.length < 2000) {
    // Auto-detect SOLO en bloques pequeños — highlightAuto es O(N·M) y bloquea WebKitGTK.
    highlighted = hljs.highlightAuto(text).value;
  } else {
    // Bloques gigantes sin lenguaje → escape plano para no congelar la UI.
    highlighted = escapeHtml(text);
  }
  return `<pre><code class="hljs${lang ? ` language-${lang}` : ''}">${highlighted}</code></pre>`;
};
marked.use({ renderer });

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
        scrollPos: 0,
        selStart: 0,
        selEnd: 0,
      });
      nextActive = path;
      void WatchFile(path).catch(() => {});
    } catch {
      showToast(t('toast.errorOpen'));
    }
  }

  activeTabPath = nextActive;
  renderActive();
}

// Paths we just wrote to disk — used to ignore self-triggered fsnotify events.
const recentSelfSave = new Map<string, number>();
function markSelfSave(path: string) {
  recentSelfSave.set(path, Date.now());
}
function isRecentSelfSave(path: string): boolean {
  const t = recentSelfSave.get(path);
  if (!t) return false;
  if (Date.now() - t < 1500) return true;
  recentSelfSave.delete(path);
  return false;
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
  if (!path.startsWith('untitled:')) {
    void UnwatchFile(path).catch(() => {});
  }
  tabs.splice(idx, 1);

  if (activeTabPath === path) {
    if (tabs.length > 0) {
      activeTabPath = tabs[Math.min(idx, tabs.length - 1)].path;
    } else {
      activeTabPath = null;
    }
  }
  renderActive();
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
    try {
      if (isUntitled(tab)) {
        const newPath = await SaveMarkdownDialog(`${t('untitled')}.md`);
        if (!newPath) { close(); return; }
        await SaveFileAt(newPath, tab.rawContent);
        tab.path = newPath;
        tab.name = basename(newPath);
      } else {
        await SaveFileAt(tab.path, tab.rawContent);
      }
      tab.savedContent = tab.rawContent;
    } catch { showToast(t('toast.errorSave')); }
    close(); removeTab(tab.path);
  });
}

// ─── Tab UI state preservation ──────────────────────────
function saveCurrentTabState() {
  const tab = getActiveTab();
  if (!tab) return;

  if (tab.mode === 'edit') {
    const editor = document.getElementById('editor') as HTMLTextAreaElement | null;
    if (editor) {
      tab.selStart = editor.selectionStart;
      tab.selEnd = editor.selectionEnd;
      tab.scrollPos = editor.scrollTop;
    }
  } else {
    const contentArea = document.getElementById('content-area');
    if (contentArea) {
      tab.scrollPos = contentArea.scrollTop;
    }
  }
}

function restoreCurrentTabState() {
  const tab = getActiveTab();
  if (!tab) return;

  // requestAnimationFrame: garantizar que el DOM ya está pintado.
  requestAnimationFrame(() => {
    if (tab.mode === 'edit') {
      const editor = document.getElementById('editor') as HTMLTextAreaElement | null;
      if (editor) {
        editor.setSelectionRange(tab.selStart, tab.selEnd);
        editor.scrollTop = tab.scrollPos;
        editor.focus();
      }
    } else {
      const contentArea = document.getElementById('content-area');
      if (contentArea) {
        contentArea.scrollTop = tab.scrollPos;
      }
    }
  });
}

// ─── Render ─────────────────────────────────────────────
function render() {
  const tab = getActiveTab();
  const hasFile = tab !== null;
  const mode = tab?.mode || 'view';

  appEl.innerHTML = `
    <div id="title-bar">
      <div class="titlebar-left"></div>
      <div class="titlebar-center">PureMark</div>
      <div class="titlebar-right">
        <button class="wc-btn" id="btn-min" title="Minimizar">─</button>
        <button class="wc-btn" id="btn-max" title="Maximizar">□</button>
        <button class="wc-btn close" id="btn-close" title="Cerrar">✕</button>
      </div>
    </div>
    <div id="menu-bar">
      <div class="menu-bar-inner">
        <div class="menu-item">
          <button class="menu-trigger" data-menu="file">${t('menu.file')}</button>
          <div class="menu-dropdown" id="menu-file">
            <button class="menu-dropdown-item" id="mi-new">${t('menu.file.new')}<span class="shortcut">Ctrl+N</span></button>
            <button class="menu-dropdown-item" id="mi-open">${t('menu.file.open')}<span class="shortcut">Ctrl+O</span></button>
            <div class="menu-separator"></div>
            <button class="menu-dropdown-item" id="mi-save" ${!hasFile ? 'disabled' : ''}>${t('menu.file.save')}<span class="shortcut">Ctrl+S</span></button>
            <button class="menu-dropdown-item" id="mi-save-as" ${!hasFile ? 'disabled' : ''}>${t('menu.file.saveAs')}<span class="shortcut">Ctrl+Shift+S</span></button>
            <div class="menu-separator"></div>
            <button class="menu-dropdown-item" id="mi-export-pdf" ${!hasFile ? 'disabled' : ''}>${t('menu.file.exportPDF')}</button>
            <button class="menu-dropdown-item" id="mi-export-html" ${!hasFile ? 'disabled' : ''}>${t('menu.file.exportHTML')}</button>
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
          <button class="menu-trigger" data-menu="document">${t('menu.document')}</button>
          <div class="menu-dropdown" id="menu-document">
            <button class="menu-dropdown-item" id="mi-doc-info" ${!hasFile ? 'disabled' : ''}>${t('menu.document.info')}</button>
          </div>
        </div>
        <div class="menu-item">
          <button class="menu-trigger" data-menu="format">${t('menu.format')}</button>
          <div class="menu-dropdown" id="menu-format">
            <button class="menu-dropdown-item" id="mi-fmt-bold" ${!hasFile || mode !== 'edit' ? 'disabled' : ''}>${t('menu.format.bold')}<span class="shortcut">Ctrl+B</span></button>
            <button class="menu-dropdown-item" id="mi-fmt-italic" ${!hasFile || mode !== 'edit' ? 'disabled' : ''}>${t('menu.format.italic')}<span class="shortcut">Ctrl+I</span></button>
            <button class="menu-dropdown-item" id="mi-fmt-strike" ${!hasFile || mode !== 'edit' ? 'disabled' : ''}>${t('menu.format.strike')}</button>
            <div class="menu-separator"></div>
            <button class="menu-dropdown-item" id="mi-fmt-h1" ${!hasFile || mode !== 'edit' ? 'disabled' : ''}>${t('menu.format.h1')}</button>
            <button class="menu-dropdown-item" id="mi-fmt-h2" ${!hasFile || mode !== 'edit' ? 'disabled' : ''}>${t('menu.format.h2')}</button>
            <button class="menu-dropdown-item" id="mi-fmt-h3" ${!hasFile || mode !== 'edit' ? 'disabled' : ''}>${t('menu.format.h3')}</button>
            <button class="menu-dropdown-item" id="mi-fmt-h4" ${!hasFile || mode !== 'edit' ? 'disabled' : ''}>${t('menu.format.h4')}</button>
            <div class="menu-separator"></div>
            <button class="menu-dropdown-item" id="mi-fmt-quote" ${!hasFile || mode !== 'edit' ? 'disabled' : ''}>${t('menu.format.quote')}</button>
            <button class="menu-dropdown-item" id="mi-fmt-list" ${!hasFile || mode !== 'edit' ? 'disabled' : ''}>${t('menu.format.list')}</button>
            <button class="menu-dropdown-item" id="mi-fmt-ol" ${!hasFile || mode !== 'edit' ? 'disabled' : ''}>${t('menu.format.ol')}</button>
            <button class="menu-dropdown-item" id="mi-fmt-tasklist" ${!hasFile || mode !== 'edit' ? 'disabled' : ''}>${t('menu.format.tasklist')}</button>
            <div class="menu-separator"></div>
            <button class="menu-dropdown-item" id="mi-fmt-link" ${!hasFile || mode !== 'edit' ? 'disabled' : ''}>${t('menu.format.link')}</button>
            <button class="menu-dropdown-item" id="mi-fmt-image" ${!hasFile || mode !== 'edit' ? 'disabled' : ''}>${t('menu.format.image')}</button>
            <button class="menu-dropdown-item" id="mi-fmt-table" ${!hasFile || mode !== 'edit' ? 'disabled' : ''}>${t('menu.format.table')}</button>
            <button class="menu-dropdown-item" id="mi-fmt-hr" ${!hasFile || mode !== 'edit' ? 'disabled' : ''}>${t('menu.format.hr')}</button>
            <div class="menu-separator"></div>
            <button class="menu-dropdown-item" id="mi-fmt-code" ${!hasFile || mode !== 'edit' ? 'disabled' : ''}>${t('menu.format.code')}</button>
            <button class="menu-dropdown-item" id="mi-fmt-codeblock" ${!hasFile || mode !== 'edit' ? 'disabled' : ''}>${t('menu.format.codeblock')}</button>
          </div>
        </div>
        <div class="menu-item">
          <button class="menu-trigger" data-menu="go">${t('menu.go')}</button>
          <div class="menu-dropdown" id="menu-go">
            <button class="menu-dropdown-item" id="mi-go-top" ${!hasFile ? 'disabled' : ''}>${t('menu.go.top')}<span class="shortcut">Home</span></button>
            <button class="menu-dropdown-item" id="mi-go-bottom" ${!hasFile ? 'disabled' : ''}>${t('menu.go.bottom')}<span class="shortcut">End</span></button>
          </div>
        </div>
        <div class="menu-item">
          <button class="menu-trigger" data-menu="tools">${t('menu.tools')}</button>
          <div class="menu-dropdown" id="menu-tools">
            <button class="menu-dropdown-item" id="mi-wordcount" ${!hasFile ? 'disabled' : ''}>${t('menu.tools.wordcount')}</button>
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
    </div>
    <div id="main-toolbar">
      <button class="tb-btn" id="tb-new"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>${t('toolbar.new')}</button>
      <button class="tb-btn" id="tb-open"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>${t('toolbar.open')}</button>
      <button class="tb-btn" id="tb-save" ${!hasFile ? 'disabled' : ''}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>${t('toolbar.save')}</button>
      <button class="tb-btn" id="tb-print" ${!hasFile ? 'disabled' : ''}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>${t('toolbar.print')}</button>
      <div class="tb-sep"></div>
      <button class="tb-btn${mode === 'edit' ? ' active' : ''}" id="tb-edit" ${!hasFile ? 'disabled' : ''}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>${t('toolbar.edit')}</button>
      <button class="tb-btn" id="tb-copy" ${!hasFile || mode !== 'view' ? 'disabled' : ''}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>${t('toolbar.copy')}</button>
      <div class="tb-sep"></div>
      <button class="tb-btn tb-zoom-btn" id="tb-zoom-out" ${!hasFile ? 'disabled' : ''}>−</button>
      <span class="tb-zoom-label" id="tb-zoom-label">${Math.round(zoomLevel * 100)}%</span>
      <button class="tb-btn tb-zoom-btn" id="tb-zoom-in" ${!hasFile ? 'disabled' : ''}>+</button>
      <div class="tb-spacer"></div>
      <button class="tb-btn" id="tb-theme"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>${t('toolbar.theme')}</button>
      <button class="tb-btn" id="tb-fullscreen"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>${t('toolbar.fullscreen')}</button>
    </div>
    <div id="tab-bar">
      ${renderTabBar()}
    </div>
    <div id="content-area">
      ${tab ? renderContent(tab) : renderEmpty()}
    </div>
    <div id="status-bar">
      <div class="status-left">
        <span id="sb-path">${tab ? escapeHtml(isUntitled(tab) ? tab.name : prettyPath(tab.path)) : ''}</span>
        <span class="sb-sep">|</span>
        <span id="sb-lines">—</span>
        <span class="sb-sep">|</span>
        <span id="sb-size">—</span>
        <span class="sb-sep">|</span>
        <span id="sb-modified">—</span>
      </div>
      <div class="status-right">
        <span id="sb-zoom">${Math.round(zoomLevel * 100)}%</span>
        <input type="range" class="sb-slider" id="sb-zoom-slider" min="50" max="300" step="10" value="${Math.round(zoomLevel * 100)}">
        <button class="sb-btn" id="sb-fullscreen" title="${t('toolbar.fullscreen')}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
        </button>
      </div>
    </div>
    <div class="zoom-indicator" id="zoom-indicator">${Math.round(zoomLevel * 100)}%</div>
    <div class="toast" id="toast"></div>
  `;
  bindRenderEvents();
  updateStatusBar();
  renderConflictBanner();
  restoreCurrentTabState();
}

function renderTabBar(): string {
  return `
    <button class="tabbar-scroll tabbar-scroll-left" id="tab-scroll-left">‹</button>
    <div class="tabbar" id="tabbar-inner">${tabs.map(tab => {
      const isActive = tab.path === activeTabPath;
      const isDirty = tab.rawContent !== tab.savedContent;
      return `<div class="tab${isActive ? ' active' : ''}" data-tab-path="${escapeAttr(tab.path)}" title="${escapeAttr(prettyPath(tab.path))}">
        <span class="tab-name">${isDirty ? '● ' : ''}${escapeHtml(tab.name)}</span>
        <button class="tab-close" data-close-path="${escapeAttr(tab.path)}" title="">✕</button>
      </div>`;
    }).join('')}</div>
    <button class="tabbar-scroll tabbar-scroll-right" id="tab-scroll-right">›</button>
    <button class="tab-add" id="tab-add" title="${t('toolbar.open')}">+</button>`;
}

function renderEmpty(): string {
  return `<div class="empty-state"><div class="empty-state-icon">📄</div><div class="empty-state-text">${t('empty.text')}</div></div>`;
}

// Caché de HTML parseado por pestaña: evita re-parsear marked + DOMPurify
// en cada cambio de pestaña o re-render que no cambia rawContent.
const proseCache = new WeakMap<Tab, { src: string; html: string }>();

function getProseHTML(tab: Tab): string {
  const cached = proseCache.get(tab);
  if (cached && cached.src === tab.rawContent) return cached.html;
  const html = DOMPurify.sanitize(marked.parse(tab.rawContent) as string);
  proseCache.set(tab, { src: tab.rawContent, html });
  return html;
}

function renderContent(tab: Tab): string {
  document.documentElement.style.setProperty('--zoom', String(zoomLevel));
  if (tab.mode === 'view') {
    return `<div class="container view-container"><div class="prose" id="prose-content">${getProseHTML(tab)}</div></div>`;
  } else {
    return `
      <div class="container edit-container">
        <div class="editor-wrapper">
          <div class="editor-toolbar">
            <button class="et-btn" data-action="bold" title="${t('menu.format.bold')} (Ctrl+B)" style="font-weight: bold; font-family: 'Times New Roman', serif;">B</button>
            <button class="et-btn" data-action="italic" title="${t('menu.format.italic')} (Ctrl+I)" style="font-style: italic; font-family: 'Times New Roman', serif;">I</button>
            <button class="et-btn" data-action="strike" title="${t('menu.format.strike')}" style="text-decoration: line-through;">S</button>
            <div class="et-divider"></div>
            <div class="et-dropdown-wrap">
              <button class="et-btn et-dropdown-trigger" id="et-heading-trigger" title="${t('menu.format.heading')}" style="font-weight: 600;">H<svg width="8" height="8" viewBox="0 0 12 12" fill="currentColor" style="margin-left:1px;opacity:0.6;"><path d="M2 4l4 4 4-4z"/></svg></button>
              <div class="et-dropdown" id="et-heading-dropdown">
                <button class="et-dropdown-item" data-action="h1"><span style="font-size:16px;font-weight:700;">H1</span></button>
                <button class="et-dropdown-item" data-action="h2"><span style="font-size:14px;font-weight:600;">H2</span></button>
                <button class="et-dropdown-item" data-action="h3"><span style="font-size:13px;font-weight:600;">H3</span></button>
                <button class="et-dropdown-item" data-action="h4"><span style="font-size:12px;font-weight:500;">H4</span></button>
              </div>
            </div>
            <button class="et-btn" data-action="quote" title="${t('menu.format.quote')}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
            </button>
            <div class="et-dropdown-wrap">
              <button class="et-btn et-dropdown-trigger" id="et-list-trigger" title="${t('menu.format.list')}">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg><svg width="8" height="8" viewBox="0 0 12 12" fill="currentColor" style="margin-left:1px;opacity:0.6;"><path d="M2 4l4 4 4-4z"/></svg>
              </button>
              <div class="et-dropdown" id="et-list-dropdown">
                <button class="et-dropdown-item" data-action="list">${t('menu.format.list')}</button>
                <button class="et-dropdown-item" data-action="ol">${t('menu.format.ol')}</button>
                <button class="et-dropdown-item" data-action="tasklist">${t('menu.format.tasklist')}</button>
              </div>
            </div>
            <div class="et-divider"></div>
            <button class="et-btn" data-action="link" title="${t('menu.format.link')}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </button>
            <button class="et-btn" data-action="image" title="${t('menu.format.image')}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </button>
            <button class="et-btn" data-action="table" title="${t('menu.format.table')}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
            </button>
            <button class="et-btn" data-action="hr" title="${t('menu.format.hr')}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"/></svg>
            </button>
            <div class="et-divider"></div>
            <button class="et-btn et-code" data-action="code" title="${t('menu.format.code')}">&lt;&gt;</button>
            <button class="et-btn et-code" data-action="codeblock" title="${t('menu.format.codeblock')}">&lt;/&gt;</button>
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
    h1:        { es: 'Título 1',         en: 'Heading 1' },
    h2:        { es: 'Título 2',         en: 'Heading 2' },
    h3:        { es: 'Título 3',         en: 'Heading 3' },
    h4:        { es: 'Título 4',         en: 'Heading 4' },
    quote:     { es: 'Cita',             en: 'Quote' },
    list:      { es: 'Elemento',         en: 'Item' },
    ol:        { es: 'Elemento',         en: 'Item' },
    tasklist:  { es: 'Tarea',            en: 'Task' },
    link:      { es: 'texto del enlace', en: 'link text' },
    image:     { es: 'descripción',      en: 'description' },
    code:      { es: 'código',           en: 'code' },
    codeblock: { es: 'código aquí',      en: 'code here' },
    table:     { es: '',                 en: '' },
    hr:        { es: '',                 en: '' },
  };
  const defaultText = defaults[action]?.[locale] || defaults[action]?.['es'] || '';

  switch(action) {
    case 'bold': prefix = '**'; suffix = '**'; break;
    case 'italic': prefix = '*'; suffix = '*'; break;
    case 'strike': prefix = '~~'; suffix = '~~'; break;
    case 'h1': prefix = '\n# '; break;
    case 'h2': prefix = '\n## '; break;
    case 'h3': prefix = '\n### '; break;
    case 'h4': prefix = '\n#### '; break;
    case 'quote': prefix = '\n> '; break;
    case 'list': prefix = '\n- '; break;
    case 'ol': prefix = '\n1. '; break;
    case 'tasklist': prefix = '\n- [ ] '; break;
    case 'link': prefix = '['; suffix = '](url)'; break;
    case 'image': prefix = '!['; suffix = '](url)'; break;
    case 'code': prefix = '`'; suffix = '`'; break;
    case 'codeblock': prefix = '\n```\n'; suffix = '\n```\n'; break;
    case 'hr': prefix = '\n---\n'; break;
    case 'table': prefix = '\n'; suffix = '\n'; break;
  }

  if (action === 'table') {
    const tableTemplate = `| ${locale === 'es' ? 'Columna 1' : 'Column 1'} | ${locale === 'es' ? 'Columna 2' : 'Column 2'} | ${locale === 'es' ? 'Columna 3' : 'Column 3'} |\n|---|---|---|\n|   |   |   |\n|   |   |   |`;
    pushUndo(tab, { text: text, selStart: start, selEnd: end });
    editor.focus();
    editor.setSelectionRange(start, end);
    const insert = (start === 0 ? '' : '\n') + tableTemplate + '\n';
    document.execCommand('insertText', false, insert);
    tab.rawContent = editor.value;
    return;
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

// ─── Imperative chrome state sync (used by partial render) ─────
// Avoid re-creating Toolbar/Menu DOM. Just flip disabled / active flags.
function updateChromeStates() {
  const tab = getActiveTab();
  const hasFile = tab !== null;
  const mode = tab?.mode || 'view';

  const setDis = (id: string, dis: boolean) => {
    const el = document.getElementById(id) as HTMLButtonElement | null;
    if (el) el.disabled = dis;
  };

  // Toolbar
  setDis('tb-save', !hasFile);
  setDis('tb-print', !hasFile);
  setDis('tb-edit', !hasFile);
  setDis('tb-copy', !hasFile || mode !== 'view');
  setDis('tb-zoom-in', !hasFile);
  setDis('tb-zoom-out', !hasFile);
  document.getElementById('tb-edit')?.classList.toggle('active', mode === 'edit');

  // File menu
  ['mi-save', 'mi-save-as', 'mi-export-pdf', 'mi-export-html', 'mi-print']
    .forEach(id => setDis(id, !hasFile));

  // Edit menu (with checkmark refresh on toggle-edit)
  setDis('mi-toggle-edit', !hasFile);
  setDis('mi-copy', !hasFile || mode !== 'view');
  setDis('mi-select-all', !hasFile);
  const miToggleEdit = document.getElementById('mi-toggle-edit');
  if (miToggleEdit) {
    miToggleEdit.innerHTML = `${mode === 'edit' ? '✓ ' : ''}${t('menu.edit.mode')}<span class="shortcut">Ctrl+E</span>`;
  }

  // View / Doc / Go / Tools
  ['mi-zoom-in', 'mi-zoom-out', 'mi-zoom-reset', 'mi-doc-info',
    'mi-go-top', 'mi-go-bottom', 'mi-wordcount']
    .forEach(id => setDis(id, !hasFile));

  // Format menu
  ['mi-fmt-bold', 'mi-fmt-italic', 'mi-fmt-strike', 'mi-fmt-h1', 'mi-fmt-h2', 'mi-fmt-h3', 'mi-fmt-h4',
    'mi-fmt-quote', 'mi-fmt-list', 'mi-fmt-ol', 'mi-fmt-tasklist', 'mi-fmt-link', 'mi-fmt-image',
    'mi-fmt-table', 'mi-fmt-hr', 'mi-fmt-code', 'mi-fmt-codeblock']
    .forEach(id => setDis(id, !hasFile || mode !== 'edit'));

  // Status bar path
  const sbPath = document.getElementById('sb-path');
  if (sbPath) sbPath.textContent = tab ? (isUntitled(tab) ? tab.name : prettyPath(tab.path)) : '';
}

// Partial render: solo actualiza tab-bar y content-area sin rebobinar la chrome.
// Esto evita re-parsear miles de nodos del menú/toolbar en cada cambio de pestaña.
//
// Importante: NO reemplazamos el `.view-container` / `.edit-container` si el modo
// no ha cambiado — solo intercambiamos el HTML interno del `.prose` o el `value`
// del editor. Así evitamos:
//   1) re-disparar la animación `fadeIn` (que crea compositing layers nuevas y
//      en WebKitGTK deja fantasmas de la capa previa al cambiar scroll).
//   2) crear/destruir nodos pesados innecesariamente.
function renderActive() {
  const tab = getActiveTab();
  const tabBarEl = document.getElementById('tab-bar');
  const contentEl = document.getElementById('content-area');
  if (!tabBarEl || !contentEl) {
    // Aún no hay shell montada — caer en render completo.
    render();
    return;
  }

  tabBarEl.innerHTML = renderTabBar();

  // Intercambio in-place cuando el modo del contenedor coincide con el de la pestaña.
  if (tab) {
    document.documentElement.style.setProperty('--zoom', String(zoomLevel));
    const proseEl = contentEl.querySelector('#prose-content') as HTMLElement | null;
    const editorEl = contentEl.querySelector('#editor') as HTMLTextAreaElement | null;

    if (tab.mode === 'view' && proseEl) {
      const fresh = getProseHTML(tab);
      if (proseEl.innerHTML !== fresh) proseEl.innerHTML = fresh;
    } else if (tab.mode === 'edit' && editorEl) {
      if (editorEl.value !== tab.rawContent) editorEl.value = tab.rawContent;
    } else {
      // Cambio real de modo (view ↔ edit) o primer montaje del contenido.
      contentEl.innerHTML = renderContent(tab);
    }
  } else {
    contentEl.innerHTML = renderEmpty();
  }

  updateChromeStates();
  bindTabBarEvents();
  bindContentEvents();
  updateStatusBar();
  renderConflictBanner();
  restoreCurrentTabState();
}

// ─── Render Events (rebound on each render) ─────────────
function bindRenderEvents() {
  document.getElementById('btn-close')?.addEventListener('click', () => confirmQuit());
  document.getElementById('btn-min')?.addEventListener('click', () => WindowMinimise());
  document.getElementById('btn-max')?.addEventListener('click', () => WindowToggleMaximise());

  document.getElementById('title-bar')?.addEventListener('dblclick', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('.titlebar-right')) return;
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
  document.getElementById('mi-new')?.addEventListener('click', () => { closeMenu(); newFile(); });
  document.getElementById('mi-open')?.addEventListener('click', () => { closeMenu(); openFileDialog(); });
  document.getElementById('mi-save')?.addEventListener('click', () => { closeMenu(); saveActiveTab(); });
  document.getElementById('mi-save-as')?.addEventListener('click', () => { closeMenu(); saveAsActiveTab(); });
  document.getElementById('mi-export-pdf')?.addEventListener('click', () => { closeMenu(); exportPDF(); });
  document.getElementById('mi-export-html')?.addEventListener('click', () => { closeMenu(); exportHTML(); });
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

  // Document menu
  document.getElementById('mi-doc-info')?.addEventListener('click', () => { closeMenu(); showDocumentInfo(); });

  // Format menu
  document.getElementById('mi-fmt-bold')?.addEventListener('click', () => { closeMenu(); insertMarkdown('bold'); });
  document.getElementById('mi-fmt-italic')?.addEventListener('click', () => { closeMenu(); insertMarkdown('italic'); });
  document.getElementById('mi-fmt-strike')?.addEventListener('click', () => { closeMenu(); insertMarkdown('strike'); });
  document.getElementById('mi-fmt-h1')?.addEventListener('click', () => { closeMenu(); insertMarkdown('h1'); });
  document.getElementById('mi-fmt-h2')?.addEventListener('click', () => { closeMenu(); insertMarkdown('h2'); });
  document.getElementById('mi-fmt-h3')?.addEventListener('click', () => { closeMenu(); insertMarkdown('h3'); });
  document.getElementById('mi-fmt-h4')?.addEventListener('click', () => { closeMenu(); insertMarkdown('h4'); });
  document.getElementById('mi-fmt-quote')?.addEventListener('click', () => { closeMenu(); insertMarkdown('quote'); });
  document.getElementById('mi-fmt-list')?.addEventListener('click', () => { closeMenu(); insertMarkdown('list'); });
  document.getElementById('mi-fmt-ol')?.addEventListener('click', () => { closeMenu(); insertMarkdown('ol'); });
  document.getElementById('mi-fmt-tasklist')?.addEventListener('click', () => { closeMenu(); insertMarkdown('tasklist'); });
  document.getElementById('mi-fmt-link')?.addEventListener('click', () => { closeMenu(); insertMarkdown('link'); });
  document.getElementById('mi-fmt-image')?.addEventListener('click', () => { closeMenu(); insertMarkdown('image'); });
  document.getElementById('mi-fmt-table')?.addEventListener('click', () => { closeMenu(); insertMarkdown('table'); });
  document.getElementById('mi-fmt-hr')?.addEventListener('click', () => { closeMenu(); insertMarkdown('hr'); });
  document.getElementById('mi-fmt-code')?.addEventListener('click', () => { closeMenu(); insertMarkdown('code'); });
  document.getElementById('mi-fmt-codeblock')?.addEventListener('click', () => { closeMenu(); insertMarkdown('codeblock'); });

  // Go menu
  document.getElementById('mi-go-top')?.addEventListener('click', () => { closeMenu(); goToPosition('top'); });
  document.getElementById('mi-go-bottom')?.addEventListener('click', () => { closeMenu(); goToPosition('bottom'); });

  // Tools menu
  document.getElementById('mi-wordcount')?.addEventListener('click', () => { closeMenu(); showWordCount(); });

  document.getElementById('mi-shortcuts')?.addEventListener('click', () => { closeMenu(); showShortcuts(); });
  document.getElementById('mi-about')?.addEventListener('click', () => { closeMenu(); showAbout(); });

  // Main toolbar buttons
  document.getElementById('tb-new')?.addEventListener('click', () => newFile());
  document.getElementById('tb-open')?.addEventListener('click', () => openFileDialog());
  document.getElementById('tb-save')?.addEventListener('click', () => saveActiveTab());
  document.getElementById('tb-print')?.addEventListener('click', () => printDocument());
  document.getElementById('tb-edit')?.addEventListener('click', () => toggleMode());
  document.getElementById('tb-copy')?.addEventListener('click', () => copyRichText());
  document.getElementById('tb-zoom-in')?.addEventListener('click', () => adjustZoom(0.1));
  document.getElementById('tb-zoom-out')?.addEventListener('click', () => adjustZoom(-0.1));
  document.getElementById('tb-theme')?.addEventListener('click', () => toggleTheme());
  document.getElementById('tb-fullscreen')?.addEventListener('click', () => toggleFullscreen());

  // Tab add button
  document.getElementById('tab-add')?.addEventListener('click', () => openFileDialog());

  // Status bar
  const sbSlider = document.getElementById('sb-zoom-slider') as HTMLInputElement | null;
  if (sbSlider) {
    sbSlider.addEventListener('input', () => {
      zoomLevel = parseInt(sbSlider.value) / 100;
      document.documentElement.style.setProperty('--zoom', String(zoomLevel));
      savePrefs();
      updateZoomUI();
      const sbZoom = document.getElementById('sb-zoom');
      if (sbZoom) sbZoom.textContent = `${Math.round(zoomLevel * 100)}%`;
      const activeTab = getActiveTab();
      if (activeTab?.mode === 'edit') {
        const editor = document.getElementById('editor') as HTMLTextAreaElement | null;
        if (editor) editor.style.fontSize = `calc(0.95rem * ${zoomLevel})`;
      }
    });
  }
  document.getElementById('sb-fullscreen')?.addEventListener('click', () => toggleFullscreen());

  // Tab bar + content events (also rebound by renderActive)
  bindTabBarEvents();
  bindContentEvents();
}

// Tab bar event binding (rebound after partial renders since tab nodes are recreated).
function bindTabBarEvents() {
  const tabbar = document.getElementById('tabbar-inner') as HTMLElement | null;

  document.querySelectorAll('.tab').forEach(tabEl => {
    tabEl.addEventListener('click', (e) => {
      const closeBtn = (e.target as HTMLElement).closest('.tab-close');
      if (closeBtn) return;
      const path = (tabEl as HTMLElement).dataset.tabPath;
      if (path && path !== activeTabPath) {
        saveCurrentTabState();
        activeTabPath = path;
        renderActive();
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

  // Tab scroll arrows
  if (tabbar) {
    const scrollLeft = document.getElementById('tab-scroll-left');
    const scrollRight = document.getElementById('tab-scroll-right');

    const updateScrollArrows = () => {
      const hasOverflow = tabbar.scrollWidth > tabbar.clientWidth;
      const canScrollLeft = tabbar.scrollLeft > 0;
      const canScrollRight = tabbar.scrollLeft + tabbar.clientWidth < tabbar.scrollWidth - 1;
      scrollLeft?.classList.toggle('visible', hasOverflow);
      scrollRight?.classList.toggle('visible', hasOverflow);
      scrollLeft?.classList.toggle('disabled', !canScrollLeft);
      scrollRight?.classList.toggle('disabled', !canScrollRight);
    };

    scrollLeft?.addEventListener('click', () => {
      if (tabbar.scrollLeft > 0) tabbar.scrollBy({ left: -200, behavior: 'smooth' });
    });
    scrollRight?.addEventListener('click', () => {
      if (tabbar.scrollLeft + tabbar.clientWidth < tabbar.scrollWidth - 1) tabbar.scrollBy({ left: 200, behavior: 'smooth' });
    });

    tabbar.addEventListener('scroll', updateScrollArrows);
    tabbar.addEventListener('wheel', (e) => {
      e.preventDefault();
      tabbar.scrollLeft += e.deltaY;
    }, { passive: false });

    // Auto-scroll a la pestaña activa
    const activeEl = tabbar.querySelector('.tab.active') as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }

    // Evaluar visibilidad inicial tras layout
    requestAnimationFrame(updateScrollArrows);
  }
}

// Content (editor + editor-toolbar) event binding.
function bindContentEvents() {
  const tab = getActiveTab();
  if (!tab || tab.mode !== 'edit') return;

  // Direct action buttons (not dropdown triggers)
  document.querySelectorAll('.et-btn:not(.et-dropdown-trigger)').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const action = (e.currentTarget as HTMLElement).dataset.action;
      if (action) insertMarkdown(action);
    });
  });

  // Dropdown items inside editor toolbar
  document.querySelectorAll('.et-dropdown-item').forEach(btn => {
    btn.addEventListener('mousedown', (e) => e.preventDefault());
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const action = (e.currentTarget as HTMLElement).dataset.action;
      document.querySelectorAll('.et-dropdown').forEach(d => d.classList.remove('visible'));
      if (action) insertMarkdown(action);
    });
  });

  // Dropdown triggers
  document.querySelectorAll('.et-dropdown-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const wrap = (e.currentTarget as HTMLElement).closest('.et-dropdown-wrap');
      const dropdown = wrap?.querySelector('.et-dropdown');
      if (!dropdown) return;
      const wasVisible = dropdown.classList.contains('visible');
      document.querySelectorAll('.et-dropdown').forEach(d => d.classList.remove('visible'));
      if (!wasVisible) dropdown.classList.add('visible');
    });
  });

  const editor = document.getElementById('editor') as HTMLTextAreaElement | null;
  if (editor) {
    if (tab.undoStack.length === 0) {
      pushUndo(tab, { text: editor.value, selStart: 0, selEnd: 0 });
    }

    editor.addEventListener('input', () => {
      const now = Date.now();
      if (now - tab.lastSnapshotTime > SNAPSHOT_DEBOUNCE) {
        pushUndo(tab, { text: tab.rawContent, selStart: editor.selectionStart, selEnd: editor.selectionEnd });
        tab.lastSnapshotTime = now;
      }
      tab.rawContent = editor.value;
    });

    // Close editor dropdowns when clicking editor area
    editor.addEventListener('click', () => {
      document.querySelectorAll('.et-dropdown').forEach(d => d.classList.remove('visible'));
    });
  }
}

async function updateStatusBar() {
  const tab = getActiveTab();
  if (!tab) return;
  if (isUntitled(tab)) return;
  try {
    const stats = await GetFileStats(tab.path);
    if (!stats) return;
    const el = (id: string) => document.getElementById(id);
    const sbLines = el('sb-lines');
    const sbSize = el('sb-size');
    const sbMod = el('sb-modified');
    if (sbLines) sbLines.textContent = `${stats.lines} ${locale === 'es' ? 'líneas' : 'lines'}`;
    if (sbSize) sbSize.textContent = stats.sizeKB;
    if (sbMod) sbMod.textContent = stats.modifiedDate;
  } catch { /* ignore */ }
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

function updateZoomUI() {
  const pct = `${Math.round(zoomLevel * 100)}%`;
  const indicator = document.getElementById('zoom-indicator');
  if (indicator) {
    indicator.textContent = pct;
    indicator.classList.add('visible');
    if (zoomTimeout) clearTimeout(zoomTimeout);
    zoomTimeout = setTimeout(() => indicator.classList.remove('visible'), 1200);
  }
  const tbLabel = document.getElementById('tb-zoom-label');
  if (tbLabel) tbLabel.textContent = pct;
  const sbZoom = document.getElementById('sb-zoom');
  if (sbZoom) sbZoom.textContent = pct;
  const sbSlider = document.getElementById('sb-zoom-slider') as HTMLInputElement | null;
  if (sbSlider) sbSlider.value = String(Math.round(zoomLevel * 100));
}

function adjustZoom(delta: number) {
  zoomLevel = Math.max(0.5, Math.min(3.0, Math.round((zoomLevel + delta) * 10) / 10));
  document.documentElement.style.setProperty('--zoom', String(zoomLevel));
  savePrefs();
  updateZoomUI();
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
  updateZoomUI();
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
  saveCurrentTabState();
  tab.mode = tab.mode === 'view' ? 'edit' : 'view';
  renderActive();
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
  if (isUntitled(tab)) {
    await saveAsActiveTab();
    return;
  }
  try {
    markSelfSave(tab.path);
    await SaveFileAt(tab.path, tab.rawContent);
    tab.savedContent = tab.rawContent;
    showToast(t('toast.saved'));
    const tabEl = document.querySelector(`.tab[data-tab-path="${CSS.escape(tab.path)}"] .tab-name`);
    if (tabEl) tabEl.textContent = tab.name;
  } catch { showToast(t('toast.errorSave')); }
}

async function saveAsActiveTab() {
  const tab = getActiveTab();
  if (!tab) return;
  try {
    const defaultName = isUntitled(tab) ? `${t('untitled')}.md` : tab.name;
    const newPath = await SaveMarkdownDialog(defaultName);
    if (!newPath) return;
    markSelfSave(newPath);
    await SaveFileAt(newPath, tab.rawContent);
    const oldPath = tab.path;
    if (!oldPath.startsWith('untitled:') && oldPath !== newPath) {
      void UnwatchFile(oldPath).catch(() => {});
    }
    tab.path = newPath;
    tab.name = basename(newPath);
    tab.savedContent = tab.rawContent;
    if (activeTabPath === oldPath) activeTabPath = newPath;
    void WatchFile(newPath).catch(() => {});
    showToast(t('toast.saved'));
    renderActive();
  } catch { showToast(t('toast.errorSave')); }
}

function buildExportHTML(tab: Tab, opts: { forceLight?: boolean; forPDF?: boolean } = {}): string {
  const renderedHTML = DOMPurify.sanitize(marked.parse(tab.rawContent) as string);
  const ct = colorThemes[opts.forceLight ? 'default' : currentColorTheme] || colorThemes['default'];
  const c = opts.forceLight ? ct.light : ct[theme];

  const pdfPageCSS = opts.forPDF ? `
@page { size: A4; margin: 14mm; }
html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }` : '';

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(tab.name)}</title>
<style>
body { max-width: 48rem; margin: 2rem auto; padding: 0 1.5rem; background: ${c.bg}; color: ${c.text}; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Noto Color Emoji', sans-serif; font-size: 16px; line-height: 1.75; }
h1, h2, h3, h4, h5, h6 { color: ${c.textHeading}; font-weight: 600; line-height: 1.3; margin-top: 2em; margin-bottom: 0.75em; }
h1 { font-size: 2em; margin-top: 0; } h2 { font-size: 1.5em; border-bottom: 1px solid ${c.border}; padding-bottom: 0.3em; } h3 { font-size: 1.25em; }
p { margin-bottom: 1.25em; }
a { color: ${c.accent}; text-decoration: none; } a:hover { text-decoration: underline; }
code { font-family: 'JetBrains Mono', 'Fira Code', monospace; background: ${c.bgSurface}; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.875em; color: ${c.codeColor}; }
pre { background: ${c.bgSurface}; padding: 1em; border-radius: 8px; overflow-x: auto; border: 1px solid ${c.border}; margin-bottom: 1.5em; }
pre code { background: none; padding: 0; color: ${c.text}; }
blockquote { border-left: 3px solid ${c.accent}; padding: 0.5em 1em; margin: 1.5em 0; background: ${c.bgSurface}; border-radius: 0 6px 6px 0; color: ${c.textMuted}; }
table { width: 100%; border-collapse: collapse; margin: 1.5em 0; } th, td { padding: 0.5em 1em; border: 1px solid ${c.border}; text-align: left; }
th { background: ${c.bgSurface}; font-weight: 600; color: ${c.textHeading}; }
img { max-width: 100%; border-radius: 8px; }
ul, ol { padding-left: 1.5em; margin-bottom: 1.25em; }
li { margin-bottom: 0.25em; }
hr { border: none; border-top: 1px solid ${c.border}; margin: 2em 0; }
.hljs-keyword, .hljs-selector-tag, .hljs-built_in, .hljs-name, .hljs-tag { color: ${c.accent}; }
.hljs-string, .hljs-title, .hljs-section, .hljs-attribute, .hljs-literal, .hljs-template-tag, .hljs-template-variable, .hljs-type { color: ${c.codeColor}; }
.hljs-number, .hljs-regexp, .hljs-symbol, .hljs-bullet, .hljs-link { color: ${c.accentHover}; }
.hljs-comment, .hljs-doctag, .hljs-meta { color: ${c.textMuted}; font-style: italic; }
.hljs-deletion { color: #ef4444; } .hljs-addition { color: #22c55e; }
.hljs-emphasis { font-style: italic; } .hljs-strong { font-weight: 700; }
${pdfPageCSS}
</style>
</head>
<body>${renderedHTML}</body>
</html>`;
}

async function exportHTML() {
  const tab = getActiveTab();
  if (!tab) return;
  try {
    const htmlName = (isUntitled(tab) ? t('untitled') : tab.name.replace(/\.(md|markdown|mkd|txt)$/i, '')) + '.html';
    const savePath = await SaveHTMLDialog(htmlName);
    if (!savePath) return;
    const fullHTML = buildExportHTML(tab);
    await SaveFileAt(savePath, fullHTML);
    showToast(t('toast.exported'));
  } catch { showToast(t('toast.errorSave')); }
}

async function exportPDF() {
  const tab = getActiveTab();
  if (!tab) return;
  try {
    const pdfName = (isUntitled(tab) ? t('untitled') : tab.name.replace(/\.(md|markdown|mkd|txt)$/i, '')) + '.pdf';
    const savePath = await SavePDFDialog(pdfName);
    if (!savePath) return;
    showToast(t('toast.exportingPDF'));
    const html = buildExportHTML(tab, { forceLight: true, forPDF: true });
    await ExportPDF(savePath, html);
    showToast(t('toast.exported'));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('no_browser')) {
      showToast(t('toast.noBrowser'));
      window.print();
    } else {
      showToast(t('toast.errorSave'));
    }
  }
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
        try {
          if (isUntitled(tab)) {
            const newPath = await SaveMarkdownDialog(`${t('untitled')}.md`);
            if (!newPath) continue;
            await SaveFileAt(newPath, tab.rawContent);
          } else {
            await SaveFileAt(tab.path, tab.rawContent);
          }
        } catch { /* best effort */ }
      }
    }
    close(); Quit();
  });
}

async function toggleFullscreen() {
  if (isFullscreen) {
    WindowUnfullscreen();
    isFullscreen = false;
    appEl.classList.remove('fullscreen-zen');
  } else {
    WindowFullscreen();
    isFullscreen = true;
    if (!fullscreenShowUI) appEl.classList.add('fullscreen-zen');
  }
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

function showDocumentInfo() {
  const tab = getActiveTab();
  if (!tab) return;
  const lines = tab.rawContent.split('\n').length;
  const words = tab.rawContent.trim() ? tab.rawContent.trim().split(/\s+/).length : 0;
  const chars = tab.rawContent.length;
  const sizeBytes = new TextEncoder().encode(tab.rawContent).length;
  const sizeStr = sizeBytes < 1024 ? `${sizeBytes} B` : `${(sizeBytes / 1024).toFixed(1)} KB`;
  createModal(t('menu.document.info'), `
    <table class="shortcuts-table">
      <tr><td style="color:var(--text-muted)">${locale === 'es' ? 'Ruta' : 'Path'}</td><td style="font-family:var(--font-mono);font-size:12px;">${escapeHtml(tab.path)}</td></tr>
      <tr><td style="color:var(--text-muted)">${locale === 'es' ? 'Líneas' : 'Lines'}</td><td>${lines}</td></tr>
      <tr><td style="color:var(--text-muted)">${locale === 'es' ? 'Palabras' : 'Words'}</td><td>${words}</td></tr>
      <tr><td style="color:var(--text-muted)">${locale === 'es' ? 'Caracteres' : 'Characters'}</td><td>${chars}</td></tr>
      <tr><td style="color:var(--text-muted)">${locale === 'es' ? 'Tamaño' : 'Size'}</td><td>${sizeStr}</td></tr>
    </table>`);
}

function goToPosition(pos: 'top' | 'bottom') {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) return;
  const tab = getActiveTab();
  if (tab?.mode === 'edit') {
    const editor = document.getElementById('editor') as HTMLTextAreaElement | null;
    if (editor) {
      if (pos === 'top') { editor.setSelectionRange(0, 0); editor.scrollTop = 0; }
      else { editor.setSelectionRange(editor.value.length, editor.value.length); editor.scrollTop = editor.scrollHeight; }
      editor.focus();
    }
  } else {
    if (pos === 'top') contentArea.scrollTop = 0;
    else contentArea.scrollTop = contentArea.scrollHeight;
  }
}

function showWordCount() {
  const tab = getActiveTab();
  if (!tab) return;
  const words = tab.rawContent.trim() ? tab.rawContent.trim().split(/\s+/).length : 0;
  showToast(`${words} ${t('toast.wordcount')}`);
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
    </div>
    <div class="settings-section" style="margin-top:20px;">
      <label class="settings-label" style="display:flex;align-items:center;gap:8px;cursor:pointer;">
        <input type="checkbox" id="settings-fs-ui" ${fullscreenShowUI ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--accent);cursor:pointer;">
        ${t('settings.fullscreenShowUI')}
      </label>
    </div>`);

  overlay.querySelector('#settings-fs-ui')?.addEventListener('change', (e) => {
    fullscreenShowUI = (e.target as HTMLInputElement).checked;
    savePrefs();
    if (isFullscreen) {
      appEl.classList.toggle('fullscreen-zen', !fullscreenShowUI);
    }
  });

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
  if (e.key === 'Escape' && isFullscreen) { toggleFullscreen(); return; }
  if (e.key === 'Escape' && openMenu !== null) { closeMenu(); return; }

  const tab = getActiveTab();

  if (e.ctrlKey && e.key === 'z' && tab?.mode === 'edit') { e.preventDefault(); editorUndo(); return; }
  if (e.ctrlKey && e.key === 'y' && tab?.mode === 'edit') { e.preventDefault(); editorRedo(); return; }
  if (e.ctrlKey && e.shiftKey && e.key === 'Z' && tab?.mode === 'edit') { e.preventDefault(); editorRedo(); return; }
  if (e.ctrlKey && e.key === 'b' && tab?.mode === 'edit') { e.preventDefault(); insertMarkdown('bold'); return; }
  if (e.ctrlKey && e.key === 'i' && tab?.mode === 'edit') { e.preventDefault(); insertMarkdown('italic'); return; }
  if (e.ctrlKey && e.shiftKey && e.key === 'S') { e.preventDefault(); saveAsActiveTab(); return; }
  if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveActiveTab(); }
  if (e.ctrlKey && e.key === 'n') { e.preventDefault(); newFile(); }
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

// Click outside menu/dropdown closes it
document.addEventListener('click', (e) => {
  if (openMenu !== null && !(e.target as HTMLElement).closest('.menu-item')) closeMenu();
  if (!(e.target as HTMLElement).closest('.et-dropdown-wrap')) {
    document.querySelectorAll('.et-dropdown').forEach(d => d.classList.remove('visible'));
  }
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

  const menuWidth = 220;
  const menuHeight = 200;
  const posX = Math.min(e.clientX, window.innerWidth - menuWidth);
  const posY = Math.min(e.clientY, window.innerHeight - menuHeight);
  menu.style.left = `${posX}px`;
  menu.style.top = `${posY}px`;
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

// ─── Single-instance & File-watcher events ──────────────
EventsOn('open-paths', (paths: string[]) => {
  if (Array.isArray(paths) && paths.length > 0) {
    void openPaths(paths);
  }
});

// Conflict banners pending user resolution: tabPath -> 1
const pendingConflicts = new Set<string>();

async function handleExternalChange(path: string, event: string) {
  if (isRecentSelfSave(path)) return;
  const tab = tabs.find(t => t.path === path);
  if (!tab) return;

  if (event === 'removed') {
    showToast(t('toast.removed'));
    if (tab.savedContent === tab.rawContent) {
      // Force dirty so next save uses Save-As
      tab.savedContent = tab.rawContent + '\u0000';
    }
    renderActive();
    return;
  }

  // Modified
  const isDirty = tab.rawContent !== tab.savedContent;
  if (!isDirty) {
    try {
      const fresh = await ReadFileAt(path);
      tab.rawContent = fresh;
      tab.savedContent = fresh;
      showToast(t('toast.reloaded'));
      renderActive();
    } catch { /* file may have been removed in race */ }
    return;
  }

  // Dirty: show conflict banner (only once per change)
  if (pendingConflicts.has(path)) return;
  pendingConflicts.add(path);
  renderActive();
}

EventsOn('file-changed', (data: { path: string; event: string }) => {
  if (!data || !data.path) return;
  void handleExternalChange(data.path, data.event);
});

function renderConflictBanner() {
  const tab = getActiveTab();
  if (!tab || !pendingConflicts.has(tab.path)) return;
  const contentArea = document.getElementById('content-area');
  if (!contentArea || document.getElementById('conflict-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'conflict-banner';
  banner.className = 'conflict-banner';
  banner.innerHTML = `
    <span class="conflict-icon">⚠</span>
    <span class="conflict-text"><b>${escapeHtml(tab.name)}</b> ${t('banner.externalChange')}</span>
    <button class="conflict-btn" id="conflict-reload">${t('banner.reloadFromDisk')}</button>
    <button class="conflict-btn" id="conflict-keep">${t('banner.keepMyChanges')}</button>
  `;
  contentArea.parentElement?.insertBefore(banner, contentArea);

  document.getElementById('conflict-reload')?.addEventListener('click', async () => {
    try {
      const fresh = await ReadFileAt(tab.path);
      tab.rawContent = fresh;
      tab.savedContent = fresh;
    } catch {}
    pendingConflicts.delete(tab.path);
    renderActive();
  });
  document.getElementById('conflict-keep')?.addEventListener('click', () => {
    pendingConflicts.delete(tab.path);
    renderActive();
  });
}

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
