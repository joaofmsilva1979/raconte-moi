import { getDatabase } from '@/db/database';
import { AppSettings, MealSlot, MealType } from '@/types';

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?', [key]
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value]
  );
}

export async function getAppSettings(): Promise<AppSettings> {
  const [
    first_name, primary_color, goal,
    onboarding_done, icloud_backup,
    backup_interval, last_backup_at,
    notifications_enabled, notifications_breakfast, notifications_lunch,
    notifications_snack, notifications_dinner,
  ] = await Promise.all([
    getSetting('first_name'),
    getSetting('primary_color'),
    getSetting('goal'),
    getSetting('onboarding_done'),
    getSetting('icloud_backup'),
    getSetting('backup_interval'),
    getSetting('last_backup_at'),
    getSetting('notifications_enabled'),
    getSetting('notifications_breakfast'),
    getSetting('notifications_lunch'),
    getSetting('notifications_snack'),
    getSetting('notifications_dinner'),
  ]);

  return {
    first_name: first_name ?? '',
    primary_color: primary_color ?? '#E85520',
    goal: (goal as AppSettings['goal']) ?? 'remember',
    onboarding_done: onboarding_done === 'true',
    icloud_backup: icloud_backup === 'true',
    backup_interval: backup_interval ? parseInt(backup_interval, 10) : 7,
    last_backup_at: last_backup_at ?? null,
    notifications_enabled: notifications_enabled !== 'false',
    notifications_breakfast: notifications_breakfast !== 'false',
    notifications_lunch: notifications_lunch !== 'false',
    notifications_snack: notifications_snack !== 'false',
    notifications_dinner: notifications_dinner !== 'false',
  };
}

export async function getMealSlots(): Promise<MealSlot[]> {
  const db = await getDatabase();
  return db.getAllAsync<MealSlot>(
    'SELECT * FROM meal_slots ORDER BY start_hour ASC'
  );
}

export async function updateMealSlot(
  meal_type: MealType,
  start_hour: number,
  end_hour: number
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE meal_slots SET start_hour = ?, end_hour = ? WHERE meal_type = ?',
    [start_hour, end_hour, meal_type]
  );
}
