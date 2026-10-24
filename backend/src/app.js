import express from 'express';
import cors from 'cors';
import { UserRepository } from './repositories/UserRepository.js';
import { AuthService } from './services/AuthService.js';
import { AuthController } from './controllers/AuthController.js';
import { createAuthRoutes } from './routes/authRoutes.js';
import { VehicleRepository } from './repositories/VehicleRepository.js';
import { VehicleService } from './services/VehicleService.js';
import { VehicleController } from './controllers/VehicleController.js';
import { createVehicleRoutes } from './routes/vehicleRoutes.js';
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
  const vehicleRepository = new VehicleRepository(db);
  const vehicleService = new VehicleService(vehicleRepository);
  const vehicleController = new VehicleController(vehicleService);
  const authMiddleware = createAuthMiddleware(jwtSecret);

  // Expose services/middleware for extension in other routes
  app.locals.db = db;
  app.locals.userRepository = userRepository;
  app.locals.authService = authService;
  app.locals.vehicleRepository = vehicleRepository;
  app.locals.vehicleService = vehicleService;
  app.locals.vehicleController = vehicleController;
  app.locals.authMiddleware = authMiddleware;

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Mount Auth routes
  app.use('/api/auth', createAuthRoutes(authController));

  // Mount Vehicles routes
  app.use('/api/vehicles', createVehicleRoutes(vehicleController, authMiddleware));

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
