import * as SQLite from 'expo-sqlite';
import { SCHEMA_V1 } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('deckbox.db');
  await db.execAsync(SCHEMA_V1);
  return db;
}

export async function closeDb(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
