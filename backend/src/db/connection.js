import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let defaultDbInstance = null;

export function getDatabase(dbPath = process.env.DATABASE_PATH || 'data/autobest.sqlite') {
  if (dbPath === ':memory:') {
    const memoryDb = new Database(':memory:');
    memoryDb.pragma('journal_mode = WAL');
    memoryDb.pragma('foreign_keys = ON');
    return memoryDb;
  }

  if (defaultDbInstance) {
    return defaultDbInstance;
  }

  const resolvedPath = path.isAbsolute(dbPath)
    ? dbPath
    : path.resolve(__dirname, '../../', dbPath);

  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  defaultDbInstance = new Database(resolvedPath);
  defaultDbInstance.pragma('journal_mode = WAL');
  defaultDbInstance.pragma('foreign_keys = ON');

  return defaultDbInstance;
}

export function closeDatabase(db) {
  if (db && db.open) {
    db.close();
  }
  if (db === defaultDbInstance) {
    defaultDbInstance = null;
  }
}
