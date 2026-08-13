import { getDatabase } from '@/db/database';
import type { ComfortAid, ComfortAidLog } from '@/types';

export async function getComfortAids(): Promise<ComfortAid[]> {
  const db = await getDatabase();
  return db.getAllAsync<ComfortAid>('SELECT * FROM comfort_aids ORDER BY name ASC');
}

export async function addComfortAid(name: string): Promise<ComfortAid> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO comfort_aids (name) VALUES (?)',
    [name]
  );
  const row = await db.getFirstAsync<ComfortAid>(
    'SELECT * FROM comfort_aids WHERE id = ?',
    [result.lastInsertRowId]
  );
  return row!;
}

export async function deleteComfortAid(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM comfort_aids WHERE id = ?', [id]);
}

export async function logComfortAid(params: {
  comfort_aid_id: number;
  recorded_at: string;
  meal_type?: string | null;
  note?: string | null;
}): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO comfort_aid_logs (comfort_aid_id, recorded_at, meal_type, note) VALUES (?, ?, ?, ?)',
    [params.comfort_aid_id, params.recorded_at, params.meal_type ?? null, params.note ?? null]
  );
  return result.lastInsertRowId;
}

export async function getComfortAidLogs(from?: string, to?: string): Promise<ComfortAidLog[]> {
  const db = await getDatabase();
  if (from && to) {
    return db.getAllAsync<ComfortAidLog>(
      `SELECT cal.*, ca.name AS comfort_aid_name
       FROM comfort_aid_logs cal
       LEFT JOIN comfort_aids ca ON cal.comfort_aid_id = ca.id
       WHERE cal.recorded_at >= ? AND cal.recorded_at <= ?
       ORDER BY cal.recorded_at DESC`,
      [from, to]
    );
  }
  return db.getAllAsync<ComfortAidLog>(
    `SELECT cal.*, ca.name AS comfort_aid_name
     FROM comfort_aid_logs cal
     LEFT JOIN comfort_aids ca ON cal.comfort_aid_id = ca.id
     ORDER BY cal.recorded_at DESC`
  );
}

export async function getComfortAidLogsForDay(dateStr: string): Promise<ComfortAidLog[]> {
  const db = await getDatabase();
  return db.getAllAsync<ComfortAidLog>(
    `SELECT cal.*, ca.name AS comfort_aid_name
     FROM comfort_aid_logs cal
     LEFT JOIN comfort_aids ca ON cal.comfort_aid_id = ca.id
     WHERE date(cal.recorded_at) = date(?)
     ORDER BY cal.recorded_at ASC`,
    [dateStr]
  );
}
