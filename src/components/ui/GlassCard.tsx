/**
 * GlassCard — redesigned with:
 *  - Gradient border (purple → green rim, 1.5 px)
 *  - Shadow wrapper WITHOUT overflow:hidden so iOS shadows work
 *  - Absolute visual layers so padding/gap from `style` flow to children directly
 *  - `pointerEvents="none"` on the layer stack so touches reach children
 */
import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  /**
   * Applied to the outer wrapper.
   * • Layout props (flex, width, height, minHeight, margin…) position the card.
   * • padding / gap / paddingHorizontal… flow to the children area.
   * Do NOT pass overflow or borderColor here — the card handles those internally.
   */
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  glowColor?: string;
}

export function GlassCard({ children, style, onPress, glowColor }: GlassCardProps) {
  const { colors, isDark } = useTheme();
  const R = colors.cardRadius; // 20

  /* ── Colour tokens ─────────────────────────────────────────────────────── */
  const borderTop: string = glowColor
    ? `${glowColor}85`
    : isDark ? 'rgba(139,92,246,0.55)' : 'rgba(124,58,237,0.32)';

  const borderBot: string = glowColor
    ? `${glowColor}22`
    : isDark ? 'rgba(16,185,129,0.14)' : 'rgba(109,40,217,0.06)';

  const glassFill: [string, string] = isDark
    ? ['rgba(22,18,36,0.97)', 'rgba(11,10,20,0.94)']
    : ['rgba(255,255,255,0.97)', 'rgba(246,248,255,0.92)'];

  const sheenBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.76)';

  /* ── Visual layers (gradient border + glass fill + sheen) ─────────────── */
  // These are absoluteFill and clipped inside an inner view so they never
  // bleed outside the card radius. pointerEvents="none" lets touches through.
  const layers = (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { borderRadius: R, overflow: 'hidden' }]}
    >
      {/* Gradient border ring — fills the full area */}
      <LinearGradient
        colors={[borderTop, borderBot]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Glass fill — inset 1.5 px from all edges, revealing the gradient ring */}
      <LinearGradient
        colors={glassFill}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { margin: 1.5 }]}
      />
      {/* Subtle top sheen */}
      <View
        style={[
          styles.sheen,
          {
            backgroundColor: sheenBg,
            borderTopLeftRadius: R - 1,
            borderTopRightRadius: R - 1,
          },
        ]}
      />
    </View>
  );

  /* ── Outer container style ─────────────────────────────────────────────── */
  // No overflow:hidden here → iOS shadow works correctly.
  // borderRadius shapes the shadow; children near corners are safe because
  // callers always pass at least 14 px of padding.
  const outerStyle: StyleProp<ViewStyle> = [
    styles.shadow,
    {
      borderRadius: R,
      shadowColor: glowColor ?? (isDark ? '#7C3AED' : '#6D28D9'),
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={outerStyle}>
        {layers}
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={outerStyle}>
      {layers}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    // iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
    // Android
    elevation: 7,
  },
  sheen: {
    position: 'absolute',
    top: 1.5,
    left: 1.5,
    right: 1.5,
    height: 44,
  },
});
