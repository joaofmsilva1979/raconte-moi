import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('notesdepatate.db');
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

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  // Remove CHECK constraints from ressentis (needed for expanded sub-categories)
  try {
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
        INSERT INTO ressentis_v2 SELECT id, recorded_at, category, sub_category, note, entry_id, delay_minutes, meal_type, meal_date FROM ressentis;
        DROP TABLE ressentis;
        ALTER TABLE ressentis_v2 RENAME TO ressentis;
      `);
    }
  } catch (e) {
    console.warn('[migration] ressentis schema:', e);
  }

  // Legacy column migrations (for older installs that skipped the table recreate)
  try { await database.execAsync(`ALTER TABLE ressentis ADD COLUMN meal_type TEXT;`); } catch {}
  try { await database.execAsync(`ALTER TABLE entries ADD COLUMN photo_uri TEXT;`); } catch {}
  try { await database.execAsync(`ALTER TABLE ressentis ADD COLUMN meal_date TEXT;`); } catch {}
  try { await database.execAsync(`ALTER TABLE ressentis ADD COLUMN context TEXT;`); } catch {}
  try { await database.execAsync(`ALTER TABLE comfort_aid_logs ADD COLUMN meal_type TEXT;`); } catch {}

  // New feature tables
  try {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS custom_pain_locations (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        label      TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  } catch {}

  try {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS activities (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        recorded_at      TEXT NOT NULL,
        activity_type    TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        note             TEXT
      );
    `);
  } catch {}

  try {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS sleep_logs (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        recorded_at TEXT NOT NULL,
        log_date    TEXT NOT NULL,
        quality     INTEGER NOT NULL
      );
    `);
  } catch {}

  try {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS medications (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL,
        dosage     TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
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
      CREATE TABLE IF NOT EXISTS comfort_aids (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS comfort_aid_logs (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        comfort_aid_id  INTEGER NOT NULL REFERENCES comfort_aids(id) ON DELETE CASCADE,
        recorded_at     TEXT NOT NULL,
        note            TEXT,
        created_at      TEXT NOT NULL DEFAULT (datetime('now'))
      );
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
  } catch {}
}

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
  `);
}

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
