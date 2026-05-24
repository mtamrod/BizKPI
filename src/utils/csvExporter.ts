/**
 * @file csvExporter.ts
 * @description Genera y comparte un fichero CSV con las entradas del historial.
 *
 * Usa punto y coma (`;`) como separador para compatibilidad con Excel europeo
 * (Excel en idiomas es/fr/de usa `;` como separador de lista por defecto).
 *
 * La E/S de ficheros se gestiona con `expo-file-system/legacy` (la API legacy
 * es necesaria para Expo SDK 54 — la nueva API carece de `writeAsStringAsync`).
 * El compartido se gestiona con `expo-sharing`.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import i18n from '@/i18n';
import { isoWeekNumber, fmtDDMMYYYY } from '@/utils/periodHelpers';
import type { HistoryEntry } from '@/hooks/useHistory';

/** Adaptador ligero de i18n.t para que el `t` a nivel de módulo funcione sin hooks. */
const t = (key: string, opts?: Record<string, unknown>) => i18n.t(key, opts);

/**
 * Envuelve el valor de una celda en comillas dobles si contiene el separador (`;`),
 * comillas dobles o saltos de línea, y escapa las comillas internas duplicándolas
 * — según RFC 4180.
 *
 * @param value - Valor bruto de la celda (cadena o número)
 * @returns Cadena de celda CSV segura
 */
function escapeCell(value: string | number): string {
  const str = String(value);
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Construye la cadena CSV completa a partir de un array de entradas del historial.
 * La primera fila es la cabecera traducida; las filas siguientes son datos,
 * una por entrada, en el orden recibido (el llamante decide el orden).
 *
 * @param entries - Entradas del historial filtradas/ordenadas a exportar
 * @returns Cadena CSV multilínea con separador `;` y saltos de línea `\n`
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
 * Exporta las entradas del historial indicadas como fichero CSV UTF-8 y abre
 * el panel de compartir nativo para que el usuario pueda guardar o enviar el fichero.
 *
 * El fichero se escribe en el directorio de caché de la app con el nombre
 * `historial_AAAA-MM-DD.csv` (fecha de hoy) y el sistema operativo lo elimina
 * automáticamente en el siguiente inicio de la app.
 *
 * @param entries - Entradas a exportar (puede ser un subconjunto filtrado)
 * @throws Si falla la escritura en el sistema de ficheros o la apertura del panel de compartir
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
