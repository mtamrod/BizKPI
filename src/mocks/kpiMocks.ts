import type { CategorySegment, ChartPoint, DashboardData, KpiMetric } from '@/types';

const metrics: KpiMetric[] = [
  {
    id: 'revenue',
    label: 'Ingresos',
    value: 124750,
    formattedValue: '€124,7k',
    delta: 12.3,
    deltaLabel: 'vs. mes anterior',
    trend: 'up',
    icon: 'cash',
  },
  {
    id: 'users',
    label: 'Usuarios',
    value: 2847,
    formattedValue: '2.847',
    delta: 8.7,
    deltaLabel: 'usuarios activos',
    trend: 'up',
    icon: 'people',
  },
  {
    id: 'conversion',
    label: 'Conversión',
    value: 3.42,
    formattedValue: '3,42%',
    delta: -0.8,
    deltaLabel: 'puntos sobre plan',
    trend: 'down',
    icon: 'pulse',
  },
  {
    id: 'orders',
    label: 'Pedidos',
    value: 1293,
    formattedValue: '1.293',
    delta: 15.2,
    deltaLabel: 'volumen mensual',
    trend: 'up',
    icon: 'cart',
  },
];

const revenueSeries: ChartPoint[] = [
  { label: 'Jul', value: 88900 },
  { label: 'Ago', value: 94500 },
  { label: 'Sep', value: 102100 },
  { label: 'Oct', value: 97800 },
  { label: 'Nov', value: 115400 },
  { label: 'Dic', value: 124750 },
];

const weeklySeries: ChartPoint[] = [
  { label: 'L', value: 78 },
  { label: 'M', value: 92 },
  { label: 'X', value: 85 },
  { label: 'J', value: 96 },
  { label: 'V', value: 88 },
  { label: 'S', value: 62 },
  { label: 'D', value: 45 },
];

const categorySeries: CategorySegment[] = [
  { id: 'sw',   label: 'Software',    value: 38, color: '#7C3AED' },
  { id: 'sv',   label: 'Servicios',   value: 27, color: '#10B981' },
  { id: 'hw',   label: 'Hardware',    value: 18, color: '#F59E0B' },
  { id: 'co',   label: 'Consultoría', value: 11, color: '#3B82F6' },
  { id: 'ot',   label: 'Otros',       value:  6, color: '#94A3B8' },
];

export const MOCK_DASHBOARD: DashboardData = {
  headline: 'Ingresos sólidos y pipeline saludable.',
  subtitle: 'La eficiencia comercial se mantiene por encima del objetivo semanal.',
  metrics,
  revenueSeries,
  weeklySeries,
  categorySeries,
};
