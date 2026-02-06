const NAVIGATION_DELAY_MS = 180;
let hasNavigationBinding = false;
let pendingNavigationTimer = null;

const isModifiedClick = (event) =>
  event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

const shouldSkipAnchorInterception = (anchor, event) => {
  if (!anchor || event.defaultPrevented) {
    return true;
  }
  if (event.button !== 0 || isModifiedClick(event)) {
    return true;
  }
  if (anchor.hasAttribute('download') || anchor.dataset.noTransition === 'true') {
    return true;
  }
  const targetAttr = anchor.getAttribute('target');
  if (targetAttr && targetAttr !== '_self') {
    return true;
  }
  const href = anchor.getAttribute('href') || '';
  if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
    return true;
  }
  if (href.startsWith('#')) {
    return true;
  }
  return false;
};

export const redirectTo = (target, options = {}) => {
  if (!target) {
    return;
  }
  const { replace = false, instant = false } = options;
  const nextUrl = new URL(target, window.location.href);
  if (nextUrl.href === window.location.href) {
    return;
  }

  const navigate = () => {
    if (replace) {
      window.location.replace(nextUrl.href);
    } else {
      window.location.assign(nextUrl.href);
    }
  };

  const supportsNativeViewTransition =
    typeof document !== 'undefined' &&
    typeof document.startViewTransition === 'function';

  if (supportsNativeViewTransition || instant) {
    navigate();
    return;
  }

  document.documentElement.classList.add('is-route-changing');
  if (pendingNavigationTimer) {
    window.clearTimeout(pendingNavigationTimer);
  }
  pendingNavigationTimer = window.setTimeout(navigate, NAVIGATION_DELAY_MS);
};

export const bindNavigationTransitions = () => {
  if (hasNavigationBinding) {
    return;
  }
  hasNavigationBinding = true;

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[href]');
    if (shouldSkipAnchorInterception(anchor, event)) {
      return;
    }

    const nextUrl = new URL(anchor.getAttribute('href'), window.location.href);
    if (nextUrl.origin !== window.location.origin) {
      return;
    }
    const isSameDocumentAnchor =
      nextUrl.pathname === window.location.pathname &&
      nextUrl.search === window.location.search &&
      Boolean(nextUrl.hash);
    if (isSameDocumentAnchor) {
      return;
    }

    event.preventDefault();
    redirectTo(nextUrl.href);
  });

  window.addEventListener('pageshow', () => {
    document.documentElement.classList.remove('is-route-changing');
  });
};
