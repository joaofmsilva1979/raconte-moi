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
      meal_type    TEXT NOT NULL CHECK(meal_type IN ('breakfast','lunch','snack','dinner','other')),
      transcript   TEXT NOT NULL,
      raw_text     TEXT,
      edited_at    DATETIME,
      created_at   DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ressentis (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      recorded_at    DATETIME NOT NULL,
      category       TEXT NOT NULL CHECK(category IN ('bloating','nausea','pain','fatigue','good','other')),
      sub_category   TEXT CHECK(sub_category IN ('belly','head','other')),
      note           TEXT,
      entry_id       INTEGER REFERENCES entries(id),
      delay_minutes  INTEGER
    );

    CREATE TABLE IF NOT EXISTS meal_slots (
      meal_type   TEXT PRIMARY KEY CHECK(meal_type IN ('breakfast','lunch','snack','dinner')),
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

  await seedDefaultMealSlots(database);
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
