import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Light / dark theme provider.
 *  - Applies the theme to <html data-theme=".." data-bs-theme="..">
 *    (our CSS tokens + Bootstrap 5.3 dark mode both follow it)
 *  - Remembers the visitor's choice in localStorage
 *  - Falls back to the operating-system preference on the first visit
 */
export const THEME_KEY = 'orgplus_theme';
const META_COLOR = { light: '#ffffff', dark: '#141618' };

function readInitial() {
  try {
    let saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* storage blocked – ignore */ }
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function apply(theme) {
  let root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-bs-theme', theme);
  let meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', META_COLOR[theme]);
}

const ThemeContext = createContext({ theme: 'light', isDark: false, toggleTheme: () => {}, setTheme: () => {} });

export function ThemeProvider({ children }) {
  let [theme, setThemeState] = useState(readInitial);

  useEffect(() => { apply(theme); }, [theme]);

  let setTheme = useCallback((next) => {
    setThemeState(next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
  }, []);

  let toggleTheme = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [theme, setTheme]);

  let value = useMemo(() => ({ theme, isDark: theme === 'dark', toggleTheme, setTheme }), [theme, toggleTheme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }
