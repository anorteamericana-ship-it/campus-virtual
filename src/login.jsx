/* global React, ReactDOM, setSesion */
const { useState, useEffect, useRef } = React;

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

const LOGO = 'assets/logo_oficial_transparent.png';
const HERO_OVERRIDE_PREFIX = 'an_login_hero_v2_override_';
const HERO_SCENES = [
  {
    image: 'assets/login_hero_4.jpg',
    short: 'Virtual',
    kicker: 'Programa 100% virtual',
    detail: 'Estudiá desde donde estés, con acompañamiento real.',
  },
  {
    image: 'assets/login_hero_2.jpg',
    short: 'CONAPE',
    kicker: 'Financiá tu curso con CONAPE',
    detail: 'Una opción para iniciar tu programa con apoyo para estudios.',
  },
  {
    image: 'assets/login_hero_1.jpg',
    short: 'INA',
    kicker: 'Acreditado por el INA',
    detail: 'Resolución: 2519-02',
  },
  {
    image: 'assets/login_hero_3.jpg',
    short: 'TOEIC',
    kicker: 'Prueba internacional TOEIC',
    detail: 'Medí tu dominio del inglés con una certificación reconocida.',
  },
];

const DEV_IMAGE_PICKER = (() => {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('dev') === '1') {
      localStorage.setItem('an_login_dev_mode', '1');
      return true;
    }
    if (params.get('dev') === '0') {
      localStorage.removeItem('an_login_dev_mode');
      return false;
    }
    return localStorage.getItem('an_login_dev_mode') === '1';
  } catch (_) {
    return false;
  }
})();

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

const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3h5Z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);

function compressImageFile(file, maxSide = 1800, quality = 0.84) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Seleccioná un archivo de imagen válido.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('No se pudo procesar la imagen.'));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function HeroCarousel() {
  const [scene, setScene] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [targetScene, setTargetScene] = useState(0);
  const [images, setImages] = useState(() => HERO_SCENES.map((item, index) => {
    try { return localStorage.getItem(HERO_OVERRIDE_PREFIX + index) || item.image; }
    catch (_) { return item.image; }
  }));
  const [devMessage, setDevMessage] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return undefined;
    const timer = setInterval(() => {
      if (!paused && !pickerOpen) setScene(current => (current + 1) % HERO_SCENES.length);
    }, 5200);
    return () => clearInterval(timer);
  }, [paused, pickerOpen]);

  const openImagePicker = (index) => {
    setTargetScene(index);
    setScene(index);
    setPaused(true);
    window.setTimeout(() => {
      if (inputRef.current) inputRef.current.click();
    }, 0);
  };

  const changeTargetBackground = async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      setDevMessage(`Procesando imagen para ${HERO_SCENES[targetScene].short}…`);
      const dataUrl = await compressImageFile(file);
      setImages(current => current.map((src, index) => index === targetScene ? dataUrl : src));
      try {
        localStorage.setItem(HERO_OVERRIDE_PREFIX + targetScene, dataUrl);
        setDevMessage(`${HERO_SCENES[targetScene].short}: imagen guardada en este navegador.`);
      } catch (_) {
        setDevMessage(`${HERO_SCENES[targetScene].short}: imagen cambiada para esta sesión.`);
      }
    } catch (error) {
      setDevMessage(error.message || 'No se pudo cambiar la imagen.');
    }
    setTimeout(() => setDevMessage(''), 3600);
  };

  const resetBackground = (index) => {
    try { localStorage.removeItem(HERO_OVERRIDE_PREFIX + index); } catch (_) {}
    setImages(current => current.map((src, currentIndex) => currentIndex === index ? HERO_SCENES[index].image : src));
    setScene(index);
    setDevMessage(`${HERO_SCENES[index].short}: imagen original restaurada.`);
    setTimeout(() => setDevMessage(''), 2600);
  };

  return (
    <section className="hero-carousel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => !pickerOpen && setPaused(false)}>
      <div className="hero-scenes" aria-live="polite">
        {HERO_SCENES.map((item, index) => (
          <div className={'hero-scene' + (scene === index ? ' is-active' : '')} key={item.kicker}>
            <img src={images[index]} alt={`Imagen promocional: ${item.kicker}`} className={'hero-photo hero-photo-' + (index + 1)} />
          </div>
        ))}
      </div>

      <div className="hero-overlay hero-overlay-main" />
      <div className="hero-overlay hero-overlay-bottom" />
      <div className="hero-lines" aria-hidden="true" />
      <div className="hero-red-glow" aria-hidden="true" />

      <div className="hero-logo-halo" aria-hidden="true" />
      <img className="hero-logo" src={LOGO} alt="Academia Norteamericana" />

      {DEV_IMAGE_PICKER && (
        <>
          <input ref={inputRef} type="file" accept="image/*" onChange={changeTargetBackground} hidden />
          <button type="button" className={'dev-picker-toggle' + (pickerOpen ? ' is-open' : '')}
                  onClick={() => {
                    setPickerOpen(open => !open);
                    setPaused(true);
                  }}
                  title="Abrir selector de imágenes por frase"
                  aria-label="Abrir selector de imágenes por frase">
            <CameraIcon />
            <span>Imágenes</span>
            <strong>4</strong>
          </button>

          {pickerOpen && (
            <div className="dev-scene-panel">
              <div className="dev-panel-head">
                <div>
                  <div className="dev-panel-kicker">Modo desarrollo</div>
                  <div className="dev-panel-title">Imagen de cada frase</div>
                </div>
                <button type="button" className="dev-panel-close" onClick={() => {
                  setPickerOpen(false);
                  setPaused(false);
                }} aria-label="Cerrar selector">×</button>
              </div>

              <div className="dev-scene-list">
                {HERO_SCENES.map((item, index) => (
                  <div className={'dev-scene-row' + (scene === index ? ' is-active' : '')} key={item.kicker}>
                    <button type="button" className="dev-scene-preview" onClick={() => setScene(index)}
                            title={`Ver escena ${index + 1}`}>
                      <img src={images[index]} alt="" />
                      <span>{index + 1}</span>
                    </button>
                    <button type="button" className="dev-scene-copy" onClick={() => setScene(index)}>
                      <strong>{item.short}</strong>
                      <small>{item.kicker}</small>
                    </button>
                    <button type="button" className="dev-row-camera" onClick={() => openImagePicker(index)}
                            title={`Cambiar imagen de ${item.kicker}`} aria-label={`Cambiar imagen de ${item.kicker}`}>
                      <CameraIcon />
                    </button>
                    <button type="button" className="dev-row-reset" onClick={() => resetBackground(index)}
                            title={`Restaurar imagen de ${item.kicker}`} aria-label={`Restaurar imagen de ${item.kicker}`}>↺</button>
                  </div>
                ))}
              </div>

              <div className="dev-panel-help">La cámara de cada fila cambia únicamente la imagen de esa frase.</div>
              {devMessage && <div className="dev-image-message">{devMessage}</div>}
            </div>
          )}
        </>
      )}

      <div className="hero-copy">
        <div className="hero-badge"><span /> Inglés conversacional en línea</div>
        <h1>Eliminá tu bloqueo<br />con el <em>inglés.</em></h1>
        <div className="hero-message-wrap">
          {HERO_SCENES.map((item, index) => (
            <div className={'hero-message' + (scene === index ? ' is-active' : '')} key={item.detail}>
              <div className="hero-message-title">{item.kicker}</div>
              <div className="hero-message-detail">{item.detail}</div>
            </div>
          ))}
        </div>
        <div className="hero-progress" aria-label="Cambiar escena promocional">
          {HERO_SCENES.map((item, index) => (
            <button key={item.kicker} type="button" className={scene === index ? 'is-active' : ''}
                    onClick={() => setScene(index)} aria-label={`Mostrar ${item.kicker}`} title={item.kicker} />
          ))}
        </div>
      </div>
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
