module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  const code = err.code || 'SERVER_001';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${code}]`, err.message);
  }

  res.status(status).json({
    error: code,
    message: err.message || 'Internal server error',
  });
};
