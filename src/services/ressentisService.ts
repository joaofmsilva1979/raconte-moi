import { getLastEntryBefore } from '@/db/entriesRepository';

export async function linkToLastEntry(
  recordedAt: Date
): Promise<{ entry_id: number | null; delay_minutes: number | null }> {
  const entry = await getLastEntryBefore(recordedAt.toISOString());
  if (!entry) return { entry_id: null, delay_minutes: null };
  const entryDate = new Date(entry.recorded_at);
  const delay = Math.max(0, Math.round((recordedAt.getTime() - entryDate.getTime()) / 60000));
  return { entry_id: entry.id, delay_minutes: delay };
}
