// views/public/homeView.js
import { productService } from '../../services/index.js';
import { formatUtils } from '../../utils/utils.js';
import { cartService } from '../../services/index.js';
import { showToast } from '../../core/app.js';

export async function render(container) {
  container.innerHTML = `<div class="loading-screen"><div class="loading-spinner"></div></div>`;
  const products = await productService.getProducts();
  const featured = products.filter(p => p.featured).slice(0, 6);

  container.innerHTML = '';

  // Hero
  const hero = document.createElement('section');
  hero.className = 'hero animate-fade-up';
  hero.innerHTML = `
    <div class="hero__eyebrow">🛒 DaniMarvis Shop — Ecommerce Vanilla JS</div>
    <h1 class="hero__title">Descubre nuestros <span>productos más vendidos</span></h1>
    <p class="hero__desc">Catálogo completo con carrito, checkout, seguimiento de pedidos y panel admin. Todo funciona con IndexedDB, sin backend.</p>
    <div class="hero__actions">
      <a href="#/catalog" class="btn btn--primary btn--lg">Ver Catálogo Completo</a>
      <a href="#/admin/login" class="btn btn--outline btn--lg" style="color:#fff;border-color:rgba(255,255,255,0.3)">Panel Admin</a>
    </div>`;
  container.appendChild(hero);

  // Category pills
  const cats = [...new Set(products.map(p => p.category))];
  const catSection = document.createElement('section');
  catSection.style.marginBottom = 'var(--space-8)';
  catSection.innerHTML = `
    <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;">
      ${cats.map(c => `<a href="#/catalog?cat=${encodeURIComponent(c)}" class="badge badge--slate" style="cursor:pointer;padding:6px 14px;font-size:var(--fs-xs)">${c}</a>`).join('')}
    </div>`;
  container.appendChild(catSection);

  // Featured heading
  const headWrap = document.createElement('div');
  headWrap.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-5)';
  headWrap.innerHTML = `
    <div>
      <h2 class="section-heading">Productos Destacados</h2>
      <p class="section-subheading">Los favoritos de nuestros clientes</p>
    </div>
    <a href="#/catalog" class="btn btn--outline btn--sm">Ver todos →</a>`;
  container.appendChild(headWrap);

  // Product grid
  const grid = document.createElement('div');
  grid.className = 'product-grid';
  featured.forEach((product, i) => {
    const card = buildProductCard(product, i);
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

export function buildProductCard(product, index = 0) {
  const card = document.createElement('article');
  card.className = `product-card animate-fade-up delay-${Math.min(index + 1, 6)}`;
  card.style.opacity = '0';

  const stockClass = product.stock === 0 ? 'no-stock' : product.stock <= 5 ? 'low-stock' : '';

  card.innerHTML = `
    <div class="product-card__image-wrap">
      <img class="product-card__image" src="${product.imageUrl}" alt="${product.title}" loading="lazy" />
    </div>
    <div class="product-card__body">
      <span class="product-card__category">${product.category}</span>
      <h3 class="product-card__title">${product.title}</h3>
      <div>
        <span class="product-card__stars">${formatUtils.renderStars(product.rating)}</span>
        <span class="product-card__rating-count">(${product.rating})</span>
      </div>
      ${product.stock <= 5 && product.stock > 0 ? `<span class="product-card__stock-badge">¡Solo quedan ${product.stock}!</span>` : ''}
      <div class="product-card__footer">
        <span class="product-card__price">${formatUtils.formatPrice(product.price)}</span>
        ${product.stock > 0 ? `<button class="product-card__add-btn" title="Agregar al carrito" data-id="${product.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>` : `<span class="badge badge--red" style="font-size:10px">Agotado</span>`}
      </div>
    </div>`;

  // Navigate to detail on card click
  card.addEventListener('click', (e) => {
    if (e.target.closest('.product-card__add-btn')) return;
    window.location.hash = `#/product/${product.id}`;
  });

  // Add to cart button
  card.querySelector('.product-card__add-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const res = cartService.addToCart(product);
    if (res.success) showToast(`Añadido: "${product.title.substring(0,30)}..."`);
    else showToast(res.message, 'error');
  });

  return card;
}
