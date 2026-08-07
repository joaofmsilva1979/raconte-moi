// Stateful mock storage — declared at module scope so jest.mock factory can close over it.
// NOTE: No beforeEach reset — tests 1 and 2 insert ressentis that test 3 reads.
// This is intentional: the 3 tests share cumulative state within this describe block.
interface MockRessenti {
  id: number;
  recorded_at: string;
  category: string;
  sub_category: string | null;
  note: string | null;
  entry_id: number | null;
  delay_minutes: number | null;
}

let mockRessentis: MockRessenti[] = [];
let mockNextId = 1;

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() =>
    Promise.resolve({
      execAsync: jest.fn(),
      runAsync: jest.fn(async (sql: string, params: any[]) => {
        if (sql.includes('INSERT INTO ressentis')) {
          const id = mockNextId++;
          mockRessentis.push({
            id,
            recorded_at: params[0],
            category: params[1],
            sub_category: params[2],
            note: params[3],
            entry_id: params[4],
            delay_minutes: params[5],
          });
          return { lastInsertRowId: id, changes: 1 };
        }
        return { lastInsertRowId: 0, changes: 0 };
      }),
      getAllAsync: jest.fn(async (sql: string, params?: any[]) => {
        if (sql.includes('FROM ressentis')) {
          let result = [...mockRessentis];
          if (params && params[0]) {
            const dateStr = params[0]; // e.g. '2026-08-07'
            result = result.filter(r => r.recorded_at.startsWith(dateStr));
          }
          // Sort ASC by recorded_at
          result.sort((a, b) => (a.recorded_at >= b.recorded_at ? 1 : -1));
          return result;
        }
        return [];
      }),
      getFirstAsync: jest.fn(async () => null),
    })
  ),
}));

// Import AFTER the mock is declared so the module picks up the mock.
import { createRessenti, getRessentisForDay } from '@/db/ressentisRepository';

const TODAY = '2026-08-07';

describe('ressentisRepository', () => {
  it('crée un ressenti simple et retourne son id', async () => {
    const id = await createRessenti({
      recorded_at: `${TODAY}T13:30:00`,
      category: 'bloating',
      sub_category: null,
      note: null,
      entry_id: null,
      delay_minutes: null,
    });
    expect(id).toBeGreaterThan(0);
  });

  it('crée un ressenti douleur avec sous-catégorie', async () => {
    const id = await createRessenti({
      recorded_at: `${TODAY}T14:00:00`,
      category: 'pain',
      sub_category: 'belly',
      note: 'Douleur légère après le déjeuner.',
      entry_id: null,
      delay_minutes: 74,
    });
    expect(id).toBeGreaterThan(0);
  });

  it('récupère les ressentis d\'un jour triés par heure', async () => {
    const ressentis = await getRessentisForDay(TODAY);
    expect(ressentis.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < ressentis.length; i++) {
      expect(ressentis[i].recorded_at >= ressentis[i - 1].recorded_at).toBe(true);
    }
  });
});
