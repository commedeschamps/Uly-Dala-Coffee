import { drinksList, dessertsList } from './dom.js';
import { fetchJSON } from './api.js';
import { addToCart } from './cart.js';
import { showCartToast, setStatusMessage } from './ui.js';
import { formatCurrency } from './utils.js';

const fallbackImage = '/images/latte.jpeg';
const dropdownSelector = '.size-select';
let dropdownEventsBound = false;
let menuTabsBound = false;

const menuCardSelector = '.menu-card';
const menuTabSelector = 'input[name="menu-tabs"]';

const setMenuView = (view = 'all') => {
  const menuCard = document.querySelector(menuCardSelector);
  if (!menuCard) return;
  menuCard.setAttribute('data-view', view);
};

const bindMenuTabs = () => {
  if (menuTabsBound) return;
  menuTabsBound = true;

  const menuCard = document.querySelector(menuCardSelector);
  if (!menuCard) return;

  const tabInputs = Array.from(menuCard.querySelectorAll(menuTabSelector));
  tabInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (input.checked) {
        setMenuView(input.value);
      }
    });
  });

  const selected = tabInputs.find((input) => input.checked);
  if (selected) {
    setMenuView(selected.value);
  }
};

const setTabCount = (id, value) => {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = String(value);
  }
};

const updateMenuTabCounts = ({ drinksCount = 0, dessertsCount = 0 } = {}) => {
  setTabCount('tabAllCount', drinksCount + dessertsCount);
  setTabCount('tabDrinksCount', drinksCount);
  setTabCount('tabDessertsCount', dessertsCount);
};

const setSizeDropdownOpenState = (dropdown, isOpen) => {
  if (!dropdown) return;
  dropdown.classList.toggle('is-open', Boolean(isOpen));
  const trigger = dropdown.querySelector('.selected');
  if (trigger) {
    trigger.setAttribute('aria-expanded', String(Boolean(isOpen)));
  }
  const card = dropdown.closest('.product-card');
  if (card) {
    card.classList.toggle('is-dropdown-open', Boolean(isOpen));
  }
};

const closeAllSizeDropdowns = (except = null) => {
  document.querySelectorAll(`${dropdownSelector}.is-open`).forEach((dropdown) => {
    if (except && dropdown === except) return;
    setSizeDropdownOpenState(dropdown, false);
  });
};

const bindSizeDropdownEvents = () => {
  if (dropdownEventsBound) return;
  dropdownEventsBound = true;

  document.addEventListener('click', (event) => {
    if (!event.target.closest(dropdownSelector)) {
      closeAllSizeDropdowns();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAllSizeDropdowns();
    }
  });
};

const formatSizeLabel = (label) => {
  if (!label) {
    return '';
  }
  const text = String(label);
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const resolveImageUrl = (url) => {
  if (typeof url !== 'string') {
    return fallbackImage;
  }
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
    return url;
  }
  return fallbackImage;
};

const createProductCard = (product, container) => {
  const card = document.createElement('div');
  card.className = 'product-card';

  const image = document.createElement('img');
  image.src = resolveImageUrl(product.imageUrl);
  image.alt = product.name || 'Menu item';
  image.loading = 'lazy';
  image.addEventListener('error', () => {
    image.src = fallbackImage;
  });

  const body = document.createElement('div');
  body.className = 'product-body';

  const title = document.createElement('h4');
  title.className = 'product-title';
  title.textContent = product.name || 'Menu item';

  const desc = document.createElement('p');
  desc.className = 'product-desc';
  desc.textContent = product.description || 'No description available.';

  const meta = document.createElement('div');
  meta.className = 'product-meta';

  const priceEl = document.createElement('span');
  priceEl.className = 'product-price';

  const category = document.createElement('span');
  category.textContent = product.category || 'House selection';

  meta.appendChild(priceEl);
  meta.appendChild(category);

  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const hasSizes = sizes.length > 0;
  const defaultSize = hasSizes ? sizes[0].label : 'medium';
  const defaultPrice = hasSizes
    ? sizes[0].price
    : product.basePrice ?? product.price ?? 0;

  priceEl.textContent = formatCurrency(defaultPrice);

  let selectedSizeValue = defaultSize;
  let sizeLabel = null;
  if (hasSizes) {
    sizeLabel = document.createElement('label');
    sizeLabel.className = 'size-field';
    sizeLabel.textContent = 'Size';

    const sizeSelect = document.createElement('div');
    sizeSelect.className = 'size-select';
    sizeSelect.setAttribute('role', 'combobox');
    sizeSelect.setAttribute('aria-haspopup', 'listbox');

    const selected = document.createElement('button');
    selected.type = 'button';
    selected.className = 'selected';
    selected.setAttribute('aria-expanded', 'false');
    selected.setAttribute('aria-label', 'Select size');
    selected.innerHTML = `
      <span class="selected-value">${formatSizeLabel(defaultSize)}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="1em"
        viewBox="0 0 512 512"
        class="arrow"
        aria-hidden="true"
      >
        <path
          d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
        ></path>
      </svg>
    `;

    const options = document.createElement('div');
    options.className = 'options';
    options.setAttribute('role', 'listbox');

    const selectSize = (size) => {
      selectedSizeValue = size.label;
      priceEl.textContent = formatCurrency(size.price);

      const selectedValue = selected.querySelector('.selected-value');
      if (selectedValue) {
        selectedValue.textContent = formatSizeLabel(size.label);
      }

      options.querySelectorAll('.option').forEach((option) => {
        const isSelected = option.dataset.value === size.label;
        option.classList.toggle('is-selected', isSelected);
        option.setAttribute('aria-selected', String(isSelected));
      });
    };

    sizes.forEach((size, index) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'option';
      option.dataset.value = size.label;
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', String(index === 0));
      option.textContent = formatSizeLabel(size.label);
      if (index === 0) {
        option.classList.add('is-selected');
      }

      option.addEventListener('click', () => {
        selectSize(size);
        setSizeDropdownOpenState(sizeSelect, false);
      });

      options.appendChild(option);
    });

    selected.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const willOpen = !sizeSelect.classList.contains('is-open');
      closeAllSizeDropdowns(sizeSelect);
      if (willOpen) {
        setSizeDropdownOpenState(sizeSelect, true);
      } else {
        setSizeDropdownOpenState(sizeSelect, false);
      }
    });

    sizeSelect.addEventListener('keydown', (event) => {
      const currentIndex = sizes.findIndex((size) => size.label === selectedSizeValue);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % sizes.length : 0;
        selectSize(sizes[nextIndex]);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        const nextIndex = currentIndex <= 0 ? sizes.length - 1 : currentIndex - 1;
        selectSize(sizes[nextIndex]);
        return;
      }
      if (event.key === 'Escape') {
        setSizeDropdownOpenState(sizeSelect, false);
      }
    });

    sizeSelect.appendChild(selected);
    sizeSelect.appendChild(options);
    sizeLabel.appendChild(sizeSelect);
  }

  const button = document.createElement('button');
  button.className = 'wooden-cart-button';
  button.type = 'button';
  button.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A.996.996 0 0 0 21.42 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"></path>
    </svg>
    <span class="button-text">Add to cart</span>
  `;

  button.addEventListener('click', () => {
    const selectedSize = selectedSizeValue;
    const matched = sizes.find((size) => size.label === selectedSize);
    const unitPrice = matched ? matched.price : defaultPrice;
    addToCart({
      product: product._id,
      name: product.name || 'Menu item',
      size: selectedSize,
      unitPrice,
      quantity: 1,
    });
    const displaySize = hasSizes ? formatSizeLabel(selectedSize) : '';
    showCartToast({
      name: `${product.name || 'Menu item'}${displaySize ? ` (${displaySize})` : ''}`,
      price: formatCurrency(unitPrice),
    });
  });

  body.appendChild(title);
  body.appendChild(desc);
  body.appendChild(meta);
  if (sizeLabel) {
    body.appendChild(sizeLabel);
  }
  body.appendChild(button);

  card.appendChild(image);
  card.appendChild(body);
  container.appendChild(card);
};

export const loadProducts = async () => {
  if (!drinksList || !dessertsList) {
    return;
  }

  bindSizeDropdownEvents();
  bindMenuTabs();

  setStatusMessage(drinksList, { state: 'loading', message: 'Loading drinks...' });
  setStatusMessage(dessertsList, { state: 'loading', message: 'Loading desserts...' });

  const dessertKeywords = ['dessert', 'pastry', 'bakery', 'sweet', 'cake'];

  try {
    const data = await fetchJSON('/products?available=true');
    const products = data.products || [];

    const desserts = products.filter((product) => {
      const category = (product.category || '').toLowerCase();
      return dessertKeywords.some((keyword) => category.includes(keyword));
    });

    const drinks = products.filter((product) => !desserts.includes(product));
    updateMenuTabCounts({ drinksCount: drinks.length, dessertsCount: desserts.length });

    drinksList.innerHTML = '';
    dessertsList.innerHTML = '';

    if (!drinks.length) {
      setStatusMessage(drinksList, {
        state: 'empty',
        message: 'No drinks available yet.',
      });
    } else {
      drinks.forEach((product) => createProductCard(product, drinksList));
    }

    if (!desserts.length) {
      setStatusMessage(dessertsList, {
        state: 'empty',
        message: 'No desserts available yet.',
      });
    } else {
      desserts.forEach((product) => createProductCard(product, dessertsList));
    }
  } catch (error) {
    updateMenuTabCounts({ drinksCount: 0, dessertsCount: 0 });
    setStatusMessage(drinksList, {
      state: 'error',
      message: error.message || 'Unable to load menu right now.',
    });
    setStatusMessage(dessertsList, {
      state: 'error',
      message: 'Please refresh to try again.',
    });
  }
};
