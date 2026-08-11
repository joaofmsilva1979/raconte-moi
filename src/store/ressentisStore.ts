import { create } from 'zustand';
import { RessentCategory, RessentSubCategory, MealType } from '@/types';
import { createRessenti } from '@/db/ressentisRepository';
import { linkToLastEntry } from '@/services/ressentisService';

interface RessentisState {
  isSheetOpen: boolean;
  categories: RessentCategory[];
  sub_category: RessentSubCategory | null;
  selected_meal: MealType | null;
  meal_day: 'today' | 'yesterday';
}

interface RessentisActions {
  openSheet: () => void;
  closeSheet: () => void;
  toggleCategory: (category: RessentCategory) => void;
  selectSubCategory: (sub: RessentSubCategory) => void;
  selectMeal: (meal: MealType) => void;
  setMealDay: (day: 'today' | 'yesterday') => void;
  saveRessenti: () => Promise<void>;
}

const INITIAL: RessentisState = {
  isSheetOpen: false,
  categories: [],
  sub_category: null,
  selected_meal: null,
  meal_day: 'today',
};

export const useRessentisStore = create<RessentisState & RessentisActions>((set, get) => ({
  ...INITIAL,

  openSheet: () => set({ isSheetOpen: true }),

  closeSheet: () => set(INITIAL),

  toggleCategory: (category) => set((state) => {
    const has = state.categories.includes(category);
    const categories = has
      ? state.categories.filter(c => c !== category)
      : [...state.categories, category];
    const sub_category = categories.includes('pain') ? state.sub_category : null;
    return { categories, sub_category };
  }),

  selectSubCategory: (sub_category) => set({ sub_category }),

  selectMeal: (meal) => set({ selected_meal: meal }),

  setMealDay: (day) => set({ meal_day: day }),

  saveRessenti: async () => {
    const { categories, sub_category, selected_meal, meal_day } = get();
    if (categories.length === 0) return;
    const now = new Date();
    const { entry_id, delay_minutes } = await linkToLastEntry(now);

    const mealDate = new Date();
    if (meal_day === 'yesterday') mealDate.setDate(mealDate.getDate() - 1);
    const meal_date = mealDate.toISOString().slice(0, 10);

    await Promise.all(
      categories.map(category =>
        createRessenti({
          recorded_at: now.toISOString(),
          category,
          sub_category: category === 'pain' ? sub_category : null,
          note: null,
          entry_id,
          meal_type: selected_meal,
          meal_date,
          delay_minutes,
        })
      )
    );
    set(INITIAL);
  },
}));
