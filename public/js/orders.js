import { apiBase } from './config.js';
import {
  ordersList,
  orderForm,
  orderMessage,
  refreshOrdersBtn,
  loadOrdersBtn,
} from './dom.js';
import { fetchJSON } from './api.js';
import { getToken } from './token.js';
import { getActiveUser } from './state.js';
import { formatCurrency } from './utils.js';
import { redirectTo } from './navigation.js';
import { onOrders, onAccount, onCheckout, onBarista } from './page.js';
import { getCart, clearCart } from './cart.js';
import { showToast } from './ui.js';

const renderOrders = (orders = []) => {
  if (!ordersList) {
    return;
  }
  ordersList.innerHTML = '';

  if (!orders.length) {
    ordersList.innerHTML = '<p>No orders yet. Create one to get started.</p>';
    return;
  }

  const token = getToken();
  const activeUser = getActiveUser();
  const isStaff = activeUser && ['admin', 'barista'].includes(activeUser.role);
  const canDelete = activeUser && activeUser.role === 'admin';

  orders.forEach((order) => {
    const card = document.createElement('div');
    card.className = 'order-card';

    const items = order.items
      .map((item) => `${item.quantity}x ${item.name} (${item.size})`)
      .join(', ');

    card.innerHTML = `
      <div class="order-meta">
        <span class="badge">Status: ${order.status}</span>
        <span>Total: ${formatCurrency(order.total)}</span>
        <span>Priority: ${order.priority ? 'Yes' : 'No'}</span>
      </div>
      <div>${items}</div>
      <div class="order-meta">Pickup: ${order.pickupTime ? new Date(order.pickupTime).toLocaleString() : 'ASAP'}</div>
      <div class="order-actions"></div>
    `;

    const actions = card.querySelector('.order-actions');

    if (!isStaff && order.status === 'pending') {
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'ghost';
      cancelBtn.textContent = 'Cancel order';
      cancelBtn.addEventListener('click', () => updateOrder(order._id, { status: 'cancelled' }));
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
      statusBtn.addEventListener('click', () => updateOrder(order._id, { status: statusSelect.value }));

      actions.appendChild(statusSelect);
      actions.appendChild(statusBtn);

      if (canDelete) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'ghost';
        deleteBtn.textContent = 'Delete order';
        deleteBtn.addEventListener('click', () => deleteOrder(order._id));
        actions.appendChild(deleteBtn);
      }
    }

    ordersList.appendChild(card);
  });

  if (!token) {
    ordersList.innerHTML = '<p>Please log in to view orders.</p>';
  }
};

export const loadOrders = async () => {
  if (!getToken()) {
    if (ordersList) {
      ordersList.innerHTML = '<p>Please log in to view orders.</p>';
    }
    if (onOrders || onAccount || onCheckout || onBarista) {
      redirectTo('/auth.html');
    }
    return;
  }

  try {
    const data = await fetchJSON(`${apiBase}/orders`);
    renderOrders(data.orders);
  } catch (error) {
    if (ordersList) {
      ordersList.innerHTML = `<p>${error.message}</p>`;
    }
  }
};

const updateOrder = async (id, payload) => {
  try {
    await fetchJSON(`${apiBase}/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    await loadOrders();
  } catch (error) {
    alert(error.message);
  }
};

const deleteOrder = async (id) => {
  try {
    await fetchJSON(`${apiBase}/orders/${id}`, {
      method: 'DELETE',
    });
    await loadOrders();
  } catch (error) {
    alert(error.message);
  }
};

const handleOrderFormSubmit = async (event) => {
  event.preventDefault();
  if (orderMessage) {
    orderMessage.textContent = '';
  }

  if (!getToken()) {
    if (orderMessage) {
      orderMessage.textContent = 'Please log in to place an order.';
    }
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

  try {
    const cart = getCart();
    if (!cart.length) {
      throw new Error('Add items to the cart before placing an order.');
    }

    const items = cart.map((item) => ({
      product: item.product,
      size: item.size,
      quantity: item.quantity,
    }));

    const formData = new FormData(orderForm);
    const pickupValue = formData.get('pickupTime');
    const payload = {
      items,
      notes: formData.get('notes'),
      pickupTime: pickupValue ? new Date(pickupValue).toISOString() : undefined,
      priority: formData.get('priority') === 'on',
    };

    await fetchJSON(`${apiBase}/orders`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (orderMessage) {
      orderMessage.textContent = 'Order placed!';
    }
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
    if (orderMessage) {
      orderMessage.textContent = error.message;
    }
    showToast({
      type: 'error',
      title: 'Error',
      message: error.message || 'Something went wrong.',
    });
  }
};

export const bindOrderEvents = () => {
  if (orderForm) {
    orderForm.addEventListener('submit', handleOrderFormSubmit);
  }

  if (refreshOrdersBtn) {
    refreshOrdersBtn.addEventListener('click', () => {
      if (!onOrders) {
        redirectTo('/dashboard.html');
        return;
      }
      loadOrders();
    });
  }

  if (loadOrdersBtn) {
    loadOrdersBtn.addEventListener('click', loadOrders);
  }
};
