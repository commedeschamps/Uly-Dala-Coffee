import { fetchJSON } from './js/api.js';
import { getToken, clearToken } from './js/token.js';
import { setTokenState } from './js/state.js';
import { updateUserUI, bindAuthEvents } from './js/auth.js';
import { bindOrderEvents, loadOrders } from './js/orders.js';
import { loadProducts } from './js/products.js';
import { loadAdminProducts, loadAdminOrders, bindAdminEvents } from './js/admin.js';
import { renderCart, bindCartEvents } from './js/cart.js';
import {
  bindPasswordToggle,
  setupGallerySlider,
  showToast,
  mountGithubStarButton,
} from './js/ui.js';
import { redirectTo, bindNavigationTransitions } from './js/navigation.js';
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
const MIN_AUTH_PENDING_MS = 360;

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
  const root = document.documentElement;
  const needsRouteGuard = onOrders || onCheckout || onAccount || onAdmin || onBarista || onAuth;
  if (needsRouteGuard) {
    root.classList.add('route-guard-pending');
  }

  bindPasswordToggle();
  mountGithubStarButton();
  bindAuthEvents();
  bindOrderEvents();
  bindAdminEvents();
  bindCartEvents();
  bindNavigationTransitions();

  window.addEventListener('auth:unauthorized', handleUnauthorized);

  const token = getToken();
  const pendingStartAt = token ? performance.now() : 0;
  const ensureMinimumPending = async () => {
    if (!token || !pendingStartAt) {
      return;
    }
    const elapsed = performance.now() - pendingStartAt;
    if (elapsed >= MIN_AUTH_PENDING_MS) {
      return;
    }
    await new Promise((resolve) => window.setTimeout(resolve, MIN_AUTH_PENDING_MS - elapsed));
  };
  const authQuery = new URLSearchParams(window.location.search);
  const isAuthResetFlow =
    onAuth && authQuery.get('mode') === 'reset' && Boolean(authQuery.get('token'));
  setTokenState(token);
  updateUserUI(null, { assumeLoggedIn: Boolean(token) });
  renderCart();

  if (!token && (onOrders || onCheckout || onAccount || onAdmin || onBarista)) {
    redirectTo('/auth.html');
    return;
  }
  if (token && onAuth && !isAuthResetFlow) {
    redirectTo('/account.html');
    return;
  }

  if (token) {
    try {
      const data = await fetchJSON('/users/profile');
      await ensureMinimumPending();
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
        await ensureMinimumPending();
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
  if (needsRouteGuard) {
    root.classList.remove('route-guard-pending');
  }
};

init();
