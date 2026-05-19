import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { darkColors, lightColors } from './colors';
import type { ThemeColors, ThemeMode } from '@/types';

export const CURRENCIES = [
  { symbol: '€', label: 'Euro' },
  { symbol: '$', label: 'Dólar' },
  { symbol: '£', label: 'Libra' },
  { symbol: '¥', label: 'Yen' },
] as const;

export type CurrencySymbol = typeof CURRENCIES[number]['symbol'];

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  currency: CurrencySymbol;
  setCurrency: (symbol: CurrencySymbol) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [currency, setCurrencyState] = useState<CurrencySymbol>('€');

  useEffect(() => {
    storage.get<ThemeMode>(STORAGE_KEYS.THEME_PREFERENCE).then((saved) => {
      if (saved === 'dark' || saved === 'light') setMode(saved);
    });
    storage.get<CurrencySymbol>(STORAGE_KEYS.CURRENCY).then((saved) => {
      if (saved && CURRENCIES.some((c) => c.symbol === saved)) setCurrencyState(saved);
    });
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setMode(next);
    storage.set(STORAGE_KEYS.THEME_PREFERENCE, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setTheme]);

  const setCurrency = useCallback((symbol: CurrencySymbol) => {
    setCurrencyState(symbol);
    storage.set(STORAGE_KEYS.CURRENCY, symbol);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors: mode === 'dark' ? darkColors : lightColors,
      isDark: mode === 'dark',
      toggleTheme,
      setTheme,
      currency,
      setCurrency,
    }),
    [mode, toggleTheme, setTheme, currency, setCurrency],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
