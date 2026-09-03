import { create } from 'zustand';
import { HydrationLog } from '@/types';
import {
  addHydrationLog,
  getTodayHydrationLogs,
  getTodayTotalMl,
  deleteHydrationLog,
} from '@/db/hydrationRepository';

interface HydrationState {
  isSheetOpen: boolean;
  todayLogs: HydrationLog[];
  todayTotalMl: number;
}

interface HydrationActions {
  openSheet: () => void;
  closeSheet: () => void;
  logWater: (amount_ml: number) => Promise<void>;
  deleteLog: (id: number) => Promise<void>;
  loadToday: () => Promise<void>;
}

export const useHydrationStore = create<HydrationState & HydrationActions>((set, get) => ({
  isSheetOpen: false,
  todayLogs: [],
  todayTotalMl: 0,

  openSheet: () => {
    getTodayHydrationLogs().then(todayLogs => {
      const todayTotalMl = todayLogs.reduce((s, l) => s + l.amount_ml, 0);
      set({ isSheetOpen: true, todayLogs, todayTotalMl });
    });
  },

  closeSheet: () => set({ isSheetOpen: false }),

  logWater: async (amount_ml) => {
    const log = await addHydrationLog(amount_ml);
    const todayLogs = [...get().todayLogs, log];
    const todayTotalMl = todayLogs.reduce((s, l) => s + l.amount_ml, 0);
    set({ todayLogs, todayTotalMl, isSheetOpen: false });
  },

  deleteLog: async (id) => {
    await deleteHydrationLog(id);
    const todayLogs = get().todayLogs.filter(l => l.id !== id);
    const todayTotalMl = todayLogs.reduce((s, l) => s + l.amount_ml, 0);
    set({ todayLogs, todayTotalMl });
  },

  loadToday: async () => {
    const todayTotalMl = await getTodayTotalMl();
    set({ todayTotalMl });
  },
}));
