import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSettingsStore } from '@/store/settingsStore';
import { useColorTheme } from '@/hooks/useColorTheme';
import { OnboardingProgress } from '@/components/OnboardingProgress';
import { AppSettings } from '@/types';

type Gender = NonNullable<AppSettings['gender']>;

const OPTIONS: { value: Gender; icon: string; label: string }[] = [
  { value: 'female', icon: '♀️', label: 'Femme' },
  { value: 'male',   icon: '♂️', label: 'Homme' },
  { value: 'other',  icon: '⚧',  label: 'Non défini' },
];

export default function ProfileScreen() {
  const { saveGender } = useSettingsStore();
  const { primary } = useColorTheme();

  const handleSelect = async (gender: Gender) => {
    await saveGender(gender);
    router.push('/onboarding/goal');
  };

  return (
    <View style={styles.container}>
      <OnboardingProgress currentStep={2} totalSteps={6} />
      <View style={styles.content}>
        <Text style={styles.title}>Pour mieux personnaliser l'app</Text>
        <Text style={styles.subtitle}>Cette information reste sur ton iPhone et ne sort jamais.</Text>

        {OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.optionBtn, { borderColor: primary + '60' }]}
            onPress={() => handleSelect(opt.value)}
            activeOpacity={0.82}
          >
            <Text style={styles.optionIcon}>{opt.icon}</Text>
            <Text style={[styles.optionLabel, { color: primary }]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity onPress={() => router.push('/onboarding/goal')} style={styles.skipBtn}>
          <Text style={styles.skipText}>Passer cette étape</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5', padding: 24 },
  content: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#2D1A0E', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#C09070', marginBottom: 32, lineHeight: 18 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFF0E8', borderWidth: 1.5,
    borderRadius: 14, padding: 18, marginBottom: 12,
  },
  optionIcon: { fontSize: 26 },
  optionLabel: { fontSize: 16, fontWeight: '600' },
  skipBtn: { alignItems: 'center', marginTop: 8 },
  skipText: { fontSize: 13, color: '#C09070' },
});
