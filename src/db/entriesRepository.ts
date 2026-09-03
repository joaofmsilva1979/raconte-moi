import { Platform } from 'react-native';
import { getDatabase } from '@/db/database';
import { Entry, MealType } from '@/types';

interface CreateEntryParams {
  recorded_at: string;
  meal_type: MealType;
  transcript: string;
  raw_text: string | null;
  photo_uri?: string | null;
}

export async function createEntry(params: CreateEntryParams): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO entries (recorded_at, meal_type, transcript, raw_text, photo_uri)
     VALUES (?, ?, ?, ?, ?)`,
    [params.recorded_at, params.meal_type, params.transcript, params.raw_text, params.photo_uri ?? null]
  );
  return result.lastInsertRowId;
}

export async function getEntriesForDay(dateStr: string): Promise<Entry[]> {
  const db = await getDatabase();
  return db.getAllAsync<Entry>(
    `SELECT * FROM entries
     WHERE date(recorded_at) = date(?)
     ORDER BY recorded_at ASC`,
    [dateStr]
  );
}

export async function getLastEntry(): Promise<Entry | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Entry>(
    'SELECT * FROM entries ORDER BY recorded_at DESC LIMIT 1'
  );
}

export async function updateEntryTranscript(id: number, transcript: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE entries SET transcript = ?, edited_at = datetime('now') WHERE id = ?`,
    [transcript, id]
  );
}

export async function updateEntryPhoto(id: number, photo_uri: string | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE entries SET photo_uri = ? WHERE id = ?`,
    [photo_uri, id]
  );
}

export async function getEntriesForDateRange(fromDate: string, toDate: string): Promise<Entry[]> {
  const db = await getDatabase();
  return db.getAllAsync<Entry>(
    `SELECT * FROM entries
     WHERE date(recorded_at) >= date(?) AND date(recorded_at) <= date(?)
     ORDER BY recorded_at ASC`,
    [fromDate, toDate]
  );
}

export async function deleteEntry(id: number): Promise<void> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ photo_uri: string | null }>(
    'SELECT photo_uri FROM entries WHERE id = ?', [id]
  );
  await db.runAsync('DELETE FROM entries WHERE id = ?', [id]);
  if (row?.photo_uri && Platform.OS !== 'web') {
    const FileSystem = await import('expo-file-system/legacy');
    await FileSystem.deleteAsync(row.photo_uri, { idempotent: true }).catch(() => {});
  }
}

export async function getActiveDates(dates: string[]): Promise<string[]> {
  if (dates.length === 0) return [];
  const db = await getDatabase();
  const placeholders = dates.map(() => '?').join(',');
  const rows = await db.getAllAsync<{ d: string }>(
    `SELECT DISTINCT date(recorded_at) as d FROM entries WHERE date(recorded_at) IN (${placeholders})`,
    dates
  );
  return rows.map(r => r.d);
}

export async function getLastEntryBefore(dateTimeStr: string): Promise<Entry | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Entry>(
    `SELECT * FROM entries WHERE recorded_at < ? ORDER BY recorded_at DESC LIMIT 1`,
    [dateTimeStr]
  );
}
