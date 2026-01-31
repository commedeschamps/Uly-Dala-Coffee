const Joi = require('joi');

const itemSchema = Joi.object({
  product: Joi.string().hex().length(24),
  name: Joi.string().min(2).max(60),
  size: Joi.string().valid('small', 'medium', 'large').default('medium'),
  unitPrice: Joi.number().min(0),
  quantity: Joi.number().integer().min(1).default(1),
}).custom((value, helpers) => {
  if (value.product) {
    return value;
  }
  if (!value.name || value.unitPrice === undefined) {
    return helpers.message('Each item needs product or name + unitPrice.');
  }
  return value;
});

const createOrderSchema = Joi.object({
  items: Joi.array().items(itemSchema).min(1).required(),
  notes: Joi.string().max(300).allow(''),
  pickupTime: Joi.date().iso(),
  priority: Joi.boolean(),
});

const updateOrderSchema = Joi.object({
  items: Joi.array().items(itemSchema).min(1),
  status: Joi.string().valid('pending', 'preparing', 'ready', 'delivered', 'cancelled'),
  notes: Joi.string().max(300).allow(''),
  pickupTime: Joi.date().iso(),
  priority: Joi.boolean(),
}).min(1);

module.exports = {
  createOrderSchema,
  updateOrderSchema,
};
