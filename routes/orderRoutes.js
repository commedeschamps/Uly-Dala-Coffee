const express = require('express');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createOrderSchema, updateOrderSchema } = require('../validators/orderValidators');

const router = express.Router();

router.use(protect);

router.post('/', validate(createOrderSchema), createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.put('/:id', validate(updateOrderSchema), updateOrder);
router.delete('/:id', deleteOrder);

module.exports = router;
