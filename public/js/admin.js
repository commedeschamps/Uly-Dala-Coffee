import { apiBase } from './config.js';
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

const renderAdminProducts = (products = []) => {
  if (!adminProductsList) {
    return;
  }
  adminProductsList.innerHTML = '';

  if (!products.length) {
    adminProductsList.innerHTML = '<p>No products found.</p>';
    return;
  }

  products.forEach((product) => {
    const card = document.createElement('div');
    card.className = 'admin-product-card';
    const priceValue = product.price ?? '';
    const basePriceValue = product.basePrice ?? '';
    const imageUrlValue = product.imageUrl ?? '';
    const descriptionValue = product.description ?? '';
    const statusLabel = product.isAvailable ? 'Live' : 'Hidden';
    const statusClass = product.isAvailable ? 'is-on' : 'is-off';

    card.innerHTML = `
      <div class="admin-product-head">
        <div>
          <h3>${product.name}</h3>
          <p class="admin-product-meta">ID: ${product._id}</p>
        </div>
        <span class="admin-badge ${statusClass}">${statusLabel}</span>
      </div>
      <div class="admin-product-grid">
        <label>
          Name
          <input type="text" name="name" value="${product.name || ''}" />
        </label>
        <label>
          Category
          <input type="text" name="category" value="${product.category || ''}" />
        </label>
        <label>
          Price
          <input type="number" name="price" min="0" step="0.01" value="${priceValue}" />
        </label>
        <label>
          Base price
          <input type="number" name="basePrice" min="0" step="0.01" value="${basePriceValue}" />
        </label>
        <label>
          Image URL
          <input type="url" name="imageUrl" value="${imageUrlValue}" />
        </label>
        <label class="admin-check">
          <span>Available</span>
          <input type="checkbox" name="isAvailable" ${product.isAvailable ? 'checked' : ''} />
        </label>
      </div>
      <label>
        Description
        <textarea name="description" rows="3">${descriptionValue}</textarea>
      </label>
      <div class="admin-product-actions">
        <button type="button" class="primary" data-action="update">Update</button>
        <button type="button" class="ghost" data-action="delete">Delete</button>
      </div>
      <p class="form-message admin-inline-message"></p>
    `;

    const message = card.querySelector('.admin-inline-message');
    const updateBtn = card.querySelector('[data-action="update"]');
    const deleteBtn = card.querySelector('[data-action="delete"]');

    updateBtn.addEventListener('click', async () => {
      if (message) {
        message.textContent = '';
      }
      const name = card.querySelector('input[name="name"]').value.trim();
      const category = card.querySelector('input[name="category"]').value.trim();
      const priceInput = card.querySelector('input[name="price"]').value;
      const basePriceInput = card.querySelector('input[name="basePrice"]').value;
      const imageUrl = card.querySelector('input[name="imageUrl"]').value.trim();
      const description = card.querySelector('textarea[name="description"]').value.trim();
      const isAvailable = card.querySelector('input[name="isAvailable"]').checked;

      const payload = {
        name: name || product.name,
        category: category || product.category,
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

      try {
        await fetchJSON(`${apiBase}/products/${product._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (message) {
          message.textContent = 'Updated.';
        }
        await loadAdminProducts();
      } catch (error) {
        if (message) {
          message.textContent = error.message;
        }
      }
    });

    deleteBtn.addEventListener('click', async () => {
      if (!confirm(`Delete "${product.name}"?`)) {
        return;
      }
      try {
        await fetchJSON(`${apiBase}/products/${product._id}`, { method: 'DELETE' });
        await loadAdminProducts();
      } catch (error) {
        if (message) {
          message.textContent = error.message;
        }
      }
    });

    adminProductsList.appendChild(card);
  });
};

export const loadAdminProducts = async () => {
  if (!adminProductsList) {
    return;
  }
  adminProductsList.innerHTML = '';
  try {
    const data = await fetchJSON(`${apiBase}/products`);
    renderAdminProducts(data.products || []);
  } catch (error) {
    adminProductsList.innerHTML = `<p>${error.message}</p>`;
  }
};

const renderAdminOrders = (orders = []) => {
  if (!adminOrdersList) {
    return;
  }
  adminOrdersList.innerHTML = '';

  if (!orders.length) {
    adminOrdersList.innerHTML = '<p>No orders found.</p>';
    return;
  }

  const statuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
  const activeUser = getActiveUser();

  orders.forEach((order) => {
    const card = document.createElement('div');
    card.className = 'admin-order-card';
    const items = order.items
      .map((item) => `${item.quantity}x ${item.name} (${item.size})`)
      .join(', ');
    const userLabel =
      order.user && typeof order.user === 'object'
        ? order.user.username || order.user._id
        : order.user;

    card.innerHTML = `
      <div class="admin-order-meta">
        <span>Status: ${order.status}</span>
        <span>Total: ${formatCurrency(order.total)}</span>
        <span>User: ${userLabel}</span>
      </div>
      <div>${items}</div>
      <div class="admin-order-meta">
        Pickup: ${order.pickupTime ? new Date(order.pickupTime).toLocaleString() : 'ASAP'}
      </div>
      <div class="admin-order-actions">
        <select class="admin-status-select">
          ${statuses
            .map(
              (status) =>
                `<option value="${status}" ${status === order.status ? 'selected' : ''}>${status.replace(
                  '_',
                  ' '
                )}</option>`
            )
            .join('')}
        </select>
        <button type="button" class="primary" data-action="status">Update status</button>
        ${activeUser && activeUser.role === 'admin' ? '<button type="button" class="ghost" data-action="delete">Delete</button>' : ''}
      </div>
      <p class="form-message admin-inline-message"></p>
    `;

    const message = card.querySelector('.admin-inline-message');
    const statusSelect = card.querySelector('.admin-status-select');
    const statusBtn = card.querySelector('[data-action="status"]');
    const deleteBtn = card.querySelector('[data-action="delete"]');

    statusBtn.addEventListener('click', async () => {
      if (message) {
        message.textContent = '';
      }
      try {
        await fetchJSON(`${apiBase}/orders/${order._id}`, {
          method: 'PUT',
          body: JSON.stringify({ status: statusSelect.value }),
        });
        if (message) {
          message.textContent = 'Status updated.';
        }
        await loadAdminOrders();
      } catch (error) {
        if (message) {
          message.textContent = error.message;
        }
      }
    });

    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!confirm('Delete this order?')) {
          return;
        }
        try {
          await fetchJSON(`${apiBase}/orders/${order._id}`, { method: 'DELETE' });
          await loadAdminOrders();
        } catch (error) {
          if (message) {
            message.textContent = error.message;
          }
        }
      });
    }

    adminOrdersList.appendChild(card);
  });
};

export const loadAdminOrders = async () => {
  if (!adminOrdersList) {
    return;
  }
  adminOrdersList.innerHTML = '';
  try {
    const data = await fetchJSON(`${apiBase}/orders/all`);
    renderAdminOrders(data.orders || []);
  } catch (error) {
    adminOrdersList.innerHTML = `<p>${error.message}</p>`;
  }
};

export const bindAdminEvents = () => {
  if (adminCreateProductForm) {
    adminCreateProductForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (adminProductMessage) {
        adminProductMessage.textContent = '';
      }

      const formData = new FormData(adminCreateProductForm);
      const payload = {
        name: formData.get('name')?.toString().trim(),
        category: formData.get('category')?.toString().trim(),
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
          if (adminProductMessage) {
            adminProductMessage.textContent = 'Sizes must be valid JSON array.';
          }
          return;
        }
      }

      const hasPrice = payload.price !== undefined || payload.basePrice !== undefined;
      if (!hasPrice && (!payload.sizes || payload.sizes.length === 0)) {
        if (adminProductMessage) {
          adminProductMessage.textContent = 'Provide price/base price or sizes.';
        }
        return;
      }

      try {
        await fetchJSON(`${apiBase}/products`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (adminProductMessage) {
          adminProductMessage.textContent = 'Product created.';
        }
        adminCreateProductForm.reset();
        await loadAdminProducts();
      } catch (error) {
        if (adminProductMessage) {
          adminProductMessage.textContent = error.message;
        }
      }
    });
  }

  if (adminRefreshOrdersBtn) {
    adminRefreshOrdersBtn.addEventListener('click', loadAdminOrders);
  }
};
