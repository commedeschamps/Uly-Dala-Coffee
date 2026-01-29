const Joi = require('joi');

const itemSchema = Joi.object({
  name: Joi.string().min(2).max(60).required(),
  size: Joi.string().valid('small', 'medium', 'large').default('medium'),
  price: Joi.number().min(0).required(),
  quantity: Joi.number().integer().min(1).default(1),
});

const createOrderSchema = Joi.object({
  items: Joi.array().items(itemSchema).min(1).required(),
  notes: Joi.string().max(300).allow(''),
  pickupTime: Joi.date().iso(),
  priority: Joi.boolean(),
});

const updateOrderSchema = Joi.object({
  items: Joi.array().items(itemSchema).min(1),
  status: Joi.string().valid('pending', 'paid', 'in_progress', 'ready', 'completed', 'cancelled'),
  notes: Joi.string().max(300).allow(''),
  pickupTime: Joi.date().iso(),
  priority: Joi.boolean(),
}).min(1);

module.exports = {
  createOrderSchema,
  updateOrderSchema,
};
