import { getDatabase } from '@/db/database';

export interface CustomActivity {
  id: number;
  name: string;
}

export async function getCustomActivities(): Promise<CustomActivity[]> {
  const db = await getDatabase();
  return db.getAllAsync<CustomActivity>(
    'SELECT id, name FROM custom_activities ORDER BY name ASC'
  );
}

export async function addCustomActivity(name: string): Promise<CustomActivity> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT OR IGNORE INTO custom_activities (name) VALUES (?)',
    [name]
  );
  const id = result.lastInsertRowId ||
    (await db.getFirstAsync<{ id: number }>('SELECT id FROM custom_activities WHERE name = ?', [name]))!.id;
  return { id, name };
}
