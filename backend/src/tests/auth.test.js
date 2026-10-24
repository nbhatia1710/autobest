import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { getDatabase, closeDatabase, initializeSchema } from '../db/index.js';

describe('Authentication API & Middleware (/api/auth)', () => {
  let app;
  let db;

  beforeEach(() => {
    db = getDatabase(':memory:');
    initializeSchema(db);
    app = createApp(db);
  });

  afterEach(() => {
    closeDatabase(db);
  });

  describe('POST /api/auth/register', () => {
    it('successfully registers a new customer with 201 Created', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'driver@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('driver@example.com');
      expect(res.body.user.role).toBe('customer');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('rejects registration when email is missing or invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toMatch(/valid email/i);
    });

    it('rejects registration when password is shorter than 6 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'driver@example.com',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toMatch(/password/i);
    });

    it('returns 409 Conflict when attempting to register an existing email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'Password123!',
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toMatch(/already exists/i);
    });

    it('ignores client-supplied admin role, always enforcing customer role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'sneaky@example.com',
          password: 'Password123!',
          role: 'admin',
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('customer');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'registered@example.com',
          password: 'Password123!',
        });
    });

    it('successfully logs in and returns access_token and user object', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'registered@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('registered@example.com');
      expect(res.body.user.role).toBe('customer');

      // Verify token payload contains valid future exp
      const tokenParts = res.body.access_token.split('.');
      expect(tokenParts.length).toBe(3);
      const claims = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      expect(claims.sub).toBeDefined();
      expect(claims.role).toBe('customer');
      expect(claims.exp * 1000).toBeGreaterThan(Date.now());
    });

    it('returns 401 when given an invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'registered@example.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toMatch(/invalid email or password/i);
    });

    it('returns 401 when given a non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toMatch(/invalid email or password/i);
    });

    it('returns 400 when missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'registered@example.com',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('Auth Middleware (requireAuth & requireAdmin)', () => {
    let customerToken;
    let adminToken;

    beforeEach(async () => {
      // Create test route using middleware
      const { requireAuth, requireAdmin } = app.locals.authMiddleware;
      app.get('/api/test/protected', requireAuth, (req, res) => {
        res.json({ message: 'authorized', user: req.user });
      });
      app.get('/api/test/admin-only', requireAuth, requireAdmin, (req, res) => {
        res.json({ message: 'admin authorized' });
      });

      // Register customer & get token
      const custRes = await request(app)
        .post('/api/auth/register')
        .send({ email: 'client@example.com', password: 'Password123!' });
      const custLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'client@example.com', password: 'Password123!' });
      customerToken = custLogin.body.access_token;

      // Seed admin into DB & login
      const dbInstance = app.locals.db;
      const adminPassHash = (await import('bcryptjs')).default.hashSync('AdminPass123!', 10);
      dbInstance.prepare('INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)').run(
        'adm-1',
        'superadmin@example.com',
        adminPassHash,
        'admin'
      );
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'superadmin@example.com', password: 'AdminPass123!' });
      adminToken = adminLogin.body.access_token;
    });

    it('rejects access without Authorization header with 401', async () => {
      const res = await request(app).get('/api/test/protected');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('allows access with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('client@example.com');
    });

    it('rejects customer from admin-only endpoint with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/test/admin-only')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('grants admin access to admin-only endpoint with 200', async () => {
      const res = await request(app)
        .get('/api/test/admin-only')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('admin authorized');
    });
  });
});
