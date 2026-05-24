/**
 * @file useKPIs.ts
 * @description Hook that loads the dashboard KPI data from `kpiService` and
 * exposes it with a standard async status pattern.
 *
 * Re-fetches automatically when `companyId`, `currency` or `language` changes.
 * The `language` dependency is intentional: `kpiService.getDashboard` calls
 * `i18n.t` to format labels and headlines, so the hook must reload whenever
 * the locale switches to pick up the new translations.
 */

import { useCallback, useEffect, useReducer } from 'react';
import { kpiService } from '@/services/kpiService';
import type { AsyncStatus, DashboardData } from '@/types';

interface State {
  data: DashboardData | null;
  status: AsyncStatus;
  error: string | null;
}

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; data: DashboardData }
  | { type: 'FETCH_ERROR'; error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':  return { ...state, status: 'loading', error: null };
    case 'FETCH_SUCCESS': return { data: action.data, status: 'success', error: null };
    case 'FETCH_ERROR':  return { ...state, status: 'error', error: action.error };
    default: return state;
  }
}

/**
 * Loads and manages the `DashboardData` payload for the Home screen.
 *
 * @param companyId - Currently authenticated company / user ID
 * @param currency  - Currency symbol forwarded to `kpiService` (default `'€'`)
 * @param language  - Active locale code; triggers a reload on change so
 *   formatted labels rebuild in the new language (default `'es'`)
 *
 * @returns
 * - `data`    — The full `DashboardData` object, or `null` while loading
 * - `status`  — `'idle' | 'loading' | 'success' | 'error'`
 * - `error`   — Error message string, or `null`
 * - `refresh` — Manually triggers a fresh fetch (used by pull-to-refresh)
 */
export function useKPIs(companyId: string, currency = '€', language = 'es') {
  const [state, dispatch] = useReducer(reducer, {
    data: null,
    status: 'idle',
    error: null,
  });

  const load = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const data = await kpiService.getDashboard(companyId, currency);
      dispatch({ type: 'FETCH_SUCCESS', data });
    } catch {
      dispatch({ type: 'FETCH_ERROR', error: 'Error' });
    }
  // language in deps so strings re-build when locale changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, currency, language]);

  useEffect(() => { load(); }, [load]);

  return { ...state, refresh: load };
}
