import {
  registerForm,
  loginForm,
  forgotPasswordForm,
  resetPasswordForm,
  profileForm,
  loginCard,
  registerCard,
  authDivider,
  resetPasswordCard,
  resetPasswordHint,
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
  forgotPasswordMessage,
  resetPasswordMessage,
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
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const resetParams = new URLSearchParams(window.location.search);
const resetTokenFromUrl =
  resetParams.get('mode') === 'reset' ? (resetParams.get('token') || '').trim() : '';

const getSubmitButton = (form) => form?.querySelector('button[type="submit"]');

const setupResetModeUI = () => {
  if (!onAuth) {
    return;
  }
  const isResetMode = Boolean(resetTokenFromUrl);
  const authGrid = document.querySelector('.auth-grid--stacked');

  if (resetPasswordCard) {
    resetPasswordCard.classList.toggle('is-hidden', !isResetMode);
  }
  if (loginCard) {
    loginCard.classList.toggle('is-hidden', isResetMode);
  }
  if (registerCard) {
    registerCard.classList.toggle('is-hidden', isResetMode);
  }
  if (authDivider) {
    authDivider.classList.toggle('is-hidden', isResetMode);
  }
  if (isResetMode && resetPasswordHint) {
    resetPasswordHint.textContent = 'Set your new password to continue.';
  }
  if (authGrid) {
    authGrid.classList.toggle('is-reset', isResetMode);
  }
};

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
  setupResetModeUI();

  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      setFormMessage(forgotPasswordMessage, { message: '' });

      const formData = new FormData(forgotPasswordForm);
      const email = formData.get('email')?.toString().trim();

      if (!email || !emailPattern.test(email)) {
        setFormMessage(forgotPasswordMessage, {
          message: 'Enter a valid email address.',
          state: 'error',
        });
        return;
      }

      const submitButton = getSubmitButton(forgotPasswordForm);
      setButtonBusy(submitButton, true, 'Sending...');

      try {
        const data = await fetchJSON('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email }),
          skipAuth: true,
          skipUnauthorized: true,
        });
        setFormMessage(forgotPasswordMessage, {
          message:
            data.message || 'If this email exists, you will receive a password reset link shortly.',
          state: 'success',
        });
        showToast({
          type: 'info',
          title: 'Check your inbox',
          message: 'If your account exists, we sent a reset link.',
        });
      } catch (error) {
        setFormMessage(forgotPasswordMessage, {
          message: error.message || 'Unable to send reset email.',
          state: 'error',
        });
        showToast({
          type: 'error',
          title: 'Request failed',
          message: error.message || 'Please try again.',
        });
      } finally {
        setButtonBusy(submitButton, false);
      }
    });
  }

  if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      setFormMessage(resetPasswordMessage, { message: '' });

      if (!resetTokenFromUrl) {
        setFormMessage(resetPasswordMessage, {
          message: 'Reset token is missing. Open the link from your email again.',
          state: 'error',
        });
        return;
      }

      const formData = new FormData(resetPasswordForm);
      const password = formData.get('password')?.toString() || '';
      const passwordConfirm = formData.get('passwordConfirm')?.toString() || '';

      if (!passwordPattern.test(password)) {
        setFormMessage(resetPasswordMessage, {
          message: 'Password must be at least 8 characters and include a number.',
          state: 'error',
        });
        return;
      }

      if (password !== passwordConfirm) {
        setFormMessage(resetPasswordMessage, {
          message: 'Passwords do not match.',
          state: 'error',
        });
        return;
      }

      const submitButton = getSubmitButton(resetPasswordForm);
      setButtonBusy(submitButton, true, 'Resetting...');

      try {
        const data = await fetchJSON(`/auth/reset-password/${encodeURIComponent(resetTokenFromUrl)}`, {
          method: 'POST',
          body: JSON.stringify({ password, passwordConfirm }),
          skipAuth: true,
          skipUnauthorized: true,
        });

        if (data.token) {
          setToken(data.token);
        }
        updateUserUI(data.user || null);

        setFormMessage(resetPasswordMessage, {
          message: 'Password updated successfully.',
          state: 'success',
        });
        showToast({
          type: 'info',
          title: 'Password reset',
          message: 'You are now signed in.',
        });
        resetPasswordForm.reset();

        if (onAuth) {
          redirectTo('/account.html');
        }
      } catch (error) {
        setFormMessage(resetPasswordMessage, {
          message: error.message || 'Unable to reset password.',
          state: 'error',
        });
        showToast({
          type: 'error',
          title: 'Reset failed',
          message: error.message || 'Please request a new reset link.',
        });
      } finally {
        setButtonBusy(submitButton, false);
      }
    });
  }

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
      const passwordValid = passwordPattern.test(password);
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
