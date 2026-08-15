import { getDatabase } from '@/db/database';
import type { Medication, MedicationLog } from '@/types';

export async function getMedications(): Promise<Medication[]> {
  const db = await getDatabase();
  return db.getAllAsync<Medication>('SELECT * FROM medications ORDER BY name ASC');
}

export async function addMedication(name: string, dosage?: string): Promise<Medication> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO medications (name, dosage) VALUES (?, ?)',
    [name, dosage ?? null]
  );
  const row = await db.getFirstAsync<Medication>(
    'SELECT * FROM medications WHERE id = ?',
    [result.lastInsertRowId]
  );
  return row!;
}

export async function deleteMedication(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM medications WHERE id = ?', [id]);
}

export async function logMedication(params: {
  medication_id: number;
  recorded_at: string;
  timing: 'before' | 'during' | 'after';
  meal_type?: string;
  efficacy?: 1 | 2 | 3;
  note?: string;
}): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO medication_logs (medication_id, recorded_at, timing, meal_type, efficacy, note)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      params.medication_id,
      params.recorded_at,
      params.timing,
      params.meal_type ?? null,
      params.efficacy ?? null,
      params.note ?? null,
    ]
  );
  return result.lastInsertRowId;
}

export async function getMedicationLogs(from?: string, to?: string): Promise<MedicationLog[]> {
  const db = await getDatabase();
  if (from && to) {
    return db.getAllAsync<MedicationLog>(
      `SELECT ml.*, m.name AS medication_name
       FROM medication_logs ml
       LEFT JOIN medications m ON ml.medication_id = m.id
       WHERE ml.recorded_at >= ? AND ml.recorded_at <= ?
       ORDER BY ml.recorded_at DESC`,
      [from, to]
    );
  }
  return db.getAllAsync<MedicationLog>(
    `SELECT ml.*, m.name AS medication_name
     FROM medication_logs ml
     LEFT JOIN medications m ON ml.medication_id = m.id
     ORDER BY ml.recorded_at DESC`
  );
}

export async function getRecentMedicationLogs(hours: number = 24): Promise<MedicationLog[]> {
  const db = await getDatabase();
  return db.getAllAsync<MedicationLog>(
    `SELECT ml.*, m.name AS medication_name
     FROM medication_logs ml
     LEFT JOIN medications m ON ml.medication_id = m.id
     WHERE ml.recorded_at >= datetime('now', ? || ' hours')
     ORDER BY ml.recorded_at DESC`,
    [`-${hours}`]
  );
}

export async function getMedicationLogsForDay(dateStr: string): Promise<MedicationLog[]> {
  const db = await getDatabase();
  return db.getAllAsync<MedicationLog>(
    `SELECT ml.*, m.name AS medication_name
     FROM medication_logs ml
     LEFT JOIN medications m ON ml.medication_id = m.id
     WHERE date(ml.recorded_at) = date(?)
     ORDER BY ml.recorded_at ASC`,
    [dateStr]
  );
}

export async function deleteMedicationLog(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM medication_logs WHERE id = ?', [id]);
}
