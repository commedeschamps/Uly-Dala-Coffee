const apiBase = '/api';
const tokenKey = 'uly_dala_token';

const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const profileForm = document.getElementById('profileForm');
const orderForm = document.getElementById('orderForm');
const ordersList = document.getElementById('ordersList');
const addItemBtn = document.getElementById('addItemBtn');
const refreshOrdersBtn = document.getElementById('refreshOrders');
const loadOrdersBtn = document.getElementById('loadOrdersBtn');
const logoutBtn = document.getElementById('logoutBtn');

const registerMessage = document.getElementById('registerMessage');
const loginMessage = document.getElementById('loginMessage');
const profileMessage = document.getElementById('profileMessage');
const orderMessage = document.getElementById('orderMessage');
const currentUser = document.getElementById('currentUser');
const currentRole = document.getElementById('currentRole');

const itemsContainer = document.getElementById('itemsContainer');
const priorityCheckbox = orderForm ? orderForm.querySelector('input[name=\"priority\"]') : null;

const getToken = () => localStorage.getItem(tokenKey);
const setToken = (token) => localStorage.setItem(tokenKey, token);
const clearToken = () => localStorage.removeItem(tokenKey);

const path = window.location.pathname;
const onDashboard = path.endsWith('dashboard.html');
const onAuth = path.endsWith('auth.html');

const redirectTo = (target) => {
  window.location.href = target;
};

const fetchJSON = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    const message = data.message || 'Request failed';
    throw new Error(message);
  }

  return data;
};

let activeUser = null;

const updateUserUI = (user) => {
  activeUser = user;
  const isLoggedIn = Boolean(user);
  if (refreshOrdersBtn) {
    refreshOrdersBtn.disabled = !isLoggedIn;
  }
  if (logoutBtn) {
    logoutBtn.disabled = !isLoggedIn;
  }
  if (!user) {
    if (currentUser) {
      currentUser.textContent = 'Not signed in';
    }
    if (currentRole) {
      currentRole.textContent = 'Role: guest';
    }
    if (priorityCheckbox) {
      priorityCheckbox.disabled = true;
    }
    return;
  }

  if (currentUser) {
    currentUser.textContent = `${user.username} (${user.email})`;
  }
  if (currentRole) {
    currentRole.textContent = `Role: ${user.role}`;
  }
  const canUsePriority = ['premium', 'admin', 'moderator'].includes(user.role);
  if (priorityCheckbox) {
    priorityCheckbox.disabled = !canUsePriority;
  }
};

const addItemRow = (item = {}) => {
  if (!itemsContainer) {
    return;
  }
  const row = document.createElement('div');
  row.className = 'item-row';

  row.innerHTML = `
    <label>
      Item name
      <input type="text" name="itemName" required value="${item.name || ''}" />
    </label>
    <label>
      Size
      <select name="itemSize">
        <option value="small">Small</option>
        <option value="medium" selected>Medium</option>
        <option value="large">Large</option>
      </select>
    </label>
    <label>
      Price
      <input type="number" name="itemPrice" min="0" step="0.01" required value="${item.price || ''}" />
    </label>
    <label>
      Qty
      <input type="number" name="itemQty" min="1" step="1" required value="${item.quantity || 1}" />
    </label>
    <button type="button" class="ghost remove-item">Remove</button>
  `;

  row.querySelector('.remove-item').addEventListener('click', () => {
    row.remove();
  });

  if (item.size) {
    row.querySelector('select[name="itemSize"]').value = item.size;
  }

  itemsContainer.appendChild(row);
};

const collectItems = () => {
  if (!itemsContainer) {
    throw new Error('Order items are unavailable on this page.');
  }
  const rows = itemsContainer.querySelectorAll('.item-row');
  const items = [];

  rows.forEach((row) => {
    const name = row.querySelector('input[name="itemName"]').value.trim();
    const size = row.querySelector('select[name="itemSize"]').value;
    const price = Number(row.querySelector('input[name="itemPrice"]').value);
    const quantity = Number(row.querySelector('input[name="itemQty"]').value);

    if (!name) {
      throw new Error('Each item needs a name.');
    }
    if (!price || price < 0) {
      throw new Error('Item price must be a positive number.');
    }

    items.push({ name, size, price, quantity });
  });

  if (!items.length) {
    throw new Error('Add at least one item.');
  }

  return items;
};

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
  const isStaff = activeUser && ['admin', 'moderator'].includes(activeUser.role);

  orders.forEach((order) => {
    const card = document.createElement('div');
    card.className = 'order-card';

    const items = order.items
      .map((item) => `${item.quantity}x ${item.name} (${item.size})`)
      .join(', ');

    card.innerHTML = `
      <div class="order-meta">
        <span class="badge">Status: ${order.status}</span>
        <span>Total: $${order.total.toFixed(2)}</span>
        <span>Priority: ${order.priority ? 'Yes' : 'No'}</span>
      </div>
      <div>${items}</div>
      <div class="order-meta">Pickup: ${order.pickupTime ? new Date(order.pickupTime).toLocaleString() : 'ASAP'}</div>
      <div class="order-actions"></div>
    `;

    const actions = card.querySelector('.order-actions');

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'ghost';
    cancelBtn.textContent = 'Cancel order';
    cancelBtn.addEventListener('click', () => updateOrder(order._id, { status: 'cancelled' }));
    actions.appendChild(cancelBtn);

    if (isStaff) {
      const statusSelect = document.createElement('select');
      ['pending', 'paid', 'in_progress', 'ready', 'completed', 'cancelled'].forEach((status) => {
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

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'ghost';
      deleteBtn.textContent = 'Delete order';
      deleteBtn.addEventListener('click', () => deleteOrder(order._id));
      actions.appendChild(deleteBtn);
    }

    ordersList.appendChild(card);
  });

  if (!token) {
    ordersList.innerHTML = '<p>Please log in to view orders.</p>';
  }
};

const loadOrders = async () => {
  if (!getToken()) {
    if (ordersList) {
      ordersList.innerHTML = '<p>Please log in to view orders.</p>';
    }
    if (onDashboard) {
      redirectTo('/auth.html');
    }
    return;
  }

  try {
    const data = await fetchJSON(`${apiBase}/orders`);
    renderOrders(data.orders);
  } catch (error) {
    ordersList.innerHTML = `<p>${error.message}</p>`;
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

if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (registerMessage) {
      registerMessage.textContent = '';
    }

    const formData = new FormData(registerForm);
    const password = formData.get('password');
    const passwordValid = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);

    if (!passwordValid) {
      if (registerMessage) {
        registerMessage.textContent = 'Password must be at least 8 characters and include a number.';
      }
      return;
    }

    try {
      const payload = Object.fromEntries(formData.entries());
      const data = await fetchJSON(`${apiBase}/auth/register`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setToken(data.token);
      updateUserUI(data.user);
      if (registerMessage) {
        registerMessage.textContent = 'Registration successful.';
      }
      registerForm.reset();
      if (!onDashboard) {
        redirectTo('/dashboard.html');
        return;
      }
      await loadOrders();
    } catch (error) {
      if (registerMessage) {
        registerMessage.textContent = error.message;
      }
    }
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (loginMessage) {
      loginMessage.textContent = '';
    }

    try {
      const payload = Object.fromEntries(new FormData(loginForm).entries());
      const data = await fetchJSON(`${apiBase}/auth/login`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setToken(data.token);
      updateUserUI(data.user);
      if (loginMessage) {
        loginMessage.textContent = 'Login successful.';
      }
      loginForm.reset();
      if (!onDashboard) {
        redirectTo('/dashboard.html');
        return;
      }
      await loadOrders();
    } catch (error) {
      if (loginMessage) {
        loginMessage.textContent = error.message;
      }
    }
  });
}

if (profileForm) {
  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (profileMessage) {
      profileMessage.textContent = '';
    }

    if (!getToken()) {
      if (profileMessage) {
        profileMessage.textContent = 'Please log in first.';
      }
      if (onDashboard) {
        redirectTo('/auth.html');
      }
      return;
    }

    const payload = Object.fromEntries(new FormData(profileForm).entries());

    try {
      const data = await fetchJSON(`${apiBase}/users/profile`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      updateUserUI(data.user);
      if (profileMessage) {
        profileMessage.textContent = 'Profile updated.';
      }
    } catch (error) {
      if (profileMessage) {
        profileMessage.textContent = error.message;
      }
    }
  });
}

if (orderForm) {
  orderForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (orderMessage) {
      orderMessage.textContent = '';
    }

    if (!getToken()) {
      if (orderMessage) {
        orderMessage.textContent = 'Please log in to place an order.';
      }
      if (onDashboard) {
        redirectTo('/auth.html');
      }
      return;
    }

    try {
      const items = collectItems();
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
      orderForm.reset();
      if (itemsContainer) {
        itemsContainer.innerHTML = '';
        addItemRow();
      }
      await loadOrders();
    } catch (error) {
      if (orderMessage) {
        orderMessage.textContent = error.message;
      }
    }
  });
}

if (addItemBtn) {
  addItemBtn.addEventListener('click', () => addItemRow());
}
if (refreshOrdersBtn) {
  refreshOrdersBtn.addEventListener('click', () => {
    if (!onDashboard) {
      redirectTo('/dashboard.html');
      return;
    }
    loadOrders();
  });
}
if (loadOrdersBtn) {
  loadOrdersBtn.addEventListener('click', loadOrders);
}
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    clearToken();
    updateUserUI(null);
    if (ordersList) {
      ordersList.innerHTML = '<p>You have logged out.</p>';
    }
    if (onDashboard) {
      redirectTo('/auth.html');
    }
  });
}

const init = async () => {
  addItemRow();
  updateUserUI(null);

  const token = getToken();
  if (!token && onDashboard) {
    redirectTo('/auth.html');
    return;
  }
  if (token && onAuth) {
    redirectTo('/dashboard.html');
    return;
  }

  if (token) {
    try {
      const data = await fetchJSON(`${apiBase}/users/profile`);
      updateUserUI(data.user);
    } catch (error) {
      clearToken();
    }
  }

  if (onDashboard) {
    await loadOrders();
  }
};

init();
