/**
 * @file useHistory.ts
 * @description Hook que agrega registros KPI, entradas de datos de negocio,
 * metadatos de periodo y marcas de recomendación de IA en una única lista
 * `HistoryEntry[]`, ordenada de más reciente a más antigua.
 *
 * Estrategia de datos:
 * - Las cuatro llamadas a la API (`/kpis/`, `/business-data/`, `/periods/`,
 *   `/recommendations/`) se lanzan en paralelo mediante `Promise.all`.
 * - Los KPIs se deduplicanel por `period_id` (el backend puede almacenar múltiples
 *   filas KPI por periodo tras un recálculo; conservamos solo la primera vista
 *   tras la deduplicación — la insertada más recientemente).
 * - Solo se conservan los KPIs cuyo `period_id` tiene un registro activo de
 *   `business_data`, protegiéndose frente a filas KPI obsoletas tras borrados manuales.
 * - El `bdataId` (clave primaria de business_data) se almacena en cada entrada
 *   para que la operación de borrado apunte a la fila correcta sin un viaje extra
 *   a la API.
 */

import { useCallback, useEffect, useReducer } from 'react';
import { apiClient } from '@/lib/apiClient';
import { recommendationService } from '@/services/recommendationService';
import { dataEntryService } from '@/services/dataEntryService';
import type { PeriodRead } from '@/services/periodService';
import type { AsyncStatus } from '@/types';

// ─── Backend types ────────────────────────────────────────────────────────────

/** Registro KPI tal como lo devuelve `GET /kpis/`. Todos los campos numéricos
 *  pueden llegar como cadenas desde la API — los llamantes deben envolver con
 *  `Number()` antes de operar matemáticamente. */
export interface KpiRead {
  id: string;
  period_id: string;
  user_id: string;
  revenue: number;
  expenses: number;
  net_profit: number;
  /** Margen de beneficio neto como porcentaje (0–100). */
  profit_margin: number;
  num_sales: number;
  num_customers: number;
  avg_ticket: number;
  gross_margin: number | null;
  calculated_at: string | null;
}

/**
 * Una única fila en la lista del historial — una semana de negocio completada
 * con sus KPIs agregados y una marca que indica si existe recomendación de IA.
 */
export interface HistoryEntry {
  period: PeriodRead;
  kpi: KpiRead;
  /** `business_data.id` — necesario para eliminar la entrada mediante `dataEntryService`. */
  bdataId: string;
  /** True si se ha generado una recomendación para este periodo. */
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
  /** Elimina optimistamente una entrada de la lista tras un borrado exitoso. */
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
 * Proporciona la lista completa del historial con el estado de carga/error
 * y funciones de mutación.
 *
 * @returns
 * - `entries`  — Entradas del historial ordenadas (más reciente primero), vacío mientras carga
 * - `status`   — `'idle' | 'loading' | 'success' | 'error'`
 * - `error`    — Mensaje de error, o null
 * - `refresh`  — Recarga todos los datos desde la API
 * - `remove`   — Elimina una entrada (datos de negocio + recomendación) y actualiza
 *                la lista local optimistamente sin recarga completa
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
   * Elimina una entrada del historial borrando su registro `business_data` y la
   * recomendación de IA asociada (si existe), y luego la quita del estado local.
   * **No** recarga desde la API — la eliminación optimista es suficiente.
   */
  const remove = useCallback(async (entry: HistoryEntry) => {
    await dataEntryService.deleteEntry(entry.bdataId);
    await recommendationService.delete(entry.period.id);
    dispatch({ type: 'REMOVE_SUCCESS', periodId: entry.period.id });
  }, []);

  return { ...state, refresh: load, remove };
}
