// F98.4-Z6-CS21A66 · English LAB Gratis solo con prematrícula autorizada
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A66';
  const EVENT_NAME = 'an:english-lab-free-access';
  const ENDPOINT = 'freeUserEnglishLabAccess';
  let state = {
    loading: false,
    checked: false,
    allowed: null,
    freeUser: false,
    estado: '',
    message: '',
    signature: '',
  };

  function session() {
    try {
      return (typeof window.getSesion === 'function'
        ? window.getSesion()
        : JSON.parse(sessionStorage.getItem('an_usuario') || 'null')) || {};
    } catch (_) {
      return {};
    }
  }

  function token() {
    return typeof window.getSessionToken === 'function' ? window.getSessionToken() : '';
  }

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  function isFreeUser(user) {
    const role = clean(user?.rol || user?.role).toLowerCase();
    if (role !== 'student' && role !== 'estudiante') return false;
    const explicit = user?.estudiante_gratis === true || user?.perfil_pre_matricula === true ||
      /^(TRUE|SI|SÍ|1)$/i.test(clean(user?.estudiante_gratis || user?.perfil_pre_matricula));
    const code = clean(user?.codigo || user?.CODIGO || user?.CODIGO_ESTUDIANTE);
    const group = clean(user?.grupo || user?.GRUPO || user?.grupo_actual || user?.GRUPO_ACTUAL);
    return explicit || (!code && !group);
  }

  function signature(user) {
    return [
      clean(user?.rol || user?.role).toLowerCase(),
      clean(user?.cedula || user?.CEDULA || user?.usuario),
      clean(user?.codigo || user?.CODIGO),
      clean(user?.grupo || user?.GRUPO),
    ].join('|');
  }

  async function post(fn, payload = {}, timeout = 45000) {
    const endpoint = window.APPS_SCRIPT_URL;
    if (!endpoint) throw new Error('No está configurada la URL de Apps Script.');
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeout) : null;
    try {
      const response = await fetch(`${endpoint}?fn=${encodeURIComponent(fn)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ fn, token: token(), ...payload }),
        signal: controller ? controller.signal : undefined,
      });
      const text = await response.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; }
      catch (_) { throw new Error('Apps Script devolvió una respuesta inválida.'); }
      if (!response.ok || !data || data.ok !== true) {
        throw new Error(data?.mensaje || data?.error || `HTTP ${response.status}`);
      }
      return data;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function publish() {
    try {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { ...state } }));
    } catch (_) {}
    syncMenu();
  }

  async function checkAccess(force = false) {
    const user = session();
    const freeUser = isFreeUser(user);
    const nextSignature = signature(user);

    if (!freeUser) {
      state = {
        loading: false,
        checked: true,
        allowed: true,
        freeUser: false,
        estado: 'NO_APLICA',
        message: '',
        signature: nextSignature,
      };
      publish();
      return state;
    }

    if (!force && state.checked && state.signature === nextSignature) return state;
    if (state.loading && state.signature === nextSignature) return state;

    state = {
      loading: true,
      checked: false,
      allowed: null,
      freeUser: true,
      estado: 'VERIFICANDO',
      message: 'Verificando aprobación de la prematrícula…',
      signature: nextSignature,
    };
    publish();

    try {
      const response = await post(ENDPOINT);
      state = {
        loading: false,
        checked: true,
        allowed: response.allowed === true || response.autorizado === true,
        freeUser: true,
        estado: clean(response.estado || ''),
        message: clean(response.mensaje || ''),
        signature: nextSignature,
      };
    } catch (error) {
      state = {
        loading: false,
        checked: true,
        allowed: false,
        freeUser: true,
        estado: 'NO_CONFIRMADO',
        message: clean(error?.message || error || 'No fue posible confirmar el acceso.'),
        signature: nextSignature,
      };
    }
    publish();
    return state;
  }

  function englishLabMenuButtons() {
    return Array.from(document.querySelectorAll('aside.student-sb button, aside[data-role="student"] button'))
      .filter(button => {
        const label = clean(button.querySelector('.sb-label')?.textContent || button.textContent);
        return label === 'English LAB';
      });
  }

  function syncMenu() {
    const freeUser = isFreeUser(session());
    const visible = !freeUser || state.allowed === true;
    englishLabMenuButtons().forEach(button => {
      button.style.display = visible ? '' : 'none';
      button.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if (!visible) button.tabIndex = -1;
      else button.removeAttribute('tabindex');
    });
  }

  function accessSnapshot() {
    const user = session();
    if (!isFreeUser(user)) return { ...state, allowed: true, freeUser: false, checked: true };
    return { ...state, freeUser: true };
  }

  function AccessMessage({ loading }) {
    const current = accessSnapshot();
    const title = loading ? 'Verificando acceso' : 'English LAB Gratis pendiente de aprobación';
    const body = loading
      ? 'Estamos confirmando el estado de tu prematrícula.'
      : (current.message || 'Tu prematrícula todavía no ha sido aprobada. English LAB Gratis se habilitará cuando Admisiones autorice el acceso.');

    const goBack = () => {
      try {
        const next = { anCampus:true, route:'dashboard', tabs:{} };
        history.pushState(next, '', '#dashboard');
        window.dispatchEvent(new PopStateEvent('popstate', { state:next }));
      } catch (_) {
        location.hash = '#dashboard';
      }
    };

    return React.createElement('section', {
      'data-screen-label': `English LAB Gratis · ${loading ? 'verificando' : 'pendiente'}`,
      style: { maxWidth:680, margin:'56px auto', padding:'30px 32px', border:'1px solid #E5D5A8', borderRadius:18, background:'#FFFDF6', boxShadow:'0 10px 32px rgba(0,0,0,.07)', textAlign:'center' },
    },
      React.createElement('div', { style:{ fontSize:11, fontWeight:950, letterSpacing:'.14em', textTransform:'uppercase', color:'#7A1E2C' } }, 'Prematrícula'),
      React.createElement('h1', { style:{ margin:'9px 0 8px', fontFamily:'var(--f-serif,Georgia,serif)', fontSize:30, color:'#001E47' } }, title),
      React.createElement('p', { style:{ margin:'0 auto', maxWidth:540, fontSize:13.5, lineHeight:1.65, color:'#5F6875' } }, body),
      !loading && React.createElement('button', { type:'button', className:'btn btn-primary', onClick:goBack, style:{ marginTop:18 } }, 'Volver a Mi Campus')
    );
  }

  function installAcademiaPlayGate() {
    const Base = window.AcademiaPlayView;
    if (typeof Base !== 'function' || Base.__cs21a66FreeAccessGate) return false;

    const Wrapped = function AcademiaPlayViewCS21A66(props) {
      const [access, setAccess] = React.useState(accessSnapshot);
      React.useEffect(() => {
        const update = event => setAccess(event?.detail || accessSnapshot());
        window.addEventListener(EVENT_NAME, update);
        checkAccess(false);
        return () => window.removeEventListener(EVENT_NAME, update);
      }, []);

      const freeUser = isFreeUser(session());
      if (!freeUser || access.allowed === true) return React.createElement(Base, props);
      return React.createElement(AccessMessage, { loading: access.loading || !access.checked });
    };

    Wrapped.__cs21a66FreeAccessGate = true;
    Wrapped.__base = Base;
    window.AcademiaPlayView = Wrapped;
    try { AcademiaPlayView = Wrapped; } catch (_) {}
    return true;
  }

  let scheduled = false;
  function scheduleSync() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      syncMenu();
      installAcademiaPlayGate();
    });
  }

  const observer = new MutationObserver(scheduleSync);
  observer.observe(document.documentElement, { childList:true, subtree:true });

  window.addEventListener('an:lazy-module-loaded', () => {
    installAcademiaPlayGate();
    scheduleSync();
  });
  window.addEventListener('an:session-changed', () => checkAccess(true));
  window.addEventListener('focus', () => {
    if (isFreeUser(session())) checkAccess(true);
  });

  installAcademiaPlayGate();
  checkAccess(true);
  const probe = setInterval(() => { if (installAcademiaPlayGate()) clearInterval(probe); }, 250);
  setTimeout(() => clearInterval(probe), 30000);

  window.__AN_ENGLISH_LAB_FREE_ACCESS_VERSION__ = VERSION;
  window.anEnglishLabFreeAccess = { check:checkAccess, get:accessSnapshot };
})();
