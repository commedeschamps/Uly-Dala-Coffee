const NAVIGATION_DELAY_MS = 180;
const MOBILE_NAV_QUERY = '(max-width: 900px)';
let hasNavigationBinding = false;
let hasMobileNavigationBinding = false;
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

const bindMediaChange = (mediaQueryList, handler) => {
  if (typeof mediaQueryList.addEventListener === 'function') {
    mediaQueryList.addEventListener('change', handler);
    return;
  }
  if (typeof mediaQueryList.addListener === 'function') {
    mediaQueryList.addListener(handler);
  }
};

export const setupMobileNavigation = () => {
  if (hasMobileNavigationBinding) {
    return;
  }
  hasMobileNavigationBinding = true;

  const nav = document.querySelector('.top-nav.nav-modern');
  const navShell = nav?.querySelector('.nav-shell');
  const navLinks = navShell?.querySelector('.nav-links');
  const navActions = navShell?.querySelector('.nav-actions');
  const brand = navShell?.querySelector('.brand');

  if (!nav || !navShell || !navLinks || !navActions || !brand) {
    return;
  }

  const mobileQuery = window.matchMedia(MOBILE_NAV_QUERY);
  nav.classList.add('has-mobile-nav');

  let toggle = navShell.querySelector('[data-nav-toggle]');
  if (!toggle) {
    toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-toggle';
    toggle.dataset.navToggle = 'true';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    toggle.innerHTML = `
      <span class="nav-toggle__bars" aria-hidden="true"></span>
      <span class="nav-toggle__label">Menu</span>
    `;
    brand.insertAdjacentElement('afterend', toggle);
  }

  const syncOpenState = (isOpen) => {
    nav.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    document.documentElement.classList.toggle('mobile-nav-open', isOpen);
  };

  const closeMenu = () => syncOpenState(false);
  const toggleMenu = () => syncOpenState(!nav.classList.contains('is-open'));

  const handleViewportChange = (event) => {
    if (!event.matches) {
      closeMenu();
    }
  };

  toggle.addEventListener('click', toggleMenu);
  bindMediaChange(mobileQuery, handleViewportChange);

  nav.addEventListener('click', (event) => {
    if (!mobileQuery.matches || !nav.classList.contains('is-open')) {
      return;
    }
    const navTarget = event.target.closest('.nav-links a[href], .nav-actions a[href], #logoutBtn, #refreshOrders');
    if (navTarget) {
      closeMenu();
    }
  });

  document.addEventListener('click', (event) => {
    if (!mobileQuery.matches || !nav.classList.contains('is-open')) {
      return;
    }
    if (nav.contains(event.target)) {
      return;
    }
    closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      closeMenu();
    }
  });

  if (!mobileQuery.matches) {
    closeMenu();
  }
};
