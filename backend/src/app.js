import express from 'express';
import cors from 'cors';
import { validateConfig } from './config/index.js';
import { UserRepository } from './repositories/UserRepository.js';
import { AuthService } from './services/AuthService.js';
import { AuthController } from './controllers/AuthController.js';
import { createAuthRoutes } from './routes/authRoutes.js';
import { VehicleRepository } from './repositories/VehicleRepository.js';
import { VehicleService } from './services/VehicleService.js';
import { VehicleController } from './controllers/VehicleController.js';
import { createVehicleRoutes } from './routes/vehicleRoutes.js';
import { createAuthMiddleware } from './middleware/auth.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { createRateLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(db, options = {}) {
  const config = validateConfig({
    NODE_ENV: options.nodeEnv || process.env.NODE_ENV,
    PORT: options.port || process.env.PORT,
    JWT_SECRET: options.jwtSecret || process.env.JWT_SECRET,
    JWT_EXPIRES_IN: options.jwtExpiresIn || process.env.JWT_EXPIRES_IN,
    CORS_ORIGIN: options.corsOrigins
      ? (Array.isArray(options.corsOrigins) ? options.corsOrigins.join(',') : options.corsOrigins)
      : process.env.CORS_ORIGIN,
    ADMIN_EMAIL: options.adminEmail || process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: options.adminPassword || process.env.ADMIN_PASSWORD,
    DATABASE_PATH: options.databasePath || process.env.DATABASE_PATH,
  });

  const app = express();

  // 1. Remove identifying fingerprint headers
  app.disable('x-powered-by');

  // 2. Set defensive security headers
  app.use(securityHeaders({ nodeEnv: config.nodeEnv }));

  // 3. Strict, enforceable CORS allowlist
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile clients, curl, server-to-server)
        if (!origin) {
          return callback(null, true);
        }
        if (config.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS_ERROR: Origin ${origin} not allowed by CORS allowlist.`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 4. Request body parsing with strict 50kb limit to prevent payload-based DoS
  app.use(express.json({ limit: '50kb' }));

  // 5. Rate limiting for sensitive authentication endpoints
  const authRateLimiter = createRateLimiter({
    windowMs: options.rateLimitWindowMs || 60000,
    max: options.rateLimitMax || 15,
    enabled: options.enableRateLimit !== undefined
      ? options.enableRateLimit
      : (config.nodeEnv !== 'test'),
  });

  // Dependencies
  const userRepository = new UserRepository(db);
  const authService = new AuthService(userRepository, config.jwtSecret, config.jwtExpiresIn);
  const authController = new AuthController(authService);
  const vehicleRepository = new VehicleRepository(db);
  const vehicleService = new VehicleService(vehicleRepository);
  const vehicleController = new VehicleController(vehicleService);
  const authMiddleware = createAuthMiddleware(config.jwtSecret);

  // Expose services/middleware for extension in tests or sub-routers
  app.locals.config = config;
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

  // Mount Auth routes (with rate limiter)
  app.use('/api/auth', createAuthRoutes(authController, authRateLimiter));

  // Mount Vehicles routes
  app.use('/api/vehicles', createVehicleRoutes(vehicleController, authMiddleware));

  // Custom extension routes (for testing or plugins) before error handler
  if (typeof options.extraRoutes === 'function') {
    options.extraRoutes(app);
  }

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
