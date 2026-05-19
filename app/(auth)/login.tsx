import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
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
    if (!emailOk) { setLocalError('Introduce un correo válido.'); return false; }
    if (password.length < 6) { setLocalError('La contraseña debe tener al menos 6 caracteres.'); return false; }
    if (mode === 'register' && !businessName.trim()) {
      setLocalError('Introduce el nombre de tu negocio.'); return false;
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

    // Register
    const needsConfirmation = await register({
      email: email.trim().toLowerCase(),
      password,
      businessName: businessName.trim(),
    });

    if (needsConfirmation) {
      Alert.alert(
        'Revisa tu correo',
        'Te hemos enviado un enlace de confirmación. Confirma tu cuenta y luego inicia sesión.',
        [{ text: 'Entendido', onPress: () => switchMode('login') }],
      );
    }
  }

  const displayError = localError || error;
  const isLoading = status === 'loading';

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
        <Text style={[styles.welcome, { color: colors.textPrimary }]}>
          {mode === 'login' ? 'Bienvenido' : 'Crear cuenta'}
        </Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>
          {mode === 'login'
            ? 'Accede a tu panel de KPIs y rendimiento operativo.'
            : 'Regístrate para empezar a registrar los KPIs de tu negocio.'}
        </Text>

        <View style={styles.form}>
          {mode === 'register' && (
            <Input
              label="Nombre del negocio"
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Ej. Cafetería Aurora"
              autoCapitalize="words"
              leftIcon="business-outline"
            />
          )}
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
            placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : 'Introduce tu contraseña'}
            secureTextEntry
            leftIcon="lock-closed-outline"
          />
        </View>

        {/* Remember me — solo en login */}
        {mode === 'login' && (
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
        )}

        {/* Forgot password — solo en login */}
        {mode === 'login' && (
          <View style={styles.forgotRow}>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              ¿Olvidaste tu contraseña?
            </Text>
            <Text
              style={[styles.link, { color: colors.primaryLight }]}
              onPress={() =>
                Alert.alert(
                  'Recuperar contraseña',
                  'Introduce tu correo en el campo y pulsa "Recuperar". Te enviaremos un enlace.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Enviar enlace',
                      onPress: async () => {
                        if (!email.trim()) {
                          Alert.alert('Introduce tu correo primero.');
                          return;
                        }
                        const { supabase } = await import('@/lib/supabaseClient');
                        const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
                        if (err) Alert.alert('Error', err.message);
                        else Alert.alert('Correo enviado', `Revisa ${email.trim()} para restablecer tu contraseña.`);
                      },
                    },
                  ],
                )
              }
            >
              Recuperar
            </Text>
          </View>
        )}

        {displayError ? (
          <Text style={[styles.errorText, { color: colors.error }]}>{displayError}</Text>
        ) : null}

        <Button
          label={mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          onPress={handleSubmit}
          loading={isLoading}
        />

        {/* Toggle mode */}
        <View style={styles.toggleRow}>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          </Text>
          <Text
            style={[styles.link, { color: colors.primaryLight }]}
            onPress={() => switchMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
          </Text>
        </View>
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
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
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
});
