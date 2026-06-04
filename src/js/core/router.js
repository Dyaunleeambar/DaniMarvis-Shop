// ============================================================
// core/router.js — Hash-based SPA router
// ============================================================

const routes = [];
let currentCleanup = null;

/**
 * Register a route pattern
 * @param {string} pattern  e.g. '#/product/:id'
 * @param {Function} handler  async (params, container) => cleanup?
 */
export function route(pattern, handler) {
  // Convert '#/product/:id' to a regex + param names
  const paramNames = [];
  const regexStr = '^' + pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // escape special chars
    .replace(/:([a-zA-Z]+)/g, (_, name) => { paramNames.push(name); return '([^/]+)'; })
    + '$';
  routes.push({ pattern, regex: new RegExp(regexStr), paramNames, handler });
}

/**
 * Navigate to a hash route
 * @param {string} hash  e.g. '#/catalog'
 */
export function navigate(hash) {
  window.location.hash = hash;
}

/**
 * Initialize router — call once after all routes are registered
 * @param {HTMLElement} container
 */
export function initRouter(container) {
  const resolve = async () => {
    // Run cleanup of previous view (e.g. stop timers)
    if (typeof currentCleanup === 'function') {
      currentCleanup();
      currentCleanup = null;
    }

    const fullHash = window.location.hash || '#/home';
    window.scrollTo(0, 0);

    // Separate path from query string: '#/catalog?cat=Cocina' → path='#/catalog'
    const qIndex = fullHash.indexOf('?');
    const hashPath = qIndex >= 0 ? fullHash.slice(0, qIndex) : fullHash;

    // Dispatch a custom event so views can react to nav changes (active link highlight)
    window.dispatchEvent(new CustomEvent('routeChanged', { detail: { hash: fullHash, path: hashPath } }));

    let matched = false;
    for (const { regex, paramNames, handler } of routes) {
      const match = hashPath.match(regex);
      if (match) {
        matched = true;
        const params = {};
        paramNames.forEach((n, i) => params[n] = decodeURIComponent(match[i + 1]));
        try {
          const cleanup = await handler(params, container);
          currentCleanup = cleanup || null;
        } catch (err) {
          console.error('[Router] Error rendering view:', err);
          container.innerHTML = `<div class="error-view"><h2>Error</h2><p>${err.message}</p></div>`;
        }
        break;
      }
    }

    if (!matched) {
      container.innerHTML = `
        <div class="error-view animate-fade-up">
          <h2>404 — Página no encontrada</h2>
          <p>La ruta <code>${fullHash}</code> no existe en este sitio.</p>
          <br>
          <a href="#/home" class="btn btn--primary">Volver al Inicio</a>
        </div>`;
    }
  };

  window.addEventListener('hashchange', resolve);
  resolve(); // resolve initial hash on load
}
