// ─── Auth ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'viewer';
  avatarColor: string;
}

export interface UserSession {
  token: string;
  user: User;
  activeCompanyId: string;
  rememberMe: boolean;
  authenticatedAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
  rememberMe: boolean;
}

export type AuthStatus = 'idle' | 'loading' | 'success' | 'error';

// ─── Companies ───────────────────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  sector: string;
  location: string;
  accentColor: string;
}

// ─── KPI / Dashboard ─────────────────────────────────────────────────────────

export type MetricTrend = 'up' | 'down';
export type MetricIcon = 'cash' | 'people' | 'pulse' | 'cart';

export interface KpiMetric {
  id: string;
  label: string;
  value: number;
  formattedValue: string;
  delta: number;
  deltaLabel: string;
  trend: MetricTrend;
  icon: MetricIcon;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface CategorySegment {
  id: string;
  label: string;
  value: number;
  color: string;
}

export interface DashboardData {
  headline: string;
  subtitle: string;
  metrics: KpiMetric[];
  revenueSeries: ChartPoint[];
  weeklySeries: ChartPoint[];
  categorySeries: CategorySegment[];
}

// ─── Data Entries ────────────────────────────────────────────────────────────

/** Granularidad del período analizado */
export type PeriodType = 'day' | 'week' | 'month';

export type EntrySource = 'manual' | 'import';

export interface DataEntry {
  id: string;
  companyId: string;
  /** Supabase period row id — needed to delete its AI recommendation on replace */
  periodId: string;

  // ── Obligatorios ──────────────────────────────────────────────────────────
  /** Granularidad: día / semana / mes */
  period: PeriodType;
  /** Fecha de inicio del período (ISO YYYY-MM-DD) */
  periodDate: string;
  /** Fecha de fin del período (ISO YYYY-MM-DD) */
  periodEndDate: string;
  /** Ingresos totales del período */
  totalRevenue: number;
  /** Gastos totales del período */
  totalExpenses: number;
  /** Número de ventas o pedidos */
  totalSales: number;
  /** Número de clientes atendidos */
  totalClients: number;

  // ── Opcionales ────────────────────────────────────────────────────────────
  /** Producto o servicio más vendido */
  bestProduct?: string;
  /** Día con más ventas (texto libre, ej. "Lunes", "15/06") */
  bestDay?: string;
  /** Día con menos ventas */
  worstDay?: string;
  /** Observaciones libres del período */
  observations?: string;

  // ── Metadatos ─────────────────────────────────────────────────────────────
  source: EntrySource;
  createdAt: string;
}

export interface CreateEntryInput {
  companyId: string;
  period: PeriodType;
  periodDate: string;    // start_date
  periodEndDate: string; // end_date
  totalRevenue: number;
  totalExpenses: number;
  totalSales: number;
  totalClients: number;
  bestProduct?: string;
  bestDay?: string;
  worstDay?: string;
  observations?: string;
}

// ─── Theme ───────────────────────────────────────────────────────────────────

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  surface: string;
  glass: string;
  primary: string;
  primaryLight: string;
  accent: string;
  accentLight: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  error: string;
  cardRadius: number;
}

// ─── State helpers ───────────────────────────────────────────────────────────

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';
