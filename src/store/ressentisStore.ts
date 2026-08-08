import { create } from 'zustand';
import { RessentCategory, RessentSubCategory } from '@/types';
import { createRessenti } from '@/db/ressentisRepository';
import { linkToLastEntry } from '@/services/ressentisService';

interface RessentisState {
  isSheetOpen: boolean;
  category: RessentCategory | null;
  sub_category: RessentSubCategory | null;
}

interface RessentisActions {
  openSheet: () => void;
  closeSheet: () => void;
  selectCategory: (category: RessentCategory) => void;
  selectSubCategory: (sub: RessentSubCategory) => void;
  saveRessenti: () => Promise<void>;
}

const INITIAL: RessentisState = {
  isSheetOpen: false,
  category: null,
  sub_category: null,
};

export const useRessentisStore = create<RessentisState & RessentisActions>((set, get) => ({
  ...INITIAL,

  openSheet: () => set({ isSheetOpen: true }),

  closeSheet: () => set(INITIAL),

  selectCategory: (category) => set({ category, sub_category: null }),

  selectSubCategory: (sub_category) => set({ sub_category }),

  saveRessenti: async () => {
    const { category, sub_category } = get();
    if (!category) return;
    const now = new Date();
    const { entry_id, delay_minutes } = await linkToLastEntry(now);
    await createRessenti({
      recorded_at: now.toISOString(),
      category,
      sub_category,
      note: null,
      entry_id,
      delay_minutes,
    });
    set(INITIAL);
  },
}));
