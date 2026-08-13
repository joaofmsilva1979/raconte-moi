import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
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
      <View style={styles.row}>
        <Text style={[styles.text, { color: primaryColor }]}>
          {icon} {label} · {hh}:{mm}
        </Text>
        <Text style={[styles.editIcon, { color: primaryColor }]}>✎</Text>
      </View>
      <Text style={[styles.hint, { color: primaryColor }]}>Touche pour changer</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#FDEEE8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
  },
  editIcon: {
    fontSize: 14,
    fontWeight: '700',
    opacity: 0.7,
  },
  hint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B4513',
    marginTop: 2,
  },
});
