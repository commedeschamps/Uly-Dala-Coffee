const { Product } = require('../models/Product');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ status: 'success', product });
});

const getProducts = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.available === 'true') {
    filter.isAvailable = true;
  }
  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ status: 'success', results: products.length, products });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  res.status(200).json({ status: 'success', product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  Object.assign(product, req.body);
  await product.save();

  res.status(200).json({ status: 'success', product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  await product.deleteOne();
  res.status(200).json({ status: 'success', message: 'Product deleted' });
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
