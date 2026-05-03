import { useState } from 'react';
import {
  Alert,
  Modal,
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
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/theme/ThemeContext';
import { MOCK_COMPANIES } from '@/mocks/authMocks';
import { fmt } from '@/utils/formatters';
import type { ThemeMode } from '@/types';

function SectionTitle({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{label}</Text>
  );
}

export default function ProfileScreen() {
  const { session, logout } = useAuth();
  const { colors, mode, setTheme } = useTheme();

  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [newCompanyName, setNewCompanyName]     = useState('');
  const [activeCompanyId, setActiveCompanyId]   = useState('co_001');

  if (!session) return null;
  const { user } = session;

  return (
    <ScreenWrapper keyboardAware>
      <Header title="Perfil" subtitle="Tu cuenta y preferencias" />

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
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              {user.name}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {user.email}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: `${colors.primary}22` }]}>
              <Text style={[styles.roleText, { color: colors.primaryLight }]}>
                {user.role === 'admin' ? 'Administrador' : 'Visor'}
              </Text>
            </View>
          </View>
        </View>
      </GlassCard>

      {/* ── Apariencia ────────────────────────────────────────────────────── */}
      <SectionTitle label="Apariencia" />
      <GlassCard style={styles.themeCard}>
        <View style={styles.themeRow}>
          {(
            [
              { m: 'dark' as ThemeMode, icon: 'moon-outline', label: 'Oscuro' },
              { m: 'light' as ThemeMode, icon: 'sunny-outline', label: 'Claro' },
            ] as const
          ).map(({ m, icon, label }) => {
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
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassCard>

      {/* ── Empresas ──────────────────────────────────────────────────────── */}
      <SectionTitle label="Empresas" />
      <View style={styles.companiesList}>
        {MOCK_COMPANIES.map((company) => {
          const active = company.id === activeCompanyId;
          return (
            <TouchableOpacity
              key={company.id}
              onPress={() => setActiveCompanyId(company.id)}
              activeOpacity={0.75}
            >
              <GlassCard
                style={[
                  styles.companyCard,
                  active ? { borderColor: company.accentColor, borderWidth: 1.5 } : undefined,
                ]}
                glowColor={active ? company.accentColor : undefined}
              >
                <View style={styles.companyRow}>
                  <View
                    style={[styles.companyIcon, { backgroundColor: `${company.accentColor}22` }]}
                  >
                    <Ionicons name="business-outline" size={16} color={company.accentColor} />
                  </View>
                  <View style={styles.companyInfo}>
                    <Text style={[styles.companyName, { color: colors.textPrimary }]}>
                      {company.name}
                    </Text>
                    <Text style={[styles.companySector, { color: colors.textSecondary }]}>
                      {company.sector} · {company.location}
                    </Text>
                  </View>
                  {active ? (
                    <View
                      style={[styles.activeBadge, { backgroundColor: `${company.accentColor}22` }]}
                    >
                      <Text style={[styles.activeText, { color: company.accentColor }]}>
                        Activa
                      </Text>
                    </View>
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textSecondary}
                    />
                  )}
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}
        <Button
          label="+ Nueva empresa"
          variant="secondary"
          onPress={() => setShowCompanyModal(true)}
        />
      </View>

      {/* ── Seguridad ─────────────────────────────────────────────────────── */}
      <SectionTitle label="Seguridad" />
      <GlassCard style={styles.actionCard}>
        <TouchableOpacity
          style={styles.actionRow}
          activeOpacity={0.7}
          onPress={() =>
            Alert.alert(
              'Cambiar contraseña',
              'Disponible en cuanto exista conexión backend.',
            )
          }
        >
          <View style={[styles.actionIcon, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="key-outline" size={18} color={colors.primaryLight} />
          </View>
          <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
            Cambiar contraseña
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </GlassCard>

      <Button label="Cerrar sesión" variant="danger" onPress={logout} />

      {/* ── Modal nueva empresa ───────────────────────────────────────────── */}
      <Modal
        visible={showCompanyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCompanyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalCard}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Nueva empresa
            </Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              Añade una compañía a tu espacio de trabajo.
            </Text>
            <Input
              label="Nombre de la empresa"
              value={newCompanyName}
              onChangeText={setNewCompanyName}
              placeholder="Ej. Atlas Finance S.L."
            />
            <View style={styles.modalActions}>
              <Button
                label="Cancelar"
                variant="secondary"
                onPress={() => {
                  setShowCompanyModal(false);
                  setNewCompanyName('');
                }}
                fullWidth={false}
                style={{ flex: 1 }}
              />
              <Button
                label="Crear"
                onPress={() => {
                  if (!newCompanyName.trim()) {
                    Alert.alert('Campo requerido', 'Introduce el nombre de la empresa.');
                    return;
                  }
                  Alert.alert(
                    'Empresa creada',
                    `"${newCompanyName}" estará disponible al conectar el backend.`,
                  );
                  setNewCompanyName('');
                  setShowCompanyModal(false);
                }}
                fullWidth={false}
                style={{ flex: 1 }}
              />
            </View>
          </GlassCard>
        </View>
      </Modal>
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
  // ── Companies ──
  companiesList: { gap: 10 },
  companyCard: { padding: 16 },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  companyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyInfo: { flex: 1, gap: 2 },
  companyName: { fontSize: 15, fontWeight: '600' },
  companySector: { fontSize: 12 },
  activeBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeText: { fontSize: 11, fontWeight: '700' },
  // ── Security ──
  actionCard: { padding: 0 },
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
  // ── Modal ──
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
    paddingBottom: 32,
  },
  modalCard: { padding: 24, gap: 14 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalDesc: { fontSize: 14, lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
