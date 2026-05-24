/**
 * @file useDataEntries.ts
 * @description Hook para gestionar la lista de entradas de datos de negocio
 * en la pestaña Datos.
 *
 * Patrón de UI optimista:
 * - `addEntry` inserta inmediatamente una entrada temporal en el estado local
 *   para que la lista se actualice sin esperar la respuesta del servidor.
 * - Si tiene éxito, la entrada temporal se reemplaza por una sincronización
 *   real con el servidor (`load()`).
 * - Si falla, la entrada temporal se revierte mediante `ADD_ROLLBACK`.
 *
 * `replaceEntry` es intencionalmente no optimista — elimina un registro
 * existente antes de crear uno nuevo, por lo que un fallo parcial dejaría los
 * datos en un estado inconsistente. El usuario ya confirmó la acción
 * destructiva, así que mostramos un indicador de carga y hacemos una recarga
 * limpia después.
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
  /** Inserta inmediatamente una entrada provisional antes de que el servidor confirme. */
  | { type: 'ADD_OPTIMISTIC'; entry: DataEntry }
  /** Elimina la entrada provisional si la solicitud al servidor falló. */
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
 * Proporciona la lista de entradas y las funciones de mutación para la pestaña Datos.
 *
 * @param companyId - ID del usuario/empresa autenticado actualmente
 *
 * @returns
 * - `entries`      — Lista de entradas de datos, más reciente primero
 * - `status`       — `'idle' | 'loading' | 'success' | 'error'`
 * - `error`        — Mensaje de error o null
 * - `addEntry`     — Crea una nueva entrada con actualización de UI optimista
 * - `replaceEntry` — Sobreescribe una entrada existente (se usa cuando ya existe una semana)
 * - `refresh`      — Recarga las entradas desde la API
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
   * Añade una nueva entrada de datos de negocio.
   *
   * Se inserta inmediatamente un marcador de posición optimista (con ID
   * prefijado con `temp_`) para que la lista responda rápido. Tras el éxito
   * de la llamada a la API, una recarga completa reemplaza el marcador por el
   * registro real del servidor. Si la llamada falla, el marcador se elimina y
   * el error se vuelve a lanzar.
   *
   * @param input - Datos del formulario (sin `companyId`, que se inyecta aquí)
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
   * Reemplaza una entrada existente de una semana ya registrada por el usuario.
   * Antes de crear el nuevo registro:
   * 1. Elimina silenciosamente cualquier recomendación de IA para el periodo (ya está obsoleta).
   * 2. Elimina el antiguo registro `business_data` (y sus KPIs por cascada).
   * 3. Crea un nuevo registro con las cifras actualizadas.
   *
   * Sin actualización optimista — el usuario confirmó la acción destructiva,
   * por lo que una recarga limpia es preferible a un error visual ante un fallo.
   *
   * @param oldId    - `business_data.id` del registro a reemplazar
   * @param periodId - UUID del periodo asociado (para eliminar la recomendación)
   * @param input    - Nuevos datos del formulario
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
