// Web stub — no SQLite on web (WASM/worker incompatible with GitHub Pages).
// Provides a minimal in-memory database so the app renders and the full UI
// can be explored. Data resets on page reload — demo only.

type Row = Record<string, unknown>;

const MEAL_SLOTS: Row[] = [
  { meal_type: 'breakfast', label: 'Petit-déjeuner', icon: '☀️', start_hour: 6,  end_hour: 10 },
  { meal_type: 'lunch',     label: 'Déjeuner',       icon: '🌞', start_hour: 11, end_hour: 14 },
  { meal_type: 'snack',     label: 'Collation',      icon: '🌤', start_hour: 14, end_hour: 18 },
  { meal_type: 'dinner',    label: 'Dîner',          icon: '🌙', start_hour: 18, end_hour: 22 },
];

// Pré-seeder les settings pour bypasser l'onboarding sur la démo web
const DEFAULT_SETTINGS: Row[] = [
  { key: 'onboarding_done',          value: 'true' },
  { key: 'first_name',               value: 'Eugénie' },
  { key: 'primary_color',            value: '#E85520' },
  { key: 'goal',                     value: 'remember' },
  { key: 'notifications_enabled',    value: 'false' },
  { key: 'notifications_breakfast',  value: 'true' },
  { key: 'notifications_lunch',      value: 'true' },
  { key: 'notifications_snack',      value: 'true' },
  { key: 'notifications_dinner',     value: 'true' },
  { key: 'icloud_backup',            value: 'false' },
  { key: 'backup_interval',          value: '7' },
];

const store: Record<string, Row[]> = {
  meal_slots: MEAL_SLOTS,
  entries: [],
  ressentis: [],
  settings: DEFAULT_SETTINGS,
  activities: [],
  sleep_logs: [],
  medications: [],
  medication_logs: [],
  comfort_aids: [],
  comfort_aid_logs: [],
  custom_pain_locations: [],
  pro_notes: [],
};

let nextId = 1;

function tableFromSQL(sql: string): string | null {
  const m = sql.match(/(?:FROM|INTO|UPDATE|TABLE(?:\s+IF\s+NOT\s+EXISTS)?)\s+["'`]?(\w+)["'`]?/i);
  return m ? m[1] : null;
}

class WebDB {
  async execAsync(sql: string): Promise<void> {
    // INSERT INTO — parse and store row
    if (/^\s*INSERT\s+INTO\s+(\w+)/i.test(sql)) {
      // Already seeded via the initial store; migrations are no-ops on web
    }
  }

  async getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null> {
    const sqlUp = sql.toUpperCase();

    // COUNT(*) queries
    if (sqlUp.includes('COUNT(*)')) {
      const table = tableFromSQL(sql);
      if (table && store[table]) return { count: store[table].length } as unknown as T;
      return { count: 0 } as unknown as T;
    }

    const table = tableFromSQL(sql);
    if (!table || !store[table]) return null;

    // WHERE key = ? style lookup for settings table
    if (sqlUp.includes('WHERE') && params.length > 0) {
      const keyMatch = sql.match(/key\s*=\s*\?/i);
      if (keyMatch) {
        const row = store[table].find((r) => r['key'] === params[0]);
        return (row ?? null) as T | null;
      }
      // Generic first-param match (meal_type, id…)
      const colMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\?/i);
      if (colMatch) {
        const col = colMatch[1];
        const row = store[table].find((r) => String(r[col]) === String(params[0]));
        return (row ?? null) as T | null;
      }
    }

    return (store[table][0] ?? null) as T | null;
  }

  async getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]> {
    const table = tableFromSQL(sql);
    if (!table || !store[table]) return [];

    if (sql.toUpperCase().includes('WHERE') && params.length > 0) {
      const colMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\?/i);
      if (colMatch) {
        const col = colMatch[1];
        return store[table].filter((r) => String(r[col]) === String(params[0])) as unknown as T[];
      }
    }

    return store[table] as unknown as T[];
  }

  async runAsync(sql: string, ...params: unknown[]): Promise<{ lastInsertRowId: number; changes: number }> {
    const sqlUp = sql.toUpperCase().trim();

    if (sqlUp.startsWith('INSERT INTO')) {
      const table = tableFromSQL(sql);
      if (table && store[table] !== undefined) {
        const id = nextId++;
        // Simple single-value inserts — just track the id
        store[table].push({ id } as Row);
        return { lastInsertRowId: id, changes: 1 };
      }
    }

    if (sqlUp.startsWith('UPDATE')) {
      return { lastInsertRowId: 0, changes: 1 };
    }

    if (sqlUp.startsWith('DELETE')) {
      const table = tableFromSQL(sql);
      if (table && store[table]) store[table] = [];
      return { lastInsertRowId: 0, changes: 1 };
    }

    return { lastInsertRowId: nextId++, changes: 1 };
  }

  async closeAsync(): Promise<void> {}
}

const webDb = new WebDB();

export async function getDatabase(): Promise<WebDB> {
  return webDb;
}

export async function initDatabase(): Promise<void> {
  // No-op — store is already pre-seeded above
}

export async function closeAndResetDatabase(): Promise<void> {
  // No-op on web
}

export async function resetAllData(): Promise<void> {
  store.entries = [];
  store.ressentis = [];
  store.activities = [];
  store.sleep_logs = [];
}
