import { apiClient } from '@/lib/apiClient';
import type { CategorySegment, ChartPoint, DashboardData, KpiMetric } from '@/types';
import type { PeriodRead } from './periodService';

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

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `€${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    return `€${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `€${Math.round(value).toLocaleString('es-ES')}`;
}

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

function pctDelta(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/** Formats a period's start_date as a short label (e.g. "Ene", "Sem 1", "01") */
function periodLabel(period: PeriodRead | undefined, fallbackIndex: number): string {
  if (!period) return `P${fallbackIndex + 1}`;

  const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const d = new Date(`${period.start_date}T00:00:00`);

  if (period.period_type === 'month') return MONTHS[d.getMonth()] ?? `P${fallbackIndex + 1}`;
  if (period.period_type === 'day') return `${d.getDate()}/${d.getMonth() + 1}`;
  // week
  return `S${Math.ceil(d.getDate() / 7)}`;
}

// ─── Dashboard builders ───────────────────────────────────────────────────────

function buildMetrics(latest: KpiRead, prev: KpiRead | undefined): KpiMetric[] {
  const revDelta = prev ? pctDelta(latest.revenue, prev.revenue) : 0;
  const custDelta = prev ? pctDelta(latest.num_customers, prev.num_customers) : 0;
  const marginDelta = prev ? latest.profit_margin - prev.profit_margin : 0;
  const salesDelta = prev ? pctDelta(latest.num_sales, prev.num_sales) : 0;

  return [
    {
      id: 'revenue',
      label: 'Ingresos',
      value: latest.revenue,
      formattedValue: formatCurrency(latest.revenue),
      delta: Math.abs(revDelta),
      deltaLabel: 'vs. período anterior',
      trend: revDelta >= 0 ? 'up' : 'down',
      icon: 'cash',
    },
    {
      id: 'customers',
      label: 'Clientes',
      value: latest.num_customers,
      formattedValue: latest.num_customers.toLocaleString('es-ES'),
      delta: Math.abs(custDelta),
      deltaLabel: 'clientes atendidos',
      trend: custDelta >= 0 ? 'up' : 'down',
      icon: 'people',
    },
    {
      id: 'margin',
      label: 'Margen neto',
      value: latest.profit_margin,
      formattedValue: formatPct(latest.profit_margin),
      delta: Math.abs(marginDelta),
      deltaLabel: 'puntos vs. anterior',
      trend: marginDelta >= 0 ? 'up' : 'down',
      icon: 'pulse',
    },
    {
      id: 'sales',
      label: 'Ventas',
      value: latest.num_sales,
      formattedValue: latest.num_sales.toLocaleString('es-ES'),
      delta: Math.abs(salesDelta),
      deltaLabel: 'operaciones',
      trend: salesDelta >= 0 ? 'up' : 'down',
      icon: 'cart',
    },
  ];
}

function buildCategorySeries(latest: KpiRead, latestBData: BusinessDataRead | undefined): CategorySegment[] {
  const revenue = latest.revenue || 1;
  const netProfit = Math.max(0, latest.net_profit);
  const cogs = latestBData?.cost_of_goods_sold ?? null;
  const marketing = latestBData?.marketing_expenses ?? null;

  if (cogs !== null && marketing !== null) {
    const otherExpenses = Math.max(0, latest.expenses - cogs - marketing);
    const total = netProfit + cogs + marketing + otherExpenses || 1;
    return [
      { id: 'profit',    label: 'Beneficio',  value: Math.round((netProfit / total) * 100), color: '#10B981' },
      { id: 'cogs',      label: 'Coste ventas', value: Math.round((cogs / total) * 100),    color: '#7C3AED' },
      { id: 'marketing', label: 'Marketing',  value: Math.round((marketing / total) * 100), color: '#F59E0B' },
      { id: 'other',     label: 'Otros',      value: Math.round((otherExpenses / total) * 100), color: '#3B82F6' },
    ].filter((s) => s.value > 0);
  }

  // Fallback: profit vs. expenses split
  const expensePct = Math.round((latest.expenses / revenue) * 100);
  const profitPct = 100 - expensePct;
  return [
    { id: 'profit',   label: 'Beneficio', value: Math.max(0, profitPct), color: '#10B981' },
    { id: 'expenses', label: 'Gastos',    value: Math.max(0, expensePct), color: '#7C3AED' },
  ];
}

function buildHeadline(latest: KpiRead): { headline: string; subtitle: string } {
  const margin = latest.profit_margin;
  if (margin >= 20) {
    return {
      headline: 'Margen sólido y rendimiento sobre objetivo.',
      subtitle: `Beneficio neto del ${latest.profit_margin.toFixed(1)} %. Ticket medio ${formatCurrency(latest.avg_ticket)}.`,
    };
  }
  if (margin >= 0) {
    return {
      headline: 'Operación estable con margen ajustado.',
      subtitle: `Beneficio neto del ${latest.profit_margin.toFixed(1)} %. Revisa la estructura de costes.`,
    };
  }
  return {
    headline: 'Período con resultado negativo.',
    subtitle: `Pérdida de ${formatCurrency(Math.abs(latest.net_profit))}. Analiza el detalle de gastos.`,
  };
}

// ─── Empty state ──────────────────────────────────────────────────────────────

const EMPTY_METRIC = (id: string, label: string, icon: KpiMetric['icon']): KpiMetric => ({
  id,
  label,
  value: 0,
  formattedValue: '—',
  delta: 0,
  deltaLabel: 'sin datos aún',
  trend: 'up',
  icon,
});

const EMPTY_DASHBOARD: DashboardData = {
  headline: 'Aún no hay datos registrados.',
  subtitle: 'Ve a la pestaña Datos y añade tu primer período para ver los KPIs aquí.',
  metrics: [
    EMPTY_METRIC('revenue', 'Ingresos', 'cash'),
    EMPTY_METRIC('customers', 'Clientes', 'people'),
    EMPTY_METRIC('margin', 'Margen neto', 'pulse'),
    EMPTY_METRIC('sales', 'Ventas', 'cart'),
  ],
  revenueSeries: [],
  weeklySeries: [],
  categorySeries: [],
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const kpiService = {
  async getDashboard(_companyId: string): Promise<DashboardData> {
    // Fetch all data in parallel
    const [kpis, bDataList, periods] = await Promise.all([
      apiClient.get<KpiRead[]>('/kpis/'),
      apiClient.get<BusinessDataRead[]>('/business-data/'),
      apiClient.get<PeriodRead[]>('/periods/'),
    ]);

    if (!kpis.length) return EMPTY_DASHBOARD;

    // kpis is sorted desc by calculated_at
    const latest = kpis[0]!;
    const prev = kpis[1];

    // Build period lookup map
    const periodMap = new Map(periods.map((p) => [p.id, p]));

    // Revenue series: last 6 KPIs oldest→newest
    const revenueSeries: ChartPoint[] = kpis
      .slice(0, 6)
      .reverse()
      .map((kpi, i) => ({
        label: periodLabel(periodMap.get(kpi.period_id), i),
        value: Number(kpi.revenue),
      }));

    // Weekly series: last 7 business_data entries oldest→newest
    const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const weeklySeries: ChartPoint[] = bDataList
      .slice(0, 7)
      .reverse()
      .map((bd, i) => ({
        label: DAYS[i % 7] ?? `${i + 1}`,
        value: Number(bd.total_revenue),
      }));

    const metrics = buildMetrics(latest, prev);
    const categorySeries = buildCategorySeries(latest, bDataList[0]);
    const { headline, subtitle } = buildHeadline(latest);

    return { headline, subtitle, metrics, revenueSeries, weeklySeries, categorySeries };
  },
};
