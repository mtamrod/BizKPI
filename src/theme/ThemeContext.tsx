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
import i18n, { LANGUAGES, type LanguageCode } from '@/i18n';

export const CURRENCIES = [
  { symbol: '€', labelKey: 'currency_euro' },
  { symbol: '$', labelKey: 'currency_dollar' },
  { symbol: '£', labelKey: 'currency_pound' },
  { symbol: '¥', labelKey: 'currency_yen' },
] as const;

export type CurrencySymbol = typeof CURRENCIES[number]['symbol'];
export { LANGUAGES, type LanguageCode };

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  currency: CurrencySymbol;
  setCurrency: (symbol: CurrencySymbol) => void;
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode]           = useState<ThemeMode>('dark');
  const [currency, setCurrencyState] = useState<CurrencySymbol>('€');
  const [language, setLanguageState] = useState<LanguageCode>('es');

  useEffect(() => {
    storage.get<ThemeMode>(STORAGE_KEYS.THEME_PREFERENCE).then((saved) => {
      if (saved === 'dark' || saved === 'light') setMode(saved);
    });
    storage.get<CurrencySymbol>(STORAGE_KEYS.CURRENCY).then((saved) => {
      if (saved && CURRENCIES.some((c) => c.symbol === saved)) setCurrencyState(saved);
    });
    storage.get<LanguageCode>(STORAGE_KEYS.LANGUAGE).then((saved) => {
      if (saved && LANGUAGES.some((l) => l.code === saved)) {
        setLanguageState(saved);
        i18n.changeLanguage(saved);
      }
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

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code);
    i18n.changeLanguage(code);
    storage.set(STORAGE_KEYS.LANGUAGE, code);
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
      language,
      setLanguage,
    }),
    [mode, toggleTheme, setTheme, currency, setCurrency, language, setLanguage],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
