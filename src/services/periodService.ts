/**
 * @file periodService.ts
 * @description API service for period records.
 *
 * A `Period` is the time range that a business data entry covers (day, week or
 * month). Periods are shared across the user's entries — if two entries cover
 * the same week, they reference the same `Period` row in the database.
 *
 * `findOrCreate` is the primary entry point: it avoids creating duplicate
 * period rows by checking for an exact date-range match before posting.
 */

import { apiClient } from '@/lib/apiClient';
import type { PeriodType } from '@/types';

// ─── Backend types ────────────────────────────────────────────────────────────

/** Period record as returned by `GET /periods/` and `POST /periods/`. */
export interface PeriodRead {
  id: string;
  user_id: string;
  /** Granularity: 'day' | 'week' | 'month' */
  period_type: PeriodType;
  /** ISO date "YYYY-MM-DD" — always a Monday for weekly periods. */
  start_date: string;
  /** ISO date "YYYY-MM-DD" — always a Sunday for weekly periods. */
  end_date: string;
  created_at: string | null;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Computes the canonical `[start_date, end_date]` for a period type given a
 * reference date. Used to normalise user-selected dates before looking up or
 * creating a period record.
 *
 * - `'day'`   → the reference date itself
 * - `'week'`  → the Monday–Sunday ISO week containing the reference date
 * - `'month'` → the first and last day of the reference date's month
 *
 * @param period        - Period granularity
 * @param referenceDate - Any date within the desired period ("YYYY-MM-DD")
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
  /**
   * Returns all period records for the authenticated user.
   * Results are in creation order (newest last); callers sort as needed.
   */
  async list(): Promise<PeriodRead[]> {
    return apiClient.get<PeriodRead[]>('/periods/');
  },

  /**
   * Returns an existing period that exactly matches the given date range, or
   * creates a new one if none exists.
   *
   * The match is exact: both `start_date`, `end_date` and `period_type` must
   * agree. This prevents phantom duplicates when the user submits data for the
   * same week twice (the second submission reuses the same period row).
   *
   * @param period     - Period granularity ('day' | 'week' | 'month')
   * @param start_date - First day of the period ("YYYY-MM-DD")
   * @param end_date   - Last day of the period ("YYYY-MM-DD")
   * @returns The matched or newly created period record
   */
  async findOrCreate(
    period: PeriodType,
    start_date: string,
    end_date: string,
  ): Promise<PeriodRead> {
    const periods = await periodService.list();
    const existing = periods.find(
      (p) => p.period_type === period && p.start_date === start_date && p.end_date === end_date,
    );
    if (existing) return existing;

    return apiClient.post<PeriodRead>('/periods/', {
      period_type: period,
      start_date,
      end_date,
    });
  },
};
