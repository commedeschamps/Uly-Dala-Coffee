const state = {
  user: null,
  token: null,
  cart: [],
  orders: [],
};

const listeners = new Set();

const notify = () => {
  const snapshot = { ...state };
  listeners.forEach((listener) => listener(snapshot));
};

export const getState = () => ({ ...state });

export const setState = (patch = {}) => {
  Object.assign(state, patch);
  notify();
};

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getActiveUser = () => state.user;
export const setActiveUser = (user) => setState({ user });

export const getTokenState = () => state.token;
export const setTokenState = (token) => setState({ token });

export const getCartState = () => state.cart;
export const setCartState = (cart = []) => setState({ cart });

export const getOrdersState = () => state.orders;
export const setOrdersState = (orders = []) => setState({ orders });
