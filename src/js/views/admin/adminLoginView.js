// views/admin/adminLoginView.js
import { authService } from '../../services/index.js';
import { showToast } from '../../core/app.js';
import { navigate } from '../../core/router.js';

export function render(container) {
  if (authService.isAdmin()) { navigate('#/admin/dashboard'); return; }

  container.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'auth-container animate-fade-up';
  wrap.innerHTML = `
    <div class="auth-logo">
      <div style="display:inline-flex;align-items:center;gap:8px;background:var(--c-slate-900);color:#fff;padding:10px 20px;border-radius:var(--r-md)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--c-amber-400)" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span style="font-size:var(--fs-base);font-weight:800;letter-spacing:-0.02em">Panel Admin</span>
      </div>
    </div>
    <div class="card card--padded">
      <h1 style="font-size:var(--fs-xl);font-weight:800;margin-bottom:var(--space-2)">Acceso Administrativo</h1>
      <p style="font-size:var(--fs-sm);color:var(--c-slate-500);margin-bottom:var(--space-6)">Área restringida — solo administradores</p>
      <div style="display:flex;flex-direction:column;gap:var(--space-4)">
        <div class="form-group">
          <label class="form-label">Correo electrónico</label>
          <input type="email" id="a-email" class="form-input" placeholder="admin@danimarvis.com" value="admin@danimarvis.com" />
        </div>
        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <input type="password" id="a-pass" class="form-input" placeholder="admin" value="admin" />
        </div>
        <div id="a-error" style="color:var(--c-red-600);font-size:var(--fs-sm)"></div>
        <button id="a-login-btn" class="btn btn--primary btn--full">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Ingresar al Panel
        </button>
        <a href="#/home" class="btn btn--outline btn--full">← Volver a la tienda</a>
      </div>
    </div>`;
  container.appendChild(wrap);

  document.getElementById('a-login-btn').addEventListener('click', async () => {
    const email = document.getElementById('a-email').value;
    const pass  = document.getElementById('a-pass').value;
    const errEl = document.getElementById('a-error');
    errEl.textContent = '';
    const btn = document.getElementById('a-login-btn');
    btn.disabled = true; btn.textContent = 'Verificando...';

    try {
      const user = await authService.loginUser(email, pass);
      if (!user.isAdmin) throw new Error('Esta cuenta no tiene permisos de administrador.');
      window.dispatchEvent(new Event('authChanged'));
      showToast('Bienvenido al panel de administración.', 'success');
      navigate('#/admin/dashboard');
    } catch (e) {
      errEl.textContent = e.message;
      btn.disabled = false;
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Ingresar al Panel`;
    }
  });

  document.getElementById('a-pass').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('a-login-btn').click();
  });
}
