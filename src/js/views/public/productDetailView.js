// views/public/productDetailView.js
import { productService, cartService, reviewService, authService } from '../../services/index.js';
import { formatUtils } from '../../utils/utils.js';
import { showToast } from '../../core/app.js';

export async function render(container, { id }) {
  container.innerHTML = `<div class="loading-screen"><div class="loading-spinner"></div></div>`;

  const product = await productService.getProductById(id);
  if (!product) {
    container.innerHTML = `<div class="error-view"><h2>Producto no encontrado</h2><p>El producto con ID "${id}" no existe.</p><br><a href="#/catalog" class="btn btn--primary">Ver Catálogo</a></div>`;
    return;
  }

  const reviews = await reviewService.getReviewsForProduct(id);
  const user = authService.getCurrentUser();

  container.innerHTML = '';

  // Breadcrumb
  const bc = document.createElement('nav');
  bc.className = 'breadcrumb';
  bc.innerHTML = `<a href="#/home">Inicio</a><span class="breadcrumb__sep">/</span><a href="#/catalog">Catálogo</a><span class="breadcrumb__sep">/</span><span>${product.category}</span><span class="breadcrumb__sep">/</span><span>${product.title.substring(0,40)}...</span>`;
  container.appendChild(bc);

  // Product detail section
  const detail = document.createElement('div');
  detail.className = 'product-detail animate-fade-up';

  const stockLabel = product.stock === 0 ? 'no-stock' : product.stock <= 5 ? 'low-stock' : 'in-stock';
  const stockText  = product.stock === 0 ? 'Sin stock' : product.stock <= 5 ? `¡Solo quedan ${product.stock} unidades!` : `En stock (${product.stock} disponibles)`;

  detail.innerHTML = `
    <div class="product-detail__image-wrap">
      <img class="product-detail__image" src="${product.imageUrl}" alt="${product.title}" />
    </div>
    <div class="product-detail__info">
      <span class="badge badge--slate">${product.category}</span>
      <h1 class="product-detail__title">${product.title}</h1>
      <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-3)">
        <span style="color:var(--c-amber-400);font-size:1.1rem;letter-spacing:-1px">${formatUtils.renderStars(product.rating)}</span>
        <span style="font-size:var(--fs-sm);color:var(--c-slate-500)">${product.rating} · ${reviews.length} reseña${reviews.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="product-detail__price">${formatUtils.formatPrice(product.price)}</div>
      <p class="product-detail__desc">${product.description}</p>
      <p class="product-detail__stock ${stockLabel}">${stockText}</p>
      <div id="add-to-cart-section" style="display:flex;gap:var(--space-3);align-items:center;flex-wrap:wrap">
        ${product.stock > 0 ? `
          <div class="qty-stepper" id="qty-stepper">
            <button class="qty-stepper__btn" id="qty-minus">−</button>
            <span class="qty-stepper__value" id="qty-val">1</span>
            <button class="qty-stepper__btn" id="qty-plus">+</button>
          </div>
          <button class="btn btn--primary btn--lg" id="add-cart-btn" style="flex:1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            Agregar al Carrito
          </button>` : `<button class="btn btn--secondary btn--lg" disabled>Sin Stock</button>`}
      </div>
    </div>`;

  container.appendChild(detail);

  // Quantity stepper logic
  let qty = 1;
  const qtyVal = detail.querySelector('#qty-val');
  detail.querySelector('#qty-minus')?.addEventListener('click', () => { if (qty > 1) { qty--; qtyVal.textContent = qty; }});
  detail.querySelector('#qty-plus')?.addEventListener('click', () => { if (qty < product.stock) { qty++; qtyVal.textContent = qty; }});
  detail.querySelector('#add-cart-btn')?.addEventListener('click', () => {
    const res = cartService.addToCart(product, qty);
    if (res.success) showToast(`${qty}x "${product.title.substring(0,25)}..." añadido al carrito`);
    else showToast(res.message, 'error');
  });

  // ── Reviews section ──────────────────────────────────────
  const reviewsSec = document.createElement('section');
  reviewsSec.style.marginTop = 'var(--space-12)';

  reviewsSec.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6)">
      <div>
        <h2 class="section-heading">Reseñas de clientes</h2>
        <p class="section-subheading">${reviews.length} reseña${reviews.length !== 1 ? 's' : ''} · Promedio ${product.rating} ★</p>
      </div>
    </div>
    <div class="card" style="margin-bottom:var(--space-6)">
      <div id="reviews-list">
        ${reviews.length > 0
          ? reviews.map(r => buildReviewCard(r)).join('')
          : `<div class="empty-state"><p class="empty-state__title">Sin reseñas aún</p><p class="empty-state__desc">¡Sé el primero en dejar una reseña!</p></div>`}
      </div>
    </div>`;

  // Review form
  const formCard = document.createElement('div');
  formCard.className = 'card card--padded animate-fade-up delay-3';
  formCard.innerHTML = `
    <h3 style="font-size:var(--fs-lg);font-weight:800;margin-bottom:var(--space-5)">Deja tu reseña</h3>
    ${!user ? `<p style="color:var(--c-slate-500);font-size:var(--fs-base)">
      <a href="#/login" style="color:var(--c-blue-600);font-weight:700">Inicia sesión</a> para dejar una reseña.
    </p>` : `
      <div style="display:flex;flex-direction:column;gap:var(--space-4)">
        <div class="form-group">
          <label class="form-label">Tu valoración</label>
          <div class="stars-input" id="star-input">
            ${[1,2,3,4,5].map(n => `<span class="stars-input__star" data-val="${n}">★</span>`).join('')}
          </div>
          <input type="hidden" id="rating-val" value="0" />
        </div>
        <div class="form-group">
          <label class="form-label">Comentario</label>
          <textarea id="review-comment" class="form-textarea" placeholder="Comparte tu experiencia con este producto..."></textarea>
        </div>
        <div id="review-error" style="color:var(--c-red-600);font-size:var(--fs-sm)"></div>
        <button class="btn btn--primary" id="submit-review">Publicar reseña</button>
      </div>`}`;

  // Star selection
  const stars = formCard.querySelectorAll('.stars-input__star');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.dataset.val);
      formCard.querySelector('#rating-val').value = val;
      stars.forEach((s,i) => s.classList.toggle('active', i < val));
    });
    star.addEventListener('mouseenter', () => {
      const val = parseInt(star.dataset.val);
      stars.forEach((s,i) => s.classList.toggle('active', i < val));
    });
  });
  formCard.querySelector('.stars-input')?.addEventListener('mouseleave', () => {
    const val = parseInt(formCard.querySelector('#rating-val')?.value || '0');
    stars.forEach((s,i) => s.classList.toggle('active', i < val));
  });

  formCard.querySelector('#submit-review')?.addEventListener('click', async () => {
    const rating = parseInt(formCard.querySelector('#rating-val').value);
    const comment = formCard.querySelector('#review-comment').value;
    const errEl = formCard.querySelector('#review-error');
    errEl.textContent = '';
    if (!rating) { errEl.textContent = 'Selecciona una valoración.'; return; }
    if (!comment.trim()) { errEl.textContent = 'Escribe un comentario.'; return; }
    try {
      const rev = await reviewService.createReview(id, user.id, user.name, rating, comment);
      showToast('¡Reseña publicada!', 'success');
      formCard.querySelector('#review-comment').value = '';
      formCard.querySelector('#rating-val').value = '0';
      stars.forEach(s => s.classList.remove('active'));
      // Prepend new review
      const list = reviewsSec.querySelector('#reviews-list');
      list.insertAdjacentHTML('afterbegin', buildReviewCard(rev));
    } catch (e) {
      errEl.textContent = e.message;
    }
  });

  reviewsSec.appendChild(formCard);
  container.appendChild(reviewsSec);
}

function buildReviewCard(r) {
  return `
    <div class="review-card animate-fade-in">
      <div class="review-card__header">
        <div>
          <span class="review-card__author">${r.userName}</span>
          <span class="review-card__stars" style="margin-left:8px">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
        </div>
        <span class="review-card__date">${new Date(r.createdAt).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'})}</span>
      </div>
      <p class="review-card__text">${r.comment}</p>
    </div>`;
}
