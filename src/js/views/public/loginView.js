// views/public/loginView.js
import { authService } from '../../services/index.js';
import { validationUtils } from '../../utils/utils.js';
import { showToast } from '../../core/app.js';
import { navigate } from '../../core/router.js';

export function render(container) {
  // Redirect if already logged in
  if (authService.getCurrentUser()) {
    navigate('#/home');
    return;
  }

  container.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'auth-container animate-fade-up';
  wrap.innerHTML = `
    <div class="auth-logo">
      <a href="#/home" style="font-size:1.6rem;font-weight:800;color:var(--c-slate-900);letter-spacing:-0.04em">
        DaniMarvis<span style="color:var(--c-amber-400);font-size:0.75rem;font-weight:700;background:var(--c-amber-50);border-radius:4px;padding:1px 6px;margin-left:4px">Shop</span>
      </a>
    </div>
    <div class="card card--padded">
      <h1 style="font-size:var(--fs-2xl);font-weight:800;color:var(--c-slate-900);margin-bottom:var(--space-6);letter-spacing:-0.03em">Iniciar Sesión</h1>
      <div style="display:flex;flex-direction:column;gap:var(--space-4)">
        <div class="form-group">
          <label class="form-label">Correo electrónico</label>
          <input type="email" id="l-email" class="form-input" placeholder="tu@email.com" autocomplete="email" />
          <span class="form-error" id="err-email"></span>
        </div>
        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <input type="password" id="l-pass" class="form-input" placeholder="Mínimo 4 caracteres" autocomplete="current-password" />
          <span class="form-error" id="err-pass"></span>
        </div>
        <div id="login-error" style="color:var(--c-red-600);font-size:var(--fs-sm);font-weight:500"></div>
        <button id="login-btn" class="btn btn--primary btn--full btn--lg">Iniciar Sesión</button>
        <div class="section-divider">o</div>
        <a href="#/register" class="btn btn--outline btn--full">Crear cuenta nueva</a>
      </div>
    </div>
    <div style="margin-top:var(--space-4);background:var(--c-amber-50);border:1px solid var(--c-amber-200);border-radius:var(--r-md);padding:var(--space-4)">
      <p style="font-size:var(--fs-xs);font-weight:700;color:#92400e;margin-bottom:var(--space-2)">Cuentas de prueba:</p>
      <p style="font-size:var(--fs-xs);color:#78350f;font-family:var(--font-mono)">
        Cliente: user@danimarvis.com / user<br />
        Admin: admin@danimarvis.com / admin
      </p>
    </div>`;
  container.appendChild(wrap);

  const doLogin = async () => {
    const email = document.getElementById('l-email').value.trim();
    const pass  = document.getElementById('l-pass').value;
    const errEl = document.getElementById('login-error');
    errEl.textContent = '';

    let valid = true;
    if (!validationUtils.isValidEmail(email)) {
      document.getElementById('err-email').textContent = 'Email inválido';
      valid = false;
    } else { document.getElementById('err-email').textContent = ''; }
    if (!pass) {
      document.getElementById('err-pass').textContent = 'Ingresa tu contraseña';
      valid = false;
    } else { document.getElementById('err-pass').textContent = ''; }

    if (!valid) return;

    const btn = document.getElementById('login-btn');
    btn.disabled = true; btn.textContent = 'Ingresando...';

    try {
      const user = await authService.loginUser(email, pass);
      window.dispatchEvent(new Event('authChanged'));
      showToast(`Bienvenido, ${user.name.split(' ')[0]}!`, 'success');
      navigate(user.isAdmin ? '#/admin/dashboard' : '#/home');
    } catch (e) {
      errEl.textContent = e.message;
      btn.disabled = false; btn.textContent = 'Iniciar Sesión';
    }
  };

  document.getElementById('login-btn').addEventListener('click', doLogin);
  document.getElementById('l-pass').addEventListener('keydown', e => e.key === 'Enter' && doLogin());
}
