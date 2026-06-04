// views/admin/adminProductsView.js
import { productService } from '../../services/index.js';
import { formatUtils } from '../../utils/utils.js';
import { showToast } from '../../core/app.js';

export async function render(container) {
  container.innerHTML = `<div class="loading-screen"><div class="loading-spinner"></div></div>`;
  let products = await productService.getProducts();

  function renderList() {
    container.innerHTML = '';

    // Admin header
    const header = document.createElement('div');
    header.className = 'admin-header';
    header.innerHTML = `
      <div>
        <h1 class="page-title">Gestión de Productos</h1>
        <p class="page-subtitle">${products.length} productos en el catálogo</p>
      </div>
      <div style="display:flex;gap:var(--space-2)">
        <a href="#/admin/dashboard" class="btn btn--outline btn--sm">← Dashboard</a>
        <button id="btn-new" class="btn btn--primary btn--sm">+ Nuevo Producto</button>
      </div>`;
    container.appendChild(header);

    // Table
    const card = document.createElement('div');
    card.className = 'card animate-fade-up';
    card.innerHTML = `
      <div class="table-wrap">
        <table class="table">
          <thead><tr>
            <th>Imagen</th><th>Título</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Rating</th><th>Acciones</th>
          </tr></thead>
          <tbody id="products-tbody"></tbody>
        </table>
      </div>`;
    container.appendChild(card);

    const tbody = card.querySelector('#products-tbody');
    products.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><img src="${p.imageUrl}" style="width:46px;height:46px;object-fit:cover;border-radius:var(--r-sm)" alt="${p.title}" /></td>
        <td style="font-weight:600;max-width:200px">
          <div style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${p.title}</div>
          ${p.featured ? '<span class="badge badge--amber" style="margin-top:4px">Destacado</span>' : ''}
        </td>
        <td><span class="badge badge--slate">${p.category}</span></td>
        <td class="font-mono" style="font-weight:700">${formatUtils.formatPrice(p.price)}</td>
        <td>
          <span style="font-weight:700;color:${p.stock === 0 ? 'var(--c-red-600)' : p.stock <= 5 ? 'var(--c-amber-500)' : 'var(--c-green-600)'}">${p.stock}</span>
        </td>
        <td style="color:var(--c-amber-400)">${formatUtils.renderStars(p.rating)} <span style="color:var(--c-slate-500);font-size:var(--fs-xs)">(${p.rating})</span></td>
        <td>
          <div style="display:flex;gap:var(--space-2)">
            <button class="btn btn--outline btn--sm btn-edit" data-id="${p.id}">Editar</button>
            <button class="btn btn--danger btn--sm btn-delete" data-id="${p.id}">Eliminar</button>
          </div>
        </td>`;
      tbody.appendChild(tr);
    });

    // Events
    container.querySelector('#btn-new').addEventListener('click', () => openModal(null));
    container.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const product = products.find(p => p.id === btn.dataset.id);
        openModal(product);
      });
    });
    container.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar este producto definitivamente?')) return;
        await productService.deleteProduct(btn.dataset.id);
        products = await productService.getProducts();
        showToast('Producto eliminado.', 'success');
        renderList();
      });
    });
  }

  // ── Product Modal (Create / Edit) ──────────────────────────
  function openModal(product) {
    const isEdit = !!product;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal__header">
          <h2 class="modal__title">${isEdit ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          <button class="modal__close" id="modal-close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal__body">
          <div style="display:flex;flex-direction:column;gap:var(--space-4)">
            <div class="form-group">
              <label class="form-label">Título</label>
              <input id="m-title" class="form-input" type="text" value="${isEdit ? product.title : ''}" placeholder="Nombre del producto" />
            </div>
            <div class="form-group">
              <label class="form-label">Descripción</label>
              <textarea id="m-desc" class="form-textarea">${isEdit ? product.description : ''}</textarea>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Precio (USD)</label>
                <input id="m-price" class="form-input" type="number" step="0.01" min="0" value="${isEdit ? product.price : ''}" placeholder="0.00" />
              </div>
              <div class="form-group">
                <label class="form-label">Stock</label>
                <input id="m-stock" class="form-input" type="number" min="0" value="${isEdit ? product.stock : ''}" placeholder="0" />
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Categoría</label>
                <select id="m-cat" class="form-select">
                  ${['Electrodomésticos','Cocina','Hogar','Energía','Climatización','Tecnología','Otro'].map(c =>
                    `<option value="${c}" ${isEdit && product.category === c ? 'selected' : ''}>${c}</option>`
                  ).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">¿Destacado?</label>
                <select id="m-featured" class="form-select">
                  <option value="false" ${isEdit && !product.featured ? 'selected' : ''}>No</option>
                  <option value="true"  ${isEdit && product.featured  ? 'selected' : ''}>Sí</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">URL de imagen</label>
              <input id="m-img" class="form-input" type="url" value="${isEdit ? product.imageUrl : ''}" placeholder="https://..." />
            </div>
            <div id="m-error" style="color:var(--c-red-600);font-size:var(--fs-sm)"></div>
            <div style="display:flex;gap:var(--space-3)">
              <button id="modal-cancel" class="btn btn--outline" style="flex:1">Cancelar</button>
              <button id="modal-save" class="btn btn--primary" style="flex:1">${isEdit ? 'Guardar cambios' : 'Crear Producto'}</button>
            </div>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    const close = () => document.body.removeChild(overlay);
    overlay.querySelector('#modal-close').addEventListener('click', close);
    overlay.querySelector('#modal-cancel').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    overlay.querySelector('#modal-save').addEventListener('click', async () => {
      const title = document.getElementById('m-title').value.trim();
      const desc  = document.getElementById('m-desc').value.trim();
      const price = parseFloat(document.getElementById('m-price').value);
      const stock = parseInt(document.getElementById('m-stock').value);
      const cat   = document.getElementById('m-cat').value;
      const imgUrl = document.getElementById('m-img').value.trim();
      const featured = document.getElementById('m-featured').value === 'true';
      const errEl = document.getElementById('m-error');
      errEl.textContent = '';

      if (!title || !desc || isNaN(price) || isNaN(stock) || !imgUrl) {
        errEl.textContent = 'Todos los campos son obligatorios.';
        return;
      }

      try {
        if (isEdit) {
          await productService.updateProduct({ ...product, title, description: desc, price, stock, category: cat, imageUrl: imgUrl, featured });
          showToast('Producto actualizado.', 'success');
        } else {
          await productService.createProduct({ title, description: desc, price, stock, category: cat, imageUrl: imgUrl, featured, rating: 0 });
          showToast('Producto creado.', 'success');
        }
        products = await productService.getProducts();
        close();
        renderList();
      } catch (e) {
        errEl.textContent = e.message;
      }
    });
  }

  renderList();
}
