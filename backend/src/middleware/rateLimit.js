export function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60000;
  const max = options.max || 10;
  const enabled = options.enabled !== undefined ? options.enabled : true;

  const hits = new Map();

  // Periodic cleanup of expired IP records
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of hits.entries()) {
      if (now - record.startTime > windowMs) {
        hits.delete(ip);
      }
    }
  }, Math.max(windowMs, 10000));

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return function rateLimiter(req, res, next) {
    if (!enabled) {
      return next();
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let record = hits.get(ip);
    if (!record || now - record.startTime > windowMs) {
      record = { count: 1, startTime: now };
      hits.set(ip, record);
    } else {
      record.count += 1;
    }

    if (record.count > max) {
      const resetTimeSeconds = Math.ceil((record.startTime + windowMs - now) / 1000);
      res.setHeader('Retry-After', resetTimeSeconds);
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          details: {
            retryAfter: resetTimeSeconds,
          },
        },
      });
    }

    next();
  };
}
