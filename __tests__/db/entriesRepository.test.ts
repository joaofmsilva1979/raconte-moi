// Stateful mock storage — declared at module scope so jest.mock factory can close over it.
// Each test resets state via beforeEach.
interface MockEntry {
  id: number;
  recorded_at: string;
  meal_type: string;
  transcript: string;
  raw_text: string | null;
  edited_at: string | null;
  created_at: string;
}

let mockEntries: MockEntry[] = [];
let mockNextId = 1;

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() =>
    Promise.resolve({
      execAsync: jest.fn(),
      runAsync: jest.fn(async (sql: string, params: any[]) => {
        if (sql.includes('INSERT INTO entries')) {
          const id = mockNextId++;
          mockEntries.push({
            id,
            recorded_at: params[0],
            meal_type: params[1],
            transcript: params[2],
            raw_text: params[3],
            edited_at: null,
            created_at: new Date().toISOString(),
          });
          return { lastInsertRowId: id, changes: 1 };
        } else if (sql.includes('UPDATE entries')) {
          // UPDATE entries SET transcript = ?, edited_at = datetime('now') WHERE id = ?
          const transcript = params[0];
          const id = params[1];
          const entry = mockEntries.find(e => e.id === id);
          if (entry) {
            entry.transcript = transcript;
            entry.edited_at = new Date().toISOString();
          }
          return { lastInsertRowId: 0, changes: 1 };
        }
        return { lastInsertRowId: 0, changes: 0 };
      }),
      getAllAsync: jest.fn(async (sql: string, params?: any[]) => {
        if (sql.includes('FROM entries')) {
          // Filter by date if date param provided
          let result = [...mockEntries];
          if (params && params[0]) {
            const dateStr = params[0]; // e.g. '2026-08-07'
            result = result.filter(e => e.recorded_at.startsWith(dateStr));
          }
          // Sort ASC by recorded_at
          result.sort((a, b) => (a.recorded_at >= b.recorded_at ? 1 : -1));
          return result;
        }
        return [];
      }),
      getFirstAsync: jest.fn(async (sql: string, params?: any[]) => {
        if (sql.includes('FROM entries')) {
          if (sql.includes('ORDER BY recorded_at DESC')) {
            // getLastEntry — return entry with latest recorded_at
            if (mockEntries.length === 0) return null;
            const sorted = [...mockEntries].sort((a, b) =>
              a.recorded_at >= b.recorded_at ? -1 : 1
            );
            return sorted[0];
          }
        }
        return null;
      }),
    })
  ),
}));

// Import AFTER the mock is declared so the module picks up the mock.
import { createEntry, getEntriesForDay, getLastEntry, updateEntryTranscript } from '@/db/entriesRepository';

const TODAY = '2026-08-07';

describe('entriesRepository', () => {
  beforeEach(() => {
    // Reset in-memory state before each test.
    mockEntries = [];
    mockNextId = 1;
  });

  it('crée une entrée et retourne son id', async () => {
    const id = await createEntry({
      recorded_at: `${TODAY}T08:12:00`,
      meal_type: 'breakfast',
      transcript: 'Café au lait et tartines.',
      raw_text: 'euh un café et pis des tartines',
    });
    expect(id).toBeGreaterThan(0);
  });

  it('récupère les entrées d\'un jour', async () => {
    await createEntry({ recorded_at: `${TODAY}T08:12:00`, meal_type: 'breakfast', transcript: 'Café.', raw_text: null });
    await createEntry({ recorded_at: `${TODAY}T12:46:00`, meal_type: 'lunch', transcript: 'Salade.', raw_text: null });

    const entries = await getEntriesForDay(TODAY);
    expect(entries.length).toBeGreaterThanOrEqual(2);
    expect(entries.every(e => e.recorded_at.startsWith(TODAY))).toBe(true);
  });

  it('retourne les entrées triées par heure croissante', async () => {
    const entries = await getEntriesForDay(TODAY);
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i].recorded_at >= entries[i - 1].recorded_at).toBe(true);
    }
  });

  it('getLastEntry retourne la dernière entrée toutes dates confondues', async () => {
    await createEntry({ recorded_at: `${TODAY}T19:00:00`, meal_type: 'dinner', transcript: 'Soupe.', raw_text: null });
    const last = await getLastEntry();
    expect(last).not.toBeNull();
    expect(last?.meal_type).toBe('dinner');
  });

  it('met à jour le transcript d\'une entrée', async () => {
    const id = await createEntry({ recorded_at: `${TODAY}T08:00:00`, meal_type: 'breakfast', transcript: 'Brouillon.', raw_text: null });
    await updateEntryTranscript(id, 'Café et croissant.');
    const entries = await getEntriesForDay(TODAY);
    const updated = entries.find(e => e.id === id);
    expect(updated?.transcript).toBe('Café et croissant.');
    expect(updated?.edited_at).not.toBeNull();
  });
});
