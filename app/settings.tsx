import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSettingsStore } from '@/store/settingsStore';
import { useColorTheme } from '@/hooks/useColorTheme';
import { COLOR_PALETTES } from '@/constants/colors';
import { scheduleReminders } from '@/services/notificationService';
import { MealSlot, MealType } from '@/types';
import { backupToIcloud, restoreFromIcloud, isBackupDue } from '@/services/icloudService';
import { exportJournalAsPdf } from '@/services/pdfService';
import { getEntriesForDateRange } from '@/db/entriesRepository';
import { getRessentisForDateRange } from '@/db/ressentisRepository';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, mealSlots, saveFirstName, savePrimaryColor, saveMealSlot, saveNotificationSetting, saveIcloudBackup, saveBackupInterval, saveLastBackupAt } =
    useSettingsStore();
  const { primary } = useColorTheme();

  const [firstName, setFirstName] = useState(settings?.first_name ?? '');
  const [localSlots, setLocalSlots] = useState<MealSlot[]>(mealSlots);
  const [rawHours, setRawHours] = useState<Record<string, string>>({});

  function todayStr() {
    return new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  function daysAgoStr(n: number) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const [customFrom, setCustomFrom] = useState(() => daysAgoStr(7));
  const [customTo, setCustomTo] = useState(() => todayStr());

  function parseFrDate(frDate: string): string | null {
    const parts = frDate.split('/');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts;
    if (!d || !m || !y || y.length !== 4) return null;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  async function exportRange(fromFr: string, toFr: string, label: string) {
    const from = parseFrDate(fromFr);
    const to = parseFrDate(toFr);
    if (!from || !to) {
      Alert.alert('Date invalide', 'Utilise le format JJ/MM/AAAA');
      return;
    }
    const [entries, ressentis] = await Promise.all([
      getEntriesForDateRange(from, to),
      getRessentisForDateRange(from, to),
    ]);
    if (entries.length === 0 && ressentis.length === 0) {
      Alert.alert('Aucune donnée', 'Pas de notes ou de ressentis sur cette période.');
      return;
    }
    await exportJournalAsPdf(entries, ressentis, settings?.first_name ?? '', label, primary);
  }

  function applyPreset(days: number) {
    setCustomFrom(daysAgoStr(days));
    setCustomTo(todayStr());
  }

  useEffect(() => {
    setFirstName(settings?.first_name ?? '');
  }, [settings?.first_name]);

  useEffect(() => {
    if (mealSlots.length > 0) setLocalSlots(mealSlots);
  }, [mealSlots]);

  const updateHour = (meal_type: MealType, field: 'start_hour' | 'end_hour', raw: string) => {
    setRawHours(prev => ({ ...prev, [`${meal_type}_${field}`]: raw }));
  };

  const handleSlotBlur = async (meal_type: MealType) => {
    const slot = localSlots.find(s => s.meal_type === meal_type);
    if (!slot) return;

    const startRaw = rawHours[`${meal_type}_start_hour`];
    const endRaw = rawHours[`${meal_type}_end_hour`];
    const startVal = startRaw !== undefined ? parseInt(startRaw, 10) : slot.start_hour;
    const endVal = endRaw !== undefined ? parseInt(endRaw, 10) : slot.end_hour;

    const start = isNaN(startVal) ? slot.start_hour : Math.min(23, Math.max(0, startVal));
    const end = isNaN(endVal) ? slot.end_hour : Math.min(23, Math.max(0, endVal));

    const validStart = start < end ? start : slot.start_hour;
    const validEnd = end > start ? end : slot.end_hour;

    setLocalSlots(prev => prev.map(s =>
      s.meal_type === meal_type ? { ...s, start_hour: validStart, end_hour: validEnd } : s
    ));
    setRawHours(prev => {
      const next = { ...prev };
      delete next[`${meal_type}_start_hour`];
      delete next[`${meal_type}_end_hour`];
      return next;
    });

    await saveMealSlot(meal_type, validStart, validEnd);
    if (settings) {
      await scheduleReminders(localSlots, {
        enabled: settings.notifications_enabled,
        breakfast: settings.notifications_breakfast,
        lunch: settings.notifications_lunch,
        snack: settings.notifications_snack,
        dinner: settings.notifications_dinner,
      });
    }
  };

  const handleNotificationToggle = async (
    key: 'notifications_enabled' | 'notifications_breakfast' | 'notifications_lunch' | 'notifications_snack' | 'notifications_dinner',
    value: boolean
  ) => {
    await saveNotificationSetting(key, value);
    if (settings) {
      const updated = { ...settings, [key]: value };
      await scheduleReminders(localSlots, {
        enabled: updated.notifications_enabled,
        breakfast: updated.notifications_breakfast,
        lunch: updated.notifications_lunch,
        snack: updated.notifications_snack,
        dinner: updated.notifications_dinner,
      });
    }
  };

  const notifEnabled = settings?.notifications_enabled ?? false;

  const mealNotifRows: Array<{
    key: 'notifications_breakfast' | 'notifications_lunch' | 'notifications_snack' | 'notifications_dinner';
    testID: string;
    label: string;
    icon: string;
  }> = [
    { key: 'notifications_breakfast', testID: 'toggle-notifications-breakfast', label: 'Petit-déjeuner', icon: '☀️' },
    { key: 'notifications_lunch', testID: 'toggle-notifications-lunch', label: 'Déjeuner', icon: '🌞' },
    { key: 'notifications_snack', testID: 'toggle-notifications-snack', label: 'Collation', icon: '🌤' },
    { key: 'notifications_dinner', testID: 'toggle-notifications-dinner', label: 'Dîner', icon: '🌙' },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Réglages',
          headerShown: true,
          headerBackTitle: 'Accueil',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.closeButton}>Fermer</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        testID="settings-scroll"
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Profil */}
        <Text style={styles.sectionTitle}>Mon profil</Text>
        <View style={styles.card}>
          <TextInput
            testID="firstname-input"
            style={[styles.textInput, { borderColor: primary }]}
            value={firstName}
            onChangeText={setFirstName}
            onBlur={() => saveFirstName(firstName)}
            placeholder="Ton prénom"
            placeholderTextColor="#C09070"
          />
        </View>

        {/* Section: Apparence */}
        <Text style={styles.sectionTitle}>Couleur</Text>
        <View style={styles.card}>
          <View style={styles.swatchGrid}>
            {COLOR_PALETTES.map(palette => (
              <TouchableOpacity
                key={palette.primary}
                testID={`color-swatch-${palette.primary}`}
                onPress={() => savePrimaryColor(palette.primary)}
                style={[
                  styles.swatch,
                  { backgroundColor: palette.primary },
                  settings?.primary_color === palette.primary && styles.swatchSelected,
                ]}
                activeOpacity={0.85}
              />
            ))}
          </View>
        </View>

        {/* Section: Plages horaires */}
        <Text style={styles.sectionTitle}>Mes horaires</Text>
        <View style={styles.card}>
          {localSlots.map(slot => (
            <View key={slot.meal_type} style={styles.slotRow}>
              <Text style={styles.slotLabel}>{slot.icon} {slot.label}</Text>
              <View style={styles.slotControls}>
                <TextInput
                  testID={`slot-start-${slot.meal_type}`}
                  style={[styles.hourInput, { borderColor: primary, color: primary }]}
                  value={rawHours[`${slot.meal_type}_start_hour`] ?? String(slot.start_hour)}
                  onChangeText={v => updateHour(slot.meal_type, 'start_hour', v)}
                  onBlur={() => handleSlotBlur(slot.meal_type)}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                />
                <Text style={[styles.slotSep, { color: primary }]}>h — </Text>
                <TextInput
                  testID={`slot-end-${slot.meal_type}`}
                  style={[styles.hourInput, { borderColor: primary, color: primary }]}
                  value={rawHours[`${slot.meal_type}_end_hour`] ?? String(slot.end_hour)}
                  onChangeText={v => updateHour(slot.meal_type, 'end_hour', v)}
                  onBlur={() => handleSlotBlur(slot.meal_type)}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                />
                <Text style={[styles.slotSep, { color: primary }]}>h</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Section: Rappels */}
        <Text style={styles.sectionTitle}>Rappels repas</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Rappels activés</Text>
            <Switch
              testID="toggle-notifications-enabled"
              value={notifEnabled}
              onValueChange={value => handleNotificationToggle('notifications_enabled', value)}
              trackColor={{ true: primary }}
            />
          </View>
          {notifEnabled && mealNotifRows.map(row => (
            <View key={row.key} style={styles.switchRow}>
              <Text style={styles.switchLabel}>{row.icon} {row.label}</Text>
              <Switch
                testID={row.testID}
                value={settings?.[row.key] ?? false}
                onValueChange={value => handleNotificationToggle(row.key, value)}
                trackColor={{ true: primary }}
              />
            </View>
          ))}
        </View>

        {/* Section: Backup iCloud */}
        <Text style={styles.sectionTitle}>BACKUP ICLOUD</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Backup iCloud activé</Text>
            <Switch
              testID="toggle-icloud-backup"
              value={settings?.icloud_backup ?? false}
              onValueChange={async (v) => {
                await saveIcloudBackup(v);
              }}
              trackColor={{ true: primary }}
            />
          </View>

          {settings?.icloud_backup && (
            <>
              <Text style={styles.rowSub}>
                Fréquence
              </Text>
              <View style={styles.intervalRow}>
                {[1, 3, 7, 30].map(d => (
                  <TouchableOpacity
                    key={d}
                    testID={`interval-${d}`}
                    style={[
                      styles.intervalBtn,
                      settings.backup_interval === d && { backgroundColor: primary, borderColor: primary },
                    ]}
                    onPress={() => saveBackupInterval(d)}
                  >
                    <Text style={[
                      styles.intervalText,
                      settings.backup_interval === d && { color: 'white' },
                    ]}>
                      {d}j
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.rowSub}>
                Dernier backup : {settings.last_backup_at
                  ? new Date(settings.last_backup_at).toLocaleString('fr-FR')
                  : 'Jamais'}
              </Text>

              <TouchableOpacity
                testID="backup-now-btn"
                style={[styles.actionBtn, { borderColor: primary }]}
                onPress={async () => {
                  try {
                    const date = await backupToIcloud();
                    await saveLastBackupAt(date);
                    Alert.alert('Backup effectué ✓', 'Tes données sont sauvegardées sur iCloud.');
                  } catch {
                    Alert.alert('Erreur', 'Impossible de sauvegarder sur iCloud.');
                  }
                }}
              >
                <Text style={[styles.actionBtnText, { color: primary }]}>Backup maintenant</Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="restore-btn"
                style={[styles.actionBtn, { borderColor: '#C09070' }]}
                onPress={() => {
                  Alert.alert(
                    'Restaurer depuis iCloud',
                    'Cela remplacera toutes tes données actuelles. Continuer ?',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      {
                        text: 'Restaurer',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await restoreFromIcloud();
                            Alert.alert('Restauré ✓', 'Redémarre l\'app pour voir tes données.');
                          } catch {
                            Alert.alert('Erreur', 'Impossible de restaurer depuis iCloud.');
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={[styles.actionBtnText, { color: '#C09070' }]}>Restaurer depuis iCloud</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Section: Export PDF */}
        <Text style={styles.sectionTitle}>BILAN MÉDICAL</Text>
        <View style={styles.card}>
          <Text style={styles.rowSub}>Période rapide</Text>
          <View style={styles.presetRow}>
            {([7, 14, 30, 90] as const).map(days => (
              <TouchableOpacity
                key={days}
                style={[styles.presetBtn, { borderColor: primary }]}
                onPress={() => applyPreset(days)}
              >
                <Text style={[styles.presetText, { color: primary }]}>
                  {days < 30 ? `${days}j` : days === 30 ? '1 mois' : '3 mois'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.dateRangeRow}>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>Du</Text>
              <TextInput
                testID="export-from-input"
                style={[styles.dateInput, { borderColor: primary }]}
                value={customFrom}
                onChangeText={setCustomFrom}
                placeholder="JJ/MM/AAAA"
                placeholderTextColor="#C09070"
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>Au</Text>
              <TextInput
                testID="export-to-input"
                style={[styles.dateInput, { borderColor: primary }]}
                value={customTo}
                onChangeText={setCustomTo}
                placeholder="JJ/MM/AAAA"
                placeholderTextColor="#C09070"
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
          </View>

          <TouchableOpacity
            testID="export-range-btn"
            style={[styles.actionBtn, { borderColor: primary }]}
            onPress={() => {
              const label = `${customFrom} → ${customTo}`;
              exportRange(customFrom, customTo, label);
            }}
          >
            <Text style={[styles.actionBtnText, { color: primary }]}>📄 Exporter cette période</Text>
          </TouchableOpacity>
        </View>

        {/* Section: Confidentialité */}
        <View testID="privacy-badge" style={styles.privacyBadge}>
          <Text style={styles.privacyText}>🔒 Aucune donnée ne quitte cet iPhone</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#FFF8F5' },
  content: { padding: 24, paddingBottom: 48 },
  closeButton: { fontSize: 15, color: '#E85520', fontWeight: '600' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C09070',
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 4,
    shadowColor: '#2D1A0E',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  textInput: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#2D1A0E',
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  swatch: { width: 44, height: 44, borderRadius: 22 },
  swatchSelected: { borderWidth: 3, borderColor: '#2D1A0E' },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0D0B8',
  },
  slotLabel: { fontSize: 15, fontWeight: '600', color: '#5C3020' },
  slotControls: { flexDirection: 'row', alignItems: 'center' },
  hourInput: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    width: 48,
  },
  slotSep: { fontSize: 14, fontWeight: '600', marginHorizontal: 2 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0D0B8',
  },
  switchLabel: { fontSize: 15, color: '#2D1A0E', fontWeight: '500' },
  privacyBadge: {
    marginTop: 32,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F0EAE4',
    borderRadius: 12,
  },
  privacyText: { fontSize: 13, color: '#C09070', fontWeight: '600' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowLabel: { fontSize: 15, color: '#2D1A0E', fontWeight: '500' },
  intervalRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  intervalBtn: {
    borderWidth: 1.5, borderColor: '#F0D0B8', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  intervalText: { fontSize: 13, fontWeight: '600', color: '#5C3020' },
  actionBtn: {
    borderWidth: 1.5, borderRadius: 10, padding: 12,
    alignItems: 'center', marginBottom: 8,
  },
  actionBtnText: { fontSize: 14, fontWeight: '600' },
  rowSub: { fontSize: 12, color: '#C09070', marginBottom: 6 },
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  presetBtn: {
    flex: 1, borderWidth: 1.5, borderRadius: 8,
    paddingVertical: 6, alignItems: 'center',
  },
  presetText: { fontSize: 13, fontWeight: '700' },
  dateRangeRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  dateField: { flex: 1, gap: 4 },
  dateLabel: { fontSize: 11, color: '#C09070', fontWeight: '600', textTransform: 'uppercase' },
  dateInput: {
    borderWidth: 1.5, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 14, fontWeight: '600', color: '#2D1A0E',
    textAlign: 'center',
  },
});
