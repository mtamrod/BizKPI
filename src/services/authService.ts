import { supabase } from '@/lib/supabaseClient';
import { userService } from '@/services/userService';
import type { LoginInput, UserSession } from '@/types';

export interface LoginResult {
  success: boolean;
  session?: UserSession;
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Builds a UserSession from a Supabase session + optional backend profile. */
async function buildSession(
  accessToken: string,
  userId: string,
  email: string,
  rememberMe = true,
): Promise<UserSession> {
  const profile = await userService.getProfile().catch(() => null);
  return {
    token: accessToken,
    user: {
      id: userId,
      name: profile?.business_name ?? email.split('@')[0] ?? 'Usuario',
      email,
      role: 'admin',
      avatarColor: '#7C3AED',
    },
    activeCompanyId: userId, // no company concept in backend — user IS the entity
    rememberMe,
    authenticatedAt: new Date().toISOString(),
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const authService = {
  async login(input: LoginInput): Promise<LoginResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    });

    if (error || !data.session) {
      return {
        success: false,
        error: error?.message ?? 'Credenciales incorrectas.',
      };
    }

    const session = await buildSession(
      data.session.access_token,
      data.user.id,
      data.user.email ?? input.email,
      input.rememberMe,
    );

    return { success: true, session };
  },

  /**
   * Restores a session on app boot.
   * Uses the Supabase SDK cache (handles token refresh automatically).
   */
  async loadSession(): Promise<UserSession | null> {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return null;

    const { access_token, user } = data.session;
    // No llamamos a buildSession() aquí porque hace GET /users/me
    // bloqueando hydrated=true hasta que el backend responda.
    return {
      token: access_token,
      user: {
        id: user.id,
        name: user.email?.split('@')[0] ?? 'Usuario',
        email: user.email ?? '',
        role: 'admin' as const,
        avatarColor: '#7C3AED',
      },
      activeCompanyId: user.id,
      rememberMe: true,
      authenticatedAt: new Date().toISOString(),
    };
  },

  /**
   * Supabase SDK persists the session in AsyncStorage automatically.
   * This is a no-op kept for API compatibility with AuthContext.
   */
  async persistSession(_session: UserSession): Promise<void> {
    // Intentionally empty — Supabase SDK handles persistence.
  },

  async clearSession(): Promise<void> {
    await supabase.auth.signOut();
  },
};
