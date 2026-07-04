/* global React, ReactDOM, setSesion */
const { useState, useEffect } = React;

const SCRIPT_URL_LOGIN = window.APPS_SCRIPT_URL;

const ERR_MSG = {
  credenciales_invalidas: 'Cédula o contraseña incorrectos',
  usuario_inactivo: 'Tu cuenta está desactivada. Contactá a la academia.',
};

const ROLE_LABEL = {
  superadmin: 'Superadmin',
  admin: 'Administrador',
  teacher: 'Docente',
  student: 'Estudiante',
  family: 'Familiar / Encargado',
  ventas: 'Asesor/a',
};

const HERO_SCENES = [
  { image: 'assets/login_hero_1.jpg', alt: 'Estudiantes aprendiendo inglés en línea' },
  { image: 'assets/login_hero_2.jpg', alt: 'Estudiante en una clase virtual de inglés' },
  { image: 'assets/login_hero_3.jpg', alt: 'Estudiante participando en una sesión virtual' },
  { image: 'assets/login_hero_4.jpg', alt: 'Grupo de estudiantes trabajando con una computadora' },
];

const HERO_INTERVAL_MS = 3900;

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

function HeroCarousel() {
  const [scene, setScene] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    const timer = window.setInterval(() => {
      setScene(current => (current + 1) % HERO_SCENES.length);
      setCycle(current => current + 1);
    }, HERO_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  const selectScene = (index) => {
    setScene(index);
    setCycle(current => current + 1);
  };

  return (
    <section className="hero-carousel" aria-label="Presentación de Academia Norteamericana">
      <div className="hero-scenes" aria-live="off">
        {HERO_SCENES.map((item, index) => (
          <figure
            className={'hero-scene' + (scene === index ? ' is-active' : '')}
            key={item.image}
            aria-hidden={scene !== index}
          >
            <img
              src={item.image}
              alt={scene === index ? item.alt : ''}
              className="hero-photo"
              draggable="false"
              loading="eager"
              decoding="async"
              fetchPriority={index === 0 ? 'high' : 'auto'}
            />
          </figure>
        ))}
      </div>


      <nav className="hero-progress" aria-label="Cambiar imagen promocional">
        {HERO_SCENES.map((item, index) => (
          <button
            key={item.image}
            type="button"
            className={scene === index ? 'is-active' : ''}
            onClick={() => selectScene(index)}
            aria-label={`Mostrar imagen ${index + 1} de ${HERO_SCENES.length}`}
            aria-current={scene === index ? 'true' : undefined}
          >
            <span
              key={scene === index ? `${index}-${cycle}` : `idle-${index}`}
              className="hero-progress-fill"
            />
          </button>
        ))}
      </nav>
    </section>
  );
}
function GroupModal({ data, onPick, onCancel }) {
  return (
    <div className="modal-scrim" onClick={onCancel}>
      <div className="modal" onClick={event => event.stopPropagation()}>
        <div className="m-kicker">Selección de grupo</div>
        <h2>Hola, {data.nombre.split(' ')[0]}</h2>
        <div className="m-sub">Tenés {data.grupos.length} grupos asignados. Elegí con cuál querés trabajar en esta sesión.</div>
        {data.grupos.map((group, index) => (
          <button key={index} className="group-opt" onClick={() => onPick(group)}>
            <div>
              <div className="g-name">{group.grupo}</div>
              <div className="g-prog">Programa {group.programa || 'SIN_INA'}</div>
            </div>
            <span className="g-arrow"><ArrowIcon /></span>
          </button>
        ))}
        <button className="m-cancel" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function RedirectOverlay({ account }) {
  return (
    <div className="redirect">
      <div>
        <div className="redirect-loader"><span /><span /><span /></div>
        <div className="r-title">¡Hola, {(account.nombre || '').split(' ')[0] || 'de nuevo'}!</div>
        <div className="r-sub">{ROLE_LABEL[account.rol] || 'Usuario'} · Entrando al Campus…</div>
      </div>
    </div>
  );
}

function App() {
  const [usuario, setUsuario] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [pendingMulti, setPendingMulti] = useState(null);
  const [account, setAccount] = useState(null);
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (!err) return undefined;
    setShaking(true);
    const timer = setTimeout(() => setShaking(false), 460);
    return () => clearTimeout(timer);
  }, [err]);

  const finishLogin = (acc) => {
    setAccount(acc);
    try {
      sessionStorage.setItem('an_just_logged_in', '1');
      const gruposAsignados = acc.grupos || (acc.grupo ? [acc.grupo] : []);
      const grupoActivo = acc.grupoActivo || acc.grupo || gruposAsignados[0] || null;
      setSesion({
        rol: acc.rol,
        nombre: acc.nombre,
        grupo: grupoActivo,
        grupos: gruposAsignados,
        grupoActivo,
        codigo: acc.codigo || null,
        cedula: acc.cedula || null,
        programa: acc.programa || 'SIN_INA',
        token: acc.token || null,
        expira: acc.expira || null,
        nivel_activo: acc.nivel_activo || null,
        estatus_activo: acc.estatus_activo || null,
        niveles_estatus: acc.niveles_estatus || {},
      });
      const rolCampus = acc.rol === 'teacher' ? 'teacher'
        : acc.rol === 'student' ? 'student'
        : acc.rol === 'ventas' ? 'ventas'
        : 'admin';
      localStorage.setItem('an_role', rolCampus);
    } catch (_) {}
    const destino = acc.rol === 'ventas' ? 'ventas.html' : 'campus.html';
    setTimeout(() => { window.location.href = destino; }, 1100);
  };

  const submit = async (event) => {
    event.preventDefault();
    setErr('');
    if (!usuario || !pass) {
      setErr('Completá ambos campos para continuar.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(SCRIPT_URL_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          fn: 'iniciarSesion',
          usuario: usuario.trim().toLowerCase(),
          clave: pass,
        }),
      });
      const data = await response.json();
      if (!data.ok) {
        setLoading(false);
        setErr(ERR_MSG[data.error] || 'Cédula o contraseña incorrectos');
        return;
      }
      if (data.multiGrupo && Array.isArray(data.grupos) && data.grupos.length > 0) {
        const first = data.grupos[0] || {};
        const gruposAsignados = data.grupos
          .map(item => typeof item === 'string' ? item : (item.grupo || item.cod_grupo || item.codigo || item.code || ''))
          .filter(Boolean);
        finishLogin({
          rol: data.rol,
          nombre: data.nombre,
          grupos: gruposAsignados,
          grupoActivo: typeof first === 'string' ? first : (first.grupo || first.cod_grupo || first.codigo || first.code || gruposAsignados[0] || null),
          grupo: typeof first === 'string' ? first : (first.grupo || first.cod_grupo || first.codigo || first.code || gruposAsignados[0] || null),
          codigo: data.codigo || first.codigo || null,
          cedula: (data.cedula || usuario || '').toString().trim().toLowerCase() || null,
          programa: first.programa || data.programa || 'SIN_INA',
          token: data.token || null,
          expira: data.expira || null,
        });
        return;
      }
      finishLogin({
        rol: data.rol,
        nombre: data.nombre,
        grupo: data.grupo || null,
        codigo: data.codigo || null,
        cedula: (data.cedula || usuario || '').toString().trim().toLowerCase() || null,
        programa: data.programa || 'SIN_INA',
        token: data.token || null,
        expira: data.expira || null,
      });
    } catch (_) {
      setLoading(false);
      setErr('No se pudo conectar. Intentá de nuevo.');
    }
  };

  const pickGroup = (group) => {
    const pending = pendingMulti;
    setPendingMulti(null);
    const gruposAsignados = (Array.isArray(pending.grupos) ? pending.grupos : [])
      .map(item => typeof item === 'string' ? item : item.grupo)
      .filter(Boolean);
    finishLogin({
      rol: pending.rol,
      nombre: pending.nombre,
      grupos: gruposAsignados.length ? gruposAsignados : [group.grupo],
      grupoActivo: group.grupo,
      codigo: group.codigo || null,
      cedula: pending.cedula || (usuario || '').toString().trim().toLowerCase() || null,
      programa: group.programa || 'SIN_INA',
      token: pending.token || null,
      expira: pending.expira || null,
    });
  };

  const busy = loading || !!account;

  return (
    <>
      <main className="auth-shell">
        <HeroCarousel />
        <section className="login-panel">
          <div className={'login-card' + (shaking ? ' shake' : '')}>
            <h2>Bienvenido de nuevo</h2>
            <p className="login-subtitle">Ingresá con tu número de cédula</p>

            <form onSubmit={submit} noValidate>
              <div className="field">
                <label htmlFor="usuario">Cédula / Usuario</label>
                <div className="ctrl">
                  <input id="usuario" type="text" autoComplete="off" placeholder="Ej: 1-2345-6789"
                         value={usuario} onChange={event => { setUsuario(event.target.value); setErr(''); }} autoFocus />
                </div>
              </div>

              <div className="field">
                <label htmlFor="clave">Contraseña</label>
                <div className={'ctrl' + (err ? ' has-error' : '')}>
                  <input id="clave" type={showPass ? 'text' : 'password'} autoComplete="current-password"
                         placeholder="Tu contraseña" className="with-trail" value={pass}
                         onChange={event => { setPass(event.target.value); setErr(''); }} />
                  <button type="button" className="toggle-eye" onClick={() => setShowPass(value => !value)}
                          aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                    <EyeIcon off={showPass} />
                  </button>
                </div>
                {err && <div className="field-error"><WarnIcon /> {err}</div>}
              </div>

              <label className="remember">
                <input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} />
                <span className="box" />
                Recordar sesión
              </label>

              <div className="btns">
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy
                    ? <><span className="spinner" /> {account ? 'Redirigiendo…' : 'Verificando…'}</>
                    : <>Ingresar al Campus <ArrowIcon /></>}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { window.location.href = 'inscripcion.html'; }}>
                  ¡Matricúlate aquí!
                </button>
              </div>
            </form>

            <div className="forgot"><a href="recovery.html">¿Olvidaste tu contraseña?</a></div>
          </div>
        </section>
      </main>

      {pendingMulti && <GroupModal data={pendingMulti} onPick={pickGroup} onCancel={() => setPendingMulti(null)} />}
      {account && <RedirectOverlay account={account} />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
