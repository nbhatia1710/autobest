import express from 'express';
import cors from 'cors';
import { UserRepository } from './repositories/UserRepository.js';
import { AuthService } from './services/AuthService.js';
import { AuthController } from './controllers/AuthController.js';
import { createAuthRoutes } from './routes/authRoutes.js';
import { createAuthMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(db, options = {}) {
  const app = express();

  // Middleware
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or same-origin)
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'test') {
          return callback(null, true);
        }
        return callback(null, true); // Permissive in dev/local setups
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json());

  // Dependencies
  const jwtSecret = options.jwtSecret || process.env.JWT_SECRET || 'autobest-secret-key-development';
  const userRepository = new UserRepository(db);
  const authService = new AuthService(userRepository, jwtSecret);
  const authController = new AuthController(authService);
  const authMiddleware = createAuthMiddleware(jwtSecret);

  // Expose services/middleware for extension in other routes
  app.locals.db = db;
  app.locals.userRepository = userRepository;
  app.locals.authService = authService;
  app.locals.authMiddleware = authMiddleware;

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Mount Auth routes
  app.use('/api/auth', createAuthRoutes(authController));

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
