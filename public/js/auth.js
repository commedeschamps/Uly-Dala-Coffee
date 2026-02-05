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
import { fetchJSON } from './api.js';
import { getToken, setToken, clearToken } from './token.js';
import { setActiveUser, getActiveUser } from './state.js';
import { loadOrders } from './orders.js';
import { onAuth, onOrders, onAccount, onCheckout, onAdmin, onBarista } from './page.js';
import { redirectTo } from './navigation.js';
import { clearCart } from './cart.js';
import { setFormMessage, setButtonBusy, showToast } from './ui.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getSubmitButton = (form) => form?.querySelector('button[type="submit"]');

export const updateUserUI = (user, options = {}) => {
  setActiveUser(user);
  const isLoggedIn = Boolean(user) || Boolean(options.assumeLoggedIn);
  const isPending = Boolean(options.assumeLoggedIn) && !user;

  if (rootEl) {
    rootEl.classList.toggle('auth-pending', isPending);
    rootEl.classList.toggle('auth-ready', !isPending);
    rootEl.classList.toggle('auth-logged-in', isLoggedIn && !isPending);
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
    refreshOrdersBtn.disabled = !isLoggedIn || isPending;
  }
  if (logoutBtn) {
    logoutBtn.disabled = !isLoggedIn || isPending;
  }

  if (!user) {
    if (currentUser) {
      currentUser.textContent = isPending ? '' : 'Not signed in';
      currentUser.setAttribute('aria-live', 'polite');
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
    currentUser.setAttribute('aria-live', 'polite');
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
      setFormMessage(registerMessage, { message: '' });

      const formData = new FormData(registerForm);
      const username = formData.get('username')?.toString().trim();
      const email = formData.get('email')?.toString().trim();
      const password = formData.get('password')?.toString() || '';
      const role = formData.get('role')?.toString() || 'user';

      if (!username || username.length < 3) {
        setFormMessage(registerMessage, {
          message: 'Username must be at least 3 characters long.',
          state: 'error',
        });
        return;
      }
      if (!email || !emailPattern.test(email)) {
        setFormMessage(registerMessage, {
          message: 'Enter a valid email address.',
          state: 'error',
        });
        return;
      }
      const passwordValid = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
      if (!passwordValid) {
        setFormMessage(registerMessage, {
          message: 'Password must be at least 8 characters and include a number.',
          state: 'error',
        });
        return;
      }

      const submitButton = getSubmitButton(registerForm);
      setButtonBusy(submitButton, true, 'Creating...');

      try {
        const payload = { username, email, password, role };
        const data = await fetchJSON('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload),
          skipAuth: true,
        });

        setToken(data.token);
        updateUserUI(data.user);
        setFormMessage(registerMessage, {
          message: 'Registration successful.',
          state: 'success',
        });
        showToast({
          type: 'info',
          title: 'Account created',
          message: 'Welcome to Uly Dala Coffee.',
        });
        registerForm.reset();
        if (onAuth) {
          redirectTo('/account.html');
          return;
        }
        if (onOrders) {
          await loadOrders();
        }
      } catch (error) {
        setFormMessage(registerMessage, {
          message: error.message || 'Unable to register.',
          state: 'error',
        });
        showToast({
          type: 'error',
          title: 'Registration failed',
          message: error.message || 'Please try again.',
        });
      } finally {
        setButtonBusy(submitButton, false);
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      setFormMessage(loginMessage, { message: '' });

      const formData = new FormData(loginForm);
      const email = formData.get('email')?.toString().trim();
      const password = formData.get('password')?.toString() || '';

      if (!email || !emailPattern.test(email)) {
        setFormMessage(loginMessage, {
          message: 'Enter a valid email address.',
          state: 'error',
        });
        return;
      }
      if (!password) {
        setFormMessage(loginMessage, {
          message: 'Please enter your password.',
          state: 'error',
        });
        return;
      }

      const submitButton = getSubmitButton(loginForm);
      setButtonBusy(submitButton, true, 'Signing in...');

      try {
        const payload = { email, password };
        const data = await fetchJSON('/auth/login', {
          method: 'POST',
          body: JSON.stringify(payload),
          skipAuth: true,
        });

        setToken(data.token);
        updateUserUI(data.user);
        setFormMessage(loginMessage, {
          message: 'Login successful.',
          state: 'success',
        });
        showToast({
          type: 'info',
          title: 'Welcome back',
          message: 'You are signed in.',
        });
        loginForm.reset();
        if (onAuth) {
          redirectTo('/account.html');
          return;
        }
        if (onOrders) {
          await loadOrders();
        }
      } catch (error) {
        setFormMessage(loginMessage, {
          message: error.message || 'Unable to sign in.',
          state: 'error',
        });
        showToast({
          type: 'error',
          title: 'Login failed',
          message: error.message || 'Please try again.',
        });
      } finally {
        setButtonBusy(submitButton, false);
      }
    });
  }

  if (profileForm) {
    profileForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      setFormMessage(profileMessage, { message: '' });

      if (!getToken()) {
        setFormMessage(profileMessage, {
          message: 'Please log in first.',
          state: 'error',
        });
        if (onOrders || onAccount || onCheckout) {
          redirectTo('/auth.html');
        }
        return;
      }

      const formData = new FormData(profileForm);
      const username = formData.get('username')?.toString().trim();
      const email = formData.get('email')?.toString().trim();

      const payload = {};
      if (username) {
        if (username.length < 3) {
          setFormMessage(profileMessage, {
            message: 'Username must be at least 3 characters long.',
            state: 'error',
          });
          return;
        }
        payload.username = username;
      }
      if (email) {
        if (!emailPattern.test(email)) {
          setFormMessage(profileMessage, {
            message: 'Enter a valid email address.',
            state: 'error',
          });
          return;
        }
        payload.email = email;
      }

      if (!Object.keys(payload).length) {
        setFormMessage(profileMessage, {
          message: 'Update at least one field before saving.',
          state: 'error',
        });
        return;
      }

      const submitButton = getSubmitButton(profileForm);
      setButtonBusy(submitButton, true, 'Updating...');

      try {
        const data = await fetchJSON('/users/profile', {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        updateUserUI(data.user);
        setFormMessage(profileMessage, {
          message: 'Profile updated.',
          state: 'success',
        });
        showToast({
          type: 'info',
          title: 'Profile updated',
          message: 'Your details are saved.',
        });
      } catch (error) {
        setFormMessage(profileMessage, {
          message: error.message || 'Unable to update profile.',
          state: 'error',
        });
        showToast({
          type: 'error',
          title: 'Update failed',
          message: error.message || 'Please try again.',
        });
      } finally {
        setButtonBusy(submitButton, false);
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearToken();
      updateUserUI(null);
      if (ordersList) {
        ordersList.textContent = '';
      }
      clearCart();
      showToast({
        type: 'info',
        title: 'Signed out',
        message: 'You have been logged out.',
      });
      if (onOrders || onCheckout || onAccount || onAdmin || onBarista) {
        redirectTo('/auth.html');
      }
    });
  }

  if (refreshOrdersBtn) {
    refreshOrdersBtn.addEventListener('click', async () => {
      const user = getActiveUser();
      if (!user) {
        showToast({
          type: 'error',
          title: 'Login required',
          message: 'Please sign in to refresh orders.',
        });
        if (onOrders || onAccount) {
          redirectTo('/auth.html');
        }
        return;
      }
      if (!onOrders) {
        redirectTo('/dashboard.html');
        return;
      }
      await loadOrders();
    });
  }
};
