import { create } from 'zustand';
import { Entry } from '@/types';
import { getEntriesForDay } from '@/db/entriesRepository';
import { formatDate, addDays } from '@/utils/dateUtils';

interface JournalState {
  viewedDate: string;
  entries: Entry[];
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
  isLoading: false,
  isSheetOpen: false,

  openSheet: async () => {
    const today = formatDate(new Date());
    set({ isSheetOpen: true });
    await get().loadDay(today);
  },

  closeSheet: () => set({ isSheetOpen: false }),

  loadDay: async (dateStr: string) => {
    set({ isLoading: true, viewedDate: dateStr, entries: [] });
    try {
      const entries = await getEntriesForDay(dateStr);
      set({ entries, isLoading: false });
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
