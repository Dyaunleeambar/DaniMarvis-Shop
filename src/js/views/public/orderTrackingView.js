// views/public/orderTrackingView.js
import { orderService } from '../../services/index.js';
import { formatUtils } from '../../utils/utils.js';

const STATUS_STEPS = [
  { key: 'pendiente',  label: 'Pedido recibido',    desc: 'Tu pedido ha sido registrado correctamente.' },
  { key: 'procesando', label: 'En preparación',      desc: 'Estamos preparando tu pedido en el almacén.' },
  { key: 'enviado',    label: 'En camino',            desc: 'Tu pedido está en ruta hacia tu dirección.' },
  { key: 'entregado',  label: 'Entregado',            desc: '¡Tu pedido ha llegado a su destino!' },
];

const STATUS_ORDER = ['pendiente', 'procesando', 'enviado', 'entregado'];

export async function render(container, { id }) {
  container.innerHTML = `<div class="loading-screen"><div class="loading-spinner"></div></div>`;

  const renderView = async () => {
    const order = await orderService.getOrderById(id);
    if (!order) {
      container.innerHTML = `<div class="error-view"><h2>Pedido no encontrado</h2><p>El pedido con ID "${id}" no existe.</p><a href="#/home" class="btn btn--primary" style="margin-top:var(--space-4)">Ir al Inicio</a></div>`;
      return;
    }

    const currentIdx = STATUS_ORDER.indexOf(order.status);
    container.innerHTML = '';

    // Breadcrumb
    container.innerHTML = `<nav class="breadcrumb"><a href="#/home">Inicio</a><span class="breadcrumb__sep">/</span><span>Seguimiento</span><span class="breadcrumb__sep">/</span><span class="font-mono">${order.id}</span></nav>`;

    const layout = document.createElement('div');
    layout.style.cssText = 'display:grid;grid-template-columns:1fr;gap:var(--space-6)';
    if (window.innerWidth >= 1024) layout.style.gridTemplateColumns = '1fr 360px';

    // Left: status card
    const statusCard = document.createElement('div');
    statusCard.className = 'card card--padded animate-fade-up';
    statusCard.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--space-3);margin-bottom:var(--space-6)">
        <div>
          <h1 class="page-title" style="font-size:var(--fs-xl)">Seguimiento del pedido</h1>
          <p style="font-family:var(--font-mono);font-size:var(--fs-sm);color:var(--c-slate-500);margin-top:2px">${order.id}</p>
        </div>
        <div class="status-badge status--${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</div>
      </div>

      <div class="tracking-timeline">
        ${STATUS_STEPS.map((step, i) => {
          const isDone   = i < currentIdx;
          const isActive = i === currentIdx;
          return `
            <div class="tracking-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}">
              <div class="tracking-step__line">
                <div class="tracking-step__dot"></div>
                <div class="tracking-step__connector"></div>
              </div>
              <div class="tracking-step__content">
                <p class="tracking-step__label">${step.label}</p>
                <p class="tracking-step__desc">${step.desc}</p>
              </div>
            </div>`;
        }).join('')}
      </div>

      <div style="margin-top:var(--space-6);padding-top:var(--space-5);border-top:1px solid var(--c-border-lt)">
        <p style="font-size:var(--fs-xs);color:var(--c-slate-400)">Fecha del pedido: <strong style="color:var(--c-slate-600)">${formatUtils.formatDate(order.createdAt)}</strong></p>
        <p style="font-size:var(--fs-xs);color:var(--c-slate-400);margin-top:4px">Envío a: <strong style="color:var(--c-slate-600)">${order.shippingAddress.name} · ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.country}</strong></p>
      </div>`;
    layout.appendChild(statusCard);

    // Right: order items summary
    const summaryCard = document.createElement('div');
    summaryCard.className = 'card card--padded animate-fade-up delay-2';
    summaryCard.innerHTML = `
      <h2 style="font-size:var(--fs-md);font-weight:800;margin-bottom:var(--space-4)">Artículos del pedido</h2>
      <div style="display:flex;flex-direction:column;gap:var(--space-3)">
        ${order.items.map(item => `
          <div style="display:flex;align-items:center;gap:var(--space-3)">
            <img src="${item.imageUrl}" style="width:52px;height:52px;object-fit:cover;border-radius:var(--r-md);background:var(--c-slate-100)" alt="${item.title}" />
            <div style="flex:1;min-width:0">
              <p style="font-size:var(--fs-sm);font-weight:600;color:var(--c-slate-800);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${item.title}</p>
              <p style="font-size:var(--fs-xs);color:var(--c-slate-400)">x${item.quantity}</p>
            </div>
            <span style="font-size:var(--fs-sm);font-weight:700;font-family:var(--font-mono);flex-shrink:0">${formatUtils.formatPrice(item.price * item.quantity)}</span>
          </div>`).join('')}
      </div>
      <hr style="border:none;border-top:1px solid var(--c-border-lt);margin:var(--space-4) 0" />
      <div style="display:flex;justify-content:space-between;font-size:var(--fs-sm)">
        <span style="color:var(--c-slate-500)">Subtotal</span>
        <span style="font-family:var(--font-mono);font-weight:700">${formatUtils.formatPrice(order.subtotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:var(--fs-lg);font-weight:800;margin-top:var(--space-2)">
        <span>Total</span>
        <span style="font-family:var(--font-mono)">${formatUtils.formatPrice(order.total)}</span>
      </div>
      <div style="margin-top:var(--space-5);display:flex;gap:var(--space-2);flex-direction:column">
        <a href="#/catalog" class="btn btn--primary btn--full">Seguir comprando</a>
        <a href="#/cart" class="btn btn--outline btn--full">Ver carrito</a>
      </div>`;
    layout.appendChild(summaryCard);
    container.appendChild(layout);
  };

  await renderView();

  // Live update: re-render when shipping simulator fires an event
  const onStatusChange = async (e) => {
    if (e.detail?.orderId === id) {
      await renderView();
    }
  };
  window.addEventListener('orderStatusChanged', onStatusChange);

  // Return cleanup to router
  return () => window.removeEventListener('orderStatusChanged', onStatusChange);
}
