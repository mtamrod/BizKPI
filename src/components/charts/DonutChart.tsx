import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeContext';
import type { CategorySegment } from '@/types';

interface Props {
  segments: CategorySegment[];
  size?: number;
}

export function DonutChart({ segments, size = 110 }: Props) {
  const { colors } = useTheme();
  const strokeWidth = 16;
  const r           = (size - strokeWidth) / 2;
  const circ        = 2 * Math.PI * r;
  const total       = Math.max(segments.reduce((s, seg) => s + seg.value, 0), 1);

  // Sort so the biggest slice starts at the top
  const sorted = [...segments].sort((a, b) => b.value - a.value);
  const top    = sorted[0]!;

  let cumOffset = 0;
  const arcs = sorted.map((seg) => {
    const dash = (seg.value / total) * circ;
    const arc  = { seg, dash, offset: cumOffset };
    cumOffset += dash;
    return arc;
  });

  return (
    <View style={styles.container}>
      {/* ── Donut + centre label ────────────────────────────── */}
      <View style={styles.donutWrapper}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            {/* track ring */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="rgba(148,163,184,0.12)"
              strokeWidth={strokeWidth}
              fill="none"
            />
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

        {/* Absolute centre overlay */}
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

      {/* ── Legend ─────────────────────────────────────────── */}
      <View style={styles.legend}>
        {sorted.slice(0, 4).map((seg) => (
          <View key={seg.id} style={styles.legendRow}>
            {/* Colour pill */}
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
