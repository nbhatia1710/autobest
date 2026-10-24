import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { getDatabase, closeDatabase, initializeSchema } from '../db/index.js';

describe('API Security & Hardening', () => {
  let app;
  let db;

  beforeEach(() => {
    db = getDatabase(':memory:');
    initializeSchema(db);
    app = createApp(db, {
      corsOrigins: ['https://trusted.autobest.com'],
      rateLimitWindowMs: 1000,
      rateLimitMax: 5,
    });
  });

  afterEach(() => {
    closeDatabase(db);
  });

  describe('Security Headers', () => {
    it('sets standard defensive security headers and disables X-Powered-By', async () => {
      const res = await request(app).get('/api/health');

      expect(res.headers['x-powered-by']).toBeUndefined();
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('CORS Enforcement', () => {
    it('allows requests from explicit configured origins', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'https://trusted.autobest.com');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('https://trusted.autobest.com');
    });

    it('rejects cross-origin requests from unlisted origins', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'https://malicious-attacker.com');

      // Rejected with CORS error (403 or error response)
      expect([400, 403]).toContain(res.status);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('CORS_ERROR');
    });

    it('permits requests without an Origin header (curl / non-browser / internal)', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
    });
  });

  describe('Malformed JSON & Body Size Limits', () => {
    it('handles malformed JSON gracefully with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": "test@example.com", bad json');

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('INVALID_JSON');
      expect(res.body.error.message).toMatch(/malformed json/i);
    });

    it('rejects oversized JSON payloads exceeding 50kb with 413 Payload Too Large', async () => {
      const hugeString = 'A'.repeat(60 * 1024); // 60KB
      const res = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send({ email: 'huge@example.com', password: hugeString });

      expect(res.status).toBe(413);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    });
  });

  describe('Authentication Rate Limiting', () => {
    it('throttles rapid registration attempts after exceeding the rate limit', async () => {
      const rateLimitedApp = createApp(db, {
        rateLimitWindowMs: 60000,
        rateLimitMax: 3,
        enableRateLimit: true,
      });

      // 3 allowed requests
      for (let i = 0; i < 3; i++) {
        const res = await request(rateLimitedApp)
          .post('/api/auth/register')
          .send({ email: `user${i}@example.com`, password: 'Password123!' });
        expect(res.status).toBe(201);
      }

      // 4th request must be rate limited
      const limitedRes = await request(rateLimitedApp)
        .post('/api/auth/register')
        .send({ email: 'user4@example.com', password: 'Password123!' });

      expect(limitedRes.status).toBe(429);
      expect(limitedRes.body.error).toBeDefined();
      expect(limitedRes.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(limitedRes.headers['retry-after']).toBeDefined();
    });
  });

  describe('Production Error Masking', () => {
    it('does not leak internal error details or stack traces on unexpected 500 errors', async () => {
      const errorApp = createApp(db, {
        nodeEnv: 'production',
        jwtSecret: 'a-valid-production-jwt-secret-min-32-chars-long!',
        corsOrigins: ['https://trusted.autobest.com'],
        adminPassword: 'SecureProductionAdminPass2026!',
        extraRoutes: (router) => {
          router.get('/api/test-faulty', () => {
            const secretError = new Error('Database password failed at /var/secret/db.sqlite:42');
            secretError.stack = 'SensitiveStackDumpAtInternalModule';
            throw secretError;
          });
        },
      });

      const res = await request(errorApp).get('/api/test-faulty');
      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(res.body.error.message).toBe('An internal server error occurred.');
      expect(res.body.error.stack).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('/var/secret');
    });
  });
});
