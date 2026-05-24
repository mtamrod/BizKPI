/**
 * @file kpiService.ts
 * @description Service that fetches raw API data and builds the complete
 * `DashboardData` payload consumed by the Home screen.
 *
 * The main entry point is `kpiService.getDashboard`. Internally it:
 * 1. Fetches KPIs, business_data records and periods in parallel.
 * 2. Uses `business_data` as the source of truth — if none exist, returns an
 *    empty-state dashboard rather than showing stale KPI records.
 * 3. Deduplicates KPIs by `period_id` (keeps only the latest per period).
 * 4. Sorts all KPIs ascending by period start_date so chart series always
 *    have the current week at the right-most position.
 * 5. Assembles metrics, chart series, category segments and a headline from
 *    the latest (and optionally second-to-latest) week's data.
 *
 * All formatted strings go through `i18n.t` so the dashboard updates
 * automatically when the user switches language.
 */

import { apiClient } from '@/lib/apiClient';
import { isoWeekNumber } from '@/utils/periodHelpers';
import i18n from '@/i18n';
import type { CategorySegment, ChartPoint, DashboardData, KpiMetric } from '@/types';
import type { PeriodRead } from './periodService';

const t = (key: string, opts?: Record<string, unknown>) => i18n.t(key, opts);

// ─── Backend types ────────────────────────────────────────────────────────────

/**
 * KPI record as returned by the `/kpis/` endpoint.
 * Computed server-side from the associated `business_data` entry.
 */
interface KpiRead {
  id: string;
  period_id: string;
  user_id: string;
  revenue: number;
  expenses: number;
  net_profit: number;
  /** Profit margin expressed as a 0–100 percentage. */
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
 * Business data record as returned by the `/business-data/` endpoint.
 * Contains the raw figures entered by the user; optional fields are
 * `null` when not provided.
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
 * Safely converts any numeric/null/undefined value to a `number`.
 * Returns `0` for `NaN`, `null` or `undefined` to prevent downstream
 * arithmetic from producing unexpected `NaN` values.
 *
 * @param v - The value to convert
 */
function n(v: number | null | undefined): number {
  const num = Number(v);
  return isNaN(num) ? 0 : num;
}

/**
 * Formats a monetary value as a compact string with the given currency symbol.
 *
 * - ≥ 1 000 000 → `€1.2M`
 * - ≥ 1 000     → `€12.5k`
 * - < 1 000     → `€345` (rounded, locale-formatted)
 *
 * @param value  - Raw numeric amount (null/undefined → treated as 0)
 * @param symbol - Currency prefix, e.g. `'€'` or `'$'`
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
 * Formats a 0–100 percentage value to one decimal place, e.g. `"23.4%"`.
 *
 * @param value - Percentage (null/undefined → treated as 0)
 */
function formatPct(value: number | null | undefined): string {
  return `${n(value).toFixed(1)}%`;
}

/**
 * Computes the week-over-week percentage change from `previous` to `current`.
 * Returns `0` if `previous` is zero (avoids division-by-zero).
 *
 * @param current  - Current period value
 * @param previous - Previous period value
 */
function pctDelta(current: number | null | undefined, previous: number | null | undefined): number {
  const c = n(current);
  const p = n(previous);
  if (p === 0) return 0;
  return ((c - p) / p) * 100;
}

/**
 * Returns a short week label for chart X-axis ticks.
 *
 * - Same year as `currentYear` → `"S20"` (abbreviated week number)
 * - Different year             → `"S1 '26"` (includes 2-digit year)
 * - Period not found           → `"S<fallbackIndex + 1>"` (1-based fallback)
 *
 * @param period        - The `PeriodRead` whose start_date provides the Monday
 * @param fallbackIndex - Zero-based index used when `period` is undefined
 * @param currentYear   - The current calendar year (for same-year optimisation)
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
 * Builds the four headline `KpiMetric` cards shown on the dashboard.
 *
 * Each metric includes:
 * - `formattedValue` — display-ready string (currency or count)
 * - `delta`          — absolute week-over-week change (always ≥ 0; direction
 *   is conveyed by `trend`)
 * - `trend`          — `'up'` or `'down'`
 *
 * If no previous week exists (`prev === undefined`) all deltas default to `0`
 * with trend `'up'` so new users see neutral, non-alarming indicators.
 *
 * @param latest   - KPIs for the most recent week
 * @param prev     - KPIs for the previous week, or `undefined` if none exists
 * @param currency - Currency symbol passed through to `formatCurrency`
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
 * Builds the `CategorySegment[]` array used by the dashboard's DonutChart.
 *
 * Two modes depending on available data:
 * 1. **Detailed** (when `cost_of_goods_sold` AND `marketing_expenses` are
 *    present): 4 segments — Profit · COGS · Marketing · Other expenses.
 * 2. **Fallback** (when either field is null): 2 segments — Profit vs.
 *    Expenses (simple profit-margin split).
 *
 * Values are expressed as rounded percentages of the total so all segments
 * always sum to 100 (±1 due to rounding). Segments with a 0 % value are
 * filtered out to avoid invisible arcs on the donut.
 *
 * @param latest      - KPIs for the most recent week
 * @param latestBData - Business data record for the same week (may be undefined)
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
 * Generates the motivational headline and subtitle shown at the top of the
 * dashboard based on the latest week's profit margin:
 *
 * - **≥ 20 %** → strong performance message with margin + avg. ticket
 * - **≥ 0 %**  → stable performance message with margin
 * - **< 0 %**  → loss warning with absolute net-loss amount
 *
 * All strings come from i18n so they localise automatically.
 *
 * @param latest   - KPIs for the most recent week
 * @param currency - Currency symbol for formatting monetary values
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
 * Creates a single placeholder `KpiMetric` with zeroed values and a `'—'`
 * display string. Used to populate the dashboard when there is no data yet.
 *
 * @param id       - Stable metric identifier (e.g. `'revenue'`)
 * @param labelKey - i18n key for the metric label
 * @param icon     - Ionicons name for the metric icon
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
   * Fetches all required data and assembles a complete `DashboardData` object
   * ready for direct consumption by the Home screen.
   *
   * Data flow:
   * 1. Fetch `/kpis/`, `/business-data/` and `/periods/` in parallel.
   * 2. Return `getEmptyDashboard()` if no `business_data` records exist.
   * 3. Filter out KPIs whose period no longer has a `business_data` record
   *    (guards against stale records after a delete operation).
   * 4. Deduplicate KPIs by `period_id` (only the first occurrence is kept,
   *    since the API already returns them newest-first).
   * 5. Sort ascending by `period.start_date` so chart series run left → right
   *    chronologically.
   * 6. Build metrics (last 2 weeks), revenue series (last 6), sales series
   *    (last 7), category segments, and a contextual headline.
   *
   * @param _companyId - Currently authenticated company ID (reserved for
   *   multi-tenant filtering in a future API version; ignored for now)
   * @param currency   - Currency symbol prepended to monetary values (default `'€'`)
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
