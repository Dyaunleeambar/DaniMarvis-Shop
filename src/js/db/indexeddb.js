// ============================================================
// db/indexeddb.js — IndexedDB layer
// Portado desde indexeddb.ts sin dependencias de React/TS
// ============================================================

const DB_NAME    = 'DaniMarvisShop_DB';
const DB_VERSION = 1;

/** @returns {Promise<IDBDatabase>} */
export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error('No se pudo abrir IndexedDB'));

    request.onsuccess = (e) => resolve(e.target.result);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('users')) {
        const us = db.createObjectStore('users', { keyPath: 'id' });
        us.createIndex('email', 'email', { unique: true });
      }
      if (!db.objectStoreNames.contains('orders')) {
        const os = db.createObjectStore('orders', { keyPath: 'id' });
        os.createIndex('userId', 'userId', { unique: false });
      }
      if (!db.objectStoreNames.contains('reviews')) {
        const rs = db.createObjectStore('reviews', { keyPath: 'id' });
        rs.createIndex('productId', 'productId', { unique: false });
      }
    };
  });
}

// ── Generic CRUD helpers ──────────────────────────────────────

export async function dbGetAll(storeName) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName, 'readonly')
                  .objectStore(storeName)
                  .getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(new Error(`Error leyendo ${storeName}`));
  });
}

export async function dbGetById(storeName, id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName, 'readonly')
                  .objectStore(storeName)
                  .get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror   = () => reject(new Error(`Error obteniendo ${id} de ${storeName}`));
  });
}

export async function dbAdd(storeName, item) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).add(item);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(new Error(`Error añadiendo a ${storeName}`));
  });
}

export async function dbUpdate(storeName, item) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(new Error(`Error actualizando en ${storeName}`));
  });
}

export async function dbDelete(storeName, id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(new Error(`Error eliminando ${id} de ${storeName}`));
  });
}

export async function dbGetByIndex(storeName, indexName, value) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName, 'readonly')
                  .objectStore(storeName)
                  .index(indexName)
                  .getAll(IDBKeyRange.only(value));
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(new Error(`Error buscando en índice ${indexName}`));
  });
}

// ── Seed helper ───────────────────────────────────────────────

export async function seedDatabaseIfEmpty() {
  const { SEED_PRODUCTS } = await import('../data/seedProducts.js');

  // Seed products
  const products = await dbGetAll('products');
  if (products.length === 0) {
    const db = await initDB();
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    SEED_PRODUCTS.forEach(p => store.add(p));
    await new Promise((res, rej) => {
      tx.oncomplete = res;
      tx.onerror = () => rej(new Error('Error sembrando productos'));
    });
    console.log('[DB] Productos sembrados correctamente.');
  }

  // Seed users
  const users = await dbGetAll('users');
  if (users.length === 0) {
    const db = await initDB();
    const tx = db.transaction('users', 'readwrite');
    const store = tx.objectStore('users');
    store.add({ id: 'usr-admin',  email: 'admin@danimarvis.com', name: 'Administrador', password: 'admin', isAdmin: true });
    store.add({ id: 'usr-client', email: 'user@danimarvis.com',  name: 'Daniel Fajardo', password: 'user', isAdmin: false });
    await new Promise((res, rej) => {
      tx.oncomplete = res;
      tx.onerror = () => rej(new Error('Error sembrando usuarios'));
    });
    console.log('[DB] Usuarios sembrados correctamente.');
  }
}
