import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorTheme } from '@/hooks/useColorTheme';
import { useRecordingStore } from '@/store/recordingStore';
import { DEFAULT_MEAL_SLOTS } from '@/constants/meals';
import { MealType } from '@/types';

export default function MealPickerScreen() {
  const router = useRouter();
  const { primary } = useColorTheme();
  const { mealType: currentMeal, setMealType } = useRecordingStore();

  function handleSelect(meal: MealType) {
    setMealType(meal);
    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Quel repas ?</Text>
      {DEFAULT_MEAL_SLOTS.map((slot) => {
        const selected = slot.meal_type === currentMeal;
        return (
          <TouchableOpacity
            key={slot.meal_type}
            testID={`meal-option-${slot.meal_type}`}
            onPress={() => handleSelect(slot.meal_type as MealType)}
            style={[
              styles.option,
              selected && { borderColor: primary, backgroundColor: '#FDEEE8' },
            ]}
          >
            <Text style={styles.icon}>{slot.icon}</Text>
            <Text style={[styles.label, selected && { color: primary }]}>{slot.label}</Text>
            {selected && <Text style={[styles.check, { color: primary }]}>✓</Text>}
          </TouchableOpacity>
        );
      })}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5', padding: 24 },
  title: { fontSize: 20, fontWeight: '700', color: '#2D1A0E', marginBottom: 20 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF8F5',
    borderWidth: 1.5,
    borderColor: '#F0D8C8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  icon: { fontSize: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#5C3020', flex: 1 },
  check: { fontSize: 16, fontWeight: '700' },
});
