/**
 * @file dataEntryService.ts
 * @description API service for business data entries (the raw weekly figures
 * submitted by the user: revenue, expenses, sales count, customer count, etc.).
 *
 * Flow for creating an entry:
 *  1. Find or create the `Period` record that covers the selected date range.
 *  2. POST the business data to `/business-data/`.
 *  3. The backend automatically calculates and stores KPIs for that period.
 */

import { apiClient } from '@/lib/apiClient';
import { periodService } from '@/services/periodService';
import type { CreateEntryInput, DataEntry, PeriodType } from '@/types';
import type { PeriodRead } from './periodService';

// ─── Backend types ────────────────────────────────────────────────────────────

/** Payload sent to `POST /business-data/`. */
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

/** Shape of a business data record returned by the API. */
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

/**
 * Maps a raw API `BusinessDataRead` record (snake_case) to the app's
 * internal `DataEntry` type (camelCase). Falls back to sensible defaults
 * when optional fields are null or the period record is not available.
 *
 * @param bd     - Raw API record
 * @param period - Associated period (may be undefined if period fetch failed)
 */
function toDataEntry(bd: BusinessDataRead, period: PeriodRead | undefined): DataEntry {
  const startISO = period?.start_date ?? bd.created_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  return {
    id: bd.id,
    companyId: bd.user_id,
    periodId: bd.period_id,
    period: (period?.period_type ?? 'day') as PeriodType,
    periodDate: startISO,
    periodEndDate: period?.end_date ?? startISO,
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
  /**
   * Fetches all business data entries for the authenticated user and enriches
   * each record with its associated period metadata (date range, type).
   * Periods and business data are fetched in parallel to minimise latency.
   *
   * @param _companyId - Currently unused (the backend derives the user from the JWT)
   */
  async getEntries(_companyId: string): Promise<DataEntry[]> {
    const [bdataList, periods] = await Promise.all([
      apiClient.get<BusinessDataRead[]>('/business-data/'),
      apiClient.get<PeriodRead[]>('/periods/'),
    ]);

    const periodMap = new Map(periods.map((p) => [p.id, p]));
    return bdataList.map((bd) => toDataEntry(bd, periodMap.get(bd.period_id)));
  },

  /**
   * Creates a new business data entry for the given date range.
   *
   * Steps:
   * 1. Calls `periodService.findOrCreate` to obtain (or create) the matching
   *    `Period` record for the selected week/day/month.
   * 2. Posts the entry to `/business-data/`; the backend calculates KPIs
   *    automatically and stores them in a separate `kpis` table.
   *
   * @param input - Form data submitted by the user
   * @returns The created entry mapped to the app's `DataEntry` type
   */
  async addEntry(input: CreateEntryInput): Promise<DataEntry> {
    // 1. Find or create the period for this date range
    const period = await periodService.findOrCreate(
      input.period,
      input.periodDate,
      input.periodEndDate,
    );

    // 2. Build the payload for business_data
    const payload: BusinessDataCreate = {
      period_id: period.id,
      total_revenue: input.totalRevenue,
      total_expenses: input.totalExpenses,
      num_sales: input.totalSales,
      num_customers: input.totalClients,
    };

    // Optional fields — only sent if the user filled them in
    if (input.bestProduct?.trim()) payload.top_product_name = input.bestProduct.trim();
    if (input.observations?.trim()) payload.notes = input.observations.trim();

    // 3. Create the business_data record (backend auto-calculates KPIs)
    const created = await apiClient.post<BusinessDataRead>('/business-data/', payload);

    return toDataEntry(created, period);
  },

  /**
   * Hard-deletes a business data record by its ID.
   * The backend cascades this deletion to the associated KPI record.
   * Any AI recommendation for the same period must be deleted separately
   * via `recommendationService.delete(periodId)`.
   *
   * @param id - `business_data.id` (not the period ID)
   */
  async deleteEntry(id: string): Promise<void> {
    await apiClient.delete(`/business-data/${id}`);
  },
};
