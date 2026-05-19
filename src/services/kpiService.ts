import { apiClient } from '@/lib/apiClient';
import { isoWeekNumber } from '@/utils/periodHelpers';
import i18n from '@/i18n';
import type { CategorySegment, ChartPoint, DashboardData, KpiMetric } from '@/types';
import type { PeriodRead } from './periodService';

const t = (key: string, opts?: Record<string, unknown>) => i18n.t(key, opts);

// ─── Backend types ────────────────────────────────────────────────────────────

interface KpiRead {
  id: string;
  period_id: string;
  user_id: string;
  revenue: number;
  expenses: number;
  net_profit: number;
  profit_margin: number;     // 0-100 percentage
  num_sales: number;
  num_customers: number;
  avg_ticket: number;
  gross_margin: number | null;
  customer_acquisition_rate: number | null;
  returning_customer_rate: number | null;
  calculated_at: string | null;
}

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

/** Convierte cualquier valor numérico/null/undefined a number seguro. */
function n(v: number | null | undefined): number {
  const num = Number(v);
  return isNaN(num) ? 0 : num;
}

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

function formatPct(value: number | null | undefined): string {
  return `${n(value).toFixed(1)}%`;
}

function pctDelta(current: number | null | undefined, previous: number | null | undefined): number {
  const c = n(current);
  const p = n(previous);
  if (p === 0) return 0;
  return ((c - p) / p) * 100;
}

/**
 * Returns a short week label: "S20" (same year) or "S1 '26" (cross-year).
 * Uses the period's start_date (always a Monday).
 */
function weekLabel(
  period: PeriodRead | undefined,
  fallbackIndex: number,
  currentYear: number,
): string {
  if (!period) return `S${fallbackIndex + 1}`;
  const d = new Date(`${period.start_date}T00:00:00`);
  const week = isoWeekNumber(period.start_date);
  const year = d.getFullYear();
  return year === currentYear ? `S${week}` : `S${week} '${String(year).slice(2)}`;
}

// ─── Dashboard builders ───────────────────────────────────────────────────────

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
