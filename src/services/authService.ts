import { MOCK_CREDENTIALS, MOCK_TOKEN, MOCK_USER } from '@/mocks/authMocks';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { LoginInput, UserSession } from '@/types';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface LoginResult {
  success: boolean;
  session?: UserSession;
  error?: string;
}

export const authService = {
  async login(input: LoginInput): Promise<LoginResult> {
    await delay(800);

    const emailOk = input.email.trim().toLowerCase() === MOCK_CREDENTIALS.email;
    const passOk  = input.password === MOCK_CREDENTIALS.password;

    if (!emailOk || !passOk) {
      return {
        success: false,
        error: `Credenciales inválidas.\nUsa: ${MOCK_CREDENTIALS.email} / ${MOCK_CREDENTIALS.password}`,
      };
    }

    const session: UserSession = {
      token: MOCK_TOKEN,
      user: MOCK_USER,
      activeCompanyId: 'co_001',
      rememberMe: input.rememberMe,
      authenticatedAt: new Date().toISOString(),
    };

    return { success: true, session };
  },

  async loadSession(): Promise<UserSession | null> {
    return storage.get<UserSession>(STORAGE_KEYS.AUTH_SESSION);
  },

  async persistSession(session: UserSession): Promise<void> {
    if (session.rememberMe) {
      await storage.set(STORAGE_KEYS.AUTH_SESSION, session);
    }
  },

  async clearSession(): Promise<void> {
    await storage.remove(STORAGE_KEYS.AUTH_SESSION);
  },
};
