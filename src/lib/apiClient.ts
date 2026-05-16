import { supabase } from './supabaseClient';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');
const API_PREFIX = '/api/v1';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getAuthHeader(): Promise<string> {
  // getSession() uses the locally cached + auto-refreshed token
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) {
    throw new ApiError(401, 'Sesión expirada. Vuelve a iniciar sesión.');
  }
  return `Bearer ${data.session.access_token}`;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Core request ────────────────────────────────────────────────────────────

const TIMEOUT_MS = 60_000;

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const auth = await getAuthHeader();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new ApiError(408, 'El servidor tardó demasiado en responder. Inténtalo de nuevo.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const json = await response.json();
      detail = json.detail ?? detail;
    } catch {
      // ignore parse error
    }
    throw new ApiError(response.status, detail);
  }

  // 204 No Content
  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

// ─── Public interface ────────────────────────────────────────────────────────

export const apiClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
};
