const apiBase = '/api';
const tokenKey = 'uly_dala_token';

const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const profileForm = document.getElementById('profileForm');
const orderForm = document.getElementById('orderForm');
const ordersList = document.getElementById('ordersList');
const refreshOrdersBtn = document.getElementById('refreshOrders');
const loadOrdersBtn = document.getElementById('loadOrdersBtn');
const logoutBtn = document.getElementById('logoutBtn');
const guestLinks = document.querySelectorAll('[data-auth=\"guest\"]');
const rootEl = document.documentElement;
const userBadge = document.querySelector('.user-badge');

const registerMessage = document.getElementById('registerMessage');
const loginMessage = document.getElementById('loginMessage');
const profileMessage = document.getElementById('profileMessage');
const orderMessage = document.getElementById('orderMessage');
const currentUser = document.getElementById('currentUser');
const currentRole = document.getElementById('currentRole');

const productsList = document.getElementById('productsList');
const seasonalList = document.getElementById('seasonalList');
const cartList = document.getElementById('cartList');
const cartTotal = document.getElementById('cartTotal');
const clearCartBtn = document.getElementById('clearCartBtn');
const priorityCheckbox = orderForm ? orderForm.querySelector('input[name=\"priority\"]') : null;

const getToken = () => localStorage.getItem(tokenKey);
const setToken = (token) => localStorage.setItem(tokenKey, token);
const clearToken = () => localStorage.removeItem(tokenKey);

const path = window.location.pathname;
const onDashboard = path.endsWith('dashboard.html');
const onAuth = path.endsWith('auth.html');
const onAccount = path.endsWith('account.html');

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

const updateUserUI = (user, options = {}) => {
  activeUser = user;
  const isLoggedIn = Boolean(user) || Boolean(options.assumeLoggedIn);
  const isPending = Boolean(options.assumeLoggedIn) && !user;
  if (rootEl) {
    rootEl.classList.toggle('auth-pending', isPending);
  }
  if (guestLinks.length) {
    guestLinks.forEach((link) => link.classList.toggle('is-hidden', isLoggedIn));
  }
  if (refreshOrdersBtn) {
    refreshOrdersBtn.disabled = !isLoggedIn;
  }
  if (logoutBtn) {
    logoutBtn.disabled = !isLoggedIn;
  }
  if (!user) {
    if (currentUser) {
      currentUser.textContent = isPending ? '' : 'Not signed in';
    }
    if (currentRole) {
      currentRole.textContent = isPending ? '' : 'Role: guest';
    }
    if (priorityCheckbox) {
      priorityCheckbox.disabled = true;
    }
    if (userBadge) {
      userBadge.classList.toggle('is-loading', isPending);
      if (isPending) {
        userBadge.setAttribute('aria-busy', 'true');
      } else {
        userBadge.removeAttribute('aria-busy');
      }
    }
    return;
  }

  if (currentUser) {
    currentUser.textContent = `${user.username} (${user.email})`;
  }
  if (currentRole) {
    currentRole.textContent = `Role: ${user.role}`;
  }
  if (userBadge) {
    userBadge.classList.remove('is-loading');
    userBadge.removeAttribute('aria-busy');
  }
  const canUsePriority = ['premium', 'admin', 'moderator'].includes(user.role);
  if (priorityCheckbox) {
    priorityCheckbox.disabled = !canUsePriority;
  }
};

const cartKey = 'uly_dala_cart';

const getCart = () => {
  const raw = localStorage.getItem(cartKey);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
};

const setCart = (cart) => {
  localStorage.setItem(cartKey, JSON.stringify(cart));
  renderCart();
};

const addToCart = (item) => {
  const cart = getCart();
  const existing = cart.find(
    (entry) => entry.product === item.product && entry.size === item.size
  );
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }
  setCart(cart);
};

const updateCartQuantity = (index, delta) => {
  const cart = getCart();
  if (!cart[index]) {
    return;
  }
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  setCart(cart);
};

const clearCart = () => {
  setCart([]);
};

const formatCurrency = (value) => `${Math.round(value)} ₸`;

const renderCart = () => {
  if (!cartList || !cartTotal) {
    return;
  }
  const cart = getCart();
  cartList.innerHTML = '';

  if (!cart.length) {
    cartList.innerHTML = '<p>Your cart is empty.</p>';
    cartTotal.textContent = '0 ₸';
    return;
  }

  let total = 0;

  cart.forEach((item, index) => {
    const lineTotal = item.unitPrice * item.quantity;
    total += lineTotal;
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div class="cart-item-info">
        <strong>${item.name}</strong>
        <span>${item.size} · ${formatCurrency(item.unitPrice)} each</span>
      </div>
      <div class="cart-item-actions">
        <button
          class="qty-action qty-action--dec"
          type="button"
          data-index="${index}"
          data-action="dec"
          aria-label="Decrease quantity"
        >
          <span class="qty-action__text">Remove</span>
          <span class="qty-action__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <line x1="5" x2="19" y1="12" y2="12"></line>
            </svg>
          </span>
        </button>
        <span class="cart-qty" aria-label="Quantity">${item.quantity}</span>
        <button
          class="qty-action qty-action--inc"
          type="button"
          data-index="${index}"
          data-action="inc"
          aria-label="Increase quantity"
        >
          <span class="qty-action__text">Add item</span>
          <span class="qty-action__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <line x1="12" x2="12" y1="5" y2="19"></line>
              <line x1="5" x2="19" y1="12" y2="12"></line>
            </svg>
          </span>
        </button>
      </div>
    `;
    cartList.appendChild(row);
  });

  cartTotal.textContent = formatCurrency(total);
};

const renderProductCard = (product, container) => {
  const card = document.createElement('div');
  card.className = 'product-card';

  const sizes = product.sizes || [];
  const hasSizes = sizes.length > 0;
  const defaultSize = hasSizes ? sizes[0].label : 'medium';
  const defaultPrice = hasSizes
    ? sizes[0].price
    : product.basePrice ?? product.price ?? 0;

  card.innerHTML = `
    <img src="${product.imageUrl}" alt="${product.name}" loading="lazy" />
    <div class="product-body">
      <h4 class="product-title">${product.name}</h4>
      <p class="product-desc">${product.description || ''}</p>
      <div class="product-meta">
        <span class="product-price">${formatCurrency(defaultPrice)}</span>
        <span>${product.category}</span>
      </div>
      ${
        hasSizes
          ? `<label>
              Size
              <select class="size-select">
                ${sizes
                  .map((size) => `<option value="${size.label}">${size.label}</option>`)
                  .join('')}
              </select>
            </label>`
          : ''
      }
      <button class="wooden-cart-button" type="button">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <g id="cart">
            <circle r="1.91" cy="20.59" cx="10.07"></circle>
            <circle r="1.91" cy="20.59" cx="18.66"></circle>
            <path d="M.52,1.5H3.18a2.87,2.87,0,0,1,2.74,2L9.11,13.91H8.64A2.39,2.39,0,0,0,6.25,16.3h0a2.39,2.39,0,0,0,2.39,2.38h10"></path>
            <polyline points="7.21 5.32 22.48 5.32 22.48 7.23 20.57 13.91 9.11 13.91"></polyline>
          </g>
        </svg>
        <span class="button-text">Add to cart</span>
      </button>
    </div>
  `;

  const priceEl = card.querySelector('.product-price');
  const sizeSelect = card.querySelector('.size-select');
  if (sizeSelect) {
    sizeSelect.addEventListener('change', () => {
      const selected = sizes.find((size) => size.label === sizeSelect.value);
      if (selected) {
        priceEl.textContent = formatCurrency(selected.price);
      }
    });
  }

  const addBtn = card.querySelector('.wooden-cart-button');
  addBtn.addEventListener('click', () => {
    const selectedSize = sizeSelect ? sizeSelect.value : defaultSize;
    const matched = sizes.find((size) => size.label === selectedSize);
    const unitPrice = matched ? matched.price : defaultPrice;
    addToCart({
      product: product._id,
      name: product.name,
      size: selectedSize,
      unitPrice,
      quantity: 1,
    });
  });

  container.appendChild(card);
};

const loadProducts = async () => {
  if (!productsList || !seasonalList) {
    return;
  }
  productsList.innerHTML = '';
  seasonalList.innerHTML = '';

  try {
    const data = await fetchJSON(`${apiBase}/products?available=true`);
    const products = data.products || [];
    const seasonal = products.filter((product) =>
      (product.category || '').toLowerCase().includes('seasonal')
    );
    const regular = products.filter(
      (product) => !(product.category || '').toLowerCase().includes('seasonal')
    );

    if (!regular.length) {
      productsList.innerHTML = '<p>No products available yet.</p>';
    } else {
      regular.forEach((product) => renderProductCard(product, productsList));
    }

    if (!seasonal.length) {
      seasonalList.innerHTML = '<p>No seasonal items right now.</p>';
    } else {
      seasonal.forEach((product) => renderProductCard(product, seasonalList));
    }
  } catch (error) {
    productsList.innerHTML = `<p>${error.message}</p>`;
  }
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
        <span>Total: ${formatCurrency(order.total)}</span>
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
    if (onDashboard || onAccount) {
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
      if (onAuth) {
        redirectTo('/account.html');
        return;
      }
      if (onDashboard) {
        await loadOrders();
      }
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
      if (onAuth) {
        redirectTo('/account.html');
        return;
      }
      if (onDashboard) {
        await loadOrders();
      }
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
    if (onDashboard || onAccount) {
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
      orderForm.reset();
      clearCart();
      if (onDashboard) {
        await loadOrders();
      }
    } catch (error) {
      if (orderMessage) {
        orderMessage.textContent = error.message;
      }
    }
  });
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
    clearCart();
    if (onDashboard || onAccount) {
      redirectTo('/auth.html');
    }
  });
}

if (clearCartBtn) {
  clearCartBtn.addEventListener('click', clearCart);
}

if (cartList) {
  cartList.addEventListener('click', (event) => {
    const button = event.target.closest('.qty-action');
    if (!button) {
      return;
    }
    const index = Number(button.dataset.index);
    const action = button.dataset.action;
    updateCartQuantity(index, action === 'inc' ? 1 : -1);
  });
}

const setupGallerySlider = () => {
  const slider = document.querySelector('[data-gallery]');
  if (!slider) {
    return;
  }
  const track = slider.querySelector('.gallery-track');
  const slides = Array.from(slider.querySelectorAll('.gallery-slide'));
  const prevBtn = document.querySelector('[data-gallery-prev]');
  const nextBtn = document.querySelector('[data-gallery-next]');
  const dots = Array.from(document.querySelectorAll('[data-gallery-dot]'));
  if (!track || !slides.length) {
    return;
  }

  let index = 0;

  const setIndex = (nextIndex) => {
    index = Math.max(0, Math.min(slides.length - 1, nextIndex));
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === index;
      dot.classList.toggle('is-active', isActive);
      if (isActive) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });
    if (prevBtn) {
      prevBtn.disabled = index === 0;
    }
    if (nextBtn) {
      nextBtn.disabled = index === slides.length - 1;
    }
  };

  if (prevBtn) {
    prevBtn.addEventListener('click', () => setIndex(index - 1));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => setIndex(index + 1));
  }
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const targetIndex = Number(dot.dataset.galleryDot || 0);
      setIndex(targetIndex);
    });
  });

  setIndex(0);
};

const init = async () => {
  const token = getToken();
  updateUserUI(null, { assumeLoggedIn: Boolean(token) });
  renderCart();

  if (!token && (onDashboard || onAccount)) {
    redirectTo('/auth.html');
    return;
  }
  if (token && onAuth) {
    redirectTo('/account.html');
    return;
  }

  if (token) {
    try {
      const data = await fetchJSON(`${apiBase}/users/profile`);
      updateUserUI(data.user);
    } catch (error) {
      clearToken();
      updateUserUI(null);
    }
  }

  if (onDashboard) {
    await loadProducts();
    await loadOrders();
  }

  setupGallerySlider();
};

init();
