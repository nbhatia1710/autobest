import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../app.js';
import { getDatabase, closeDatabase, initializeSchema, seedDatabase } from '../db/index.js';

describe('Vehicles Management CRUD API (/api/vehicles)', () => {
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
      .send({ email: 'customer@example.com', password: 'Password123!' });

    const customerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer@example.com', password: 'Password123!' });
    customerToken = customerLogin.body.access_token;

    // Login default seeded admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@autobest.com', password: 'AdminSecurePass123!' });
    adminToken = adminLogin.body.access_token;
  });

  afterEach(() => {
    closeDatabase(db);
  });

  describe('POST /api/vehicles (Add new vehicle)', () => {
    const newVehicleData = {
      make: 'Lamborghini',
      model: 'Huracan',
      year: 2024,
      category: 'Coupe',
      price: 249000,
      quantity: 2,
      image: '/media/lamborghini.jpg',
      fuel: 'Petrol',
      transmission: 'Automatic',
      mileage: 1200,
      color: 'Giallo Inti',
      description: 'Pure naturally aspirated V10 performance.',
    };

    it('returns 401 Unauthorized when missing token', async () => {
      const res = await request(app).post('/api/vehicles').send(newVehicleData);
      expect(res.status).toBe(401);
    });

    it('returns 403 Forbidden when a customer attempts to add a vehicle', async () => {
      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(newVehicleData);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 400 Bad Request when mandatory fields are missing', async () => {
      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          make: 'Lamborghini',
          // missing model, price, quantity, etc.
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 400 Bad Request if price or quantity is invalid', async () => {
      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newVehicleData,
          price: -5000,
        });

      expect(res.status).toBe(400);
    });

    it('successfully creates a vehicle with 201 Created for admin', async () => {
      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newVehicleData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.make).toBe('Lamborghini');
      expect(res.body.model).toBe('Huracan');
      expect(res.body.price).toBe(249000);
      expect(res.body.quantity).toBe(2);

      // Verify it is retrievable via GET /api/vehicles
      const listRes = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${customerToken}`);
      const found = listRes.body.find((v) => v.id === res.body.id);
      expect(found).toBeDefined();
    });
  });

  describe('PUT /api/vehicles/:id (Update vehicle details)', () => {
    it('returns 401 Unauthorized when missing token', async () => {
      const res = await request(app)
        .put('/api/vehicles/ab-001')
        .send({ price: 125000 });
      expect(res.status).toBe(401);
    });

    it('returns 403 Forbidden when a customer attempts to update a vehicle', async () => {
      const res = await request(app)
        .put('/api/vehicles/ab-001')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ price: 125000 });

      expect(res.status).toBe(403);
    });

    it('returns 404 Not Found when updating a non-existent vehicle', async () => {
      const res = await request(app)
        .put('/api/vehicles/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 125000 });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('successfully updates vehicle details for admin', async () => {
      const res = await request(app)
        .put('/api/vehicles/ab-001')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 125000,
          color: 'Jet Black Metallic',
        });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('ab-001');
      expect(res.body.price).toBe(125000);
      expect(res.body.color).toBe('Jet Black Metallic');
      expect(res.body.make).toBe('Porsche'); // preserves untouched fields
    });
  });

  describe('DELETE /api/vehicles/:id (Delete a vehicle - Admin only)', () => {
    it('returns 401 Unauthorized when missing token', async () => {
      const res = await request(app).delete('/api/vehicles/ab-001');
      expect(res.status).toBe(401);
    });

    it('returns 403 Forbidden when customer attempts deletion', async () => {
      const res = await request(app)
        .delete('/api/vehicles/ab-001')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 404 Not Found when deleting a non-existent vehicle', async () => {
      const res = await request(app)
        .delete('/api/vehicles/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('successfully deletes a vehicle for admin', async () => {
      const res = await request(app)
        .delete('/api/vehicles/ab-001')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 204]).toContain(res.status);

      // Verify it was removed
      const listRes = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`);
      const found = listRes.body.find((v) => v.id === 'ab-001');
      expect(found).toBeUndefined();
    });
  });
});
