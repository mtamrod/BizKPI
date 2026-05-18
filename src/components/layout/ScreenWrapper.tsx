import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBackground } from './AppBackground';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  keyboardAware?: boolean;
  contentStyle?: ViewStyle;
  paddingTop?: number;
  /** Pull-to-refresh: pass the reload function */
  onRefresh?: () => void;
  /** Whether the refresh indicator is spinning */
  refreshing?: boolean;
}

export function ScreenWrapper({
  children,
  scrollable = true,
  keyboardAware = false,
  contentStyle,
  paddingTop = 12,
  onRefresh,
  refreshing = false,
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();

  const inner = scrollable ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
      contentContainerStyle={[
        {
          flexGrow: 1,
          paddingTop,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 16,
          gap: 16,
        },
        contentStyle,
      ]}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        {
          flex: 1,
          paddingTop,
          paddingHorizontal: 16,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <AppBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={keyboardAware ? (Platform.OS === 'ios' ? 'padding' : 'height') : undefined}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {inner}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </AppBackground>
  );
}
