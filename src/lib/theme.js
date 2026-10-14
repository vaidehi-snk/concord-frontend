// Light ("ledger") and dark ("night ledger") themes. The choice is stored per
// browser; with no choice saved, the operating system's setting decides.
// index.html sets data-theme before the first paint, so there is no flash.
const KEY = 'concord_theme';
const listeners = new Set();

export function getTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function setTheme(theme) {
  const root = document.documentElement;
  root.classList.add('theme-switching');
  root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#121822' : '#f6f2ea');
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* storage unavailable: the choice lasts for this page only */
  }
  window.setTimeout(() => root.classList.remove('theme-switching'), 250);
  listeners.forEach((fn) => fn(theme));
}

export function subscribeTheme(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
