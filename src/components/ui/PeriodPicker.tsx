/**
 * PeriodPicker — selector de semana con navegación ← →
 * Muestra siempre semanas completas Lunes–Domingo.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import {
  dateToISO,
  fmtDDMM,
  getMondayOfWeek,
  isoToDate,
  isoWeekNumber,
  getDefaultPeriod,
} from '@/utils/periodHelpers';

interface Props {
  startDate: string; // YYYY-MM-DD (lunes)
  endDate: string;   // YYYY-MM-DD (domingo)
  onChange: (start: string, end: string) => void;
}

function shortDay(d: Date, language: string): string {
  return new Intl.DateTimeFormat(language, { weekday: 'short' })
    .format(d)
    .replace(/\.$/, '')
    .replace(/^./, c => c.toUpperCase());
}

export function PeriodPicker({ startDate, endDate, onChange }: Props) {
  const { colors, language } = useTheme();
  const { t } = useTranslation();
  const end = isoToDate(endDate);

  // The current week's Monday — cannot navigate past this
  const currentWeekStart = getDefaultPeriod('week').start;
  const isCurrentOrFuture = startDate >= currentWeekStart;

  function navigate(dir: 1 | -1) {
    if (dir === 1 && isCurrentOrFuture) return; // block forward navigation
    const mon = getMondayOfWeek(isoToDate(startDate));
    mon.setDate(mon.getDate() + dir * 7);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    onChange(dateToISO(mon), dateToISO(sun));
  }

  const week = isoWeekNumber(startDate);
  const monLabel = shortDay(isoToDate(startDate), language);
  const sunLabel = shortDay(end, language);
  const label = `${t('week_abbr')}${week} · ${monLabel} ${fmtDDMM(startDate)} – ${sunLabel} ${fmtDDMM(endDate)}/${end.getFullYear()}`;

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.border,
          backgroundColor: `${colors.primary}08`,
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => navigate(-1)}
        style={styles.arrow}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <Ionicons name="chevron-back" size={20} color={colors.primaryLight} />
      </TouchableOpacity>

      <Text
        style={[styles.label, { color: colors.textPrimary }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>

      <TouchableOpacity
        onPress={() => navigate(1)}
        style={styles.arrow}
        activeOpacity={isCurrentOrFuture ? 1 : 0.7}
        disabled={isCurrentOrFuture}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isCurrentOrFuture ? colors.border : colors.primaryLight}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  arrow: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
