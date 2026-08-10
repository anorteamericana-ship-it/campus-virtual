// F98.4-Z6-CS21A193 · English LAB: acceso confirmado y recuperación honesta.
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A193';
  const EVENT_NAME = 'an:english-lab-free-access';
  const ENDPOINT = 'englishLabAccessStatus';
  const CACHE_KEY = 'an_english_lab_access_cs21a193';
  const CACHE_TTL = 2 * 60 * 1000;
  const DEFAULT_ACCESS_TIMEOUT_MS = 60000;
  // Hook exclusivo de pruebas: solo puede acortar una espera que siempre termina
  // denegando de forma temporal. Nunca cambia allowed ni sustituye al backend.
  const TEST_TIMEOUT_MS = Number(window.__CAMPUS_TEST_HOOKS__?.englishLabAccessTimeoutMs);
  const ACCESS_TIMEOUT_MS = Number.isFinite(TEST_TIMEOUT_MS) && TEST_TIMEOUT_MS > 0
    ? Math.min(DEFAULT_ACCESS_TIMEOUT_MS, Math.max(1, TEST_TIMEOUT_MS))
    : DEFAULT_ACCESS_TIMEOUT_MS;
  const TEMPORARY_MESSAGE = 'No pudimos confirmar tu acceso a English LAB en este momento. Revisá la conexión y volvé a intentarlo.';
  const TIMEOUT_MESSAGE = 'La verificación de English LAB tardó más de lo esperado. Volvé a intentarlo.';
  const TRANSIENT_STATES = Object.freeze([
    'NO_CONFIRMADO',
    'EXPEDIENTE_NO_DISPONIBLE',
    'ESTADO_FINANCIERO_NO_CONFIRMADO',
    'ERROR_VERIFICACION',
    'VERIFICANDO',
  ]);
  const CONCLUSIVE_DENIAL_STATES = Object.freeze([
    'SESION_REQUERIDA',
    'NO_AUTORIZADO',
    'MATRICULA_REQUERIDA',
    'MATRICULA_NO_ACTIVA',
    'CUENTA_PENDIENTE',
  ]);
  const LIVE_LOADER_API = 'EnglishLabLiveCanonicalLoaderCS21A193';

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  function roleOf(user) {
    return clean(user?.rol || user?.role).toLowerCase();
  }

  function isStudent(user) {
    const role = roleOf(user);
    return role === 'student' || role === 'estudiante';
  }

  function isStaff(user) {
    return ['teacher', 'admin', 'superadmin', 'ventas'].includes(roleOf(user));
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
    return clean(user?.codigo || user?.CODIGO || user?.CODIGO_ESTUDIANTE || user?.cod_estudiante);
  }

  function nameOf(user) {
    return clean(user?.nombre || user?.NOMBRE || user?.nombre_completo || user?.name || codeOf(user) || 'Estudiante');
  }

  function signature(user) {
    return [roleOf(user), clean(user?.cedula || user?.CEDULA || user?.usuario), codeOf(user)].join('|');
  }

  function upper(value) {
    return clean(value).toUpperCase();
  }

  function isTransientState(value) {
    return TRANSIENT_STATES.includes(upper(value));
  }

  function isConclusiveDenial(value) {
    return CONCLUSIVE_DENIAL_STATES.includes(upper(value));
  }

  function isConclusiveAccess(value) {
    const source = value && typeof value === 'object' ? value : {};
    if (source.checked !== true) return false;
    if (source.allowed === true) return true;
    return isConclusiveDenial(source.estado);
  }

  function isAbortError(error) {
    const name = upper(error?.name);
    const code = upper(error?.code);
    const message = clean(error?.message || error);
    return name === 'ABORTERROR' || name === 'TIMEOUTERROR' ||
      code === 'ENGLISH_LAB_ACCESS_TIMEOUT' ||
      /signal is aborted|operation was aborted|aborterror/i.test(message);
  }

  function temporaryMessage(error) {
    return isAbortError(error) ? TIMEOUT_MESSAGE : TEMPORARY_MESSAGE;
  }

  function transientState(user, error, estado) {
    return {
      loading:false,
      refreshing:false,
      checked:false,
      allowed:false,
      retryable:true,
      estado:isTransientState(estado) ? upper(estado) : 'NO_CONFIRMADO',
      message:temporaryMessage(error),
      errorCode:clean(error?.code || (isAbortError(error) ? 'ENGLISH_LAB_ACCESS_TIMEOUT' : 'ENGLISH_LAB_ACCESS_UNAVAILABLE')),
      signature:signature(user),
      checkedAt:0,
      failedAt:Date.now(),
      version:VERSION,
    };
  }

  function emptyState(user) {
    const staff = isStaff(user);
    return {
      loading:false,
      refreshing:false,
      checked:staff,
      allowed:staff,
      estado:staff ? 'ROL_AUTORIZADO' : 'SIN_VERIFICAR',
      message:'',
      retryable:false,
      errorCode:'',
      signature:signature(user),
      checkedAt:staff ? Date.now() : 0,
      version:VERSION,
    };
  }

  function readCache(user) {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
      if (!parsed || parsed.signature !== signature(user)) return null;
      if (!isConclusiveAccess(parsed)) {
        sessionStorage.removeItem(CACHE_KEY);
        return null;
      }
      if (!Number(parsed.checkedAt) || Date.now() - Number(parsed.checkedAt) > CACHE_TTL) return null;
      return {
        loading:false,
        refreshing:false,
        checked:parsed.checked === true,
        allowed:parsed.allowed === true,
        estado:clean(parsed.estado),
        message:clean(parsed.message),
        retryable:false,
        errorCode:'',
        signature:signature(user),
        checkedAt:Number(parsed.checkedAt),
        version:VERSION,
      };
    } catch (_) {
      return null;
    }
  }

  let state = readCache(session()) || emptyState(session());
  let inFlight = null;
  let inFlightSignature = '';
  let requestGeneration = 0;

  function persist() {
    try {
      if (!isConclusiveAccess(state)) {
        sessionStorage.removeItem(CACHE_KEY);
        return;
      }
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        checked:state.checked,
        allowed:state.allowed,
        estado:state.estado,
        message:state.message,
        version:VERSION,
        signature:state.signature,
        checkedAt:state.checkedAt,
      }));
    } catch (_) {}
  }

  async function post(fn, payload = {}, timeout = ACCESS_TIMEOUT_MS) {
    const endpoint = window.APPS_SCRIPT_URL;
    if (!endpoint) throw new Error('No está configurada la URL de Apps Script.');
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let timedOut = false;
    const timer = controller ? setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeout) : null;
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
    } catch (error) {
      if (timedOut || isAbortError(error)) {
        const timeoutError = new Error(TIMEOUT_MESSAGE);
        timeoutError.name = 'EnglishLabAccessTimeoutError';
        timeoutError.code = 'ENGLISH_LAB_ACCESS_TIMEOUT';
        timeoutError.temporary = true;
        throw timeoutError;
      }
      throw error;
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
    if (!isStudent(user)) return;
    const checking = state.loading === true;
    const unresolved = !state.checked && !checking;
    const visible = true;
    englishLabMenuButtons().forEach(button => {
      button.style.display = visible ? '' : 'none';
      button.disabled = checking;
      button.setAttribute('aria-hidden', visible ? 'false' : 'true');
      button.setAttribute('aria-busy', checking ? 'true' : 'false');
      if (checking) {
        button.setAttribute('aria-disabled', 'true');
        button.title = 'Confirmando que la cuenta esté al día…';
        button.tabIndex = -1;
      } else if (unresolved) {
        button.removeAttribute('aria-disabled');
        button.title = 'El acceso se verificará al abrir English LAB.';
        button.removeAttribute('tabindex');
      } else {
        button.removeAttribute('aria-disabled');
        button.title = state.checked && state.allowed !== true
          ? 'English LAB requiere matrícula activa y cuenta al día.'
          : '';
        button.removeAttribute('tabindex');
      }
    });
  }

  function hideLegacyLiveDemo() {
    document.querySelectorAll('.ap-view-student button').forEach(button => {
      const text = clean(button.textContent).toLowerCase();
      if (text.includes('live trivia')) {
        button.style.display = 'none';
        button.setAttribute('aria-hidden', 'true');
        button.tabIndex = -1;
      }
    });
  }

  function simplifyLiveJoin() {
    document.querySelectorAll('label').forEach(label => {
      const text = clean(label.textContent).toLowerCase();
      if (text.startsWith('nombre del jugador') || text.startsWith('código / cédula estudiante')) {
        label.style.display = 'none';
        label.setAttribute('aria-hidden', 'true');
      }
    });
  }

  function syncLegacyProspectPanel() {
    const user = session();
    if (!isStudent(user) || codeOf(user)) return;
    document.querySelectorAll('.premat-big-action').forEach(button => {
      const text = clean(button.textContent).toLowerCase();
      if (!text.includes('english lab')) return;
      button.disabled = true;
      button.textContent = 'English LAB · requiere matrícula al día';
      button.title = 'El acceso gratuito por prematrícula ya no habilita English LAB.';
      button.setAttribute('aria-disabled', 'true');
    });
  }

  function publish() {
    persist();
    try { window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail:{ ...state } })); } catch (_) {}
    syncMenu();
  }

  async function checkAccess(force = false) {
    const user = session();
    const nextSignature = signature(user);

    if (isStaff(user)) {
      state = emptyState(user);
      publish();
      return state;
    }

    if (!isStudent(user)) {
      state = {
        ...emptyState(user), checked:true, allowed:false, estado:'NO_AUTORIZADO',
        message:'Este perfil no puede acceder a English LAB.', checkedAt:Date.now(),
      };
      publish();
      return state;
    }

    if (state.signature !== nextSignature) state = readCache(user) || emptyState(user);
    const fresh = state.checked && state.checkedAt && Date.now() - state.checkedAt < CACHE_TTL;
    if (!force && fresh) {
      publish();
      return state;
    }
    if (inFlight && inFlightSignature !== nextSignature) {
      requestGeneration += 1;
      inFlight = null;
      inFlightSignature = '';
    }
    if (inFlight) return inFlight;

    state = {
      ...state,
      loading:true,
      refreshing:state.checked,
      checked:false,
      allowed:false,
      estado:'VERIFICANDO',
      message:'Confirmando que la cuenta esté al día…',
      retryable:false,
      errorCode:'',
      signature:nextSignature,
    };
    publish();

    const generation = ++requestGeneration;
    const requestIsCurrent = () => generation === requestGeneration && signature(session()) === nextSignature;
    let requestPromise = null;
    requestPromise = post(ENDPOINT, { force:force === true })
      .then(response => {
        if (!requestIsCurrent()) return accessSnapshot();
        const responseState = upper(response.estado);
        if (isTransientState(responseState)) {
          state = transientState(user, { code:'ENGLISH_LAB_ACCESS_UNAVAILABLE' }, responseState);
          publish();
          return state;
        }
        const allowed = response.allowed === true || response.autorizado === true;
        if (!allowed && !isConclusiveDenial(responseState)) {
          state = transientState(user, { code:'ENGLISH_LAB_ACCESS_UNAVAILABLE' }, responseState);
          publish();
          return state;
        }
        state = {
          loading:false,
          refreshing:false,
          checked:true,
          allowed,
          estado:responseState,
          message:clean(response.mensaje || ''),
          retryable:false,
          errorCode:'',
          signature:nextSignature,
          checkedAt:Date.now(),
          version:clean(response.version || VERSION),
          nivel:clean(response.nivel || response.nivel_activo || ''),
        };
        publish();
        return state;
      })
      .catch(error => {
        if (!requestIsCurrent()) return accessSnapshot();
        state = transientState(user, error, 'NO_CONFIRMADO');
        publish();
        return state;
      })
      .finally(() => {
        if (inFlight !== requestPromise) return;
        inFlight = null;
        inFlightSignature = '';
        if (requestIsCurrent()) publish();
      });

    inFlight = requestPromise;
    inFlightSignature = nextSignature;
    return requestPromise;
  }

  function accessSnapshot() {
    return { ...state };
  }

  // Compatibilidad con el portal histórico: una aprobación de prematrícula ya no
  // concede English LAB. Siempre se vuelve a verificar el estado financiero real.
  function primeAccess() {
    checkAccess(true);
    return accessSnapshot();
  }

  function AccessMessage({ loading }) {
    const current = accessSnapshot();
    const checking = loading === true || current.loading === true || current.refreshing === true;
    const temporary = current.retryable === true || isTransientState(current.estado);
    const title = checking
      ? 'Verificando acceso'
      : (temporary ? 'No pudimos confirmar tu acceso' : 'English LAB no disponible');
    const body = checking
      ? 'Estamos confirmando que tu cuenta académica esté al día.'
      : (temporary
        ? (current.message || TEMPORARY_MESSAGE)
        : (current.message || 'English LAB está disponible únicamente para estudiantes con matrícula activa y cuenta al día.'));

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
      'data-screen-label':`English LAB · ${checking ? 'verificando' : (temporary ? 'reintento' : 'restringido')}`,
      style:{ maxWidth:700, margin:'56px auto', padding:'30px 32px', border:'1px solid #E5D5A8', borderRadius:18, background:'#FFFDF6', boxShadow:'0 10px 32px rgba(0,0,0,.07)', textAlign:'center' },
    },
      React.createElement('div', { style:{ fontSize:11, fontWeight:950, letterSpacing:'.14em', textTransform:'uppercase', color:'#7A1E2C' } }, 'Acceso financiero'),
      React.createElement('h1', { style:{ margin:'9px 0 8px', fontFamily:'var(--f-serif,Georgia,serif)', fontSize:30, color:'#001E47' } }, title),
      React.createElement('p', { style:{ margin:'0 auto', maxWidth:570, fontSize:13.5, lineHeight:1.65, color:'#5F6875' } }, body),
      !checking && React.createElement('div', { style:{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', marginTop:18 } },
        React.createElement('button', { type:'button', className:'btn btn-primary', disabled:inFlight != null, onClick:() => checkAccess(true) }, 'Verificar de nuevo'),
        React.createElement('button', { type:'button', className:'btn btn-ghost', onClick:goBack }, 'Volver a Mi Campus')
      )
    );
  }

  function LiveRoomEntryPanel({ onOpen }) {
    const [error, setError] = React.useState('');
    const [busy, setBusy] = React.useState(false);

    const enter = async () => {
      setBusy(true);
      setError('');
      try {
        const loader = window[LIVE_LOADER_API] || window.EnglishLabCanonicalLoaderCS21A193;
        if (!loader || typeof loader.loadStudent !== 'function') throw new Error('El cargador canónico de English LAB Live no está disponible.');
        const StudentView = await loader.loadStudent();
        if (typeof StudentView !== 'function' || typeof window.EnglishLabLiveStudentView !== 'function') {
          throw new Error('English LAB Live no publicó la pantalla canónica del estudiante.');
        }
        onOpen();
      } catch (e) {
        setError(clean(e?.message || e || 'No se pudo abrir la sala.'));
      } finally {
        setBusy(false);
      }
    };

    return React.createElement('section', {
      'data-screen-label':'English LAB · Entrar a sala',
      style:{ margin:'0 0 18px', padding:'20px 22px', border:'1px solid #B7D5FF', borderRadius:22, background:'linear-gradient(135deg,#EEF4FF 0%,#FFFFFF 72%)', boxShadow:'0 12px 30px rgba(7,59,122,.10)' },
    },
      React.createElement('div', { style:{ fontSize:11, fontWeight:950, letterSpacing:'.14em', textTransform:'uppercase', color:'#7A1E2C' } }, 'Sala en vivo'),
      React.createElement('h2', { style:{ margin:'6px 0 5px', color:'#001E47', fontSize:26 } }, 'Entrar con el código del docente'),
      React.createElement('p', { style:{ margin:'0 0 14px', color:'#5F6875', fontSize:13.5, lineHeight:1.55 } }, 'Abrí la sala y escribí el código LAB-####. Podés entrar aunque reúna estudiantes de otros grupos o del Club I CAN; tu identidad se toma de la sesión del Campus.'),
      error ? React.createElement('div', { style:{ marginBottom:12, padding:'10px 12px', borderRadius:12, background:'#FDECEA', color:'#8B1F1F', fontSize:12.5, fontWeight:700 } }, error) : null,
      React.createElement('button', { type:'button', className:'btn btn-primary', disabled:busy, onClick:enter, style:{ minHeight:48, padding:'0 22px' } }, busy ? 'Abriendo…' : 'Ingresar con código')
    );
  }

  function installAcademiaPlayGate() {
    const Base = window.AcademiaPlayView;
    if (typeof Base !== 'function' || Base.__cs21a144AccessGate) return false;

    const Wrapped = function AcademiaPlayViewCS21A144(props) {
      const [access, setAccess] = React.useState(accessSnapshot);
      const [liveOpen, setLiveOpen] = React.useState(false);

      React.useEffect(() => {
        const update = event => setAccess(event?.detail || accessSnapshot());
        window.addEventListener(EVENT_NAME, update);
        checkAccess(false);
        return () => window.removeEventListener(EVENT_NAME, update);
      }, []);

      if (isStudent(session()) && (access.allowed !== true || access.signature !== signature(session()))) {
        return React.createElement(AccessMessage, { loading:access.loading || access.refreshing || (!access.checked && !access.retryable) });
      }

      if (liveOpen && typeof window.EnglishLabLiveStudentView === 'function') {
        const Live = window.EnglishLabLiveStudentView;
        const user = session();
        const liveProps = { ...props, usuario:{ ...(props.usuario || {}), ...user, nombre:nameOf(user), codigo:codeOf(user) } };
        return React.createElement('div', null,
          React.createElement('button', { type:'button', className:'btn btn-ghost', onClick:() => setLiveOpen(false), style:{ marginBottom:12 } }, '← Volver a juegos'),
          React.createElement(Live, liveProps)
        );
      }

      return React.createElement(React.Fragment, null,
        React.createElement(LiveRoomEntryPanel, { onOpen:() => setLiveOpen(true) }),
        React.createElement(Base, props)
      );
    };

    Wrapped.__cs21a144AccessGate = true;
    Wrapped.__cs21a71FreeAccessGate = true;
    Wrapped.__cs21a66FreeAccessGate = true;
    Wrapped.__base = Base;
    window.AcademiaPlayView = Wrapped;
    try { AcademiaPlayView = Wrapped; } catch (_) {}
    return true;
  }

  function installLiveGate() {
    const Base = window.EnglishLabLiveStudentView;
    if (typeof Base !== 'function' || Base.__cs21a144AccessGate) return false;

    const Wrapped = function EnglishLabLiveStudentViewCS21A144(props) {
      const [access, setAccess] = React.useState(accessSnapshot);
      React.useEffect(() => {
        const update = event => setAccess(event?.detail || accessSnapshot());
        window.addEventListener(EVENT_NAME, update);
        checkAccess(false);
        return () => window.removeEventListener(EVENT_NAME, update);
      }, []);

      if (isStudent(session()) && (access.allowed !== true || access.signature !== signature(session()))) {
        return React.createElement(AccessMessage, { loading:access.loading || access.refreshing || (!access.checked && !access.retryable) });
      }

      const user = session();
      return React.createElement(Base, {
        ...props,
        usuario:{ ...(props.usuario || {}), ...user, nombre:nameOf(user), codigo:codeOf(user) },
      });
    };

    Wrapped.__cs21a144AccessGate = true;
    Wrapped.__base = Base;
    window.EnglishLabLiveStudentView = Wrapped;
    try { EnglishLabLiveStudentView = Wrapped; } catch (_) {}
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
      installLiveGate();
      hideLegacyLiveDemo();
      simplifyLiveJoin();
      syncLegacyProspectPanel();
    });
  }

  const observer = new MutationObserver(scheduleSync);
  observer.observe(document.documentElement, { childList:true, subtree:true });

  window.addEventListener('an:lazy-module-loaded', scheduleSync);
  window.addEventListener('an:session-changed', () => {
    try { sessionStorage.removeItem(CACHE_KEY); } catch (_) {}
    requestGeneration += 1;
    inFlight = null;
    inFlightSignature = '';
    state = emptyState(session());
    publish();
  });
  window.addEventListener('an:payment-applied', () => checkAccess(true));
  window.addEventListener('an:free-user-solicitudes-changed', () => checkAccess(true));

  installAcademiaPlayGate();
  installLiveGate();
  scheduleSync();
  const probe = setInterval(() => {
    const installed = installAcademiaPlayGate() || installLiveGate();
    scheduleSync();
    if (installed && typeof window.AcademiaPlayView === 'function') clearInterval(probe);
  }, 250);
  setTimeout(() => clearInterval(probe), 30000);

  window.__AN_ENGLISH_LAB_FREE_ACCESS_VERSION__ = VERSION;
  window.__AN_ENGLISH_LAB_ACCESS_VERSION__ = VERSION;
  window.anEnglishLabFreeAccess = {
    check:checkAccess,
    get:accessSnapshot,
    prime:primeAccess,
    timeoutMs:ACCESS_TIMEOUT_MS,
    transientStates:TRANSIENT_STATES.slice(),
    conclusiveDenialStates:CONCLUSIVE_DENIAL_STATES.slice(),
  };
  window.anEnglishLabAccess = window.anEnglishLabFreeAccess;
})();
