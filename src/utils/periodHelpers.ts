import type { PeriodType } from '@/types';

// ─── Primitives ───────────────────────────────────────────────────────────────

function pad(n: number) { return n.toString().padStart(2, '0'); }

export function dateToISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isoToDate(iso: string): Date {
  // Use T00:00:00 to avoid timezone shifts
  return new Date(`${iso}T00:00:00`);
}

// ─── Period boundary helpers ──────────────────────────────────────────────────

/** Monday of the week that contains d (weeks are Mon–Sun) */
export function getMondayOfWeek(d: Date): Date {
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon;
}

/** Sunday of the week that contains d */
export function getSundayOfWeek(d: Date): Date {
  const sun = new Date(getMondayOfWeek(d));
  sun.setDate(sun.getDate() + 6);
  return sun;
}

export function getFirstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function getLastOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

// ─── Default period for today ─────────────────────────────────────────────────

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

// ─── Display formatting ───────────────────────────────────────────────────────

const MONTHS_LONG  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

/** DD/MM/YYYY */
export function fmtDDMMYYYY(iso: string): string {
  const d = isoToDate(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** DD/MM (sin año) */
export function fmtDDMM(iso: string): string {
  const d = isoToDate(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

/**
 * Human-readable period label:
 *  day   → "15/05/2026"
 *  week  → "Lun 11/05 – Dom 17/05/2026"
 *  month → "Mayo 2026"
 */
export function formatPeriodRange(
  type: PeriodType,
  startISO: string,
  endISO: string,
): string {
  if (type === 'day') return fmtDDMMYYYY(startISO);

  const s = isoToDate(startISO);
  const e = isoToDate(endISO);

  if (type === 'week') {
    return `Lun ${fmtDDMM(startISO)} – Dom ${fmtDDMM(endISO)}/${e.getFullYear()}`;
  }

  // month
  return `${MONTHS_LONG[s.getMonth()]} ${s.getFullYear()}`;
}
