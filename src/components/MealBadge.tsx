import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MealType } from '@/types';
import { MEAL_LABELS, MEAL_ICONS } from '@/constants/meals';

interface MealBadgeProps {
  mealType: MealType;
  time: Date;
  onPress: () => void;
  primaryColor: string;
}

export function MealBadge({ mealType, time, onPress, primaryColor }: MealBadgeProps) {
  const label = MEAL_LABELS[mealType] ?? 'Autre';
  const icon = MEAL_ICONS[mealType] ?? '🍽';
  const hh = time.getHours().toString().padStart(2, '0');
  const mm = time.getMinutes().toString().padStart(2, '0');

  return (
    <TouchableOpacity
      onPress={onPress}
      testID="meal-badge"
      style={[styles.badge, { borderColor: primaryColor }]}
    >
      <Text style={[styles.text, { color: primaryColor }]}>
        {icon} {label} · {hh}:{mm} ✎
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#FDEEE8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
