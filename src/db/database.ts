import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  // Web: use in-memory SQLite to avoid OPFS/SharedArrayBuffer issues on Safari
  const dbName = Platform.OS === 'web' ? ':memory:' : 'notesdepatate.db';
  db = await SQLite.openDatabaseAsync(dbName);
  return db;
}

export async function initDatabase(): Promise<void> {
  const database = await getDatabase();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS entries (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      recorded_at  DATETIME NOT NULL,
      meal_type    TEXT NOT NULL,
      transcript   TEXT NOT NULL,
      raw_text     TEXT,
      edited_at    DATETIME,
      created_at   DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ressentis (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      recorded_at    DATETIME NOT NULL,
      category       TEXT NOT NULL,
      sub_category   TEXT,
      note           TEXT,
      entry_id       INTEGER REFERENCES entries(id),
      delay_minutes  INTEGER
    );

    CREATE TABLE IF NOT EXISTS meal_slots (
      meal_type   TEXT PRIMARY KEY,
      label       TEXT NOT NULL,
      icon        TEXT NOT NULL,
      start_hour  INTEGER NOT NULL,
      end_hour    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  await runMigrations(database);
  await seedDefaultMealSlots(database);
}

// ─── Schema versioning ────────────────────────────────────────────────────────

const CURRENT_SCHEMA_VERSION = 4;

async function columnExists(
  database: SQLite.SQLiteDatabase,
  table: string,
  column: string
): Promise<boolean> {
  const rows = await database.getAllAsync<{ name: string }>(`PRAGMA table_info("${table}")`);
  return rows.some(r => r.name === column);
}

async function getSchemaVersion(database: SQLite.SQLiteDatabase): Promise<number> {
  try {
    const row = await database.getFirstAsync<{ version: number }>('SELECT version FROM schema_version');
    return row?.version ?? 0;
  } catch {
    // table doesn't exist yet — fresh install or pre-versioning
    return 0;
  }
}

async function setSchemaVersion(database: SQLite.SQLiteDatabase, version: number): Promise<void> {
  await database.execAsync('CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)');
  const exists = await database.getFirstAsync('SELECT 1 FROM schema_version');
  if (exists) {
    await database.runAsync('UPDATE schema_version SET version = ?', version);
  } else {
    await database.runAsync('INSERT INTO schema_version (version) VALUES (?)', version);
  }
}

// ─── Migrations ───────────────────────────────────────────────────────────────
// Each migration runs exactly once. Version is saved after each success,
// so a failed migration retries on next launch rather than being silently skipped.

type Migration = (database: SQLite.SQLiteDatabase) => Promise<void>;

const MIGRATIONS: Migration[] = [
  // v1 — remove CHECK constraint from ressentis + add legacy columns
  async (database) => {
    const tableInfo = await database.getFirstAsync<{ sql: string }>(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='ressentis'"
    );
    if (tableInfo?.sql?.includes('CHECK')) {
      await database.execAsync(`
        CREATE TABLE ressentis_v2 (
          id             INTEGER PRIMARY KEY AUTOINCREMENT,
          recorded_at    DATETIME NOT NULL,
          category       TEXT NOT NULL,
          sub_category   TEXT,
          note           TEXT,
          entry_id       INTEGER REFERENCES entries(id),
          delay_minutes  INTEGER,
          meal_type      TEXT,
          meal_date      TEXT
        );
        INSERT INTO ressentis_v2 (id, recorded_at, category, sub_category, note, entry_id, delay_minutes)
          SELECT id, recorded_at, category, sub_category, note, entry_id, delay_minutes FROM ressentis;
        DROP TABLE ressentis;
        ALTER TABLE ressentis_v2 RENAME TO ressentis;
      `);
    }
    if (!await columnExists(database, 'ressentis', 'meal_type')) {
      await database.execAsync('ALTER TABLE ressentis ADD COLUMN meal_type TEXT');
    }
    if (!await columnExists(database, 'entries', 'photo_uri')) {
      await database.execAsync('ALTER TABLE entries ADD COLUMN photo_uri TEXT');
    }
    if (!await columnExists(database, 'ressentis', 'meal_date')) {
      await database.execAsync('ALTER TABLE ressentis ADD COLUMN meal_date TEXT');
    }
    if (!await columnExists(database, 'ressentis', 'context')) {
      await database.execAsync('ALTER TABLE ressentis ADD COLUMN context TEXT');
    }
  },

  // v2 — new feature tables
  async (database) => {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS custom_pain_locations (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        label      TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS activities (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        recorded_at      TEXT NOT NULL,
        activity_type    TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        note             TEXT
      );
    `);
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS sleep_logs (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        recorded_at TEXT NOT NULL,
        log_date    TEXT NOT NULL,
        quality     INTEGER NOT NULL
      );
    `);
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS medications (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL,
        dosage     TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS medication_logs (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        medication_id INTEGER NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
        recorded_at   TEXT NOT NULL,
        timing        TEXT NOT NULL,
        meal_type     TEXT,
        efficacy      INTEGER,
        note          TEXT,
        created_at    TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS comfort_aids (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS comfort_aid_logs (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        comfort_aid_id INTEGER NOT NULL REFERENCES comfort_aids(id) ON DELETE CASCADE,
        recorded_at    TEXT NOT NULL,
        note           TEXT,
        created_at     TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS pro_notes (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        title      TEXT NOT NULL,
        content    TEXT,
        file_uri   TEXT,
        file_name  TEXT,
        file_type  TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  },

  // v3 — comfort_aid_logs.meal_type (absent on installs that pre-date v2)
  async (database) => {
    if (!await columnExists(database, 'comfort_aid_logs', 'meal_type')) {
      await database.execAsync('ALTER TABLE comfort_aid_logs ADD COLUMN meal_type TEXT');
    }
  },

  // v4 — performance indexes (CREATE INDEX IF NOT EXISTS is idempotent)
  async (database) => {
    await database.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_entries_recorded_at         ON entries(recorded_at);
      CREATE INDEX IF NOT EXISTS idx_entries_meal_type           ON entries(meal_type);
      CREATE INDEX IF NOT EXISTS idx_ressentis_recorded_at       ON ressentis(recorded_at);
      CREATE INDEX IF NOT EXISTS idx_ressentis_meal_date         ON ressentis(meal_date);
      CREATE INDEX IF NOT EXISTS idx_activities_recorded_at      ON activities(recorded_at);
      CREATE INDEX IF NOT EXISTS idx_sleep_logs_log_date         ON sleep_logs(log_date);
      CREATE INDEX IF NOT EXISTS idx_medication_logs_recorded_at ON medication_logs(recorded_at);
      CREATE INDEX IF NOT EXISTS idx_comfort_aid_logs_recorded_at ON comfort_aid_logs(recorded_at);
    `);
  },
];

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  const currentVersion = await getSchemaVersion(database);
  if (currentVersion >= CURRENT_SCHEMA_VERSION) return;

  for (let i = currentVersion; i < CURRENT_SCHEMA_VERSION; i++) {
    const migration = MIGRATIONS[i];
    if (!migration) continue;
    console.log(`[DB] Migration v${i + 1}...`);
    await migration(database); // throws on real error — caught by _layout.tsx
    await setSchemaVersion(database, i + 1);
    console.log(`[DB] Migration v${i + 1} OK`);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function closeAndResetDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

export async function resetAllData(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM entries;
    DELETE FROM ressentis;
    DELETE FROM activities;
    DELETE FROM sleep_logs;
    DELETE FROM medication_logs;
    DELETE FROM medications;
    DELETE FROM comfort_aid_logs;
    DELETE FROM comfort_aids;
    DELETE FROM custom_pain_locations;
    DELETE FROM pro_notes;
    DELETE FROM settings;
    DELETE FROM meal_slots;
  `);
  // Re-seed default meal slots so the app isn't broken on next launch
  await seedDefaultMealSlots(database);
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seedDefaultMealSlots(database: SQLite.SQLiteDatabase): Promise<void> {
  const existing = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM meal_slots'
  );
  if (existing && existing.count > 0) return;

  await database.execAsync(`
    INSERT INTO meal_slots VALUES ('breakfast', 'Petit-déjeuner', '☀️', 6, 10);
    INSERT INTO meal_slots VALUES ('lunch',     'Déjeuner',       '🌞', 11, 14);
    INSERT INTO meal_slots VALUES ('snack',     'Collation',      '🌤', 14, 18);
    INSERT INTO meal_slots VALUES ('dinner',    'Dîner',          '🌙', 18, 22);
  `);
}
