# DaniMarvis Shop — Vanilla JS SPA

Un ecommerce completo de ecommerce estilo DaniMarvis construido con **HTML + CSS + JavaScript Vanilla puro**.  
Sin frameworks. Sin build tools. Sin npm. Solo abre `index.html` con un servidor estático.

---

## 🚀 Inicio rápido

### Opción 1 — VS Code Live Server (recomendado)
1. Abre la carpeta en VS Code
2. Instala la extensión **Live Server**
3. Click derecho en `index.html` → "Open with Live Server"

### Opción 2 — Python
```bash
python3 -m http.server 3000
# Abre http://localhost:3000
```

### Opción 3 — Node.js (npx serve)
```bash
npx serve .
```

> ⚠️ **Nota:** Los módulos ES (`type="module"`) requieren un servidor HTTP.  
> No funcionarán abriendo `index.html` directamente desde el filesystem (file://).

---

## 🏗️ Arquitectura

```
/danimarvis-shop
  index.html                  ← Punto de entrada único (SPA)
  /src
    /css
      main.css                ← Variables CSS, reset, animaciones
      layout.css              ← Header, footer, grid layout
      components.css          ← Cards, botones, forms, badges, tables
    /js
      /core
        app.js                ← Bootstrap: inicializa DB, header, router
        router.js             ← Hash-based routing con params (:id)
        config.js             ← Constantes globales
      /db
        indexeddb.js          ← Capa IDB: initDB, CRUD helpers, seed
      /data
        seedProducts.js       ← 8 productos iniciales
      /services
        index.js              ← cartService, authService, productService,
                                 orderService, reviewService, shippingService
      /utils
        utils.js              ← formatUtils, validationUtils, domUtils
      /views
        /public
          homeView.js         ← Home con hero + productos destacados
          catalogView.js      ← Catálogo con filtros
          productDetailView.js← Detalle + reseñas
          cartView.js         ← Carrito con qty stepper
          checkoutView.js     ← Checkout con form de envío
          orderTrackingView.js← Seguimiento con timeline reactivo
          loginView.js        ← Login
          registerView.js     ← Registro
        /admin
          adminLoginView.js   ← Login admin
          adminDashboardView.js← Stats + pedidos recientes
          adminProductsView.js← CRUD completo de productos (modal)
          adminOrdersView.js  ← Lista + detalle + cambio de estado
```

---

## 🗃️ Persistencia

| Dato       | Almacén        |
|------------|----------------|
| Productos  | IndexedDB      |
| Usuarios   | IndexedDB      |
| Pedidos    | IndexedDB      |
| Reseñas    | IndexedDB      |
| Carrito    | localStorage   |
| Sesión     | localStorage   |

---

## 👥 Cuentas de prueba

| Rol     | Email               | Contraseña |
|---------|---------------------|------------|
| Admin   | admin@danimarvis.com    | admin      |
| Cliente | user@danimarvis.com     | user       |

---

## 🔄 Flujo principal

```
Home → Catálogo → Detalle de producto
                      ↓ "Agregar al carrito"
                    Carrito → Checkout (requiere login)
                                  ↓ "Confirmar pedido"
                                Seguimiento de pedido
                                (actualización automática cada 15s)
```

---

## ⚙️ Módulos clave

### Router (`router.js`)
- Routing por hash: `#/home`, `#/product/:id`, etc.
- Extrae parámetros dinámicos: `{ id: 'prod-1' }`
- Limpia recursos al cambiar de vista (cleanup pattern)

### Services (`services/index.js`)
- Todos los servicios son objetos con métodos async
- Comunicación vía eventos DOM: `cartUpdated`, `orderStatusChanged`, `authChanged`

### Shipping Simulator (`shippingService`)
- `setInterval` de 15 segundos que avanza pedidos automáticamente
- Las vistas de tracking y admin escuchan `orderStatusChanged` y se re-renderizan en tiempo real

### Router cleanup
Las vistas pueden retornar una función de limpieza del `render()`:
```js
export async function render(container, params) {
  // ... setup
  const handler = () => rerender();
  window.addEventListener('orderStatusChanged', handler);
  return () => window.removeEventListener('orderStatusChanged', handler); // cleanup
}
```

---

## 🛠️ Extensibilidad

| Feature               | Punto de extensión                                |
|-----------------------|---------------------------------------------------|
| Auth OAuth/Social     | `authService.loginWithGoogle()` en `services/index.js` |
| Pagos reales          | Reemplazar `checkoutView.js` confirm handler con Stripe/PayPal SDK |
| Backend real          | Reemplazar `services/index.js` con fetch() calls a tu API REST |
| Más filtros catálogo  | Extender `catalogView.js` applyFilters()          |
| Historial de pedidos  | Nueva ruta `#/orders` usando `orderService.getOrdersByUser()` |
| Notificaciones push   | Reemplazar polling con WebSockets o SSE           |
