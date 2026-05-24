/**
 * @file RecoBody.tsx
 * @description Vista de solo lectura compartida de un objeto `Recommendation` de IA.
 *
 * Renderiza cuatro secciones en orden:
 * 1. **Tarjeta de resumen** — Resumen generado por IA + fecha de generación + modelo usado
 * 2. **Destacados**         — Lista de elementos `RecommendationHighlight` con
 *    codificación de color e iconos según tipo positivo / negativo / neutro
 * 3. **Acciones**           — Tarjetas `RecommendationAction` numeradas con badges
 *    de prioridad (alta → rojo, media → ámbar, baja → verde)
 * 4. **Previsión**          — Perspectiva de texto libre para la próxima semana
 *    (solo cuando está disponible)
 *
 * Las secciones 2–4 solo se renderizan cuando el array/campo correspondiente
 * no está vacío, por lo que el componente degrada correctamente ante respuestas
 * de IA incompletas.
 *
 * @example
 * <RecoBody reco={recommendation} />
 */
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/theme/ThemeContext';
import type {
  Recommendation,
  RecommendationHighlight,
  RecommendationAction,
} from '@/services/recommendationService';

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Renderiza un elemento de destacado como tarjeta con borde izquierdo.
 * El color del borde, el icono y el color del texto se determinan según `item.type`:
 * - `'positive'` → icono verde de tendencia al alza
 * - `'negative'` → icono rojo de tendencia a la baja
 * - `'neutral'`  → icono azul neutro
 */
function HighlightCard({ item }: { item: RecommendationHighlight }) {
  const { colors } = useTheme();
  const CONFIG = {
    positive: { icon: 'trending-up-outline'   as const, color: '#10B981' },
    negative: { icon: 'trending-down-outline' as const, color: colors.error },
    neutral:  { icon: 'remove-outline'        as const, color: '#3B82F6' },
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

/**
 * Renderiza una acción recomendada como `GlassCard` con:
 * - Un badge de índice numerado (base 1)
 * - El área de negocio en versalitas
 * - Un badge de prioridad con código de color
 * - El texto de la acción y su justificación
 *
 * @param item  - La acción a mostrar
 * @param index - Posición base 0 en el array de acciones (se muestra como base 1)
 */
function ActionCard({ item, index }: { item: RecommendationAction; index: number }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const PRIORITY = {
    high:   { label: t('reco_priority_high'),   color: '#EF4444', bg: '#EF444415' },
    medium: { label: t('reco_priority_medium'), color: '#F59E0B', bg: '#F59E0B15' },
    low:    { label: t('reco_priority_low'),    color: '#10B981', bg: '#10B98115' },
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

// ─── RecoBody ─────────────────────────────────────────────────────────────────

/**
 * Muestra el contenido completo de una recomendación de IA.
 *
 * Todo el contenido es de solo lectura — los botones de acción (regenerar,
 * eliminar) son responsabilidad de la pantalla padre, manteniendo este
 * componente puramente presentacional y reutilizable.
 *
 * @param reco - El objeto `Recommendation` devuelto por `recommendationService`
 */
export function RecoBody({ reco }: { reco: Recommendation }) {
  const { colors, language } = useTheme();
  const { t } = useTranslation();
  const content = reco.recommendations;
  const genDate = new Date(reco.generated_at).toLocaleDateString(language, {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <View style={styles.body}>
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
      {Boolean(content.forecast) && (
        <GlassCard style={styles.forecastCard}>
          <View style={styles.forecastHeader}>
            <Ionicons name="telescope-outline" size={18} color={colors.accentLight} />
            <Text style={[styles.forecastLabel, { color: colors.accentLight }]}>{t('reco_forecast')}</Text>
          </View>
          <Text style={[styles.forecastText, { color: colors.textPrimary }]}>{content.forecast}</Text>
        </GlassCard>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  body: { gap: 16 },

  // Summary
  summaryCard:   { padding: 18, gap: 12 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryLabel:  { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  summaryText:   { fontSize: 14, lineHeight: 22, fontWeight: '400' },
  genDate:       { fontSize: 11 },

  // Section
  section:      { gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },

  // Highlight
  highlightCard:   { borderLeftWidth: 3, borderRadius: 10, padding: 12, gap: 6 },
  highlightHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  highlightTitle:  { fontSize: 13, fontWeight: '700', flex: 1 },
  highlightDesc:   { fontSize: 13, lineHeight: 19 },

  // Action
  actionCard:      { padding: 16, gap: 8 },
  actionHeader:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionIndex:     { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actionIndexText: { fontSize: 12, fontWeight: '700' },
  actionArea:      { flex: 1, fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  priorityBadge:   { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  priorityText:    { fontSize: 10, fontWeight: '700' },
  actionText:      { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  rationaleText:   { fontSize: 13, lineHeight: 19 },

  // Forecast
  forecastCard:   { padding: 18, gap: 10 },
  forecastHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  forecastLabel:  { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  forecastText:   { fontSize: 14, lineHeight: 22 },
});
