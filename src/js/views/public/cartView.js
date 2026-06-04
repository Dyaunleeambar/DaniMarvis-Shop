// views/public/cartView.js
import { cartService, authService } from '../../services/index.js';
import { formatUtils } from '../../utils/utils.js';
import { showToast } from '../../core/app.js';

export function render(container) {
  renderCart(container);
}

function renderCart(container) {
  const cart = cartService.getCart();
  const { count, subtotal, shipping, total } = cartService.getCartTotals();
  const user = authService.getCurrentUser();

  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `<h1 class="page-title">Carrito de compras <span class="badge badge--slate" style="font-size:var(--fs-sm);vertical-align:middle">${count} artículo${count !== 1 ? 's' : ''}</span></h1>`;
  container.appendChild(header);

  if (cart.length === 0) {
    container.innerHTML += `
      <div class="empty-state">
        <div class="empty-state__icon" style="font-size:2rem">🛒</div>
        <p class="empty-state__title">Tu carrito está vacío</p>
        <p class="empty-state__desc">Agrega productos desde el catálogo para comenzar.</p>
        <a href="#/catalog" class="btn btn--primary" style="margin-top:var(--space-2)">Ir al Catálogo</a>
      </div>`;
    return;
  }

  const layout = document.createElement('div');
  layout.style.cssText = 'display:grid;grid-template-columns:1fr;gap:var(--space-6)';
  layout.style.gridTemplateColumns = window.innerWidth >= 1024 ? '1fr 320px' : '1fr';

  // Items column
  const itemsCard = document.createElement('div');
  itemsCard.className = 'card';
  itemsCard.innerHTML = `<div class="card__header"><h2 class="card__title">Artículos</h2><button id="clear-cart" class="btn btn--outline btn--sm">Vaciar carrito</button></div>`;

  const itemsList = document.createElement('div');
  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <img class="cart-item__img" src="${item.product.imageUrl}" alt="${item.product.title}" loading="lazy" />
      <div class="cart-item__info">
        <a href="#/product/${item.productId}" class="cart-item__title">${item.product.title}</a>
        <div class="cart-item__price">${formatUtils.formatPrice(item.product.price)}</div>
        <div class="cart-item__actions">
          <div class="qty-stepper">
            <button class="qty-stepper__btn btn-qty-minus" data-id="${item.productId}">−</button>
            <span class="qty-stepper__value">${item.quantity}</span>
            <button class="qty-stepper__btn btn-qty-plus" data-id="${item.productId}" data-max="${item.product.stock}">+</button>
          </div>
          <button class="btn btn--outline btn--sm btn-remove" data-id="${item.productId}" style="color:var(--c-red-600);border-color:var(--c-red-600)">Eliminar</button>
          <span style="font-size:var(--fs-sm);color:var(--c-slate-500)">Subtotal: ${formatUtils.formatPrice(item.product.price * item.quantity)}</span>
        </div>
      </div>`;
    itemsList.appendChild(row);
  });
  itemsCard.appendChild(itemsList);
  layout.appendChild(itemsCard);

  // Summary column
  const summary = document.createElement('div');
  summary.className = 'order-summary';
  summary.innerHTML = `
    <div class="order-summary__title">Resumen del pedido</div>
    <div class="order-summary__row"><span>Subtotal (${count} art.)</span><span>${formatUtils.formatPrice(subtotal)}</span></div>
    <div class="order-summary__row">
      <span>Envío</span>
      <span>${shipping === 0 ? '<span class="order-summary__free-shipping">GRATIS</span>' : formatUtils.formatPrice(shipping)}</span>
    </div>
    ${shipping > 0 ? `<p style="font-size:var(--fs-xs);color:var(--c-slate-400);margin-bottom:var(--space-2)">Envío gratis en pedidos mayores a $100</p>` : ''}
    <div class="order-summary__row order-summary__row--total"><span>Total</span><span>${formatUtils.formatPrice(total)}</span></div>
    <a href="#/checkout" class="btn btn--primary btn--full" style="margin-top:var(--space-4)">Proceder al Checkout →</a>
    ${!user ? `<p style="font-size:var(--fs-xs);color:var(--c-slate-500);text-align:center;margin-top:var(--space-3)">Necesitarás <a href="#/login" style="color:var(--c-blue-600)">iniciar sesión</a> para completar el pedido.</p>` : ''}`;
  layout.appendChild(summary);

  container.appendChild(layout);

  // Event listeners
  container.querySelectorAll('.btn-qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const item = cartService.getCart().find(i => i.productId === id);
      if (!item) return;
      const res = cartService.updateQuantity(id, item.quantity - 1);
      if (!res.success) showToast(res.message, 'error');
      renderCart(container);
    });
  });

  container.querySelectorAll('.btn-qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const item = cartService.getCart().find(i => i.productId === id);
      if (!item) return;
      const res = cartService.updateQuantity(id, item.quantity + 1);
      if (!res.success) showToast(res.message, 'error');
      renderCart(container);
    });
  });

  container.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      cartService.removeFromCart(btn.dataset.id);
      showToast('Producto eliminado del carrito.');
      renderCart(container);
    });
  });

  container.querySelector('#clear-cart')?.addEventListener('click', () => {
    if (confirm('¿Vaciar todo el carrito?')) {
      cartService.clearCart();
      renderCart(container);
    }
  });
}
