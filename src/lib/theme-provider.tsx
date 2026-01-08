'use client';

import { ThemeProvider, CssBaseline } from '@mui/material';
import { useEffect, useState } from 'react';
import { createAppTheme } from '@/lib/theme';

export default function AppThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // 시스템 다크모드 감지
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setMode(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e: MediaQueryListEvent) => {
      setMode(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const theme = createAppTheme(mode);

  // Tailwind dark 모드와 동기화
  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
