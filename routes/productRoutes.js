const express = require('express');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const validate = require('../middleware/validate');
const { createProductSchema, updateProductSchema } = require('../validators/productValidators');

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);

router.post('/', protect, authorizeRoles('admin'), validate(createProductSchema), createProduct);
router.put('/:id', protect, authorizeRoles('admin'), validate(updateProductSchema), updateProduct);
router.delete('/:id', protect, authorizeRoles('admin'), deleteProduct);

module.exports = router;
