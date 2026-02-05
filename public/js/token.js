import { tokenKey } from './config.js';
import { setTokenState } from './state.js';

export const getToken = () => {
  try {
    return localStorage.getItem(tokenKey);
  } catch (error) {
    return null;
  }
};

export const setToken = (token) => {
  try {
    localStorage.setItem(tokenKey, token);
  } catch (error) {
    // Ignore storage errors in private mode.
  }
  setTokenState(token);
};

export const clearToken = () => {
  try {
    localStorage.removeItem(tokenKey);
  } catch (error) {
    // Ignore storage errors in private mode.
  }
  setTokenState(null);
};
