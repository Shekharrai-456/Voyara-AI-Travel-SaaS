'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  isDark: true,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [isDark, setIsDark] = useState<boolean>(true);

  // Sync theme from localStorage on client mount (post-hydration)
  useEffect(() => {
    const saved = localStorage.getItem('voyara-theme') as Theme | null;
    if (saved) {
      setThemeState(saved);
      if (saved === 'light') setIsDark(false);
      else if (saved === 'dark') setIsDark(true);
      else setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    } else if (window.matchMedia && !window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setThemeState('light');
      setIsDark(false);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    let dark = false;

    if (theme === 'system') {
      dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      dark = theme === 'dark';
    }

    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem('voyara-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(nextTheme);
    setIsDark(nextTheme === 'dark');
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    if (t === 'light') setIsDark(false);
    else if (t === 'dark') setIsDark(true);
    else if (typeof window !== 'undefined') {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
