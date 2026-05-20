import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/store/AuthContext';
import { useTheme, CURRENCIES, LANGUAGES, type CurrencySymbol, type LanguageCode } from '@/theme/ThemeContext';
import { userService, type UserProfile } from '@/services/userService';
import { fmt } from '@/utils/formatters';
import type { ThemeMode } from '@/types';

function SectionTitle({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{label}</Text>
  );
}

export default function ProfileScreen() {
  const { session, logout, updateUserName } = useAuth();
  const { colors, mode, setTheme, currency, setCurrency, language, setLanguage } = useTheme();
  const { t } = useTranslation();

  const [profile, setProfile]             = useState<UserProfile | null>(null);
  const [editingName, setEditingName]     = useState(false);
  const [newName, setNewName]             = useState('');
  const [saving, setSaving]               = useState(false);
  const [refreshing, setRefreshing]       = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword]   = useState('');
  const [newPassword, setNewPassword]           = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [passwordSaving, setPasswordSaving]     = useState(false);

  const loadProfile = useCallback(async () => {
    const p = await userService.getProfile();
    setProfile(p);
    setNewName(p?.business_name ?? '');
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  useFocusEffect(
    useCallback(() => { loadProfile(); }, [loadProfile]),
  );

  const handleSaveName = useCallback(async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const updated = await userService.updateProfile({ business_name: newName.trim() });
      setProfile(updated);
      setEditingName(false);
      updateUserName(updated.business_name);
    } catch {
      Alert.alert('Error', t('profile_name_error'));
    } finally {
      setSaving(false);
    }
  }, [newName]);

  const handleChangePassword = useCallback(async () => {
    if (newPassword.length < 6) {
      Alert.alert('Error', t('profile_password_short'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', t('profile_password_mismatch'));
      return;
    }
    if (!session?.user?.email) return;
    setPasswordSaving(true);
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: currentPassword,
      });
      if (signInError) {
        Alert.alert('Error', t('profile_password_wrong'));
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        Alert.alert('Error', updateError.message);
        return;
      }
      setChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('✓', t('profile_password_changed'));
    } finally {
      setPasswordSaving(false);
    }
  }, [currentPassword, newPassword, confirmPassword]);

  if (!session) return null;
  const { user } = session;
  const displayName = profile?.business_name ?? user.name;

  return (
    <ScreenWrapper keyboardAware onRefresh={handleRefresh} refreshing={refreshing}>
      <Header title={t('profile_title')} subtitle={t('profile_subtitle')} />

      {/* ── User card ─────────────────────────────────────────────────────── */}
      <GlassCard style={styles.userCard}>
        <View style={styles.userRow}>
          {/* Gradient ring around avatar */}
          <LinearGradient
            colors={[colors.primaryLight, colors.accentLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarRing}
          >
            <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
              <Text style={[styles.avatarText, { color: colors.primaryLight }]}>
                {fmt.initials(user.name)}
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.userInfo}>
            {editingName ? (
              <View style={{ gap: 8 }}>
                <Input
                  label={t('profile_name_label')}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder={t('profile_name_placeholder')}
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button
                    label={t('profile_save')}
                    onPress={handleSaveName}
                    loading={saving}
                    fullWidth={false}
                    style={{ flex: 1 }}
                  />
                  <Button
                    label={t('profile_cancel')}
                    variant="secondary"
                    onPress={() => { setEditingName(false); setNewName(profile?.business_name ?? ''); }}
                    fullWidth={false}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            ) : (
              <>
                <TouchableOpacity onPress={() => setEditingName(true)} activeOpacity={0.7}>
                  <Text style={[styles.userName, { color: colors.textPrimary }]}>
                    {displayName} <Ionicons name="pencil-outline" size={14} color={colors.textSecondary} />
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                  {user.email}
                </Text>
                {profile?.business_sector ? (
                  <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                    {profile.business_sector}
                  </Text>
                ) : null}
                <View style={[styles.roleBadge, { backgroundColor: `${colors.primary}22` }]}>
                  <Text style={[styles.roleText, { color: colors.primaryLight }]}>
                    {t('profile_role')}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </GlassCard>

      {/* ── Apariencia ────────────────────────────────────────────────────── */}
      <SectionTitle label={t('profile_section_appearance')} />
      <GlassCard style={styles.themeCard}>
        <View style={styles.themeRow}>
          {(
            [
              { m: 'dark' as ThemeMode, icon: 'moon-outline', labelKey: 'profile_theme_dark' as const },
              { m: 'light' as ThemeMode, icon: 'sunny-outline', labelKey: 'profile_theme_light' as const },
            ] as const
          ).map(({ m, icon, labelKey }) => {
            const active = mode === m;
            return (
              <TouchableOpacity
                key={m}
                onPress={() => setTheme(m)}
                activeOpacity={0.75}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: active ? colors.primary : `${colors.primary}18`,
                    borderColor: active ? colors.primary : `${colors.primary}33`,
                  },
                ]}
              >
                <Ionicons
                  name={icon}
                  size={16}
                  color={active ? '#fff' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.themeBtnText,
                    { color: active ? '#fff' : colors.textSecondary },
                  ]}
                >
                  {t(labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassCard>

      {/* ── Moneda ───────────────────────────────────────────────────────── */}
      <SectionTitle label={t('profile_section_currency')} />
      <GlassCard style={styles.themeCard}>
        <View style={styles.themeRow}>
          {CURRENCIES.map(({ symbol, label }) => {
            const active = currency === symbol;
            return (
              <TouchableOpacity
                key={symbol}
                onPress={() => setCurrency(symbol as CurrencySymbol)}
                activeOpacity={0.75}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: active ? colors.primary : `${colors.primary}18`,
                    borderColor: active ? colors.primary : `${colors.primary}33`,
                  },
                ]}
              >
                <Text style={[styles.currencySymbol, { color: active ? '#fff' : colors.textSecondary }]}>
                  {symbol}
                </Text>
                <Text style={[styles.themeBtnText, { color: active ? '#fff' : colors.textSecondary }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassCard>

      {/* ── Idioma ───────────────────────────────────────────────────────── */}
      <SectionTitle label={t('profile_section_language')} />
      <GlassCard style={styles.themeCard}>
        <View style={styles.langGrid}>
          {LANGUAGES.map(({ code, label, flag }) => {
            const active = language === code;
            return (
              <TouchableOpacity
                key={code}
                onPress={() => setLanguage(code as LanguageCode)}
                activeOpacity={0.75}
                style={[
                  styles.langBtn,
                  {
                    backgroundColor: active ? colors.primary : `${colors.primary}18`,
                    borderColor: active ? colors.primary : `${colors.primary}33`,
                  },
                ]}
              >
                <Text style={styles.langFlag}>{flag}</Text>
                <Text style={[styles.langLabel, { color: active ? '#fff' : colors.textSecondary }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassCard>

      {/* ── Seguridad ─────────────────────────────────────────────────────── */}
      <SectionTitle label={t('profile_section_security')} />
      <GlassCard style={changingPassword ? styles.actionCardOpen : styles.actionCard}>
        {changingPassword ? (
          <View style={{ gap: 12, padding: 16 }}>
            <Input
              label={t('profile_current_password')}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
              secureTextEntry
            />
            <Input
              label={t('profile_new_password')}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              secureTextEntry
            />
            <Input
              label={t('profile_confirm_password')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              secureTextEntry
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                label={t('profile_save')}
                onPress={handleChangePassword}
                loading={passwordSaving}
                fullWidth={false}
                style={{ flex: 1 }}
              />
              <Button
                label={t('profile_cancel')}
                variant="secondary"
                onPress={() => {
                  setChangingPassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                fullWidth={false}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.7}
            onPress={() => setChangingPassword(true)}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${colors.primary}20` }]}>
              <Ionicons name="key-outline" size={18} color={colors.primaryLight} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
              {t('profile_change_password')}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </GlassCard>

      <Button label={t('profile_logout')} variant="danger" onPress={logout} />

    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  // ── User card ──
  userCard: { padding: 22 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarRing: { padding: 2.5, borderRadius: 26 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700' },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 20, fontWeight: '700' },
  userEmail: { fontSize: 13 },
  roleBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  roleText: { fontSize: 11, fontWeight: '600' },
  // ── Theme ──
  themeCard: { padding: 14 },
  themeRow: { flexDirection: 'row', gap: 10 },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 46,
    borderRadius: 13,
    borderWidth: 1,
  },
  themeBtnText: { fontSize: 14, fontWeight: '600' },
  currencySymbol: { fontSize: 15, fontWeight: '700' },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  langBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    width: '48%', height: 46, borderRadius: 13, borderWidth: 1,
    paddingHorizontal: 12, justifyContent: 'center',
  },
  langFlag: { fontSize: 18 },
  langLabel: { fontSize: 13, fontWeight: '600' },
  // ── Security ──
  actionCard: { padding: 0 },
  actionCardOpen: {},
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
});
