// utils/formatUtils.js
export const formatUtils = {
  formatPrice(price) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(price);
  },
  formatDate(isoString) {
    return new Date(isoString).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  },
  renderStars(rating) {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  },
  shortDate(isoString) {
    return new Date(isoString).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }
};

// utils/validationUtils.js
export const validationUtils = {
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
  isStrongPassword(pw) {
    return pw.length >= 4;
  },
  validateShippingAddress(fields) {
    const errors = {};
    if (!fields.name?.trim())    errors.name    = 'El nombre es obligatorio';
    if (!fields.address?.trim()) errors.address = 'La dirección es obligatoria';
    if (!fields.city?.trim())    errors.city    = 'La ciudad es obligatoria';
    if (!fields.country?.trim()) errors.country = 'El país es obligatorio';
    if (!fields.zipCode?.trim()) errors.zipCode = 'El código postal es obligatorio';
    return { isValid: Object.keys(errors).length === 0, errors };
  }
};

// utils/domUtils.js
export const domUtils = {
  /** Create an element with optional props and children */
  el(tag, props = {}, ...children) {
    const elem = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') elem.className = v;
      else if (k === 'html') elem.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') elem.addEventListener(k.slice(2).toLowerCase(), v);
      else elem.setAttribute(k, v);
    }
    children.flat().forEach(c => {
      if (c == null) return;
      elem.append(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return elem;
  },

  /** Clear a container and render new content */
  render(container, ...nodes) {
    container.innerHTML = '';
    nodes.flat().forEach(n => n && container.append(n));
  },

  /** Show a simple loading skeleton */
  skeleton(container, rows = 3) {
    container.innerHTML = Array(rows).fill(0).map(() =>
      `<div style="height:60px;background:var(--c-slate-100);border-radius:var(--r-md);margin-bottom:var(--space-3);animation:fadeIn 1.5s ease infinite alternate"></div>`
    ).join('');
  }
};
