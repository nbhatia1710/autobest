import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { getDatabase, closeDatabase, initializeSchema, seedDatabase } from '../db/index.js';

describe('AutoBest Motors Full End-to-End API Journey', () => {
  let app;
  let db;

  beforeEach(async () => {
    db = getDatabase(':memory:');
    initializeSchema(db);
    await seedDatabase(db);
    app = createApp(db);
  });

  afterEach(() => {
    closeDatabase(db);
  });

  it('completes the full customer journey: register, login, browse, search, and purchase', async () => {
    // 1. Customer registers
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'driver@journey.com', password: 'JourneyPass123!' });
    expect(regRes.status).toBe(201);
    expect(regRes.body.user.role).toBe('customer');

    // 2. Customer logs in
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'driver@journey.com', password: 'JourneyPass123!' });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.access_token;
    expect(token).toBeDefined();

    // 3. Customer lists vehicles
    const listRes = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBe(6);

    // 4. Customer searches vehicles
    const searchRes = await request(app)
      .get('/api/vehicles/search?make=Porsche')
      .set('Authorization', `Bearer ${token}`);
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.length).toBe(1);
    const porsche = searchRes.body[0];
    expect(porsche.id).toBe('ab-001');
    const initialQty = porsche.quantity;

    // 5. Customer purchases vehicle
    const purchaseRes = await request(app)
      .post('/api/vehicles/ab-001/purchase')
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 1 });
    expect(purchaseRes.status).toBe(200);
    expect(purchaseRes.body.quantity).toBe(initialQty - 1);

    // 6. Attempting to purchase a sold-out car returns 409
    const soldOutRes = await request(app)
      .post('/api/vehicles/ab-005/purchase')
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 1 });
    expect(soldOutRes.status).toBe(409);
    expect(soldOutRes.body.error.code).toBe('OUT_OF_STOCK');
  });

  it('completes the full admin journey: login, add, edit, restock, and delete', async () => {
    // 1. Admin logs in
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@autobest.com', password: 'AdminSecurePass123!' });
    expect(adminLogin.status).toBe(200);
    const adminToken = adminLogin.body.access_token;

    // 2. Admin adds a vehicle
    const addRes = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        make: 'Ferrari',
        model: 'Roma',
        year: 2024,
        category: 'Coupe',
        price: 243360,
        quantity: 1,
        image: '/media/ferrari.jpg',
        fuel: 'Petrol',
        transmission: 'Automatic',
      });
    expect(addRes.status).toBe(201);
    const createdId = addRes.body.id;

    // 3. Admin updates vehicle
    const updateRes = await request(app)
      .put(`/api/vehicles/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 250000 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.price).toBe(250000);

    // 4. Admin restocks sold-out vehicle (ab-005)
    const restockRes = await request(app)
      .post('/api/vehicles/ab-005/restock')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 3 });
    expect(restockRes.status).toBe(200);
    expect(restockRes.body.quantity).toBe(3);

    // 5. Admin deletes created vehicle
    const deleteRes = await request(app)
      .delete(`/api/vehicles/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 204]).toContain(deleteRes.status);
  });
});
