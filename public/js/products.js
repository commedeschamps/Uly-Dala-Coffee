import { apiBase } from './config.js';
import { drinksList, dessertsList } from './dom.js';
import { fetchJSON } from './api.js';
import { addToCart } from './cart.js';
import { showCartToast } from './ui.js';
import { formatCurrency } from './utils.js';

const renderProductCard = (product, container) => {
  const card = document.createElement('div');
  card.className = 'product-card';

  const sizes = product.sizes || [];
  const hasSizes = sizes.length > 0;
  const defaultSize = hasSizes ? sizes[0].label : 'medium';
  const defaultPrice = hasSizes
    ? sizes[0].price
    : product.basePrice ?? product.price ?? 0;

  card.innerHTML = `
    <img src="${product.imageUrl}" alt="${product.name}" loading="lazy" />
    <div class="product-body">
      <h4 class="product-title">${product.name}</h4>
      <p class="product-desc">${product.description || ''}</p>
      <div class="product-meta">
        <span class="product-price">${formatCurrency(defaultPrice)}</span>
        <span>${product.category}</span>
      </div>
      ${
        hasSizes
          ? `<label>
              Size
              <select class="size-select">
                ${sizes
                  .map((size) => `<option value="${size.label}">${size.label}</option>`)
                  .join('')}
              </select>
            </label>`
          : ''
      }
      <button class="wooden-cart-button" type="button">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <g id="cart">
            <circle r="1.91" cy="20.59" cx="10.07"></circle>
            <circle r="1.91" cy="20.59" cx="18.66"></circle>
            <path d="M.52,1.5H3.18a2.87,2.87,0,0,1,2.74,2L9.11,13.91H8.64A2.39,2.39,0,0,0,6.25,16.3h0a2.39,2.39,0,0,0,2.39,2.38h10"></path>
            <polyline points="7.21 5.32 22.48 5.32 22.48 7.23 20.57 13.91 9.11 13.91"></polyline>
          </g>
        </svg>
        <span class="button-text">Add to cart</span>
      </button>
    </div>
  `;

  const priceEl = card.querySelector('.product-price');
  const sizeSelect = card.querySelector('.size-select');
  if (sizeSelect) {
    sizeSelect.addEventListener('change', () => {
      const selected = sizes.find((size) => size.label === sizeSelect.value);
      if (selected) {
        priceEl.textContent = formatCurrency(selected.price);
      }
    });
  }

  const addBtn = card.querySelector('.wooden-cart-button');
  addBtn.addEventListener('click', () => {
    const selectedSize = sizeSelect ? sizeSelect.value : defaultSize;
    const matched = sizes.find((size) => size.label === selectedSize);
    const unitPrice = matched ? matched.price : defaultPrice;
    addToCart({
      product: product._id,
      name: product.name,
      size: selectedSize,
      unitPrice,
      quantity: 1,
    });
    const displaySize = sizeSelect ? selectedSize : '';
    showCartToast({
      name: `${product.name}${displaySize ? ` (${displaySize})` : ''}`,
      price: formatCurrency(unitPrice),
    });
  });

  container.appendChild(card);
};

export const loadProducts = async () => {
  if (!drinksList || !dessertsList) {
    return;
  }
  drinksList.innerHTML = '';
  dessertsList.innerHTML = '';

  const dessertKeywords = ['dessert', 'pastry', 'bakery', 'sweet', 'cake'];

  try {
    const data = await fetchJSON(`${apiBase}/products?available=true`);
    const products = data.products || [];

    const desserts = products.filter((product) => {
      const category = (product.category || '').toLowerCase();
      return dessertKeywords.some((keyword) => category.includes(keyword));
    });

    const drinks = products.filter((product) => !desserts.includes(product));

    if (!drinks.length) {
      drinksList.innerHTML = '<p>No drinks available yet.</p>';
    } else {
      drinks.forEach((product) => renderProductCard(product, drinksList));
    }

    if (!desserts.length) {
      dessertsList.innerHTML = '<p>No desserts available yet.</p>';
    } else {
      desserts.forEach((product) => renderProductCard(product, dessertsList));
    }
  } catch (error) {
    drinksList.innerHTML = `<p>${error.message}</p>`;
  }
};
