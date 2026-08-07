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

import { useSettingsStore } from '@/store/settingsStore';

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
    const { setSetting } = require('@/db/settingsRepository');
    await useSettingsStore.getState().completeOnboarding();
    expect(setSetting).toHaveBeenCalledWith('onboarding_done', 'true');
    expect(useSettingsStore.getState().settings?.onboarding_done).toBe(true);
  });
});
