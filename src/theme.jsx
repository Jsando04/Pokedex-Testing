import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeCtx = createContext({ dark: true, toggle: () => {} });

export function ThemeProvider({ children }) {
  const preferDark =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches;

  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme'); // 'dark' | 'light' | null
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return preferDark;
  });

  useEffect(() => {
    const root = document.documentElement; // <html>
    root.classList.toggle('dark', dark);   // 👈 activa/desactiva modo oscuro
    root.style.colorScheme = dark ? 'dark' : 'light';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <ThemeCtx.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme(){ return useContext(ThemeCtx); }