/**
 * MUI 테마 프로바이더
 * - 다크모드 관리 및 토글 기능 제공
 * - Tailwind CSS dark: 클래스와 동기화
 */

'use client';

import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  ReactNode,
  useEffect,
  useState,
  createContext,
  useContext,
  useCallback,
  useMemo,
} from 'react';
import { lightTheme, darkTheme } from './theme';

/**
 * 테마 컨텍스트 타입 정의
 */
interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * 테마 관련 기능을 사용하기 위한 커스텀 훅
 * @returns {ThemeContextType} 테마 상태 및 토글 함수
 */
export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * 전역 테마 프로바이더 컴포넌트
 * @param {ThemeProviderProps} props 컴포넌트 속성
 * @returns {JSX.Element} 테마가 적용된 컴포넌트 트리
 */
export default function ThemeProvider({ children }: ThemeProviderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 초기 테마 설정 (로컬 스토리지 또는 시스템 설정)
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;

    const shouldBeDark =
      savedTheme === 'dark' || (!savedTheme && systemPrefersDark);

    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setMounted(true);
  }, []);

  // 테마 변경 시 HTML 클래스 동기화
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // 테마 토글 함수
  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  // 컨텍스트 값 메모이제이션
  const contextValue = useMemo(
    () => ({ isDarkMode, toggleTheme }),
    [isDarkMode, toggleTheme]
  );

  // 서버 사이드 렌더링 시에는 기본 테마로 렌더링하고 하이드레이션 후 테마 적용
  // (FOUC 방지를 위해 실제 서비스에서는 더 복잡한 처리가 필요할 수 있음)
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
