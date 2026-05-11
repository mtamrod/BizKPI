import { apiClient } from '@/lib/apiClient';
import { periodService } from '@/services/periodService';
import type { CreateEntryInput, DataEntry, PeriodType } from '@/types';
import type { PeriodRead } from './periodService';

// ─── Backend types ────────────────────────────────────────────────────────────

interface BusinessDataCreate {
  period_id: string;
  total_revenue: number;
  total_expenses: number;
  num_sales: number;
  num_customers: number;
  cost_of_goods_sold?: number;
  marketing_expenses?: number;
  new_customers?: number;
  returning_customers?: number;
  top_product_name?: string;
  top_product_revenue?: number;
  notes?: string;
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
  new_customers: number | null;
  returning_customers: number | null;
  top_product_name: string | null;
  top_product_revenue: number | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ─── Conversion helpers ───────────────────────────────────────────────────────

function toDataEntry(bd: BusinessDataRead, period: PeriodRead | undefined): DataEntry {
  return {
    id: bd.id,
    companyId: bd.user_id,
    period: (period?.period_type ?? 'day') as PeriodType,
    periodDate: period?.start_date ?? bd.created_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    totalRevenue: Number(bd.total_revenue),
    totalExpenses: Number(bd.total_expenses),
    totalSales: bd.num_sales,
    totalClients: bd.num_customers,
    bestProduct: bd.top_product_name ?? undefined,
    observations: bd.notes ?? undefined,
    source: 'manual',
    createdAt: bd.created_at ?? new Date().toISOString(),
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const dataEntryService = {
  async getEntries(_companyId: string): Promise<DataEntry[]> {
    const [bdataList, periods] = await Promise.all([
      apiClient.get<BusinessDataRead[]>('/business-data/'),
      apiClient.get<PeriodRead[]>('/periods/'),
    ]);

    const periodMap = new Map(periods.map((p) => [p.id, p]));
    return bdataList.map((bd) => toDataEntry(bd, periodMap.get(bd.period_id)));
  },

  async addEntry(input: CreateEntryInput): Promise<DataEntry> {
    // 1. Find or create the period for this date range
    const period = await periodService.findOrCreate(input.period, input.periodDate);

    // 2. Build the payload for business_data
    const payload: BusinessDataCreate = {
      period_id: period.id,
      total_revenue: input.totalRevenue,
      total_expenses: input.totalExpenses,
      num_sales: input.totalSales,
      num_customers: input.totalClients,
    };

    if (input.bestProduct?.trim()) payload.top_product_name = input.bestProduct.trim();
    if (input.observations?.trim()) payload.notes = input.observations.trim();

    // 3. Create the business_data record (backend auto-calculates KPIs)
    const created = await apiClient.post<BusinessDataRead>('/business-data/', payload);

    return toDataEntry(created, period);
  },
};
