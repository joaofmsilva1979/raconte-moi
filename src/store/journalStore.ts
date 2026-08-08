import { create } from 'zustand';
import { Entry, Ressenti } from '@/types';
import { getEntriesForDay } from '@/db/entriesRepository';
import { getRessentisForDay } from '@/db/ressentisRepository';
import { formatDate, addDays } from '@/utils/dateUtils';

interface JournalState {
  viewedDate: string;
  entries: Entry[];
  ressentis: Ressenti[];
  isLoading: boolean;
  isSheetOpen: boolean;
}

interface JournalActions {
  openSheet: () => Promise<void>;
  closeSheet: () => void;
  loadDay: (dateStr: string) => Promise<void>;
  goToPreviousDay: () => Promise<void>;
  goToNextDay: () => Promise<void>;
  refreshCurrentDay: () => Promise<void>;
}

export const useJournalStore = create<JournalState & JournalActions>((set, get) => ({
  viewedDate: formatDate(new Date()),
  entries: [],
  ressentis: [],
  isLoading: false,
  isSheetOpen: false,

  openSheet: async () => {
    const today = formatDate(new Date());
    set({ isSheetOpen: true });
    await get().loadDay(today);
  },

  closeSheet: () => set({ isSheetOpen: false }),

  loadDay: async (dateStr: string) => {
    set({ isLoading: true, viewedDate: dateStr, entries: [], ressentis: [] });
    try {
      const [entries, ressentis] = await Promise.all([
        getEntriesForDay(dateStr),
        getRessentisForDay(dateStr),
      ]);
      set({ entries, ressentis, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  goToPreviousDay: async () => {
    const prev = addDays(get().viewedDate, -1);
    await get().loadDay(prev);
  },

  goToNextDay: async () => {
    const next = addDays(get().viewedDate, 1);
    const today = formatDate(new Date());
    if (next <= today) {
      await get().loadDay(next);
    }
  },

  refreshCurrentDay: async () => {
    await get().loadDay(get().viewedDate);
  },
}));
