// views/admin/adminDashboardView.js
import { productService, orderService } from '../../services/index.js';
import { formatUtils } from '../../utils/utils.js';

export async function render(container) {
  container.innerHTML = `<div class="loading-screen"><div class="loading-spinner"></div></div>`;

  const [products, orders] = await Promise.all([
    productService.getProducts(),
    orderService.getAllOrders()
  ]);

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter(o => o.status === 'pendiente').length;
  const recentOrders = orders.slice(0, 5);

  container.innerHTML = '';

  // Admin header
  const header = document.createElement('div');
  header.className = 'admin-header';
  header.innerHTML = `
    <div>
      <h1 class="page-title">Panel de Administración</h1>
      <p class="page-subtitle">Resumen general del sistema</p>
    </div>
    <div style="display:flex;gap:var(--space-2)">
      <a href="#/admin/products" class="btn btn--primary btn--sm">Gestionar Productos</a>
      <a href="#/admin/orders" class="btn btn--outline btn--sm">Ver Pedidos</a>
    </div>`;
  container.appendChild(header);

  // Stats grid
  const statsGrid = document.createElement('div');
  statsGrid.className = 'admin-stats-grid';
  statsGrid.innerHTML = `
    <div class="stat-card animate-fade-up delay-1">
      <div class="stat-card__label">Productos</div>
      <div class="stat-card__value">${products.length}</div>
      <div class="stat-card__sub">en catálogo</div>
    </div>
    <div class="stat-card animate-fade-up delay-2">
      <div class="stat-card__label">Pedidos totales</div>
      <div class="stat-card__value">${orders.length}</div>
      <div class="stat-card__sub">${pending} pendiente${pending !== 1 ? 's' : ''}</div>
    </div>
    <div class="stat-card animate-fade-up delay-3">
      <div class="stat-card__label">Revenue simulado</div>
      <div class="stat-card__value" style="font-size:var(--fs-2xl)">${formatUtils.formatPrice(revenue)}</div>
      <div class="stat-card__sub">acumulado</div>
    </div>
    <div class="stat-card animate-fade-up delay-4">
      <div class="stat-card__label">Stock crítico</div>
      <div class="stat-card__value" style="color:var(--c-red-600)">${products.filter(p => p.stock <= 3).length}</div>
      <div class="stat-card__sub">productos ≤ 3 unidades</div>
    </div>`;
  container.appendChild(statsGrid);

  // Recent orders table
  const ordersCard = document.createElement('div');
  ordersCard.className = 'card animate-fade-up delay-4';
  ordersCard.innerHTML = `
    <div class="card__header">
      <h2 class="card__title">Pedidos Recientes</h2>
      <a href="#/admin/orders" class="btn btn--outline btn--sm">Ver todos</a>
    </div>
    <div class="table-wrap">
      <table class="table">
        <thead><tr>
          <th>ID Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Fecha</th><th>Acción</th>
        </tr></thead>
        <tbody>
          ${recentOrders.length === 0
            ? `<tr><td colspan="6" style="text-align:center;color:var(--c-slate-400);padding:var(--space-8)">Sin pedidos aún</td></tr>`
            : recentOrders.map(o => `
              <tr>
                <td class="font-mono" style="font-size:var(--fs-xs);color:var(--c-slate-500)">${o.id}</td>
                <td style="font-weight:600">${o.userEmail}</td>
                <td class="font-mono" style="font-weight:700">${formatUtils.formatPrice(o.total)}</td>
                <td><span class="status-badge status--${o.status}">${o.status}</span></td>
                <td style="color:var(--c-slate-400)">${formatUtils.shortDate(o.createdAt)}</td>
                <td><a href="#/admin/orders" class="btn btn--outline btn--sm">Ver</a></td>
              </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  container.appendChild(ordersCard);

  // Low stock warning
  const lowStock = products.filter(p => p.stock <= 5);
  if (lowStock.length > 0) {
    const warning = document.createElement('div');
    warning.className = 'card card--padded animate-fade-up delay-5';
    warning.style.marginTop = 'var(--space-6)';
    warning.style.borderColor = '#fde68a';
    warning.style.background = 'var(--c-amber-50)';
    warning.innerHTML = `
      <h3 style="font-size:var(--fs-md);font-weight:800;color:#92400e;margin-bottom:var(--space-4)">
        ⚠️ Productos con stock bajo
      </h3>
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-3)">
        ${lowStock.map(p => `
          <div style="background:#fff;border:1px solid #fde68a;border-radius:var(--r-md);padding:var(--space-3) var(--space-4);display:flex;align-items:center;gap:var(--space-3)">
            <img src="${p.imageUrl}" style="width:36px;height:36px;object-fit:cover;border-radius:var(--r-sm)" alt="${p.title}" />
            <div>
              <p style="font-size:var(--fs-sm);font-weight:700;color:var(--c-slate-800)">${p.title.substring(0, 32)}...</p>
              <p style="font-size:var(--fs-xs);color:${p.stock === 0 ? 'var(--c-red-600)' : '#d97706'};font-weight:600">Stock: ${p.stock}</p>
            </div>
          </div>`).join('')}
      </div>`;
    container.appendChild(warning);
  }
}
