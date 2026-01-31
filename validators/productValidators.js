const Joi = require('joi');

const sizeSchema = Joi.object({
  label: Joi.string().valid('small', 'medium', 'large').required(),
  price: Joi.number().min(0).required(),
});

const imageUrlSchema = Joi.alternatives()
  .try(Joi.string().uri(), Joi.string().pattern(/^\//))
  .allow('');

const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  price: Joi.number().min(0),
  basePrice: Joi.number().min(0),
  category: Joi.string().min(2).max(40).required(),
  description: Joi.string().max(300).allow(''),
  imageUrl: imageUrlSchema,
  isAvailable: Joi.boolean(),
  sizes: Joi.array().items(sizeSchema).min(1),
}).custom((value, helpers) => {
  if (!value.price && !value.basePrice && (!value.sizes || value.sizes.length === 0)) {
    return helpers.message('Provide price/basePrice or at least one size with price.');
  }
  return value;
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(80),
  price: Joi.number().min(0),
  basePrice: Joi.number().min(0),
  category: Joi.string().min(2).max(40),
  description: Joi.string().max(300).allow(''),
  imageUrl: imageUrlSchema,
  isAvailable: Joi.boolean(),
  sizes: Joi.array().items(sizeSchema).min(1),
}).min(1);

module.exports = {
  createProductSchema,
  updateProductSchema,
};
