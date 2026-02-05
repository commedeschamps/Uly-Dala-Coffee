import {
  registerForm,
  loginForm,
  profileForm,
  ordersList,
  refreshOrdersBtn,
  logoutBtn,
  guestLinks,
  adminLinks,
  baristaLinks,
  rootEl,
  userBadge,
  registerMessage,
  loginMessage,
  profileMessage,
  currentUser,
  currentRole,
  priorityCheckbox,
} from './dom.js';
import { apiBase } from './config.js';
import { fetchJSON } from './api.js';
import { getToken, setToken, clearToken } from './token.js';
import { setActiveUser } from './state.js';
import { loadOrders } from './orders.js';
import { onAuth, onOrders, onAccount, onCheckout, onAdmin, onBarista } from './page.js';
import { redirectTo } from './navigation.js';
import { clearCart } from './cart.js';

export const updateUserUI = (user, options = {}) => {
  setActiveUser(user);
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

export const bindAuthEvents = () => {
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
};
