import { useCallback, useEffect, useReducer } from 'react';
import { dataEntryService } from '@/services/dataEntryService';
import type { AsyncStatus, CreateEntryInput, DataEntry } from '@/types';

interface State {
  entries: DataEntry[];
  status: AsyncStatus;
  error: string | null;
}

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; entries: DataEntry[] }
  | { type: 'ADD_OPTIMISTIC'; entry: DataEntry }
  | { type: 'ADD_ROLLBACK'; tempId: string }
  | { type: 'ERROR'; error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, status: 'loading', error: null };
    case 'FETCH_SUCCESS':
      return { entries: action.entries, status: 'success', error: null };
    case 'ADD_OPTIMISTIC':
      return { ...state, entries: [action.entry, ...state.entries], status: 'idle' };
    case 'ADD_ROLLBACK':
      return { ...state, entries: state.entries.filter((e) => e.id !== action.tempId) };
    case 'ERROR':
      return { ...state, status: 'error', error: action.error };
    default:
      return state;
  }
}

export function useDataEntries(companyId: string) {
  const [state, dispatch] = useReducer(reducer, {
    entries: [],
    status: 'idle',
    error: null,
  });

  const load = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const entries = await dataEntryService.getEntries(companyId);
      dispatch({ type: 'FETCH_SUCCESS', entries });
    } catch {
      dispatch({ type: 'ERROR', error: 'No se pudieron cargar las entradas.' });
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const addEntry = useCallback(
    async (input: Omit<CreateEntryInput, 'companyId'>) => {
      const tempId = `temp_${Date.now()}`;
      const optimistic: DataEntry = {
        id: tempId,
        companyId,
        period:        input.period,
        periodDate:    input.periodDate,
        periodEndDate: input.periodEndDate,
        totalRevenue:  input.totalRevenue,
        totalExpenses: input.totalExpenses,
        totalSales:    input.totalSales,
        totalClients:  input.totalClients,
        bestProduct:   input.bestProduct,
        bestDay:       input.bestDay,
        worstDay:      input.worstDay,
        observations:  input.observations,
        source: 'manual',
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_OPTIMISTIC', entry: optimistic });
      try {
        await dataEntryService.addEntry({ ...input, companyId });
        load(); // sync with real stored data
      } catch (err) {
        dispatch({ type: 'ADD_ROLLBACK', tempId });
        throw err;
      }
    },
    [companyId, load],
  );

  return { ...state, addEntry, refresh: load };
}
