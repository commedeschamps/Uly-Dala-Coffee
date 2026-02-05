import {
  ordersList,
  orderForm,
  orderMessage,
  loadOrdersBtn,
} from './dom.js';
import { fetchJSON } from './api.js';
import { getToken } from './token.js';
import { getActiveUser, setOrdersState } from './state.js';
import { formatCurrency } from './utils.js';
import { redirectTo } from './navigation.js';
import { onOrders, onAccount, onCheckout, onBarista } from './page.js';
import { getCart, clearCart } from './cart.js';
import { showToast, setStatusMessage, setFormMessage, setButtonBusy } from './ui.js';

const formatPickupTime = (pickupTime) => {
  if (!pickupTime) {
    return 'ASAP';
  }
  const date = new Date(pickupTime);
  if (Number.isNaN(date.getTime())) {
    return 'ASAP';
  }
  return date.toLocaleString();
};

const createMetaRow = (label, value) => {
  const span = document.createElement('span');
  span.textContent = `${label}: ${value}`;
  return span;
};

const renderOrders = (orders = []) => {
  if (!ordersList) {
    return;
  }

  ordersList.innerHTML = '';

  if (!orders.length) {
    setStatusMessage(ordersList, {
      state: 'empty',
      message: 'No orders yet. Create one to get started.',
    });
    return;
  }

  const activeUser = getActiveUser();
  const isStaff = activeUser && ['admin', 'barista'].includes(activeUser.role);
  const canDelete = activeUser && activeUser.role === 'admin';

  orders.forEach((order) => {
    const card = document.createElement('div');
    card.className = 'order-card';

    const meta = document.createElement('div');
    meta.className = 'order-meta';

    const statusBadge = document.createElement('span');
    statusBadge.className = 'badge';
    statusBadge.textContent = `Status: ${order.status}`;

    const total = document.createElement('span');
    total.textContent = `Total: ${formatCurrency(order.total)}`;

    const priority = document.createElement('span');
    priority.textContent = `Priority: ${order.priority ? 'Yes' : 'No'}`;

    meta.appendChild(statusBadge);
    meta.appendChild(total);
    meta.appendChild(priority);

    const items = document.createElement('div');
    const itemText = (order.items || [])
      .map((item) => `${item.quantity}x ${item.name} (${item.size})`)
      .join(', ');
    items.textContent = itemText || 'No items listed.';

    const pickup = document.createElement('div');
    pickup.className = 'order-meta';
    pickup.appendChild(createMetaRow('Pickup', formatPickupTime(order.pickupTime)));

    const actions = document.createElement('div');
    actions.className = 'order-actions';

    if (!isStaff && order.status === 'pending') {
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'ghost';
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Cancel order';
      cancelBtn.addEventListener('click', async () => {
        setButtonBusy(cancelBtn, true, 'Cancelling...');
        try {
          await updateOrder(order._id, { status: 'cancelled' });
          showToast({
            type: 'info',
            title: 'Order cancelled',
            message: 'Your order has been cancelled.',
          });
        } catch (error) {
          showToast({
            type: 'error',
            title: 'Unable to cancel',
            message: error.message || 'Please try again.',
          });
        } finally {
          setButtonBusy(cancelBtn, false);
        }
      });
      actions.appendChild(cancelBtn);
    }

    if (isStaff) {
      const statusSelect = document.createElement('select');
      ['pending', 'preparing', 'ready', 'delivered', 'cancelled'].forEach((status) => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status.replace('_', ' ');
        if (status === order.status) {
          option.selected = true;
        }
        statusSelect.appendChild(option);
      });

      const statusBtn = document.createElement('button');
      statusBtn.textContent = 'Update status';
      statusBtn.className = 'primary';
      statusBtn.type = 'button';
      statusBtn.addEventListener('click', async () => {
        setButtonBusy(statusBtn, true, 'Updating...');
        try {
          await updateOrder(order._id, { status: statusSelect.value });
          showToast({
            type: 'info',
            title: 'Status updated',
            message: `Order marked ${statusSelect.value}.`,
          });
        } catch (error) {
          showToast({
            type: 'error',
            title: 'Update failed',
            message: error.message || 'Please try again.',
          });
        } finally {
          setButtonBusy(statusBtn, false);
        }
      });

      actions.appendChild(statusSelect);
      actions.appendChild(statusBtn);

      if (canDelete) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'ghost';
        deleteBtn.type = 'button';
        deleteBtn.textContent = 'Delete order';
        deleteBtn.addEventListener('click', async () => {
          if (!confirm('Delete this order?')) {
            return;
          }
          setButtonBusy(deleteBtn, true, 'Deleting...');
          try {
            await deleteOrder(order._id);
            showToast({
              type: 'info',
              title: 'Order deleted',
              message: 'The order has been removed.',
            });
          } catch (error) {
            showToast({
              type: 'error',
              title: 'Delete failed',
              message: error.message || 'Please try again.',
            });
          } finally {
            setButtonBusy(deleteBtn, false);
          }
        });
        actions.appendChild(deleteBtn);
      }
    }

    card.appendChild(meta);
    card.appendChild(items);
    card.appendChild(pickup);
    card.appendChild(actions);

    ordersList.appendChild(card);
  });
};

export const loadOrders = async () => {
  if (!getToken()) {
    if (ordersList) {
      setStatusMessage(ordersList, {
        state: 'empty',
        message: 'Please log in to view orders.',
      });
    }
    if (onOrders || onAccount || onCheckout || onBarista) {
      redirectTo('/auth.html');
    }
    return;
  }

  if (ordersList) {
    setStatusMessage(ordersList, {
      state: 'loading',
      message: 'Loading orders...',
    });
  }

  try {
    const data = await fetchJSON('/orders');
    const orders = data.orders || [];
    setOrdersState(orders);
    renderOrders(orders);
  } catch (error) {
    if (ordersList) {
      setStatusMessage(ordersList, {
        state: 'error',
        message: error.message || 'Unable to load orders.',
      });
    }
    showToast({
      type: 'error',
      title: 'Orders unavailable',
      message: error.message || 'Please try again later.',
    });
  }
};

const updateOrder = async (id, payload) => {
  await fetchJSON(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  await loadOrders();
};

const deleteOrder = async (id) => {
  await fetchJSON(`/orders/${id}`, {
    method: 'DELETE',
  });
  await loadOrders();
};

const handleOrderFormSubmit = async (event) => {
  event.preventDefault();
  setFormMessage(orderMessage, { message: '' });

  if (!getToken()) {
    setFormMessage(orderMessage, {
      message: 'Please log in to place an order.',
      state: 'error',
    });
    showToast({
      type: 'error',
      title: 'Login required',
      message: 'Please sign in to place an order.',
    });
    if (onCheckout) {
      redirectTo('/auth.html');
    }
    return;
  }

  const cart = getCart();
  if (!cart.length) {
    setFormMessage(orderMessage, {
      message: 'Add items to the cart before placing an order.',
      state: 'error',
    });
    showToast({
      type: 'error',
      title: 'Cart empty',
      message: 'Add at least one item before checkout.',
    });
    return;
  }

  const items = cart.map((item) => ({
    product: item.product,
    size: item.size,
    quantity: item.quantity,
  }));

  const formData = new FormData(orderForm);
  const pickupValue = formData.get('pickupTime')?.toString();
  let pickupTime;
  if (pickupValue) {
    const parsed = new Date(pickupValue);
    if (Number.isNaN(parsed.getTime())) {
      setFormMessage(orderMessage, {
        message: 'Please enter a valid pickup time.',
        state: 'error',
      });
      return;
    }
    const now = new Date();
    if (parsed.getTime() < now.getTime() - 2 * 60 * 1000) {
      setFormMessage(orderMessage, {
        message: 'Pickup time must be in the future.',
        state: 'error',
      });
      return;
    }
    pickupTime = parsed.toISOString();
  }

  const activeUser = getActiveUser();
  const allowPriority = activeUser && ['premium', 'admin'].includes(activeUser.role);

  const payload = {
    items,
    notes: formData.get('notes')?.toString().trim(),
    pickupTime,
    priority: allowPriority && formData.get('priority') === 'on',
  };

  const submitButton = orderForm.querySelector('button[type="submit"]');
  setButtonBusy(submitButton, true, 'Placing...');

  try {
    await fetchJSON('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setFormMessage(orderMessage, {
      message: 'Order placed!',
      state: 'success',
    });
    showToast({
      type: 'info',
      title: 'Order received',
      message: 'We are preparing your order now.',
    });
    orderForm.reset();
    clearCart();
    if (onOrders) {
      await loadOrders();
    }
  } catch (error) {
    setFormMessage(orderMessage, {
      message: error.message || 'Unable to place order.',
      state: 'error',
    });
    showToast({
      type: 'error',
      title: 'Order failed',
      message: error.message || 'Something went wrong.',
    });
  } finally {
    setButtonBusy(submitButton, false);
  }
};

export const bindOrderEvents = () => {
  if (orderForm) {
    orderForm.addEventListener('submit', handleOrderFormSubmit);
  }

  if (loadOrdersBtn) {
    loadOrdersBtn.addEventListener('click', loadOrders);
  }
};
