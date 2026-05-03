import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ComponentProps<typeof Ionicons>['name'];
  rightIcon?: React.ComponentProps<typeof Ionicons>['name'];
  onRightIconPress?: () => void;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry,
  style,
  ...rest
}: InputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(secureTextEntry ?? false);

  const borderColor = error
    ? colors.error
    : focused
    ? colors.primary
    : colors.border;

  const eyeIcon = secure ? 'eye-outline' : 'eye-off-outline';

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      ) : null}

      <View
        style={[
          styles.row,
          {
            borderColor,
            backgroundColor: `${colors.glass}`,
            borderRadius: 12,
          },
        ]}
      >
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={18}
            color={focused ? colors.primary : colors.textSecondary}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              flex: 1,
            },
            style,
          ]}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={secure}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />

        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setSecure((s) => !s)}
            style={styles.rightIcon}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={eyeIcon} size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={rightIcon} size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 10,
    padding: 2,
  },
  input: {
    fontSize: 15,
    paddingVertical: 12,
  },
  error: {
    fontSize: 12,
    fontWeight: '500',
  },
});
