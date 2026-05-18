/**
 * DayPicker — selecciona un día concreto dentro de una semana Lun–Dom.
 *
 * • null  → "Sin seleccionar": ← deshabilitado, → avanza a Lunes
 * • Lunes → ← limpia (vuelve a null), → avanza a Martes
 * • Mar–Sáb → navegación normal
 * • Domingo → ← retrocede a Sábado, → deshabilitado
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { dateToISO, fmtDDMM, isoToDate } from '@/utils/periodHelpers';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/** Returns "Martes 12/05" for a given ISO date string */
export function formatDayLabel(iso: string): string {
  const d = isoToDate(iso);
  return `${DAY_NAMES[d.getDay()]} ${fmtDDMM(iso)}`;
}

interface Props {
  /** Monday of the week (YYYY-MM-DD) */
  weekStart: string;
  /** Currently selected day (YYYY-MM-DD) or null */
  value: string | null;
  onChange: (date: string | null) => void;
  /** Day that cannot be selected (e.g. the day already chosen by the other picker) */
  excludeDate?: string | null;
}

export function DayPicker({ weekStart, value, onChange, excludeDate }: Props) {
  const { colors } = useTheme();

  // Build the 7 days of the week
  const weekDays: string[] = Array.from({ length: 7 }, (_, i) => {
    const d = isoToDate(weekStart);
    d.setDate(d.getDate() + i);
    return dateToISO(d);
  });

  const currentIndex  = value       ? weekDays.indexOf(value)       : -1;
  const excludedIndex = excludeDate ? weekDays.indexOf(excludeDate) : -1;

  /** Returns the next selectable index in direction dir (+1 / -1), skipping
   *  the excluded day. Returns -2 if no valid index exists in that direction. */
  function nextIndex(from: number, dir: 1 | -1): number {
    let i = from + dir;
    if (i === excludedIndex) i += dir; // skip excluded
    if (i < 0 || i > 6) return -2;    // out of bounds
    return i;
  }

  const canGoBack    = currentIndex !== -1 && nextIndex(currentIndex, -1) >= -1; // -1 = clear
  const canGoForward = currentIndex < 6 && nextIndex(currentIndex, 1) !== -2;

  function goBack() {
    if (currentIndex === -1) return;
    const ni = nextIndex(currentIndex, -1);
    if (ni < 0) { onChange(null); return; } // reached Monday (or skipped to before it) → clear
    onChange(weekDays[ni]!);
  }

  function goForward() {
    if (currentIndex === -1) {
      // null → pick first available day (skip excluded if it's Monday)
      const first = excludedIndex === 0 ? 1 : 0;
      if (first <= 6) onChange(weekDays[first]!);
      return;
    }
    const ni = nextIndex(currentIndex, 1);
    if (ni === -2) return;
    onChange(weekDays[ni]!);
  }

  const label = value ? formatDayLabel(value) : 'Sin seleccionar';
  const labelColor = value ? colors.textPrimary : colors.textSecondary;

  return (
    <View
      style={[
        styles.container,
        { borderColor: colors.border, backgroundColor: `${colors.primary}08` },
      ]}
    >
      {/* ← */}
      <TouchableOpacity
        onPress={goBack}
        style={styles.arrow}
        activeOpacity={canGoBack || currentIndex === 0 ? 0.7 : 1}
        disabled={currentIndex === -1}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <Ionicons
          name="chevron-back"
          size={20}
          color={currentIndex === -1 ? colors.border : colors.primaryLight}
        />
      </TouchableOpacity>

      {/* Label */}
      <Text
        style={[styles.label, { color: labelColor }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>

      {/* → */}
      <TouchableOpacity
        onPress={goForward}
        style={styles.arrow}
        activeOpacity={canGoForward || currentIndex === -1 ? 0.7 : 1}
        disabled={currentIndex === 6}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <Ionicons
          name="chevron-forward"
          size={20}
          color={currentIndex === 6 ? colors.border : colors.primaryLight}
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
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
