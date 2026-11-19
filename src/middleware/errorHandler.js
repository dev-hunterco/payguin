export function errorHandler(logger) {
  return (err, req, res, _next) => {
    logger.error({ err, path: req.path }, 'Unhandled error');
    res.status(err.status || 500).json({
      errors: [{
        code: err.code || 'server_error',
        description: err.message || 'Internal server error',
      }]
    });
  };
}
