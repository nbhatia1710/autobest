import dotenv from 'dotenv';
import { validateConfig } from './config/index.js';
import { createApp } from './app.js';
import { getDatabase, seedDatabase, runMigrations } from './db/index.js';

dotenv.config();

let config;
try {
  config = validateConfig();
} catch (err) {
  console.error('\n======================================================');
  console.error('FATAL STARTUP CONFIGURATION ERROR:');
  console.error(err.message);
  console.error('======================================================\n');
  process.exit(1);
}

const db = getDatabase(config.databasePath);

// Execute versioned migrations
runMigrations(db);

// Seed database on startup if fresh
try {
  await seedDatabase(db, config);
} catch (err) {
  console.error('\n======================================================');
  console.error('DATABASE SEEDING ERROR:');
  console.error(err.message);
  console.error('======================================================\n');
  process.exit(1);
}

const app = createApp(db, config);

const server = app.listen(config.port, () => {
  console.log(`AutoBest Motors Backend API running on port ${config.port} [${config.nodeEnv}]`);
  console.log(`Database connected at: ${config.databasePath}`);
  console.log(`CORS allowed origins: ${config.corsOrigins.join(', ')}`);
  console.log(`Health check: http://localhost:${config.port}/api/health`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    db.close();
    console.log('HTTP server and database connection closed.');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    db.close();
    console.log('HTTP server and database connection closed.');
  });
});
