import { runMigrations } from './migrations.js';

export function initializeSchema(db) {
  runMigrations(db);
}
