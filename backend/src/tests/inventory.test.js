import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { getDatabase, closeDatabase, initializeSchema, seedDatabase } from '../db/index.js';

describe('Inventory Operations API (/api/vehicles/:id/purchase & restock)', () => {
  let app;
  let db;
  let customerToken;
  let adminToken;

  beforeEach(async () => {
    db = getDatabase(':memory:');
    initializeSchema(db);
    await seedDatabase(db);
    app = createApp(db);

    // Register a customer
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'shopper@autobest.com', password: 'Password123!' });

    const customerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'shopper@autobest.com', password: 'Password123!' });
    customerToken = customerLogin.body.access_token;

    // Login admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@autobest.com', password: 'AdminSecurePass123!' });
    adminToken = adminLogin.body.access_token;
  });

  afterEach(() => {
    closeDatabase(db);
  });

  describe('POST /api/vehicles/:id/purchase', () => {
    it('returns 401 Unauthorized when no authentication token is provided', async () => {
      const res = await request(app).post('/api/vehicles/ab-001/purchase').send({ quantity: 1 });
      expect(res.status).toBe(401);
    });

    it('returns 404 Not Found if vehicle does not exist', async () => {
      const res = await request(app)
        .post('/api/vehicles/unknown-id/purchase')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ quantity: 1 });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('successfully purchases an in-stock vehicle and decrements quantity', async () => {
      // ab-001 starts with quantity 3
      const res = await request(app)
        .post('/api/vehicles/ab-001/purchase')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ quantity: 1 });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('ab-001');
      expect(res.body.quantity).toBe(2);

      // Verify second purchase decrements to 1
      const res2 = await request(app)
        .post('/api/vehicles/ab-001/purchase')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ quantity: 1 });

      expect(res2.status).toBe(200);
      expect(res2.body.quantity).toBe(1);
    });

    it('returns 409 Conflict when attempting to purchase a zero-stock vehicle', async () => {
      // ab-005 starts with quantity 0
      const res = await request(app)
        .post('/api/vehicles/ab-005/purchase')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ quantity: 1 });

      expect(res.status).toBe(409);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('OUT_OF_STOCK');
      expect(res.body.error.message).toMatch(/sold out/i);
    });
  });

  describe('POST /api/vehicles/:id/restock (Admin only)', () => {
    it('returns 401 Unauthorized when missing token', async () => {
      const res = await request(app).post('/api/vehicles/ab-005/restock').send({ quantity: 5 });
      expect(res.status).toBe(401);
    });

    it('returns 403 Forbidden when a customer attempts to restock inventory', async () => {
      const res = await request(app)
        .post('/api/vehicles/ab-005/restock')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ quantity: 5 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 400 Bad Request when restock quantity is missing, non-positive, or decimal', async () => {
      const badQuantities = [0, -2, 'invalid', 2.5, null];

      for (const quantity of badQuantities) {
        const res = await request(app)
          .post('/api/vehicles/ab-005/restock')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ quantity });

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
      }
    });

    it('returns 404 Not Found if restocking a non-existent vehicle', async () => {
      const res = await request(app)
        .post('/api/vehicles/non-existent-id/restock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 5 });

      expect(res.status).toBe(404);
    });

    it('successfully restocks inventory and increments quantity for admin', async () => {
      // ab-005 starts with quantity 0
      const res = await request(app)
        .post('/api/vehicles/ab-005/restock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 5 });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('ab-005');
      expect(res.body.quantity).toBe(5);

      // Now customer can successfully purchase it
      const purchaseRes = await request(app)
        .post('/api/vehicles/ab-005/purchase')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ quantity: 1 });

      expect(purchaseRes.status).toBe(200);
      expect(purchaseRes.body.quantity).toBe(4);
    });
  });
});
