jest.mock('@/db/settingsRepository', () => ({
  getAppSettings: jest.fn(() =>
    Promise.resolve({
      first_name: 'Eugénie',
      primary_color: '#E85520',
      goal: 'remember' as const,
      onboarding_done: false,
      icloud_backup: false,
      backup_interval: 7,
      last_backup_at: null,
      notifications_enabled: true,
      notifications_breakfast: true,
      notifications_lunch: true,
      notifications_snack: true,
      notifications_dinner: true,
    })
  ),
  getMealSlots: jest.fn(() =>
    Promise.resolve([
      { meal_type: 'breakfast', label: 'Petit-déjeuner', icon: '☀️', start_hour: 6,  end_hour: 10 },
      { meal_type: 'lunch',     label: 'Déjeuner',       icon: '🌞', start_hour: 11, end_hour: 14 },
      { meal_type: 'snack',     label: 'Collation',      icon: '🌤', start_hour: 14, end_hour: 18 },
      { meal_type: 'dinner',    label: 'Dîner',          icon: '🌙', start_hour: 18, end_hour: 22 },
    ])
  ),
  setSetting: jest.fn(() => Promise.resolve()),
  updateMealSlot: jest.fn(() => Promise.resolve()),
}));

import { act } from '@testing-library/react-native';
import { useSettingsStore } from '@/store/settingsStore';
import { setSetting } from '@/db/settingsRepository';

const DEFAULT_SETTINGS_FOR_TEST = {
  first_name: '',
  primary_color: '#E85520',
  goal: 'remember' as const,
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

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({ settings: null, mealSlots: [], isLoaded: false });
    jest.clearAllMocks();
  });

  it('loadSettings charge les settings et les meal slots', async () => {
    await useSettingsStore.getState().loadSettings();
    const state = useSettingsStore.getState();
    expect(state.isLoaded).toBe(true);
    expect(state.settings?.first_name).toBe('Eugénie');
    expect(state.mealSlots).toHaveLength(4);
  });

  it('saveFirstName écrit en SQLite et met à jour le store', async () => {
    const { setSetting } = require('@/db/settingsRepository');
    await useSettingsStore.getState().saveFirstName('Marie');
    expect(setSetting).toHaveBeenCalledWith('first_name', 'Marie');
    expect(useSettingsStore.getState().settings?.first_name).toBe('Marie');
  });

  it('savePrimaryColor écrit en SQLite et met à jour le store', async () => {
    const { setSetting } = require('@/db/settingsRepository');
    await useSettingsStore.getState().savePrimaryColor('#5C7A4E');
    expect(setSetting).toHaveBeenCalledWith('primary_color', '#5C7A4E');
    expect(useSettingsStore.getState().settings?.primary_color).toBe('#5C7A4E');
  });

  it('completeOnboarding met onboarding_done à true', async () => {
    await useSettingsStore.getState().completeOnboarding();
    expect(setSetting).toHaveBeenCalledWith('onboarding_done', 'true');
    expect(useSettingsStore.getState().settings?.onboarding_done).toBe(true);
  });

  describe('saveNotificationSetting', () => {
    it('calls setSetting with the correct key and string value', async () => {
      await act(async () => {
        await useSettingsStore.getState().saveNotificationSetting('notifications_enabled', false);
      });
      expect(setSetting).toHaveBeenCalledWith('notifications_enabled', 'false');
    });

    it('updates settings state', async () => {
      useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS_FOR_TEST } });
      await act(async () => {
        await useSettingsStore.getState().saveNotificationSetting('notifications_breakfast', false);
      });
      expect(useSettingsStore.getState().settings?.notifications_breakfast).toBe(false);
    });
  });

  describe('saveIcloudBackup', () => {
    it('saveIcloudBackup(true) → setSetting("icloud_backup", "true") appelé', async () => {
      await act(async () => {
        await useSettingsStore.getState().saveIcloudBackup(true);
      });
      expect(setSetting).toHaveBeenCalledWith('icloud_backup', 'true');
    });
  });

  describe('saveBackupInterval', () => {
    it('saveBackupInterval(30) → setSetting("backup_interval", "30") appelé', async () => {
      await act(async () => {
        await useSettingsStore.getState().saveBackupInterval(30);
      });
      expect(setSetting).toHaveBeenCalledWith('backup_interval', '30');
    });
  });

  describe('saveLastBackupAt', () => {
    it('saveLastBackupAt("2026-08-08T00:00:00.000Z") → setSetting("last_backup_at", "2026-08-08T00:00:00.000Z") appelé', async () => {
      await act(async () => {
        await useSettingsStore.getState().saveLastBackupAt('2026-08-08T00:00:00.000Z');
      });
      expect(setSetting).toHaveBeenCalledWith('last_backup_at', '2026-08-08T00:00:00.000Z');
    });
  });
});
