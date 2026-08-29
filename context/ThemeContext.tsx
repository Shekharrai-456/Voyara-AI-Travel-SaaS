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

  // Sync initial theme from localStorage or system preference on client mount
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      const saved = localStorage.getItem('voyara-theme') as Theme | null;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeState(saved);
      } else if (window.matchMedia && !window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setThemeState('light');
      }
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  // Sync DOM classes and isDark state whenever theme changes
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
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    const handle = requestAnimationFrame(() => setIsDark(dark));
    localStorage.setItem('voyara-theme', theme);
    return () => cancelAnimationFrame(handle);
  }, [theme]);

  // Dynamic system theme listener
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      if (e.matches) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
        setIsDark(true);
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
        setIsDark(false);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

