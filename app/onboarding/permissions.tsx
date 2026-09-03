import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Switch, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSettingsStore } from '@/store/settingsStore';
import { useColorTheme } from '@/hooks/useColorTheme';
import { OnboardingProgress } from '@/components/OnboardingProgress';

const MEAL_ROWS = [
  { key: 'notifications_breakfast' as const, label: 'Petit-déjeuner', icon: '☀️' },
  { key: 'notifications_lunch'     as const, label: 'Déjeuner',       icon: '🌞' },
  { key: 'notifications_snack'     as const, label: 'Collation',       icon: '🌤' },
  { key: 'notifications_dinner'    as const, label: 'Dîner',           icon: '🌙' },
];

export default function PermissionsScreen() {
  const { completeOnboarding, saveNotificationSetting } = useSettingsStore();
  const { primary } = useColorTheme();

  const [notifEnabled, setNotifEnabled] = useState(false);
  const [meals, setMeals] = useState({
    notifications_breakfast: true,
    notifications_lunch:     true,
    notifications_snack:     true,
    notifications_dinner:    true,
  });

  function toggleMeal(key: keyof typeof meals) {
    setMeals(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const handleStart = async () => {
    if (Platform.OS !== 'web') {
      const { requestRecordingPermissionsAsync } = await import('expo-audio');
      await requestRecordingPermissionsAsync();
      if (notifEnabled) {
        const Notifications = await import('expo-notifications');
        await Notifications.requestPermissionsAsync();
      }
    }

    await saveNotificationSetting('notifications_enabled', notifEnabled);
    for (const row of MEAL_ROWS) {
      await saveNotificationSetting(row.key, meals[row.key]);
    }

    await completeOnboarding();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <OnboardingProgress currentStep={5} totalSteps={6} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Dernière étape !</Text>
        <Text style={styles.subtitle}>
          {Platform.OS === 'web'
            ? 'Version web — démo sans permissions requises.'
            : "L'app a besoin de 2 permissions pour fonctionner."}
        </Text>

        {/* Microphone */}
        <View style={[styles.permCard, { backgroundColor: '#FDEEE8' }]}>
          <Text style={styles.permEmoji}>🎙</Text>
          <View>
            <Text style={styles.permTitle}>Microphone</Text>
            <Text style={styles.permSub}>Pour enregistrer ta voix</Text>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.notifBlock}>
          <View style={styles.notifHeader}>
            <View style={styles.notifHeaderLeft}>
              <Text style={styles.permEmoji}>🔔</Text>
              <View>
                <Text style={styles.permTitle}>Rappels repas</Text>
                <Text style={styles.permSub}>Optionnel — modifiable dans les réglages</Text>
              </View>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={setNotifEnabled}
              trackColor={{ true: primary }}
              style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
            />
          </View>

          {notifEnabled && (
            <View style={styles.mealRows}>
              {MEAL_ROWS.map(row => (
                <View key={row.key} style={styles.mealRow}>
                  <Text style={styles.mealLabel}>{row.icon} {row.label}</Text>
                  <Switch
                    value={meals[row.key]}
                    onValueChange={() => toggleMeal(row.key)}
                    trackColor={{ true: primary }}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.privacyBadge}>
          <Text style={styles.privacyText}>🔒 Aucune donnée ne quitte cet iPhone</Text>
        </View>

        <Text style={styles.disclaimer}>
          Raconte-moi n'est pas un dispositif médical et ne se substitue pas à un suivi professionnel.
        </Text>
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: primary }]}
        onPress={handleStart}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>
          {Platform.OS === 'web' ? 'Commencer la démo' : 'Activer le microphone et commencer'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5', padding: 24 },
  scroll: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', color: '#2D1A0E', marginBottom: 8, marginTop: 8 },
  subtitle: { fontSize: 14, color: '#C09070', marginBottom: 24, lineHeight: 20 },
  permCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 12, padding: 16, marginBottom: 10,
  },
  notifBlock: {
    backgroundColor: '#FFF3EE', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    marginBottom: 16, borderWidth: 1, borderStyle: 'dashed',
    borderColor: '#F0C0A0',
  },
  notifHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  notifHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  mealRows: { marginTop: 14, gap: 4 },
  mealRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#F0D0B8',
  },
  mealLabel: { fontSize: 14, color: '#5C3020', fontWeight: '500' },
  permEmoji: { fontSize: 28 },
  permTitle: { fontSize: 15, fontWeight: '600', color: '#5C3020', marginBottom: 2 },
  permSub: { fontSize: 12, color: '#C09070' },
  privacyBadge: {
    backgroundColor: '#F0F8EC', borderRadius: 10, padding: 12, alignItems: 'center',
    marginBottom: 12,
  },
  privacyText: { fontSize: 13, color: '#4A7030', fontWeight: '500' },
  disclaimer: {
    fontSize: 11, color: '#C09070', textAlign: 'center', lineHeight: 16,
    paddingHorizontal: 8, marginBottom: 16,
  },
  button: { borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 8 },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
