// Stateful mock storage — declared at module scope so jest.mock factory can close over it.
// Each test resets state via beforeEach.
let mockStorage: Record<string, string> = {};
let mockMealSlots = [
  { meal_type: 'breakfast', label: 'Petit-déjeuner', icon: '☀️', start_hour: 6,  end_hour: 10 },
  { meal_type: 'lunch',     label: 'Déjeuner',       icon: '🌞', start_hour: 11, end_hour: 14 },
  { meal_type: 'snack',     label: 'Collation',      icon: '🌤', start_hour: 14, end_hour: 18 },
  { meal_type: 'dinner',    label: 'Dîner',           icon: '🌙', start_hour: 18, end_hour: 22 },
];

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() =>
    Promise.resolve({
      execAsync: jest.fn(),
      runAsync: jest.fn(async (sql: string, params: any[]) => {
        if (sql.includes('INSERT INTO settings')) {
          mockStorage[params[0]] = params[1];
        } else if (sql.includes('UPDATE meal_slots')) {
          const slot = mockMealSlots.find(s => s.meal_type === params[2]);
          if (slot) {
            slot.start_hour = params[0];
            slot.end_hour   = params[1];
          }
        }
        return { lastInsertRowId: 1, changes: 1 };
      }),
      getAllAsync: jest.fn(async (sql: string) => {
        if (sql.includes('FROM meal_slots')) return [...mockMealSlots];
        return [];
      }),
      getFirstAsync: jest.fn(async (sql: string, params?: any[]) => {
        if (sql.includes('FROM settings') && params) {
          const val = mockStorage[params[0]];
          return val !== undefined ? { value: val } : null;
        }
        return null;
      }),
    })
  ),
}));

// Import AFTER the mock is declared so the module picks up the mock.
import { getSetting, setSetting, getAppSettings, getMealSlots, updateMealSlot } from '@/db/settingsRepository';

describe('settingsRepository', () => {
  beforeEach(() => {
    // Reset in-memory state before each test.
    mockStorage = {};
    mockMealSlots = [
      { meal_type: 'breakfast', label: 'Petit-déjeuner', icon: '☀️', start_hour: 6,  end_hour: 10 },
      { meal_type: 'lunch',     label: 'Déjeuner',       icon: '🌞', start_hour: 11, end_hour: 14 },
      { meal_type: 'snack',     label: 'Collation',      icon: '🌤', start_hour: 14, end_hour: 18 },
      { meal_type: 'dinner',    label: 'Dîner',           icon: '🌙', start_hour: 18, end_hour: 22 },
    ];
  });

  it('retourne null pour une clé inexistante', async () => {
    const val = await getSetting('unknown_key');
    expect(val).toBeNull();
  });

  it('sauvegarde et relit une valeur', async () => {
    await setSetting('first_name', 'Eugénie');
    const val = await getSetting('first_name');
    expect(val).toBe('Eugénie');
  });

  it('écrase une valeur existante', async () => {
    await setSetting('first_name', 'Eugénie');
    await setSetting('first_name', 'Marie');
    const val = await getSetting('first_name');
    expect(val).toBe('Marie');
  });

  it('getAppSettings retourne les valeurs par défaut si rien n\'est stocké', async () => {
    const settings = await getAppSettings();
    expect(settings.first_name).toBe('');
    expect(settings.onboarding_done).toBe(false);
    expect(settings.icloud_backup).toBe(false);
    expect(settings.backup_interval).toBe(7);
    expect(settings.primary_color).toBe('#E85520');
  });

  it('getAppSettings retourne notifications_enabled: true quand la clé n\'est pas en DB', async () => {
    const settings = await getAppSettings();
    expect(settings.notifications_enabled).toBe(true);
    expect(settings.notifications_breakfast).toBe(true);
    expect(settings.notifications_lunch).toBe(true);
    expect(settings.notifications_snack).toBe(true);
    expect(settings.notifications_dinner).toBe(true);
  });

  it('getMealSlots retourne les 4 slots par défaut', async () => {
    const slots = await getMealSlots();
    expect(slots).toHaveLength(4);
    expect(slots[0].meal_type).toBe('breakfast');
    expect(slots[0].start_hour).toBe(6);
  });

  it('updateMealSlot modifie les bornes horaires', async () => {
    await updateMealSlot('breakfast', 7, 9);
    const slots = await getMealSlots();
    const breakfast = slots.find(s => s.meal_type === 'breakfast');
    expect(breakfast?.start_hour).toBe(7);
    expect(breakfast?.end_hour).toBe(9);
  });
});
