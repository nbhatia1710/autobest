import { Router } from 'express';

export function createVehicleRoutes(vehicleController, authMiddleware) {
  const router = Router();
  const { requireAuth, requireAdmin } = authMiddleware;

  // Protect all vehicle endpoints with JWT authentication
  router.use(requireAuth);

  // Search MUST be registered before dynamic /:id parameter
  router.get('/search', vehicleController.search);
  router.get('/', vehicleController.getAll);

  // Admin-only management endpoints
  router.post('/', requireAdmin, vehicleController.create);
  router.put('/:id', requireAdmin, vehicleController.update);
  router.delete('/:id', requireAdmin, vehicleController.remove);

  // Inventory endpoints
  router.post('/:id/purchase', vehicleController.purchase);
  router.post('/:id/restock', requireAdmin, vehicleController.restock);

  return router;
}
