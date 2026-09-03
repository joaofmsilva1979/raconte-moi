import { create } from 'zustand';
import { ActivityType } from '@/types';
import { createActivity, getTodayTotalMinutes } from '@/db/activitiesRepository';
import { getCustomActivities, addCustomActivity, CustomActivity } from '@/db/customActivitiesRepository';

interface ActivityState {
  isSheetOpen: boolean;
  selectedType: ActivityType | null;
  durationMinutes: number | null;
  note: string;
  recordedAt: string;
  todayTotalMinutes: number;
  customActivities: CustomActivity[];
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
  loadCustomActivities: () => Promise<void>;
  addNewCustomActivity: (name: string) => Promise<void>;
}

const INITIAL: ActivityState = {
  isSheetOpen: false,
  selectedType: null,
  durationMinutes: null,
  note: '',
  recordedAt: new Date().toISOString(),
  todayTotalMinutes: 0,
  customActivities: [],
};

export const useActivityStore = create<ActivityState & ActivityActions>((set, get) => ({
  ...INITIAL,

  openSheet: () => {
    getCustomActivities().then(customActivities => set({ customActivities }));
    set({ isSheetOpen: true, recordedAt: new Date().toISOString() });
  },

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
    // Les types custom sont encodés "custom:{id}:{name}" — on stocke le nom directement
    const activityType = selectedType.startsWith('custom:')
      ? selectedType.split(':').slice(2).join(':')
      : selectedType;
    await createActivity({
      recorded_at: recordedAt,
      activity_type: activityType,
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

  loadCustomActivities: async () => {
    const customActivities = await getCustomActivities();
    set({ customActivities });
  },

  addNewCustomActivity: async (name: string) => {
    const activity = await addCustomActivity(name);
    set(state => ({
      customActivities: [...state.customActivities, activity],
      selectedType: `custom:${activity.id}:${activity.name}`,
    }));
  },
}));
