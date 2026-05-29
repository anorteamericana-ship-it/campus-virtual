/* global React, ReactDOM */
const { useState, useEffect } = React;

// ── Apps Script endpoint (única fuente: data.jsx → window.APPS_SCRIPT_URL) ──
const SCRIPT_URL_LOGIN = window.APPS_SCRIPT_URL;

const ERR_MSG = {
  credenciales_invalidas: 'Cédula o contraseña incorrectos',
  usuario_inactivo:       'Tu cuenta está desactivada. Contactá a la academia.',
};

const ROLE_LABEL = {
  admin:   'Administración',
  teacher: 'Docente',
  student: 'Estudiante',
  family:  'Familiar / Encargado',
};

// ── Brand assets (locales) ─────────────────────────────────────────────────
const LOGO = 'assets/logo_horizontal.png';
const SEAL = 'assets/logo_circular.jpg';

// Logos de respaldo institucional (externos · con fallback a texto)
const BACKERS = [
  { src: 'https://www.ina.ac.cr/PublishingImages/Logos/Logo%20INA%20Blanco.png', text: 'INA' },
  { src: 'https://www.conape.go.cr/images/logo_conape.png',                       text: 'CONAPE' },
  { src: LOGO,                                                                     text: 'ANORTEAM' },
];

// ── Frases del timeline ─────────────────────────────────────────────────────
const PHRASES = [
  { main: 'Inglés que abre puertas',    sub: 'Nivel A1 a B2' },
  { main: 'Clases 100% virtuales',      sub: 'Desde cualquier lugar de Costa Rica' },
  { main: 'Certificado avalado por INA', sub: 'Resolución 2519-02' },
  { main: 'Financiá con CONAPE',        sub: 'Sin deudas al comenzar' },
  { main: 'Tu futuro empieza hoy',      sub: 'Academia Norteamericana' },
];

// ── Iconos ──────────────────────────────────────────────────────────────────
const EyeIcon = ({ off }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {off
      ? <><path d="M17.94 17.94A10 10 0 0 1 12 20c-7 0-11-8-11-8a18 18 0 0 1 5.06-5.94M9.9 4.24A10 10 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.16 3.19M1 1l22 22M14.12 14.12a3 3 0 1 1-4.24-4.24" /></>
      : <><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></>}
  </svg>
);
const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);
const WarnIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 8v5M12 16h.01" />
  </svg>
);

// ── <img> con fallback a texto si falla la carga ───────────────────────────
function ImgFallback({ src, text, imgClass, textClass }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) return <span className={textClass}>{text}</span>;
  return <img src={src} alt={text} className={imgClass} onError={() => setFailed(true)} />;
}

// ── Timeline de frases ──────────────────────────────────────────────────────
function PhraseTimeline() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(n => (n + 1) % PHRASES.length), 3900);
    return () => clearInterval(t);
  }, []);
  const p = PHRASES[i];
  return (
    <>
      <div className="phrases">
        <div className="phrase" key={i}>
          <div className="p-main">{p.main}</div>
          <div className="p-sub">{p.sub}</div>
        </div>
      </div>
      <div className="phrase-ticks">
        {PHRASES.map((_, n) => <i key={n} className={n === i ? 'on' : ''} />)}
      </div>
    </>
  );
}

// ── Stage izquierdo ─────────────────────────────────────────────────────────
function Stage() {
  return (
    <div className="stage">
      <div className="stage-logo">
        <ImgFallback src={LOGO} text="Academia Norteamericana" textClass="logo-fallback" />
      </div>

      <PhraseTimeline />

      <div className="backers">
        {BACKERS.map((b, n) => (
          <React.Fragment key={n}>
            {n > 0 && <span className="b-sep" />}
            <ImgFallback src={b.src} text={b.text} imgClass="" textClass="b-text" />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ── Modal de selección de grupo (multi-grupo) ───────────────────────────────
function GroupModal({ data, onPick, onCancel }) {
  return (
    <div className="modal-scrim" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="m-kicker">Selección de grupo</div>
        <h2>Hola, {data.nombre.split(' ')[0]}</h2>
        <div className="m-sub">
          Tenés {data.grupos.length} grupos asignados. Elegí con cuál querés trabajar en esta sesión.
        </div>
        {data.grupos.map((g, n) => (
          <button key={n} className="group-opt" onClick={() => onPick(g)}>
            <div>
              <div className="g-name">{g.grupo}</div>
              <div className="g-prog">Programa {g.programa || 'SIN_INA'}</div>
            </div>
            <span className="g-arrow"><ArrowIcon /></span>
          </button>
        ))}
        <button className="m-cancel" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

// ── Overlay de redirección post-login ───────────────────────────────────────
function RedirectOverlay({ account }) {
  return (
    <div className="redirect">
      <div>
        <div className="seal" style={{ backgroundImage: `url(${SEAL})` }} />
        <div className="r-title">¡Hola, {(account.nombre || '').split(' ')[0] || 'de nuevo'}!</div>
        <div className="r-sub">
          {ROLE_LABEL[account.rol] || 'Estudiante'} · Entrando al Campus…
        </div>
      </div>
    </div>
  );
}

// ── App ─────────────────────────────────────────────────────────────────────
function App() {
  const [usuario, setUsuario]   = useState('');
  const [pass, setPass]         = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState('');
  const [pendingMulti, setPendingMulti] = useState(null);
  const [account, setAccount]   = useState(null);

  const finishLogin = (acc) => {
    setAccount(acc);
    try {
      sessionStorage.setItem('an_just_logged_in', '1');
      sessionStorage.setItem('an_usuario', JSON.stringify({
        rol:             acc.rol,
        nombre:          acc.nombre,
        grupo:           acc.grupo  || acc.grupos?.[0] || null,
        grupos:          acc.grupos || (acc.grupo ? [acc.grupo] : []),
        codigo:          acc.codigo || null,
        cedula:          acc.cedula || null,
        programa:        acc.programa || 'SIN_INA',
        nivel_activo:    acc.nivel_activo   || null,
        estatus_activo:  acc.estatus_activo || null,
        niveles_estatus: acc.niveles_estatus || {},
      }));
      const rolCampus = acc.rol === 'teacher' ? 'teacher'
                      : acc.rol === 'student' ? 'student'
                      : 'admin';
      localStorage.setItem('an_role', rolCampus);
    } catch (e) {}
    setTimeout(() => { window.location.href = 'campus.html'; }, 1100);
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!usuario || !pass) { setErr('Completá ambos campos para continuar.'); return; }
    setLoading(true);
    try {
      const url = `${SCRIPT_URL_LOGIN}?fn=getUsuario`
                + `&usuario=${encodeURIComponent(usuario.trim().toLowerCase())}`
                + `&clave=${encodeURIComponent(pass)}`;
      const res  = await fetch(url);
      const data = await res.json();

      if (!data.ok) {
        setLoading(false);
        setErr(ERR_MSG[data.error] || 'Cédula o contraseña incorrectos');
        return;
      }

      // Multi-grupo → mostrar selector
      if (data.multiGrupo && Array.isArray(data.grupos) && data.grupos.length > 0) {
        setLoading(false);
        setPendingMulti({ nombre: data.nombre, rol: data.rol, usuario: data.usuario, grupos: data.grupos });
        return;
      }

      finishLogin({
        rol:      data.rol,
        nombre:   data.nombre,
        grupo:    data.grupo  || null,
        codigo:   data.codigo || null,
        cedula:   (data.usuario || usuario || '').toString().trim().toLowerCase() || null,
        programa: data.programa || 'SIN_INA',
      });
    } catch (e) {
      setLoading(false);
      setErr('No se pudo conectar. Intentá de nuevo.');
    }
  };

  const pickGroup = (g) => {
    const m = pendingMulti;
    setPendingMulti(null);
    finishLogin({
      rol:      m.rol,
      nombre:   m.nombre,
      grupo:    g.grupo,
      codigo:   g.codigo || null,
      cedula:   (m.usuario || usuario || '').toString().trim().toLowerCase() || null,
      programa: g.programa || 'SIN_INA',
    });
  };

  const busy = loading || !!account;

  return (
    <>
      <div className="auth">
        <Stage />

        <div className="panel">
          <div className="panel-inner">
            {/* logo móvil (visible cuando el stage se oculta) */}
            <div className="mobile-logo">
              <ImgFallback src={LOGO} text="Academia Norteamericana" textClass="pl-fallback" />
            </div>

            {/* logo del panel (desktop) */}
            <div className="panel-logo">
              <ImgFallback src={LOGO} text="Academia Norteamericana" textClass="pl-fallback" />
            </div>
            <div className="panel-rule" />

            <h1>Bienvenido</h1>
            <div className="sub">Ingresá con tu número de cédula</div>

            <form onSubmit={submit} noValidate>
              <div className="field">
                <label htmlFor="usuario">Cédula / Usuario</label>
                <div className="ctrl">
                  <input
                    id="usuario"
                    type="text"
                    autoComplete="off"
                    placeholder="Ej: 1-2345-6789"
                    value={usuario}
                    onChange={e => { setUsuario(e.target.value); setErr(''); }}
                    autoFocus
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="clave">Contraseña</label>
                <div className={'ctrl' + (err ? ' has-error' : '')}>
                  <input
                    id="clave"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Tu contraseña"
                    className="with-trail"
                    value={pass}
                    onChange={e => { setPass(e.target.value); setErr(''); }}
                  />
                  <button type="button" className="toggle-eye"
                    onClick={() => setShowPass(s => !s)}
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                    <EyeIcon off={showPass} />
                  </button>
                </div>
                {err && (
                  <div className="field-error"><WarnIcon /> {err}</div>
                )}
              </div>

              <label className="remember">
                <input type="checkbox" checked={remember}
                  onChange={e => setRemember(e.target.checked)} />
                <span className="box" />
                Recordar sesión
              </label>

              <div className="btns">
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy
                    ? <><span className="spinner" /> {account ? 'Redirigiendo…' : 'Verificando…'}</>
                    : <>Ingresar al Campus <ArrowIcon /></>}
                </button>
                <button type="button" className="btn btn-secondary"
                  onClick={() => { window.location.href = 'inscripcion.html'; }}>
                  ¡Matriculate Aquí!
                </button>
              </div>
            </form>

            <div className="forgot">
              <a href="recovery.html">¿Olvidaste tu contraseña?</a>
            </div>
          </div>
        </div>
      </div>

      {pendingMulti && (
        <GroupModal data={pendingMulti} onPick={pickGroup} onCancel={() => setPendingMulti(null)} />
      )}
      {account && <RedirectOverlay account={account} />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
