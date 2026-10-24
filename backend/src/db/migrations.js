export const migrations = [
  {
    version: 1,
    name: 'initial_schema',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

        CREATE TABLE IF NOT EXISTS vehicles (
          id TEXT PRIMARY KEY,
          make TEXT NOT NULL,
          model TEXT NOT NULL,
          year INTEGER NOT NULL,
          category TEXT NOT NULL,
          price REAL NOT NULL CHECK(price > 0),
          quantity INTEGER NOT NULL CHECK(quantity >= 0),
          image TEXT NOT NULL,
          fuel TEXT,
          transmission TEXT,
          mileage INTEGER,
          color TEXT,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_vehicles_make ON vehicles(make);
        CREATE INDEX IF NOT EXISTS idx_vehicles_model ON vehicles(model);
        CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category);
        CREATE INDEX IF NOT EXISTS idx_vehicles_price ON vehicles(price);
      `);
    },
  },
  {
    version: 2,
    name: 'currency_precision_and_indexes',
    up: (db) => {
      // Add indexing for stock quantity and updated_at to optimize listing & concurrency checks
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_vehicles_quantity ON vehicles(quantity);
        CREATE INDEX IF NOT EXISTS idx_vehicles_updated_at ON vehicles(updated_at);
      `);
    },
  },
];

export function runMigrations(db) {
  // Ensure migration tracking table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const appliedRows = db.prepare('SELECT version FROM schema_migrations').all();
  const appliedVersions = new Set(appliedRows.map((r) => r.version));

  const newlyApplied = [];

  for (const migration of migrations) {
    if (!appliedVersions.has(migration.version)) {
      const applyMigration = db.transaction(() => {
        migration.up(db);
        db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(
          migration.version,
          migration.name
        );
      });

      applyMigration();
      newlyApplied.push(migration);
    }
  }

  return newlyApplied;
}
