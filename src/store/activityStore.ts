import { create } from 'zustand';
import { ActivityType } from '@/types';
import { createActivity, getTodayTotalMinutes } from '@/db/activitiesRepository';

interface ActivityState {
  isSheetOpen: boolean;
  selectedType: ActivityType | null;
  durationMinutes: number | null;
  note: string;
  recordedAt: string;
  todayTotalMinutes: number;
}

interface ActivityActions {
  openSheet: () => void;
  closeSheet: () => void;
  selectType: (type: ActivityType) => void;
  setDuration: (minutes: number | null) => void;
  setNote: (text: string) => void;
  setRecordedAt: (iso: string) => void;
  saveActivity: () => Promise<void>;
  loadTodayTotal: () => Promise<void>;
}

const INITIAL: ActivityState = {
  isSheetOpen: false,
  selectedType: null,
  durationMinutes: null,
  note: '',
  recordedAt: new Date().toISOString(),
  todayTotalMinutes: 0,
};

export const useActivityStore = create<ActivityState & ActivityActions>((set, get) => ({
  ...INITIAL,

  openSheet: () => set({ isSheetOpen: true, recordedAt: new Date().toISOString() }),

  closeSheet: () => set({
    isSheetOpen: false,
    selectedType: null,
    durationMinutes: null,
    note: '',
    recordedAt: new Date().toISOString(),
  }),

  setRecordedAt: (recordedAt) => set({ recordedAt }),

  selectType: (type) => set({ selectedType: type }),

  setDuration: (minutes) => set({ durationMinutes: minutes }),

  setNote: (note) => set({ note }),

  saveActivity: async () => {
    const { selectedType, durationMinutes, note, recordedAt } = get();
    if (!selectedType || !durationMinutes || durationMinutes <= 0) return;
    await createActivity({
      recorded_at: recordedAt,
      activity_type: selectedType,
      duration_minutes: durationMinutes,
      note: note.trim() || null,
    });
    const todayTotalMinutes = await getTodayTotalMinutes();
    set({ isSheetOpen: false, selectedType: null, durationMinutes: null, note: '', todayTotalMinutes });
  },

  loadTodayTotal: async () => {
    const todayTotalMinutes = await getTodayTotalMinutes();
    set({ todayTotalMinutes });
  },
}));
