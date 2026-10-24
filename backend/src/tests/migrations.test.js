import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDatabase, closeDatabase } from '../db/connection.js';
import { runMigrations, migrations } from '../db/migrations.js';

describe('Versioned Database Migrations', () => {
  let db;

  beforeEach(() => {
    db = getDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase(db);
  });

  it('creates the schema_migrations tracking table and applies all migrations', () => {
    const applied = runMigrations(db);

    expect(applied.length).toBe(migrations.length);

    const rows = db.prepare('SELECT * FROM schema_migrations ORDER BY version ASC').all();
    expect(rows.length).toBe(migrations.length);
    expect(rows[0].version).toBe(1);
    expect(rows[0].name).toBe('initial_schema');

    // Check users and vehicles tables exist
    const usersTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    const vehiclesTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='vehicles'").get();

    expect(usersTable).toBeDefined();
    expect(vehiclesTable).toBeDefined();
  });

  it('is idempotent and skips already applied migrations on subsequent runs', () => {
    runMigrations(db);
    const secondRun = runMigrations(db);

    expect(secondRun.length).toBe(0);

    const rows = db.prepare('SELECT COUNT(*) as count FROM schema_migrations').get();
    expect(rows.count).toBe(migrations.length);
  });
});
