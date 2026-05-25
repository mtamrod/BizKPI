/**
 * @file history/[id].tsx
 * @description Pantalla de detalle de una semana del Historial — segundo nivel del stack.
 *
 * Recibe la entrada completa (`HistoryEntry`) serializada como JSON en los
 * parámetros de navegación, evitando así llamadas adicionales a la API.
 *
 * Muestra:
 * - Barra de navegación personalizada con botón ← (volver) y 🗑 (borrar)
 * - Badge de semana ISO y rango de fechas del periodo
 * - Gráfico de donut con la distribución beneficio / gastos
 * - Grid de 7 métricas: ingresos, gastos, beneficio, margen, ventas,
 *   clientes y ticket medio
 *
 * Borrado:
 * - Muestra un `Alert` de confirmación antes de borrar
 * - Elimina el registro `business_data` y su recomendación de IA asociada
 * - Navega automáticamente de vuelta a la lista tras el borrado
 *
 * @param params.id    - ID del período (string)
 * @param params.entry - JSON del objeto `HistoryEntry` completo
 */
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { DonutChart } from '@/components/charts/DonutChart';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/theme/ThemeContext';
import { fmt } from '@/utils/formatters';
import { formatPeriodRange, isoWeekNumber } from '@/utils/periodHelpers';
import { dataEntryService } from '@/services/dataEntryService';
import { recommendationService } from '@/services/recommendationService';
import type { HistoryEntry } from '@/hooks/useHistory';

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCell({
  label,
  value,
  icon,
  accent,
  wide = false,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  accent: string;
  wide?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={[
      styles.metricCell,
      { backgroundColor: `${accent}30` },
      wide && styles.metricCellWide,
    ]}>
      <View style={[styles.metricIconWrap, { backgroundColor: `${accent}60` }]}>
        <Ionicons name={icon} size={15} color={accent} />
      </View>
      <Text style={[styles.metricValue, { color: accent }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HistoryDetailScreen() {
  const router = useRouter();
  const { colors, currency, language } = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id: string; entry: string }>();

  // Parse entry from JSON param — guaranteed to exist since index.tsx serialises it
  const entry: HistoryEntry = JSON.parse(params.entry);
  const { period, kpi, bdataId, hasReco } = entry;

  const weekBadge = `${t('week_abbr')}${isoWeekNumber(period.start_date)}`;
  const range     = formatPeriodRange('week', period.start_date, period.end_date, language);

  // ── Donut segments (revenue breakdown) ───────────────────────────────────
  const revenue  = Math.max(Number(kpi.revenue), 1);
  const expenses = Math.max(0, Number(kpi.expenses));
  const profit   = Math.max(0, Number(kpi.net_profit));
  const expPct    = Math.round((expenses / revenue) * 100);
  const profitPct = Math.max(0, 100 - expPct);
  const donutSegments = [
    { id: 'profit',   label: t('data_profit'),          value: profitPct, color: '#10B981' },
    { id: 'expenses', label: t('history_csv_expenses'),  value: expPct,    color: '#EF4444' },
  ].filter((s) => s.value > 0);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    Alert.alert(
      t('history_delete_title'),
      t('history_delete_msg', { week: weekBadge }),
      [
        { text: t('profile_cancel'), style: 'cancel' },
        {
          text: t('reco_delete_confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await dataEntryService.deleteEntry(bdataId);
              await recommendationService.delete(period.id);
            } catch (err) {
              console.error('[HistoryDetail] delete error', err);
            } finally {
              router.back();
            }
          },
        },
      ],
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ScreenWrapper>
      {/* ── Custom header ─────────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.headerBtn}
        >
          <Ionicons name="chevron-back" size={22} color={colors.primaryLight} />
          <Text style={[styles.headerBack, { color: colors.primaryLight }]}>
            {t('history_title')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.headerBtn}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* ── Period badge ──────────────────────────────────────────────────── */}
      <View style={styles.periodRow}>
        <View style={[styles.weekBadge, { backgroundColor: `${colors.primary}22` }]}>
          <Text style={[styles.weekBadgeText, { color: colors.primaryLight }]}>{weekBadge}</Text>
        </View>
        <Text style={[styles.rangeText, { color: colors.textPrimary }]}>{range}</Text>
        {hasReco && (
          <View style={[styles.recoBadge, { backgroundColor: `${colors.primary}22` }]}>
            <Ionicons name="bulb-outline" size={12} color={colors.primaryLight} />
            <Text style={[styles.recoText, { color: colors.primaryLight }]}>{t('badge_ai')}</Text>
          </View>
        )}
      </View>

      {/* ── Donut breakdown ──────────────────────────────────────────────── */}
      <GlassCard style={styles.donutCard}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('history_detail_breakdown')}
        </Text>
        <DonutChart segments={donutSegments} size={130} />
      </GlassCard>

      {/* ── Metrics ───────────────────────────────────────────────────────── */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {t('history_detail_metrics')}
      </Text>
      <View style={styles.metricsGrid}>
        <MetricCell
          label={t('metric_revenue')}
          value={fmt.currency(Number(kpi.revenue), currency)}
          icon="trending-up-outline"
          accent="#10B981"
        />
        <MetricCell
          label={t('history_csv_expenses')}
          value={fmt.currency(Number(kpi.expenses), currency)}
          icon="trending-down-outline"
          accent="#EF4444"
        />
        <MetricCell
          label={t('data_profit')}
          value={fmt.currency(Number(kpi.net_profit), currency)}
          icon="cash-outline"
          accent="#10B981"
        />
        <MetricCell
          label={t('metric_margin')}
          value={fmt.percent(Number(kpi.profit_margin), 1)}
          icon="pie-chart-outline"
          accent="#6366F1"
        />
        <MetricCell
          label={t('metric_sales')}
          value={fmt.number(Number(kpi.num_sales))}
          icon="bag-handle-outline"
          accent="#F59E0B"
        />
        <MetricCell
          label={t('metric_customers')}
          value={fmt.number(Number(kpi.num_customers))}
          icon="people-outline"
          accent="#3B82F6"
        />
        <MetricCell
          label={t('data_avg_ticket')}
          value={fmt.currency(Number(kpi.avg_ticket), currency)}
          icon="receipt-outline"
          accent="#8B5CF6"
          wide
        />
      </View>

    </ScreenWrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerBack: { fontSize: 15, fontWeight: '600' },

  // Period badge row
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  weekBadge:     { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  weekBadgeText: { fontSize: 14, fontWeight: '700' },
  rangeText:     { flex: 1, fontSize: 14 },
  recoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  recoText: { fontSize: 11, fontWeight: '700' },

  // Donut
  donutCard: { padding: 16, gap: 12 },

  // Section title
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },

  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCell: {
    width: '47.5%',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  metricCellWide: {
    width: '100%',
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  metricLabel: { fontSize: 11, fontWeight: '500' },

});
