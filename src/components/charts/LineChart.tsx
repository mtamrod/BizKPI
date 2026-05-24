/**
 * @file LineChart.tsx
 * @description Gráfica de líneas con gradiente y área rellena, renderizada con react-native-svg.
 *
 * La gráfica escala automáticamente el eje Y al min/max de los datos proporcionados,
 * de modo que la tendencia siempre es visualmente prominente independientemente del
 * rango de valores absolutos. El área rellena bajo la línea usa un gradiente vertical
 * para dar profundidad.
 *
 * @example
 * <LineChart
 *   points={[{ label: 'S18', value: 12400 }, { label: 'S19', value: 15000 }]}
 *   height={160}
 * />
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeContext';
import type { ChartPoint } from '@/types';

interface Props {
  /** Data points to plot, in left-to-right order. */
  points: ChartPoint[];
  /** Chart height in logical pixels. Defaults to 160. */
  height?: number;
}

/**
 * Transforma un array de puntos de datos a coordenadas del canvas SVG.
 * Normaliza los valores entre `min` y `max` al área dibujable `[pad, h - pad]`,
 * asegurando que los puntos nunca toquen el borde del canvas.
 *
 * @param points - Puntos de datos brutos
 * @param w      - Anchura del canvas (fija en 320 unidades de viewBox)
 * @param h      - Altura del canvas
 * @param pad    - Margen en todos los lados en unidades de viewBox
 */
function buildCoords(
  points: ChartPoint[],
  w: number,
  h: number,
  pad: number,
) {
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1); // avoid division by zero when all values are equal
  return points.map((p, i) => ({
    x: pad + (i * (w - pad * 2)) / Math.max(points.length - 1, 1),
    y: h - pad - ((p.value - min) / range) * (h - pad * 2),
    label: p.label,
  }));
}

/** No renderiza nada si `points` está vacío. */
export function LineChart({ points, height = 160 }: Props) {
  const { colors } = useTheme();
  if (!points.length) return null;

  const W = 320; // fixed viewBox width — scales to container via width="100%"
  const H = height;
  const PAD = 16;
  const coords = buildCoords(points, W, H, PAD);

  // SVG path strings: the line itself and the filled area below it
  const linePath = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`)
    .join(' ');
  const areaPath =
    `${linePath} ` +
    `L ${coords[coords.length - 1]?.x ?? W - PAD} ${H - PAD} ` +
    `L ${coords[0]?.x ?? PAD} ${H - PAD} Z`;

  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          {/* Horizontal gradient for the line stroke */}
          <LinearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%"   stopColor={colors.primaryLight} />
            <Stop offset="100%" stopColor={colors.accentLight}  />
          </LinearGradient>
          {/* Vertical gradient for the area fill (fade to transparent) */}
          <LinearGradient id="area" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%"   stopColor={colors.primaryLight} stopOpacity={0.28} />
            <Stop offset="100%" stopColor={colors.primaryLight} stopOpacity={0.01} />
          </LinearGradient>
        </Defs>
        {/* Area fill */}
        <Path d={areaPath} fill="url(#area)" />
        {/* Line stroke */}
        <Path d={linePath} fill="none" stroke="url(#lg)" strokeWidth={2.5} strokeLinecap="round" />
        {/* Data point dots */}
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
      {/* X-axis labels */}
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
