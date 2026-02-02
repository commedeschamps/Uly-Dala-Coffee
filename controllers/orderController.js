const { Order } = require('../models/Order');
const { Product } = require('../models/Product');
const { sendOrderStatusEmail } = require('../services/emailService');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const statusRoles = ['admin', 'barista'];

const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
};

const resolveItems = async (items) => {
  const productIds = items.map((item) => item.product).filter(Boolean);
  const products = productIds.length ? await Product.find({ _id: { $in: productIds } }) : [];
  const productMap = new Map(products.map((product) => [product.id, product]));

  return items.map((item) => {
    if (item.product) {
      const product = productMap.get(item.product.toString());
      if (!product) {
        throw new AppError('Product not found for one of the items', 400);
      }
      if (!product.isAvailable) {
        throw new AppError(`${product.name} is not available`, 400);
      }

      let unitPrice = product.basePrice ?? product.price;
      if (item.size && product.sizes && product.sizes.length) {
        const matched = product.sizes.find((size) => size.label === item.size);
        if (!matched) {
          throw new AppError(`Size ${item.size} not available for ${product.name}`, 400);
        }
        unitPrice = matched.price;
      }

      if (unitPrice === undefined) {
        throw new AppError(`Price missing for ${product.name}`, 400);
      }

      return {
        product: product.id,
        name: product.name,
        size: item.size || 'medium',
        unitPrice,
        quantity: item.quantity,
      };
    }

    return {
      name: item.name,
      size: item.size || 'medium',
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    };
  });
};

const createOrder = asyncHandler(async (req, res) => {
  const { items, notes, pickupTime, priority } = req.body;

  const isAdmin = req.user.role === 'admin';
  const isPremium = req.user.role === 'premium';

  if (priority && !(isAdmin || isPremium)) {
    throw new AppError('Only premium users or staff can set priority orders', 403);
  }

  const resolvedItems = await resolveItems(items);
  const total = calculateTotal(resolvedItems);

  const order = await Order.create({
    user: req.user.id,
    items: resolvedItems,
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
  const canManageStatus = statusRoles.includes(req.user.role);
  const isBarista = req.user.role === 'barista';
  const query = {};

  if (!(isBarista || (canManageStatus && req.query.all === 'true'))) {
    query.user = req.user.id;
  }

  if (req.query.status) {
    query.status = req.query.status;
  }

  const shouldPopulateUser = canManageStatus && (isBarista || req.query.all === 'true');
  const ordersQuery = Order.find(query).sort({ createdAt: -1 });
  if (shouldPopulateUser) {
    ordersQuery.populate('user', 'username');
  }
  const orders = await ordersQuery;

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

  const canManageStatus = statusRoles.includes(req.user.role);
  if (!canManageStatus && order.user.toString() !== req.user.id) {
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

  const previousStatus = order.status;
  const isAdmin = req.user.role === 'admin';
  const isBarista = req.user.role === 'barista';
  const isPremium = req.user.role === 'premium';

  if (!isAdmin && !isBarista && order.user.toString() !== req.user.id) {
    throw new AppError('Forbidden: insufficient permissions', 403);
  }

  if (isBarista) {
    const allowedKeys = ['status'];
    const sentKeys = Object.keys(req.body || {});
    const hasForbidden = sentKeys.some((key) => !allowedKeys.includes(key));
    if (hasForbidden) {
      throw new AppError('Barista can only update order status', 403);
    }
    if (!req.body.status) {
      throw new AppError('Status is required', 400);
    }
  }

  if (req.body.items) {
    const resolvedItems = await resolveItems(req.body.items);
    order.items = resolvedItems;
    order.total = calculateTotal(resolvedItems);
  }

  if (req.body.notes !== undefined) {
    order.notes = req.body.notes;
  }

  if (req.body.pickupTime !== undefined) {
    order.pickupTime = req.body.pickupTime;
  }

  if (req.body.priority !== undefined) {
    if (!(isAdmin || isPremium)) {
      throw new AppError('Only premium users or staff can set priority orders', 403);
    }
    order.priority = req.body.priority;
  }

  if (req.body.status) {
    if (isBarista) {
      order.status = req.body.status;
    } else if (!isAdmin) {
      if (req.body.status !== 'cancelled') {
        throw new AppError('Only admin can update order status', 403);
      }
      if (order.status !== 'pending') {
        throw new AppError('Only pending orders can be cancelled', 400);
      }
      order.status = req.body.status;
    } else {
      order.status = req.body.status;
    }
  }

  await order.save();

  if (req.body.status && order.status !== previousStatus) {
    try {
      await order.populate('user', 'email username');
      const recipient = order.user?.email;
      if (recipient) {
        await sendOrderStatusEmail({
          to: recipient,
          name: order.user?.username,
          order,
        });
      }
    } catch (error) {
      console.error('[email] Failed to send order status email:', error.message);
    }
  }

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

  const isAdmin = req.user.role === 'admin';
  const isOwner = order.user.toString() === req.user.id;
  if (!isAdmin) {
    if (!isOwner || order.status !== 'pending') {
      throw new AppError('Only admin or order owner can delete a pending order', 403);
    }
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
