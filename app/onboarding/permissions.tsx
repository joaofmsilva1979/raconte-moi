import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { requestRecordingPermissionsAsync } from 'expo-audio';
import * as Notifications from 'expo-notifications';
import { useSettingsStore } from '@/store/settingsStore';
import { useColorTheme } from '@/hooks/useColorTheme';
import { OnboardingProgress } from '@/components/OnboardingProgress';

export default function PermissionsScreen() {
  const { completeOnboarding } = useSettingsStore();
  const { primary } = useColorTheme();

  const handleStart = async () => {
    await requestRecordingPermissionsAsync();
    await Notifications.requestPermissionsAsync();
    await completeOnboarding();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <OnboardingProgress currentStep={5} totalSteps={5} />

      <View style={styles.content}>
        <Text style={styles.title}>Dernière étape !</Text>
        <Text style={styles.subtitle}>
          L'app a besoin de 2 permissions pour fonctionner.
        </Text>

        <View style={[styles.permCard, { backgroundColor: '#FDEEE8' }]}>
          <Text style={styles.permEmoji}>🎙</Text>
          <View>
            <Text style={styles.permTitle}>Microphone</Text>
            <Text style={styles.permSub}>Pour enregistrer ta voix</Text>
          </View>
        </View>

        <View style={styles.permCardDashed}>
          <Text style={styles.permEmoji}>🔔</Text>
          <View>
            <Text style={styles.permTitle}>Notifications</Text>
            <Text style={styles.permSub}>Rappels repas (optionnel)</Text>
          </View>
        </View>

        <View style={styles.privacyBadge}>
          <Text style={styles.privacyText}>
            🔒 Aucune donnée ne quitte cet iPhone
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: primary }]}
        onPress={handleStart}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Activer le microphone et les notifications</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5', padding: 24 },
  content: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#2D1A0E', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#C09070', marginBottom: 24, lineHeight: 20 },
  permCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 12, padding: 16, marginBottom: 10,
  },
  permCardDashed: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFF3EE', borderRadius: 12, padding: 16,
    marginBottom: 16, borderWidth: 1, borderStyle: 'dashed',
    borderColor: '#F0C0A0',
  },
  permEmoji: { fontSize: 28 },
  permTitle: { fontSize: 15, fontWeight: '600', color: '#5C3020', marginBottom: 2 },
  permSub: { fontSize: 12, color: '#C09070' },
  privacyBadge: {
    backgroundColor: '#F0F8EC', borderRadius: 10, padding: 12, alignItems: 'center',
  },
  privacyText: { fontSize: 13, color: '#4A7030', fontWeight: '500' },
  button: { borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 8 },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
