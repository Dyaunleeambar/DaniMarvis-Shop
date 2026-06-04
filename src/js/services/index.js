// ============================================================
// services/index.js — All service modules
// Each service is a plain object with async methods
// ============================================================

import { dbAdd, dbGetAll, dbGetById, dbGetByIndex, dbUpdate, dbDelete } from '../db/indexeddb.js';
import { CONFIG } from '../core/config.js';

// ── cartService ───────────────────────────────────────────────
export const cartService = {
  getCart() {
    try { return JSON.parse(localStorage.getItem(CONFIG.CART_KEY) || '[]'); }
    catch { return []; }
  },
  saveCart(cart) {
    localStorage.setItem(CONFIG.CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  },
  addToCart(product, quantity = 1) {
    const cart = this.getCart();
    const existing = cart.find(i => i.productId === product.id);
    const currentQty = existing ? existing.quantity : 0;
    if (currentQty + quantity > product.stock) {
      return { success: false, message: `Stock disponible: ${product.stock}`, cart };
    }
    if (existing) existing.quantity += quantity;
    else cart.push({ productId: product.id, product, quantity });
    this.saveCart(cart);
    return { success: true, message: 'Añadido al carrito', cart };
  },
  updateQuantity(productId, quantity) {
    const cart = this.getCart();
    const item = cart.find(i => i.productId === productId);
    if (!item) return { success: false, message: 'Producto no encontrado', cart };
    if (quantity <= 0) { return { success: true, message: 'Eliminado', cart: this.removeFromCart(productId) }; }
    if (quantity > item.product.stock) {
      return { success: false, message: `Solo ${item.product.stock} disponibles`, cart };
    }
    item.quantity = quantity;
    this.saveCart(cart);
    return { success: true, message: 'Actualizado', cart };
  },
  removeFromCart(productId) {
    const cart = this.getCart().filter(i => i.productId !== productId);
    this.saveCart(cart);
    return cart;
  },
  clearCart() {
    localStorage.removeItem(CONFIG.CART_KEY);
    window.dispatchEvent(new Event('cartUpdated'));
  },
  getCartTotals() {
    const cart = this.getCart();
    const count    = cart.reduce((s, i) => s + i.quantity, 0);
    const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
    const shipping = (subtotal > CONFIG.SHIPPING_THRESHOLD || subtotal === 0) ? 0 : CONFIG.SHIPPING_COST;
    return { count, subtotal, shipping, total: subtotal + shipping };
  }
};

// ── authService ───────────────────────────────────────────────
export const authService = {
  async registerUser(name, email, password) {
    if (!name || !email || !password) throw new Error('Todos los campos son obligatorios');
    const existing = await dbGetByIndex('users', 'email', email.trim().toLowerCase());
    if (existing.length > 0) throw new Error('Este correo ya está registrado');
    const user = { id: `usr-${Date.now()}`, email: email.trim().toLowerCase(), name: name.trim(), password, isAdmin: false };
    await dbAdd('users', user);
    this.setSession(user);
    return user;
  },
  async loginUser(email, password) {
    const matches = await dbGetByIndex('users', 'email', email.trim().toLowerCase());
    if (!matches.length || matches[0].password !== password) throw new Error('Credenciales incorrectas');
    this.setSession(matches[0]);
    return matches[0];
  },
  logoutUser() { localStorage.removeItem(CONFIG.SESSION_KEY); },
  setSession(user) {
    const { password: _, ...safe } = user;
    localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(safe));
  },
  getCurrentUser() {
    try { return JSON.parse(localStorage.getItem(CONFIG.SESSION_KEY) || 'null'); }
    catch { return null; }
  },
  isAdmin() { return !!this.getCurrentUser()?.isAdmin; }
};

// ── productService ────────────────────────────────────────────
export const productService = {
  getProducts()            { return dbGetAll('products'); },
  getProductById(id)       { return dbGetById('products', id); },
  async createProduct(p) {
    const product = { ...p, id: p.id || `prod-${Date.now()}` };
    await dbAdd('products', product);
    return product;
  },
  updateProduct(p)         { return dbUpdate('products', p); },
  deleteProduct(id)        { return dbDelete('products', id); },
  async updateStock(id, newStock) {
    const p = await this.getProductById(id);
    if (!p) throw new Error('Producto no encontrado');
    p.stock = Math.max(0, newStock);
    return this.updateProduct(p);
  }
};

// ── orderService ──────────────────────────────────────────────
export const orderService = {
  async createOrder(userId, userEmail, shippingAddress, cartItems, subtotal, total) {
    if (!cartItems.length) throw new Error('El carrito está vacío');
    for (const item of cartItems) {
      const p = await productService.getProductById(item.productId);
      if (!p) throw new Error(`Producto ${item.product.title} no encontrado`);
      if (p.stock < item.quantity) throw new Error(`Stock insuficiente para "${p.title}"`);
    }
    for (const item of cartItems) {
      const p = await productService.getProductById(item.productId);
      if (p) await productService.updateStock(p.id, p.stock - item.quantity);
    }
    const order = {
      id: `order-${Math.floor(100000 + Math.random() * 900000)}`,
      userId, userEmail, shippingAddress,
      items: cartItems.map(i => ({ productId: i.productId, title: i.product.title, price: i.product.price, quantity: i.quantity, imageUrl: i.product.imageUrl })),
      subtotal, total, status: 'pendiente',
      createdAt: new Date().toISOString()
    };
    await dbAdd('orders', order);
    window.dispatchEvent(new CustomEvent('orderCreated', { detail: order }));
    return order;
  },
  getOrderById(id)          { return dbGetById('orders', id); },
  async getOrdersByUser(uid) {
    const o = await dbGetByIndex('orders', 'userId', uid);
    return o.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async getAllOrders() {
    const o = await dbGetAll('orders');
    return o.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async updateOrderStatus(orderId, status) {
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error('Pedido no encontrado');
    order.status = status;
    await dbUpdate('orders', order);
    window.dispatchEvent(new CustomEvent('orderStatusChanged', { detail: { orderId, status } }));
  }
};

// ── reviewService ─────────────────────────────────────────────
export const reviewService = {
  async getReviewsForProduct(productId) {
    const r = await dbGetByIndex('reviews', 'productId', productId);
    return r.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async createReview(productId, userId, userName, rating, comment) {
    if (!rating || !comment.trim()) throw new Error('Rating y comentario son obligatorios');
    const review = { id: `rev-${Date.now()}`, productId, userId, userName: userName || 'Usuario Anónimo', rating, comment: comment.trim(), createdAt: new Date().toISOString() };
    await dbAdd('reviews', review);
    const all = await this.getReviewsForProduct(productId);
    const avg = parseFloat((all.reduce((s, r) => s + r.rating, 0) / all.length).toFixed(1));
    const p = await productService.getProductById(productId);
    if (p) { p.rating = avg; await productService.updateProduct(p); }
    return review;
  },
  async seedDefaultReviews() {
    const existing = await dbGetByIndex('reviews', 'productId', 'prod-1');
    if (existing.length > 0) return;
    const defaults = [
      { id: 'rev-def-1', productId: 'prod-1', userId: 'usr-client', userName: 'Daniel Fajardo', rating: 5, comment: 'Increíbles auriculares. La cancelación de ruido es una maravilla.', createdAt: new Date(Date.now() - 3*86400000).toISOString() },
      { id: 'rev-def-2', productId: 'prod-1', userId: 'usr-anon-1', userName: 'María G.', rating: 4, comment: 'La calidad del audio es excelente. Serían perfectos con funda de viaje.', createdAt: new Date(Date.now() - 5*86400000).toISOString() },
      { id: 'rev-def-3', productId: 'prod-2', userId: 'usr-anon-2', userName: 'Carlos Luna', rating: 5, comment: 'Superó todas mis expectativas. Batería de más de una semana.', createdAt: new Date(Date.now() - 2*86400000).toISOString() },
      { id: 'rev-def-4', productId: 'prod-8', userId: 'usr-client', userName: 'Daniel Fajardo', rating: 5, comment: 'Cambió mi perspectiva de productividad por completo.', createdAt: new Date(Date.now() - 1*86400000).toISOString() },
    ];
    for (const r of defaults) await dbAdd('reviews', r);
  }
};

// ── shippingService ───────────────────────────────────────────
const STATUS_FLOW = { pendiente: 'procesando', procesando: 'enviado', enviado: 'entregado', entregado: null };
let _intervalId = null;

export const shippingService = {
  startSimulator() {
    if (_intervalId) return;
    console.log('[LOGÍSTICA] Simulador activo (15s)');
    _intervalId = setInterval(async () => {
      try {
        const orders = await orderService.getAllOrders();
        const pending = orders.filter(o => o.status !== 'entregado');
        if (!pending.length) return;
        const target = pending[Math.floor(Math.random() * pending.length)];
        const next = STATUS_FLOW[target.status];
        if (next) {
          await orderService.updateOrderStatus(target.id, next);
          console.log(`[LOGÍSTICA] Pedido ${target.id}: ${target.status} → ${next}`);
        }
      } catch (e) { console.error('[LOGÍSTICA] Error en simulador:', e); }
    }, CONFIG.SIMULATOR_INTERVAL);
  },
  stopSimulator() {
    if (_intervalId) { clearInterval(_intervalId); _intervalId = null; }
  }
};
