/**
 * @file periodHelpers.ts
 * @description Funciones de utilidad para aritmética de fechas y periodos
 * usadas en toda la app. Todas las cadenas de fecha ISO siguen el formato "YYYY-MM-DD".
 */

import type { PeriodType } from '@/types';

// ─── Primitives ───────────────────────────────────────────────────────────────

/** Rellena un número con ceros a la izquierda hasta dos dígitos (p. ej. 5 → "05"). */
function pad(n: number) { return n.toString().padStart(2, '0'); }

/**
 * Convierte un objeto `Date` a cadena de fecha ISO ("YYYY-MM-DD") usando hora
 * local (evita sorpresas por desfase UTC en usos puramente de visualización).
 */
export function dateToISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Convierte una cadena de fecha ISO ("YYYY-MM-DD") en un objeto `Date`.
 * Añade `T00:00:00` para forzar la interpretación a medianoche local y evitar
 * que el desfase de zona horaria desplace la fecha al día anterior.
 */
export function isoToDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

// ─── Period boundary helpers ──────────────────────────────────────────────────

/**
 * Devuelve el lunes de la semana ISO que contiene `d`.
 * Las semanas van de lunes a domingo según ISO 8601.
 */
export function getMondayOfWeek(d: Date): Date {
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon;
}

/**
 * Devuelve el domingo de la semana ISO que contiene `d`.
 * Se calcula a partir de {@link getMondayOfWeek} + 6 días.
 */
export function getSundayOfWeek(d: Date): Date {
  const sun = new Date(getMondayOfWeek(d));
  sun.setDate(sun.getDate() + 6);
  return sun;
}

/** Devuelve el primer día del mes que contiene `d`. */
export function getFirstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Devuelve el último día del mes que contiene `d`. */
export function getLastOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

// ─── Default period for today ─────────────────────────────────────────────────

/**
 * Devuelve el par de fechas ISO `{ start, end }` por defecto para la fecha
 * actual según el tipo de periodo:
 * - `'day'`   → hoy
 * - `'week'`  → lunes–domingo de la semana ISO actual
 * - `'month'` → primer–último día del mes actual
 */
export function getDefaultPeriod(type: PeriodType): { start: string; end: string } {
  const today = new Date();
  if (type === 'day') {
    const iso = dateToISO(today);
    return { start: iso, end: iso };
  }
  if (type === 'week') {
    return {
      start: dateToISO(getMondayOfWeek(today)),
      end:   dateToISO(getSundayOfWeek(today)),
    };
  }
  // month
  return {
    start: dateToISO(getFirstOfMonth(today)),
    end:   dateToISO(getLastOfMonth(today)),
  };
}

// ─── ISO week number ─────────────────────────────────────────────────────────

/**
 * Devuelve el número de semana ISO 8601 para una cadena de fecha ("YYYY-MM-DD").
 * La semana 1 es la que contiene el 4 de enero (es decir, la primera semana
 * con mayoría de días en el año nuevo).
 *
 * Usa aritmética UTC en todo momento para evitar errores de ±1 por el horario
 * de verano (p. ej., el cambio de +1h de España a finales de marzo haría que un
 * intervalo de 140 días parezca 139,958... días en hora local, provocando que
 * Math.floor devuelva la semana incorrecta).
 *
 * @param dateStr - Cadena de fecha ISO, p. ej. "2026-05-11"
 * @returns Número de semana en el rango 1–53
 */
export function isoWeekNumber(dateStr: string): number {
  const [y, m, dd] = dateStr.slice(0, 10).split('-').map(Number) as [number, number, number];
  const d = Date.UTC(y, m - 1, dd);

  // Monday of ISO week 1 = Monday on or before Jan 4
  const jan4 = Date.UTC(y, 0, 4);
  const jan4Dow = new Date(jan4).getUTCDay(); // 0 = Sun
  const weekOneMonday = jan4 - ((jan4Dow + 6) % 7) * 86400000;

  return Math.floor((d - weekOneMonday) / (7 * 86400000)) + 1;
}

// ─── Display formatting ───────────────────────────────────────────────────────

/**
 * Formatea una cadena de fecha ISO como "DD/MM/AAAA".
 * @example fmtDDMMYYYY("2026-05-11") → "11/05/2026"
 */
export function fmtDDMMYYYY(iso: string): string {
  const d = isoToDate(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/**
 * Formatea una cadena de fecha ISO como "DD/MM" (sin año).
 * Usado en rangos de fecha compactos como "11/05 – 17/05".
 */
export function fmtDDMM(iso: string): string {
  const d = isoToDate(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

/**
 * Devuelve el nombre abreviado del día de la semana en el idioma dado,
 * con mayúscula inicial y sin puntuación final.
 * P. ej. "lun" → "Lun" (es), "Mon" (en)
 */
function shortDay(d: Date, language: string): string {
  return new Intl.DateTimeFormat(language, { weekday: 'short' })
    .format(d)
    .replace(/\.$/, '')
    .replace(/^./, c => c.toUpperCase());
}

/**
 * Devuelve una etiqueta de periodo legible, localizada en `language`:
 * - `'day'`   → `"15/05/2026"`
 * - `'week'`  → `"Lun 11/05 – Dom 17/05/2026"` (nombres de día localizados)
 * - `'month'` → `"Mayo 2026"` (nombre del mes localizado)
 *
 * @param type     - Granularidad del periodo
 * @param startISO - Fecha de inicio "YYYY-MM-DD"
 * @param endISO   - Fecha de fin "YYYY-MM-DD"
 * @param language - Etiqueta de idioma BCP 47, p. ej. "es", "en", "fr"
 */
export function formatPeriodRange(
  type: PeriodType,
  startISO: string,
  endISO: string,
  language = 'es',
): string {
  if (type === 'day') return fmtDDMMYYYY(startISO);

  const s = isoToDate(startISO);
  const e = isoToDate(endISO);

  if (type === 'week') {
    const monLabel = shortDay(s, language);
    const sunLabel = shortDay(e, language);
    return `${monLabel} ${fmtDDMM(startISO)} – ${sunLabel} ${fmtDDMM(endISO)}/${e.getFullYear()}`;
  }

  // month
  const monthName = new Intl.DateTimeFormat(language, { month: 'long' }).format(s);
  return `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${s.getFullYear()}`;
}
