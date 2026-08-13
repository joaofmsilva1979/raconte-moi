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
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F5' },
  container: { flex: 1, paddingTop: 28, paddingBottom: 24, paddingHorizontal: 24 },
  title: { fontSize: 22, fontWeight: '800', color: '#1C0A00', marginBottom: 24, letterSpacing: -0.5 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#F0D8C8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#7C3020',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  icon: { fontSize: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#5C3020', flex: 1 },
  check: { fontSize: 16, fontWeight: '700' },
});
