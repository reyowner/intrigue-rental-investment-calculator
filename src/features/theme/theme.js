import { icon } from '../../components/ui/icon.js';

const mounted = new WeakMap();

export function initializeTheme(document = globalThis.document, window = globalThis.window) {
  if (mounted.has(document)) {
    const current = mounted.get(document);
    current.rebind(document.querySelector('[data-theme-toggle]'));
    return current.api;
  }
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  let saved;
  try { saved = window.localStorage.getItem(THEME_STORAGE_KEY); } catch { /* Storage may be disabled. */ }
  let explicit = saved === 'light' || saved === 'dark';
  let button = document.querySelector('[data-theme-toggle]');
  let theme;
  function apply(next) {
    const changed = theme !== next;
    theme = next;
    document.documentElement.dataset.theme = theme;
    if (button) {
      button.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
      button.setAttribute('title', `${theme === 'dark' ? 'Dark' : 'Light'} mode`);
      button.innerHTML = `<span data-theme-icon="${theme === 'dark' ? 'moon' : 'sun'}">${icon(theme === 'dark' ? 'moon' : 'sun')}</span>`;
    }
    if (changed) window.dispatchEvent(new window.CustomEvent(THEME_CHANGE_EVENT, { detail: { theme } }));
  }
  apply(resolveTheme(saved, media.matches));
  const toggle = () => {
    explicit = true;
    apply(theme === 'dark' ? 'light' : 'dark');
    try { window.localStorage.setItem(THEME_STORAGE_KEY, theme); } catch { /* Keep the session choice. */ }
  };
  button?.addEventListener('click', toggle);
  media.addEventListener('change', () => { if (!explicit) apply(resolveTheme(null, media.matches)); });
  const api = { get theme() { return theme; } };
  mounted.set(document, { api, rebind(next) {
    if (next === button) return;
    button?.removeEventListener?.('click', toggle);
    button = next;
    apply(theme);
    button?.addEventListener('click', toggle);
  } });
  return api;
}

export const THEME_STORAGE_KEY = 'intrigue-theme';
export const THEME_CHANGE_EVENT = 'intrigue:theme-change';

export function resolveTheme(saved, prefersDark) {
  return saved === 'light' || saved === 'dark' ? saved : prefersDark ? 'dark' : 'light';
}
