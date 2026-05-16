/**
 * PeriodPicker — selector de período con navegación ← →
 *
 * • Día    → muestra DD/MM/YYYY, avanza/retrocede de día en día
 * • Semana → muestra "Lun DD/MM – Dom DD/MM/YYYY", siempre semanas Lun–Dom
 * • Mes    → muestra "Mes YYYY", siempre meses completos del calendario
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import {
  dateToISO,
  fmtDDMMYYYY,
  fmtDDMM,
  getMondayOfWeek,
  getFirstOfMonth,
  getLastOfMonth,
  isoToDate,
} from '@/utils/periodHelpers';
import type { PeriodType } from '@/types';

const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

interface Props {
  type: PeriodType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
}

export function PeriodPicker({ type, startDate, endDate, onChange }: Props) {
  const { colors } = useTheme();
  const start = isoToDate(startDate);
  const end   = isoToDate(endDate);

  // ── Navigation ──────────────────────────────────────────────────────────────

  function navigate(dir: 1 | -1) {
    if (type === 'day') {
      const d = new Date(start);
      d.setDate(d.getDate() + dir);
      const iso = dateToISO(d);
      onChange(iso, iso);

    } else if (type === 'week') {
      const mon = getMondayOfWeek(start);
      mon.setDate(mon.getDate() + dir * 7);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      onChange(dateToISO(mon), dateToISO(sun));

    } else {
      // month — go to first day of prev/next month
      const d = new Date(start.getFullYear(), start.getMonth() + dir, 1);
      onChange(dateToISO(getFirstOfMonth(d)), dateToISO(getLastOfMonth(d)));
    }
  }

  // ── Label ────────────────────────────────────────────────────────────────────

  function getLabel(): string {
    if (type === 'day') return fmtDDMMYYYY(startDate);

    if (type === 'week') {
      return `Lun ${fmtDDMM(startDate)} – Dom ${fmtDDMM(endDate)}/${end.getFullYear()}`;
    }

    // month
    return `${MONTHS[start.getMonth()]} ${start.getFullYear()}`;
  }

  // ── Render ───────────────────────────────────────────────────────────────────

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
        {getLabel()}
      </Text>

      <TouchableOpacity
        onPress={() => navigate(1)}
        style={styles.arrow}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <Ionicons name="chevron-forward" size={20} color={colors.primaryLight} />
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
