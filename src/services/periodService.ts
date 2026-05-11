import { apiClient } from '@/lib/apiClient';
import type { PeriodType } from '@/types';

// ─── Backend types ────────────────────────────────────────────────────────────

export interface PeriodRead {
  id: string;
  user_id: string;
  period_type: PeriodType;
  start_date: string; // ISO date "YYYY-MM-DD"
  end_date: string;
  created_at: string | null;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Given a period type and a reference date (ISO "YYYY-MM-DD"),
 * returns the [start_date, end_date] of the enclosing period.
 */
export function computePeriodDates(
  period: PeriodType,
  referenceDate: string,
): { start_date: string; end_date: string } {
  const d = new Date(`${referenceDate}T00:00:00`);

  if (period === 'day') {
    return { start_date: referenceDate, end_date: referenceDate };
  }

  if (period === 'week') {
    // Week starts on Monday
    const dow = d.getDay(); // 0 = Sunday
    const diffToMonday = (dow === 0 ? -6 : 1 - dow);
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start_date: monday.toISOString().slice(0, 10),
      end_date: sunday.toISOString().slice(0, 10),
    };
  }

  // month
  const year = d.getFullYear();
  const month = d.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  return {
    start_date: firstDay.toISOString().slice(0, 10),
    end_date: lastDay.toISOString().slice(0, 10),
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const periodService = {
  async list(): Promise<PeriodRead[]> {
    return apiClient.get<PeriodRead[]>('/periods/');
  },

  /**
   * Finds an existing period that matches the given date range, or creates a new one.
   * This prevents duplicate periods for the same date range.
   */
  async findOrCreate(
    period: PeriodType,
    referenceDate: string,
  ): Promise<PeriodRead> {
    const { start_date, end_date } = computePeriodDates(period, referenceDate);

    // Look for an existing period with the same start and end
    const periods = await periodService.list();
    const existing = periods.find(
      (p) => p.period_type === period && p.start_date === start_date && p.end_date === end_date,
    );
    if (existing) return existing;

    // Create a new one
    return apiClient.post<PeriodRead>('/periods/', {
      period_type: period,
      start_date,
      end_date,
    });
  },
};
