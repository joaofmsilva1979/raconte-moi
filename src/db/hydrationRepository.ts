import { getDatabase } from '@/db/database';
import { HydrationLog } from '@/types';

export async function addHydrationLog(amount_ml: number): Promise<HydrationLog> {
  const db = await getDatabase();
  const recorded_at = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO hydration_logs (recorded_at, amount_ml) VALUES (?, ?)',
    [recorded_at, amount_ml]
  );
  return { id: result.lastInsertRowId, recorded_at, amount_ml };
}

export async function getTodayHydrationLogs(): Promise<HydrationLog[]> {
  const db = await getDatabase();
  const today = new Date().toISOString().slice(0, 10);
  return db.getAllAsync<HydrationLog>(
    "SELECT * FROM hydration_logs WHERE date(recorded_at) = ? ORDER BY recorded_at ASC",
    [today]
  );
}

export async function getHydrationForDay(dateStr: string): Promise<HydrationLog[]> {
  const db = await getDatabase();
  return db.getAllAsync<HydrationLog>(
    "SELECT * FROM hydration_logs WHERE date(recorded_at) = ? ORDER BY recorded_at ASC",
    [dateStr]
  );
}

export async function getTodayTotalMl(): Promise<number> {
  const db = await getDatabase();
  const today = new Date().toISOString().slice(0, 10);
  const row = await db.getFirstAsync<{ total: number }>(
    "SELECT COALESCE(SUM(amount_ml), 0) as total FROM hydration_logs WHERE date(recorded_at) = ?",
    [today]
  );
  return row?.total ?? 0;
}

export async function deleteHydrationLog(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM hydration_logs WHERE id = ?', [id]);
}
