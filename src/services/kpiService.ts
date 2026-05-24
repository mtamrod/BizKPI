/**
 * @file kpiService.ts
 * @description Servicio que obtiene datos brutos de la API y construye el
 * payload `DashboardData` completo consumido por la pantalla de inicio.
 *
 * El punto de entrada principal es `kpiService.getDashboard`. Internamente:
 * 1. Obtiene KPIs, registros de business_data y periodos en paralelo.
 * 2. Usa `business_data` como fuente de verdad — si no hay registros,
 *    devuelve un dashboard vacío en lugar de mostrar KPIs obsoletos.
 * 3. Deduplica KPIs por `period_id` (conserva solo el más reciente por periodo).
 * 4. Ordena todos los KPIs ascendentemente por start_date del periodo para que
 *    las series de gráficas siempre tengan la semana actual en el extremo derecho.
 * 5. Construye métricas, series de gráficas, segmentos de categoría y un titular
 *    a partir de los datos de la última semana (y opcionalmente de la penúltima).
 *
 * Todos los textos formateados pasan por `i18n.t` para que el dashboard se
 * actualice automáticamente al cambiar de idioma.
 */

import { apiClient } from '@/lib/apiClient';
import { isoWeekNumber } from '@/utils/periodHelpers';
import i18n from '@/i18n';
import type { CategorySegment, ChartPoint, DashboardData, KpiMetric } from '@/types';
import type { PeriodRead } from './periodService';

const t = (key: string, opts?: Record<string, unknown>) => i18n.t(key, opts);

// ─── Backend types ────────────────────────────────────────────────────────────

/**
 * Registro de KPI tal como lo devuelve el endpoint `/kpis/`.
 * Calculado en el servidor a partir del registro `business_data` asociado.
 */
interface KpiRead {
  id: string;
  period_id: string;
  user_id: string;
  revenue: number;
  expenses: number;
  net_profit: number;
  /** Margen de beneficio expresado como porcentaje (0–100). */
  profit_margin: number;
  num_sales: number;
  num_customers: number;
  avg_ticket: number;
  gross_margin: number | null;
  customer_acquisition_rate: number | null;
  returning_customer_rate: number | null;
  calculated_at: string | null;
}

/**
 * Registro de datos de negocio tal como lo devuelve el endpoint `/business-data/`.
 * Contiene los valores brutos introducidos por el usuario; los campos opcionales
 * son `null` si no se proporcionaron.
 */
interface BusinessDataRead {
  id: string;
  period_id: string;
  user_id: string;
  total_revenue: number;
  total_expenses: number;
  num_sales: number;
  num_customers: number;
  cost_of_goods_sold: number | null;
  marketing_expenses: number | null;
  refunds: number | null;
  new_customers: number | null;
  returning_customers: number | null;
  top_product_name: string | null;
  top_product_revenue: number | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

/**
 * Convierte de forma segura cualquier valor numérico/null/undefined a `number`.
 * Devuelve `0` para `NaN`, `null` o `undefined` para evitar que la aritmética
 * posterior produzca valores `NaN` inesperados.
 *
 * @param v - El valor a convertir
 */
function n(v: number | null | undefined): number {
  const num = Number(v);
  return isNaN(num) ? 0 : num;
}

/**
 * Formatea un valor monetario como cadena compacta con el símbolo de moneda indicado.
 *
 * - ≥ 1 000 000 → `€1.2M`
 * - ≥ 1 000     → `€12.5k`
 * - < 1 000     → `€345` (redondeado, formato local)
 *
 * @param value  - Importe numérico bruto (null/undefined → se trata como 0)
 * @param symbol - Prefijo de moneda, p. ej. `'€'` o `'$'`
 */
function formatCurrency(value: number | null | undefined, symbol = '€'): string {
  const v = n(value);
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `${symbol}${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (v >= 1_000) {
    const k = v / 1_000;
    return `${symbol}${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `${symbol}${Math.round(v).toLocaleString('es-ES')}`;
}

/**
 * Formatea un valor de porcentaje (0–100) con un decimal, p. ej. `"23.4%"`.
 *
 * @param value - Porcentaje (null/undefined → se trata como 0)
 */
function formatPct(value: number | null | undefined): string {
  return `${n(value).toFixed(1)}%`;
}

/**
 * Calcula la variación porcentual semana a semana de `previous` a `current`.
 * Devuelve `0` si `previous` es cero (evita la división entre cero).
 *
 * @param current  - Valor del periodo actual
 * @param previous - Valor del periodo anterior
 */
function pctDelta(current: number | null | undefined, previous: number | null | undefined): number {
  const c = n(current);
  const p = n(previous);
  if (p === 0) return 0;
  return ((c - p) / p) * 100;
}

/**
 * Devuelve una etiqueta corta de semana para los ticks del eje X de las gráficas.
 *
 * - Mismo año que `currentYear` → `"S20"` (número de semana abreviado)
 * - Año distinto                → `"S1 '26"` (incluye el año en 2 dígitos)
 * - Periodo no encontrado       → `"S<fallbackIndex + 1>"` (índice base 1 de reserva)
 *
 * @param period        - El `PeriodRead` cuya start_date indica el lunes de la semana
 * @param fallbackIndex - Índice base 0 utilizado cuando `period` es undefined
 * @param currentYear   - El año natural actual (para optimizar el caso del mismo año)
 */
function weekLabel(
  period: PeriodRead | undefined,
  fallbackIndex: number,
  currentYear: number,
): string {
  const abbr = t('week_abbr');
  if (!period) return `${abbr}${fallbackIndex + 1}`;
  const d = new Date(`${period.start_date}T00:00:00`);
  const week = isoWeekNumber(period.start_date);
  const year = d.getFullYear();
  return year === currentYear ? `${abbr}${week}` : `${abbr}${week} '${String(year).slice(2)}`;
}

// ─── Dashboard builders ───────────────────────────────────────────────────────

/**
 * Construye las cuatro tarjetas `KpiMetric` mostradas en el dashboard.
 *
 * Cada métrica incluye:
 * - `formattedValue` — cadena lista para mostrar (moneda o cantidad)
 * - `delta`          — variación absoluta semana a semana (siempre ≥ 0;
 *   la dirección la indica `trend`)
 * - `trend`          — `'up'` o `'down'`
 *
 * Si no existe semana anterior (`prev === undefined`), todos los deltas son `0`
 * con tendencia `'up'` para que los nuevos usuarios vean indicadores neutros.
 *
 * @param latest   - KPIs de la semana más reciente
 * @param prev     - KPIs de la semana anterior, o `undefined` si no existe
 * @param currency - Símbolo de moneda que se pasa a `formatCurrency`
 */
function buildMetrics(latest: KpiRead, prev: KpiRead | undefined, currency: string): KpiMetric[] {
  const revDelta = prev ? pctDelta(latest.revenue, prev.revenue) : 0;
  const custDelta = prev ? pctDelta(latest.num_customers, prev.num_customers) : 0;
  const marginDelta = prev ? n(latest.profit_margin) - n(prev.profit_margin) : 0;
  const salesDelta = prev ? pctDelta(latest.num_sales, prev.num_sales) : 0;

  return [
    {
      id: 'revenue',
      label: t('metric_revenue'),
      value: n(latest.revenue),
      formattedValue: formatCurrency(latest.revenue, currency),
      delta: Math.abs(revDelta),
      deltaLabel: t('metric_delta_prev'),
      trend: revDelta >= 0 ? 'up' : 'down',
      icon: 'cash',
    },
    {
      id: 'customers',
      label: t('metric_customers'),
      value: n(latest.num_customers),
      formattedValue: n(latest.num_customers).toLocaleString(),
      delta: Math.abs(custDelta),
      deltaLabel: t('metric_delta_customers'),
      trend: custDelta >= 0 ? 'up' : 'down',
      icon: 'people',
    },
    {
      id: 'margin',
      label: t('metric_margin'),
      value: n(latest.profit_margin),
      formattedValue: formatPct(latest.profit_margin),
      delta: Math.abs(marginDelta),
      deltaLabel: t('metric_delta_margin'),
      trend: marginDelta >= 0 ? 'up' : 'down',
      icon: 'pulse',
    },
    {
      id: 'sales',
      label: t('metric_sales'),
      value: n(latest.num_sales),
      formattedValue: n(latest.num_sales).toLocaleString(),
      delta: Math.abs(salesDelta),
      deltaLabel: t('metric_delta_sales'),
      trend: salesDelta >= 0 ? 'up' : 'down',
      icon: 'cart',
    },
  ];
}

/**
 * Construye el array `CategorySegment[]` utilizado por el DonutChart del dashboard.
 *
 * Dos modos según los datos disponibles:
 * 1. **Detallado** (cuando `cost_of_goods_sold` Y `marketing_expenses` están
 *    presentes): 4 segmentos — Beneficio · COGS · Marketing · Otros gastos.
 * 2. **Simplificado** (cuando alguno de los campos es null): 2 segmentos —
 *    Beneficio vs. Gastos (división simple por margen).
 *
 * Los valores se expresan como porcentajes redondeados del total para que los
 * segmentos sumen siempre 100 (±1 por redondeo). Los segmentos con valor 0 %
 * se filtran para evitar arcos invisibles en el donut.
 *
 * @param latest      - KPIs de la semana más reciente
 * @param latestBData - Registro de datos de negocio de la misma semana (puede ser undefined)
 */
function buildCategorySeries(latest: KpiRead, latestBData: BusinessDataRead | undefined): CategorySegment[] {
  const revenue = n(latest.revenue) || 1;
  const netProfit = Math.max(0, n(latest.net_profit));
  const cogs = latestBData?.cost_of_goods_sold ?? null;
  const marketing = latestBData?.marketing_expenses ?? null;

  if (cogs !== null && marketing !== null) {
    const otherExpenses = Math.max(0, latest.expenses - cogs - marketing);
    const total = netProfit + cogs + marketing + otherExpenses || 1;
    return [
      { id: 'profit',    label: t('kpi_cat_profit'),   value: Math.round((netProfit / total) * 100), color: '#10B981' },
      { id: 'cogs',      label: t('kpi_cat_cogs'),     value: Math.round((cogs / total) * 100),      color: '#7C3AED' },
      { id: 'marketing', label: 'Marketing',           value: Math.round((marketing / total) * 100), color: '#F59E0B' },
      { id: 'other',     label: t('kpi_cat_other'),    value: Math.round((otherExpenses / total) * 100), color: '#3B82F6' },
    ].filter((s) => s.value > 0);
  }

  // Fallback: profit vs. expenses split
  const expensePct = Math.round((latest.expenses / revenue) * 100);
  const profitPct = 100 - expensePct;
  return [
    { id: 'profit',   label: t('kpi_cat_profit'),   value: Math.max(0, profitPct),  color: '#10B981' },
    { id: 'expenses', label: t('kpi_cat_expenses'), value: Math.max(0, expensePct), color: '#7C3AED' },
  ];
}

/**
 * Genera el titular motivacional y el subtítulo mostrados en la parte superior
 * del dashboard en función del margen de beneficio de la última semana:
 *
 * - **≥ 20 %** → mensaje de rendimiento fuerte con margen + ticket medio
 * - **≥ 0 %**  → mensaje de rendimiento estable con margen
 * - **< 0 %**  → aviso de pérdidas con el importe neto absoluto
 *
 * Todos los textos provienen de i18n para localizarse automáticamente.
 *
 * @param latest   - KPIs de la semana más reciente
 * @param currency - Símbolo de moneda para formatear importes
 */
function buildHeadline(latest: KpiRead, currency: string): { headline: string; subtitle: string } {
  const margin = n(latest.profit_margin);
  if (margin >= 20) {
    return {
      headline: t('kpi_headline_strong'),
      subtitle: t('kpi_headline_strong_sub', { margin: margin.toFixed(1), ticket: formatCurrency(latest.avg_ticket, currency) }),
    };
  }
  if (margin >= 0) {
    return {
      headline: t('kpi_headline_stable'),
      subtitle: t('kpi_headline_stable_sub', { margin: margin.toFixed(1) }),
    };
  }
  return {
    headline: t('kpi_headline_negative'),
    subtitle: t('kpi_headline_negative_sub', { loss: formatCurrency(Math.abs(n(latest.net_profit)), currency) }),
  };
}

// ─── Empty state ──────────────────────────────────────────────────────────────

/**
 * Crea una `KpiMetric` de marcador de posición con valores a cero y el texto `'—'`.
 * Se usa para poblar el dashboard cuando todavía no hay datos.
 *
 * @param id       - Identificador estable de la métrica (p. ej. `'revenue'`)
 * @param labelKey - Clave i18n para la etiqueta de la métrica
 * @param icon     - Nombre del icono en Ionicons
 */
function emptyMetric(id: string, labelKey: string, icon: KpiMetric['icon']): KpiMetric {
  return {
    id,
    label: t(labelKey),
    value: 0,
    formattedValue: '—',
    delta: 0,
    deltaLabel: t('metric_no_data'),
    trend: 'up',
    icon,
  };
}

function getEmptyDashboard(): DashboardData {
  return {
    headline: t('kpi_empty_headline'),
    subtitle: t('kpi_empty_subtitle'),
    metrics: [
      emptyMetric('revenue',   'metric_revenue',   'cash'),
      emptyMetric('customers', 'metric_customers', 'people'),
      emptyMetric('margin',    'metric_margin',    'pulse'),
      emptyMetric('sales',     'metric_sales',     'cart'),
    ],
    revenueSeries: [],
    weeklySeries: [],
    categorySeries: [],
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const kpiService = {
  /**
   * Obtiene todos los datos necesarios y ensambla un objeto `DashboardData`
   * completo listo para ser consumido directamente por la pantalla de inicio.
   *
   * Flujo de datos:
   * 1. Obtiene `/kpis/`, `/business-data/` y `/periods/` en paralelo.
   * 2. Devuelve `getEmptyDashboard()` si no hay registros de `business_data`.
   * 3. Filtra los KPIs cuyo periodo ya no tiene registro `business_data`
   *    (protege frente a registros obsoletos tras un borrado).
   * 4. Deduplica KPIs por `period_id` (se conserva solo la primera ocurrencia,
   *    ya que la API los devuelve del más reciente al más antiguo).
   * 5. Ordena ascendentemente por `period.start_date` para que las series de
   *    gráficas vayan cronológicamente de izquierda a derecha.
   * 6. Construye métricas (últimas 2 semanas), serie de ingresos (últimas 6),
   *    serie de ventas (últimas 7), segmentos de categoría y un titular contextual.
   *
   * @param _companyId - ID de la empresa autenticada actualmente (reservado para
   *   filtrado multi-tenant en una versión futura de la API; ignorado por ahora)
   * @param currency   - Símbolo de moneda antepuesto a los valores monetarios (por defecto `'€'`)
   */
  async getDashboard(_companyId: string, currency = '€'): Promise<DashboardData> {
    // Fetch all data in parallel
    const [kpis, bDataList, periods] = await Promise.all([
      apiClient.get<KpiRead[]>('/kpis/'),
      apiClient.get<BusinessDataRead[]>('/business-data/'),
      apiClient.get<PeriodRead[]>('/periods/'),
    ]);

    // business_data is the source of truth: if there are no entries the user
    // has created, show the empty state regardless of stale KPI records.
    if (!bDataList.length) return getEmptyDashboard();

    // Only keep KPIs whose period still has business_data (guards against
    // stale KPI records left after deleting business_data entries).
    const activePeriodIds = new Set(bDataList.map((bd) => bd.period_id));

    // Deduplicate KPIs by period_id — keep only the latest per period
    const seenPeriods = new Set<string>();
    const uniqueKpis = kpis.filter((k) => {
      if (!activePeriodIds.has(k.period_id)) return false;
      if (seenPeriods.has(k.period_id)) return false;
      seenPeriods.add(k.period_id);
      return true;
    });

    // If all KPIs are stale (no matching business_data) show empty state
    if (!uniqueKpis.length) return getEmptyDashboard();

    // Build period lookup map
    const periodMap = new Map(periods.map((p) => [p.id, p]));
    const currentYear = new Date().getFullYear();

    // Sort uniqueKpis by period start_date ascending so the current week
    // is always the rightmost point in both charts.
    const sortedKpis = [...uniqueKpis].sort((a, b) => {
      const da = periodMap.get(a.period_id)?.start_date ?? '';
      const db = periodMap.get(b.period_id)?.start_date ?? '';
      return da.localeCompare(db);
    });

    // latest = most recent period (last after ascending sort)
    const latest = sortedKpis[sortedKpis.length - 1]!;
    const prev   = sortedKpis[sortedKpis.length - 2];

    // Revenue series: last 6 by date → current week is the rightmost point
    const revenueSeries: ChartPoint[] = sortedKpis
      .slice(-6)
      .map((kpi, i) => ({
        label: weekLabel(periodMap.get(kpi.period_id), i, currentYear),
        value: Number(kpi.revenue),
      }));

    // Sales series: last 7 by date → current week is the rightmost bar
    const weeklySeries: ChartPoint[] = sortedKpis
      .slice(-7)
      .map((kpi, i) => ({
        label: weekLabel(periodMap.get(kpi.period_id), i, currentYear),
        value: Number(kpi.num_sales),
      }));

    const metrics = buildMetrics(latest, prev, currency);
    const categorySeries = buildCategorySeries(latest, bDataList[0]);
    const { headline, subtitle } = buildHeadline(latest, currency);

    return { headline, subtitle, metrics, revenueSeries, weeklySeries, categorySeries };
  },
};
