import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/theme/ThemeContext';

export default function LoginScreen() {
  const { login, status, error } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail]         = useState('demo@bizkpi.com');
  const [password, setPassword]   = useState('BizKPI2024');
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState('');

  async function handleSubmit() {
    setLocalError('');
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) { setLocalError('Introduce un correo válido.'); return; }
    if (password.length < 6) { setLocalError('La contraseña debe tener al menos 6 caracteres.'); return; }
    await login({ email: email.trim().toLowerCase(), password, rememberMe });
  }

  const displayError = localError || error;

  return (
    <ScreenWrapper scrollable keyboardAware contentStyle={styles.content}>
      {/* Logo */}
      <View style={styles.logoArea}>
        <View style={[styles.logoBox, { backgroundColor: `${colors.primary}22` }]}>
          <Ionicons name="trending-up" size={34} color={colors.primaryLight} />
        </View>
        <Text style={[styles.appName, { color: colors.primaryLight }]}>BizKPI</Text>
        <Text style={[styles.appSub, { color: colors.textSecondary }]}>
          Business Intelligence Platform
        </Text>
      </View>

      <GlassCard style={styles.card}>
        <Text style={[styles.welcome, { color: colors.textPrimary }]}>Bienvenido</Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>
          Centraliza ingresos, usuarios y rendimiento operativo desde una sola vista móvil.
        </Text>

        <View style={styles.form}>
          <Input
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@empresa.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon="mail-outline"
          />
          <Input
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="Introduce tu contraseña"
            secureTextEntry
            leftIcon="lock-closed-outline"
          />
        </View>

        {/* Remember me */}
        <View style={[styles.rememberRow, { borderColor: colors.border, backgroundColor: colors.glass }]}>
          <View style={styles.rememberText}>
            <Text style={[styles.rememberTitle, { color: colors.textPrimary }]}>Recordar sesión</Text>
            <Text style={[styles.rememberSub, { color: colors.textSecondary }]}>
              Persiste tu acceso entre aperturas
            </Text>
          </View>
          <Switch
            value={rememberMe}
            onValueChange={setRememberMe}
            trackColor={{ false: colors.border, true: `${colors.primary}88` }}
            thumbColor={rememberMe ? colors.primary : colors.textSecondary}
          />
        </View>

        {/* Forgot password */}
        <View style={styles.forgotRow}>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Acceso demo disponible
          </Text>
          <Text
            style={[styles.link, { color: colors.primaryLight }]}
            onPress={() =>
              Alert.alert(
                'Recuperar contraseña',
                'El flujo real se activará cuando exista backend. En esta v1 usa las credenciales demo.',
              )
            }
          >
            Recuperar contraseña
          </Text>
        </View>

        {displayError ? (
          <Text style={[styles.errorText, { color: colors.error }]}>{displayError}</Text>
        ) : null}

        <Button
          label="Iniciar sesión"
          onPress={handleSubmit}
          loading={status === 'loading'}
        />

        <Text style={[styles.demoHint, { color: colors.textSecondary }]}>
          Demo: demo@bizkpi.com · BizKPI2024
        </Text>
      </GlassCard>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 24,
  },
  logoArea: {
    alignItems: 'center',
    gap: 8,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  appSub: {
    fontSize: 14,
    fontWeight: '400',
  },
  card: {
    padding: 24,
    gap: 16,
  },
  welcome: {
    fontSize: 24,
    fontWeight: '700',
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    gap: 12,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  rememberText: {
    flex: 1,
    gap: 2,
  },
  rememberTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  rememberSub: {
    fontSize: 12,
  },
  forgotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hint: {
    fontSize: 12,
  },
  link: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  demoHint: {
    fontSize: 12,
    textAlign: 'center',
  },
});
