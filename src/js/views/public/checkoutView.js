// views/public/checkoutView.js
import { cartService, authService, orderService } from '../../services/index.js';
import { formatUtils, validationUtils } from '../../utils/utils.js';
import { showToast } from '../../core/app.js';
import { navigate } from '../../core/router.js';

export function render(container) {
  const user = authService.getCurrentUser();
  const cart = cartService.getCart();
  const { subtotal, shipping, total } = cartService.getCartTotals();

  container.innerHTML = '';

  // Page header
  container.innerHTML = `<div class="page-header"><h1 class="page-title">Finalizar Compra</h1></div>`;

  if (cart.length === 0) {
    container.innerHTML += `<div class="empty-state"><p class="empty-state__title">Tu carrito está vacío</p><a href="#/catalog" class="btn btn--primary">Ver Catálogo</a></div>`;
    return;
  }

  if (!user) {
    container.innerHTML += `
      <div class="card card--padded" style="max-width:500px;margin:var(--space-8) auto;text-align:center">
        <div style="font-size:2.5rem;margin-bottom:var(--space-4)">🔒</div>
        <h2 style="font-size:var(--fs-xl);font-weight:800;margin-bottom:var(--space-2)">Inicia sesión para continuar</h2>
        <p style="color:var(--c-slate-500);margin-bottom:var(--space-5)">Necesitas una cuenta para completar tu pedido.</p>
        <div style="display:flex;gap:var(--space-3);justify-content:center">
          <a href="#/login" class="btn btn--primary">Iniciar Sesión</a>
          <a href="#/register" class="btn btn--outline">Crear Cuenta</a>
        </div>
      </div>`;
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'checkout-grid';

  // Shipping form
  const formCard = document.createElement('div');
  formCard.className = 'card card--padded animate-fade-up';
  formCard.innerHTML = `
    <h2 style="font-size:var(--fs-xl);font-weight:800;margin-bottom:var(--space-5)">Datos de envío</h2>
    <div style="display:flex;flex-direction:column;gap:var(--space-4)">
      <div class="form-group">
        <label class="form-label">Nombre completo del destinatario</label>
        <input type="text" id="f-name" class="form-input" placeholder="Ej. Juan García López" value="${user.name}" />
        <span class="form-error" id="err-name"></span>
      </div>
      <div class="form-group">
        <label class="form-label">Dirección</label>
        <input type="text" id="f-address" class="form-input" placeholder="Calle, número, piso, etc." />
        <span class="form-error" id="err-address"></span>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Ciudad</label>
          <input type="text" id="f-city" class="form-input" placeholder="Madrid" />
          <span class="form-error" id="err-city"></span>
        </div>
        <div class="form-group">
          <label class="form-label">Código Postal</label>
          <input type="text" id="f-zip" class="form-input" placeholder="28001" />
          <span class="form-error" id="err-zipCode"></span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">País</label>
        <select id="f-country" class="form-select">
          <option value="">Seleccionar país...</option>
          <option value="España" selected>España</option>
          <option value="México">México</option>
          <option value="Argentina">Argentina</option>
          <option value="Colombia">Colombia</option>
          <option value="Chile">Chile</option>
          <option value="Perú">Perú</option>
          <option value="Otro">Otro</option>
        </select>
        <span class="form-error" id="err-country"></span>
      </div>
    </div>`;
  grid.appendChild(formCard);

  // Order summary sidebar
  const summary = document.createElement('div');
  summary.className = 'order-summary';
  summary.innerHTML = `
    <div class="order-summary__title">Resumen del pedido</div>
    ${cart.map(i => `
      <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-3)">
        <img src="${i.product.imageUrl}" style="width:44px;height:44px;object-fit:cover;border-radius:var(--r-sm)" alt="${i.product.title}" />
        <div style="flex:1;min-width:0">
          <p style="font-size:var(--fs-xs);font-weight:600;color:var(--c-slate-700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${i.product.title}</p>
          <p style="font-size:var(--fs-xs);color:var(--c-slate-400)">x${i.quantity}</p>
        </div>
        <span style="font-size:var(--fs-xs);font-weight:700;font-family:var(--font-mono)">${formatUtils.formatPrice(i.product.price * i.quantity)}</span>
      </div>`).join('')}
    <hr style="border:none;border-top:1px solid var(--c-border-lt);margin:var(--space-3) 0" />
    <div class="order-summary__row"><span>Subtotal</span><span>${formatUtils.formatPrice(subtotal)}</span></div>
    <div class="order-summary__row"><span>Envío</span><span>${shipping === 0 ? '<span class="order-summary__free-shipping">GRATIS</span>' : formatUtils.formatPrice(shipping)}</span></div>
    <div class="order-summary__row order-summary__row--total"><span>Total</span><span>${formatUtils.formatPrice(total)}</span></div>
    <button id="confirm-order" class="btn btn--primary btn--full" style="margin-top:var(--space-5)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      Confirmar Pedido
    </button>
    <p style="font-size:var(--fs-xs);color:var(--c-slate-400);text-align:center;margin-top:var(--space-3)">Pago simulado. No se realizará ningún cargo real.</p>`;
  grid.appendChild(summary);
  container.appendChild(grid);

  // Submit handler
  container.querySelector('#confirm-order').addEventListener('click', async () => {
    const fields = {
      name:    document.getElementById('f-name').value,
      address: document.getElementById('f-address').value,
      city:    document.getElementById('f-city').value,
      zipCode: document.getElementById('f-zip').value,
      country: document.getElementById('f-country').value,
    };

    const { isValid, errors } = validationUtils.validateShippingAddress(fields);
    ['name','address','city','zipCode','country'].forEach(f => {
      document.getElementById(`err-${f}`).textContent = errors[f] || '';
      document.getElementById(`f-${f === 'zipCode' ? 'zip' : f}`)?.classList.toggle('error', !!errors[f]);
    });

    if (!isValid) return;

    const btn = container.querySelector('#confirm-order');
    btn.disabled = true;
    btn.textContent = 'Procesando...';

    try {
      const order = await orderService.createOrder(user.id, user.email, fields, cart, subtotal, total);
      cartService.clearCart();
      showToast('¡Pedido creado con éxito!', 'success');
      navigate(`#/order/${order.id}`);
    } catch (e) {
      showToast(e.message, 'error');
      btn.disabled = false;
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Confirmar Pedido`;
    }
  });
}
