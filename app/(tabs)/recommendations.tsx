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
import { useTheme } from '@/theme/ThemeContext';
import { useRecommendations } from '@/hooks/useRecommendations';
import { isoWeekNumber, formatPeriodRange } from '@/utils/periodHelpers';
import type { PeriodRead } from '@/services/periodService';
import type {
  Recommendation,
  RecommendationHighlight,
  RecommendationAction,
} from '@/services/recommendationService';

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
        S{week}
      </Text>
      {hasReco && (
        <View style={[styles.chipDot, { backgroundColor: selected ? '#fff' : colors.accentLight }]} />
      )}
    </TouchableOpacity>
  );
}

function HighlightCard({ item }: { item: RecommendationHighlight }) {
  const { colors } = useTheme();
  const CONFIG = {
    positive: { icon: 'trending-up-outline' as const, color: '#10B981' },
    negative: { icon: 'trending-down-outline' as const, color: colors.error },
    neutral:  { icon: 'remove-outline' as const,       color: '#3B82F6' },
  };
  const cfg = CONFIG[item.type];

  return (
    <View style={[styles.highlightCard, { borderLeftColor: cfg.color, backgroundColor: `${cfg.color}10` }]}>
      <View style={styles.highlightHeader}>
        <Ionicons name={cfg.icon} size={16} color={cfg.color} />
        <Text style={[styles.highlightTitle, { color: cfg.color }]}>{item.title}</Text>
      </View>
      <Text style={[styles.highlightDesc, { color: colors.textSecondary }]}>{item.description}</Text>
    </View>
  );
}

function ActionCard({ item, index }: { item: RecommendationAction; index: number }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const PRIORITY = {
    high:   { label: t('reco_priority_high'),   color: '#EF4444', bg: '#EF444415' },
    medium: { label: t('reco_priority_medium'),  color: '#F59E0B', bg: '#F59E0B15' },
    low:    { label: t('reco_priority_low'),   color: '#10B981', bg: '#10B98115' },
  };
  const p = PRIORITY[item.priority];

  return (
    <GlassCard style={styles.actionCard}>
      <View style={styles.actionHeader}>
        <View style={[styles.actionIndex, { backgroundColor: `${colors.primary}22` }]}>
          <Text style={[styles.actionIndexText, { color: colors.primaryLight }]}>{index + 1}</Text>
        </View>
        <Text style={[styles.actionArea, { color: colors.textSecondary }]}>{item.area}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: p.bg }]}>
          <Text style={[styles.priorityText, { color: p.color }]}>{p.label}</Text>
        </View>
      </View>
      <Text style={[styles.actionText, { color: colors.textPrimary }]}>{item.action}</Text>
      <Text style={[styles.rationaleText, { color: colors.textSecondary }]}>{item.rationale}</Text>
    </GlassCard>
  );
}

function RecoContent({
  reco,
  isRegenerating,
  onRegenerate,
}: {
  reco: Recommendation;
  isRegenerating: boolean;
  onRegenerate: () => void;
}) {
  const { colors, language } = useTheme();
  const { t } = useTranslation();
  const content = reco.recommendations;
  const genDate = new Date(reco.generated_at).toLocaleDateString(language, {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <View style={styles.recoContent}>
      {/* Summary */}
      <GlassCard style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons name="bulb" size={18} color={colors.primaryLight} />
          <Text style={[styles.summaryLabel, { color: colors.primaryLight }]}>{t('reco_summary')}</Text>
        </View>
        <Text style={[styles.summaryText, { color: colors.textPrimary }]}>{content.summary}</Text>
        <Text style={[styles.genDate, { color: colors.textSecondary }]}>
          {t('reco_generated_on', { date: genDate, model: reco.model_used })}
        </Text>
      </GlassCard>

      {/* Highlights */}
      {content.highlights.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('reco_highlights')}</Text>
          {content.highlights.map((h, i) => (
            <HighlightCard key={i} item={h} />
          ))}
        </View>
      )}

      {/* Actions */}
      {content.recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('reco_actions')}</Text>
          {content.recommendations.map((a, i) => (
            <ActionCard key={i} item={a} index={i} />
          ))}
        </View>
      )}

      {/* Forecast */}
      {content.forecast ? (
        <GlassCard style={styles.forecastCard}>
          <View style={styles.forecastHeader}>
            <Ionicons name="telescope-outline" size={18} color={colors.accentLight} />
            <Text style={[styles.forecastLabel, { color: colors.accentLight }]}>{t('reco_forecast')}</Text>
          </View>
          <Text style={[styles.forecastText, { color: colors.textPrimary }]}>{content.forecast}</Text>
        </GlassCard>
      ) : null}

      {/* Regenerate */}
      <Button
        label={isRegenerating ? t('reco_regenerating') : t('reco_regenerate')}
        variant="secondary"
        onPress={onRegenerate}
        loading={isRegenerating}
      />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RecommendationsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { periods, recommendations, generatingIds, loadStatus, refresh, generate } = useRecommendations();

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
                S{isoWeekNumber(selectedPeriod.start_date)}
              </Text>
            </View>
            <Text style={[styles.periodRange, { color: colors.textPrimary }]}>
              {formatPeriodRange('week', selectedPeriod.start_date, selectedPeriod.end_date)}
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

  // ── Reco content ──
  recoContent: { gap: 16 },
  summaryCard: { padding: 18, gap: 12 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  summaryText: { fontSize: 14, lineHeight: 22, fontWeight: '400' },
  genDate: { fontSize: 11 },

  section: { gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },

  // ── Highlight ──
  highlightCard: {
    borderLeftWidth: 3, borderRadius: 10,
    padding: 12, gap: 6,
  },
  highlightHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  highlightTitle: { fontSize: 13, fontWeight: '700', flex: 1 },
  highlightDesc: { fontSize: 13, lineHeight: 19 },

  // ── Action ──
  actionCard: { padding: 16, gap: 8 },
  actionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionIndex: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actionIndexText: { fontSize: 12, fontWeight: '700' },
  actionArea: { flex: 1, fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  priorityBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  priorityText: { fontSize: 10, fontWeight: '700' },
  actionText: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  rationaleText: { fontSize: 13, lineHeight: 19 },

  // ── Forecast ──
  forecastCard: { padding: 18, gap: 10 },
  forecastHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  forecastLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  forecastText: { fontSize: 14, lineHeight: 22 },
});
