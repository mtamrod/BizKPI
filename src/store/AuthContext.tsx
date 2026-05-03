import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { authService } from '@/services/authService';
import type { AuthStatus, LoginInput, UserSession } from '@/types';

// ─── State ───────────────────────────────────────────────────────────────────

interface AuthState {
  session: UserSession | null;
  status: AuthStatus;
  hydrated: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'RESTORE'; session: UserSession | null }
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; session: UserSession }
  | { type: 'LOGIN_ERROR'; error: string }
  | { type: 'LOGOUT' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE':
      return { ...state, session: action.session, hydrated: true, status: 'idle' };
    case 'LOGIN_START':
      return { ...state, status: 'loading', error: null };
    case 'LOGIN_SUCCESS':
      return { ...state, status: 'success', session: action.session, error: null };
    case 'LOGIN_ERROR':
      return { ...state, status: 'error', error: action.error };
    case 'LOGOUT':
      return { session: null, status: 'idle', hydrated: true, error: null };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface AuthContextValue {
  session: UserSession | null;
  status: AuthStatus;
  hydrated: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    session: null,
    status: 'loading',
    hydrated: false,
    error: null,
  });

  // Restore persisted session on mount
  useEffect(() => {
    let active = true;
    authService.loadSession().then((session) => {
      if (active) dispatch({ type: 'RESTORE', session });
    });
    return () => { active = false; };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    dispatch({ type: 'LOGIN_START' });
    const result = await authService.login(input);
    if (result.success && result.session) {
      await authService.persistSession(result.session);
      dispatch({ type: 'LOGIN_SUCCESS', session: result.session });
    } else {
      dispatch({ type: 'LOGIN_ERROR', error: result.error ?? 'Error desconocido.' });
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.clearSession();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: Boolean(state.session),
      login,
      logout,
    }),
    [state, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
