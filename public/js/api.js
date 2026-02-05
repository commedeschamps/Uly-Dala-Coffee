import { apiBase } from './config.js';
import { getToken } from './token.js';

const normalizeUrl = (path = '') => {
  if (!path) {
    return apiBase;
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (path.startsWith(apiBase)) {
    return path;
  }
  if (path.startsWith('/')) {
    return `${apiBase}${path}`;
  }
  return `${apiBase}/${path}`;
};

const isFormBody = (body) =>
  body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob;

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (error) {
      return null;
    }
  }
  try {
    return await response.text();
  } catch (error) {
    return null;
  }
};

const emitUnauthorized = (message) => {
  try {
    window.dispatchEvent(
      new CustomEvent('auth:unauthorized', {
        detail: { message },
      })
    );
  } catch (error) {
    // Ignore when CustomEvent isn't available.
  }
};

export const fetchJSON = async (path, options = {}) => {
  const url = normalizeUrl(path);
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token && !options.skipAuth) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body && !isFormBody(options.body) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (error) {
    throw new Error('Network error. Please check your connection.');
  }

  const data = await parseResponse(response);

  if (response.status === 401 && !options.skipAuth && !options.skipUnauthorized) {
    const message = typeof data === 'string' ? data : data?.message;
    emitUnauthorized(message || 'Session expired. Please sign in again.');
  }

  if (!response.ok) {
    const message =
      typeof data === 'string'
        ? data
        : data?.message || data?.error || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data ?? {};
};
