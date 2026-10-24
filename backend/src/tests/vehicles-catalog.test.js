import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { getDatabase, closeDatabase, initializeSchema, seedDatabase } from '../db/index.js';

describe('Vehicles Catalog & Search API (/api/vehicles)', () => {
  let app;
  let db;
  let authToken;

  beforeEach(async () => {
    db = getDatabase(':memory:');
    initializeSchema(db);
    await seedDatabase(db);
    app = createApp(db);

    // Register and login a customer to obtain token
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'buyer@autobest.com', password: 'Password123!' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'buyer@autobest.com', password: 'Password123!' });

    authToken = loginRes.body.access_token;
  });

  afterEach(() => {
    closeDatabase(db);
  });

  describe('GET /api/vehicles', () => {
    it('returns 401 Unauthorized if not authenticated', async () => {
      const res = await request(app).get('/api/vehicles');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 200 and all seeded vehicles when authenticated', async () => {
      const res = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(6);

      const first = res.body[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('make');
      expect(first).toHaveProperty('model');
      expect(first).toHaveProperty('category');
      expect(first).toHaveProperty('price');
      expect(first).toHaveProperty('quantity');
    });

    it('includes zero-stock vehicles in the listing to support frontend disabled state', async () => {
      const res = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${authToken}`);

      const outOfStockVehicle = res.body.find((v) => v.id === 'ab-005');
      expect(outOfStockVehicle).toBeDefined();
      expect(outOfStockVehicle.quantity).toBe(0);
    });
  });

  describe('GET /api/vehicles/search', () => {
    it('returns 401 Unauthorized if not authenticated', async () => {
      const res = await request(app).get('/api/vehicles/search?make=Toyota');
      expect(res.status).toBe(401);
    });

    it('filters vehicles by make (case-insensitive)', async () => {
      const res = await request(app)
        .get('/api/vehicles/search?make=toyota')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].make).toBe('Toyota');
    });

    it('filters vehicles by model', async () => {
      const res = await request(app)
        .get('/api/vehicles/search?model=GLS')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].model).toBe('GLS 450d');
    });

    it('filters vehicles by category', async () => {
      const res = await request(app)
        .get('/api/vehicles/search?category=SUV')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);
      for (const v of res.body) {
        expect(v.category).toBe('SUV');
      }
    });

    it('filters vehicles by price range', async () => {
      const res = await request(app)
        .get('/api/vehicles/search?min_price=4000000&max_price=6000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);
      // BMW 530d (4250000), Audi A6 (4949000), BMW M340i (5225000)
      for (const vehicle of res.body) {
        expect(vehicle.price).toBeGreaterThanOrEqual(4000000);
        expect(vehicle.price).toBeLessThanOrEqual(6000000);
      }
    });

    it('combines multiple filter criteria', async () => {
      const res = await request(app)
        .get('/api/vehicles/search?category=Sedan&max_price=4500000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].model).toBe('5 Series 530d M Sport');
    });

    it('returns empty array when no vehicles match the search criteria', async () => {
      const res = await request(app)
        .get('/api/vehicles/search?make=Ferrari')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('rejects invalid search price range when min_price > max_price with 400 Bad Request', async () => {
      const res = await request(app)
        .get('/api/vehicles/search?min_price=100000&max_price=50000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('INVALID_PRICE_RANGE');
    });

    it('rejects negative search price filters with 400 Bad Request', async () => {
      const res = await request(app)
        .get('/api/vehicles/search?min_price=-500')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('INVALID_PRICE_FILTER');
    });
  });
});
