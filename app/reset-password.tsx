import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabaseClient';
import { useTheme } from '@/theme/ThemeContext';

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving]                   = useState(false);
  const [error, setError]                     = useState('');

  async function handleSubmit() {
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

  async function handleCancel() {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }

  return (
    <ScreenWrapper scrollable keyboardAware contentStyle={styles.content}>
      <View style={styles.logoArea}>
        <View style={[styles.iconBox, { backgroundColor: `${colors.primary}22` }]}>
          <Ionicons name="lock-open-outline" size={34} color={colors.primaryLight} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t('reset_password_title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('reset_password_subtitle')}
        </Text>
      </View>

      <GlassCard style={styles.card}>
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

        {error ? (
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        ) : null}

        <Button
          label={t('reset_password_submit')}
          onPress={handleSubmit}
          loading={saving}
        />

        <Text
          style={[styles.backLink, { color: colors.primaryLight }]}
          onPress={handleCancel}
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
