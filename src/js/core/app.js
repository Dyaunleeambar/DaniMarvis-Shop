// ============================================================
// core/app.js — Bootstrap entry point
// ============================================================

import { seedDatabaseIfEmpty } from '../db/indexeddb.js';
import { route, initRouter, navigate } from './router.js';
import { authService, cartService, shippingService, reviewService } from '../services/index.js';

// ── Views ─────────────────────────────────────────────────────
import { render as renderHome }         from '../views/public/homeView.js';
import { render as renderCatalog }      from '../views/public/catalogView.js';
import { render as renderProductDetail } from '../views/public/productDetailView.js';
import { render as renderCart }         from '../views/public/cartView.js';
import { render as renderCheckout }     from '../views/public/checkoutView.js';
import { render as renderTracking }     from '../views/public/orderTrackingView.js';
import { render as renderLogin }        from '../views/public/loginView.js';
import { render as renderRegister }     from '../views/public/registerView.js';
import { render as renderAdminLogin }   from '../views/admin/adminLoginView.js';
import { render as renderAdminDash }    from '../views/admin/adminDashboardView.js';
import { render as renderAdminProducts } from '../views/admin/adminProductsView.js';
import { render as renderAdminOrders }  from '../views/admin/adminOrdersView.js';

// ── Toast ─────────────────────────────────────────────────────
const toastEl = document.getElementById('toast');
let _toastTimer = null;

export function showToast(msg, type = '') {
  toastEl.textContent = msg;
  toastEl.className = `toast${type ? ` toast--${type}` : ''}`;
  toastEl.classList.remove('hidden');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 4000);
}

// ── Header helpers ────────────────────────────────────────────
function updateHeader() {
  const user = authService.getCurrentUser();
  const section = document.getElementById('user-section');
  const badge = document.getElementById('cart-badge');

  // Cart badge
  const { count } = cartService.getCartTotals();
  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  // User section
  if (user) {
    section.innerHTML = `
      ${user.isAdmin ? `<button class="btn-admin" onclick="navigate('#/admin/dashboard')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Admin
      </button>` : ''}
      <div class="user-info">
        <div class="user-info__greeting">Hola, ${user.name.split(' ')[0]}</div>
        <div class="user-info__label">${user.isAdmin ? 'Administrador' : 'Mi Cuenta'}</div>
      </div>
      <button class="btn-logout" title="Cerrar sesión" id="logout-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </button>`;
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      authService.logoutUser();
      updateHeader();
      showToast('Sesión finalizada.');
      navigate('#/home');
    });
  } else {
    section.innerHTML = `
      <a href="#/login" class="btn-login">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        Iniciar Sesión
      </a>`;
  }
}

// ── Active nav link ───────────────────────────────────────────
function updateActiveNavLink({ hash, path }) {
  const navLinks = document.querySelectorAll('.header-nav-inner .nav-link, .header-nav-inner .nav-btn');

  navLinks.forEach(link => {
    link.classList.remove('nav-link--active');

    const href = link.getAttribute('href') || '';
    const onclick = link.getAttribute('onclick') || '';

    // Exact full-hash match (covers links with query params like ?cat=Cocina)
    if (href && href === hash) {
      link.classList.add('nav-link--active');
      return;
    }

    // Path-only match for plain links without query string
    if (href && href === path && !hash.includes('?')) {
      link.classList.add('nav-link--active');
      return;
    }

    // "Todo" button uses onclick — only active on plain #/catalog with no query string
    if (onclick.includes('#/catalog') && path === '#/catalog' && !hash.includes('?')) {
      link.classList.add('nav-link--active');
    }
  });
}

// ── Search ────────────────────────────────────────────────────
function initSearch() {
  document.getElementById('search-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = document.getElementById('search-input').value.trim();
    const cat = document.getElementById('search-category').value;
    const params = new URLSearchParams();
    if (q)   params.set('q', q);
    if (cat) params.set('cat', cat);
    navigate('#/catalog' + (params.toString() ? '?' + params : ''));
    document.getElementById('search-input').value = '';
  });
}

// ── Route definitions ─────────────────────────────────────────
function registerRoutes() {
  route('#/home',               (_, c) => renderHome(c));
  route('#/',                   (_, c) => renderHome(c));
  route('#/catalog',            (p, c) => renderCatalog(c, p));
  route('#/product/:id',        (p, c) => renderProductDetail(c, p));
  route('#/cart',               (_, c) => renderCart(c));
  route('#/checkout',           (_, c) => renderCheckout(c));
  route('#/order/:id',          (p, c) => renderTracking(c, p));
  route('#/login',              (_, c) => renderLogin(c));
  route('#/register',           (_, c) => renderRegister(c));

  // Admin guards
  route('#/admin/login',        (_, c) => renderAdminLogin(c));
  route('#/admin/dashboard',    (_, c) => {
    if (!authService.isAdmin()) { navigate('#/admin/login'); return; }
    return renderAdminDash(c);
  });
  route('#/admin/products',     (_, c) => {
    if (!authService.isAdmin()) { navigate('#/admin/login'); return; }
    return renderAdminProducts(c);
  });
  route('#/admin/orders',       (_, c) => {
    if (!authService.isAdmin()) { navigate('#/admin/login'); return; }
    return renderAdminOrders(c);
  });
}

// ── Main bootstrap ────────────────────────────────────────────
async function bootstrap() {
  const mainEl = document.getElementById('app-main');
  document.getElementById('footer-year').textContent = new Date().getFullYear();

  try {
    await seedDatabaseIfEmpty();
    await reviewService.seedDefaultReviews();
  } catch (err) {
    console.error('[App] DB init error:', err);
    showToast('Error al inicializar la base de datos local.', 'error');
  }

  initSearch();
  updateHeader();

  // Keep header updated when cart or session changes
  window.addEventListener('cartUpdated',   updateHeader);
  window.addEventListener('authChanged',   updateHeader);

  // Update active nav link on every route change
  window.addEventListener('routeChanged', (e) => updateActiveNavLink(e.detail));

  shippingService.startSimulator();

  registerRoutes();
  initRouter(mainEl);
}

// Expose navigate globally for inline onclick attributes
window.navigate = navigate;

bootstrap();
