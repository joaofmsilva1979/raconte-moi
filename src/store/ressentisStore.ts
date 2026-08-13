import { create } from 'zustand';
import { RessentCategory, RessentSubCategory, MealType, SleepQuality, CustomPainLocation } from '@/types';
import { createRessenti } from '@/db/ressentisRepository';
import { linkToLastEntry } from '@/services/ressentisService';
import { createSleepLog } from '@/db/sleepRepository';
import {
  getCustomPainLocations,
  addCustomPainLocation,
  deleteCustomPainLocation,
} from '@/db/customPainLocationsRepository';

export type SheetMode = 'morning' | 'meal' | 'feeling' | null;

interface RessentisState {
  isSheetOpen: boolean;
  mode: SheetMode;
  categories: RessentCategory[];
  sub_categories: RessentSubCategory[];
  selected_meal: MealType | null;
  meal_day: 'today' | 'yesterday';
  notes: Partial<Record<RessentCategory, string>>;
  subNote: string;
  moment: 'morning' | null;
  sleepQuality: SleepQuality | null;
  customPainLocations: CustomPainLocation[];
}

interface RessentisActions {
  openSheet: () => void;
  closeSheet: () => void;
  setMode: (mode: SheetMode) => void;
  toggleCategory: (category: RessentCategory) => void;
  toggleSubCategory: (sub: RessentSubCategory) => void;
  applyCustomLocation: (location: CustomPainLocation) => void;
  selectMeal: (meal: MealType) => void;
  setMealDay: (day: 'today' | 'yesterday') => void;
  setNote: (category: RessentCategory, text: string) => void;
  setSubNote: (text: string) => void;
  setMoment: (moment: 'morning' | null) => void;
  setSleepQuality: (quality: SleepQuality | null) => void;
  saveCustomLocation: (label: string) => Promise<void>;
  removeCustomLocation: (id: number) => Promise<void>;
  saveRessenti: () => Promise<void>;
}

const INITIAL: RessentisState = {
  isSheetOpen: false,
  mode: null,
  categories: [],
  sub_categories: [],
  selected_meal: null,
  meal_day: 'today',
  notes: {},
  subNote: '',
  moment: null,
  sleepQuality: null,
  customPainLocations: [],
};

export const useRessentisStore = create<RessentisState & RessentisActions>((set, get) => ({
  ...INITIAL,

  openSheet: async () => {
    const customPainLocations = await getCustomPainLocations();
    set({ isSheetOpen: true, customPainLocations });
  },

  closeSheet: () => set(INITIAL),

  setMode: (mode) => {
    let selected_meal: MealType | null = null;
    if (mode === 'meal') {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 11)       selected_meal = 'breakfast';
      else if (hour >= 11 && hour < 14) selected_meal = 'lunch';
      else if (hour >= 14 && hour < 18) selected_meal = 'snack';
      else if (hour >= 18 && hour < 22) selected_meal = 'dinner';
      else                              selected_meal = 'other';
    }
    set({ mode, moment: mode === 'morning' ? 'morning' : null, selected_meal });
  },

  toggleCategory: (category) => set((state) => {
    const has = state.categories.includes(category);
    const categories = has
      ? state.categories.filter(c => c !== category)
      : [...state.categories, category];
    const sub_categories = categories.includes('pain') ? state.sub_categories : [];
    return { categories, sub_categories };
  }),

  toggleSubCategory: (sub) => set((state) => {
    const has = state.sub_categories.includes(sub);
    return {
      sub_categories: has
        ? state.sub_categories.filter(s => s !== sub)
        : [...state.sub_categories, sub],
      subNote: has && sub === 'other' ? '' : state.subNote,
    };
  }),

  applyCustomLocation: (location) => set({
    sub_categories: ['other'],
    subNote: location.label,
  }),

  selectMeal: (meal) => set({ selected_meal: meal }),

  setMealDay: (day) => set({ meal_day: day }),

  setNote: (category, text) => set((state) => ({ notes: { ...state.notes, [category]: text } })),

  setSubNote: (text) => set({ subNote: text }),

  setMoment: (moment) => set({ moment, selected_meal: null }),

  setSleepQuality: (sleepQuality) => set({ sleepQuality }),

  saveCustomLocation: async (label) => {
    if (!label.trim()) return;
    await addCustomPainLocation(label.trim());
    const customPainLocations = await getCustomPainLocations();
    set({ customPainLocations });
  },

  removeCustomLocation: async (id) => {
    await deleteCustomPainLocation(id);
    const customPainLocations = await getCustomPainLocations();
    set({ customPainLocations });
  },

  saveRessenti: async () => {
    const { categories, sub_categories, selected_meal, meal_day, notes, subNote, sleepQuality, mode } = get();
    if (categories.length === 0 && sleepQuality === null) return;

    const now = new Date();
    const mealDate = new Date();
    if (meal_day === 'yesterday') mealDate.setDate(mealDate.getDate() - 1);
    const meal_date = mealDate.toISOString().slice(0, 10);

    if (mode === 'morning' && sleepQuality !== null) {
      await createSleepLog(sleepQuality);
    }

    if (categories.length > 0) {
      const { entry_id, delay_minutes } = await linkToLastEntry(now);
      const rows: Promise<number>[] = [];

      for (const category of categories) {
        const context = mode === 'morning' ? 'morning' : mode === 'feeling' ? 'feeling' : null;
        if (category === 'pain' && sub_categories.length > 0) {
          for (const sub of sub_categories) {
            rows.push(createRessenti({
              recorded_at: now.toISOString(),
              category,
              sub_category: sub,
              note: sub === 'other' ? (subNote || null) : null,
              entry_id,
              meal_type: selected_meal,
              meal_date,
              delay_minutes,
              context,
            }));
          }
        } else {
          rows.push(createRessenti({
            recorded_at: now.toISOString(),
            category,
            sub_category: null,
            note: category === 'other' ? (notes['other'] || null) : null,
            entry_id,
            meal_type: selected_meal,
            meal_date,
            delay_minutes,
            context,
          }));
        }
      }

      await Promise.all(rows);
    }

    set(INITIAL);
  },
}));
