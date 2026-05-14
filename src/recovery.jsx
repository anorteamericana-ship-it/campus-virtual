/* global React, ReactDOM */
const SCRIPT_URL_REC = 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';

function RecoveryApp() {
  const [cedula, setCedula]       = React.useState('');
  const [loading, setLoading]     = React.useState(false);
  const [resultado, setResultado] = React.useState(null);
  const [error, setError]         = React.useState(null);

  const buscar = async () => {
    if (!cedula.trim()) return;
    setLoading(true); setError(null); setResultado(null);
    try {
      const r = await fetch(
        `${SCRIPT_URL_REC}?fn=recuperarContrasena&cedula=${encodeURIComponent(cedula.trim())}`
      ).then(r => r.json());
      if (r.ok) setResultado(r);
      else setError(r.mensaje || 'No se encontró una cuenta con esa cédula.');
    } catch (e) {
      setError('Error de conexión. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
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
            fontFamily:'var(--f-serif, Fraunces, serif)',
            fontSize:26, fontWeight:500,
            letterSpacing:'-0.02em',
            color:'var(--an-navy-ink, #111827)',
          }}>
            Recuperar <em>acceso</em>
          </h2>
          <p style={{ margin:'0 0 22px', fontSize:13, color:'var(--ink-3, #6B7280)', lineHeight:1.5 }}>
            Ingresá tu número de cédula y te mostramos tu contraseña.
          </p>

          {!resultado ? (
            <>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--ink-2, #374151)', display:'block' }}>
                Número de cédula
              </label>
              <input
                type="text"
                value={cedula}
                onChange={e => { setCedula(e.target.value); setError(null); }}
                onKeyDown={e => e.key === 'Enter' && buscar()}
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
              {error && (
                <div style={{
                  background:'color-mix(in srgb, var(--danger, #B91C1C) 10%, white)',
                  color:'var(--danger, #B91C1C)',
                  borderRadius:8, padding:'10px 14px',
                  fontSize:13, marginBottom:16,
                  border:'1px solid color-mix(in srgb, var(--danger, #B91C1C) 25%, white)',
                }}>
                  {error}
                </div>
              )}
              <button
                onClick={buscar}
                disabled={loading || !cedula.trim()}
                style={{
                  width:'100%', padding:'13px',
                  borderRadius:10, border:'none',
                  background:'var(--an-granate, #6F1A1A)',
                  color:'white',
                  fontSize:14, fontWeight:700, fontFamily:'inherit',
                  cursor: (loading || !cedula.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (loading || !cedula.trim()) ? 0.55 : 1,
                  transition:'opacity .15s',
                }}>
                {loading ? 'Buscando…' : 'Recuperar contraseña'}
              </button>
            </>
          ) : (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:42, marginBottom:10 }}>🔑</div>
              <div style={{ fontSize:13, color:'var(--ink-3, #6B7280)', marginBottom:6 }}>
                Cuenta encontrada para:
              </div>
              <div style={{
                fontFamily:'var(--f-serif, Fraunces, serif)',
                fontWeight:500, fontSize:18,
                color:'var(--an-navy-ink, #111827)',
                marginBottom:18,
              }}>
                {resultado.nombre}
              </div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-3, #6B7280)', marginBottom:8 }}>
                Tu contraseña
              </div>
              <div style={{
                background:'var(--surface-2, #FBF8F2)',
                borderRadius:12, padding:'16px 20px',
                fontSize:24, fontWeight:800, letterSpacing:2,
                fontFamily:'var(--f-mono, "JetBrains Mono", monospace)',
                color:'var(--an-navy-ink, #111827)',
                border:'2px solid var(--an-granate, #6F1A1A)',
                marginBottom:18,
                wordBreak:'break-all',
              }}>
                {resultado.clave}
              </div>
              <div style={{ fontSize:11, color:'var(--ink-3, #6B7280)', marginBottom:22, lineHeight:1.5 }}>
                Tu usuario es tu número de cédula:{' '}
                <strong style={{ fontFamily:'var(--f-mono, "JetBrains Mono", monospace)' }}>{cedula}</strong>
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
