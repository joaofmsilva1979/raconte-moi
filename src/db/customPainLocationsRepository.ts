import { getDatabase } from '@/db/database';
import { CustomPainLocation } from '@/types';

export async function getCustomPainLocations(): Promise<CustomPainLocation[]> {
  const db = await getDatabase();
  return db.getAllAsync<CustomPainLocation>(
    'SELECT id, label FROM custom_pain_locations ORDER BY created_at ASC'
  );
}

export async function addCustomPainLocation(label: string): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT OR IGNORE INTO custom_pain_locations (label) VALUES (?)',
    [label.trim()]
  );
  return result.lastInsertRowId;
}

export async function deleteCustomPainLocation(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM custom_pain_locations WHERE id = ?', [id]);
}
