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

export function useKPIs(companyId: string) {
  const [state, dispatch] = useReducer(reducer, {
    data: null,
    status: 'idle',
    error: null,
  });

  const load = useCallback(async () => {
    console.log('[KPI] load START, companyId:', companyId);
    dispatch({ type: 'FETCH_START' });
    try {
      const data = await kpiService.getDashboard(companyId);
      console.log('[KPI] load SUCCESS');
      dispatch({ type: 'FETCH_SUCCESS', data });
    } catch (e) {
      console.error('[KPI] load ERROR:', e);
      dispatch({ type: 'FETCH_ERROR', error: 'No se pudieron cargar los KPIs.' });
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  return { ...state, refresh: load };
}
