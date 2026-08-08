import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
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
              <TextInput
                style={[styles.hourInput, { borderColor: primary, color: primary }]}
                value={String(slot.start_hour)}
                onChangeText={v => updateHour(slot.meal_type, 'start_hour', v)}
                keyboardType="number-pad"
                maxLength={2}
                selectTextOnFocus
              />
              <Text style={[styles.sep, { color: primary }]}>h — </Text>
              <TextInput
                style={[styles.hourInput, { borderColor: primary, color: primary }]}
                value={String(slot.end_hour)}
                onChangeText={v => updateHour(slot.meal_type, 'end_hour', v)}
                keyboardType="number-pad"
                maxLength={2}
                selectTextOnFocus
              />
              <Text style={[styles.sep, { color: primary }]}>h</Text>
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
  controls: { flexDirection: 'row', alignItems: 'center' },
  hourInput: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    width: 36,
  },
  sep: { fontSize: 14, fontWeight: '600', marginHorizontal: 2 },
  button: {
    borderRadius: 14, padding: 16, alignItems: 'center',
    marginBottom: 8, marginTop: 16,
  },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
