import { describe, it, expect } from 'vitest';
import { validateConfig } from '../config/index.js';

describe('Configuration & Secret Validation', () => {
  it('passes in development mode with defaults', () => {
    const config = validateConfig({
      NODE_ENV: 'development',
    });

    expect(config.nodeEnv).toBe('development');
    expect(config.jwtSecret).toBeDefined();
    expect(config.corsOrigins).toContain('http://localhost:5173');
    expect(config.corsOrigins).toContain('http://127.0.0.1:5173');
    expect(config.adminPassword).toBe('AdminSecurePass123!');
  });

  it('passes in test mode with defaults', () => {
    const config = validateConfig({
      NODE_ENV: 'test',
    });

    expect(config.nodeEnv).toBe('test');
    expect(config.jwtSecret).toBeDefined();
  });

  it('fails in production mode when JWT_SECRET is missing', () => {
    expect(() => {
      validateConfig({
        NODE_ENV: 'production',
        CORS_ORIGIN: 'https://autobest.example.com',
      });
    }).toThrow(/JWT_SECRET.*required/i);
  });

  it('fails in production mode when JWT_SECRET is too short (< 32 chars)', () => {
    expect(() => {
      validateConfig({
        NODE_ENV: 'production',
        JWT_SECRET: 'too-short-secret',
        CORS_ORIGIN: 'https://autobest.example.com',
      });
    }).toThrow(/at least 32 characters/i);
  });

  it('fails in production mode when CORS_ORIGIN is missing or empty', () => {
    expect(() => {
      validateConfig({
        NODE_ENV: 'production',
        JWT_SECRET: 'a-very-secure-production-jwt-secret-key-32-chars-long',
        CORS_ORIGIN: '',
      });
    }).toThrow(/CORS_ORIGIN.*required/i);
  });

  it('rejects published default administrator password in production mode', () => {
    expect(() => {
      validateConfig({
        NODE_ENV: 'production',
        JWT_SECRET: 'a-very-secure-production-jwt-secret-key-32-chars-long',
        CORS_ORIGIN: 'https://autobest.example.com',
        ADMIN_PASSWORD: 'AdminSecurePass123!',
      });
    }).toThrow(/published default administrator password/i);
  });

  it('rejects weak administrator password (< 12 chars) in production mode', () => {
    expect(() => {
      validateConfig({
        NODE_ENV: 'production',
        JWT_SECRET: 'a-very-secure-production-jwt-secret-key-32-chars-long',
        CORS_ORIGIN: 'https://autobest.example.com',
        ADMIN_PASSWORD: 'shortpass',
      });
    }).toThrow(/at least 12 characters/i);
  });

  it('allows production mode when strong secrets and explicit CORS origins are provided', () => {
    const config = validateConfig({
      NODE_ENV: 'production',
      JWT_SECRET: 'a-very-secure-production-jwt-secret-key-32-chars-long',
      CORS_ORIGIN: 'https://autobest.example.com, https://admin.autobest.example.com',
      ADMIN_EMAIL: 'ops@autobest.example.com',
      ADMIN_PASSWORD: 'SuperStrongProductionAdminPass2026!',
    });

    expect(config.nodeEnv).toBe('production');
    expect(config.jwtSecret).toBe('a-very-secure-production-jwt-secret-key-32-chars-long');
    expect(config.corsOrigins).toEqual([
      'https://autobest.example.com',
      'https://admin.autobest.example.com',
    ]);
    expect(config.adminEmail).toBe('ops@autobest.example.com');
    expect(config.adminPassword).toBe('SuperStrongProductionAdminPass2026!');
  });

  it('allows production mode without admin credentials (skips admin seeding safely)', () => {
    const config = validateConfig({
      NODE_ENV: 'production',
      JWT_SECRET: 'a-very-secure-production-jwt-secret-key-32-chars-long',
      CORS_ORIGIN: 'https://autobest.example.com',
    });

    expect(config.nodeEnv).toBe('production');
    expect(config.adminPassword).toBeNull();
  });
});
