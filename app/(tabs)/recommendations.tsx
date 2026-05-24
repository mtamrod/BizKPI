import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { RecoBody } from '@/components/ui/RecoBody';
import { useTheme } from '@/theme/ThemeContext';
import { useRecommendations } from '@/hooks/useRecommendations';
import { isoWeekNumber, formatPeriodRange } from '@/utils/periodHelpers';
import type { PeriodRead } from '@/services/periodService';
import type { Recommendation } from '@/services/recommendationService';

// ─── Sub-components ───────────────────────────────────────────────────────────

function PeriodChip({
  period,
  selected,
  hasReco,
  onPress,
}: {
  period: PeriodRead;
  selected: boolean;
  hasReco: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const week = isoWeekNumber(period.start_date);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : `${colors.primary}15`,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text style={[styles.chipWeek, { color: selected ? '#fff' : colors.primaryLight }]}>
        {t('week_abbr')}{week}
      </Text>
      {hasReco && (
        <View style={[styles.chipDot, { backgroundColor: selected ? '#fff' : colors.accentLight }]} />
      )}
    </TouchableOpacity>
  );
}

function RecoContent({
  reco,
  isRegenerating,
  onRegenerate,
  onDelete,
}: {
  reco: Recommendation;
  isRegenerating: boolean;
  onRegenerate: () => void;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.recoContent}>
      <RecoBody reco={reco} />

      {/* Regenerate + Delete */}
      <Button
        label={isRegenerating ? t('reco_regenerating') : t('reco_regenerate')}
        variant="secondary"
        onPress={onRegenerate}
        loading={isRegenerating}
      />
      <TouchableOpacity
        onPress={onDelete}
        activeOpacity={0.7}
        style={styles.deleteBtn}
      >
        <Ionicons name="trash-outline" size={15} color={colors.error} />
        <Text style={[styles.deleteBtnText, { color: colors.error }]}>{t('reco_delete')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RecommendationsScreen() {
  const { colors, language } = useTheme();
  const { t } = useTranslation();
  const { periods, recommendations, generatingIds, loadStatus, refresh, generate, remove } = useRecommendations();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => { refresh(); }, [refresh]),
  );

  const selectedPeriod = periods.find((p) => p.id === selectedId) ?? null;
  const selectedReco   = selectedId ? recommendations[selectedId] : null;
  const isGenerating   = selectedId ? generatingIds.includes(selectedId) : false;

  async function handleGenerate() {
    if (!selectedId) return;
    try {
      await generate(selectedId);
    } catch {
      Alert.alert('Error', t('reco_error'));
    }
  }

  function handleDelete() {
    if (!selectedId) return;
    Alert.alert(
      t('reco_delete_title'),
      t('reco_delete_msg'),
      [
        { text: t('login_recover_cancel'), style: 'cancel' },
        {
          text: t('reco_delete_confirm'),
          style: 'destructive',
          onPress: () => remove(selectedId),
        },
      ],
    );
  }

  // ── Loading state ──
  if (loadStatus === 'loading' && !periods.length) {
    return (
      <ScreenWrapper scrollable={false} contentStyle={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('reco_loading')}</Text>
      </ScreenWrapper>
    );
  }

  // ── No data state ──
  if (loadStatus === 'success' && !periods.length) {
    return (
      <ScreenWrapper scrollable={false} contentStyle={styles.centered}>
        <Ionicons name="bar-chart-outline" size={44} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{t('reco_no_weeks_title')}</Text>
        <Text style={[styles.hint, { color: colors.textSecondary, textAlign: 'center' }]}>
          {t('reco_no_weeks_msg')}
        </Text>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper onRefresh={refresh} refreshing={loadStatus === 'loading'}>
      <Header title={t('reco_title')} subtitle={t('reco_subtitle')} />

      {/* ── Period selector ──────────────────────────────────────────────── */}
      <View style={styles.selectorBlock}>
        <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>
          {t('reco_select_week')}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {periods.map((p) => (
            <PeriodChip
              key={p.id}
              period={p}
              selected={selectedId === p.id}
              hasReco={Boolean(recommendations[p.id])}
              onPress={() => setSelectedId(p.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* ── Selected period header ───────────────────────────────────────── */}
      {selectedPeriod && (
        <GlassCard style={styles.periodHeader}>
          <View style={styles.periodHeaderRow}>
            <View style={[styles.weekBadge, { backgroundColor: `${colors.primary}22` }]}>
              <Text style={[styles.weekBadgeText, { color: colors.primaryLight }]}>
                {t('week_abbr')}{isoWeekNumber(selectedPeriod.start_date)}
              </Text>
            </View>
            <Text style={[styles.periodRange, { color: colors.textPrimary }]}>
              {formatPeriodRange('week', selectedPeriod.start_date, selectedPeriod.end_date, language)}
            </Text>
          </View>
        </GlassCard>
      )}

      {/* ── Content area ─────────────────────────────────────────────────── */}
      {!selectedId && (
        <View style={styles.noSelectionWrapper}>
          <Ionicons name="bulb-outline" size={44} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {t('reco_no_selection_title')}
          </Text>
          <Text style={[styles.hint, { color: colors.textSecondary, textAlign: 'center' }]}>
            {t('reco_no_selection_msg')}
          </Text>
        </View>
      )}

      {selectedId && isGenerating && (
        <GlassCard style={styles.generatingCard}>
          <ActivityIndicator color={colors.primaryLight} />
          <Text style={[styles.generatingText, { color: colors.textPrimary }]}>
            {t('reco_analyzing')}
          </Text>
          <Text style={[styles.hint, { color: colors.textSecondary, textAlign: 'center' }]}>
            {t('reco_analyzing_sub')}
          </Text>
        </GlassCard>
      )}

      {selectedId && !isGenerating && selectedReco && (
        <RecoContent
          reco={selectedReco}
          isRegenerating={isGenerating}
          onRegenerate={handleGenerate}
          onDelete={handleDelete}
        />
      )}

      {selectedId && !isGenerating && !selectedReco && (
        <GlassCard style={styles.generateCard}>
          <Ionicons name="sparkles-outline" size={36} color={colors.primaryLight} />
          <Text style={[styles.generateTitle, { color: colors.textPrimary }]}>
            {t('reco_no_reco_title')}
          </Text>
          <Text style={[styles.hint, { color: colors.textSecondary, textAlign: 'center' }]}>
            {t('reco_no_reco_msg')}
          </Text>
          <Button label={t('reco_generate')} onPress={handleGenerate} />
        </GlassCard>
      )}
    </ScreenWrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12,
  },

  // ── Period selector ──
  selectorBlock: { gap: 10 },
  selectorLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  chipRow: { gap: 8, paddingVertical: 2, paddingRight: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 999, borderWidth: 1,
  },
  chipWeek: { fontSize: 13, fontWeight: '700' },
  chipDot: { width: 6, height: 6, borderRadius: 3 },

  // ── Period header card ──
  periodHeader: { padding: 14 },
  periodHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weekBadge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  weekBadgeText: { fontSize: 14, fontWeight: '700' },
  periodRange: { fontSize: 14, fontWeight: '500' },

  // ── No selection ──
  noSelectionWrapper: { alignItems: 'center', gap: 12, paddingTop: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  hint: { fontSize: 13, lineHeight: 20 },

  // ── Generating ──
  generatingCard: { padding: 28, alignItems: 'center', gap: 14 },
  generatingText: { fontSize: 15, fontWeight: '600' },

  // ── Generate CTA ──
  generateCard: { padding: 28, alignItems: 'center', gap: 16 },
  generateTitle: { fontSize: 17, fontWeight: '600' },

  // ── Reco content wrapper + delete row ──
  recoContent: { gap: 16 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  deleteBtnText: { fontSize: 13, fontWeight: '600' },
});
