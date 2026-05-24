/**
 * @file useRecommendations.ts
 * @description Hook que gestiona la funcionalidad de recomendaciones de IA.
 *
 * Responsabilidades:
 * - Carga la lista de periodos semanales que tienen datos de negocio (disponibles para análisis)
 * - Carga las recomendaciones ya generadas (evita llamadas redundantes a la IA)
 * - Controla qué periodos están siendo procesados por la IA (`generatingIds`)
 * - Expone `generate` (llama a la IA) y `remove` (elimina una recomendación)
 *
 * El estado se gestiona con `useReducer` para mantener las transiciones asíncronas
 * predecibles y testables sin biblioteca de estado externa.
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
  /** Periodos semanales que tienen al menos un registro business_data, de más reciente a más antiguo. */
  periods: PeriodRead[];
  /** Indexado por `period_id` — recomendaciones que ya han sido generadas. */
  recommendations: Record<string, Recommendation>;
  /** IDs de los periodos cuya recomendación se está generando actualmente. */
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
 * Proporciona todos los datos y acciones necesarios para la pantalla de Recomendaciones.
 *
 * @returns
 * - `periods`        — Periodos semanales seleccionables (tienen datos de negocio)
 * - `recommendations`— Mapa de `period_id → Recommendation` (ya generadas)
 * - `generatingIds`  — IDs de periodos que están esperando la respuesta de la IA
 * - `loadStatus`     — Estado de carga general de la carga inicial de datos
 * - `generate`       — Activa la generación de IA para un periodo; vuelve a lanzar el error si falla
 * - `remove`         — Elimina la recomendación de un periodo de la API y del estado local
 * - `refresh`        — Recarga los periodos y las recomendaciones
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
   * Solicita la generación de IA para el periodo indicado. El `language` del
   * tema activo se pasa al backend para que el texto de la recomendación se
   * devuelva en el idioma seleccionado por el usuario.
   *
   * Marca el periodo como `generating` mientras la solicitud está en curso, y
   * actualiza el mapa de recomendaciones local si tiene éxito. Vuelve a lanzar
   * el error para que la UI pueda mostrar una alerta apropiada.
   *
   * @param periodId - UUID del periodo a analizar
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
   * Elimina la recomendación de un periodo de la API y la quita del estado local
   * para que la UI refleje el cambio de inmediato.
   *
   * @param periodId - UUID del periodo cuya recomendación se quiere eliminar
   */
  const remove = useCallback(async (periodId: string) => {
    await recommendationService.delete(periodId);
    dispatch({ type: 'REMOVE_SUCCESS', periodId });
  }, []);

  return { ...state, generate, remove, refresh: load };
}
