const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    if (typeof next === 'function') {
      return next(error);
    }

    console.error(error);
    if (res && !res.headersSent) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Internal server error',
      });
    }
  });
};

module.exports = asyncHandler;
