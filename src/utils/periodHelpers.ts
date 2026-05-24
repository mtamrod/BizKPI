/**
 * @file periodHelpers.ts
 * @description Utility functions for date/period arithmetic used throughout the app.
 * All ISO date strings follow the "YYYY-MM-DD" format.
 */

import type { PeriodType } from '@/types';

// ─── Primitives ───────────────────────────────────────────────────────────────

/** Zero-pads a number to two digits (e.g. 5 → "05"). */
function pad(n: number) { return n.toString().padStart(2, '0'); }

/**
 * Converts a `Date` object to an ISO date string ("YYYY-MM-DD")
 * using local time (avoids UTC offset surprises for display-only use).
 */
export function dateToISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Parses an ISO date string ("YYYY-MM-DD") into a `Date` object.
 * Appends `T00:00:00` to force local-midnight interpretation and prevent
 * timezone shifts from moving the date to the previous day.
 */
export function isoToDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

// ─── Period boundary helpers ──────────────────────────────────────────────────

/**
 * Returns the Monday of the ISO week that contains `d`.
 * Weeks run Monday–Sunday per ISO 8601.
 */
export function getMondayOfWeek(d: Date): Date {
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon;
}

/**
 * Returns the Sunday of the ISO week that contains `d`.
 * Derived from {@link getMondayOfWeek} + 6 days.
 */
export function getSundayOfWeek(d: Date): Date {
  const sun = new Date(getMondayOfWeek(d));
  sun.setDate(sun.getDate() + 6);
  return sun;
}

/** Returns the first day (day 1) of the month that contains `d`. */
export function getFirstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Returns the last day of the month that contains `d`. */
export function getLastOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

// ─── Default period for today ─────────────────────────────────────────────────

/**
 * Returns the default `{ start, end }` ISO date pair for the current date,
 * depending on the period type:
 * - `'day'`   → today
 * - `'week'`  → Monday–Sunday of the current ISO week
 * - `'month'` → first–last day of the current month
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
 * Returns the ISO 8601 week number for a given date string ("YYYY-MM-DD").
 * Week 1 is the week containing January 4th (i.e. the first week with a
 * majority of days in the new year).
 *
 * Uses UTC arithmetic throughout to avoid DST offsets causing off-by-one errors
 * (e.g. Spain's +1h DST shift in late March would make a 140-day span look like
 * 139.958... days in local time, causing Math.floor to return the wrong week).
 *
 * @param dateStr - ISO date string, e.g. "2026-05-11"
 * @returns Week number in the range 1–53
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
 * Formats an ISO date string as "DD/MM/YYYY".
 * @example fmtDDMMYYYY("2026-05-11") → "11/05/2026"
 */
export function fmtDDMMYYYY(iso: string): string {
  const d = isoToDate(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/**
 * Formats an ISO date string as "DD/MM" (no year).
 * Used in compact date ranges like "11/05 – 17/05".
 */
export function fmtDDMM(iso: string): string {
  const d = isoToDate(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

/**
 * Returns the abbreviated weekday name in the given locale,
 * capitalised and stripped of trailing punctuation.
 * e.g. "lun" → "Lun" (es), "Mon" (en)
 */
function shortDay(d: Date, language: string): string {
  return new Intl.DateTimeFormat(language, { weekday: 'short' })
    .format(d)
    .replace(/\.$/, '')
    .replace(/^./, c => c.toUpperCase());
}

/**
 * Returns a human-readable period label localised to `language`:
 * - `'day'`   → `"15/05/2026"`
 * - `'week'`  → `"Lun 11/05 – Dom 17/05/2026"` (weekday names localised)
 * - `'month'` → `"Mayo 2026"` (month name localised)
 *
 * @param type     - Period granularity
 * @param startISO - Start date "YYYY-MM-DD"
 * @param endISO   - End date "YYYY-MM-DD"
 * @param language - BCP 47 language tag, e.g. "es", "en", "fr"
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
