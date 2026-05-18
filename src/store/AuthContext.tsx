import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { authService } from '@/services/authService';
import { supabase } from '@/lib/supabaseClient';
import { userService } from '@/services/userService';
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
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_NAME'; name: string };

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
    case 'UPDATE_NAME':
      if (!state.session) return state;
      return {
        ...state,
        session: {
          ...state.session,
          user: { ...state.session.user, name: action.name },
        },
      };
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
  /** Updates the business name in the session (call after saving in profile). */
  updateUserName: (name: string) => void;
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

  // Restore persisted session on mount, then lazily load the business name
  // from the backend without blocking hydration.
  useEffect(() => {
    let active = true;
    authService.loadSession().then((session) => {
      if (!active) return;
      dispatch({ type: 'RESTORE', session });
      if (session) {
        // Background fetch — updates the name once the backend responds.
        userService.getProfile().then((profile) => {
          if (active && profile?.business_name) {
            dispatch({ type: 'UPDATE_NAME', name: profile.business_name });
          }
        }).catch(() => {});
      }
    });
    return () => { active = false; };
  }, []);

  // Keep session token in sync when Supabase auto-refreshes it
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, supabaseSession) => {
        if (event === 'TOKEN_REFRESHED' && supabaseSession) {
          const profile = await userService.getProfile().catch(() => null);
          const updatedSession: UserSession = {
            token: supabaseSession.access_token,
            user: {
              id: supabaseSession.user.id,
              name: profile?.business_name ?? supabaseSession.user.email?.split('@')[0] ?? 'Usuario',
              email: supabaseSession.user.email ?? '',
              role: 'admin',
              avatarColor: '#7C3AED',
            },
            activeCompanyId: supabaseSession.user.id,
            rememberMe: true,
            authenticatedAt: new Date().toISOString(),
          };
          dispatch({ type: 'LOGIN_SUCCESS', session: updatedSession });
        }

        if (event === 'SIGNED_OUT') {
          dispatch({ type: 'LOGOUT' });
        }
      },
    );
    return () => subscription.unsubscribe();
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

  const updateUserName = useCallback((name: string) => {
    dispatch({ type: 'UPDATE_NAME', name });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: Boolean(state.session),
      login,
      logout,
      updateUserName,
    }),
    [state, login, logout, updateUserName],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
