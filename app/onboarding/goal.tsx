import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSettingsStore } from '@/store/settingsStore';
import { useColorTheme } from '@/hooks/useColorTheme';
import { OnboardingProgress } from '@/components/OnboardingProgress';
import { GoalType } from '@/types';

const GOALS: { value: GoalType; emoji: string; label: string }[] = [
  { value: 'watch',    emoji: '👀', label: 'Surveiller ce que je mange' },
  { value: 'remember', emoji: '🧠', label: "Me souvenir de ce que j'ai mangé" },
  { value: 'other',    emoji: '✏️', label: 'Autre chose' },
];

export default function GoalScreen() {
  const [selected, setSelected] = useState<GoalType>('remember');
  const { saveGoal } = useSettingsStore();
  const { primary, background } = useColorTheme();

  const handleContinue = async () => {
    await saveGoal(selected);
    router.push('/onboarding/slots');
  };

  return (
    <View style={styles.container}>
      <OnboardingProgress currentStep={2} totalSteps={5} />

      <View style={styles.content}>
        <Text style={styles.title}>Pourquoi tu notes ?</Text>
        <Text style={styles.subtitle}>
          Ça n'a aucune incidence sur tes données.
        </Text>

        {GOALS.map(goal => (
          <TouchableOpacity
            key={goal.value}
            style={[
              styles.option,
              selected === goal.value && {
                borderColor: primary,
                backgroundColor: background,
                borderWidth: 2,
              },
            ]}
            onPress={() => setSelected(goal.value)}
            activeOpacity={0.8}
          >
            <Text style={styles.optionEmoji}>{goal.emoji}</Text>
            <Text
              style={[
                styles.optionText,
                selected === goal.value && { color: '#2D1A0E', fontWeight: '600' },
              ]}
            >
              {goal.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: primary }]}
        onPress={handleContinue}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Continuer →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5', padding: 24 },
  content: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#2D1A0E', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#C09070', marginBottom: 24, lineHeight: 20 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF8F5',
    borderWidth: 1.5,
    borderColor: '#F0D0B8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  optionEmoji: { fontSize: 20 },
  optionText: { fontSize: 15, color: '#9A7060', flexShrink: 1 },
  button: { borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 8 },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
