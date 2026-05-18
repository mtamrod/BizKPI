import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { TrendBadge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/theme/ThemeContext';
import { useKPIs } from '@/hooks/useKPIs';
import { isoWeekNumber, dateToISO } from '@/utils/periodHelpers';
import { Ionicons } from '@expo/vector-icons';
import type { MetricIcon } from '@/types';

const METRIC_ICONS: Record<MetricIcon, React.ComponentProps<typeof Ionicons>['name']> = {
  cash:   'cash-outline',
  people: 'people-outline',
  pulse:  'pulse-outline',
  cart:   'cart-outline',
};

function greeting() {
  const h = new Date().getHours();
  if (h < 13) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function DashboardScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const companyId = session?.activeCompanyId ?? 'co_001';
  const { data, status, refresh } = useKPIs(companyId);

  // Must be before any early returns — Rules of Hooks.
  useFocusEffect(
    useCallback(() => { refresh(); }, [refresh]),
  );

  if (status === 'error' && !data) {
    return (
      <ScreenWrapper scrollable={false} contentStyle={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={40} color={colors.textSecondary} />
        <Text style={[styles.loadingText, { color: colors.textPrimary, fontWeight: '600' }]}>
          No se pudo cargar el panel
        </Text>
        <Text style={[styles.loadingText, { color: colors.textSecondary, textAlign: 'center' }]}>
          Comprueba tu conexión o espera unos segundos.
        </Text>
        <TouchableOpacity
          onPress={refresh}
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Reintentar</Text>
        </TouchableOpacity>
      </ScreenWrapper>
    );
  }

  if (status === 'loading' || !data) {
    return (
      <ScreenWrapper scrollable={false} contentStyle={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Cargando panel…
        </Text>
      </ScreenWrapper>
    );
  }

  const businessName = session?.user.name ?? 'Mi empresa';
  const firstName = businessName.split(' ')[0] ?? 'usuario';
  const currentWeek = isoWeekNumber(dateToISO(new Date()));

  return (
    <ScreenWrapper onRefresh={refresh} refreshing={status === 'loading' && !!data}>
      {/* Header */}
      <Header
        title={`${greeting()}, ${firstName}`}
        subtitle={`Semana ${currentWeek} · Panel principal`}
      />

      {/* Empresa + estado */}
      <GlassCard style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={styles.statusLeft}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
              Empresa activa
            </Text>
            <Text style={[styles.statusName, { color: colors.textPrimary }]}>
              {businessName}
            </Text>
            <Text style={[styles.statusSector, { color: colors.textSecondary }]}>
              {session?.user.email ?? ''}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${colors.primary}22` }]}>
            <Text style={[styles.statusBadgeText, { color: colors.primaryLight }]}>
              S{currentWeek}
            </Text>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.headline, { color: colors.textPrimary }]} numberOfLines={2}>
          {data.headline}
        </Text>
        <Text style={[styles.subheadline, { color: colors.textSecondary }]} numberOfLines={2}>
          {data.subtitle}
        </Text>
      </GlassCard>

      {/* KPI cards 2x2 */}
      <View style={styles.kpiGrid}>
        {data.metrics.map((m) => (
          <GlassCard key={m.id} style={styles.kpiCard}>
            <View style={styles.kpiTop}>
              <View style={[styles.iconBox, { backgroundColor: `${colors.primary}22` }]}>
                <Ionicons name={METRIC_ICONS[m.icon]} size={18} color={colors.primaryLight} />
              </View>
              <TrendBadge value={m.trend === 'up' ? m.delta : -m.delta} />
            </View>
            <View style={styles.kpiBottom}>
              <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>
                {m.label}
              </Text>
              <Text
                style={[styles.kpiValue, { color: colors.textPrimary }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {m.formattedValue}
              </Text>
              <Text style={[styles.kpiDelta, { color: colors.textSecondary }]}>
                {m.deltaLabel}
              </Text>
            </View>
          </GlassCard>
        ))}
      </View>

      {/* Revenue chart */}
      <GlassCard style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={styles.chartLabels}>
            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
              Ingresos por semana
            </Text>
            <Text style={[styles.chartSub, { color: colors.textSecondary }]}>
              Tendencia de las últimas 6 semanas
            </Text>
          </View>
          <Text style={[styles.chartValue, { color: colors.primaryLight }]}>
            {data.metrics.find((m) => m.id === 'revenue')?.formattedValue}
          </Text>
        </View>
        <LineChart points={data.revenueSeries} />
      </GlassCard>

      {/* Weekly + Categories side by side */}
      <View style={styles.rowCharts}>
        <GlassCard style={StyleSheet.flatten([styles.chartCard, styles.chartHalf])}>
          <View style={styles.chartLabels}>
            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
              Ventas por semana
            </Text>
            <Text style={[styles.chartSub, { color: colors.textSecondary }]}>
              Últimas semanas
            </Text>
          </View>
          <BarChart points={data.weeklySeries} />
        </GlassCard>

        <GlassCard style={StyleSheet.flatten([styles.chartCard, styles.chartHalf])}>
          <View style={styles.chartLabels}>
            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
              Categorías
            </Text>
            <Text style={[styles.chartSub, { color: colors.textSecondary }]}>
              Distribución
            </Text>
          </View>
          <DonutChart segments={data.categorySeries} size={110} />
        </GlassCard>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // ── Loading state ──
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 14 },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },

  // ── Status card ──
  statusCard: {
    padding: 20,
    gap: 12,    // gap now works: applies between statusRow / divider / headline / subheadline
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  statusLeft: {
    flex: 1,
    gap: 3,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  statusName: {
    fontSize: 17,
    fontWeight: '700',
  },
  statusSector: {
    fontSize: 12,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
  },
  headline: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  subheadline: {
    fontSize: 13,
    lineHeight: 19,
  },

  // ── KPI grid ──
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    width: '47.5%',
    padding: 16,
    gap: 12,   // space between kpiTop and kpiBottom
    minHeight: 140,
  },
  kpiTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiBottom: {
    gap: 3,
    flexShrink: 1,   // prevent value overflow in narrow cards
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  kpiDelta: {
    fontSize: 11,
  },

  // ── Chart cards ──
  chartCard: {
    padding: 18,
    gap: 14,   // between header row and chart; between labels group and chart
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    // no marginBottom — the card gap handles spacing to the chart below
  },
  chartLabels: {
    flex: 1,
    gap: 3,   // tight spacing between title and subtitle
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartSub: {
    fontSize: 12,
  },
  chartValue: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  rowCharts: {
    flexDirection: 'row',
    gap: 12,
  },
  chartHalf: {
    flex: 1,
  },
});
