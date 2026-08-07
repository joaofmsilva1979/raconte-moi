import { detectMealType, getMealReminderHour } from '@/services/mealDetection';
import { DEFAULT_MEAL_SLOTS } from '@/constants/meals';
import { MealSlot } from '@/types';

const slots = DEFAULT_MEAL_SLOTS;

describe('detectMealType', () => {
  it('détecte le petit-déjeuner à 8h', () => {
    const date = new Date('2026-08-07T08:00:00');
    expect(detectMealType(date, slots)).toBe('breakfast');
  });

  it('détecte le déjeuner à 12h30', () => {
    const date = new Date('2026-08-07T12:30:00');
    expect(detectMealType(date, slots)).toBe('lunch');
  });

  it('détecte la collation à 16h', () => {
    const date = new Date('2026-08-07T16:00:00');
    expect(detectMealType(date, slots)).toBe('snack');
  });

  it('détecte le dîner à 20h', () => {
    const date = new Date('2026-08-07T20:00:00');
    expect(detectMealType(date, slots)).toBe('dinner');
  });

  it('retourne "other" hors de toute plage (ex: 3h du matin)', () => {
    const date = new Date('2026-08-07T03:00:00');
    expect(detectMealType(date, slots)).toBe('other');
  });

  it('respecte les plages personnalisées', () => {
    const custom: MealSlot[] = [
      { meal_type: 'breakfast', label: 'Petit-déj', icon: '☀️', start_hour: 7, end_hour: 9 },
      { meal_type: 'lunch',     label: 'Déjeuner',  icon: '🌞', start_hour: 13, end_hour: 15 },
      { meal_type: 'snack',     label: 'Collation', icon: '🌤', start_hour: 16, end_hour: 18 },
      { meal_type: 'dinner',    label: 'Dîner',     icon: '🌙', start_hour: 20, end_hour: 23 },
    ];
    expect(detectMealType(new Date('2026-08-07T08:00:00'), custom)).toBe('breakfast');
    expect(detectMealType(new Date('2026-08-07T10:00:00'), custom)).toBe('other');
    expect(detectMealType(new Date('2026-08-07T13:30:00'), custom)).toBe('lunch');
  });
});

describe('getMealReminderHour', () => {
  it('calcule le milieu de la plage (rappel à 8h pour 6h-10h)', () => {
    const slot = slots.find(s => s.meal_type === 'breakfast')!;
    expect(getMealReminderHour(slot)).toBe(8); // (6+10)/2
  });

  it('calcule le milieu de la plage déjeuner (12h30 → 12)', () => {
    const slot = slots.find(s => s.meal_type === 'lunch')!;
    expect(getMealReminderHour(slot)).toBe(12); // floor((11+14)/2)
  });
});
