import { MealSlot, MealType } from '@/types';

export const DEFAULT_MEAL_SLOTS: MealSlot[] = [
  { meal_type: 'breakfast', label: 'Petit-déjeuner', icon: '☀️', start_hour: 6,  end_hour: 10 },
  { meal_type: 'lunch',     label: 'Déjeuner',       icon: '🌞', start_hour: 11, end_hour: 14 },
  { meal_type: 'snack',     label: 'Collation',      icon: '🌤', start_hour: 14, end_hour: 18 },
  { meal_type: 'dinner',    label: 'Dîner',           icon: '🌙', start_hour: 18, end_hour: 22 },
];

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  snack: 'Collation',
  dinner: 'Dîner',
  other: 'Autre',
};

export const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '☀️',
  lunch: '🌞',
  snack: '🌤',
  dinner: '🌙',
  other: '🍽',
};
