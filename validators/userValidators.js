const Joi = require('joi');

const updateProfileSchema = Joi.object({
  username: Joi.string().min(3).max(30),
  email: Joi.string().email(),
}).min(1);

module.exports = { updateProfileSchema };
