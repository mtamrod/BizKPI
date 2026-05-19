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
  /** period_id → Recommendation (already generated ones). */
  recommendations: Record<string, Recommendation>;
  /** period_ids currently being sent to the AI. */
  generatingIds: string[];
  loadStatus: AsyncStatus;
  error: string | null;
}

type Action =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; periods: PeriodRead[]; recommendations: Record<string, Recommendation> }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'GENERATE_START'; periodId: string }
  | { type: 'GENERATE_SUCCESS'; periodId: string; recommendation: Recommendation }
  | { type: 'GENERATE_ERROR'; periodId: string };

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
    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

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

  return { ...state, generate, refresh: load };
}
