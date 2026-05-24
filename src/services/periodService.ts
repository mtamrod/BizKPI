/**
 * @file periodService.ts
 * @description Servicio API para los registros de periodo.
 *
 * Un `Period` es el rango de tiempo que cubre una entrada de datos de negocio
 * (día, semana o mes). Los periodos son compartidos entre las entradas del
 * usuario — si dos entradas cubren la misma semana, referencian la misma fila
 * `Period` en la base de datos.
 *
 * `findOrCreate` es el punto de entrada principal: evita crear filas de periodo
 * duplicadas comprobando si existe una coincidencia exacta de rango de fechas
 * antes de hacer el POST.
 */

import { apiClient } from '@/lib/apiClient';
import type { PeriodType } from '@/types';

// ─── Backend types ────────────────────────────────────────────────────────────

/** Registro de periodo tal como lo devuelven `GET /periods/` y `POST /periods/`. */
export interface PeriodRead {
  id: string;
  user_id: string;
  /** Granularidad: 'day' | 'week' | 'month' */
  period_type: PeriodType;
  /** Fecha ISO "YYYY-MM-DD" — siempre un lunes para periodos semanales. */
  start_date: string;
  /** Fecha ISO "YYYY-MM-DD" — siempre un domingo para periodos semanales. */
  end_date: string;
  created_at: string | null;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Calcula el par canónico `[start_date, end_date]` para un tipo de periodo dado
 * una fecha de referencia. Se usa para normalizar las fechas seleccionadas por
 * el usuario antes de buscar o crear un registro de periodo.
 *
 * - `'day'`   → la propia fecha de referencia
 * - `'week'`  → la semana ISO lunes–domingo que contiene la fecha de referencia
 * - `'month'` → el primer y último día del mes de la fecha de referencia
 *
 * @param period        - Granularidad del periodo
 * @param referenceDate - Cualquier fecha dentro del periodo deseado ("YYYY-MM-DD")
 */
export function computePeriodDates(
  period: PeriodType,
  referenceDate: string,
): { start_date: string; end_date: string } {
  const d = new Date(`${referenceDate}T00:00:00`);

  if (period === 'day') {
    return { start_date: referenceDate, end_date: referenceDate };
  }

  if (period === 'week') {
    const dow = d.getDay(); // 0 = Sunday
    const diffToMonday = (dow === 0 ? -6 : 1 - dow);
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start_date: monday.toISOString().slice(0, 10),
      end_date: sunday.toISOString().slice(0, 10),
    };
  }

  // month
  const year = d.getFullYear();
  const month = d.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  return {
    start_date: firstDay.toISOString().slice(0, 10),
    end_date: lastDay.toISOString().slice(0, 10),
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const periodService = {
  /**
   * Devuelve todos los registros de periodo del usuario autenticado.
   * Los resultados están en orden de creación (el más reciente al final);
   * los llamantes ordenan según sea necesario.
   */
  async list(): Promise<PeriodRead[]> {
    return apiClient.get<PeriodRead[]>('/periods/');
  },

  /**
   * Devuelve un periodo existente que coincide exactamente con el rango de fechas
   * dado, o crea uno nuevo si no existe ninguno.
   *
   * La coincidencia es exacta: `start_date`, `end_date` y `period_type` deben
   * concordar. Esto evita duplicados fantasma cuando el usuario envía datos de la
   * misma semana dos veces (el segundo envío reutiliza la misma fila de periodo).
   *
   * @param period     - Granularidad del periodo ('day' | 'week' | 'month')
   * @param start_date - Primer día del periodo ("YYYY-MM-DD")
   * @param end_date   - Último día del periodo ("YYYY-MM-DD")
   * @returns El registro de periodo encontrado o recién creado
   */
  async findOrCreate(
    period: PeriodType,
    start_date: string,
    end_date: string,
  ): Promise<PeriodRead> {
    const periods = await periodService.list();
    const existing = periods.find(
      (p) => p.period_type === period && p.start_date === start_date && p.end_date === end_date,
    );
    if (existing) return existing;

    return apiClient.post<PeriodRead>('/periods/', {
      period_type: period,
      start_date,
      end_date,
    });
  },
};
