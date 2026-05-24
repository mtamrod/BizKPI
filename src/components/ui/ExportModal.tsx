import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { isoWeekNumber } from '@/utils/periodHelpers';
import type { HistoryEntry } from '@/hooks/useHistory';

interface Props {
  visible: boolean;
  entries: HistoryEntry[];
  onClose: () => void;
  onExport: (filtered: HistoryEntry[]) => Promise<void>;
}

export function ExportModal({ visible, entries, onClose, onExport }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // entries are newest-first; for range pickers show oldest-first
  const sorted = [...entries].reverse();

  const [mode, setMode]       = useState<'all' | 'range'>('all');
  const [fromId, setFromId]   = useState<string | null>(null);
  const [toId, setToId]       = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fromIdx = sorted.findIndex((e) => e.period.id === fromId);
  const toIdx   = sorted.findIndex((e) => e.period.id === toId);
  const rangeValid = mode === 'all' || (fromId !== null && toId !== null && fromIdx <= toIdx);

  const handleExport = useCallback(async () => {
    setLoading(true);
    try {
      let filtered = entries;
      if (mode === 'range' && fromId && toId) {
        const fromDate = sorted.find((e) => e.period.id === fromId)!.period.start_date;
        const toDate   = sorted.find((e) => e.period.id === toId)!.period.end_date;
        filtered = entries.filter(
          (e) => e.period.start_date >= fromDate && e.period.end_date <= toDate,
        );
      }
      await onExport(filtered);
      onClose();
    } finally {
      setLoading(false);
    }
  }, [mode, fromId, toId, entries, sorted, onExport, onClose]);

  const weekLabel = (e: HistoryEntry) =>
    `${t('week_abbr')}${isoWeekNumber(e.period.start_date)}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>

          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t('history_export_title')}
          </Text>

          {/* Mode selector */}
          <View style={styles.modeRow}>
            {(['all', 'range'] as const).map((m) => {
              const active = mode === m;
              const label = m === 'all'
                ? t('history_export_all', { n: entries.length })
                : t('history_export_range');
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => setMode(m)}
                  style={[
                    styles.modeBtn,
                    {
                      backgroundColor: active ? colors.primary : `${colors.primary}18`,
                      borderColor: active ? colors.primary : `${colors.primary}33`,
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <View style={[styles.radio, { borderColor: active ? '#fff' : colors.textSecondary }]}>
                    {active && <View style={styles.radioDot} />}
                  </View>
                  <Text style={[styles.modeBtnText, { color: active ? '#fff' : colors.textSecondary }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Range pickers */}
          {mode === 'range' && (
            <View style={styles.pickers}>
              {/* From */}
              <View style={styles.pickerRow}>
                <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>
                  {t('history_export_from')}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
                  {sorted.map((e) => {
                    const active = fromId === e.period.id;
                    return (
                      <TouchableOpacity
                        key={e.period.id}
                        onPress={() => { setFromId(e.period.id); if (toId === null) setToId(e.period.id); }}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active ? colors.primary : `${colors.primary}18`,
                            borderColor: active ? colors.primary : `${colors.primary}33`,
                          },
                        ]}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.chipText, { color: active ? '#fff' : colors.textSecondary }]}>
                          {weekLabel(e)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* To */}
              <View style={styles.pickerRow}>
                <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>
                  {t('history_export_to')}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
                  {sorted.map((e, idx) => {
                    const active   = toId === e.period.id;
                    const disabled = fromId !== null && idx < fromIdx;
                    return (
                      <TouchableOpacity
                        key={e.period.id}
                        onPress={() => !disabled && setToId(e.period.id)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active
                              ? colors.primary
                              : disabled
                              ? `${colors.primary}08`
                              : `${colors.primary}18`,
                            borderColor: active
                              ? colors.primary
                              : disabled
                              ? `${colors.primary}18`
                              : `${colors.primary}33`,
                          },
                        ]}
                        activeOpacity={disabled ? 1 : 0.75}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: active
                                ? '#fff'
                                : disabled
                                ? `${colors.textSecondary}55`
                                : colors.textSecondary,
                            },
                          ]}
                        >
                          {weekLabel(e)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnCancel, { borderColor: colors.border }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnText, { color: colors.textSecondary }]}>
                {t('profile_cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btn,
                styles.btnConfirm,
                {
                  backgroundColor: rangeValid ? colors.primary : `${colors.primary}44`,
                },
              ]}
              onPress={handleExport}
              disabled={!rangeValid || loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.btnConfirmText}>{t('history_export_confirm')}</Text>
              }
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 18,
  },
  title: { fontSize: 18, fontWeight: '700' },

  modeRow: { gap: 10 },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  radio: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  radioDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  modeBtnText: { fontSize: 14, fontWeight: '500', flex: 1 },

  pickers: { gap: 12 },
  pickerRow: { gap: 6 },
  pickerLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  chips: { flexGrow: 0 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, marginRight: 6,
  },
  chipText: { fontSize: 13, fontWeight: '600' },

  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnCancel: { borderWidth: 1 },
  btnConfirm: {},
  btnText: { fontSize: 15, fontWeight: '500' },
  btnConfirmText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
