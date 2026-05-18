import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeContext';
import type { ChartPoint } from '@/types';

interface Props {
  points: ChartPoint[];
  height?: number;
}

function buildCoords(
  points: ChartPoint[],
  w: number,
  h: number,
  pad: number,
) {
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  return points.map((p, i) => ({
    x: pad + (i * (w - pad * 2)) / Math.max(points.length - 1, 1),
    y: h - pad - ((p.value - min) / range) * (h - pad * 2),
    label: p.label,
  }));
}

export function LineChart({ points, height = 160 }: Props) {
  const { colors } = useTheme();
  if (!points.length) return null;
  const W = 320;
  const H = height;
  const PAD = 16;
  const coords = buildCoords(points, W, H, PAD);

  const linePath = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`)
    .join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1]?.x ?? W - PAD} ${H - PAD} L ${coords[0]?.x ?? PAD} ${H - PAD} Z`;

  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <LinearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%"   stopColor={colors.primaryLight} />
            <Stop offset="100%" stopColor={colors.accentLight}  />
          </LinearGradient>
          <LinearGradient id="area" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%"   stopColor={colors.primaryLight} stopOpacity={0.28} />
            <Stop offset="100%" stopColor={colors.primaryLight} stopOpacity={0.01} />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#area)" />
        <Path d={linePath} fill="none" stroke="url(#lg)" strokeWidth={2.5} strokeLinecap="round" />
        {coords.map((c, i) => (
          <Circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={4}
            fill={colors.bg}
            stroke={colors.primaryLight}
            strokeWidth={2}
          />
        ))}
      </Svg>
      <View style={styles.labels}>
        {points.map((p, i) => (
          <Text key={i} style={[styles.label, { color: colors.textSecondary }]}>
            {p.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  label: {
    fontSize: 11,
  },
});
