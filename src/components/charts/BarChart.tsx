/**
 * @file BarChart.tsx
 * @description Vertical bar chart with gradient-highlighted recent bars.
 *
 * Each bar is rendered inside a fixed-height "track" so bars are always
 * comparable in proportion. The last `highlightLast` bars are drawn with an
 * accent gradient and display their value above; earlier bars use a muted
 * fill to emphasise the most recent data.
 *
 * @example
 * <BarChart
 *   points={weeklySeries}
 *   highlightLast={2}
 * />
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeContext';
import type { ChartPoint } from '@/types';

interface Props {
  /** Data points to render as bars, left to right. */
  points: ChartPoint[];
  /**
   * How many trailing bars (from the right) to render with the accent gradient
   * and value label. Defaults to 2 (current + previous week).
   */
  highlightLast?: number;
}

/** Renders nothing if `points` is empty. */
export function BarChart({ points, highlightLast = 2 }: Props) {
  const { colors, isDark } = useTheme();
  if (!points.length) return null;

  const max = Math.max(...points.map((p) => p.value), 1);
  const TRACK_H = 100; // fixed track height in logical pixels

  return (
    <View style={styles.container}>
      {points.map((p, i) => {
        // Minimum bar height of 5px so zero-value weeks are still visible
        const barH = Math.max((p.value / max) * (TRACK_H - 8), 5);
        const highlighted = i >= points.length - highlightLast;

        return (
          <View key={i} style={styles.col}>
            {/* Value label — only rendered (visible) on highlighted bars */}
            <Text
              style={[
                styles.valueLabel,
                {
                  color: highlighted ? colors.accentLight : 'transparent',
                  opacity: highlighted ? 1 : 0,
                },
              ]}
            >
              {p.value}
            </Text>

            {/* Track — the fixed-height background container for the bar */}
            <View
              style={[
                styles.track,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(0,0,0,0.04)',
                  height: TRACK_H,
                },
              ]}
            >
              {highlighted ? (
                // Accent gradient bar for recent weeks
                <LinearGradient
                  colors={[colors.accentLight, colors.accent]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={[styles.bar, { height: barH }]}
                />
              ) : (
                // Muted bar for older weeks
                <View
                  style={[
                    styles.bar,
                    {
                      height: barH,
                      backgroundColor: isDark
                        ? 'rgba(139,92,246,0.28)'
                        : 'rgba(109,40,217,0.18)',
                    },
                  ]}
                />
              )}
            </View>

            {/* X-axis label (week abbreviation, e.g. "S18") */}
            <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>
              {p.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

BarChart.displayName = 'BarChart';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  valueLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  track: {
    width: '100%',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    padding: 3,
  },
  bar: {
    width: '100%',
    borderRadius: 6,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
