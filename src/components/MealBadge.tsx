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
      style={[styles.badge, { borderColor: primaryColor + '50' }]}
    >
      <View style={styles.row}>
        <Text style={[styles.text, { color: primaryColor }]}>
          {icon} {label} · {hh}:{mm}
        </Text>
        <Text style={[styles.editIcon, { color: primaryColor }]}>✎</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  editIcon: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.5,
  },
});
