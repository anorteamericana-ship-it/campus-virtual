/* global React, ReactDOM */
// SEC-002: Esta pantalla ya NO recupera ni muestra contraseñas.
// No realiza ninguna llamada al backend, no revela si una cédula existe,
// y no guarda nada en localStorage/sessionStorage. Compatible con el
// backend v4.37.1 porque ya no depende del endpoint recuperarContrasena.

function RecoveryApp() {
  const [cedula, setCedula]   = React.useState('');
  const [enviado, setEnviado] = React.useState(false);

  // Tras enviar el formulario mostramos SIEMPRE el mismo mensaje de
  // seguridad, sin importar la cédula. No hay fetch, no hay estado de
  // error, no se persiste nada.
  const enviar = () => {
    if (!cedula.trim()) return;
    setEnviado(true);
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
                  justifyContent:'center',
                  background:'var(--bg, #FBF8F2)', fontFamily:'var(--f-sans, "Plus Jakarta Sans", system-ui, sans-serif)' }}>
      <div style={{ width:'100%', maxWidth:420, padding:32 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <img src="assets/logo.png" alt="Academia Norteamericana"
               style={{ height:54 }}
               onError={(e)=>{ e.currentTarget.style.display='none'; }} />
        </div>

        <div style={{
          background:'var(--surface, #FFFFFF)',
          borderRadius:16,
          padding:'28px 30px',
          boxShadow:'var(--shadow-md, 0 12px 40px rgba(15,23,42,0.08))',
          border:'1px solid var(--line, rgba(15,23,42,0.08))',
        }}>
          <div style={{
            fontSize:11, fontWeight:700, letterSpacing:'0.14em',
            textTransform:'uppercase', color:'var(--an-granate, #6F1A1A)',
            marginBottom:6,
          }}>
            Campus Virtual
          </div>
          <h2 style={{
            margin:'0 0 8px',
            fontFamily:'var(--f-serif)',
            fontSize:26, fontWeight:500,
            letterSpacing:'-0.02em',
            color:'var(--an-navy-ink, #111827)',
          }}>
            Recuperar <em>acceso</em>
          </h2>
          <p style={{ margin:'0 0 22px', fontSize:13, color:'var(--ink-3, #6B7280)', lineHeight:1.5 }}>
            Ingresá tu número de cédula para ver las instrucciones de recuperación de acceso.
          </p>

          {!enviado ? (
            <>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--ink-2, #374151)', display:'block' }}>
                Número de cédula
              </label>
              <input
                type="text"
                value={cedula}
                onChange={e => setCedula(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && enviar()}
                placeholder="Ej: 117100309"
                autoFocus
                style={{
                  width:'100%', marginTop:6, marginBottom:16,
                  padding:'11px 14px', borderRadius:10, fontSize:14,
                  border:'1.5px solid var(--line, rgba(15,23,42,0.15))',
                  background:'var(--surface-2, #FBF8F2)',
                  fontFamily:'inherit',
                  outline:'none',
                  boxSizing:'border-box',
                }}
              />
              <button
                onClick={enviar}
                disabled={!cedula.trim()}
                style={{
                  width:'100%', padding:'13px',
                  borderRadius:10, border:'none',
                  background:'var(--an-granate, #6F1A1A)',
                  color:'white',
                  fontSize:14, fontWeight:700, fontFamily:'inherit',
                  cursor: !cedula.trim() ? 'not-allowed' : 'pointer',
                  opacity: !cedula.trim() ? 0.55 : 1,
                  transition:'opacity .15s',
                }}>
                Ver instrucciones
              </button>
            </>
          ) : (
            <div style={{ textAlign:'center' }}>
              <div style={{
                background:'var(--surface-2, #FBF8F2)',
                borderRadius:12, padding:'18px 20px',
                fontSize:14, lineHeight:1.6,
                color:'var(--an-navy-ink, #111827)',
                border:'1px solid var(--line, rgba(15,23,42,0.12))',
                marginBottom:22,
              }}>
                Por seguridad, las contraseñas no se muestran. Comuníquese con
                Administración para restablecer el acceso.
              </div>
              <a href="login.html" style={{
                display:'block', padding:'13px',
                borderRadius:10,
                background:'var(--an-granate, #6F1A1A)',
                color:'white', textDecoration:'none',
                fontWeight:700, fontSize:14,
              }}>
                Ir al login →
              </a>
            </div>
          )}
        </div>

        <div style={{ textAlign:'center', marginTop:20 }}>
          <a href="login.html" style={{ fontSize:12, color:'var(--ink-3, #6B7280)', textDecoration:'none' }}>
            ← Volver al login
          </a>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<RecoveryApp />);
