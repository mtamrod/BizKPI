import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function Header({ title, subtitle, right }: HeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.sub, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 13,
    fontWeight: '400',
  },
});
