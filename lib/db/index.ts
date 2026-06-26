import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { cases, materials, analysisResults } from "./schema";
import { sql } from "drizzle-orm";
import path from "path";

let dbInstance: ReturnType<typeof drizzle> | null = null;
let sqliteInstance: Database.Database | null = null;

function getDbPath(): string {
  return path.resolve(process.cwd(), "evidencebox.db");
}

function initDb() {
  const dbPath = getDbPath();
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  // Create tables directly with raw SQL (no migration tool needed)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'created',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      original_name TEXT NOT NULL,
      storage_key TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      category TEXT,
      status TEXT NOT NULL DEFAULT 'uploaded',
      extracted_text TEXT,
      extracted_meta TEXT,
      error_msg TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS analysis_results (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      timeline TEXT NOT NULL DEFAULT '[]',
      summary TEXT NOT NULL DEFAULT '{}',
      todos TEXT NOT NULL DEFAULT '[]',
      suggestions TEXT NOT NULL DEFAULT '[]',
      engine_used TEXT NOT NULL DEFAULT 'local-rules-v1',
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_materials_case_id ON materials(case_id);
    CREATE INDEX IF NOT EXISTS idx_analysis_case_id ON analysis_results(case_id);
  `);

  return { sqlite, db: drizzle(sqlite, { schema: { cases, materials, analysisResults } }) };
}

export function getDb() {
  if (!dbInstance) {
    const { sqlite, db } = initDb();
    sqliteInstance = sqlite;
    dbInstance = db;
  }
  return dbInstance;
}

export function getSqlite() {
  if (!sqliteInstance) {
    const { sqlite, db } = initDb();
    sqliteInstance = sqlite;
    dbInstance = db;
  }
  return sqliteInstance;
}
