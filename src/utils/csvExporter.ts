/**
 * @file csvExporter.ts
 * @description Builds and shares a CSV file from history entries.
 *
 * Uses a semicolon (`;`) as separator for European Excel compatibility
 * (Excel on es/fr/de locales treats `;` as the list separator by default).
 *
 * File I/O is handled via `expo-file-system/legacy` (the legacy API is
 * required for Expo SDK 54 — the new API lacks `writeAsStringAsync`).
 * Sharing is handled via `expo-sharing`.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import i18n from '@/i18n';
import { isoWeekNumber, fmtDDMMYYYY } from '@/utils/periodHelpers';
import type { HistoryEntry } from '@/hooks/useHistory';

/** Thin wrapper around i18n.t so the module-level `t` works without hooks. */
const t = (key: string, opts?: Record<string, unknown>) => i18n.t(key, opts);

/**
 * Wraps a cell value in double quotes if it contains the separator (`;`),
 * double-quote characters, or newlines, and escapes any embedded quotes by
 * doubling them — per RFC 4180.
 *
 * @param value - Raw cell value (string or number)
 * @returns Safe CSV cell string
 */
function escapeCell(value: string | number): string {
  const str = String(value);
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Builds the full CSV string from an array of history entries.
 * The first row is a translated header; subsequent rows are data rows,
 * one per entry, ordered as received (caller decides the sort order).
 *
 * @param entries - Filtered/sorted history entries to export
 * @returns Multi-line CSV string with `;` separator and `\n` line endings
 */
function buildCSV(entries: HistoryEntry[]): string {
  const abbr = t('week_abbr');

  const headers = [
    t('history_csv_week'),
    t('history_csv_start'),
    t('history_csv_end'),
    t('history_csv_revenue'),
    t('history_csv_expenses'),
    t('history_csv_profit'),
    t('history_csv_margin'),
    t('history_csv_sales'),
    t('history_csv_customers'),
    t('history_csv_avg_ticket'),
    t('history_csv_reco'),
  ].map(escapeCell).join(';');

  const rows = entries.map((e) => {
    const week = `${abbr}${isoWeekNumber(e.period.start_date)}`;
    const start = fmtDDMMYYYY(e.period.start_date);
    const end   = fmtDDMMYYYY(e.period.end_date);
    const reco  = e.hasReco ? t('history_export_yes') : t('history_export_no');

    return [
      week,
      start,
      end,
      Number(e.kpi.revenue).toFixed(2),
      Number(e.kpi.expenses).toFixed(2),
      Number(e.kpi.net_profit).toFixed(2),
      Number(e.kpi.profit_margin).toFixed(2),
      Number(e.kpi.num_sales),
      Number(e.kpi.num_customers),
      Number(e.kpi.avg_ticket).toFixed(2),
      reco,
    ].map(escapeCell).join(';');
  });

  return [headers, ...rows].join('\n');
}

/**
 * Exports the given history entries as a UTF-8 CSV file and opens the
 * native share sheet so the user can save or send the file.
 *
 * The file is written to the app's cache directory with the name
 * `historial_YYYY-MM-DD.csv` (today's date) and is automatically
 * cleaned up by the OS on the next app launch.
 *
 * @param entries - Entries to export (may be a filtered subset)
 * @throws If writing to the filesystem or opening the share sheet fails
 */
export async function exportHistoryCSV(entries: HistoryEntry[]): Promise<void> {
  const csv = buildCSV(entries);
  const today = new Date().toISOString().slice(0, 10);
  const filename = `historial_${today}.csv`;
  const uri = (FileSystem.cacheDirectory ?? '') + filename;

  await FileSystem.writeAsStringAsync(uri, csv, {
    encoding: 'utf8',
  });

  await Sharing.shareAsync(uri, {
    mimeType: 'text/csv',
    dialogTitle: t('history_export_title'),
  });
}
