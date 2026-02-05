import { apiBase } from './js/config.js';
import { fetchJSON } from './js/api.js';
import { getToken, clearToken } from './js/token.js';
import { updateUserUI, bindAuthEvents } from './js/auth.js';
import { bindOrderEvents, loadOrders } from './js/orders.js';
import { loadProducts } from './js/products.js';
import { loadAdminProducts, loadAdminOrders, bindAdminEvents } from './js/admin.js';
import { renderCart, bindCartEvents } from './js/cart.js';
import { bindPasswordToggle, setupGallerySlider } from './js/ui.js';
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

const init = async () => {
  bindPasswordToggle();
  bindAuthEvents();
  bindOrderEvents();
  bindAdminEvents();
  bindCartEvents();

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
