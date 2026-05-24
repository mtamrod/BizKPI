import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { ExportModal } from '@/components/ui/ExportModal';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { useHistory, type HistoryEntry } from '@/hooks/useHistory';
import { formatPeriodRange, isoWeekNumber } from '@/utils/periodHelpers';
import { exportHistoryCSV } from '@/utils/csvExporter';

export default function HistoryScreen() {
  const router = useRouter();
  const { colors, language } = useTheme();
  const { t } = useTranslation();
  const { entries, status, refresh } = useHistory();
  const [refreshing, setRefreshing] = useState(false);
  const [showExport, setShowExport] = useState(false);

  useFocusEffect(
    useCallback(() => { refresh(); }, [refresh]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleExport = useCallback(async (filtered: HistoryEntry[]) => {
    try {
      await exportHistoryCSV(filtered);
    } catch (err) {
      console.error('[Export]', err);
      Alert.alert('Error', t('history_export_error'));
    }
  }, [t]);

  const isLoading = status === 'idle' || status === 'loading';

  return (
    <ScreenWrapper onRefresh={handleRefresh} refreshing={refreshing}>
      <Header
        title={t('history_title')}
        subtitle={t('history_subtitle')}
        right={
          entries.length > 0
            ? (
              <TouchableOpacity
                onPress={() => setShowExport(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
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
      {!isLoading && entries.map((entry) => {
        const { period, hasReco } = entry;
        const weekBadge = `${t('week_abbr')}${isoWeekNumber(period.start_date)}`;
        const range = formatPeriodRange('week', period.start_date, period.end_date, language);

        return (
          <GlassCard
            key={period.id}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/history/[id]',
                params: { id: period.id, entry: JSON.stringify(entry) },
              })
            }
          >
            <View style={styles.cardRow}>
              <View style={[styles.weekBadge, { backgroundColor: `${colors.primary}22` }]}>
                <Text style={[styles.weekBadgeText, { color: colors.primaryLight }]}>
                  {weekBadge}
                </Text>
              </View>
              <Text style={[styles.rangeText, { color: colors.textSecondary }]} numberOfLines={1}>
                {range}
              </Text>
              {hasReco && (
                <View style={[styles.recoBadge, { backgroundColor: `${colors.primary}22` }]}>
                  <Ionicons name="bulb-outline" size={11} color={colors.primaryLight} />
                  <Text style={[styles.recoText, { color: colors.primaryLight }]}>{t('badge_ai')}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </View>
          </GlassCard>
        );
      })}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyCard:  { alignItems: 'center', gap: 10, padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptyMsg:   { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  card: { padding: 16 },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  weekBadge:     { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  weekBadgeText: { fontSize: 13, fontWeight: '700' },
  rangeText:     { flex: 1, fontSize: 13 },
  recoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  recoText: { fontSize: 11, fontWeight: '700' },
});
