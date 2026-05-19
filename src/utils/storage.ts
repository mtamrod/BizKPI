import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  AUTH_SESSION:      '@bizkpi/auth_session',
  THEME_PREFERENCE:  '@bizkpi/theme',
  CURRENCY:          '@bizkpi/currency',
  DATA_ENTRIES:      '@bizkpi/data_entries',
  ACTIVE_COMPANY:    '@bizkpi/active_company',
} as const;

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // silently fail — storage errors never crash the app
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // silently fail
    }
  },
};
