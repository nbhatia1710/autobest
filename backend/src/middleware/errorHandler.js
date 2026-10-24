export function createErrorHandler(options = {}) {
  return function errorHandler(err, req, res, next) {
    const isProduction = options.isProduction !== undefined
      ? options.isProduction
      : (req.app?.locals?.config?.isProduction ?? process.env.NODE_ENV === 'production');

    // 1. JSON parsing syntax error
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({
        error: {
          code: 'INVALID_JSON',
          message: 'Malformed JSON in request body.',
          details: {},
        },
      });
    }

    // 2. Payload size limit exceeded
    if (err.type === 'entity.too.large' || err.status === 413) {
      return res.status(413).json({
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Request payload too large. Maximum allowed size is 50kb.',
          details: {},
        },
      });
    }

    // 3. CORS origin rejected
    if (err.message && err.message.startsWith('CORS_ERROR:')) {
      return res.status(403).json({
        error: {
          code: 'CORS_ERROR',
          message: 'Cross-Origin Request Blocked: Origin not permitted by CORS allowlist.',
          details: {},
        },
      });
    }

    const status = err.statusCode || err.status || 500;
    const isInternal = status >= 500;

    const code = err.code || (isInternal ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
    const message = isInternal && isProduction
      ? 'An internal server error occurred.'
      : (err.message || 'An unexpected error occurred.');

    const details = isInternal && isProduction ? {} : (err.details || {});

    res.status(status).json({
      error: {
        code,
        message,
        details,
      },
    });
  };
}

export const errorHandler = createErrorHandler();
