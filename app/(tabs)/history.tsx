import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { ExportModal } from '@/components/ui/ExportModal';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { useHistory, type HistoryEntry } from '@/hooks/useHistory';
import { fmt } from '@/utils/formatters';
import { formatPeriodRange, isoWeekNumber } from '@/utils/periodHelpers';
import { exportHistoryCSV } from '@/utils/csvExporter';
import type { ThemeColors } from '@/types';

// ─── Metric cell ──────────────────────────────────────────────────────────────

function MetricCell({ label, value, colors }: { label: string; value: string; colors: ThemeColors }) {
  return (
    <View style={styles.metricCell}>
      <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const { colors, currency, language } = useTheme();
  const { t } = useTranslation();
  const { entries, status, refresh, remove } = useHistory();
  const [refreshing, setRefreshing]   = useState(false);
  const [showExport, setShowExport]   = useState(false);

  const handleDelete = useCallback((entry: HistoryEntry) => {
    const weekBadge = `${t('week_abbr')}${isoWeekNumber(entry.period.start_date)}`;
    Alert.alert(
      t('history_delete_title'),
      t('history_delete_msg', { week: weekBadge }),
      [
        { text: t('profile_cancel'), style: 'cancel' },
        {
          text: t('reco_delete_confirm'),
          style: 'destructive',
          onPress: () => remove(entry),
        },
      ],
    );
  }, [remove, t]);

  useFocusEffect(
    useCallback(() => { refresh(); }, [refresh]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const isLoading = status === 'idle' || status === 'loading';

  const handleExport = useCallback(async (filtered: HistoryEntry[]) => {
    try {
      await exportHistoryCSV(filtered);
    } catch (err) {
      console.error('[Export]', err);
      Alert.alert('Error', String(err));
    }
  }, [t]);

  return (
    <ScreenWrapper onRefresh={handleRefresh} refreshing={refreshing}>
      <Header
        title={t('history_title')}
        subtitle={t('history_subtitle')}
        right={
          entries.length > 0
            ? (
              <TouchableOpacity onPress={() => setShowExport(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="download-outline" size={22} color={colors.primaryLight} />
              </TouchableOpacity>
            )
            : null
        }
      />

      <ExportModal
        visible={showExport}
        entries={entries}
        onClose={() => setShowExport(false)}
        onExport={handleExport}
      />

      {/* ── Loading ──────────────────────────────────────────────────────── */}
      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primaryLight} size="large" />
        </View>
      )}

      {/* ── Empty ────────────────────────────────────────────────────────── */}
      {!isLoading && entries.length === 0 && (
        <GlassCard style={styles.emptyCard}>
          <Ionicons name="time-outline" size={40} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {t('history_empty_title')}
          </Text>
          <Text style={[styles.emptyMsg, { color: colors.textSecondary }]}>
            {t('history_empty_msg')}
          </Text>
        </GlassCard>
      )}

      {/* ── Week cards ───────────────────────────────────────────────────── */}
      {!isLoading && entries.map(({ period, kpi, bdataId, hasReco }) => {
        const weekBadge = `${t('week_abbr')}${isoWeekNumber(period.start_date)}`;
        const range = formatPeriodRange('week', period.start_date, period.end_date, language);

        return (
          <GlassCard key={period.id} style={styles.card}>
            {/* Header row */}
            <View style={styles.cardHeader}>
              <View style={[styles.weekBadge, { backgroundColor: `${colors.primary}22` }]}>
                <Text style={[styles.weekBadgeText, { color: colors.primaryLight }]}>
                  {weekBadge}
                </Text>
              </View>
              <Text
                style={[styles.rangeText, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {range}
              </Text>
              {hasReco && (
                <View style={[styles.recoBadge, { backgroundColor: `${colors.primary}22` }]}>
                  <Ionicons name="bulb-outline" size={11} color={colors.primaryLight} />
                  <Text style={[styles.recoText, { color: colors.primaryLight }]}>IA</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => handleDelete({ period, kpi, bdataId, hasReco })}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={17} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Metrics 2×2 */}
            <View style={styles.metricsGrid}>
              <MetricCell label={t('metric_revenue')}   value={fmt.currency(Number(kpi.revenue), currency)}       colors={colors} />
              <MetricCell label={t('metric_margin')}    value={fmt.percent(Number(kpi.profit_margin), 1)}         colors={colors} />
              <MetricCell label={t('metric_sales')}     value={fmt.number(Number(kpi.num_sales))}                 colors={colors} />
              <MetricCell label={t('metric_customers')} value={fmt.number(Number(kpi.num_customers))}             colors={colors} />
            </View>
          </GlassCard>
        );
      })}
    </ScreenWrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyCard: { alignItems: 'center', gap: 10, padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptyMsg:   { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  card: { padding: 16, gap: 0 },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  weekBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  weekBadgeText: { fontSize: 13, fontWeight: '700' },
  rangeText: { flex: 1, fontSize: 13 },
  recoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  recoText: { fontSize: 11, fontWeight: '700' },

  divider: { height: 1, marginBottom: 12 },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricCell: {
    width: '50%',
    paddingVertical: 6,
    paddingRight: 8,
  },
  metricValue: { fontSize: 17, fontWeight: '700' },
  metricLabel: { fontSize: 11, marginTop: 1 },
});
