import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DayPicker, formatDayLabel } from '@/components/ui/DayPicker';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/theme/ThemeContext';
import { useDataEntries } from '@/hooks/useDataEntries';
import { fmt } from '@/utils/formatters';
import { getDefaultPeriod, formatPeriodRange, isoWeekNumber } from '@/utils/periodHelpers';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseNum(s: string): number {
  return parseFloat(s.replace(',', '.').replace(/\s/g, ''));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ text, optional }: { text: string; optional?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={sc.sectionRow}>
      <Text style={[sc.sectionText, { color: colors.textSecondary }]}>{text}</Text>
      {optional && (
        <View style={[sc.optBadge, { backgroundColor: `${colors.accent}20` }]}>
          <Text style={[sc.optText, { color: colors.accentLight }]}>Opcional</Text>
        </View>
      )}
    </View>
  );
}

function StatCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={sc.statItem}>
      <Text style={[sc.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text
        style={[sc.statValue, { color: accent ? colors.accentLight : colors.textPrimary }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DataScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const companyId = session?.activeCompanyId ?? 'co_001';
  const { entries, addEntry, replaceEntry, refresh, status } = useDataEntries(companyId);

  // ── Required fields ──
  const initPeriod = getDefaultPeriod('week');
  const [periodStart, setPeriodStart] = useState(initPeriod.start);
  const [periodEnd,   setPeriodEnd]   = useState(initPeriod.end);
  const [revenue, setRevenue]         = useState('');
  const [expenses, setExpenses]     = useState('');
  const [sales, setSales]           = useState('');
  const [clients, setClients]       = useState('');

  // ── Optional fields ──
  const [bestProduct, setBestProduct] = useState('');
  const [bestDay, setBestDay]         = useState<string | null>(null);
  const [worstDay, setWorstDay]       = useState<string | null>(null);
  const [observations, setObservations] = useState('');

  // ── UI state ──
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState('');

  // ── Summary stats from last entry ──
  const lastEntry = entries[0];
  const summaryStats = useMemo(() => {
    if (!lastEntry) return null;
    const profit = lastEntry.totalRevenue - lastEntry.totalExpenses;
    const margin = lastEntry.totalRevenue > 0
      ? (profit / lastEntry.totalRevenue) * 100
      : 0;
    const ticket = lastEntry.totalSales > 0
      ? lastEntry.totalRevenue / lastEntry.totalSales
      : 0;
    return { profit, margin, ticket };
  }, [lastEntry]);

  // ── Validation ──
  function validate(): boolean {
    const next: Record<string, string> = {};
    const rev = parseNum(revenue);
    if (!revenue.trim() || isNaN(rev) || rev < 0) {
      next.revenue = 'Introduce los ingresos totales';
    }
    const exp = parseNum(expenses);
    if (!expenses.trim() || isNaN(exp) || exp < 0) {
      next.expenses = 'Introduce los gastos totales';
    }
    const sal = parseInt(sales, 10);
    if (!sales.trim() || isNaN(sal) || sal <= 0) {
      next.sales = 'Introduce el número de ventas';
    }
    const cli = parseInt(clients, 10);
    if (!clients.trim() || isNaN(cli) || cli <= 0) {
      next.clients = 'Introduce el número de clientes';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ── Save helpers ──
  function buildInput() {
    return {
      period:        'week' as const,
      periodDate:    periodStart,
      periodEndDate: periodEnd,
      totalRevenue:  parseNum(revenue),
      totalExpenses: parseNum(expenses),
      totalSales:    parseInt(sales, 10),
      totalClients:  parseInt(clients, 10),
      bestProduct:   bestProduct || undefined,
      bestDay:       bestDay  ? formatDayLabel(bestDay)  : undefined,
      worstDay:      worstDay ? formatDayLabel(worstDay) : undefined,
      observations:  observations || undefined,
    };
  }

  function resetForm() {
    const fresh = getDefaultPeriod('week');
    setPeriodStart(fresh.start);
    setPeriodEnd(fresh.end);
    setRevenue('');
    setExpenses('');
    setSales('');
    setClients('');
    setBestProduct('');
    setBestDay(null);
    setWorstDay(null);
    setObservations('');
    setErrors({});
  }

  async function doSave(
    input: ReturnType<typeof buildInput>,
    existingId?: string,
    existingPeriodId?: string,
  ) {
    try {
      if (existingId && existingPeriodId) {
        await replaceEntry(existingId, existingPeriodId, input);
      } else {
        await addEntry(input);
      }
      resetForm();
      setFeedback(existingId ? 'Registro de la semana actualizado.' : 'Entrada guardada correctamente.');
      setTimeout(() => setFeedback(''), 3500);
    } catch {
      Alert.alert('Error', 'No se pudo guardar la entrada. Inténtalo de nuevo.');
    }
  }

  // ── Save ──
  const handleSave = useCallback(() => {
    if (!validate()) return;

    const input = buildInput();

    // Check for an existing entry with the same week
    const existing = entries.find(
      (e) => e.periodDate === periodStart && e.periodEndDate === periodEnd,
    );

    if (existing) {
      const weekNum = isoWeekNumber(periodStart);
      Alert.alert(
        'Semana ya registrada',
        `Ya existe un registro para la S${weekNum} (${formatPeriodRange('week', periodStart, periodEnd)}).\n\nSe sustituirá por los nuevos datos.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Reemplazar',
            style: 'destructive',
            onPress: () => doSave(input, existing.id, existing.periodId),
          },
        ],
      );
      return;
    }

    doSave(input);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodStart, periodEnd, revenue, expenses, sales, clients,
      bestProduct, bestDay, worstDay, observations, entries, addEntry, replaceEntry]);

  return (
    <ScreenWrapper keyboardAware onRefresh={refresh} refreshing={status === 'loading'}>
      <Header title="Entrada de datos" subtitle="Registra métricas de tu negocio" />

      {/* ── Summary card (from last entry) ──────────────────────────────── */}
      <GlassCard style={styles.statsCard}>
        {summaryStats && lastEntry ? (
          <>
            <View style={styles.statsTop}>
              <View style={[styles.periodPill, { backgroundColor: `${colors.primary}22` }]}>
                <Text style={[styles.periodPillText, { color: colors.primaryLight }]}>
                  Semana · {formatPeriodRange('week', lastEntry.periodDate, lastEntry.periodEndDate)}
                </Text>
              </View>
              <Text style={[styles.statsHint, { color: colors.textSecondary }]}>
                Último registro
              </Text>
            </View>
            <View style={styles.statsRow}>
              <StatCell
                label="Beneficio"
                value={fmt.currency(summaryStats.profit)}
                accent={summaryStats.profit >= 0}
              />
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <StatCell
                label="Margen"
                value={`${summaryStats.margin.toFixed(1)}%`}
                accent={summaryStats.margin >= 0}
              />
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <StatCell
                label="Ticket medio"
                value={fmt.currency(summaryStats.ticket)}
              />
            </View>
          </>
        ) : (
          <View style={styles.noDataRow}>
            <Ionicons name="analytics-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
              {entries.length === 0
                ? 'Registra tu primera entrada para ver estadísticas'
                : 'Cargando resumen…'}
            </Text>
          </View>
        )}
      </GlassCard>

      {/* ── Required fields ─────────────────────────────────────────────── */}
      <GlassCard style={styles.formCard}>
        <SectionLabel text="Datos obligatorios" />

        {/* Date picker */}
        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Semana analizada *
          </Text>
          <PeriodPicker
            startDate={periodStart}
            endDate={periodEnd}
            onChange={(s, e) => {
              setPeriodStart(s);
              setPeriodEnd(e);
              setBestDay(null);
              setWorstDay(null);
            }}
          />
        </View>

        {/* Revenue + Expenses */}
        <View style={styles.twoCol}>
          <View style={styles.colItem}>
            <Input
              label="Ingresos totales (€) *"
              value={revenue}
              onChangeText={setRevenue}
              placeholder="0.00"
              keyboardType="decimal-pad"
              error={errors.revenue}
            />
          </View>
          <View style={styles.colItem}>
            <Input
              label="Gastos totales (€) *"
              value={expenses}
              onChangeText={setExpenses}
              placeholder="0.00"
              keyboardType="decimal-pad"
              error={errors.expenses}
            />
          </View>
        </View>

        {/* Sales + Clients */}
        <View style={styles.twoCol}>
          <View style={styles.colItem}>
            <Input
              label="Nº ventas / pedidos *"
              value={sales}
              onChangeText={setSales}
              placeholder="0"
              keyboardType="number-pad"
              error={errors.sales}
            />
          </View>
          <View style={styles.colItem}>
            <Input
              label="Nº clientes *"
              value={clients}
              onChangeText={setClients}
              placeholder="0"
              keyboardType="number-pad"
              error={errors.clients}
            />
          </View>
        </View>
      </GlassCard>

      {/* ── Optional fields ──────────────────────────────────────────────── */}
      <GlassCard style={styles.formCard}>
        <SectionLabel text="Análisis adicional" optional />

        <Input
          label="Producto o servicio más vendido"
          value={bestProduct}
          onChangeText={setBestProduct}
          placeholder="Ej. Plan Enterprise, Tarta de chocolate…"
        />

        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Día con más ventas
          </Text>
          <DayPicker
            weekStart={periodStart}
            value={bestDay}
            onChange={setBestDay}
            excludeDate={worstDay}
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Día con menos ventas
          </Text>
          <DayPicker
            weekStart={periodStart}
            value={worstDay}
            onChange={setWorstDay}
            excludeDate={bestDay}
          />
        </View>

        <Input
          label="Observaciones del período"
          value={observations}
          onChangeText={setObservations}
          placeholder="Festivo, obras, promoción activa, falta de stock…"
          multiline
          numberOfLines={4}
          style={styles.multiline}
        />
      </GlassCard>

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      {feedback ? (
        <View style={[styles.feedbackRow, { backgroundColor: `${colors.accent}18` }]}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.accentLight} />
          <Text style={[styles.feedbackText, { color: colors.accentLight }]}>{feedback}</Text>
        </View>
      ) : null}

      <Button
        label="Guardar entrada"
        onPress={handleSave}
        loading={status === 'loading'}
      />

      {/* ── Recent entries ───────────────────────────────────────────────── */}
      {entries.length > 0 && (
        <View style={styles.entriesSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Entradas recientes
          </Text>
          {entries.slice(0, 3).map((entry) => {
            const profit = entry.totalRevenue - entry.totalExpenses;
            const profitPositive = profit >= 0;
            const margin = entry.totalRevenue > 0
              ? (profit / entry.totalRevenue) * 100
              : 0;
            return (
              <GlassCard key={entry.id} style={styles.entryCard}>
                {/* Header row: period badge + date */}
                <View style={styles.entryHeader}>
                  <View style={[styles.periodPill, { backgroundColor: `${colors.primary}22` }]}>
                    <Text style={[styles.periodPillText, { color: colors.primaryLight }]}>
                      Semana
                    </Text>
                  </View>
                  <Text style={[styles.entryDate, { color: colors.textSecondary }]}>
                    {formatPeriodRange(entry.period, entry.periodDate, entry.periodEndDate)}
                  </Text>
                  <View style={styles.entryDateSpacer} />
                  {entry.source === 'import' && (
                    <View style={[styles.sourceBadge, { backgroundColor: `${colors.accent}18` }]}>
                      <Text style={[styles.sourceText, { color: colors.accentLight }]}>
                        Importado
                      </Text>
                    </View>
                  )}
                </View>

                {/* Metrics row */}
                <View style={styles.entryMetrics}>
                  <View style={styles.entryMetricItem}>
                    <Text style={[styles.entryMetricLabel, { color: colors.textSecondary }]}>
                      Ingresos
                    </Text>
                    <Text style={[styles.entryMetricValue, { color: colors.textPrimary }]}>
                      {fmt.currency(entry.totalRevenue)}
                    </Text>
                  </View>
                  <View style={styles.entryMetricItem}>
                    <Text style={[styles.entryMetricLabel, { color: colors.textSecondary }]}>
                      Gastos
                    </Text>
                    <Text style={[styles.entryMetricValue, { color: colors.textPrimary }]}>
                      {fmt.currency(entry.totalExpenses)}
                    </Text>
                  </View>
                  <View style={styles.entryMetricItem}>
                    <Text style={[styles.entryMetricLabel, { color: colors.textSecondary }]}>
                      Beneficio
                    </Text>
                    <Text
                      style={[
                        styles.entryMetricValue,
                        { color: profitPositive ? colors.accentLight : colors.error },
                      ]}
                    >
                      {profitPositive ? '+' : ''}{fmt.currency(profit)}
                    </Text>
                  </View>
                  <View style={styles.entryMetricItem}>
                    <Text style={[styles.entryMetricLabel, { color: colors.textSecondary }]}>
                      Margen
                    </Text>
                    <Text
                      style={[
                        styles.entryMetricValue,
                        { color: profitPositive ? colors.accentLight : colors.error },
                      ]}
                    >
                      {margin.toFixed(1)}%
                    </Text>
                  </View>
                </View>

                {/* Secondary row: sales + clients */}
                <View style={[styles.entrySecondary, { borderTopColor: colors.border }]}>
                  <View style={styles.entrySecItem}>
                    <Ionicons name="cart-outline" size={13} color={colors.textSecondary} />
                    <Text style={[styles.entrySecText, { color: colors.textSecondary }]}>
                      {entry.totalSales} ventas
                    </Text>
                  </View>
                  <View style={styles.entrySecItem}>
                    <Ionicons name="people-outline" size={13} color={colors.textSecondary} />
                    <Text style={[styles.entrySecText, { color: colors.textSecondary }]}>
                      {entry.totalClients} clientes
                    </Text>
                  </View>
                  {entry.bestProduct ? (
                    <View style={styles.entrySecItem}>
                      <Ionicons name="star-outline" size={13} color={colors.textSecondary} />
                      <Text
                        style={[styles.entrySecText, { color: colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {entry.bestProduct}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Observations */}
                {entry.observations ? (
                  <Text
                    style={[styles.entryObs, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {entry.observations}
                  </Text>
                ) : null}
              </GlassCard>
            );
          })}
        </View>
      )}
    </ScreenWrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const sc = StyleSheet.create({
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  optBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  optText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});

const styles = StyleSheet.create({
  // ── Stats card ──
  statsCard: {
    padding: 18,
    gap: 14,
  },
  statsTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsHint: {
    fontSize: 11,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    marginHorizontal: 4,
  },
  noDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  noDataText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },

  // ── Form cards ──
  formCard: {
    padding: 20,
    gap: 16,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  periodPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  periodPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  colItem: {
    flex: 1,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },

  // ── Feedback ──
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  // ── Entries list ──
  entriesSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  entryCard: {
    padding: 16,
    gap: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  entryDateSpacer: {
    flex: 1,
  },
  sourceBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '600',
  },
  entryMetrics: {
    flexDirection: 'row',
    gap: 4,
  },
  entryMetricItem: {
    flex: 1,
    gap: 3,
    alignItems: 'center',
  },
  entryMetricLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  entryMetricValue: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  entrySecondary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  entrySecItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  entrySecText: {
    fontSize: 12,
  },
  entryObs: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
