/**
 * @file useKPIs.ts
 * @description Hook que carga los datos KPI del dashboard desde `kpiService`
 * y los expone con el patrón de estado asíncrono estándar.
 *
 * Vuelve a cargar automáticamente cuando cambia `companyId`, `currency` o `language`.
 * La dependencia de `language` es intencional: `kpiService.getDashboard` llama a
 * `i18n.t` para formatear etiquetas y titulares, por lo que el hook debe recargar
 * al cambiar el idioma para obtener las nuevas traducciones.
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
 * Carga y gestiona el payload `DashboardData` para la pantalla de inicio.
 *
 * @param companyId - ID de la empresa / usuario autenticado actualmente
 * @param currency  - Símbolo de moneda que se pasa a `kpiService` (por defecto `'€'`)
 * @param language  - Código de idioma activo; provoca una recarga al cambiar para
 *   que las etiquetas formateadas se reconstruyan en el nuevo idioma (por defecto `'es'`)
 *
 * @returns
 * - `data`    — El objeto `DashboardData` completo, o `null` mientras carga
 * - `status`  — `'idle' | 'loading' | 'success' | 'error'`
 * - `error`   — Mensaje de error o `null`
 * - `refresh` — Fuerza una nueva carga manual (usado por pull-to-refresh)
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
