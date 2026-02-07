import { cartKey } from './config.js';
import { cartList, cartTotal, clearCartBtn } from './dom.js';
import { formatCurrency } from './utils.js';
import { setCartState } from './state.js';
import { setStatusMessage } from './ui.js';

export const getCart = () => {
  let raw = null;
  try {
    raw = localStorage.getItem(cartKey);
  } catch (error) {
    raw = null;
  }
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const setCart = (cart) => {
  try {
    localStorage.setItem(cartKey, JSON.stringify(cart));
  } catch (error) {
    // Ignore storage errors in private mode.
  }
  setCartState(cart);
  renderCart();
};

export const addToCart = (item) => {
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

export const updateCartQuantity = (index, delta) => {
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

export const clearCart = () => {
  setCart([]);
};

const createQtyButton = ({ action, label, icon }) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `qty-action qty-action--${action}`;
  button.dataset.action = action;
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);
  button.innerHTML = `
    <span class="qty-action__icon" aria-hidden="true">
      ${icon}
    </span>
  `;
  return button;
};

const createCartRow = (item, index) => {
  const row = document.createElement('div');
  row.className = 'cart-item';

  const info = document.createElement('div');
  info.className = 'cart-item-info';

  const title = document.createElement('strong');
  title.textContent = item.name || 'Menu item';

  const detail = document.createElement('span');
  const sizeLabel = item.size ? `${item.size} · ` : '';
  detail.textContent = `${sizeLabel}${formatCurrency(item.unitPrice)} each`;

  info.appendChild(title);
  info.appendChild(detail);

  const actions = document.createElement('div');
  actions.className = 'cart-item-actions';

  const decButton = createQtyButton({
    action: 'dec',
    label: 'Decrease quantity',
    icon: '<svg viewBox="0 0 24 24"><line x1="5" x2="19" y1="12" y2="12"></line></svg>',
  });
  decButton.dataset.index = String(index);

  const qty = document.createElement('span');
  qty.className = 'cart-qty';
  qty.setAttribute('aria-label', 'Quantity');
  qty.textContent = String(item.quantity ?? 0);

  const incButton = createQtyButton({
    action: 'inc',
    label: 'Increase quantity',
    icon:
      '<svg viewBox="0 0 24 24"><line x1="12" x2="12" y1="5" y2="19"></line><line x1="5" x2="19" y1="12" y2="12"></line></svg>',
  });
  incButton.dataset.index = String(index);

  actions.appendChild(decButton);
  actions.appendChild(qty);
  actions.appendChild(incButton);

  row.appendChild(info);
  row.appendChild(actions);

  return row;
};

export const renderCart = () => {
  if (!cartList || !cartTotal) {
    return;
  }
  const cart = getCart();
  setCartState(cart);
  cartList.innerHTML = '';

  if (!cart.length) {
    setStatusMessage(cartList, {
      state: 'empty',
      message: 'Your cart is empty.',
    });
    cartTotal.textContent = formatCurrency(0);
    return;
  }

  let total = 0;

  cart.forEach((item, index) => {
    const lineTotal = Number(item.unitPrice) * Number(item.quantity || 0);
    total += lineTotal;
    const row = createCartRow(item, index);
    cartList.appendChild(row);
  });

  cartTotal.textContent = formatCurrency(total);
};

export const bindCartEvents = () => {
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
};
