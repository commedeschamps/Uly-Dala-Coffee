const AppError = require('../utils/appError');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'CastError') {
    message = 'Invalid resource ID';
    statusCode = 400;
  }

  if (err.code === 11000) {
    message = 'Duplicate field value';
    statusCode = 400;
  }

  if (process.env.NODE_ENV !== 'production') {
    return res.status(statusCode).json({
      status: 'error',
      message,
      stack: err.stack,
    });
  }

  if (err instanceof AppError || statusCode < 500) {
    return res.status(statusCode).json({
      status: 'error',
      message,
    });
  }

  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};

module.exports = errorHandler;
