import { fetchJSON } from './js/api.js';
import { getToken, clearToken } from './js/token.js';
import { setTokenState } from './js/state.js';
import { updateUserUI, bindAuthEvents } from './js/auth.js';
import { bindOrderEvents, loadOrders } from './js/orders.js';
import { loadProducts } from './js/products.js';
import { loadAdminProducts, loadAdminOrders, bindAdminEvents } from './js/admin.js';
import { renderCart, bindCartEvents } from './js/cart.js';
import { bindPasswordToggle, setupGallerySlider, showToast } from './js/ui.js';
import { redirectTo } from './js/navigation.js';
import {
  onOrders,
  onProducts,
  onCheckout,
  onAuth,
  onAccount,
  onAdmin,
  onBarista,
} from './js/page.js';

let lastUnauthorizedAt = 0;

const handleUnauthorized = (event) => {
  const now = Date.now();
  if (now - lastUnauthorizedAt < 1500) {
    return;
  }
  lastUnauthorizedAt = now;
  const message = event?.detail?.message || 'Session expired. Please sign in again.';
  clearToken();
  updateUserUI(null);
  showToast({
    type: 'error',
    title: 'Session expired',
    message,
  });
  if (onOrders || onCheckout || onAccount || onAdmin || onBarista) {
    redirectTo('/auth.html');
  }
};

const init = async () => {
  bindPasswordToggle();
  bindAuthEvents();
  bindOrderEvents();
  bindAdminEvents();
  bindCartEvents();

  window.addEventListener('auth:unauthorized', handleUnauthorized);

  const token = getToken();
  setTokenState(token);
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
      const data = await fetchJSON('/users/profile');
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
      if (Date.now() - lastUnauthorizedAt > 1500) {
        clearToken();
        updateUserUI(null);
        showToast({
          type: 'error',
          title: 'Unable to verify session',
          message: error.message || 'Please sign in again.',
        });
      }
    }
  } else {
    updateUserUI(null);
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
