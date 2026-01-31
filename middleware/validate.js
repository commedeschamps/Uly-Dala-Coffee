const AppError = require('../utils/appError');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = error.details.map((detail) => detail.message).join(', ');
    const err = new AppError(message, 400);
    if (typeof next === 'function') {
      return next(err);
    }
    return res.status(400).json({ status: 'error', message });
  }
  if (typeof next === 'function') {
    return next();
  }
  return res.status(500).json({ status: 'error', message: 'Middleware next missing' });
};

module.exports = validate;
