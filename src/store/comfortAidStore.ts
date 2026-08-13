import { create } from 'zustand';
import { ComfortAid, MealType } from '@/types';
import { getComfortAids, addComfortAid, deleteComfortAid, logComfortAid } from '@/db/comfortAidsRepository';

type AidSlot = MealType | 'morning';

interface ComfortAidState {
  isSheetOpen: boolean;
  aids: ComfortAid[];
  selectedAidIds: number[];
  mealType: AidSlot | null;
  note: string;
  recordedAt: string;
}

interface ComfortAidActions {
  openSheet: () => void;
  closeSheet: () => void;
  loadAids: () => Promise<void>;
  addNewAid: (name: string) => Promise<void>;
  removeAid: (id: number) => Promise<void>;
  toggleAid: (id: number) => void;
  setMealType: (slot: AidSlot | null) => void;
  setNote: (note: string) => void;
  setRecordedAt: (iso: string) => void;
  saveComfortAidLogs: () => Promise<void>;
}

const INITIAL: ComfortAidState = {
  isSheetOpen: false,
  aids: [],
  selectedAidIds: [],
  mealType: null,
  note: '',
  recordedAt: new Date().toISOString(),
};

export const useComfortAidStore = create<ComfortAidState & ComfortAidActions>((set, get) => ({
  ...INITIAL,

  openSheet: () => set({
    isSheetOpen: true,
    selectedAidIds: [],
    mealType: null,
    note: '',
    recordedAt: new Date().toISOString(),
  }),

  closeSheet: () => set({
    isSheetOpen: false,
    selectedAidIds: [],
    mealType: null,
    note: '',
    recordedAt: new Date().toISOString(),
  }),

  loadAids: async () => {
    const aids = await getComfortAids();
    set({ aids });
  },

  addNewAid: async (name) => {
    await addComfortAid(name);
    const aids = await getComfortAids();
    set({ aids });
  },

  removeAid: async (id) => {
    await deleteComfortAid(id);
    const aids = await getComfortAids();
    set({ aids });
  },

  toggleAid: (id) => set((state) => {
    const has = state.selectedAidIds.includes(id);
    return {
      selectedAidIds: has
        ? state.selectedAidIds.filter(a => a !== id)
        : [...state.selectedAidIds, id],
    };
  }),

  setMealType: (mealType) => set({ mealType }),

  setNote: (note) => set({ note }),

  setRecordedAt: (recordedAt) => set({ recordedAt }),

  saveComfortAidLogs: async () => {
    const { selectedAidIds, mealType, note, recordedAt } = get();
    if (selectedAidIds.length === 0) return;
    await Promise.all(
      selectedAidIds.map((comfort_aid_id) =>
        logComfortAid({
          comfort_aid_id,
          recorded_at: recordedAt,
          meal_type: mealType ?? null,
          note: note.trim() || null,
        })
      )
    );
    set({
      isSheetOpen: false,
      selectedAidIds: [],
      mealType: null,
      note: '',
      recordedAt: new Date().toISOString(),
    });
    const { useJournalStore } = await import('@/store/journalStore');
    await useJournalStore.getState().refreshCurrentDay();
  },
}));
