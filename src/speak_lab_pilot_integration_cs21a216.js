// SPEAK LAB · CS21A216 · integración aislada al Campus
// No modifica el router de app.jsx para evitar colisión con la renovación English LAB.
(function(){
  'use strict';

  const VERSION = 'CS21A216';
  const RUNTIME_FILE = 'src/speak_lab_pilot_runtime_cs21a216.js?v=CS21A216';
  const VIEW_FILE = 'src/speak_lab_pilot_view_cs21a216.jsx?v=CS21A216';
  let overlayRoot = null;
  let overlayHost = null;
  let opening = false;
  let observer = null;
  let resizeHandler = null;

  function clean(value){
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function activeRole(){
    const session = typeof window.getSesion === 'function' ? window.getSesion() : null;
    return clean(session && session.rol).toLowerCase();
  }

  function eligible(){
    const role = activeRole();
    return role === 'teacher' || role === 'student';
  }

  function labelOf(button){
    const label = button && button.querySelector ? button.querySelector('.sb-label') : null;
    return clean(label ? label.textContent : button && button.textContent);
  }

  function makeIcon(){
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.style.width = '18px';
    icon.style.height = '18px';
    icon.style.display = 'inline-grid';
    icon.style.placeItems = 'center';
    icon.style.fontSize = '15px';
    icon.textContent = '🎙';
    return icon;
  }

  function makeButton(aside){
    const role = clean(aside && aside.getAttribute('data-role')).toLowerCase();
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `sb-item ${role === 'teacher' ? 'teacher-sb-item' : 'student-sb-item'} speak-lab-pilot-nav-cs21a216`;
    button.setAttribute('data-nav-id', 'speak_lab');
    button.setAttribute('data-speak-lab-pilot', VERSION);
    button.title = 'Speak LAB · práctica oral beta';
    button.appendChild(makeIcon());

    const label = document.createElement('span');
    label.className = 'sb-label';
    label.textContent = 'Speak LAB';
    button.appendChild(label);

    const badge = document.createElement('span');
    badge.className = 'sb-badge';
    badge.textContent = 'Beta';
    button.appendChild(badge);

    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      open();
    });
    return button;
  }

  function ensureButton(){
    if (!eligible()) {
      document.querySelectorAll('[data-speak-lab-pilot]').forEach(node => node.remove());
      return;
    }
    const aside = document.querySelector('aside.sb') || document.querySelector('aside');
    if (!aside) return;
    if (aside.querySelector('[data-speak-lab-pilot]')) return;
    const buttons = Array.from(aside.querySelectorAll('button.sb-item'));
    const english = buttons.filter(button => /^English LAB(?:\s+Live)?$/i.test(labelOf(button)));
    const anchor = english.length ? english[english.length - 1] : buttons.find(button => /^Exámenes$/i.test(labelOf(button)));
    const button = makeButton(aside);
    if (anchor && anchor.parentNode) {
      if (english.length) anchor.parentNode.insertBefore(button, anchor.nextSibling);
      else anchor.parentNode.insertBefore(button, anchor);
    } else {
      const userBox = aside.querySelector('.sb-user');
      if (userBox && userBox.parentNode) userBox.parentNode.insertBefore(button, userBox);
      else aside.appendChild(button);
    }
  }

  function positionOverlay(){
    if (!overlayHost) return;
    const main = document.querySelector('main.main');
    const rect = main ? main.getBoundingClientRect() : { left:0, top:0 };
    overlayHost.style.left = `${Math.max(0, Math.round(rect.left || 0))}px`;
    overlayHost.style.top = `${Math.max(0, Math.round(rect.top || 0))}px`;
  }

  async function ensureView(){
    if (typeof window.SpeakLabPilotView === 'function' && window.SpeakLabPilotRuntimeCS21A216) return window.SpeakLabPilotView;
    if (!window.anLazyCampus || typeof window.anLazyCampus.loadMany !== 'function') {
      throw new Error('El cargador del Campus todavía no está disponible.');
    }
    await window.anLazyCampus.loadMany([RUNTIME_FILE, VIEW_FILE]);
    if (typeof window.SpeakLabPilotView !== 'function' || !window.SpeakLabPilotRuntimeCS21A216) {
      throw new Error('Speak LAB cargó incompleto. Recargá el Campus.');
    }
    return window.SpeakLabPilotView;
  }

  function markButton(active){
    const button = document.querySelector('[data-speak-lab-pilot]');
    if (!button) return;
    button.classList.toggle('active', !!active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }

  function close(){
    opening = false;
    if (overlayRoot) {
      try { overlayRoot.unmount(); } catch (_) {}
    }
    overlayRoot = null;
    if (overlayHost) overlayHost.remove();
    overlayHost = null;
    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
    document.body.style.removeProperty('--speak-lab-pilot-open');
    markButton(false);
    try { window.dispatchEvent(new CustomEvent('an:speak-lab-pilot-close', { detail:{ version:VERSION } })); } catch (_) {}
  }

  async function open(){
    if (opening || overlayHost || !eligible()) return;
    opening = true;
    markButton(true);

    const host = document.createElement('div');
    host.setAttribute('data-speak-lab-pilot-overlay', VERSION);
    Object.assign(host.style, {
      position:'fixed',
      right:'0',
      bottom:'0',
      zIndex:'450',
      overflow:'auto',
      background:'#f7f4ef',
      overscrollBehavior:'contain',
    });
    document.body.appendChild(host);
    overlayHost = host;
    positionOverlay();
    resizeHandler = positionOverlay;
    window.addEventListener('resize', resizeHandler);

    const loading = document.createElement('div');
    loading.style.cssText = 'display:grid;place-items:center;min-height:100%;padding:32px;font-family:system-ui;color:#29415f;font-weight:700;';
    loading.textContent = 'Preparando Speak LAB…';
    host.appendChild(loading);

    try {
      const View = await ensureView();
      if (!overlayHost || overlayHost !== host) return;
      host.textContent = '';
      overlayRoot = ReactDOM.createRoot(host);
      overlayRoot.render(React.createElement(View, { onClose:close }));
      document.body.style.setProperty('--speak-lab-pilot-open', '1');
      try { window.dispatchEvent(new CustomEvent('an:speak-lab-pilot-open', { detail:{ version:VERSION, role:activeRole() } })); } catch (_) {}
    } catch (error) {
      host.textContent = '';
      const box = document.createElement('div');
      box.style.cssText = 'max-width:680px;margin:60px auto;padding:24px;border-radius:16px;background:#fff;border:1px solid #e5e0d8;font-family:system-ui;color:#8b1f1f;';
      const title = document.createElement('strong');
      title.textContent = 'No se pudo abrir Speak LAB';
      const message = document.createElement('div');
      message.style.marginTop = '8px';
      message.textContent = clean(error && error.message) || 'Recargá el Campus e intentá nuevamente.';
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Cerrar';
      button.style.cssText = 'margin-top:16px;padding:9px 14px;border-radius:9px;border:1px solid #ccd3dd;background:#fff;cursor:pointer;';
      button.addEventListener('click', close);
      box.append(title, message, button);
      host.appendChild(box);
    } finally {
      opening = false;
    }
  }

  function install(){
    ensureButton();
    if (!observer && document.body) {
      observer = new MutationObserver(() => ensureButton());
      observer.observe(document.body, { childList:true, subtree:true });
    }
    window.addEventListener('an:session-changed', () => {
      if (!eligible()) close();
      window.setTimeout(ensureButton, 20);
    });
    window.addEventListener('keydown', event => {
      if (event.key === 'Escape' && overlayHost) close();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();

  window.SpeakLabPilotIntegrationCS21A216 = Object.freeze({
    version:VERSION,
    open,
    close,
    ensureButton,
  });
})();
