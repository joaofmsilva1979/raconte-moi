import { getDatabase } from '@/db/database';
import { Entry, MealType } from '@/types';

interface CreateEntryParams {
  recorded_at: string;
  meal_type: MealType;
  transcript: string;
  raw_text: string | null;
}

export async function createEntry(params: CreateEntryParams): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO entries (recorded_at, meal_type, transcript, raw_text)
     VALUES (?, ?, ?, ?)`,
    [params.recorded_at, params.meal_type, params.transcript, params.raw_text]
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
