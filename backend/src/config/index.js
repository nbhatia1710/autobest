export const DEFAULT_DEV_JWT_SECRET = 'autobest-development-secret-key-min-32-chars-long';
export const DEFAULT_DEV_ADMIN_EMAIL = 'admin@autobest.com';
export const DEFAULT_DEV_ADMIN_PASSWORD = 'AdminSecurePass123!';

export const DEFAULT_DEV_CORS_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

export function validateConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  // 1. Port
  const port = parseInt(env.PORT || '8000', 10);
  if (Number.isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT configuration: "${env.PORT}". Must be a valid port number.`);
  }

  // 2. JWT Secret
  let jwtSecret = env.JWT_SECRET;
  if (isProduction) {
    if (!jwtSecret || typeof jwtSecret !== 'string' || jwtSecret.trim() === '') {
      throw new Error(
        'Fatal configuration error: JWT_SECRET environment variable is required in production.'
      );
    }
    if (jwtSecret.length < 32) {
      throw new Error(
        'Fatal configuration error: JWT_SECRET must be at least 32 characters long for production security.'
      );
    }
  } else {
    jwtSecret = jwtSecret || DEFAULT_DEV_JWT_SECRET;
  }

  // 3. CORS Origins
  let corsOrigins = [];
  if (env.CORS_ORIGIN && env.CORS_ORIGIN.trim() !== '') {
    corsOrigins = env.CORS_ORIGIN.split(',')
      .map((o) => o.trim())
      .filter((o) => o.length > 0);
  }

  if (isProduction) {
    if (corsOrigins.length === 0) {
      throw new Error(
        'Fatal configuration error: CORS_ORIGIN environment variable is required in production (comma-separated origins).'
      );
    }
  } else {
    // In dev/test, merge configured origins with standard Vite local ports
    const combined = new Set([...corsOrigins, ...DEFAULT_DEV_CORS_ORIGINS]);
    corsOrigins = Array.from(combined);
  }

  // 4. Admin Credentials
  let adminEmail = env.ADMIN_EMAIL ? env.ADMIN_EMAIL.trim().toLowerCase() : null;
  let adminPassword = env.ADMIN_PASSWORD ? env.ADMIN_PASSWORD : null;

  if (isProduction) {
    if (adminPassword) {
      if (adminPassword === DEFAULT_DEV_ADMIN_PASSWORD) {
        throw new Error(
          'Fatal configuration error: Cannot use the published default administrator password in production.'
        );
      }
      if (adminPassword.length < 12) {
        throw new Error(
          'Fatal configuration error: ADMIN_PASSWORD must be at least 12 characters long in production.'
        );
      }
    } else {
      // In production without ADMIN_PASSWORD, do not create default admin
      adminEmail = null;
      adminPassword = null;
    }
  } else {
    adminEmail = adminEmail || DEFAULT_DEV_ADMIN_EMAIL;
    adminPassword = adminPassword || DEFAULT_DEV_ADMIN_PASSWORD;
  }

  // 5. Database Path
  const databasePath = env.DATABASE_PATH || 'data/autobest.sqlite';

  return {
    nodeEnv,
    isProduction,
    port,
    jwtSecret,
    jwtExpiresIn: env.JWT_EXPIRES_IN || '24h',
    corsOrigins,
    adminEmail,
    adminPassword,
    databasePath,
  };
}
