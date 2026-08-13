import { getDatabase } from '@/db/database';
import type { ProNote } from '@/types';

export async function getProNotes(): Promise<ProNote[]> {
  const db = await getDatabase();
  return db.getAllAsync<ProNote>('SELECT * FROM pro_notes ORDER BY updated_at DESC');
}

export async function getProNote(id: number): Promise<ProNote | null> {
  const db = await getDatabase();
  return db.getFirstAsync<ProNote>('SELECT * FROM pro_notes WHERE id = ?', [id]);
}

export async function createProNote(params: {
  title: string;
  content?: string;
  file_uri?: string;
  file_name?: string;
  file_type?: 'pdf' | 'docx' | 'text';
}): Promise<ProNote> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO pro_notes (title, content, file_uri, file_name, file_type)
     VALUES (?, ?, ?, ?, ?)`,
    [
      params.title,
      params.content ?? null,
      params.file_uri ?? null,
      params.file_name ?? null,
      params.file_type ?? null,
    ]
  );
  const row = await db.getFirstAsync<ProNote>(
    'SELECT * FROM pro_notes WHERE id = ?',
    [result.lastInsertRowId]
  );
  return row!;
}

export async function updateProNote(id: number, title: string, content: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE pro_notes SET title = ?, content = ?, updated_at = datetime('now') WHERE id = ?`,
    [title, content, id]
  );
}

export async function deleteProNote(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM pro_notes WHERE id = ?', [id]);
}
