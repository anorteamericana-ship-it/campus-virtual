/* global React, ReactDOM */
const { useState, useEffect, useRef } = React;

// ── Apps Script endpoint ─────────────────────────────────────────────────
// URL del Apps Script: fuente única en data.jsx → window.APPS_SCRIPT_URL
const SCRIPT_URL_LOGIN = window.APPS_SCRIPT_URL;

// Mapa de errores que devuelve el Apps Script → mensajes amigables
const ERR_MSG = {
  credenciales_invalidas: 'Usuario o contraseña incorrectos',
  usuario_inactivo:       'Tu cuenta está desactivada. Contactá a la academia.',
};

// ── Icons ────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const ICO = {
  id:   'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zM8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5 18c.5-2 2-3 3-3h0c1 0 2.5 1 3 3M14 8h4M14 12h4M14 16h2',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4M12 15v2',
  eye:  'M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff:'M17.94 17.94A10 10 0 0 1 12 20c-7 0-11-8-11-8a18 18 0 0 1 5.06-5.94M9.9 4.24A10 10 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.16 3.19M1 1l22 22M14.12 14.12a3 3 0 1 1-4.24-4.24',
  arrow:'M5 12h14M13 5l7 7-7 7',
  back: 'M19 12H5M12 19l-7-7 7-7',
  check:'M20 6L9 17l-5-5',
  wa:   'M17 11.5a5 5 0 0 1-6 5l-4 1 1-4a5 5 0 0 1 5-6M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
  mail: 'M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM2 8l10 7 10-7',
  clock:'M12 6v6l4 2M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z',
  warn: 'M12 9v4M12 17h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  key:  'M21 2l-9.6 9.6M15.5 7.5l3 3M3 21l3-3 3 3M9 15a4 4 0 1 0 6-6',
};

const ROLE_LABELS = {
  student: 'Estudiante',
  teacher: 'Docente',
  admin:   'Administración',
  family:  'Familiar / Encargado (vista de solo lectura)',
};
const ROLE_HINTS = {
  family: 'Tu acceso es solo de visualización del progreso del estudiante. No podrás publicar comentarios, tareas o mensajes.',
};

// ── ID type formatters ───────────────────────────────────────────────────
function formatId(type, raw) {
  const d = raw.replace(/\D/g, '');
  if (type === 'nac') {
    // 1-XXXX-XXXX
    if (d.length <= 1) return d;
    if (d.length <= 5) return `${d[0]}-${d.slice(1)}`;
    return `${d[0]}-${d.slice(1,5)}-${d.slice(5,9)}`;
  }
  if (type === 'dimex') {
    // 1XXXXXXXXXXX — 11 o 12 dígitos
    return d.slice(0, 12);
  }
  // pasaporte — alfanumérico
  return raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 14);
}

// ── LOGIN ────────────────────────────────────────────────────────────────
function LoginView({ onSwitchScreen, onLoginSuccess }) {
  const [usuario, setUsuario] = useState('');
  const [pass, setPass]       = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState('');
  const [detected, setDetected] = useState(null);
  const [pendingMulti, setPendingMulti] = useState(null); // { nombre, rol, grupos:[] }

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!usuario || !pass) { setErr('Completa ambos campos para continuar.'); return; }
    setLoading(true);
    try {
      const url = `${SCRIPT_URL_LOGIN}?fn=getUsuario&usuario=${encodeURIComponent(usuario.trim().toLowerCase())}&clave=${encodeURIComponent(pass)}`;
      const res  = await fetch(url);
      const data = await res.json();
      if (!data.ok) {
        setLoading(false);
        setErr(ERR_MSG[data.error] || 'Usuario o contraseña incorrectos');
        return;
      }
      // Multi-grupo → mostrar selector antes de continuar
      if (data.multiGrupo && Array.isArray(data.grupos) && data.grupos.length > 0) {
        setLoading(false);
        setPendingMulti({ nombre: data.nombre, rol: data.rol, grupos: data.grupos });
        return;
      }
      // Caso normal
      // BUG B fix → guardamos también la cédula tal como la escribió el usuario,
      // para que StudentDashboard pueda hacer fallback si `codigo` viene vacío.
      const acc = {
        rol:      data.rol,
        nombre:   data.nombre,
        grupo:    data.grupo  || null,
        codigo:   data.codigo || null,
        cedula:   (data.usuario || usuario || '').toString().trim().toLowerCase() || null,
        programa: data.programa || 'SIN_INA',
      };
      setDetected(acc);
      setTimeout(() => { onLoginSuccess(acc); }, 900);
    } catch (e) {
      setLoading(false);
      setErr('No se pudo conectar. Intentá de nuevo.');
    }
  };

  const elegirGrupo = (g) => {
    const acc = {
      rol:      pendingMulti.rol,
      nombre:   pendingMulti.nombre,
      grupo:    g.grupo,
      codigo:   g.codigo || null,
      cedula:   (pendingMulti.usuario || usuario || '').toString().trim().toLowerCase() || null,
      programa: g.programa || 'SIN_INA',
    };
    setPendingMulti(null);
    setDetected(acc);
    setTimeout(() => { onLoginSuccess(acc); }, 900);
  };

  return (
    <div className="form-card">
      <div className="form-head">
        <div className="form-kicker">Campus Virtual · Ingreso</div>
        <h1 className="form-title">
          Bienvenido de<br/><em>vuelta</em>
        </h1>
        <div className="form-sub">
          Ingresa con tu número de identificación y la contraseña que te asignó la academia.
        </div>
      </div>

      {err && (
        <div className="alert err">
          <Ico d={ICO.warn} size={18} />
          <div><strong>No pudimos iniciar sesión.</strong><br/>{err}</div>
        </div>
      )}

      {detected && (
        <div className="alert ok">
          <Ico d={ICO.check} size={18} />
          <div>
            <strong>¡Hola, {detected.nombre.split(' ')[0]}!</strong> Ingresando como <strong>{detected.rol === 'admin' ? 'Administrador' : detected.rol === 'teacher' ? 'Docente' : 'Estudiante'}</strong>…
          </div>
        </div>
      )}

      {pendingMulti && (
        <div style={{ position:'fixed', inset:0, background:'rgba(10,8,20,0.72)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'var(--surface)', borderRadius:'var(--r-lg)', padding:'28px 30px', width:'100%', maxWidth:460, boxShadow:'0 24px 80px rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:6 }}>Selección de grupo</div>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:24, fontWeight:500, color:'var(--an-navy-ink)', letterSpacing:'-0.02em', marginBottom:6 }}>
              Hola, <em>{pendingMulti.nombre.split(' ')[0]}</em>
            </div>
            <div style={{ fontSize:13, color:'var(--ink-2)', marginBottom:18 }}>
              Tenés {pendingMulti.grupos.length} grupos asignados. Elegí con cuál querés trabajar en esta sesión.
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {pendingMulti.grupos.map((g, i) => (
                <button key={i} onClick={() => elegirGrupo(g)}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', border:'1.5px solid var(--line)', borderRadius:'var(--r-md)', background:'var(--surface-2)', cursor:'pointer', textAlign:'left', fontFamily:'inherit' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'var(--f-mono)', fontSize:14, fontWeight:700, color:'var(--an-navy-ink)' }}>{g.grupo}</div>
                    <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>Programa {g.programa || 'SIN_INA'}</div>
                  </div>
                  <Ico d={ICO.arrow} size={16} />
                </button>
              ))}
            </div>
            <button onClick={() => setPendingMulti(null)}
              style={{ marginTop:18, width:'100%', padding:10, background:'transparent', border:'1px solid var(--line)', borderRadius:'var(--r-md)', cursor:'pointer', fontSize:12, color:'var(--ink-2)', fontFamily:'inherit' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <form onSubmit={submit} noValidate>
        <div className="field">
          <div className="field-label">
            Usuario o Cédula
            <span className="fl-hint">Docentes y admin: tu usuario asignado. Estudiantes: tu número de cédula.</span>
          </div>
          <div className="field-ctrl">
            <span className="fi-icon"><Ico d={ICO.id} /></span>
            <input
              type="text"
              autoComplete="username"
              placeholder="Ej: emily · o tu cédula si sos estudiante"
              value={usuario}
              onChange={e => { setUsuario(e.target.value); setErr(''); }}
              autoFocus
            />
          </div>
        </div>

        <div className="field">
          <div className="field-label">
            Contraseña
            <span className="fl-hint">Docentes y admin: contraseña asignada. Estudiantes: tu código de expediente (ej: 17065).</span>
          </div>
          <div className="field-ctrl">
            <span className="fi-icon"><Ico d={ICO.lock} /></span>
            <input
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={pass}
              onChange={(e) => { setPass(e.target.value); setErr(''); }}
            />
            <button type="button" className="fi-trail" onClick={() => setShowPass(s=>!s)} aria-label="Mostrar contraseña">
              <Ico d={showPass ? ICO.eyeOff : ICO.eye} size={18} />
            </button>
          </div>
        </div>

        <div className="form-row-meta">
          <label className="check">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
            <span className="cbox" />
            Mantener sesión iniciada
          </label>
        </div>

        <button type="submit" className="btn-submit" disabled={loading || detected}>
          {loading || detected
            ? <><span className="loader" /> {detected ? 'Redirigiendo…' : 'Verificando credenciales…'}</>
            : <>Ingresar al Campus <span className="arrow"><Ico d={ICO.arrow} size={18} /></span></>}
        </button>

        <div style={{ textAlign:'center', marginTop:12 }}>
          <a href="recovery.html" style={{ fontSize:12, color:'var(--ink-3)' }}>
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </form>

      <div className="form-divider">O bien</div>

      <div className="help-line">
        ¿Primera vez en el Campus? <a href="#" onClick={(e)=>{e.preventDefault(); onSwitchScreen('activate');}}>Activar cuenta con mi código</a>
        <br/>
        ¿Aún no te matriculas? <a href="#" onClick={(e)=>e.preventDefault()}>Solicitar matrícula</a>
      </div>

    </div>
  );
}

// ── FORGOT ───────────────────────────────────────────────────────────────
function ForgotView({ onSwitchScreen }) {
  const [idVal, setIdVal] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 1100);
  };

  if (sent) {
    return (
      <div className="form-card">
        <div className="form-head">
          <div className="form-kicker">Solicitud enviada</div>
          <h1 className="form-title">Revisa tu <em>correo</em></h1>
          <div className="form-sub">
            Si encontramos una cuenta asociada, enviamos un enlace de recuperación a <strong>{email || 'tu correo'}</strong>.
            El enlace expira en <strong>30 minutos</strong>.
          </div>
        </div>

        <div className="alert info">
          <Ico d={ICO.info} size={18} />
          <div>
            <strong>¿No ves el correo?</strong><br/>
            Revisa tu bandeja de spam o contacta a administración por WhatsApp — pueden emitir una nueva contraseña temporal en el momento.
          </div>
        </div>

        <a href={`https://wa.me/50688881234?text=${encodeURIComponent('Hola, necesito ayuda para recuperar mi contraseña del Campus Virtual. Mi identificación es ' + idVal)}`}
           target="_blank"
           className="btn-submit"
           style={{ background:'linear-gradient(135deg, #25D366, #1A8751)', textDecoration:'none' }}>
          <Ico d={ICO.wa} size={18} /> Contactar a administración
        </a>

        <button type="button" className="forgot" style={{ width:'100%', marginTop:18, padding:14, border:'1px solid var(--line)', borderRadius:'var(--r-md)', background:'var(--surface)' }}
          onClick={() => onSwitchScreen('login')}>
          ← Volver a ingresar
        </button>
      </div>
    );
  }

  return (
    <div className="form-card">
      <div className="form-head">
        <div className="form-kicker">Recuperar acceso</div>
        <h1 className="form-title">¿Olvidaste tu<br/><em>contraseña</em>?</h1>
        <div className="form-sub">
          No te preocupes — ingresa tu identificación y el correo que registraste al matricularte, y te enviamos las instrucciones.
        </div>
      </div>

      <form onSubmit={submit} noValidate>
        <div className="field">
          <div className="field-label">Identificación</div>
          <div className="field-ctrl">
            <span className="fi-icon"><Ico d={ICO.id} /></span>
            <input
              type="text"
              placeholder="1-2345-6789"
              value={idVal}
              onChange={(e) => setIdVal(formatId('nac', e.target.value))}
              autoFocus
            />
          </div>
        </div>

        <div className="field">
          <div className="field-label">Correo electrónico registrado</div>
          <div className="field-ctrl">
            <span className="fi-icon"><Ico d={ICO.mail} /></span>
            <input
              type="email"
              placeholder="tu.correo@ejemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="btn-submit" disabled={loading} style={{ marginTop:10 }}>
          {loading
            ? <><span className="loader" /> Enviando instrucciones…</>
            : <>Enviar enlace de recuperación <span className="arrow"><Ico d={ICO.arrow} size={18} /></span></>}
        </button>
      </form>

      <div className="form-divider">o</div>

      <div className="help-line">
        ¿Tienes tu contraseña? <a href="#" onClick={(e)=>{e.preventDefault(); onSwitchScreen('login');}}>Volver al inicio de sesión</a>
      </div>
    </div>
  );
}

// ── ACTIVATE (bonus) ─────────────────────────────────────────────────────
function ActivateView({ onSwitchScreen }) {
  return (
    <div className="form-card">
      <div className="form-head">
        <div className="form-kicker">Primera vez</div>
        <h1 className="form-title">Activar mi <em>cuenta</em></h1>
        <div className="form-sub">
          La administración te entregó un <strong>código de activación</strong> al matricularte. Úsalo aquí para crear tu contraseña.
        </div>
      </div>

      <div className="alert info">
        <Ico d={ICO.key} size={18} />
        <div>
          Si no recibiste tu código, escríbele a administración. Los códigos se emiten <strong>únicamente</strong> por personal autorizado de la academia.
        </div>
      </div>

      <form onSubmit={(e)=>{e.preventDefault(); onSwitchScreen('login');}}>
        <div className="field">
          <div className="field-label">Identificación</div>
          <div className="field-ctrl">
            <span className="fi-icon"><Ico d={ICO.id} /></span>
            <input type="text" placeholder="1-2345-6789" autoFocus />
          </div>
        </div>

        <div className="field">
          <div className="field-label">Código de activación</div>
          <div className="field-ctrl">
            <span className="fi-icon"><Ico d={ICO.key} /></span>
            <input type="text" placeholder="AN-2026-XXXX" style={{ fontFamily:'var(--f-mono)', letterSpacing:'0.1em' }} />
          </div>
        </div>

        <div className="field">
          <div className="field-label">Crear contraseña
            <span className="fl-hint">Mín. 8 caracteres</span>
          </div>
          <div className="field-ctrl">
            <span className="fi-icon"><Ico d={ICO.lock} /></span>
            <input type="password" placeholder="••••••••" />
          </div>
        </div>

        <div className="field">
          <div className="field-label">Confirmar contraseña</div>
          <div className="field-ctrl">
            <span className="fi-icon"><Ico d={ICO.lock} /></span>
            <input type="password" placeholder="••••••••" />
          </div>
        </div>

        <button type="submit" className="btn-submit" style={{ marginTop:10 }}>
          Activar y entrar al Campus <span className="arrow"><Ico d={ICO.arrow} size={18} /></span>
        </button>
      </form>

      <div className="form-divider">o</div>

      <div className="help-line">
        ¿Ya tienes cuenta activa? <a href="#" onClick={(e)=>{e.preventDefault(); onSwitchScreen('login');}}>Volver al inicio de sesión</a>
      </div>
    </div>
  );
}

// ── REDIRECT SCREEN (post-login) ─────────────────────────────────────────
function RedirectScreen({ account }) {
  return (
    <div style={{
      position:'fixed', inset:0, background:'var(--an-navy)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:100,
      animation:'fadeIn .4s',
    }}>
      <style>{`@keyframes fadeIn { from { opacity:0 } to { opacity:1 } }`}</style>
      <div style={{ textAlign:'center', color:'white' }}>
        <div style={{
          width:90, height:90, borderRadius:'50%',
          background:'white url(assets/logo_circular.jpg) center/contain no-repeat',
          margin:'0 auto 24px',
          border:'4px solid white',
          animation:'pulse 1.2s infinite',
        }} />
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,255,255,0.3); }
            50% { transform: scale(1.05); box-shadow: 0 0 0 24px rgba(255,255,255,0); }
          }
        `}</style>
        <div style={{ fontFamily:'var(--f-serif)', fontSize:28, fontWeight:500, letterSpacing:'-0.02em' }}>
          Bienvenido al Campus
        </div>
        <div style={{ opacity:0.75, fontSize:14, marginTop:6 }}>
          {ROLE_LABELS[account.rol] || ROLE_LABELS[account.role] || '—'} · {account.nombre || account.name || ''}
        </div>
      </div>
    </div>
  );
}

// ── Rotating word ────────────────────────────────────────────────────────
function RotatingWord({ words, ms = 2400 }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(n => (n+1) % words.length), ms);
    return () => clearInterval(t);
  }, [words.length, ms]);
  return (
    <span className="rot-wrap">
      <span key={i} className="rot-word">{words[i]}</span>
    </span>
  );
}

// ── APP ──────────────────────────────────────────────────────────────────
function App() {
  const [screen, setScreen] = useState('login'); // login | forgot | activate
  const [lang, setLang] = useState('es');
  const [account, setAccount] = useState(null);

  const onLoginSuccess = (acc) => {
    setAccount(acc);
    try {
      sessionStorage.setItem('an_just_logged_in', '1');
      sessionStorage.setItem('an_usuario', JSON.stringify({
        rol:             acc.rol,
        nombre:          acc.nombre,
        grupo:           acc.grupo    || acc.grupos?.[0] || null,
        grupos:          acc.grupos   || (acc.grupo ? [acc.grupo] : []),
        codigo:          acc.codigo   || null,
        cedula:          acc.cedula   || null,
        programa:        acc.programa || 'SIN_INA',
        nivel_activo:    acc.nivel_activo    || null,
        estatus_activo:  acc.estatus_activo  || null,
        niveles_estatus: acc.niveles_estatus || {},
      }));
      // Mapear rol a formato que usa campus.html
      const rolCampus = acc.rol === 'teacher' ? 'teacher'
                      : acc.rol === 'student' ? 'student'
                      : 'admin';
      localStorage.setItem('an_role', rolCampus);
    } catch(e) {}
    setTimeout(() => { window.location.href = 'campus.html'; }, 900);
  };

  return (
    <>
      {/* Top bar */}
      <div className="login-top">
        <div className="lt-left">
          <span className="lock">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4" /></svg>
            Conexión segura SSL
          </span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6v6l4 2M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z" /></svg>
            Lun–Vie 8am–9pm · Sáb 8am–2pm
          </span>
        </div>
        <div className="lt-right">
          <a className="wa-link" href="https://wa.me/50688881234" target="_blank" rel="noopener">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366" stroke="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413"/></svg>
            Soporte · WhatsApp
          </a>
          <div className="lang-switch">
            <button className={lang==='es'?'on':''} onClick={() => setLang('es')}>ES</button>
            <button className={lang==='en'?'on':''} onClick={() => setLang('en')}>EN</button>
          </div>
        </div>
      </div>

      <div className="login-shell">
        {/* LEFT — brand stage */}
        <div className="stage">
          <div className="stage-a-outline">A</div>
          <div className="stage-a">A</div>

          <div className="stage-logo">
            <div className="logo-mark" />
            <div className="wordmark">
              <div className="wm1">Academia <em>Norteamericana</em></div>
              <div className="wm2">Campus Virtual · English Program</div>
            </div>
          </div>

          <div className="stage-hero">
            <div className="stage-kicker">{lang==='es' ? 'Avalada por INA · Resolución 2519' : 'INA Accredited · Resolution 2519'}</div>
            <h1 className="stage-h1">
              <span className="nline">I <span className="ican">CAN</span></span>
              <span className="nline"><RotatingWord words={lang==='es'
                ? ['aprender.', 'crecer.', 'hablar.', 'avanzar.', 'lograrlo.']
                : ['learn.', 'grow.', 'speak.', 'advance.', 'succeed.']} /></span>
            </h1>
            <div className="stage-sub">
              {lang==='es'
                ? 'Bienvenido al Campus Virtual. Aquí gestionas tu progreso, tus clases y tu camino hacia el inglés que siempre quisiste hablar.'
                : 'Welcome to the Virtual Campus — where you track your progress, classes, and journey towards the English you always wanted to speak.'}
            </div>
            <div className="stage-chips">
              <span>4 niveles · Interchange</span>
              <span>Club I CAN gratuito</span>
              <span>CONAPE aprobado</span>
            </div>
          </div>

          <div className="stage-footer">
            <div>© 2026 Academia Norteamericana · San José, Costa Rica</div>
            <div><strong>284</strong> estudiantes activos · <strong>11</strong> docentes</div>
          </div>
        </div>

        {/* RIGHT — form */}
        <div className="form-side">
          {screen === 'login' && <LoginView onSwitchScreen={setScreen} onLoginSuccess={onLoginSuccess} />}
          {screen === 'forgot' && <ForgotView onSwitchScreen={setScreen} />}
          {screen === 'activate' && <ActivateView onSwitchScreen={setScreen} />}

          <div className="form-foot">
            <a href="#">Términos</a>·<a href="#">Privacidad</a>·<a href="#">Soporte</a>
          </div>
        </div>
      </div>

      {account && <RedirectScreen account={account} />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
