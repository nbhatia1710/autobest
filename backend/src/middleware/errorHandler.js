export function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const code = err.code || (status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
  const message = err.message || 'An unexpected error occurred.';
  const details = err.details || {};

  res.status(status).json({
    error: {
      code,
      message,
      details,
    },
  });
}
