const { Order } = require('../models/Order');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const staffRoles = ['admin', 'moderator'];

const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

const createOrder = asyncHandler(async (req, res) => {
  const { items, notes, pickupTime, priority } = req.body;

  const isStaff = staffRoles.includes(req.user.role);
  const isPremium = req.user.role === 'premium';

  if (priority && !(isStaff || isPremium)) {
    throw new AppError('Only premium users or staff can set priority orders', 403);
  }

  const total = calculateTotal(items);

  const order = await Order.create({
    user: req.user.id,
    items,
    notes,
    pickupTime,
    priority: Boolean(priority),
    total,
  });

  res.status(201).json({
    status: 'success',
    order,
  });
});

const getOrders = asyncHandler(async (req, res) => {
  const isStaff = staffRoles.includes(req.user.role);
  const query = {};

  if (!(isStaff && req.query.all === 'true')) {
    query.user = req.user.id;
  }

  if (req.query.status) {
    query.status = req.query.status;
  }

  const orders = await Order.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: orders.length,
    orders,
  });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const isStaff = staffRoles.includes(req.user.role);
  if (!isStaff && order.user.toString() !== req.user.id) {
    throw new AppError('Forbidden: insufficient permissions', 403);
  }

  res.status(200).json({
    status: 'success',
    order,
  });
});

const updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const isStaff = staffRoles.includes(req.user.role);
  const isPremium = req.user.role === 'premium';

  if (!isStaff && order.user.toString() !== req.user.id) {
    throw new AppError('Forbidden: insufficient permissions', 403);
  }

  if (req.body.items) {
    order.items = req.body.items;
    order.total = calculateTotal(req.body.items);
  }

  if (req.body.notes !== undefined) {
    order.notes = req.body.notes;
  }

  if (req.body.pickupTime !== undefined) {
    order.pickupTime = req.body.pickupTime;
  }

  if (req.body.priority !== undefined) {
    if (!(isStaff || isPremium)) {
      throw new AppError('Only premium users or staff can set priority orders', 403);
    }
    order.priority = req.body.priority;
  }

  if (req.body.status) {
    if (!isStaff && req.body.status !== 'cancelled') {
      throw new AppError('Only staff can update order status beyond cancellation', 403);
    }
    order.status = req.body.status;
  }

  await order.save();

  res.status(200).json({
    status: 'success',
    order,
  });
});

const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const isStaff = staffRoles.includes(req.user.role);
  if (!isStaff) {
    throw new AppError('Only admin or moderator can delete orders', 403);
  }

  await order.deleteOne();

  res.status(200).json({
    status: 'success',
    message: 'Order deleted',
  });
});

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
};
