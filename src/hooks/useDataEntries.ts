/**
 * @file useDataEntries.ts
 * @description Hook for managing the list of business data entries in the
 * Data tab.
 *
 * Optimistic UI pattern:
 * - `addEntry` immediately inserts a temporary entry into local state so the
 *   list updates without waiting for the server round-trip.
 * - On success the temporary entry is replaced by a real server sync (`load()`).
 * - On failure the temporary entry is rolled back via `ADD_ROLLBACK`.
 *
 * `replaceEntry` is intentionally non-optimistic — it deletes an existing
 * record before creating a new one, so a partial failure would leave the data
 * in an inconsistent state. The user has already confirmed the destructive
 * action, so we show a loading indicator and do a clean reload after.
 */

import { useCallback, useEffect, useReducer } from 'react';
import { dataEntryService } from '@/services/dataEntryService';
import { recommendationService } from '@/services/recommendationService';
import type { AsyncStatus, CreateEntryInput, DataEntry } from '@/types';

interface State {
  entries: DataEntry[];
  status: AsyncStatus;
  error: string | null;
}

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; entries: DataEntry[] }
  /** Immediately inserts a placeholder entry before the server confirms. */
  | { type: 'ADD_OPTIMISTIC'; entry: DataEntry }
  /** Removes the placeholder if the server request failed. */
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

/**
 * Provides the data entry list and mutation helpers for the Data tab.
 *
 * @param companyId - Currently authenticated user/company ID
 *
 * @returns
 * - `entries`      — List of data entries, newest first
 * - `status`       — `'idle' | 'loading' | 'success' | 'error'`
 * - `error`        — Error message or null
 * - `addEntry`     — Creates a new entry with optimistic UI update
 * - `replaceEntry` — Overwrites an existing entry (used when a week already exists)
 * - `refresh`      — Re-fetches entries from the API
 */
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

  /**
   * Adds a new business data entry.
   *
   * An optimistic placeholder (with a `temp_` prefixed ID) is inserted
   * immediately so the list feels responsive. After the API call succeeds,
   * a full reload replaces the placeholder with the real server record.
   * If the API call fails, the placeholder is removed and the error re-thrown.
   *
   * @param input - Form data (without `companyId`, which is injected here)
   */
  const addEntry = useCallback(
    async (input: Omit<CreateEntryInput, 'companyId'>) => {
      const tempId = `temp_${Date.now()}`;
      const optimistic: DataEntry = {
        id: tempId,
        companyId,
        periodId:      '',
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

  /**
   * Replaces an existing entry for a week the user has already recorded.
   * Before creating the new record:
   * 1. Silently deletes any AI recommendation for the period (it's stale now).
   * 2. Deletes the old `business_data` record (and its KPIs via cascade).
   * 3. Creates a fresh record with the updated figures.
   *
   * No optimistic update — the user confirmed the destructive action,
   * so a clean reload is preferable to a visual glitch on failure.
   *
   * @param oldId    - `business_data.id` of the record to replace
   * @param periodId - Associated period UUID (for deleting the recommendation)
   * @param input    - New form data
   */
  const replaceEntry = useCallback(
    async (oldId: string, periodId: string, input: Omit<CreateEntryInput, 'companyId'>) => {
      await recommendationService.delete(periodId).catch(() => {});
      await dataEntryService.deleteEntry(oldId);
      await dataEntryService.addEntry({ ...input, companyId });
      load();
    },
    [companyId, load],
  );

  return { ...state, addEntry, replaceEntry, refresh: load };
}
