// views/admin/adminOrdersView.js
import { orderService } from '../../services/index.js';
import { formatUtils } from '../../utils/utils.js';
import { showToast } from '../../core/app.js';

const STATUS_FLOW = ['pendiente', 'procesando', 'enviado', 'entregado'];

export async function render(container) {
  container.innerHTML = `<div class="loading-screen"><div class="loading-spinner"></div></div>`;

  const renderView = async () => {
    const orders = await orderService.getAllOrders();
    container.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.className = 'admin-header';
    header.innerHTML = `
      <div>
        <h1 class="page-title">Gestión de Pedidos</h1>
        <p class="page-subtitle">${orders.length} pedido${orders.length !== 1 ? 's' : ''} registrado${orders.length !== 1 ? 's' : ''}</p>
      </div>
      <a href="#/admin/dashboard" class="btn btn--outline btn--sm">← Dashboard</a>`;
    container.appendChild(header);

    if (orders.length === 0) {
      container.innerHTML += `<div class="empty-state"><div class="empty-state__icon" style="font-size:2rem">📦</div><p class="empty-state__title">Sin pedidos aún</p><p class="empty-state__desc">Los pedidos de los clientes aparecerán aquí.</p></div>`;
      return;
    }

    // Orders table
    const card = document.createElement('div');
    card.className = 'card animate-fade-up';
    card.innerHTML = `
      <div class="table-wrap">
        <table class="table">
          <thead><tr>
            <th>ID Pedido</th><th>Cliente</th><th>Artículos</th><th>Total</th><th>Estado</th><th>Fecha</th><th>Acción</th>
          </tr></thead>
          <tbody id="orders-tbody"></tbody>
        </table>
      </div>`;
    container.appendChild(card);

    const tbody = card.querySelector('#orders-tbody');
    orders.forEach(order => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="font-mono" style="font-size:var(--fs-xs);color:var(--c-slate-500)">${order.id}</td>
        <td>
          <div style="font-weight:600">${order.userEmail}</div>
          <div style="font-size:var(--fs-xs);color:var(--c-slate-400)">${order.shippingAddress.city}, ${order.shippingAddress.country}</div>
        </td>
        <td style="color:var(--c-slate-500)">${order.items.length} art.</td>
        <td class="font-mono" style="font-weight:700">${formatUtils.formatPrice(order.total)}</td>
        <td><span class="status-badge status--${order.status}">${order.status}</span></td>
        <td style="font-size:var(--fs-xs);color:var(--c-slate-400)">${formatUtils.shortDate(order.createdAt)}</td>
        <td><button class="btn btn--outline btn--sm btn-detail" data-id="${order.id}">Detalle</button></td>`;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-detail').forEach(btn => {
      btn.addEventListener('click', () => openOrderDetail(orders.find(o => o.id === btn.dataset.id)));
    });
  };

  // ── Order detail modal ──────────────────────────────────────
  function openOrderDetail(order) {
    const currentIdx = STATUS_FLOW.indexOf(order.status);
    const nextStatus = STATUS_FLOW[currentIdx + 1] || null;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:640px">
        <div class="modal__header">
          <div>
            <h2 class="modal__title">Detalle del Pedido</h2>
            <p style="font-size:var(--fs-xs);font-family:var(--font-mono);color:var(--c-slate-400);margin-top:2px">${order.id}</p>
          </div>
          <button class="modal__close" id="modal-close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal__body">

          <!-- Meta info -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);margin-bottom:var(--space-5)">
            <div>
              <p style="font-size:var(--fs-xs);color:var(--c-slate-400);font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Cliente</p>
              <p style="font-weight:600;margin-top:2px">${order.userEmail}</p>
            </div>
            <div>
              <p style="font-size:var(--fs-xs);color:var(--c-slate-400);font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Fecha</p>
              <p style="font-weight:600;margin-top:2px">${formatUtils.shortDate(order.createdAt)}</p>
            </div>
            <div>
              <p style="font-size:var(--fs-xs);color:var(--c-slate-400);font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Dirección</p>
              <p style="font-weight:600;margin-top:2px;font-size:var(--fs-sm)">${order.shippingAddress.name}<br />${order.shippingAddress.address}<br />${order.shippingAddress.city}, ${order.shippingAddress.country} ${order.shippingAddress.zipCode}</p>
            </div>
            <div>
              <p style="font-size:var(--fs-xs);color:var(--c-slate-400);font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Estado actual</p>
              <span class="status-badge status--${order.status}" style="margin-top:4px">${order.status}</span>
            </div>
          </div>

          <!-- Items -->
          <div style="background:var(--c-slate-100);border-radius:var(--r-md);padding:var(--space-4);margin-bottom:var(--space-5)">
            ${order.items.map(i => `
              <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-3)">
                <img src="${i.imageUrl}" style="width:44px;height:44px;object-fit:cover;border-radius:var(--r-sm)" alt="${i.title}" />
                <div style="flex:1;min-width:0">
                  <p style="font-size:var(--fs-sm);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${i.title}</p>
                  <p style="font-size:var(--fs-xs);color:var(--c-slate-400)">${formatUtils.formatPrice(i.price)} x ${i.quantity}</p>
                </div>
                <span style="font-weight:700;font-family:var(--font-mono)">${formatUtils.formatPrice(i.price * i.quantity)}</span>
              </div>`).join('')}
            <div style="border-top:1px solid var(--c-border);padding-top:var(--space-3);display:flex;justify-content:space-between;font-weight:800">
              <span>Total</span>
              <span class="font-mono">${formatUtils.formatPrice(order.total)}</span>
            </div>
          </div>

          <!-- Status change -->
          <div>
            <p style="font-size:var(--fs-xs);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--c-slate-400);margin-bottom:var(--space-3)">Cambiar estado</p>
            <div style="display:flex;gap:var(--space-2);flex-wrap:wrap">
              ${STATUS_FLOW.map((s, i) => `
                <button class="btn btn-status ${s === order.status ? 'btn--primary' : 'btn--outline'}" 
                        data-status="${s}" 
                        ${s === order.status ? 'disabled' : ''}>
                  ${s.charAt(0).toUpperCase() + s.slice(1)}
                </button>`).join('')}
            </div>
          </div>

        </div>
      </div>`;

    document.body.appendChild(overlay);
    const close = () => document.body.removeChild(overlay);
    overlay.querySelector('#modal-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    overlay.querySelectorAll('.btn-status').forEach(btn => {
      btn.addEventListener('click', async () => {
        const newStatus = btn.dataset.status;
        try {
          await orderService.updateOrderStatus(order.id, newStatus);
          showToast(`Pedido actualizado a "${newStatus}".`, 'success');
          close();
          await renderView();
        } catch (e) {
          showToast(e.message, 'error');
        }
      });
    });
  }

  // Listen for live updates from shipping simulator
  const onUpdate = () => renderView();
  window.addEventListener('orderStatusChanged', onUpdate);

  await renderView();

  return () => window.removeEventListener('orderStatusChanged', onUpdate);
}
