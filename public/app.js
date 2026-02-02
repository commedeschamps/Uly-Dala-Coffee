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
const adminLinks = document.querySelectorAll('[data-auth=\"admin\"]');
const baristaLinks = document.querySelectorAll('[data-auth=\"barista\"]');
const rootEl = document.documentElement;
const userBadge = document.querySelector('.user-badge');

const registerMessage = document.getElementById('registerMessage');
const loginMessage = document.getElementById('loginMessage');
const profileMessage = document.getElementById('profileMessage');
const orderMessage = document.getElementById('orderMessage');
const currentUser = document.getElementById('currentUser');
const currentRole = document.getElementById('currentRole');

const drinksList = document.getElementById('drinksList');
const dessertsList = document.getElementById('dessertsList');
const cartList = document.getElementById('cartList');
const cartTotal = document.getElementById('cartTotal');
const clearCartBtn = document.getElementById('clearCartBtn');
const priorityCheckbox = orderForm ? orderForm.querySelector('input[name=\"priority\"]') : null;
const adminProductsList = document.getElementById('adminProductsList');
const adminOrdersList = document.getElementById('adminOrdersList');
const adminCreateProductForm = document.getElementById('adminCreateProductForm');
const adminProductMessage = document.getElementById('adminProductMessage');
const adminRefreshOrdersBtn = document.getElementById('adminRefreshOrders');

const getToken = () => localStorage.getItem(tokenKey);
const setToken = (token) => localStorage.setItem(tokenKey, token);
const clearToken = () => localStorage.removeItem(tokenKey);

const path = window.location.pathname;
const onOrders = path.endsWith('dashboard.html');
const onProducts = path.endsWith('products.html');
const onCheckout = path.endsWith('checkout.html');
const onAuth = path.endsWith('auth.html');
const onAccount = path.endsWith('account.html');
const onAdmin = path.endsWith('admin.html');
const onBarista = path.endsWith('barista.html');

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
  if (adminLinks.length) {
    const showAdmin = Boolean(user && user.role === 'admin');
    adminLinks.forEach((link) => link.classList.toggle('is-hidden', !showAdmin));
  }
  if (baristaLinks.length) {
    const showBarista = Boolean(user && (user.role === 'barista' || user.role === 'admin'));
    baristaLinks.forEach((link) => link.classList.toggle('is-hidden', !showBarista));
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
  const canUsePriority = ['premium', 'admin'].includes(user.role);
  if (priorityCheckbox) {
    priorityCheckbox.disabled = !canUsePriority;
  }
};

const toastWavePath =
  'M0,256L11.4,240C22.9,224,46,192,69,192C91.4,192,114,224,137,234.7C160,245,183,235,206,213.3C228.6,192,251,160,274,149.3C297.1,139,320,149,343,181.3C365.7,213,389,267,411,282.7C434.3,299,457,277,480,250.7C502.9,224,526,192,549,181.3C571.4,171,594,181,617,208C640,235,663,277,686,256C708.6,235,731,149,754,122.7C777.1,96,800,128,823,165.3C845.7,203,869,245,891,224C914.3,203,937,117,960,112C982.9,107,1006,181,1029,197.3C1051.4,213,1074,171,1097,144C1120,117,1143,107,1166,133.3C1188.6,160,1211,224,1234,218.7C1257.1,213,1280,139,1303,133.3C1325.7,128,1349,192,1371,192C1394.3,192,1417,128,1429,96L1440,64L1440,320L1428.6,320C1417.1,320,1394,320,1371,320C1348.6,320,1326,320,1303,320C1280,320,1257,320,1234,320C1211.4,320,1189,320,1166,320C1142.9,320,1120,320,1097,320C1074.3,320,1051,320,1029,320C1005.7,320,983,320,960,320C937.1,320,914,320,891,320C868.6,320,846,320,823,320C800,320,777,320,754,320C731.4,320,709,320,686,320C662.9,320,640,320,617,320C594.3,320,571,320,549,320C525.7,320,503,320,480,320C457.1,320,434,320,411,320C388.6,320,366,320,343,320C320,320,297,320,274,320C251.4,320,229,320,206,320C182.9,320,160,320,137,320C114.3,320,91,320,69,320C45.7,320,23,320,11,320L0,320Z';

const toastIcons = {
  info: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="0" fill="currentColor" stroke="currentColor" class="toast-icon">
      <path d="M13 7.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-3 3.75a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v4.25h.75a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1 0-1.5h.75V12h-.75a.75.75 0 0 1-.75-.75Z"></path>
      <path d="M12 1c6.075 0 11 4.925 11 11s-4.925 11-11 11S1 18.075 1 12 5.925 1 12 1ZM2.5 12a9.5 9.5 0 0 0 9.5 9.5 9.5 9.5 0 0 0 9.5-9.5A9.5 9.5 0 0 0 12 2.5 9.5 9.5 0 0 0 2.5 12Z"></path>
    </svg>
  `,
  error: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" stroke-width="0" fill="currentColor" stroke="currentColor" class="toast-icon">
      <path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c-9.4 9.4-9.4 24.6 0 33.9l47 47-47 47c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l47-47 47 47c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-47-47 47-47c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-47 47-47-47c-9.4-9.4-24.6-9.4-33.9 0z"></path>
    </svg>
  `,
};

let toastContainer = null;

const ensureToastContainer = () => {
  if (toastContainer) return toastContainer;
  toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
};

const removeToast = (toast) => {
  toast.classList.add('is-leaving');
  toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  setTimeout(() => {
    if (toast.isConnected) toast.remove();
  }, 700);
};

const showToast = ({ type = 'info', title = 'Info message', message = '' } = {}) => {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  const toastType = type === 'error' ? 'error' : 'info';
  toast.className = `toast-card toast-${toastType}`;
  toast.setAttribute('role', toastType === 'error' ? 'alert' : 'status');
  toast.innerHTML = `
    <svg class="toast-wave" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
      <path d="${toastWavePath}" fill-opacity="1"></path>
    </svg>
    <div class="toast-icon-wrap">
      ${toastIcons[toastType]}
    </div>
    <div class="toast-text">
      <p class="toast-title"></p>
      <p class="toast-message"></p>
    </div>
    <button type="button" class="toast-close" aria-label="Dismiss notification">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" stroke-width="0" fill="none" stroke="currentColor">
        <path fill="currentColor" d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" clip-rule="evenodd" fill-rule="evenodd"></path>
      </svg>
    </button>
  `;

  const titleEl = toast.querySelector('.toast-title');
  const messageEl = toast.querySelector('.toast-message');
  const closeBtn = toast.querySelector('.toast-close');

  if (titleEl) titleEl.textContent = title;
  if (messageEl) messageEl.textContent = message;
  if (closeBtn) closeBtn.addEventListener('click', () => removeToast(toast));

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));

  setTimeout(() => removeToast(toast), 4500);
};

let cartToastContainer = null;

const ensureCartToastContainer = () => {
  if (cartToastContainer) return cartToastContainer;
  cartToastContainer = document.getElementById('cartToastContainer');
  if (!cartToastContainer) {
    cartToastContainer = document.createElement('div');
    cartToastContainer.id = 'cartToastContainer';
    cartToastContainer.className = 'cart-toast-container';
    document.body.appendChild(cartToastContainer);
  }
  return cartToastContainer;
};

const removeCartToast = (toast) => {
  toast.classList.add('is-leaving');
  toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  setTimeout(() => {
    if (toast.isConnected) toast.remove();
  }, 700);
};

const showCartToast = ({ name = 'Item', price = '' } = {}) => {
  const container = ensureCartToastContainer();
  const toast = document.createElement('div');
  toast.className = 'cart-toast';
  toast.innerHTML = `
    <svg class="toast-wave" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
      <path d="${toastWavePath}" fill-opacity="1"></path>
    </svg>
    <div class="cart-icon">
      <div class="icon-cart-box">
        <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 576 512">
          <path fill="#000" d="M0 24C0 10.7 10.7 0 24 0H69.5c22 0 41.5 12.8 50.6 32h411c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3H170.7l5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5H488c13.3 0 24 10.7 24 24s-10.7 24-24 24H199.7c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5H24C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"></path>
        </svg>
      </div>
    </div>
    <div class="cart-content">
      <div class="cart-title-wrapper">
        <span class="cart-title">Added to cart!</span>
        <button type="button" class="cart-close" aria-label="Dismiss">
          <svg xmlns="http://www.w3.org/2000/svg" height="15" width="15" viewBox="0 0 384 512">
            <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"></path>
          </svg>
        </button>
      </div>
      <div class="cart-product"></div>
      <div class="cart-price"></div>
      <button type="button" class="cart-button">
        View cart
        <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
          <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" clip-rule="evenodd"></path>
        </svg>
      </button>
    </div>
  `;

  const productEl = toast.querySelector('.cart-product');
  const priceEl = toast.querySelector('.cart-price');
  const closeBtn = toast.querySelector('.cart-close');
  const viewBtn = toast.querySelector('.cart-button');

  if (productEl) productEl.textContent = name;
  if (priceEl) {
    if (price) {
      priceEl.textContent = price;
    } else {
      priceEl.remove();
    }
  }
  if (closeBtn) closeBtn.addEventListener('click', () => removeCartToast(toast));
  if (viewBtn) {
    viewBtn.addEventListener('click', () => {
      removeCartToast(toast);
      redirectTo('/checkout.html');
    });
  }

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));

  setTimeout(() => removeCartToast(toast), 5200);
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
const parseOptionalNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

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
    const displaySize = sizeSelect ? selectedSize : '';
    showCartToast({
      name: `${product.name}${displaySize ? ` (${displaySize})` : ''}`,
      price: formatCurrency(unitPrice),
    });
  });

  container.appendChild(card);
};

const loadProducts = async () => {
  if (!drinksList || !dessertsList) {
    return;
  }
  drinksList.innerHTML = '';
  dessertsList.innerHTML = '';

  const dessertKeywords = ['dessert', 'pastry', 'bakery', 'sweet', 'cake'];

  try {
    const data = await fetchJSON(`${apiBase}/products?available=true`);
    const products = data.products || [];

    const desserts = products.filter((product) => {
      const category = (product.category || '').toLowerCase();
      return dessertKeywords.some((keyword) => category.includes(keyword));
    });

    const drinks = products.filter((product) => !desserts.includes(product));

    if (!drinks.length) {
      drinksList.innerHTML = '<p>No drinks available yet.</p>';
    } else {
      drinks.forEach((product) => renderProductCard(product, drinksList));
    }

    if (!desserts.length) {
      dessertsList.innerHTML = '<p>No desserts available yet.</p>';
    } else {
      desserts.forEach((product) => renderProductCard(product, dessertsList));
    }
  } catch (error) {
    drinksList.innerHTML = `<p>${error.message}</p>`;
  }
};

const loadAdminProducts = async () => {
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

const loadAdminOrders = async () => {
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

const loadOrders = async () => {
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
      if (onOrders) {
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
      if (onOrders) {
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
    if (onOrders || onAccount || onCheckout) {
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
  });
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
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    clearToken();
    updateUserUI(null);
    if (ordersList) {
      ordersList.innerHTML = '<p>You have logged out.</p>';
    }
    clearCart();
    if (onOrders || onCheckout || onAccount || onAdmin || onBarista) {
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

const setupPageTransitions = () => {
  if (document.body) {
    document.body.classList.add('page-ready');
  }

  window.addEventListener('pageshow', () => {
    document.body.classList.remove('page-leave');
    document.body.classList.add('page-ready');
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) {
      return;
    }
    if (link.target && link.target !== '_self') {
      return;
    }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    if (link.hasAttribute('download') || link.dataset.noTransition !== undefined) {
      return;
    }

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) {
      return;
    }

    const url = new URL(link.href, window.location.origin);
    if (url.origin !== window.location.origin) {
      return;
    }

    event.preventDefault();
    document.body.classList.add('page-leave');
    window.setTimeout(() => {
      window.location.href = link.href;
    }, 220);
  });
};

const init = async () => {
  setupPageTransitions();
  const token = getToken();
  updateUserUI(null, { assumeLoggedIn: Boolean(token) });
  renderCart();

  if (!token && (onOrders || onCheckout || onAccount || onAdmin || onBarista)) {
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
      if (onAdmin && data.user.role !== 'admin') {
        redirectTo('/dashboard.html');
        return;
      }
      if (onBarista && !['admin', 'barista'].includes(data.user.role)) {
        redirectTo('/dashboard.html');
        return;
      }
    } catch (error) {
      clearToken();
      updateUserUI(null);
    }
  }

  if (onProducts) {
    await loadProducts();
  }

  if (onOrders) {
    await loadOrders();
  }

  if (onAdmin) {
    await loadAdminProducts();
    await loadAdminOrders();
  }

  if (onBarista) {
    await loadAdminOrders();
  }

  setupGallerySlider();
};

init();
