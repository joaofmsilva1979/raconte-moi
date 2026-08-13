import { getDatabase } from '@/db/database';
import { Activity, ActivityType } from '@/types';

interface CreateActivityParams {
  recorded_at: string;
  activity_type: ActivityType;
  duration_minutes: number;
  note: string | null;
}

export async function createActivity(params: CreateActivityParams): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO activities (recorded_at, activity_type, duration_minutes, note)
     VALUES (?, ?, ?, ?)`,
    [params.recorded_at, params.activity_type, params.duration_minutes, params.note]
  );
  return result.lastInsertRowId;
}

export async function getActivitiesForDay(dateStr: string): Promise<Activity[]> {
  const db = await getDatabase();
  return db.getAllAsync<Activity>(
    `SELECT * FROM activities WHERE date(recorded_at) = date(?) ORDER BY recorded_at ASC`,
    [dateStr]
  );
}

export async function getActivitiesForDateRange(fromDate: string, toDate: string): Promise<Activity[]> {
  const db = await getDatabase();
  return db.getAllAsync<Activity>(
    `SELECT * FROM activities
     WHERE date(recorded_at) >= date(?) AND date(recorded_at) <= date(?)
     ORDER BY recorded_at ASC`,
    [fromDate, toDate]
  );
}

export async function getTodayTotalMinutes(): Promise<number> {
  const db = await getDatabase();
  const today = new Date().toISOString().slice(0, 10);
  const result = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(duration_minutes), 0) as total FROM activities WHERE date(recorded_at) = date(?)`,
    [today]
  );
  return result?.total ?? 0;
}
