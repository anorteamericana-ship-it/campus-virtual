// F98.4-Z6-CS21A71 · English LAB Gratis estable, sin verificación por cada clic
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A71';
  const EVENT_NAME = 'an:english-lab-free-access';
  const ENDPOINT = 'freeUserEnglishLabAccess';
  const CACHE_KEY = 'an_english_lab_free_access_cs21a71';
  const CACHE_TTL = 30 * 60 * 1000;

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  function truthy(value) {
    return value === true || /^(TRUE|SI|SÍ|1|YES)$/i.test(clean(value));
  }

  function falsey(value) {
    return value === false || /^(FALSE|NO|0)$/i.test(clean(value));
  }

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

  function codeOf(user) {
    return clean(user?.codigo || user?.CODIGO || user?.CODIGO_ESTUDIANTE);
  }

  function isFreeUser(user) {
    const role = clean(user?.rol || user?.role).toLowerCase();
    if (role !== 'student' && role !== 'estudiante') return false;
    if (codeOf(user)) return false;

    const explicit = user?.estudiante_gratis === true || user?.perfil_pre_matricula === true ||
      truthy(user?.estudiante_gratis) || truthy(user?.perfil_pre_matricula);
    const type = [user?.tipoUsuario, user?.tipo_usuario, user?.origen, user?.ORIGEN, user?.etapa, user?.ETAPA]
      .map(clean).join(' ').toLowerCase();
    const marker = /gratis|free|prospect|prematric|lead|formulario/.test(type);
    const group = clean(user?.grupo || user?.GRUPO || user?.grupo_actual || user?.GRUPO_ACTUAL);
    const academic = clean(user?.matricula || user?.MATRICULA || user?.estadoAcademico || user?.ESTADO_ACADEMICO || user?.nivel_activo || user?.NIVEL_ACTIVO);
    return explicit || marker || (!group && !academic);
  }

  function signature(user) {
    return [
      clean(user?.rol || user?.role).toLowerCase(),
      clean(user?.cedula || user?.CEDULA || user?.usuario),
      codeOf(user),
      clean(user?.grupo || user?.GRUPO),
    ].join('|');
  }

  function baseState(user) {
    const freeUser = isFreeUser(user);
    const sig = signature(user);
    if (!freeUser) {
      return {
        loading:false, refreshing:false, checked:true, allowed:true, freeUser:false,
        estado:codeOf(user) ? 'ESTUDIANTE_MATRICULADO' : 'NO_APLICA', message:'', signature:sig, checkedAt:Date.now(),
      };
    }

    const rawAllowed = user?.english_lab_gratis_autorizado ?? user?.inicio_gratuito_autorizado;
    const hasExplicitFlag = rawAllowed !== undefined && rawAllowed !== null && clean(rawAllowed) !== '';
    if (hasExplicitFlag) {
      const allowed = truthy(rawAllowed);
      return {
        loading:false, refreshing:false, checked:true, allowed, freeUser:true,
        estado:clean(user?.english_lab_gratis_estado || (allowed ? 'AUTORIZADO' : 'NO_AUTORIZADO')),
        message:clean(user?.english_lab_gratis_mensaje || ''), signature:sig, checkedAt:Date.now(),
      };
    }

    return {
      loading:false, refreshing:false, checked:false, allowed:null, freeUser:true,
      estado:'SIN_VERIFICAR', message:'', signature:sig, checkedAt:0,
    };
  }

  function readCache(user) {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || parsed.signature !== signature(user)) return null;
      if (!Number(parsed.checkedAt) || Date.now() - Number(parsed.checkedAt) > CACHE_TTL) return null;
      return {
        loading:false,
        refreshing:false,
        checked:parsed.checked === true,
        allowed:parsed.allowed === true,
        freeUser:isFreeUser(user),
        estado:clean(parsed.estado || ''),
        message:clean(parsed.message || ''),
        signature:signature(user),
        checkedAt:Number(parsed.checkedAt),
      };
    } catch (_) {
      return null;
    }
  }

  function initialState() {
    const user = session();
    const fromSession = baseState(user);
    if (fromSession.checked) return fromSession;
    return readCache(user) || fromSession;
  }

  let state = initialState();
  let inFlight = null;

  function persist() {
    if (!state.checked) return;
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        checked:state.checked,
        allowed:state.allowed,
        estado:state.estado,
        message:state.message,
        signature:state.signature,
        checkedAt:state.checkedAt || Date.now(),
      }));
    } catch (_) {}
  }

  async function post(fn, payload = {}, timeout = 45000) {
    const endpoint = window.APPS_SCRIPT_URL;
    if (!endpoint) throw new Error('No está configurada la URL de Apps Script.');
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeout) : null;
    try {
      const response = await fetch(`${endpoint}?fn=${encodeURIComponent(fn)}`, {
        method:'POST',
        headers:{ 'Content-Type':'text/plain;charset=utf-8' },
        body:JSON.stringify({ fn, token:token(), ...payload }),
        signal:controller ? controller.signal : undefined,
      });
      const raw = await response.text();
      let data = null;
      try { data = raw ? JSON.parse(raw) : null; }
      catch (_) { throw new Error('Apps Script devolvió una respuesta inválida.'); }
      if (!response.ok || !data || data.ok !== true) {
        throw new Error(data?.mensaje || data?.error || `HTTP ${response.status}`);
      }
      return data;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function englishLabMenuButtons() {
    return Array.from(document.querySelectorAll('aside.student-sb button, aside[data-role="student"] button'))
      .filter(button => clean(button.querySelector('.sb-label')?.textContent || button.textContent) === 'English LAB');
  }

  function syncMenu() {
    const user = session();
    const freeUser = isFreeUser(user);
    const visible = !freeUser || state.allowed === true;
    englishLabMenuButtons().forEach(button => {
      button.style.display = visible ? '' : 'none';
      button.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if (!visible) button.tabIndex = -1;
      else button.removeAttribute('tabindex');
    });
  }

  function publish() {
    persist();
    try { window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail:{ ...state } })); } catch (_) {}
    syncMenu();
  }

  function primeAccess(input) {
    const user = session();
    if (!isFreeUser(user)) {
      state = baseState(user);
      publish();
      return state;
    }

    const source = input?.acceso_english_lab || input || {};
    const allowed = source.allowed === true || source.autorizado === true || truthy(source.english_lab_gratis_autorizado) || truthy(source.inicio_gratuito_autorizado);
    const denied = source.allowed === false || source.autorizado === false || falsey(source.english_lab_gratis_autorizado) || falsey(source.inicio_gratuito_autorizado);
    if (!allowed && !denied) return state;

    state = {
      loading:false,
      refreshing:false,
      checked:true,
      allowed,
      freeUser:true,
      estado:clean(source.estado || source.english_lab_gratis_estado || (allowed ? 'AUTORIZADO' : 'NO_AUTORIZADO')),
      message:clean(source.mensaje || source.english_lab_gratis_mensaje || ''),
      signature:signature(user),
      checkedAt:Date.now(),
    };
    publish();
    return state;
  }

  async function checkAccess(force = false) {
    const user = session();
    const freeUser = isFreeUser(user);
    const nextSignature = signature(user);

    if (!freeUser) {
      state = baseState(user);
      publish();
      return state;
    }

    if (state.signature !== nextSignature) {
      state = readCache(user) || baseState(user);
    }

    const fresh = state.checked && state.checkedAt && Date.now() - state.checkedAt < CACHE_TTL;
    if (!force && fresh) {
      syncMenu();
      return state;
    }
    if (inFlight) return inFlight;

    // Una revalidación nunca bloquea una autorización ya confirmada.
    const hadDecision = state.checked;
    state = {
      ...state,
      loading:!hadDecision,
      refreshing:hadDecision,
      freeUser:true,
      signature:nextSignature,
      estado:hadDecision ? state.estado : 'VERIFICANDO',
      message:hadDecision ? state.message : 'Verificando aprobación de la prematrícula…',
    };
    publish();

    inFlight = post(ENDPOINT)
      .then(response => {
        state = {
          loading:false,
          refreshing:false,
          checked:true,
          allowed:response.allowed === true || response.autorizado === true,
          freeUser:true,
          estado:clean(response.estado || ''),
          message:clean(response.mensaje || ''),
          signature:nextSignature,
          checkedAt:Date.now(),
        };
        publish();
        return state;
      })
      .catch(error => {
        // Si ya estaba permitido, una falla temporal no expulsa ni tapa la pantalla.
        if (hadDecision && state.allowed === true) {
          state = { ...state, loading:false, refreshing:false, checked:true, estado:state.estado || 'AUTORIZADO', checkedAt:Date.now() };
        } else {
          state = {
            loading:false,
            refreshing:false,
            checked:true,
            allowed:false,
            freeUser:true,
            estado:'NO_CONFIRMADO',
            message:clean(error?.message || error || 'No fue posible confirmar el acceso.'),
            signature:nextSignature,
            checkedAt:Date.now(),
          };
        }
        publish();
        return state;
      })
      .finally(() => { inFlight = null; });

    return inFlight;
  }

  function accessSnapshot() {
    const user = session();
    if (!isFreeUser(user)) return { ...state, allowed:true, freeUser:false, checked:true };
    return { ...state, freeUser:true };
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
      'data-screen-label':`English LAB Gratis · ${loading ? 'verificando' : 'pendiente'}`,
      style:{ maxWidth:680, margin:'56px auto', padding:'30px 32px', border:'1px solid #E5D5A8', borderRadius:18, background:'#FFFDF6', boxShadow:'0 10px 32px rgba(0,0,0,.07)', textAlign:'center' },
    },
      React.createElement('div', { style:{ fontSize:11, fontWeight:950, letterSpacing:'.14em', textTransform:'uppercase', color:'#7A1E2C' } }, 'Prematrícula'),
      React.createElement('h1', { style:{ margin:'9px 0 8px', fontFamily:'var(--f-serif,Georgia,serif)', fontSize:30, color:'#001E47' } }, title),
      React.createElement('p', { style:{ margin:'0 auto', maxWidth:540, fontSize:13.5, lineHeight:1.65, color:'#5F6875' } }, body),
      !loading && React.createElement('button', { type:'button', className:'btn btn-primary', onClick:goBack, style:{ marginTop:18 } }, 'Volver a Mi Campus')
    );
  }

  function installAcademiaPlayGate() {
    const Base = window.AcademiaPlayView;
    if (typeof Base !== 'function' || Base.__cs21a71FreeAccessGate) return false;

    const Wrapped = function AcademiaPlayViewCS21A71(props) {
      const [access, setAccess] = React.useState(accessSnapshot);
      React.useEffect(() => {
        const update = event => setAccess(event?.detail || accessSnapshot());
        window.addEventListener(EVENT_NAME, update);
        checkAccess(false);
        return () => window.removeEventListener(EVENT_NAME, update);
      }, []);

      const freeUser = isFreeUser(session());
      if (!freeUser || access.allowed === true) return React.createElement(Base, props);
      return React.createElement(AccessMessage, { loading:access.loading || !access.checked });
    };

    Wrapped.__cs21a71FreeAccessGate = true;
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
  window.addEventListener('an:session-changed', () => {
    state = initialState();
    checkAccess(false);
  });
  window.addEventListener('an:free-user-solicitudes-changed', () => checkAccess(true));

  installAcademiaPlayGate();
  checkAccess(false);
  const probe = setInterval(() => { if (installAcademiaPlayGate()) clearInterval(probe); }, 250);
  setTimeout(() => clearInterval(probe), 30000);

  window.__AN_ENGLISH_LAB_FREE_ACCESS_VERSION__ = VERSION;
  window.anEnglishLabFreeAccess = { check:checkAccess, get:accessSnapshot, prime:primeAccess };
})();