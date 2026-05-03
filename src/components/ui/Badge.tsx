import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface BadgeProps {
  value: number;
  size?: 'sm' | 'md';
}

export function TrendBadge({ value, size = 'sm' }: BadgeProps) {
  const { colors } = useTheme();
  const positive = value >= 0;

  const bg = positive ? `${colors.accent}22` : `${colors.error}22`;
  const textColor = positive ? colors.accentLight : colors.error;
  const arrow = positive ? '▲' : '▼';
  const label = `${arrow} ${Math.abs(value).toFixed(1)}%`;
  const fontSize = size === 'sm' ? 11 : 13;

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: textColor, fontSize }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
