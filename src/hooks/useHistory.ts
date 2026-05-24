/**
 * @file useHistory.ts
 * @description Hook that aggregates KPI records, business data entries, period
 * metadata and AI recommendation flags into a single `HistoryEntry[]` list,
 * sorted newest-first.
 *
 * Data strategy:
 * - All four API calls (`/kpis/`, `/business-data/`, `/periods/`,
 *   `/recommendations/`) are fired in parallel via `Promise.all`.
 * - KPIs are deduplicated by `period_id` (the backend can store multiple KPI
 *   rows per period after a recalculation; we keep only the first seen after
 *   deduplication — the most recently inserted one).
 * - Only KPIs whose `period_id` has an active `business_data` record are kept,
 *   guarding against stale KPI rows left after manual deletions.
 * - The `bdataId` (business_data primary key) is stored in each entry so the
 *   delete operation targets the correct row without an extra API round-trip.
 */

import { useCallback, useEffect, useReducer } from 'react';
import { apiClient } from '@/lib/apiClient';
import { recommendationService } from '@/services/recommendationService';
import { dataEntryService } from '@/services/dataEntryService';
import type { PeriodRead } from '@/services/periodService';
import type { AsyncStatus } from '@/types';

// ─── Backend types ────────────────────────────────────────────────────────────

/** KPI record as returned by `GET /kpis/`. All numeric fields may arrive as
 *  strings from the API — callers should wrap with `Number()` before maths. */
export interface KpiRead {
  id: string;
  period_id: string;
  user_id: string;
  revenue: number;
  expenses: number;
  net_profit: number;
  /** Net profit margin as a percentage (0–100). */
  profit_margin: number;
  num_sales: number;
  num_customers: number;
  avg_ticket: number;
  gross_margin: number | null;
  calculated_at: string | null;
}

/**
 * A single row in the history list — one completed business week with its
 * aggregated KPIs and a flag indicating whether an AI recommendation exists.
 */
export interface HistoryEntry {
  period: PeriodRead;
  kpi: KpiRead;
  /** `business_data.id` — needed to delete the entry via `dataEntryService`. */
  bdataId: string;
  /** True if a recommendation has been generated for this period. */
  hasReco: boolean;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

interface State {
  entries: HistoryEntry[];
  status: AsyncStatus;
  error: string | null;
}

type Action =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; entries: HistoryEntry[] }
  | { type: 'LOAD_ERROR'; error: string }
  /** Optimistically removes an entry from the list after a successful deletion. */
  | { type: 'REMOVE_SUCCESS'; periodId: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_START':   return { ...state, status: 'loading', error: null };
    case 'LOAD_SUCCESS': return { ...state, entries: action.entries, status: 'success', error: null };
    case 'LOAD_ERROR':   return { ...state, status: 'error', error: action.error };
    case 'REMOVE_SUCCESS':
      return { ...state, entries: state.entries.filter((e) => e.period.id !== action.periodId) };
    default: return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Provides the full history list with loading/error state and mutation helpers.
 *
 * @returns
 * - `entries`  — Sorted history entries (newest first), empty while loading
 * - `status`   — `'idle' | 'loading' | 'success' | 'error'`
 * - `error`    — Error message, or null
 * - `refresh`  — Re-fetches all data from the API
 * - `remove`   — Deletes an entry (business data + recommendation) and updates
 *                the local list optimistically without a full reload
 */
export function useHistory() {
  const [state, dispatch] = useReducer(reducer, {
    entries: [],
    status: 'idle',
    error: null,
  });

  const load = useCallback(async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      const [kpis, bdata, periods, recos] = await Promise.all([
        apiClient.get<KpiRead[]>('/kpis/'),
        apiClient.get<{ id: string; period_id: string }[]>('/business-data/'),
        apiClient.get<PeriodRead[]>('/periods/'),
        recommendationService.list(),
      ]);

      const activePeriodIds  = new Set(bdata.map((bd) => bd.period_id));
      const bdataIdByPeriod  = new Map(bdata.map((bd) => [bd.period_id, bd.id]));
      const recoPeriodIds    = new Set(recos.map((r) => r.period_id));
      const periodMap        = new Map(periods.map((p) => [p.id, p]));

      // Deduplicate KPIs by period_id, keep only those with active business_data
      const seenPeriods = new Set<string>();
      const uniqueKpis = kpis.filter((k) => {
        if (!activePeriodIds.has(k.period_id)) return false;
        if (seenPeriods.has(k.period_id)) return false;
        seenPeriods.add(k.period_id);
        return true;
      });

      const entries: HistoryEntry[] = uniqueKpis
        .map((kpi) => {
          const period  = periodMap.get(kpi.period_id);
          const bdataId = bdataIdByPeriod.get(kpi.period_id);
          if (!period || !bdataId) return null;
          return { period, kpi, bdataId, hasReco: recoPeriodIds.has(kpi.period_id) };
        })
        .filter((e): e is HistoryEntry => e !== null)
        .sort((a, b) => b.period.start_date.localeCompare(a.period.start_date));

      dispatch({ type: 'LOAD_SUCCESS', entries });
    } catch {
      dispatch({ type: 'LOAD_ERROR', error: 'No se pudieron cargar los datos.' });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /**
   * Deletes a history entry by removing its `business_data` record and the
   * associated AI recommendation (if any), then removes it from local state.
   * Does **not** refetch from the API — the optimistic removal is sufficient.
   */
  const remove = useCallback(async (entry: HistoryEntry) => {
    await dataEntryService.deleteEntry(entry.bdataId);
    await recommendationService.delete(entry.period.id);
    dispatch({ type: 'REMOVE_SUCCESS', periodId: entry.period.id });
  }, []);

  return { ...state, refresh: load, remove };
}
