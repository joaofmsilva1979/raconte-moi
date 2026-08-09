import { create } from 'zustand';
import {
  getAppSettings,
  getMealSlots,
  setSetting,
  updateMealSlot,
} from '@/db/settingsRepository';
import { AppSettings, GoalType, MealSlot, MealType } from '@/types';

const DEFAULT_SETTINGS: AppSettings = {
  first_name: '',
  primary_color: '#E85520',
  goal: 'remember',
  onboarding_done: false,
  icloud_backup: false,
  backup_interval: 7,
  last_backup_at: null,
  notifications_enabled: true,
  notifications_breakfast: true,
  notifications_lunch: true,
  notifications_snack: true,
  notifications_dinner: true,
};

interface SettingsState {
  settings: AppSettings | null;
  mealSlots: MealSlot[];
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  saveFirstName: (name: string) => Promise<void>;
  saveGoal: (goal: GoalType) => Promise<void>;
  savePrimaryColor: (color: string) => Promise<void>;
  saveMealSlot: (meal_type: MealType, start_hour: number, end_hour: number) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  saveNotificationSetting: (
    key: 'notifications_enabled' | 'notifications_breakfast' | 'notifications_lunch' | 'notifications_snack' | 'notifications_dinner',
    value: boolean
  ) => Promise<void>;
  saveIcloudBackup: (enabled: boolean) => Promise<void>;
  saveBackupInterval: (days: number) => Promise<void>;
  saveLastBackupAt: (isoDate: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  mealSlots: [],
  isLoaded: false,

  loadSettings: async () => {
    const [settings, mealSlots] = await Promise.all([getAppSettings(), getMealSlots()]);
    set({ settings, mealSlots, isLoaded: true });
  },

  saveFirstName: async (name: string) => {
    await setSetting('first_name', name);
    const s = get().settings ?? { ...DEFAULT_SETTINGS };
    set({ settings: { ...s, first_name: name } });
  },

  saveGoal: async (goal: GoalType) => {
    await setSetting('goal', goal);
    const s = get().settings ?? { ...DEFAULT_SETTINGS };
    set({ settings: { ...s, goal } });
  },

  savePrimaryColor: async (color: string) => {
    await setSetting('primary_color', color);
    const s = get().settings ?? { ...DEFAULT_SETTINGS };
    set({ settings: { ...s, primary_color: color } });
  },

  saveMealSlot: async (meal_type: MealType, start_hour: number, end_hour: number) => {
    await updateMealSlot(meal_type, start_hour, end_hour);
    set(state => ({
      mealSlots: state.mealSlots.map(s =>
        s.meal_type === meal_type ? { ...s, start_hour, end_hour } : s
      ),
    }));
  },

  completeOnboarding: async () => {
    await setSetting('onboarding_done', 'true');
    const s = get().settings ?? { ...DEFAULT_SETTINGS };
    set({ settings: { ...s, onboarding_done: true } });
  },

  saveNotificationSetting: async (key, value) => {
    await setSetting(key, value ? 'true' : 'false');
    const s = get().settings ?? { ...DEFAULT_SETTINGS };
    set({ settings: { ...s, [key]: value } });
  },

  saveIcloudBackup: async (enabled) => {
    await setSetting('icloud_backup', enabled ? 'true' : 'false');
    const s = get().settings ?? { ...DEFAULT_SETTINGS };
    set({ settings: { ...s, icloud_backup: enabled } });
  },

  saveBackupInterval: async (days) => {
    await setSetting('backup_interval', String(days));
    const s = get().settings ?? { ...DEFAULT_SETTINGS };
    set({ settings: { ...s, backup_interval: days } });
  },

  saveLastBackupAt: async (isoDate) => {
    await setSetting('last_backup_at', isoDate);
    const s = get().settings ?? { ...DEFAULT_SETTINGS };
    set({ settings: { ...s, last_backup_at: isoDate } });
  },
}));
