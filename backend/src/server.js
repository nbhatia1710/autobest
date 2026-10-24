import dotenv from 'dotenv';
import { createApp } from './app.js';
import { getDatabase, seedDatabase } from './db/index.js';

dotenv.config();

const PORT = process.env.PORT || 8000;
const dbPath = process.env.DATABASE_PATH || 'data/autobest.sqlite';

const db = getDatabase(dbPath);

// Seed database on startup if fresh
await seedDatabase(db);

const app = createApp(db);

const server = app.listen(PORT, () => {
  console.log(`AutoBest Motors Backend API running on port ${PORT}`);
  console.log(`Database connected at: ${dbPath}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
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
