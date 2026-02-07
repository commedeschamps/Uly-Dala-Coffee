import { redirectTo } from './navigation.js';

const GITHUB_REPO_URL = 'https://github.com/commedeschamps/Uly-Dala-Coffee';
const GITHUB_REPO_API_URL = 'https://api.github.com/repos/commedeschamps/Uly-Dala-Coffee';
const DEFAULT_GITHUB_STARS = 11;

const formatGithubStars = (value) => {
  if (!Number.isFinite(value) || value < 0) {
    return String(DEFAULT_GITHUB_STARS);
  }
  return new Intl.NumberFormat('en-US').format(Math.trunc(value));
};

const hydrateGithubStars = async (valueEl, countEl) => {
  if (!valueEl || !countEl || typeof fetch !== 'function') {
    return;
  }
  try {
    const response = await fetch(GITHUB_REPO_API_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    });
    if (!response.ok) {
      return;
    }
    const payload = await response.json();
    const stars = Number(payload?.stargazers_count);
    if (!Number.isFinite(stars) || stars < 0) {
      return;
    }
    const formatted = formatGithubStars(stars);
    valueEl.textContent = formatted;
    countEl.setAttribute('aria-label', `${formatted} stars`);
  } catch (error) {
    // Ignore network and rate-limit errors, keep fallback value.
  }
};

export const mountGithubStarButton = () => {
  if (document.querySelector('.github-star-link')) {
    return;
  }
  const footerActions = document.querySelector('.footer-banner__actions');
  const footerMeta = document.querySelector('.footer-meta');
  const navActions = document.querySelector('.nav-actions');
  const mountPoint = footerActions || footerMeta || navActions;
  if (!mountPoint) {
    return;
  }

  const link = document.createElement('a');
  link.className = 'github-star-link';
  if (mountPoint === footerActions || mountPoint === footerMeta) {
    link.classList.add('github-star-link--footer');
  }
  link.href = GITHUB_REPO_URL;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.dataset.noTransition = 'true';
  link.setAttribute('aria-label', 'Star this project on GitHub');

  link.innerHTML = `
    <span class="github-star-link__label">
      <svg class="github-star-link__icon" viewBox="0 0 438.549 438.549" aria-hidden="true" focusable="false">
        <path d="M409.132 114.573c-19.608-33.596-46.205-60.194-79.798-79.8-33.598-19.607-70.277-29.408-110.063-29.408-39.781 0-76.472 9.804-110.063 29.408-33.596 19.605-60.192 46.204-79.8 79.8C9.803 148.168 0 184.854 0 224.63c0 47.78 13.94 90.745 41.827 128.906 27.884 38.164 63.906 64.572 108.063 79.227 5.14.954 8.945.283 11.419-1.996 2.475-2.282 3.711-5.14 3.711-8.562 0-.571-.049-5.708-.144-15.417a2549.81 2549.81 0 01-.144-25.406l-6.567 1.136c-4.187.767-9.469 1.092-15.846 1-6.374-.089-12.991-.757-19.842-1.999-6.854-1.231-13.229-4.086-19.13-8.559-5.898-4.473-10.085-10.328-12.56-17.556l-2.855-6.57c-1.903-4.374-4.899-9.233-8.992-14.559-4.093-5.331-8.232-8.945-12.419-10.848l-1.999-1.431c-1.332-.951-2.568-2.098-3.711-3.429-1.142-1.331-1.997-2.663-2.568-3.997-.572-1.335-.098-2.43 1.427-3.289 1.525-.859 4.281-1.276 8.28-1.276l5.708.853c3.807.763 8.516 3.042 14.133 6.851 5.614 3.806 10.229 8.754 13.846 14.842 4.38 7.806 9.657 13.754 15.846 17.847 6.184 4.093 12.419 6.136 18.699 6.136 6.28 0 11.704-.476 16.274-1.423 4.565-.952 8.848-2.383 12.847-4.285 1.713-12.758 6.377-22.559 13.988-29.41-10.848-1.14-20.601-2.857-29.264-5.14-8.658-2.286-17.605-5.996-26.835-11.14-9.235-5.137-16.896-11.516-22.985-19.126-6.09-7.614-11.088-17.61-14.987-29.979-3.901-12.374-5.852-26.648-5.852-42.826 0-23.035 7.52-42.637 22.557-58.817-7.044-17.318-6.379-36.732 1.997-58.24 5.52-1.715 13.706-.428 24.554 3.853 10.85 4.283 18.794 7.952 23.84 10.994 5.046 3.041 9.089 5.618 12.135 7.708 17.705-4.947 35.976-7.421 54.818-7.421s37.117 2.474 54.823 7.421l10.849-6.849c7.419-4.57 16.18-8.758 26.262-12.565 10.088-3.805 17.802-4.853 23.134-3.138 8.562 21.509 9.325 40.922 2.279 58.24 15.036 16.18 22.559 35.787 22.559 58.817 0 16.178-1.958 30.497-5.853 42.966-3.9 12.471-8.941 22.457-15.125 29.979-6.191 7.521-13.901 13.85-23.131 18.986-9.232 5.14-18.182 8.85-26.84 11.136-8.662 2.286-18.415 4.004-29.263 5.146 9.894 8.562 14.842 22.077 14.842 40.539v60.237c0 3.422 1.19 6.279 3.572 8.562 2.379 2.279 6.136 2.95 11.276 1.995 44.163-14.653 80.185-41.062 108.068-79.226 27.88-38.161 41.825-81.126 41.825-128.906-.01-39.771-9.818-76.454-29.414-110.049z"></path>
      </svg>
      <span>Star on GitHub</span>
    </span>
    <span class="github-star-link__count" aria-label="${DEFAULT_GITHUB_STARS} stars">
      <svg class="github-star-link__star" data-slot="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path clip-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" fill-rule="evenodd"></path>
      </svg>
      <span class="github-star-link__value" data-github-stars>${formatGithubStars(DEFAULT_GITHUB_STARS)}</span>
    </span>
  `;

  if (mountPoint === navActions) {
    mountPoint.insertBefore(link, mountPoint.firstChild);
  } else if (mountPoint === footerMeta && mountPoint.lastElementChild) {
    mountPoint.insertBefore(link, mountPoint.lastElementChild);
  } else {
    mountPoint.appendChild(link);
  }
  const valueEl = link.querySelector('[data-github-stars]');
  const countEl = link.querySelector('.github-star-link__count');
  hydrateGithubStars(valueEl, countEl);
};

export const setStatusMessage = (container, { state = 'info', message = '' } = {}) => {
  if (!container) {
    return;
  }
  container.innerHTML = '';
  container.dataset.state = state;
  container.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');

  if (!message) {
    return;
  }

  const status = document.createElement('p');
  status.className = `status-message status-message--${state}`;
  status.textContent = message;
  status.setAttribute('role', state === 'error' ? 'alert' : 'status');
  status.setAttribute('aria-live', state === 'error' ? 'assertive' : 'polite');
  container.appendChild(status);
};

export const setFormMessage = (element, { message = '', state = 'info' } = {}) => {
  if (!element) {
    return;
  }
  element.textContent = message;
  element.classList.toggle('is-error', state === 'error');
  element.classList.toggle('is-success', state === 'success');
  element.classList.toggle('is-info', state === 'info');

  if (message) {
    element.setAttribute('role', state === 'error' ? 'alert' : 'status');
    element.setAttribute('aria-live', state === 'error' ? 'assertive' : 'polite');
  } else {
    element.removeAttribute('role');
    element.removeAttribute('aria-live');
  }
};

export const setButtonBusy = (button, isBusy, busyLabel = 'Working...') => {
  if (!button) {
    return;
  }
  if (isBusy) {
    if (!button.dataset.label) {
      button.dataset.label = button.textContent.trim();
    }
    button.textContent = busyLabel;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
  } else {
    if (button.dataset.label) {
      button.textContent = button.dataset.label;
      delete button.dataset.label;
    }
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
};

export const togglePasswordVisibility = (event) => {
  const trigger = event?.currentTarget;
  const field = trigger?.closest('.password-field');
  const input = field?.querySelector('input');

  if (!trigger || !input) {
    return;
  }
  const shouldReveal = input.type === 'password';
  input.type = shouldReveal ? 'text' : 'password';

  if (field) {
    field.classList.toggle('is-visible', shouldReveal);
  }
  trigger.setAttribute('aria-label', shouldReveal ? 'Hide password' : 'Show password');
  trigger.setAttribute('aria-pressed', shouldReveal ? 'true' : 'false');
};

export const bindPasswordToggle = () => {
  const passwordToggles = document.querySelectorAll('[data-password-toggle]');
  if (!passwordToggles.length) return;

  passwordToggles.forEach((toggle) => {
    toggle.setAttribute('aria-label', 'Show password');
    toggle.setAttribute('aria-pressed', 'false');
    toggle.addEventListener('click', togglePasswordVisibility);
  });

  window.togglePasswordVisibility = togglePasswordVisibility;
};

const toastWavePath =
  'M0,256L11.4,240C22.9,224,46,192,69,192C91.4,192,114,224,137,234.7C160,245,183,235,206,213.3C228.6,192,251,160,274,149.3C297.1,139,320,149,343,181.3C365.7,213,389,267,411,282.7C434.3,299,457,277,480,250.7C502.9,224,526,192,549,181.3C571.4,171,594,181,617,208C640,235,663,277,686,256C708.6,235,731,149,754,122.7C777.1,96,800,128,823,165.3C845.7,203,869,245,891,224C914.3,203,937,117,960,112C982.9,107,1006,181,1029,197.3C1051.4,213,1074,171,1097,144C1120,117,1143,107,1166,133.3C1188.6,160,1211,224,1234,218.7C1257.1,213,1280,139,1303,133.3C1325.7,128,1349,192,1371,192C1394.3,192,1417,128,1429,96L1440,64L1440,320L1428.6,320C1417.1,320,1394,320,1371,320C1348.6,320,1326,320,1303,320C1280,320,1257,320,1234,320C1211.4,320,1189,320,1166,320C1142.9,320,1120,320,1097,320C1074.3,320,1051,320,1029,320C1005.7,320,983,320,960,320C937.1,320,914,320,891,320C868.6,320,846,320,823,320C800,320,777,320,754,320C731.4,320,709,320,686,320C662.9,320,640,320,617,320C594.3,320,571,320,549,320C525.7,320,503,320,480,320C457.1,320,434,320,411,320C388.6,320,366,320,343,320C320,320,297,320,274,320C251.4,320,229,320,206,320C182.9,320,160,320,137,320C114.3,320,91,320,69,320C45.7,320,23,320,11,320L0,320Z';

const toastIcons = {
  info: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="0" fill="currentColor" stroke="currentColor" class="toast-icon">
      <path d="M13 7.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-3 3.75a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v4.25h.75a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1 0-1.5h.75V12h-.75a.75.75 0 0 1-.75-.75Z"></path>
      <path d="M12 1c6.075 0 11 4.925 11 11s-4.925 11-11 11S1 18.075 1 12 5.925 1 12 1ZM2.5 12a9.5 9.5 0 0 0 9.5 9.5 9.5 9.5 0 0 0 9.5-9.5A9.5 9.5 0 0 0 12 2.5 9.5 9.5 0 0 0 2.5 12Z"></path>
    </svg>
  `,
  error: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" stroke-width="0" fill="currentColor" stroke="currentColor" class="toast-icon">
      <path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c-9.4 9.4-9.4 24.6 0 33.9l47 47-47 47c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l47-47 47 47c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-47-47 47-47c-9.4-9.4-9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-47 47-47-47c-9.4-9.4-24.6-9.4-33.9 0z"></path>
    </svg>
  `,
};

let toastContainer = null;

const ensureToastContainer = () => {
  if (toastContainer) return toastContainer;
  toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    toastContainer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
};

const removeToast = (toast) => {
  toast.classList.add('is-leaving');
  toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  setTimeout(() => {
    if (toast.isConnected) toast.remove();
  }, 700);
};

export const showToast = ({ type = 'info', title = 'Info message', message = '' } = {}) => {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  const toastType = type === 'error' ? 'error' : 'info';
  toast.className = `toast-card toast-${toastType}`;
  toast.setAttribute('role', toastType === 'error' ? 'alert' : 'status');
  toast.innerHTML = `
    <svg class="toast-wave" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
      <path d="${toastWavePath}" fill-opacity="1"></path>
    </svg>
    <div class="toast-icon-wrap">
      ${toastIcons[toastType]}
    </div>
    <div class="toast-text">
      <p class="toast-title"></p>
      <p class="toast-message"></p>
    </div>
    <button type="button" class="toast-close" aria-label="Dismiss notification">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" stroke-width="0" fill="none" stroke="currentColor">
        <path fill="currentColor" d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" clip-rule="evenodd" fill-rule="evenodd"></path>
      </svg>
    </button>
  `;

  const titleEl = toast.querySelector('.toast-title');
  const messageEl = toast.querySelector('.toast-message');
  const closeBtn = toast.querySelector('.toast-close');

  if (titleEl) titleEl.textContent = title;
  if (messageEl) messageEl.textContent = message;
  if (closeBtn) closeBtn.addEventListener('click', () => removeToast(toast));

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));

  setTimeout(() => removeToast(toast), 4500);
};

let cartToastContainer = null;

const ensureCartToastContainer = () => {
  if (cartToastContainer) return cartToastContainer;
  cartToastContainer = document.getElementById('cartToastContainer');
  if (!cartToastContainer) {
    cartToastContainer = document.createElement('div');
    cartToastContainer.id = 'cartToastContainer';
    cartToastContainer.className = 'cart-toast-container';
    cartToastContainer.setAttribute('aria-live', 'polite');
    cartToastContainer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(cartToastContainer);
  }
  return cartToastContainer;
};

const removeCartToast = (toast) => {
  toast.classList.add('is-leaving');
  toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  setTimeout(() => {
    if (toast.isConnected) toast.remove();
  }, 700);
};

export const showCartToast = ({ name = 'Item', price = '' } = {}) => {
  const container = ensureCartToastContainer();
  const toast = document.createElement('div');
  toast.className = 'cart-toast';
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <svg class="toast-wave" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
      <path d="${toastWavePath}" fill-opacity="1"></path>
    </svg>
    <div class="cart-icon">
      <div class="icon-cart-box">
        <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 576 512">
          <path fill="currentColor" d="M0 24C0 10.7 10.7 0 24 0H69.5c22 0 41.5 12.8 50.6 32h411c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3H170.7l5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5H488c13.3 0 24 10.7 24 24s-10.7 24-24 24H199.7c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5H24C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"></path>
        </svg>
      </div>
    </div>
    <div class="cart-content">
      <div class="cart-title-wrapper">
        <span class="cart-title">Added to cart!</span>
        <button type="button" class="cart-close" aria-label="Dismiss">
          <svg xmlns="http://www.w3.org/2000/svg" height="15" width="15" viewBox="0 0 384 512">
            <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"></path>
          </svg>
        </button>
      </div>
      <div class="cart-product"></div>
      <div class="cart-price"></div>
      <button type="button" class="cart-button">
        View cart
        <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
          <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" clip-rule="evenodd"></path>
        </svg>
      </button>
    </div>
  `;

  const productEl = toast.querySelector('.cart-product');
  const priceEl = toast.querySelector('.cart-price');
  const closeBtn = toast.querySelector('.cart-close');
  const viewBtn = toast.querySelector('.cart-button');

  if (productEl) productEl.textContent = name;
  if (priceEl) {
    if (price) {
      priceEl.textContent = price;
    } else {
      priceEl.remove();
    }
  }
  if (closeBtn) closeBtn.addEventListener('click', () => removeCartToast(toast));
  if (viewBtn) {
    viewBtn.addEventListener('click', () => {
      removeCartToast(toast);
      redirectTo('/checkout.html');
    });
  }

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));

  setTimeout(() => removeCartToast(toast), 5200);
};

export const setupGallerySlider = () => {
  const slider = document.querySelector('[data-gallery]');
  if (!slider) {
    return;
  }
  const track = slider.querySelector('.gallery-track');
  const slides = Array.from(slider.querySelectorAll('.gallery-slide'));
  const prevBtn = document.querySelector('[data-gallery-prev]');
  const nextBtn = document.querySelector('[data-gallery-next]');
  const dots = Array.from(document.querySelectorAll('[data-gallery-dot]'));
  if (!track || !slides.length) {
    return;
  }

  let index = 0;

  const setIndex = (nextIndex) => {
    index = Math.max(0, Math.min(slides.length - 1, nextIndex));
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === index;
      dot.classList.toggle('is-active', isActive);
      if (isActive) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });
    if (prevBtn) {
      prevBtn.disabled = index === 0;
    }
    if (nextBtn) {
      nextBtn.disabled = index === slides.length - 1;
    }
  };

  if (prevBtn) {
    prevBtn.addEventListener('click', () => setIndex(index - 1));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => setIndex(index + 1));
  }
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const targetIndex = Number(dot.dataset.galleryDot || 0);
      setIndex(targetIndex);
    });
  });

  setIndex(0);
};
