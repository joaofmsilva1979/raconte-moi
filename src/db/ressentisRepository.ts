import { getDatabase } from '@/db/database';
import { Ressenti, RessentCategory, RessentSubCategory, MealType } from '@/types';

interface CreateRessentParams {
  recorded_at: string;
  category: RessentCategory;
  sub_category: RessentSubCategory | null;
  note: string | null;
  entry_id: number | null;
  meal_type: MealType | null;
  meal_date: string | null;
  delay_minutes: number | null;
}

export async function createRessenti(params: CreateRessentParams): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO ressentis (recorded_at, category, sub_category, note, entry_id, meal_type, meal_date, delay_minutes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [params.recorded_at, params.category, params.sub_category,
     params.note, params.entry_id, params.meal_type, params.meal_date, params.delay_minutes]
  );
  return result.lastInsertRowId;
}

export async function getRessentisForDay(dateStr: string): Promise<Ressenti[]> {
  const db = await getDatabase();
  return db.getAllAsync<Ressenti>(
    `SELECT * FROM ressentis
     WHERE (meal_date = ? AND meal_date IS NOT NULL)
        OR (meal_date IS NULL AND date(recorded_at) = date(?))
     ORDER BY recorded_at ASC`,
    [dateStr, dateStr]
  );
}

export async function getRessentisForDateRange(fromDate: string, toDate: string): Promise<Ressenti[]> {
  const db = await getDatabase();
  return db.getAllAsync<Ressenti>(
    `SELECT * FROM ressentis
     WHERE (meal_date >= ? AND meal_date <= ?)
        OR (meal_date IS NULL AND date(recorded_at) >= date(?) AND date(recorded_at) <= date(?))
     ORDER BY recorded_at ASC`,
    [fromDate, toDate, fromDate, toDate]
  );
}

export async function updateRessenti(
  id: number,
  params: { sub_category: RessentSubCategory | null; note: string | null }
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE ressentis SET sub_category = ?, note = ? WHERE id = ?`,
    [params.sub_category, params.note, id]
  );
}
