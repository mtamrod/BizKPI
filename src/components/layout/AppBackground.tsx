import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeContext';

export function AppBackground({ children }: { children: React.ReactNode }) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <LinearGradient
        colors={
          isDark
            ? ['#05060A', '#0C1022', '#070914']
            : ['#F8FAFF', '#EEF1FF', '#EBF0FB']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Purple halo top-right */}
      <View
        style={[
          styles.halo,
          {
            backgroundColor: isDark
              ? 'rgba(124,58,237,0.20)'
              : 'rgba(109,40,217,0.10)',
            top: -50,
            right: -40,
          },
        ]}
      />
      {/* Green halo bottom-left */}
      <View
        style={[
          styles.halo,
          {
            backgroundColor: isDark
              ? 'rgba(16,185,129,0.15)'
              : 'rgba(16,185,129,0.08)',
            bottom: 100,
            left: -50,
          },
        ]}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  halo: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  content: { flex: 1 },
});
