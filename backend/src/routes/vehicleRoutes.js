import { Router } from 'express';

export function createVehicleRoutes(vehicleController, authMiddleware) {
  const router = Router();
  const { requireAuth } = authMiddleware;

  // Protect all vehicle endpoints with JWT authentication
  router.use(requireAuth);

  // Search MUST be registered before dynamic /:id parameter
  router.get('/search', vehicleController.search);
  router.get('/', vehicleController.getAll);

  return router;
}
