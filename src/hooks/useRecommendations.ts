/**
 * @file useRecommendations.ts
 * @description Hook that manages the AI recommendations feature.
 *
 * Responsibilities:
 * - Loads the list of week periods that have business data (available for analysis)
 * - Loads any already-generated recommendations (avoids redundant AI calls)
 * - Tracks which periods are currently being processed by the AI (`generatingIds`)
 * - Exposes `generate` (calls the AI) and `remove` (deletes a recommendation)
 *
 * State is managed with `useReducer` to keep async transitions predictable and
 * testable without an external state library.
 */

import { useCallback, useEffect, useReducer } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useTheme } from '@/theme/ThemeContext';
import { periodService, type PeriodRead } from '@/services/periodService';
import {
  recommendationService,
  type Recommendation,
} from '@/services/recommendationService';
import type { AsyncStatus } from '@/types';

// ─── State ────────────────────────────────────────────────────────────────────

interface State {
  /** Week periods that have at least one business_data record, newest first. */
  periods: PeriodRead[];
  /** Keyed by `period_id` — recommendations that have already been generated. */
  recommendations: Record<string, Recommendation>;
  /** IDs of periods whose recommendation is currently being generated. */
  generatingIds: string[];
  loadStatus: AsyncStatus;
  error: string | null;
}

type Action =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; periods: PeriodRead[]; recommendations: Record<string, Recommendation> }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'GENERATE_START';   periodId: string }
  | { type: 'GENERATE_SUCCESS'; periodId: string; recommendation: Recommendation }
  | { type: 'GENERATE_ERROR';   periodId: string }
  | { type: 'REMOVE_SUCCESS';   periodId: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loadStatus: 'loading', error: null };
    case 'LOAD_SUCCESS':
      return {
        ...state,
        periods: action.periods,
        recommendations: action.recommendations,
        loadStatus: 'success',
        error: null,
      };
    case 'LOAD_ERROR':
      return { ...state, loadStatus: 'error', error: action.error };
    case 'GENERATE_START':
      return { ...state, generatingIds: [...state.generatingIds, action.periodId] };
    case 'GENERATE_SUCCESS': {
      const next = { ...state.recommendations, [action.periodId]: action.recommendation };
      return {
        ...state,
        recommendations: next,
        generatingIds: state.generatingIds.filter((id) => id !== action.periodId),
      };
    }
    case 'GENERATE_ERROR':
      return {
        ...state,
        generatingIds: state.generatingIds.filter((id) => id !== action.periodId),
      };
    case 'REMOVE_SUCCESS': {
      const next = { ...state.recommendations };
      delete next[action.periodId];
      return { ...state, recommendations: next };
    }
    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Provides all data and actions needed by the Recommendations screen.
 *
 * @returns
 * - `periods`        — Selectable week periods (have business data)
 * - `recommendations`— Map of `period_id → Recommendation` (already generated)
 * - `generatingIds`  — Period IDs currently awaiting the AI response
 * - `loadStatus`     — Overall loading status of the initial data fetch
 * - `generate`       — Triggers AI generation for a period; re-throws on error
 * - `remove`         — Deletes the recommendation for a period from API + local state
 * - `refresh`        — Re-fetches periods and recommendations
 */
export function useRecommendations() {
  const { language } = useTheme();
  const [state, dispatch] = useReducer(reducer, {
    periods: [],
    recommendations: {},
    generatingIds: [],
    loadStatus: 'idle',
    error: null,
  });

  const load = useCallback(async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      // Fetch periods, business data presence, and existing recommendations in parallel
      const [periods, bdata, recos] = await Promise.all([
        periodService.list(),
        apiClient.get<{ period_id: string }[]>('/business-data/'),
        recommendationService.list(),
      ]);

      // Only show weeks that have at least one business_data record
      const activePeriodIds = new Set(bdata.map((bd) => bd.period_id));
      const weekPeriods = periods
        .filter((p) => p.period_type === 'week' && activePeriodIds.has(p.id))
        .sort((a, b) => b.start_date.localeCompare(a.start_date)); // newest first

      const recoMap: Record<string, Recommendation> = {};
      recos.forEach((r) => { recoMap[r.period_id] = r; });

      dispatch({ type: 'LOAD_SUCCESS', periods: weekPeriods, recommendations: recoMap });
    } catch {
      dispatch({ type: 'LOAD_ERROR', error: 'No se pudieron cargar los datos.' });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /**
   * Requests AI generation for the given period. The `language` from the
   * active theme is passed to the backend so the recommendation text is
   * returned in the user's selected language.
   *
   * Marks the period as `generating` while the request is in flight, and
   * updates the local recommendations map on success.
   * Re-throws the error so the UI can display an appropriate alert.
   *
   * @param periodId - UUID of the period to analyse
   */
  const generate = useCallback(async (periodId: string) => {
    dispatch({ type: 'GENERATE_START', periodId });
    try {
      const recommendation = await recommendationService.generate(periodId, language);
      dispatch({ type: 'GENERATE_SUCCESS', periodId, recommendation });
    } catch (err: any) {
      dispatch({ type: 'GENERATE_ERROR', periodId });
      throw err;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  /**
   * Deletes the recommendation for a period from the API and removes it from
   * local state so the UI reflects the change immediately.
   *
   * @param periodId - UUID of the period whose recommendation to delete
   */
  const remove = useCallback(async (periodId: string) => {
    await recommendationService.delete(periodId);
    dispatch({ type: 'REMOVE_SUCCESS', periodId });
  }, []);

  return { ...state, generate, remove, refresh: load };
}
