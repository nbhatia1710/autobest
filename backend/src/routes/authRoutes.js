import { Router } from 'express';

export function createAuthRoutes(authController, rateLimiter = (req, res, next) => next()) {
  const router = Router();

  router.post('/register', rateLimiter, authController.register);
  router.post('/login', rateLimiter, authController.login);

  return router;
}
