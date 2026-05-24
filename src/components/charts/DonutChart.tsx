/**
 * @file DonutChart.tsx
 * @description Animated-looking donut (ring) chart rendered with react-native-svg.
 *
 * Each segment is drawn as an SVG `<Circle>` with `strokeDasharray` / `strokeDashoffset`
 * — a standard SVG technique that avoids complex arc path calculations.
 * The largest segment is placed at the top (12 o'clock) by rotating the
 * SVG group -90°. Segments are sorted largest-first so the most prominent
 * slice is always at the top-right and clearly visible.
 *
 * A centre overlay shows the value and label of the dominant (largest) segment.
 * A legend below lists up to 4 segments with colour pills and percentages.
 *
 * @example
 * <DonutChart
 *   segments={[
 *     { id: 'profit',   label: 'Beneficio', value: 45, color: '#10B981' },
 *     { id: 'expenses', label: 'Gastos',    value: 55, color: '#EF4444' },
 *   ]}
 *   size={130}
 * />
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeContext';
import type { CategorySegment } from '@/types';

interface Props {
  /**
   * Segments to render. `value` is a percentage (0–100); the component
   * normalises the total so partial sums work too.
   */
  segments: CategorySegment[];
  /** Outer diameter of the donut in logical pixels. Defaults to 110. */
  size?: number;
}

/** Renders nothing if `segments` is empty. */
export function DonutChart({ segments, size = 110 }: Props) {
  const { colors } = useTheme();
  if (!segments.length) return null;

  const strokeWidth = 16;
  const r    = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r; // full circumference

  // Normalise so segments always sum to 100 (handles partial data gracefully)
  const total = Math.max(segments.reduce((s, seg) => s + seg.value, 0), 1);

  // Sort largest-first so the dominant segment starts at the top
  const sorted = [...segments].sort((a, b) => b.value - a.value);
  const top = sorted[0]!; // dominant segment shown in the centre

  // Build arc descriptors: each segment's dash length and cumulative offset
  let cumOffset = 0;
  const arcs = sorted.map((seg) => {
    const dash = (seg.value / total) * circ;
    const arc  = { seg, dash, offset: cumOffset };
    cumOffset += dash;
    return arc;
  });

  return (
    <View style={styles.container}>
      {/* ── Donut ring + centre label ──────────────────────────────────── */}
      <View style={styles.donutWrapper}>
        <Svg width={size} height={size}>
          {/*
           * Rotate -90° so the first segment starts at 12 o'clock instead of
           * 3 o'clock (SVG's default start angle for stroke-dashoffset).
           */}
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            {/* Background track ring */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="rgba(148,163,184,0.12)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Coloured segment arcs */}
            {arcs.map(({ seg, dash, offset }) => (
              <Circle
                key={seg.id}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                fill="none"
              />
            ))}
          </G>
        </Svg>

        {/* Absolute-positioned centre label showing the dominant segment */}
        <View style={[StyleSheet.absoluteFill, styles.centre]}>
          <Text style={[styles.centreValue, { color: top.color }]}>
            {top.value}%
          </Text>
          <Text
            style={[styles.centreLabel, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {top.label}
          </Text>
        </View>
      </View>

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <View style={styles.legend}>
        {sorted.slice(0, 4).map((seg) => (
          <View key={seg.id} style={styles.legendRow}>
            <View style={[styles.pill, { backgroundColor: seg.color }]} />
            <Text
              style={[styles.legendLabel, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {seg.label}
            </Text>
            <Text style={[styles.legendPct, { color: colors.textPrimary }]}>
              {seg.value}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 14,
  },
  donutWrapper: {
    position: 'relative',
  },
  centre: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centreValue: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  centreLabel: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
    maxWidth: 56,
    textAlign: 'center',
  },
  legend: {
    width: '100%',
    gap: 7,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  pill: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    flex: 1,
    fontSize: 11,
    lineHeight: 14,
  },
  legendPct: {
    fontSize: 11,
    fontWeight: '700',
  },
});
