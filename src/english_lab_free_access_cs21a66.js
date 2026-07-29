// F98.4-Z6-CS21A144 · English LAB exclusivo para estudiantes al día
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A144';
  const EVENT_NAME = 'an:english-lab-free-access';
  const ENDPOINT = 'englishLabAccessStatus';
  const CACHE_KEY = 'an_english_lab_access_cs21a144';
  const CACHE_TTL = 2 * 60 * 1000;
  const LIVE_FILE = 'src/english_lab_live.jsx?v=F98.4Z6CS20H';

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

  function normalizeRoomCode(value) {
    let code = clean(value).toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12);
    if (/^\d{4}$/.test(code)) code = 'LAB-' + code;
    if (/^LAB\d{4}$/.test(code)) code = 'LAB-' + code.slice(3);
    return code;
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
      signature:signature(user),
      checkedAt:staff ? Date.now() : 0,
      version:VERSION,
    };
  }

  function readCache(user) {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
      if (!parsed || parsed.signature !== signature(user)) return null;
      if (!Number(parsed.checkedAt) || Date.now() - Number(parsed.checkedAt) > CACHE_TTL) return null;
      return {
        loading:false,
        refreshing:false,
        checked:parsed.checked === true,
        allowed:parsed.allowed === true,
        estado:clean(parsed.estado),
        message:clean(parsed.message),
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

  function persist() {
    try {
      if (!state.checked) return;
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        checked:state.checked,
        allowed:state.allowed,
        estado:state.estado,
        message:state.message,
        signature:state.signature,
        checkedAt:state.checkedAt,
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
    if (!isStudent(user)) return;
    const checking = state.loading === true;
    const unresolved = !state.checked && !checking;
    const visible = unresolved || checking || state.allowed === true;
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
        button.removeAttribute('title');
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
    if (inFlight) return inFlight;

    state = {
      ...state,
      loading:!state.checked,
      refreshing:state.checked,
      allowed:false,
      estado:'VERIFICANDO',
      message:'Confirmando que la cuenta esté al día…',
      signature:nextSignature,
    };
    publish();

    inFlight = post(ENDPOINT, { force:force === true })
      .then(response => {
        state = {
          loading:false,
          refreshing:false,
          checked:true,
          allowed:response.allowed === true || response.autorizado === true,
          estado:clean(response.estado || ''),
          message:clean(response.mensaje || ''),
          signature:nextSignature,
          checkedAt:Date.now(),
          version:clean(response.version || VERSION),
          nivel:clean(response.nivel || response.nivel_activo || ''),
        };
        publish();
        return state;
      })
      .catch(error => {
        state = {
          loading:false,
          refreshing:false,
          checked:true,
          allowed:false,
          estado:'NO_CONFIRMADO',
          message:clean(error?.message || error || 'No fue posible confirmar que la cuenta esté al día.'),
          signature:nextSignature,
          checkedAt:Date.now(),
          version:VERSION,
        };
        publish();
        return state;
      })
      .finally(() => { inFlight = null; });

    return inFlight;
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
    const title = loading ? 'Verificando acceso' : 'English LAB no disponible';
    const body = loading
      ? 'Estamos confirmando que tu cuenta académica esté al día.'
      : (current.message || 'English LAB está disponible únicamente para estudiantes con matrícula activa y cuenta al día.');

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
      'data-screen-label':`English LAB · ${loading ? 'verificando' : 'restringido'}`,
      style:{ maxWidth:700, margin:'56px auto', padding:'30px 32px', border:'1px solid #E5D5A8', borderRadius:18, background:'#FFFDF6', boxShadow:'0 10px 32px rgba(0,0,0,.07)', textAlign:'center' },
    },
      React.createElement('div', { style:{ fontSize:11, fontWeight:950, letterSpacing:'.14em', textTransform:'uppercase', color:'#7A1E2C' } }, 'Acceso financiero'),
      React.createElement('h1', { style:{ margin:'9px 0 8px', fontFamily:'var(--f-serif,Georgia,serif)', fontSize:30, color:'#001E47' } }, title),
      React.createElement('p', { style:{ margin:'0 auto', maxWidth:570, fontSize:13.5, lineHeight:1.65, color:'#5F6875' } }, body),
      !loading && React.createElement('div', { style:{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', marginTop:18 } },
        React.createElement('button', { type:'button', className:'btn btn-primary', onClick:() => checkAccess(true) }, 'Verificar de nuevo'),
        React.createElement('button', { type:'button', className:'btn btn-ghost', onClick:goBack }, 'Volver a Mi Campus')
      )
    );
  }

  function LiveRoomEntryPanel({ onOpen }) {
    const [roomCode, setRoomCode] = React.useState(() => {
      try { return normalizeRoomCode(localStorage.getItem('elive_last_room') || ''); }
      catch (_) { return ''; }
    });
    const [error, setError] = React.useState('');
    const [busy, setBusy] = React.useState(false);

    const enter = async () => {
      const code = normalizeRoomCode(roomCode);
      if (!/^LAB-\d{4}$/.test(code)) {
        setError('Escribí un código válido, por ejemplo LAB-5937.');
        return;
      }
      setBusy(true);
      setError('');
      try {
        localStorage.setItem('elive_last_room', code);
        if (!window.anLazyCampus?.loadOne) throw new Error('El cargador de English LAB Live no está disponible.');
        await window.anLazyCampus.loadOne(LIVE_FILE);
        if (typeof window.EnglishLabLiveStudentView !== 'function') throw new Error('English LAB Live no publicó la pantalla del estudiante.');
        onOpen(code);
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
      React.createElement('p', { style:{ margin:'0 0 14px', color:'#5F6875', fontSize:13.5, lineHeight:1.55 } }, 'Podés entrar a cualquier sala válida, aunque reúna estudiantes de distintos grupos o del Club I CAN. Tu identidad se toma de la sesión del Campus.'),
      error ? React.createElement('div', { style:{ marginBottom:12, padding:'10px 12px', borderRadius:12, background:'#FDECEA', color:'#8B1F1F', fontSize:12.5, fontWeight:700 } }, error) : null,
      React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'minmax(180px,320px) auto', gap:10, alignItems:'center' } },
        React.createElement('input', {
          value:roomCode,
          onChange:event => setRoomCode(normalizeRoomCode(event.target.value)),
          onKeyDown:event => { if (event.key === 'Enter') enter(); },
          placeholder:'LAB-5937',
          'aria-label':'Código de sala English LAB Live',
          style:{ height:50, border:'1px solid #B7C7DA', borderRadius:14, padding:'0 14px', fontSize:22, fontWeight:950, fontFamily:'var(--f-mono,monospace)', color:'#001E47', letterSpacing:'.04em', textTransform:'uppercase' },
        }),
        React.createElement('button', { type:'button', className:'btn btn-primary', disabled:busy, onClick:enter, style:{ height:50, padding:'0 20px' } }, busy ? 'Abriendo…' : 'Entrar a sala')
      )
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

      if (isStudent(session()) && access.allowed !== true) {
        return React.createElement(AccessMessage, { loading:access.loading || !access.checked });
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

      if (isStudent(session()) && access.allowed !== true) {
        return React.createElement(AccessMessage, { loading:access.loading || !access.checked });
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
  window.anEnglishLabFreeAccess = { check:checkAccess, get:accessSnapshot, prime:primeAccess };
  window.anEnglishLabAccess = window.anEnglishLabFreeAccess;
})();
