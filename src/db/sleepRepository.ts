import { getDatabase } from '@/db/database';
import { SleepLog, SleepQuality } from '@/types';

export async function createSleepLog(quality: SleepQuality): Promise<number> {
  const db = await getDatabase();
  const now = new Date();
  const logDate = now.toISOString().slice(0, 10);
  // Replace any existing log for today
  await db.runAsync('DELETE FROM sleep_logs WHERE log_date = ?', [logDate]);
  const result = await db.runAsync(
    `INSERT INTO sleep_logs (recorded_at, log_date, quality) VALUES (?, ?, ?)`,
    [now.toISOString(), logDate, quality]
  );
  return result.lastInsertRowId;
}

export async function getSleepForDay(dateStr: string): Promise<SleepLog | null> {
  const db = await getDatabase();
  return db.getFirstAsync<SleepLog>(
    `SELECT * FROM sleep_logs WHERE log_date = ? ORDER BY recorded_at DESC LIMIT 1`,
    [dateStr]
  );
}

export async function getSleepForDateRange(fromDate: string, toDate: string): Promise<SleepLog[]> {
  const db = await getDatabase();
  return db.getAllAsync<SleepLog>(
    `SELECT * FROM sleep_logs WHERE log_date >= ? AND log_date <= ? ORDER BY log_date ASC`,
    [fromDate, toDate]
  );
}
