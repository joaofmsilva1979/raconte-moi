import { getDatabase } from '@/db/database';
import { Ressenti, RessentCategory, RessentSubCategory } from '@/types';

interface CreateRessentParams {
  recorded_at: string;
  category: RessentCategory;
  sub_category: RessentSubCategory | null;
  note: string | null;
  entry_id: number | null;
  delay_minutes: number | null;
}

export async function createRessenti(params: CreateRessentParams): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO ressentis (recorded_at, category, sub_category, note, entry_id, delay_minutes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [params.recorded_at, params.category, params.sub_category,
     params.note, params.entry_id, params.delay_minutes]
  );
  return result.lastInsertRowId;
}

export async function getRessentisForDay(dateStr: string): Promise<Ressenti[]> {
  const db = await getDatabase();
  return db.getAllAsync<Ressenti>(
    `SELECT * FROM ressentis
     WHERE date(recorded_at) = date(?)
     ORDER BY recorded_at ASC`,
    [dateStr]
  );
}
