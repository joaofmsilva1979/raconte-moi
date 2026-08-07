import { MealSlot, MealType } from '@/types';

export function detectMealType(date: Date, slots: MealSlot[]): MealType {
  const hour = date.getHours();
  const match = slots.find(s => hour >= s.start_hour && hour < s.end_hour);
  return match?.meal_type ?? 'other';
}

export function getMealReminderHour(slot: MealSlot): number {
  return Math.floor((slot.start_hour + slot.end_hour) / 2);
}
