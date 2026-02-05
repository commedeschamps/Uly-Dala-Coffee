import { cartKey } from './config.js';
import { cartList, cartTotal, clearCartBtn } from './dom.js';
import { formatCurrency } from './utils.js';

export const getCart = () => {
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

export const renderCart = () => {
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
