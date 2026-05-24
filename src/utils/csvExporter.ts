import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import i18n from '@/i18n';
import { isoWeekNumber, fmtDDMMYYYY } from '@/utils/periodHelpers';
import type { HistoryEntry } from '@/hooks/useHistory';

const t = (key: string, opts?: Record<string, unknown>) => i18n.t(key, opts);

function escapeCell(value: string | number): string {
  const str = String(value);
  // Wrap in quotes if contains separator, quotes or newlines
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

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
    const week   = `${abbr}${isoWeekNumber(e.period.start_date)}`;
    const start  = fmtDDMMYYYY(e.period.start_date);
    const end    = fmtDDMMYYYY(e.period.end_date);
    const reco   = e.hasReco ? t('history_export_yes') : t('history_export_no');

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
