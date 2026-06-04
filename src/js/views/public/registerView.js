// views/public/registerView.js
import { authService } from '../../services/index.js';
import { validationUtils } from '../../utils/utils.js';
import { showToast } from '../../core/app.js';
import { navigate } from '../../core/router.js';

export function render(container) {
  if (authService.getCurrentUser()) { navigate('#/home'); return; }

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
      <h1 style="font-size:var(--fs-2xl);font-weight:800;margin-bottom:var(--space-6);letter-spacing:-0.03em">Crear cuenta</h1>
      <div style="display:flex;flex-direction:column;gap:var(--space-4)">
        <div class="form-group">
          <label class="form-label">Nombre completo</label>
          <input type="text" id="r-name" class="form-input" placeholder="Tu nombre" autocomplete="name" />
          <span class="form-error" id="err-name"></span>
        </div>
        <div class="form-group">
          <label class="form-label">Correo electrónico</label>
          <input type="email" id="r-email" class="form-input" placeholder="tu@email.com" autocomplete="email" />
          <span class="form-error" id="err-email"></span>
        </div>
        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <input type="password" id="r-pass" class="form-input" placeholder="Mínimo 4 caracteres" autocomplete="new-password" />
          <span class="form-error" id="err-pass"></span>
        </div>
        <div id="reg-error" style="color:var(--c-red-600);font-size:var(--fs-sm);font-weight:500"></div>
        <button id="reg-btn" class="btn btn--primary btn--full btn--lg">Crear mi cuenta</button>
        <div class="section-divider">¿Ya tienes cuenta?</div>
        <a href="#/login" class="btn btn--outline btn--full">Iniciar Sesión</a>
      </div>
    </div>`;
  container.appendChild(wrap);

  document.getElementById('reg-btn').addEventListener('click', async () => {
    const name  = document.getElementById('r-name').value.trim();
    const email = document.getElementById('r-email').value.trim();
    const pass  = document.getElementById('r-pass').value;
    const errEl = document.getElementById('reg-error');
    errEl.textContent = '';
    let valid = true;

    if (!name) { document.getElementById('err-name').textContent = 'Ingresa tu nombre'; valid = false; }
    else document.getElementById('err-name').textContent = '';
    if (!validationUtils.isValidEmail(email)) { document.getElementById('err-email').textContent = 'Email inválido'; valid = false; }
    else document.getElementById('err-email').textContent = '';
    if (!validationUtils.isStrongPassword(pass)) { document.getElementById('err-pass').textContent = 'Mínimo 4 caracteres'; valid = false; }
    else document.getElementById('err-pass').textContent = '';

    if (!valid) return;

    const btn = document.getElementById('reg-btn');
    btn.disabled = true; btn.textContent = 'Creando cuenta...';

    try {
      const user = await authService.registerUser(name, email, pass);
      window.dispatchEvent(new Event('authChanged'));
      showToast(`Cuenta creada. ¡Bienvenido, ${user.name.split(' ')[0]}!`, 'success');
      navigate('#/home');
    } catch (e) {
      errEl.textContent = e.message;
      btn.disabled = false; btn.textContent = 'Crear mi cuenta';
    }
  });
}
