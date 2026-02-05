import {
  adminProductsList,
  adminOrdersList,
  adminCreateProductForm,
  adminProductMessage,
  adminRefreshOrdersBtn,
} from './dom.js';
import { fetchJSON } from './api.js';
import { parseOptionalNumber, formatCurrency } from './utils.js';
import { getActiveUser } from './state.js';
import { setStatusMessage, setFormMessage, setButtonBusy, showToast } from './ui.js';

const createInputLabel = ({ label, type = 'text', name, value, ...attrs }) => {
  const labelEl = document.createElement('label');
  labelEl.textContent = label;

  const input = document.createElement('input');
  input.type = type;
  input.name = name;
  input.value = value ?? '';
  Object.entries(attrs).forEach(([key, val]) => {
    if (val === undefined || val === null) {
      return;
    }
    input.setAttribute(key, String(val));
  });

  labelEl.appendChild(input);
  return { labelEl, input };
};

const createTextareaLabel = ({ label, name, value, rows = 3 }) => {
  const labelEl = document.createElement('label');
  labelEl.textContent = label;

  const textarea = document.createElement('textarea');
  textarea.name = name;
  textarea.rows = rows;
  textarea.value = value ?? '';

  labelEl.appendChild(textarea);
  return { labelEl, textarea };
};

const createCheckLabel = ({ label, name, checked }) => {
  const labelEl = document.createElement('label');
  labelEl.className = 'admin-check';

  const span = document.createElement('span');
  span.textContent = label;

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.name = name;
  input.checked = Boolean(checked);

  labelEl.appendChild(span);
  labelEl.appendChild(input);
  return { labelEl, input };
};

const renderAdminProducts = (products = []) => {
  if (!adminProductsList) {
    return;
  }
  adminProductsList.innerHTML = '';

  if (!products.length) {
    setStatusMessage(adminProductsList, {
      state: 'empty',
      message: 'No products found.',
    });
    return;
  }

  products.forEach((product) => {
    const card = document.createElement('div');
    card.className = 'admin-product-card';

    const head = document.createElement('div');
    head.className = 'admin-product-head';

    const titleWrap = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = product.name || 'Untitled product';
    const meta = document.createElement('p');
    meta.className = 'admin-product-meta';
    meta.textContent = `ID: ${product._id}`;

    titleWrap.appendChild(title);
    titleWrap.appendChild(meta);

    const statusLabel = product.isAvailable ? 'Live' : 'Hidden';
    const statusClass = product.isAvailable ? 'is-on' : 'is-off';
    const badge = document.createElement('span');
    badge.className = `admin-badge ${statusClass}`;
    badge.textContent = statusLabel;

    head.appendChild(titleWrap);
    head.appendChild(badge);

    const grid = document.createElement('div');
    grid.className = 'admin-product-grid';

    const nameField = createInputLabel({
      label: 'Name',
      name: 'name',
      value: product.name || '',
    });
    const categoryField = createInputLabel({
      label: 'Category',
      name: 'category',
      value: product.category || '',
    });
    const priceField = createInputLabel({
      label: 'Price',
      name: 'price',
      type: 'number',
      value: product.price ?? '',
      min: '0',
      step: '0.01',
    });
    const basePriceField = createInputLabel({
      label: 'Base price',
      name: 'basePrice',
      type: 'number',
      value: product.basePrice ?? '',
      min: '0',
      step: '0.01',
    });
    const imageField = createInputLabel({
      label: 'Image URL',
      name: 'imageUrl',
      type: 'url',
      value: product.imageUrl || '',
    });
    const availabilityField = createCheckLabel({
      label: 'Available',
      name: 'isAvailable',
      checked: product.isAvailable,
    });

    grid.appendChild(nameField.labelEl);
    grid.appendChild(categoryField.labelEl);
    grid.appendChild(priceField.labelEl);
    grid.appendChild(basePriceField.labelEl);
    grid.appendChild(imageField.labelEl);
    grid.appendChild(availabilityField.labelEl);

    const descriptionField = createTextareaLabel({
      label: 'Description',
      name: 'description',
      value: product.description || '',
      rows: 3,
    });

    const actions = document.createElement('div');
    actions.className = 'admin-product-actions';

    const updateBtn = document.createElement('button');
    updateBtn.type = 'button';
    updateBtn.className = 'primary';
    updateBtn.textContent = 'Update';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'ghost';
    deleteBtn.textContent = 'Delete';

    actions.appendChild(updateBtn);
    actions.appendChild(deleteBtn);

    const message = document.createElement('p');
    message.className = 'form-message admin-inline-message';

    updateBtn.addEventListener('click', async () => {
      setFormMessage(message, { message: '' });

      const name = nameField.input.value.trim();
      const category = categoryField.input.value.trim();
      const priceInput = priceField.input.value;
      const basePriceInput = basePriceField.input.value;
      const imageUrl = imageField.input.value.trim();
      const description = descriptionField.textarea.value.trim();
      const isAvailable = availabilityField.input.checked;

      if (!name || !category) {
        setFormMessage(message, {
          message: 'Name and category are required.',
          state: 'error',
        });
        return;
      }

      const payload = {
        name,
        category,
        description,
        imageUrl,
        isAvailable,
      };
      const price = parseOptionalNumber(priceInput);
      const basePrice = parseOptionalNumber(basePriceInput);
      if (price !== undefined) {
        payload.price = price;
      }
      if (basePrice !== undefined) {
        payload.basePrice = basePrice;
      }

      setButtonBusy(updateBtn, true, 'Updating...');
      try {
        await fetchJSON(`/products/${product._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setFormMessage(message, { message: 'Updated.', state: 'success' });
        showToast({
          type: 'info',
          title: 'Product updated',
          message: `${name} has been updated.`,
        });
        await loadAdminProducts();
      } catch (error) {
        setFormMessage(message, {
          message: error.message || 'Unable to update product.',
          state: 'error',
        });
        showToast({
          type: 'error',
          title: 'Update failed',
          message: error.message || 'Please try again.',
        });
      } finally {
        setButtonBusy(updateBtn, false);
      }
    });

    deleteBtn.addEventListener('click', async () => {
      if (!confirm(`Delete "${product.name}"?`)) {
        return;
      }
      setButtonBusy(deleteBtn, true, 'Deleting...');
      try {
        await fetchJSON(`/products/${product._id}`, { method: 'DELETE' });
        showToast({
          type: 'info',
          title: 'Product deleted',
          message: `${product.name} was removed.`,
        });
        await loadAdminProducts();
      } catch (error) {
        setFormMessage(message, {
          message: error.message || 'Unable to delete product.',
          state: 'error',
        });
        showToast({
          type: 'error',
          title: 'Delete failed',
          message: error.message || 'Please try again.',
        });
      } finally {
        setButtonBusy(deleteBtn, false);
      }
    });

    card.appendChild(head);
    card.appendChild(grid);
    card.appendChild(descriptionField.labelEl);
    card.appendChild(actions);
    card.appendChild(message);

    adminProductsList.appendChild(card);
  });
};

export const loadAdminProducts = async () => {
  if (!adminProductsList) {
    return;
  }
  setStatusMessage(adminProductsList, {
    state: 'loading',
    message: 'Loading products...',
  });
  try {
    const data = await fetchJSON('/products');
    renderAdminProducts(data.products || []);
  } catch (error) {
    setStatusMessage(adminProductsList, {
      state: 'error',
      message: error.message || 'Unable to load products.',
    });
  }
};

const renderAdminOrders = (orders = []) => {
  if (!adminOrdersList) {
    return;
  }
  adminOrdersList.innerHTML = '';

  if (!orders.length) {
    setStatusMessage(adminOrdersList, {
      state: 'empty',
      message: 'No orders found.',
    });
    return;
  }

  const statuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
  const activeUser = getActiveUser();

  orders.forEach((order) => {
    const card = document.createElement('div');
    card.className = 'admin-order-card';

    const meta = document.createElement('div');
    meta.className = 'admin-order-meta';

    const status = document.createElement('span');
    status.textContent = `Status: ${order.status}`;

    const total = document.createElement('span');
    total.textContent = `Total: ${formatCurrency(order.total)}`;

    const userLabel =
      order.user && typeof order.user === 'object'
        ? order.user.username || order.user._id
        : order.user;
    const user = document.createElement('span');
    user.textContent = `User: ${userLabel || 'Unknown'}`;

    meta.appendChild(status);
    meta.appendChild(total);
    meta.appendChild(user);

    const items = document.createElement('div');
    const itemsText = (order.items || [])
      .map((item) => `${item.quantity}x ${item.name} (${item.size})`)
      .join(', ');
    items.textContent = itemsText || 'No items listed.';

    const pickup = document.createElement('div');
    pickup.className = 'admin-order-meta';
    const pickupText = order.pickupTime
      ? new Date(order.pickupTime).toLocaleString()
      : 'ASAP';
    pickup.textContent = `Pickup: ${pickupText}`;

    const actions = document.createElement('div');
    actions.className = 'admin-order-actions';

    const statusSelect = document.createElement('select');
    statusSelect.className = 'admin-status-select';
    statuses.forEach((statusValue) => {
      const option = document.createElement('option');
      option.value = statusValue;
      option.textContent = statusValue.replace('_', ' ');
      if (statusValue === order.status) {
        option.selected = true;
      }
      statusSelect.appendChild(option);
    });

    const statusBtn = document.createElement('button');
    statusBtn.type = 'button';
    statusBtn.className = 'primary';
    statusBtn.textContent = 'Update status';

    actions.appendChild(statusSelect);
    actions.appendChild(statusBtn);

    let deleteBtn = null;
    if (activeUser && activeUser.role === 'admin') {
      deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'ghost';
      deleteBtn.textContent = 'Delete';
      actions.appendChild(deleteBtn);
    }

    const message = document.createElement('p');
    message.className = 'form-message admin-inline-message';

    statusBtn.addEventListener('click', async () => {
      setFormMessage(message, { message: '' });
      setButtonBusy(statusBtn, true, 'Updating...');
      try {
        await fetchJSON(`/orders/${order._id}`, {
          method: 'PUT',
          body: JSON.stringify({ status: statusSelect.value }),
        });
        setFormMessage(message, { message: 'Status updated.', state: 'success' });
        showToast({
          type: 'info',
          title: 'Order updated',
          message: `Order marked ${statusSelect.value}.`,
        });
        await loadAdminOrders();
      } catch (error) {
        setFormMessage(message, {
          message: error.message || 'Unable to update status.',
          state: 'error',
        });
        showToast({
          type: 'error',
          title: 'Update failed',
          message: error.message || 'Please try again.',
        });
      } finally {
        setButtonBusy(statusBtn, false);
      }
    });

    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!confirm('Delete this order?')) {
          return;
        }
        setButtonBusy(deleteBtn, true, 'Deleting...');
        try {
          await fetchJSON(`/orders/${order._id}`, { method: 'DELETE' });
          showToast({
            type: 'info',
            title: 'Order deleted',
            message: 'The order has been removed.',
          });
          await loadAdminOrders();
        } catch (error) {
          setFormMessage(message, {
            message: error.message || 'Unable to delete order.',
            state: 'error',
          });
          showToast({
            type: 'error',
            title: 'Delete failed',
            message: error.message || 'Please try again.',
          });
        } finally {
          setButtonBusy(deleteBtn, false);
        }
      });
    }

    card.appendChild(meta);
    card.appendChild(items);
    card.appendChild(pickup);
    card.appendChild(actions);
    card.appendChild(message);

    adminOrdersList.appendChild(card);
  });
};

export const loadAdminOrders = async () => {
  if (!adminOrdersList) {
    return;
  }
  setStatusMessage(adminOrdersList, {
    state: 'loading',
    message: 'Loading orders...',
  });
  try {
    const data = await fetchJSON('/orders/all');
    renderAdminOrders(data.orders || []);
  } catch (error) {
    setStatusMessage(adminOrdersList, {
      state: 'error',
      message: error.message || 'Unable to load orders.',
    });
  }
};

export const bindAdminEvents = () => {
  if (adminCreateProductForm) {
    adminCreateProductForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      setFormMessage(adminProductMessage, { message: '' });

      const formData = new FormData(adminCreateProductForm);
      const name = formData.get('name')?.toString().trim();
      const category = formData.get('category')?.toString().trim();
      if (!name || !category) {
        setFormMessage(adminProductMessage, {
          message: 'Name and category are required.',
          state: 'error',
        });
        return;
      }

      const payload = {
        name,
        category,
        description: formData.get('description')?.toString().trim() || '',
        imageUrl: formData.get('imageUrl')?.toString().trim() || '',
        isAvailable: formData.get('isAvailable') === 'on',
      };

      const price = parseOptionalNumber(formData.get('price'));
      const basePrice = parseOptionalNumber(formData.get('basePrice'));
      if (price !== undefined) {
        payload.price = price;
      }
      if (basePrice !== undefined) {
        payload.basePrice = basePrice;
      }

      const sizesRaw = formData.get('sizes')?.toString().trim();
      if (sizesRaw) {
        try {
          const parsed = JSON.parse(sizesRaw);
          if (!Array.isArray(parsed)) {
            throw new Error('Sizes must be a JSON array.');
          }
          payload.sizes = parsed;
        } catch (error) {
          setFormMessage(adminProductMessage, {
            message: 'Sizes must be a valid JSON array.',
            state: 'error',
          });
          return;
        }
      }

      const hasPrice = payload.price !== undefined || payload.basePrice !== undefined;
      if (!hasPrice && (!payload.sizes || payload.sizes.length === 0)) {
        setFormMessage(adminProductMessage, {
          message: 'Provide price/base price or sizes.',
          state: 'error',
        });
        return;
      }

      const submitButton = adminCreateProductForm.querySelector('button[type="submit"]');
      setButtonBusy(submitButton, true, 'Creating...');

      try {
        await fetchJSON('/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setFormMessage(adminProductMessage, {
          message: 'Product created.',
          state: 'success',
        });
        showToast({
          type: 'info',
          title: 'Product created',
          message: `${payload.name} is now available.`,
        });
        adminCreateProductForm.reset();
        await loadAdminProducts();
      } catch (error) {
        setFormMessage(adminProductMessage, {
          message: error.message || 'Unable to create product.',
          state: 'error',
        });
        showToast({
          type: 'error',
          title: 'Create failed',
          message: error.message || 'Please try again.',
        });
      } finally {
        setButtonBusy(submitButton, false);
      }
    });
  }

  if (adminRefreshOrdersBtn) {
    adminRefreshOrdersBtn.addEventListener('click', loadAdminOrders);
  }
};
