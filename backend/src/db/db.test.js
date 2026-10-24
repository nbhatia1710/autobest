import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDatabase, closeDatabase } from './connection.js';
import { initializeSchema } from './schema.js';

describe('Database and Schema Initialization', () => {
  let db;

  beforeEach(() => {
    // Using in-memory database for tests
    db = getDatabase(':memory:');
    initializeSchema(db);
  });

  afterEach(() => {
    closeDatabase(db);
  });

  it('initializes the users table with correct schema', () => {
    const tableInfo = db.prepare("PRAGMA table_info(users)").all();
    const columns = tableInfo.map((col) => col.name);

    expect(columns).toContain('id');
    expect(columns).toContain('email');
    expect(columns).toContain('password');
    expect(columns).toContain('role');
    expect(columns).toContain('created_at');

    const emailCol = tableInfo.find((col) => col.name === 'email');
    expect(emailCol.notnull).toBe(1);
  });

  it('initializes the vehicles table with required vehicle attributes', () => {
    const tableInfo = db.prepare("PRAGMA table_info(vehicles)").all();
    const columns = tableInfo.map((col) => col.name);

    expect(columns).toContain('id');
    expect(columns).toContain('make');
    expect(columns).toContain('model');
    expect(columns).toContain('year');
    expect(columns).toContain('category');
    expect(columns).toContain('price');
    expect(columns).toContain('quantity');
    expect(columns).toContain('image');
    expect(columns).toContain('created_at');
    expect(columns).toContain('updated_at');
  });

  it('enforces unique email constraint on users table', () => {
    const insert = db.prepare(
      'INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)'
    );
    insert.run('u1', 'duplicate@autobest.com', 'hashedpass', 'customer');

    expect(() => {
      insert.run('u2', 'duplicate@autobest.com', 'hashedpass2', 'customer');
    }).toThrow();
  });
});
