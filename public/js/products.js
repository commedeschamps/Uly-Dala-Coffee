import { drinksList, dessertsList } from './dom.js';
import { fetchJSON } from './api.js';
import { addToCart } from './cart.js';
import { showCartToast, setStatusMessage } from './ui.js';
import { formatCurrency } from './utils.js';

const fallbackImage = '/images/latte.jpeg';

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

  let sizeSelect = null;
  let sizeLabel = null;
  if (hasSizes) {
    sizeLabel = document.createElement('label');
    sizeLabel.textContent = 'Size';

    sizeSelect = document.createElement('select');
    sizeSelect.className = 'size-select';

    sizes.forEach((size) => {
      const option = document.createElement('option');
      option.value = size.label;
      option.textContent = formatSizeLabel(size.label);
      sizeSelect.appendChild(option);
    });

    sizeSelect.addEventListener('change', () => {
      const selected = sizes.find((size) => size.label === sizeSelect.value);
      if (selected) {
        priceEl.textContent = formatCurrency(selected.price);
      }
    });

    sizeLabel.appendChild(sizeSelect);
  }

  const button = document.createElement('button');
  button.className = 'wooden-cart-button';
  button.type = 'button';
  button.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <g id="cart">
        <circle r="1.91" cy="20.59" cx="10.07"></circle>
        <circle r="1.91" cy="20.59" cx="18.66"></circle>
        <path d="M.52,1.5H3.18a2.87,2.87,0,0,1,2.74,2L9.11,13.91H8.64A2.39,2.39,0,0,0,6.25,16.3h0a2.39,2.39,0,0,0,2.39,2.38h10"></path>
        <polyline points="7.21 5.32 22.48 5.32 22.48 7.23 20.57 13.91 9.11 13.91"></polyline>
      </g>
    </svg>
    <span class="button-text">Add to cart</span>
  `;

  button.addEventListener('click', () => {
    const selectedSize = sizeSelect ? sizeSelect.value : defaultSize;
    const matched = sizes.find((size) => size.label === selectedSize);
    const unitPrice = matched ? matched.price : defaultPrice;
    addToCart({
      product: product._id,
      name: product.name || 'Menu item',
      size: selectedSize,
      unitPrice,
      quantity: 1,
    });
    const displaySize = sizeSelect ? selectedSize : '';
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
