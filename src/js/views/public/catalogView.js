// views/public/catalogView.js
import { productService } from '../../services/index.js';
import { formatUtils } from '../../utils/utils.js';
import { buildProductCard } from './homeView.js';

export async function render(container, params) {
  container.innerHTML = `<div class="loading-screen"><div class="loading-spinner"></div></div>`;

  const products = await productService.getProducts();
  const categories = [...new Set(products.map(p => p.category))];

  // Read URL params (from search or hash query string)
  const hash = window.location.hash;
  const qIndex = hash.indexOf('?');
  const urlParams = new URLSearchParams(qIndex >= 0 ? hash.slice(qIndex + 1) : '');
  let filterCat      = urlParams.get('cat') || '';
  let filterQ        = urlParams.get('q') || '';
  let filterLowStock = urlParams.get('lowstock') === 'true';
  let filterMin      = '';
  let filterMax      = '';
  let filterSort     = 'default';

  container.innerHTML = '';

  // Page header — dynamic title based on active filter
  const header = document.createElement('div');
  header.className = 'page-header';
  let pageTitle    = 'Catálogo de Productos';
  let pageSubtitle = 'Explora nuestra selección completa';
  if (filterLowStock) {
    pageTitle    = '¡Pocas unidades!';
    pageSubtitle = 'Productos con stock limitado — ¡date prisa antes de que se agoten!';
  } else if (filterCat) {
    pageTitle    = filterCat;
    pageSubtitle = `Productos de la categoría "${filterCat}"`;
  } else if (filterQ) {
    pageTitle    = `Resultados para "${filterQ}"`;
    pageSubtitle = 'Búsqueda en todo el catálogo';
  }
  header.innerHTML = `
    <h1 class="page-title">${pageTitle}</h1>
    <p class="page-subtitle">${pageSubtitle}</p>`;
  container.appendChild(header);

  // Filter bar
  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.innerHTML = `
    <div class="form-group">
      <label class="form-label">Buscar</label>
      <input type="text" id="f-search" class="form-input" placeholder="Nombre del producto..." value="${filterQ}" />
    </div>
    <div class="form-group">
      <label class="form-label">Categoría</label>
      <select id="f-cat" class="form-select">
        <option value="">Todas</option>
        ${categories.map(c => `<option value="${c}" ${c === filterCat ? 'selected' : ''}>${c}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Precio mínimo</label>
      <input type="number" id="f-min" class="form-input" placeholder="$0" min="0" value="${filterMin}" style="width:100px" />
    </div>
    <div class="form-group">
      <label class="form-label">Precio máximo</label>
      <input type="number" id="f-max" class="form-input" placeholder="Sin límite" min="0" value="${filterMax}" style="width:110px" />
    </div>
    <div class="form-group">
      <label class="form-label">Ordenar por</label>
      <select id="f-sort" class="form-select">
        <option value="default">Relevancia</option>
        <option value="price-asc">Precio: menor a mayor</option>
        <option value="price-desc">Precio: mayor a menor</option>
        <option value="rating">Mejor valorados</option>
        <option value="stock">Mayor stock</option>
      </select>
    </div>
    <button id="f-clear" class="btn btn--outline btn--sm" style="align-self:flex-end">Limpiar</button>`;
  container.appendChild(filterBar);

  // Results count + grid
  const resultsInfo = document.createElement('p');
  resultsInfo.style.cssText = 'font-size:var(--fs-sm);color:var(--c-slate-500);margin-bottom:var(--space-4)';
  container.appendChild(resultsInfo);

  const grid = document.createElement('div');
  grid.className = 'product-grid';
  container.appendChild(grid);

  // ── Filter & render ───────────────────────────────────────
  function applyFilters() {
    filterQ        = document.getElementById('f-search').value.trim().toLowerCase();
    filterCat      = document.getElementById('f-cat').value;
    filterMin      = parseFloat(document.getElementById('f-min').value) || 0;
    filterMax      = parseFloat(document.getElementById('f-max').value) || Infinity;
    filterSort     = document.getElementById('f-sort').value;
    // filterLowStock is set from URL on load; the filter bar resets it when user interacts
    filterLowStock = false;

    let filtered = products.filter(p => {
      const matchQ        = !filterQ   || p.title.toLowerCase().includes(filterQ) || p.description.toLowerCase().includes(filterQ);
      const matchCat      = !filterCat || p.category === filterCat;
      const matchMin      = p.price >= filterMin;
      const matchMax      = p.price <= filterMax;
      const matchLowStock = !filterLowStock || (p.stock > 0 && p.stock <= 5);
      return matchQ && matchCat && matchMin && matchMax && matchLowStock;
    });

    // Sort
    if (filterSort === 'price-asc')  filtered.sort((a,b) => a.price - b.price);
    if (filterSort === 'price-desc') filtered.sort((a,b) => b.price - a.price);
    if (filterSort === 'rating')     filtered.sort((a,b) => b.rating - a.rating);
    if (filterSort === 'stock')      filtered.sort((a,b) => b.stock - a.stock);

    resultsInfo.textContent = `${filtered.length} producto${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`;

    grid.innerHTML = '';
    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state__icon">🔍</div>
        <p class="empty-state__title">Sin resultados</p>
        <p class="empty-state__desc">Prueba con otros filtros o términos de búsqueda.</p>
      </div>`;
    } else {
      filtered.forEach((p, i) => grid.appendChild(buildProductCard(p, i)));
    }
  }

  // Attach filter events
  ['f-search','f-cat','f-min','f-max','f-sort'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyFilters);
    document.getElementById(id)?.addEventListener('change', applyFilters);
  });

  document.getElementById('f-clear')?.addEventListener('click', () => {
    document.getElementById('f-search').value = '';
    document.getElementById('f-cat').value = '';
    document.getElementById('f-min').value = '';
    document.getElementById('f-max').value = '';
    document.getElementById('f-sort').value = 'default';
    filterLowStock = false;
    applyFilters();
  });

  // First render — apply filters from URL (respects lowstock, cat, q)
  function applyFiltersInitial() {
    const fSearch = document.getElementById('f-search');
    const fCat    = document.getElementById('f-cat');

    // Pre-fill filter bar from URL state (lowstock doesn't have a dedicated input)
    if (filterQ)   fSearch.value = filterQ;
    if (filterCat) fCat.value    = filterCat;

    let filtered = products.filter(p => {
      const matchQ        = !filterQ        || p.title.toLowerCase().includes(filterQ) || p.description.toLowerCase().includes(filterQ);
      const matchCat      = !filterCat      || p.category === filterCat;
      const matchLowStock = !filterLowStock || (p.stock > 0 && p.stock <= 5);
      return matchQ && matchCat && matchLowStock;
    });

    if (filterSort === 'price-asc')  filtered.sort((a, b) => a.price - b.price);
    if (filterSort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    if (filterSort === 'rating')     filtered.sort((a, b) => b.rating - a.rating);
    if (filterSort === 'stock')      filtered.sort((a, b) => b.stock - a.stock);

    resultsInfo.textContent = `${filtered.length} producto${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`;

    grid.innerHTML = '';
    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state__icon">🔍</div>
        <p class="empty-state__title">Sin resultados</p>
        <p class="empty-state__desc">Prueba con otros filtros o términos de búsqueda.</p>
      </div>`;
    } else {
      filtered.forEach((p, i) => grid.appendChild(buildProductCard(p, i)));
    }
  }

  applyFiltersInitial();
}
