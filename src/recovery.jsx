/* global React, ReactDOM */

const RECOVERY_API = window.APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';

async function recoveryPost(payload) {
  try {
    const response = await fetch(RECOVERY_API, {
      method: 'POST',
      headers: { 'Content-Type':'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    const text = String(await response.text() || '').trim();
    if (!text || text.charAt(0) === '<') return { ok:false, error:'conexion', mensaje:'No se pudo conectar con el Campus.' };
    return JSON.parse(text);
  } catch (_) {
    return { ok:false, error:'conexion', mensaje:'No se pudo conectar con el Campus. Intentá de nuevo.' };
  }
}

const card = {
  background:'var(--surface, #FFFFFF)', borderRadius:16, padding:'28px 30px',
  boxShadow:'var(--shadow-md, 0 12px 40px rgba(15,23,42,0.08))',
  border:'1px solid var(--line, rgba(15,23,42,0.08))',
};
const field = {
  width:'100%', marginTop:6, padding:'11px 14px', borderRadius:10, fontSize:14,
  border:'1.5px solid var(--line, rgba(15,23,42,0.15))',
  background:'var(--surface-2, #FBF8F2)', fontFamily:'inherit',
  outline:'none', boxSizing:'border-box',
};
const primary = {
  width:'100%', padding:'13px', borderRadius:10, border:'none',
  background:'var(--an-granate, #6F1A1A)', color:'white',
  fontSize:14, fontWeight:700, fontFamily:'inherit',
};
const secondary = {
  width:'100%', padding:'11px', borderRadius:10,
  border:'1px solid var(--line, rgba(15,23,42,0.15))',
  background:'white', color:'var(--an-navy-ink, #111827)',
  fontSize:13, fontWeight:700, fontFamily:'inherit',
};

function RecoveryApp() {
  const [step, setStep] = React.useState('request');
  const [identificador, setIdentificador] = React.useState('');
  const [codigo, setCodigo] = React.useState('');
  const [clave, setClave] = React.useState('');
  const [confirmar, setConfirmar] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [info, setInfo] = React.useState('');

  const pedirCodigo = async () => {
    const c = String(identificador || '').trim();
    if (!c) { setError('Ingresá tu cédula o usuario.'); return; }
    setBusy(true); setError(''); setInfo('');
    const data = await recoveryPost({ fn:'solicitarRecuperacionContrasena', usuario:c });
    setBusy(false);
    if (!data.ok) {
      if (data.error === 'demasiadas_solicitudes') {
        setInfo(data.mensaje || 'Ya se solicitaron varios códigos. Revisá tu correo.');
        setStep('reset');
        return;
      }
      setError(data.mensaje || 'No se pudo solicitar el código. Intentá de nuevo.');
      return;
    }
    setIdentificador(c);
    setInfo(data.mensaje || 'Si existe una cuenta activa con correo registrado, enviamos un código.');
    setStep('reset');
  };

  const cambiarClave = async () => {
    setError('');
    if (!/^\d{6}$/.test(codigo)) { setError('Ingresá el código de 6 dígitos que recibiste por correo.'); return; }
    if (clave.length < 8) { setError('La nueva contraseña debe tener al menos 8 caracteres.'); return; }
    if (clave !== confirmar) { setError('Las contraseñas no coinciden.'); return; }
    setBusy(true);
    const data = await recoveryPost({
      fn:'restablecerContrasena',
      usuario:String(identificador || '').trim(),
      codigo,
      nueva_clave:clave,
    });
    setBusy(false);
    if (!data.ok) {
      setError(data.mensaje || 'No se pudo cambiar la contraseña.');
      return;
    }
    setCodigo(''); setClave(''); setConfirmar('');
    setStep('done');
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--bg, #FBF8F2)', fontFamily:'var(--f-sans, "Plus Jakarta Sans", system-ui, sans-serif)' }}>
      <div style={{ width:'100%', maxWidth:430, padding:28 }}>
        <div style={{ textAlign:'center', marginBottom:26 }}>
          <img src="assets/logo.png" alt="Academia Norteamericana" style={{ height:54 }}
            onError={e => { e.currentTarget.style.display='none'; }} />
        </div>

        <div style={card}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase',
            color:'var(--an-granate, #6F1A1A)', marginBottom:6 }}>Campus Virtual</div>

          {step === 'request' && <>
            <h2 style={{ margin:'0 0 8px', fontFamily:'var(--f-serif)', fontSize:26, fontWeight:500 }}>
              Recuperar <em>acceso</em>
            </h2>
            <p style={{ margin:'0 0 22px', fontSize:13, color:'#6B7280', lineHeight:1.55 }}>
              Ingresá tu cédula o usuario. Si tenés una cuenta activa, enviaremos un código de recuperación al correo registrado.
            </p>
            <label style={{ fontSize:12, fontWeight:600, display:'block' }}>Cédula o usuario</label>
            <input type="text" autoComplete="username" value={identificador}
              onChange={e => { setIdentificador(e.target.value); setError(''); }} onKeyDown={e => e.key === 'Enter' && pedirCodigo()}
              placeholder="Ej: 117100309 o FABIOLA" autoFocus style={{...field, marginBottom:16}} />
            <button type="button" disabled={busy} onClick={pedirCodigo}
              style={{...primary, cursor:busy?'wait':'pointer', opacity:busy?0.65:1}}>
              {busy ? 'Enviando…' : 'Enviar código'}
            </button>
          </>}

          {step === 'reset' && <>
            <h2 style={{ margin:'0 0 8px', fontFamily:'var(--f-serif)', fontSize:26, fontWeight:500 }}>
              Revisá tu <em>correo</em>
            </h2>
            <p style={{ margin:'0 0 18px', fontSize:13, color:'#6B7280', lineHeight:1.55 }}>
              El código tiene 6 dígitos, vence en 10 minutos y solo puede utilizarse una vez.
            </p>
            {info && <div style={{ fontSize:12, lineHeight:1.5, padding:'11px 12px', borderRadius:9,
              background:'#F6F4EF', marginBottom:16 }}>{info}</div>}

            <label style={{ fontSize:12, fontWeight:600, display:'block' }}>Código de recuperación</label>
            <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
              value={codigo} onChange={e => { setCodigo(e.target.value.replace(/\D/g,'').slice(0,6)); setError(''); }}
              placeholder="000000" autoFocus style={{...field, marginBottom:14, letterSpacing:'0.22em', fontWeight:700}} />

            <label style={{ fontSize:12, fontWeight:600, display:'block' }}>Nueva contraseña</label>
            <input type="password" autoComplete="new-password" value={clave}
              onChange={e => { setClave(e.target.value); setError(''); }}
              placeholder="Mínimo 8 caracteres" style={{...field, marginBottom:14}} />

            <label style={{ fontSize:12, fontWeight:600, display:'block' }}>Confirmar contraseña</label>
            <input type="password" autoComplete="new-password" value={confirmar}
              onChange={e => { setConfirmar(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && cambiarClave()}
              placeholder="Repetí tu nueva contraseña" style={{...field, marginBottom:16}} />

            <button type="button" disabled={busy} onClick={cambiarClave}
              style={{...primary, cursor:busy?'wait':'pointer', opacity:busy?0.65:1, marginBottom:10}}>
              {busy ? 'Actualizando…' : 'Guardar nueva contraseña'}
            </button>
            <button type="button" disabled={busy} onClick={pedirCodigo} style={{...secondary, cursor:busy?'wait':'pointer'}}>
              Reenviar código
            </button>
          </>}

          {step === 'done' && <div style={{ textAlign:'center' }}>
            <div style={{ width:52, height:52, borderRadius:'50%', margin:'0 auto 15px',
              display:'grid', placeItems:'center', background:'#ECFDF3', color:'#16794B', fontSize:25 }}>✓</div>
            <h2 style={{ margin:'0 0 8px', fontFamily:'var(--f-serif)', fontSize:26, fontWeight:500 }}>
              Contraseña actualizada
            </h2>
            <p style={{ margin:'0 0 20px', fontSize:13, color:'#6B7280', lineHeight:1.55 }}>
              Ya podés ingresar con tu nueva contraseña. Por seguridad, cualquier sesión anterior de tu cuenta fue cerrada.
            </p>
            <a href="login.html" style={{...primary, display:'block', boxSizing:'border-box', textDecoration:'none'}}>
              Ir al login
            </a>
          </div>}

          {error && <div role="alert" style={{ marginTop:14, padding:'10px 12px', borderRadius:9,
            background:'#FFF1F2', color:'#9F1239', fontSize:12, lineHeight:1.45 }}>{error}</div>}
        </div>

        {step !== 'done' && <div style={{ textAlign:'center', marginTop:20 }}>
          <a href="login.html" style={{ fontSize:12, color:'#6B7280', textDecoration:'none' }}>← Volver al login</a>
        </div>}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<RecoveryApp />);
