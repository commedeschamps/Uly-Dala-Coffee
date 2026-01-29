const AppError = require('../utils/appError');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = error.details.map((detail) => detail.message).join(', ');
    return next(new AppError(message, 400));
  }
  return next();
};

module.exports = validate;
