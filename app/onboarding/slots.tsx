import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSettingsStore } from '@/store/settingsStore';
import { useColorTheme } from '@/hooks/useColorTheme';
import { OnboardingProgress } from '@/components/OnboardingProgress';
import { MealSlot, MealType } from '@/types';

export default function SlotsScreen() {
  const { mealSlots, saveMealSlot } = useSettingsStore();
  const { primary } = useColorTheme();
  const [localSlots, setLocalSlots] = useState<MealSlot[]>(mealSlots);

  useEffect(() => {
    if (mealSlots.length > 0) {
      setLocalSlots(mealSlots);
    }
  }, [mealSlots]);

  const adjust = (meal_type: MealType, field: 'start_hour' | 'end_hour', delta: number) => {
    setLocalSlots(prev =>
      prev.map(s => {
        if (s.meal_type !== meal_type) return s;
        const next = s[field] + delta;
        if (field === 'start_hour' && (next < 0 || next >= s.end_hour)) return s;
        if (field === 'end_hour' && (next > 23 || next <= s.start_hour)) return s;
        return { ...s, [field]: next };
      })
    );
  };

  const handleContinue = async () => {
    await Promise.all(
      localSlots.map(s => saveMealSlot(s.meal_type, s.start_hour, s.end_hour))
    );
    router.push('/onboarding/color');
  };

  return (
    <View style={styles.container}>
      <OnboardingProgress currentStep={3} totalSteps={5} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Mes horaires</Text>
        <Text style={styles.subtitle}>
          Ajuste les plages. L'app détecte le bon repas automatiquement.
        </Text>

        {localSlots.map(slot => (
          <View key={slot.meal_type} style={styles.row}>
            <Text style={styles.mealLabel}>{slot.icon} {slot.label}</Text>
            <View style={styles.controls}>
              <TouchableOpacity
                onPress={() => adjust(slot.meal_type, 'start_hour', -1)}
                style={styles.adjBtn}
                accessibilityLabel={`Diminuer début ${slot.label}`}
              >
                <Text style={[styles.adjText, { color: primary }]}>−</Text>
              </TouchableOpacity>
              <Text style={[styles.timeText, { color: primary }]}>
                {slot.start_hour}h–{slot.end_hour}h
              </Text>
              <TouchableOpacity
                onPress={() => adjust(slot.meal_type, 'end_hour', 1)}
                style={styles.adjBtn}
                accessibilityLabel={`Augmenter fin ${slot.label}`}
              >
                <Text style={[styles.adjText, { color: primary }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: primary }]}
        onPress={handleContinue}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Parfait →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5', padding: 24 },
  content: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', color: '#2D1A0E', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#C09070', marginBottom: 24, lineHeight: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0D0B8',
  },
  mealLabel: { fontSize: 15, fontWeight: '600', color: '#5C3020' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  adjBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  adjText: { fontSize: 22, fontWeight: '300' },
  timeText: { fontSize: 14, fontWeight: '700', minWidth: 60, textAlign: 'center' },
  button: {
    borderRadius: 14, padding: 16, alignItems: 'center',
    marginBottom: 8, marginTop: 16,
  },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
