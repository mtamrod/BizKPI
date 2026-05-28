import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabaseClient';
import { useTheme } from '@/theme/ThemeContext';

type Stage = 'verify' | 'change';

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email ?? '';

  const [stage, setStage]                 = useState<Stage>('verify');
  const [code, setCode]                   = useState('');
  const [newPassword, setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState('');

  // If user arrived via deep link (session already set), skip the OTP stage.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStage('change');
    });
  }, []);

  async function verifyCode() {
    setError('');
    if (code.length !== 8) {
      setError(t('verify_code_invalid'));
      return;
    }
    if (!email) {
      setError(t('verify_code_no_email'));
      return;
    }
    setSaving(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'recovery',
    });
    setSaving(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    setStage('change');
    setError('');
  }

  async function changePassword() {
    setError('');
    if (newPassword.length < 6) {
      setError(t('reset_password_too_short'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('reset_password_mismatch'));
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    Alert.alert(
      t('reset_password_success_title'),
      t('reset_password_success_msg'),
      [
        {
          text: 'OK',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  }

  async function handleBack() {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }

  const isVerify = stage === 'verify';

  return (
    <ScreenWrapper scrollable keyboardAware contentStyle={styles.content}>
      <View style={styles.logoArea}>
        <View style={[styles.iconBox, { backgroundColor: `${colors.primary}22` }]}>
          <Ionicons
            name={isVerify ? 'mail-outline' : 'lock-open-outline'}
            size={34}
            color={colors.primaryLight}
          />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {isVerify ? t('verify_code_title') : t('reset_password_title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {isVerify
            ? t('verify_code_subtitle', { email: email || '—' })
            : t('reset_password_subtitle')}
        </Text>
      </View>

      <GlassCard style={styles.card}>
        {isVerify ? (
          <Input
            label={t('verify_code_label')}
            value={code}
            onChangeText={(v) => setCode(v.replace(/[^0-9]/g, '').slice(0, 8))}
            placeholder="12345678"
            keyboardType="number-pad"
            maxLength={8}
            leftIcon="keypad-outline"
            autoFocus
          />
        ) : (
          <View style={styles.form}>
            <Input
              label={t('reset_password_new_label')}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={t('reset_password_new_placeholder')}
              secureTextEntry
              leftIcon="lock-closed-outline"
            />
            <Input
              label={t('reset_password_confirm_label')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t('reset_password_confirm_placeholder')}
              secureTextEntry
              leftIcon="lock-closed-outline"
            />
          </View>
        )}

        {error ? (
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        ) : null}

        <Button
          label={isVerify ? t('verify_code_submit') : t('reset_password_submit')}
          onPress={isVerify ? verifyCode : changePassword}
          loading={saving}
        />

        <Text
          style={[styles.backLink, { color: colors.primaryLight }]}
          onPress={handleBack}
        >
          {t('reset_password_back_to_login')}
        </Text>
      </GlassCard>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center', paddingVertical: 32, gap: 24 },
  logoArea: { alignItems: 'center', gap: 8 },
  iconBox: {
    width: 72, height: 72, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  subtitle: {
    fontSize: 14, fontWeight: '400',
    textAlign: 'center', maxWidth: 320, lineHeight: 20,
  },
  card: { padding: 24, gap: 16 },
  form: { gap: 12 },
  errorText: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  backLink: {
    fontSize: 13, fontWeight: '600',
    textAlign: 'center', marginTop: 4,
  },
});
