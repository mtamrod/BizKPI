/**
 * OtpInput — multi-box OTP code input.
 *
 * Renders N visible boxes (default 8) that reflect the current value, but
 * delegates keyboard handling to a single hidden TextInput. Tapping anywhere
 * focuses that input. Supports paste (the OS keyboard handles it) and
 * displays a blinking caret in the active box.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface OtpInputProps {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  autoFocus?: boolean;
  error?: boolean;
}

export function OtpInput({
  value,
  onChange,
  length = 8,
  autoFocus = true,
  error = false,
}: OtpInputProps) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  // Blinking caret animation.
  const caretAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(caretAnim, {
          toValue: 0,
          duration: 500,
          delay: 400,
          useNativeDriver: true,
        }),
        Animated.timing(caretAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [caretAnim]);

  const handleChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '').slice(0, length);
    onChange(digits);
  };

  const focus = () => inputRef.current?.focus();

  const slots = Array.from({ length }, (_, i) => i);
  const activeIndex = Math.min(value.length, length - 1);
  const isComplete = value.length === length;

  return (
    <Pressable onPress={focus} style={styles.wrapper}>
      {/* Hidden input: receives keyboard, paste, etc. */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        textContentType="oneTimeCode" // iOS auto-fill hint
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        style={styles.hiddenInput}
        caretHidden
        importantForAutofill="yes"
        accessibilityLabel="Código de verificación"
      />

      {/* Visible boxes */}
      <View style={styles.row}>
        {slots.map((i) => {
          const digit = value[i] ?? '';
          const isFilled = !!digit;
          const isActive = focused && !isComplete && i === activeIndex;

          const borderColor = error
            ? colors.error
            : isActive
            ? colors.primary
            : isFilled
            ? colors.primaryLight
            : colors.border;

          return (
            <View
              key={i}
              style={[
                styles.box,
                {
                  backgroundColor: colors.glass,
                  borderColor,
                  borderWidth: isActive ? 2 : 1.5,
                  transform: isActive ? [{ scale: 1.04 }] : undefined,
                },
              ]}
            >
              <Text style={[styles.digit, { color: colors.textPrimary }]}>
                {digit}
              </Text>
              {isActive && !isFilled && (
                <Animated.View
                  style={[
                    styles.caret,
                    {
                      backgroundColor: colors.primary,
                      opacity: caretAnim,
                    },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    // Important: must be on top to capture taps when Pressable forwards focus.
    zIndex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  box: {
    flex: 1,
    aspectRatio: 0.82,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  digit: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  caret: {
    position: 'absolute',
    width: 2,
    height: 22,
    borderRadius: 1,
  },
});
