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
import { getEntriesForDay } from '@/db/entriesRepository';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, mealSlots, saveFirstName, savePrimaryColor, saveMealSlot, saveNotificationSetting, saveIcloudBackup, saveBackupInterval, saveLastBackupAt } =
    useSettingsStore();
  const { primary } = useColorTheme();

  const [firstName, setFirstName] = useState(settings?.first_name ?? '');
  const [localSlots, setLocalSlots] = useState<MealSlot[]>(mealSlots);

  useEffect(() => {
    setFirstName(settings?.first_name ?? '');
  }, [settings?.first_name]);

  useEffect(() => {
    if (mealSlots.length > 0) setLocalSlots(mealSlots);
  }, [mealSlots]);

  const updateHour = (meal_type: MealType, field: 'start_hour' | 'end_hour', raw: string) => {
    const val = parseInt(raw, 10);
    if (isNaN(val)) return;
    const hour = Math.min(23, Math.max(0, val));
    setLocalSlots(prev =>
      prev.map(s => {
        if (s.meal_type !== meal_type) return s;
        if (field === 'start_hour' && hour >= s.end_hour) return s;
        if (field === 'end_hour' && hour <= s.start_hour) return s;
        return { ...s, [field]: hour };
      })
    );
  };

  const handleSlotBlur = async (meal_type: MealType) => {
    const slot = localSlots.find(s => s.meal_type === meal_type);
    if (!slot) return;
    await saveMealSlot(slot.meal_type, slot.start_hour, slot.end_hour);
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
                  value={String(slot.start_hour)}
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
                  value={String(slot.end_hour)}
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
        <Text style={styles.sectionTitle}>EXPORT PDF</Text>
        <View style={styles.card}>
          <TouchableOpacity
            testID="export-week-btn"
            style={[styles.actionBtn, { borderColor: primary }]}
            onPress={async () => {
              const entries = [];
              const today = new Date();
              for (let i = 0; i < 7; i++) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                const dateStr = d.toISOString().slice(0, 10);
                const dayEntries = await getEntriesForDay(dateStr);
                entries.push(...dayEntries);
              }
              const periodLabel = 'Semaine du ' + new Date(Date.now() - 6 * 86400000).toLocaleDateString('fr-FR');
              await exportJournalAsPdf(entries, settings?.first_name ?? '', periodLabel, primary);
            }}
          >
            <Text style={[styles.actionBtnText, { color: primary }]}>Exporter la semaine en cours</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="export-month-btn"
            style={[styles.actionBtn, { borderColor: primary }]}
            onPress={async () => {
              const entries = [];
              const today = new Date();
              for (let i = 0; i < 30; i++) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                const dateStr = d.toISOString().slice(0, 10);
                const dayEntries = await getEntriesForDay(dateStr);
                entries.push(...dayEntries);
              }
              const periodLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
              await exportJournalAsPdf(entries, settings?.first_name ?? '', periodLabel, primary);
            }}
          >
            <Text style={[styles.actionBtnText, { color: primary }]}>Exporter le mois en cours</Text>
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
});
