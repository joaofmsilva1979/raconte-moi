import { create } from 'zustand';
import { Entry, Ressenti, Activity, SleepLog, MedicationLog, ComfortAidLog } from '@/types';
import { getEntriesForDay } from '@/db/entriesRepository';
import { getRessentisForDay, deleteRessenti } from '@/db/ressentisRepository';
import { getActivitiesForDay, deleteActivity } from '@/db/activitiesRepository';
import { getSleepForDay, deleteSleepLog } from '@/db/sleepRepository';
import { getMedicationLogsForDay, deleteMedicationLog } from '@/db/medicationsRepository';
import { getComfortAidLogsForDay, deleteComfortAidLog } from '@/db/comfortAidsRepository';
import { formatDate, addDays } from '@/utils/dateUtils';

interface JournalState {
  viewedDate: string;
  entries: Entry[];
  ressentis: Ressenti[];
  activities: Activity[];
  sleepLog: SleepLog | null;
  medicationLogs: MedicationLog[];
  comfortAidLogs: ComfortAidLog[];
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
  deleteRessentiLog: (id: number) => Promise<void>;
  deleteActivityLog: (id: number) => Promise<void>;
  deleteMedLog: (id: number) => Promise<void>;
  deleteAidLog: (id: number) => Promise<void>;
  deleteSleep: (id: number) => Promise<void>;
}

export const useJournalStore = create<JournalState & JournalActions>((set, get) => ({
  viewedDate: formatDate(new Date()),
  entries: [],
  ressentis: [],
  activities: [],
  sleepLog: null,
  medicationLogs: [],
  comfortAidLogs: [],
  isLoading: false,
  isSheetOpen: false,

  openSheet: async () => {
    const today = formatDate(new Date());
    set({ isSheetOpen: true });
    await get().loadDay(today);
  },

  closeSheet: () => set({ isSheetOpen: false }),

  loadDay: async (dateStr: string) => {
    set({ isLoading: true, viewedDate: dateStr, entries: [], ressentis: [], activities: [], sleepLog: null, medicationLogs: [], comfortAidLogs: [] });
    try {
      const [entries, ressentis, activities, sleepLog, medicationLogs, comfortAidLogs] = await Promise.all([
        getEntriesForDay(dateStr),
        getRessentisForDay(dateStr),
        getActivitiesForDay(dateStr),
        getSleepForDay(dateStr),
        getMedicationLogsForDay(dateStr),
        getComfortAidLogsForDay(dateStr),
      ]);
      set({ entries, ressentis, activities, sleepLog, medicationLogs, comfortAidLogs, isLoading: false });
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

  deleteRessentiLog: async (id) => {
    await deleteRessenti(id);
    await get().refreshCurrentDay();
  },

  deleteActivityLog: async (id) => {
    await deleteActivity(id);
    await get().refreshCurrentDay();
  },

  deleteMedLog: async (id) => {
    await deleteMedicationLog(id);
    await get().refreshCurrentDay();
  },

  deleteAidLog: async (id) => {
    await deleteComfortAidLog(id);
    await get().refreshCurrentDay();
  },

  deleteSleep: async (id) => {
    await deleteSleepLog(id);
    await get().refreshCurrentDay();
  },
}));
