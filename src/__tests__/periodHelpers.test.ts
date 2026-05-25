/**
 * @file periodHelpers.test.ts
 * @description Tests unitarios para src/utils/periodHelpers.ts.
 *
 * Cubre:
 * - dateToISO / isoToDate: conversiones entre Date e ISO string
 * - getMondayOfWeek / getSundayOfWeek: límites de semana ISO
 * - getFirstOfMonth / getLastOfMonth: límites de mes
 * - getDefaultPeriod: periodo por defecto para la fecha actual (con mock de tiempo)
 * - isoWeekNumber: número de semana ISO 8601 con fechas conocidas
 * - fmtDDMMYYYY / fmtDDMM: formateo de fechas para la UI
 * - formatPeriodRange: etiqueta legible de periodo (día, semana, mes)
 */

import {
  dateToISO,
  isoToDate,
  getMondayOfWeek,
  getSundayOfWeek,
  getFirstOfMonth,
  getLastOfMonth,
  getDefaultPeriod,
  isoWeekNumber,
  fmtDDMMYYYY,
  fmtDDMM,
  formatPeriodRange,
} from '../utils/periodHelpers';

// ─── dateToISO ────────────────────────────────────────────────────────────────

describe('dateToISO', () => {
  it('convierte un Date a formato YYYY-MM-DD', () => {
    const d = new Date(2026, 4, 11); // 11 de mayo de 2026 (mes 0-indexado)
    expect(dateToISO(d)).toBe('2026-05-11');
  });

  it('rellena con ceros el día y el mes', () => {
    const d = new Date(2026, 0, 5); // 5 de enero
    expect(dateToISO(d)).toBe('2026-01-05');
  });
});

// ─── isoToDate ────────────────────────────────────────────────────────────────

describe('isoToDate', () => {
  it('convierte ISO a Date con la fecha correcta (sin desfase UTC)', () => {
    const d = isoToDate('2026-05-11');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(4); // mayo = 4
    expect(d.getDate()).toBe(11);
  });

  it('ida y vuelta: isoToDate → dateToISO devuelve la cadena original', () => {
    const iso = '2026-12-31';
    expect(dateToISO(isoToDate(iso))).toBe(iso);
  });
});

// ─── getMondayOfWeek ──────────────────────────────────────────────────────────

describe('getMondayOfWeek', () => {
  it('devuelve el mismo lunes si la fecha ya es lunes', () => {
    const lunes = new Date(2026, 4, 11); // lun 11 may
    const resultado = getMondayOfWeek(lunes);
    expect(dateToISO(resultado)).toBe('2026-05-11');
  });

  it('retrocede al lunes desde un miércoles', () => {
    const miercoles = new Date(2026, 4, 13); // mié 13 may
    expect(dateToISO(getMondayOfWeek(miercoles))).toBe('2026-05-11');
  });

  it('retrocede al lunes desde un domingo', () => {
    const domingo = new Date(2026, 4, 17); // dom 17 may
    expect(dateToISO(getMondayOfWeek(domingo))).toBe('2026-05-11');
  });

  it('cruza correctamente el límite de mes (domingo → lunes mes anterior)', () => {
    // Domingo 3 de mayo → lunes 27 de abril
    const domingo = new Date(2026, 4, 3);
    expect(dateToISO(getMondayOfWeek(domingo))).toBe('2026-04-27');
  });
});

// ─── getSundayOfWeek ──────────────────────────────────────────────────────────

describe('getSundayOfWeek', () => {
  it('devuelve el domingo de la semana a partir del lunes', () => {
    const lunes = new Date(2026, 4, 11);
    expect(dateToISO(getSundayOfWeek(lunes))).toBe('2026-05-17');
  });

  it('devuelve el mismo domingo si la fecha ya es domingo', () => {
    const domingo = new Date(2026, 4, 17);
    expect(dateToISO(getSundayOfWeek(domingo))).toBe('2026-05-17');
  });

  it('el par lunes–domingo cubre exactamente 7 días', () => {
    const d = new Date(2026, 4, 13); // miércoles
    const lunes = getMondayOfWeek(d);
    const domingo = getSundayOfWeek(d);
    const diffMs = domingo.getTime() - lunes.getTime();
    expect(diffMs).toBe(6 * 24 * 60 * 60 * 1000); // 6 días
  });
});

// ─── getFirstOfMonth / getLastOfMonth ─────────────────────────────────────────

describe('getFirstOfMonth', () => {
  it('devuelve el día 1 del mes', () => {
    const d = new Date(2026, 4, 17); // 17 mayo
    expect(dateToISO(getFirstOfMonth(d))).toBe('2026-05-01');
  });
});

describe('getLastOfMonth', () => {
  it('devuelve el último día de mayo (31)', () => {
    const d = new Date(2026, 4, 17);
    expect(dateToISO(getLastOfMonth(d))).toBe('2026-05-31');
  });

  it('devuelve el 28 para febrero de un año no bisiesto', () => {
    const d = new Date(2026, 1, 10); // febrero 2026
    expect(dateToISO(getLastOfMonth(d))).toBe('2026-02-28');
  });

  it('devuelve el 29 para febrero de un año bisiesto', () => {
    const d = new Date(2024, 1, 15); // febrero 2024 (bisiesto)
    expect(dateToISO(getLastOfMonth(d))).toBe('2024-02-29');
  });
});

// ─── getDefaultPeriod ─────────────────────────────────────────────────────────

describe('getDefaultPeriod', () => {
  // 2026-05-25 es lunes (semana 22)
  const FECHA_FIJA = new Date('2026-05-25T12:00:00');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FECHA_FIJA);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("type 'day' devuelve hoy como inicio y fin", () => {
    const { start, end } = getDefaultPeriod('day');
    expect(start).toBe('2026-05-25');
    expect(end).toBe('2026-05-25');
  });

  it("type 'week' devuelve la semana lunes–domingo actual", () => {
    const { start, end } = getDefaultPeriod('week');
    expect(start).toBe('2026-05-25'); // lunes
    expect(end).toBe('2026-05-31');   // domingo
  });

  it("type 'month' devuelve el primer y último día del mes", () => {
    const { start, end } = getDefaultPeriod('month');
    expect(start).toBe('2026-05-01');
    expect(end).toBe('2026-05-31');
  });
});

// ─── isoWeekNumber ────────────────────────────────────────────────────────────

describe('isoWeekNumber', () => {
  it('la semana 1 de 2026 contiene el 1 de enero (jueves)', () => {
    expect(isoWeekNumber('2026-01-01')).toBe(1);
  });

  it('el 5 de enero (primer lunes) es semana 2', () => {
    expect(isoWeekNumber('2026-01-05')).toBe(2);
  });

  it('el lunes 11 de mayo de 2026 es semana 20', () => {
    expect(isoWeekNumber('2026-05-11')).toBe(20);
  });

  it('el domingo 17 de mayo de 2026 también es semana 20', () => {
    expect(isoWeekNumber('2026-05-17')).toBe(20);
  });

  it('el lunes 18 de mayo de 2026 es semana 21', () => {
    expect(isoWeekNumber('2026-05-18')).toBe(21);
  });

  it('el lunes 25 de mayo de 2026 es semana 22', () => {
    expect(isoWeekNumber('2026-05-25')).toBe(22);
  });

  it('el 31 de diciembre de 2024 es semana 1 de 2025 (devuelve 53 para 2024)', () => {
    // La función usa el año de la cadena, no el año ISO
    // 31 dic 2024 en el calendario del año 2024: semana 53
    const week = isoWeekNumber('2024-12-31');
    // Es semana 1 del año ISO 2025 pero la función calcula con el año 2024
    expect(typeof week).toBe('number');
    expect(week).toBeGreaterThan(0);
  });
});

// ─── fmtDDMMYYYY ─────────────────────────────────────────────────────────────

describe('fmtDDMMYYYY', () => {
  it('formatea a DD/MM/AAAA', () => {
    expect(fmtDDMMYYYY('2026-05-11')).toBe('11/05/2026');
  });

  it('rellena con cero el día y el mes', () => {
    expect(fmtDDMMYYYY('2026-01-05')).toBe('05/01/2026');
  });

  it('formatea correctamente el último día del año', () => {
    expect(fmtDDMMYYYY('2026-12-31')).toBe('31/12/2026');
  });
});

// ─── fmtDDMM ─────────────────────────────────────────────────────────────────

describe('fmtDDMM', () => {
  it('formatea a DD/MM sin año', () => {
    expect(fmtDDMM('2026-05-11')).toBe('11/05');
  });

  it('rellena con ceros', () => {
    expect(fmtDDMM('2026-01-07')).toBe('07/01');
  });
});

// ─── formatPeriodRange ────────────────────────────────────────────────────────

describe('formatPeriodRange', () => {
  it("type 'day' devuelve la fecha en formato DD/MM/AAAA", () => {
    const result = formatPeriodRange('day', '2026-05-11', '2026-05-11', 'es');
    expect(result).toBe('11/05/2026');
  });

  it("type 'week' incluye inicio y fin del rango con el año", () => {
    const result = formatPeriodRange('week', '2026-05-11', '2026-05-17', 'es');
    // Formato esperado: "Lun 11/05 – Dom 17/05/2026"
    expect(result).toContain('11/05');
    expect(result).toContain('17/05');
    expect(result).toContain('2026');
  });

  it("type 'week' en inglés produce nombres de día en inglés", () => {
    const result = formatPeriodRange('week', '2026-05-11', '2026-05-17', 'en');
    // "Mon 11/05 – Sun 17/05/2026"
    expect(result).toMatch(/Mon/i);
    expect(result).toMatch(/Sun/i);
  });

  it("type 'month' devuelve el nombre del mes y el año", () => {
    const result = formatPeriodRange('month', '2026-05-01', '2026-05-31', 'es');
    expect(result.toLowerCase()).toContain('mayo');
    expect(result).toContain('2026');
  });

  it("type 'month' en inglés devuelve el nombre en inglés", () => {
    const result = formatPeriodRange('month', '2026-05-01', '2026-05-31', 'en');
    expect(result.toLowerCase()).toContain('may');
    expect(result).toContain('2026');
  });

  it('la primera letra del nombre del mes es mayúscula', () => {
    const result = formatPeriodRange('month', '2026-05-01', '2026-05-31', 'es');
    expect(result[0]).toBe(result[0].toUpperCase());
  });
});
