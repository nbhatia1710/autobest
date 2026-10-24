import jwt from 'jsonwebtoken';

export function createAuthMiddleware(jwtSecret = process.env.JWT_SECRET || 'autobest-secret-key-development') {
  function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Please sign in.',
        },
      });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };
      next();
    } catch (err) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Session expired or invalid token. Please sign in.',
        },
      });
    }
  }

  function requireAdmin(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Please sign in.',
        },
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Administrator access required.',
        },
      });
    }

    next();
  }

  return { requireAuth, requireAdmin };
}
