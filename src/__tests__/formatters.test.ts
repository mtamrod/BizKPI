/**
 * @file formatters.test.ts
 * @description Tests unitarios para src/utils/formatters.ts.
 *
 * Cubre todas las funciones del objeto `fmt`:
 * - currency: formato de divisa con símbolo, miles (k) y millones (M)
 * - number: formato numérico sin símbolo
 * - percent: formato de porcentaje con decimales configurables
 * - trend: flecha de tendencia con signo explícito
 * - date / shortDate: conversión ISO → DD/MM/AAAA
 * - relativeDate: texto relativo ("Hoy", "Ayer", "Hace N días")
 * - initials: extracción de iniciales de un nombre
 */

import { fmt } from '../utils/formatters';

// ─── fmt.currency ─────────────────────────────────────────────────────────────

describe('fmt.currency', () => {
  it('devuelve el símbolo de guion para null', () => {
    expect(fmt.currency(null)).toBe('€—');
  });

  it('devuelve el símbolo de guion para undefined', () => {
    expect(fmt.currency(undefined)).toBe('€—');
  });

  it('devuelve el símbolo de guion para Infinity', () => {
    expect(fmt.currency(Infinity)).toBe('€—');
  });

  it('formatea millones con una decimal', () => {
    expect(fmt.currency(1_000_000)).toBe('€1.0M');
    expect(fmt.currency(2_500_000)).toBe('€2.5M');
  });

  it('formatea miles con k y una decimal', () => {
    expect(fmt.currency(1_500)).toBe('€1.5k');
    expect(fmt.currency(5_000)).toBe('€5.0k');
    expect(fmt.currency(10_000)).toBe('€10.0k');
  });

  it('formatea cero correctamente', () => {
    expect(fmt.currency(0)).toBe('€0');
  });

  it('formatea valores pequeños con el símbolo €', () => {
    const result = fmt.currency(500);
    expect(result).toMatch(/^€/);
    expect(result).toContain('500');
  });

  it('permite cambiar el símbolo de divisa', () => {
    expect(fmt.currency(1_500, '$')).toBe('$1.5k');
    expect(fmt.currency(null, '$')).toBe('$—');
  });
});

// ─── fmt.number ───────────────────────────────────────────────────────────────

describe('fmt.number', () => {
  it('devuelve guion para null', () => {
    expect(fmt.number(null)).toBe('—');
  });

  it('devuelve guion para undefined', () => {
    expect(fmt.number(undefined)).toBe('—');
  });

  it('devuelve guion para NaN (no finite)', () => {
    expect(fmt.number(NaN)).toBe('—');
  });

  it('formatea millones con M', () => {
    expect(fmt.number(3_200_000)).toBe('3.2M');
  });

  it('formatea miles con k', () => {
    expect(fmt.number(2_750)).toBe('2.8k'); // 2750 / 1000 = 2.75 → toFixed(1) = "2.8"
  });

  it('formatea cero sin sufijo', () => {
    expect(fmt.number(0)).toBe('0');
  });
});

// ─── fmt.percent ──────────────────────────────────────────────────────────────

describe('fmt.percent', () => {
  it('devuelve guion con % para null', () => {
    expect(fmt.percent(null)).toBe('—%');
  });

  it('devuelve guion con % para undefined', () => {
    expect(fmt.percent(undefined)).toBe('—%');
  });

  it('formatea con 2 decimales por defecto', () => {
    expect(fmt.percent(25.5)).toBe('25.50%');
    expect(fmt.percent(100)).toBe('100.00%');
  });

  it('formatea con 0 decimales cuando se especifica', () => {
    expect(fmt.percent(33.3, 0)).toBe('33%');
  });

  it('formatea con 1 decimal cuando se especifica', () => {
    expect(fmt.percent(15.25, 1)).toBe('15.3%');
  });

  it('formatea valores negativos', () => {
    expect(fmt.percent(-5.75)).toBe('-5.75%');
  });

  it('formatea cero', () => {
    expect(fmt.percent(0)).toBe('0.00%');
  });
});

// ─── fmt.trend ────────────────────────────────────────────────────────────────

describe('fmt.trend', () => {
  it('añade signo + a valores positivos', () => {
    expect(fmt.trend(5.2)).toBe('+5.2%');
  });

  it('no añade + extra a valores negativos', () => {
    expect(fmt.trend(-3.1)).toBe('-3.1%');
  });

  it('trata el cero como positivo (+0.0%)', () => {
    expect(fmt.trend(0)).toBe('+0.0%');
  });

  it('usa siempre una decimal', () => {
    expect(fmt.trend(10)).toBe('+10.0%');
    expect(fmt.trend(-10)).toBe('-10.0%');
  });
});

// ─── fmt.date / fmt.shortDate ─────────────────────────────────────────────────

describe('fmt.date', () => {
  it('convierte ISO a DD/MM/AAAA', () => {
    expect(fmt.date('2026-05-11')).toBe('11/05/2026');
  });

  it('convierte el 1 de enero correctamente', () => {
    expect(fmt.date('2026-01-01')).toBe('01/01/2026');
  });

  it('devuelve guion para cadena vacía', () => {
    expect(fmt.date('')).toBe('—');
  });
});

describe('fmt.shortDate', () => {
  it('produce el mismo resultado que fmt.date', () => {
    expect(fmt.shortDate('2026-12-31')).toBe('31/12/2026');
    expect(fmt.shortDate('')).toBe('—');
  });
});

// ─── fmt.relativeDate ─────────────────────────────────────────────────────────

describe('fmt.relativeDate', () => {
  const BASE = new Date('2026-05-25T12:00:00');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(BASE);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('devuelve "Hoy" para la fecha actual', () => {
    expect(fmt.relativeDate('2026-05-25')).toBe('Hoy');
  });

  it('devuelve "Ayer" para el día anterior', () => {
    expect(fmt.relativeDate('2026-05-24')).toBe('Ayer');
  });

  it('devuelve "Hace N días" para fechas más antiguas', () => {
    expect(fmt.relativeDate('2026-05-22')).toBe('Hace 3 días');
  });

  it('devuelve "Hace 7 días" para hace una semana', () => {
    expect(fmt.relativeDate('2026-05-18')).toBe('Hace 7 días');
  });
});

// ─── fmt.initials ─────────────────────────────────────────────────────────────

describe('fmt.initials', () => {
  it('extrae las dos primeras iniciales en mayúscula', () => {
    expect(fmt.initials('Juan García')).toBe('JG');
  });

  it('solo usa la primera inicial si hay un nombre único', () => {
    expect(fmt.initials('María')).toBe('M');
  });

  it('ignora palabras adicionales después de la segunda', () => {
    expect(fmt.initials('Ana María López')).toBe('AM');
  });

  it('devuelve vacío para cadena vacía', () => {
    expect(fmt.initials('')).toBe('');
  });
});
