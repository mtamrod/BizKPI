import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/theme/ThemeContext';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const { login, register, status, error } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [mode, setMode]               = useState<Mode>('login');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [businessName, setBusinessName] = useState('');
  const [rememberMe, setRememberMe]   = useState(true);
  const [localError, setLocalError]   = useState('');

  function switchMode(next: Mode) {
    setMode(next);
    setLocalError('');
    setEmail('');
    setPassword('');
    setBusinessName('');
  }

  function validate(): boolean {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) { setLocalError(t('login_error_email')); return false; }
    if (password.length < 6) { setLocalError(t('login_error_password')); return false; }
    if (mode === 'register' && !businessName.trim()) {
      setLocalError(t('login_error_business')); return false;
    }
    return true;
  }

  async function handleSubmit() {
    setLocalError('');
    if (!validate()) return;

    if (mode === 'login') {
      await login({ email: email.trim().toLowerCase(), password, rememberMe });
      return;
    }

    const needsConfirmation = await register({
      email: email.trim().toLowerCase(),
      password,
      businessName: businessName.trim(),
    });

    if (needsConfirmation) {
      Alert.alert(
        t('login_confirm_title'),
        t('login_confirm_msg'),
        [{ text: t('login_understood'), onPress: () => switchMode('login') }],
      );
    }
  }

  const displayError = localError || error;
  const isLoading = status === 'loading';

  return (
    <ScreenWrapper scrollable keyboardAware contentStyle={styles.content}>
      <View style={styles.logoArea}>
        <View style={[styles.logoBox, { backgroundColor: `${colors.primary}22` }]}>
          <Ionicons name="trending-up" size={34} color={colors.primaryLight} />
        </View>
        <Text style={[styles.appName, { color: colors.primaryLight }]}>BizKPI</Text>
        <Text style={[styles.appSub, { color: colors.textSecondary }]}>
          {t('app_subtitle')}
        </Text>
      </View>

      <GlassCard style={styles.card}>
        <Text style={[styles.welcome, { color: colors.textPrimary }]}>
          {mode === 'login' ? t('login_welcome') : t('login_register_title')}
        </Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>
          {mode === 'login' ? t('login_desc') : t('login_register_desc')}
        </Text>

        <View style={styles.form}>
          {mode === 'register' && (
            <Input
              label={t('login_business_name_label')}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder={t('login_business_name_placeholder')}
              autoCapitalize="words"
              leftIcon="business-outline"
            />
          )}
          <Input
            label={t('login_email_label')}
            value={email}
            onChangeText={setEmail}
            placeholder={t('login_email_placeholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon="mail-outline"
          />
          <Input
            label={t('login_password_label')}
            value={password}
            onChangeText={setPassword}
            placeholder={mode === 'register' ? t('login_password_register_placeholder') : t('login_password_placeholder')}
            secureTextEntry
            leftIcon="lock-closed-outline"
          />
        </View>

        {mode === 'login' && (
          <View style={[styles.rememberRow, { borderColor: colors.border, backgroundColor: colors.glass }]}>
            <View style={styles.rememberText}>
              <Text style={[styles.rememberTitle, { color: colors.textPrimary }]}>{t('login_remember')}</Text>
              <Text style={[styles.rememberSub, { color: colors.textSecondary }]}>{t('login_remember_sub')}</Text>
            </View>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: colors.border, true: `${colors.primary}88` }}
              thumbColor={rememberMe ? colors.primary : colors.textSecondary}
            />
          </View>
        )}

        {mode === 'login' && (
          <View style={styles.forgotRow}>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('login_forgot')}</Text>
            <Text
              style={[styles.link, { color: colors.primaryLight }]}
              onPress={() =>
                Alert.alert(
                  t('login_recover_title'),
                  t('login_recover_msg'),
                  [
                    { text: t('login_recover_cancel'), style: 'cancel' },
                    {
                      text: t('login_recover_send'),
                      onPress: async () => {
                        if (!email.trim()) { Alert.alert(t('login_no_email')); return; }
                        const { supabase } = await import('@/lib/supabaseClient');
                        const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
                        if (err) Alert.alert('Error', err.message);
                        else Alert.alert(t('login_recover_sent_title'), t('login_recover_sent_msg', { email: email.trim() }));
                      },
                    },
                  ],
                )
              }
            >
              {t('login_recover')}
            </Text>
          </View>
        )}

        {displayError ? (
          <Text style={[styles.errorText, { color: colors.error }]}>{displayError}</Text>
        ) : null}

        <Button
          label={mode === 'login' ? t('login_btn_signin') : t('login_btn_register')}
          onPress={handleSubmit}
          loading={isLoading}
        />

        <View style={styles.toggleRow}>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {mode === 'login' ? t('login_no_account') : t('login_has_account')}
          </Text>
          <Text
            style={[styles.link, { color: colors.primaryLight }]}
            onPress={() => switchMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? t('login_to_register') : t('login_to_signin')}
          </Text>
        </View>
      </GlassCard>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center', paddingVertical: 32, gap: 24 },
  logoArea: { alignItems: 'center', gap: 8 },
  logoBox: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  appSub: { fontSize: 14, fontWeight: '400' },
  card: { padding: 24, gap: 16 },
  welcome: { fontSize: 24, fontWeight: '700' },
  desc: { fontSize: 14, lineHeight: 20 },
  form: { gap: 12 },
  rememberRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  rememberText: { flex: 1, gap: 2 },
  rememberTitle: { fontSize: 14, fontWeight: '600' },
  rememberSub: { fontSize: 12 },
  forgotRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  hint: { fontSize: 12 },
  link: { fontSize: 13, fontWeight: '600' },
  errorText: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
});
