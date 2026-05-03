import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
  View,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  label,
  variant = 'primary',
  loading = false,
  fullWidth = true,
  size = 'md',
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();

  const bg: Record<ButtonVariant, string> = {
    primary:   colors.primary,
    secondary: `${colors.primary}22`,
    ghost:     'transparent',
    danger:    colors.error,
  };

  const textColor: Record<ButtonVariant, string> = {
    primary:   '#FFFFFF',
    secondary: colors.primaryLight,
    ghost:     colors.textSecondary,
    danger:    '#FFFFFF',
  };

  const borderColor: Record<ButtonVariant, string> = {
    primary:   'transparent',
    secondary: `${colors.primary}44`,
    ghost:     'transparent',
    danger:    'transparent',
  };

  const heights: Record<'sm' | 'md' | 'lg', number> = { sm: 40, md: 50, lg: 56 };
  const fontSizes: Record<'sm' | 'md' | 'lg', number> = { sm: 13, md: 15, lg: 16 };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          backgroundColor: bg[variant],
          borderColor: borderColor[variant],
          borderWidth: variant === 'secondary' ? 1 : 0,
          height: heights[size],
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          paddingHorizontal: fullWidth ? 0 : 24,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? '#fff' : colors.primary}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.label,
            { color: textColor[variant], fontSize: fontSizes[size] },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
