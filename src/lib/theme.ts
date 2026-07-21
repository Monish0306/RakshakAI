export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'rakshak_theme';

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function initTheme(): Theme {
  const initial = getTheme();
  applyTheme(initial);
  return initial;
}
