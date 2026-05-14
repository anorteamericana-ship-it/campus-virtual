/* global React, Icon, Chip, PageHeader */

// ─────────────────────────────────────────────────────────────────────────
// BuscadorEstudiantes — Vista Admin
// Lista: ESTUDIANTES_COMPLETOS (bundle) | Detalle: Apps Script en tiempo real
// ─────────────────────────────────────────────────────────────────────────

const SCRIPT_URL_B = 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';

const NIVEL_COLOR_B = { B1:'#E5A823', B2:'#E8372A', I1:'#2B7FC1', I2:'#4CAF50' };
const NIVEL_LABEL_B = { B1:'Básico I', B2:'Básico II', I1:'Intermedio I', I2:'Intermedio II' };
const NIVEL_ORDER   = ['B1','B2','I1','I2'];

const STATUS_META = {
  CA:  { label:'Cursando',          color:'#2B7FC1', bg:'color-mix(in srgb, #2B7FC1 12%, white)' },
  APR: { label:'Aprobado',          color:'#2E7D32', bg:'color-mix(in srgb, #2E7D32 12%, white)' },
  RI:  { label:'Ret. Injustificado', color:'#C00000', bg:'color-mix(in srgb, #C00000 10%, white)' },
  RJ:  { label:'Ret. Justificado',   color:'#C67100', bg:'color-mix(in srgb, #C67100 12%, white)' },
  PE:  { label:'Pendiente',          color:'#8B8178', bg:'color-mix(in srgb, #8B8178 10%, white)' },
  REP: { label:'Reprobado',          color:'#8B1E3F', bg:'color-mix(in srgb, #8B1E3F 10%, white)' },
};

function StatusChip({ code, small }) {
  const m = STATUS_META[code] || { label: code || '—', color:'#8B8178', bg:'var(--surface-2)' };
  return (
    <span style={{
      display:'inline-flex', alignItems:'center',
      padding: small ? '2px 7px' : '4px 10px',
      borderRadius:999,
      background: m.bg,
      color: m.color,
      fontSize: small ? 10 : 11,
      fontWeight: 700,
      letterSpacing:'0.04em',
      whiteSpace:'nowrap',
    }}>{m.label}</span>
  );
}

function NivelBadge({ nivel }) {
  const c = NIVEL_COLOR_B[nivel] || '#8B8178';
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'3px 9px', borderRadius:999,
      background: `color-mix(in srgb, ${c} 14%, white)`,
      color: c, fontSize:11, fontWeight:700,
    }}>
      {NIVEL_LABEL_B[nivel] || nivel}
    </span>
  );
}

function fmtFechaBus(str) {
  if (!str) return '—';
  const d = new Date(str + 'T00:00:00');
  if (isNaN(d)) return str;
  return d.toLocaleDateString('es-CR', { day:'numeric', month:'short', year:'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────
// FICHA DE ESTUDIANTE
// ─────────────────────────────────────────────────────────────────────────
function FichaEstudiante({ est, onBack, detalle, cargandoDet, errDetalle }) {
  const conapeData = (CONAPE || {})[String(est.cedula)] || null;
  const hasConape = !!conapeData || est.convenio === 'CONAPE';
  const [tabActiva, setTabActiva] = React.useState('niveles');

  // Construir nivelMap: preferir datos reales del servidor
  const nivelMap = {};
  if (detalle?.niveles) {
    Object.entries(detalle.niveles).forEach(([niv, info]) => {
      nivelMap[niv] = {
        nivel:  niv,
        status: info.estatus || info.status || 'PE',
        nota:   info.nota    || 0,
        grupo:  detalle.grupo?.COD_GRUPO || est.grupo_actual || '',
        fecha:  null,
        cert:   null,
      };
    });
  } else {
    (est.historial || []).forEach(h => { nivelMap[h.nivel] = h; });
  }

  // Pagos reales o del bundle
  const pagosEst = detalle
    ? [...(detalle.pagos || []), ...(detalle.otrosPagos || [])]
    : (PAGOS || {})[String(est.rec_m)] || [];

  // Cuota pactada individual
  const cuotaPactada = detalle?.pendientes?.cuota_mensual || null;
  // Grupo real
  const grupoReal    = detalle?.grupo || null;

  return (
    <div>
      {/* Botón volver */}
      <button onClick={onBack} className="btn btn-ghost" style={{ marginBottom:16, fontSize:13 }}>
        ← Volver a búsqueda
      </button>

      {/* Spinner / error de carga */}
      {cargandoDet && (
        <div style={{ padding:'14px 18px', background:'color-mix(in srgb,var(--an-navy) 6%,white)', border:'1px solid color-mix(in srgb,var(--an-navy) 20%,white)', borderRadius:'var(--r-md)', fontSize:13, color:'var(--an-navy)', marginBottom:16 }}>
          ⏳ Cargando datos en tiempo real…
        </div>
      )}
      {errDetalle && (
        <div style={{ padding:'12px 16px', background:'color-mix(in srgb,#C00000 8%,white)', border:'1px solid #C00000', borderRadius:'var(--r-md)', fontSize:13, color:'#C00000', marginBottom:16 }}>
          ⚠ {errDetalle} — mostrando datos del bundle local
        </div>
      )}

      {/* Header de la ficha */}
      <div style={{
        background:'var(--an-navy)',
        borderRadius:'var(--r-xl)',
        padding:'24px 28px',
        marginBottom:16,
        color:'white',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', right:-30, bottom:-30, width:180, height:180, borderRadius:'50%', background:'var(--an-granate)', opacity:0.15 }} />

        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:20, alignItems:'flex-start', position:'relative' }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', opacity:0.75, marginBottom:6 }}>
              Ficha de estudiante
            </div>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:28, fontWeight:500, letterSpacing:'-0.025em', lineHeight:1.1, marginBottom:8 }}>
              {est.nombre}
            </div>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:12, opacity:0.88 }}>
              <span>Cédula: <strong style={{ fontFamily:'var(--f-mono)' }}>{est.cedula}</strong></span>
              <span>Código: <strong style={{ fontFamily:'var(--f-mono)' }}>{est.rec_m}</strong></span>
              {(grupoReal?.COD_GRUPO || est.grupo_actual) && <span>Grupo: <strong>{grupoReal?.COD_GRUPO || est.grupo_actual}</strong></span>}
              {grupoReal?.DOCENTE && <span>Docente: <strong>{grupoReal.DOCENTE}</strong></span>}
              {grupoReal?.NIVEL_ACTUAL && <span>Nivel: <strong>{grupoReal.NIVEL_ACTUAL}</strong></span>}
              {cuotaPactada && <span>Cuota: <strong style={{ color:'var(--an-gold)' }}>₡{cuotaPactada.toLocaleString('es-CR')}</strong></span>}
            </div>
          </div>

          {/* Badge CONAPE */}
          <div style={{ textAlign:'center', flexShrink:0 }}>
            {hasConape ? (
              <div style={{ background:'color-mix(in srgb, #2E7D32 20%, white)', border:'2px solid #2E7D32', borderRadius:'var(--r-md)', padding:'12px 18px', color:'#1B5E20' }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:4 }}>CONAPE</div>
                <div style={{ fontSize:22, marginBottom:2 }}>✓</div>
                <div style={{ fontSize:11, fontWeight:600, fontFamily:'var(--f-mono)' }}>{conapeData.expediente || conapeData.nombre}</div>
                <div style={{ fontSize:10, color:'#2E7D32', marginTop:2 }}>{conapeData.fecha ? new Date(conapeData.fecha+'T00:00:00').toLocaleDateString('es-CR',{day:'numeric',month:'short',year:'numeric'}) : ''}</div>
              </div>
            ) : (
              <div style={{ background:'color-mix(in srgb, #C00000 12%, white)', border:'2px solid #C00000', borderRadius:'var(--r-md)', padding:'12px 18px', color:'#8B0000' }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:4 }}>CONAPE</div>
                <div style={{ fontSize:22, marginBottom:2 }}>—</div>
                <div style={{ fontSize:11, fontWeight:600 }}>Sin convenio</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom:16 }}>
        {[['niveles','Niveles y notas'],['pagos','Pagos'],['documentos','📄 Documentos']].map(([k,l]) => (
          <button key={k} className={`tab ${tabActiva===k?'active':''}`} onClick={() => setTabActiva(k)}>{l}</button>
        ))}
      </div>

      {tabActiva === 'niveles' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:14 }}>
          {NIVEL_ORDER.map(niv => {
            const h = nivelMap[niv];
            const c = NIVEL_COLOR_B[niv];
            const hasData = !!h;
            return (
              <div key={niv} style={{
                background: hasData ? `color-mix(in srgb, ${c} 5%, white)` : 'var(--surface-2)',
                border: `2px solid ${hasData ? c : 'var(--line)'}`,
                borderRadius:'var(--r-lg)',
                padding:'18px 20px',
                opacity: hasData ? 1 : 0.5,
              }}>
                {/* Header nivel */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:c, marginBottom:2 }}>
                      {NIVEL_LABEL_B[niv]}
                    </div>
                    {h && <div style={{ fontSize:11, color:'var(--ink-3)', fontFamily:'var(--f-mono)' }}>{h.grupo}</div>}
                  </div>
                  {h ? <StatusChip code={h.status} /> : <StatusChip code="PE" />}
                </div>

                {h ? (
                  <>
                    {/* Nota final */}
                    <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:12 }}>
                      <div style={{ fontFamily:'var(--f-serif)', fontSize:42, fontWeight:500, color:c, lineHeight:1, letterSpacing:'-0.04em' }}>
                        {h.nota > 0 ? h.nota : '—'}
                      </div>
                      {h.nota > 0 && <div style={{ fontSize:13, color:'var(--ink-3)', fontWeight:600 }}>/100</div>}
                    </div>

                    {/* Certificado */}
                    {h.cert && (
                      <div style={{ fontSize:11, color:'#2E7D32', fontWeight:600, padding:'5px 10px', background:'color-mix(in srgb, #2E7D32 8%, white)', borderRadius:6, marginBottom:8 }}>
                        🏅 Cert: {h.cert}
                      </div>
                    )}

                    {/* Fecha */}
                    <div style={{ fontSize:11, color:'var(--ink-3)' }}>
                      Inicio: {fmtFechaBus(h.fecha)}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize:12, color:'var(--ink-3)', fontStyle:'italic' }}>
                    No hay registro de este nivel aún.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tabActiva === 'pagos' && (
        <PagosAcordeon est={est} pagosEst={pagosEst} nivelMap={nivelMap} />
      )}

      {tabActiva === 'documentos' && (
        <PanelDocumentos est={est} detalle={detalle} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PANEL DOCUMENTOS
// ─────────────────────────────────────────────────────────────────────────
function PanelDocumentos({ est, detalle }) {
  const SCRIPT_URL_B = 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';
  const nivelActivo = detalle?.grupo?.NIVEL_ACTUAL_ID || est.nivel_actual || 'B1';
  const niveles = detalle?.niveles || {};
  const NIVEL_LABEL = { B1:'Básico I', B2:'Básico II', I1:'Intermedio I', I2:'Intermedio II' };
  const NIVEL_COLOR = { B1:'#E5A823', B2:'#E8372A', I1:'#2B7FC1', I2:'#4CAF50' };

  const nivelAntMap = { B1:null, B2:'B1', I1:'B2', I2:'I1' };
  const nivAnt = nivelAntMap[nivelActivo];
  const estatusAnt = nivAnt ? String(niveles[nivAnt]?.estatus || '').toUpperCase() : null;
  const estatusActivo = String(niveles[nivelActivo]?.estatus || '').toUpperCase();
  const certNum = String(niveles[nivelActivo]?.cert || '').trim();

  const docs = [
    {
      tipo: 'CERTIFICADO',
      titulo: 'Documento de Inscripción',
      desc: 'Constancia oficial de matrícula. Incluye nivel, horario y lineamientos.',
      icono: '📋',
      color: '#2B7FC1',
      ok: !!detalle,
      razon: !detalle ? 'Cargando datos…' : null,
    },
    {
      tipo: 'MATRICULA_2',
      titulo: 'Carta No Deuda CONAPE',
      desc: `Requerida por CONAPE para el nivel ${NIVEL_LABEL[nivelActivo] || nivelActivo}. Requiere nivel anterior aprobado.`,
      icono: '🏦',
      color: '#4CAF50',
      ok: !!nivAnt && estatusAnt === 'APR',
      razon: !detalle ? 'Cargando datos…' : !nivAnt ? 'No aplica para Básico I' : estatusAnt !== 'APR' ? `${nivAnt} debe estar APR (actual: ${estatusAnt || '—'})` : null,
    },
    {
      tipo: 'CERTIFICACION',
      titulo: 'Certificación de Nivel',
      desc: `Título oficial de ${NIVEL_LABEL[nivelActivo] || nivelActivo}. Requiere nivel APR y certificado pagado.`,
      icono: '🏅',
      color: '#E5A823',
      ok: estatusActivo === 'APR' && !!certNum,
      razon: !detalle ? 'Cargando datos…' : estatusActivo !== 'APR' ? `Nivel activo debe estar APR (actual: ${estatusActivo || '—'})` : !certNum ? 'REG_CERTIFICADOS vacío' : null,
    },
  ];

  const [gen, setGen] = React.useState({});
  const [res, setRes] = React.useState({});

  const generar = async (tipo) => {
    if (gen[tipo]) return;
    setGen(g => ({...g, [tipo]: true}));
    setRes(r => ({...r, [tipo]: null}));
    try {
      const resp = await fetch(SCRIPT_URL_B, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fn:'generarDocumento', tipo, codigo: String(est.rec_m || ''), nivel: nivelActivo }),
      });
      const data = await resp.json();
      setRes(r => ({...r, [tipo]: data.ok ? { url: data.url, nombre: data.nombre } : { error: data.error }}));
    } catch(e) {
      setRes(r => ({...r, [tipo]: { error: 'Error de conexión' }}));
    } finally {
      setGen(g => ({...g, [tipo]: false}));
    }
  };

  return (
    <div>
      {!detalle && (
        <div style={{ padding:'12px 16px', background:'color-mix(in srgb,var(--an-navy) 6%,white)', border:'1px solid color-mix(in srgb,var(--an-navy) 20%,white)', borderRadius:'var(--r-md)', fontSize:13, color:'var(--an-navy)', marginBottom:16 }}>
          ⏳ Esperando datos para calcular disponibilidad…
        </div>
      )}
      {detalle && (
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, fontSize:13, color:'var(--ink-3)' }}>
          Nivel activo:
          <span style={{ padding:'3px 12px', borderRadius:999, fontWeight:700, fontSize:12, background:`color-mix(in srgb, ${NIVEL_COLOR[nivelActivo]} 14%, white)`, color: NIVEL_COLOR[nivelActivo] }}>
            {NIVEL_LABEL[nivelActivo] || nivelActivo}
          </span>
        </div>
      )}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {docs.map(({ tipo, titulo, desc, icono, color, ok, razon }) => {
          const r = res[tipo];
          const cargando = gen[tipo];
          return (
            <div key={tipo} style={{ border:`2px solid ${ok ? color : 'var(--line)'}`, borderRadius:'var(--r-lg)', padding:'18px 22px', background: ok ? `color-mix(in srgb, ${color} 4%, white)` : 'var(--surface-2)', opacity: ok ? 1 : 0.65 }}>
              <div style={{ display:'grid', gridTemplateColumns:'44px 1fr auto', gap:14, alignItems:'flex-start' }}>
                <div style={{ width:44, height:44, borderRadius:'var(--r-md)', background:`color-mix(in srgb, ${color} 15%, white)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{icono}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:'var(--ink)', marginBottom:3 }}>{titulo}</div>
                  <div style={{ fontSize:12, color:'var(--ink-3)', lineHeight:1.5 }}>{desc}</div>
                  {razon && (
                    <div style={{ marginTop:6, fontSize:11, color:'#C67100', fontWeight:600, padding:'3px 10px', background:'color-mix(in srgb,#E5A823 10%,white)', borderRadius:6, display:'inline-block' }}>
                      🔒 {razon}
                    </div>
                  )}
                  {r?.url && (
                    <div style={{ marginTop:10, padding:'9px 13px', background:'color-mix(in srgb,#2E7D32 8%,white)', border:'1px solid #2E7D32', borderRadius:'var(--r-md)', display:'flex', alignItems:'center', gap:10 }}>
                      <span>✅</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:'#2E7D32', marginBottom:1 }}>PDF generado</div>
                        <div style={{ fontSize:11, color:'var(--ink-3)', fontFamily:'var(--f-mono)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.nombre}</div>
                      </div>
                      <a href={r.url} target="_blank" rel="noreferrer" style={{ padding:'5px 13px', borderRadius:6, background:'#2E7D32', color:'white', fontSize:12, fontWeight:700, textDecoration:'none' }}>Abrir PDF</a>
                    </div>
                  )}
                  {r?.error && (
                    <div style={{ marginTop:8, padding:'7px 11px', background:'color-mix(in srgb,#C00000 8%,white)', border:'1px solid #C00000', borderRadius:'var(--r-md)', fontSize:12, color:'#8B0000' }}>❌ {r.error}</div>
                  )}
                </div>
                <button
                  disabled={!ok || cargando}
                  onClick={() => generar(tipo)}
                  style={{ padding:'9px 16px', borderRadius:'var(--r-md)', border:`2px solid ${ok ? color : 'var(--line)'}`, background: ok ? color : 'var(--surface-3)', color: ok ? 'white' : 'var(--ink-3)', fontWeight:700, fontSize:12, cursor: ok && !cargando ? 'pointer' : 'not-allowed', whiteSpace:'nowrap', opacity: cargando ? 0.7 : 1 }}>
                  {cargando ? '⏳ Generando…' : 'Generar PDF'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop:14, fontSize:11, color:'var(--ink-3)', padding:'10px 14px', background:'var(--surface-2)', borderRadius:'var(--r-md)' }}>
        📁 Los PDFs se guardan automáticamente en Google Drive en la carpeta del estudiante.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// BUSCADOR PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────
function BuscadorEstudiantes() {
  const [query, setQuery]           = React.useState('');
  const [seleccionado, setSeleccionado] = React.useState(null);
  const [detalle, setDetalle]       = React.useState(null);
  const [cargandoDet, setCargandoDet] = React.useState(false);
  const [errDetalle, setErrDetalle] = React.useState('');

  const seleccionar = async (est) => {
    setSeleccionado(est);
    setDetalle(null);
    setErrDetalle('');
    setCargandoDet(true);
    try {
      const res  = await fetch(`${SCRIPT_URL_B}?fn=getEstudiante&codigo=${encodeURIComponent(est.rec_m)}`);
      const data = await res.json();
      if (data.ok) setDetalle(data);
      else setErrDetalle(data.error || 'No se encontró el estudiante en el servidor');
    } catch(e) {
      setErrDetalle('Error de conexión: ' + e.message);
    } finally {
      setCargandoDet(false);
    }
  };

  const volver = () => {
    setSeleccionado(null);
    setDetalle(null);
    setErrDetalle('');
    setCargandoDet(false);
  };

  const resultados = React.useMemo(() => {
    // Lista local vacía: ESTUDIANTES_COMPLETOS fue eliminado de data.jsx.
    // La búsqueda real se conectará a Apps Script más adelante.
    return [];
  }, [query]);

  if (seleccionado) {
    return <FichaEstudiante est={seleccionado} onBack={volver} detalle={detalle} cargandoDet={cargandoDet} errDetalle={errDetalle} />;
  }

  return (
    <div>
      <PageHeader
        kicker="Base de datos"
        title={<>Buscador de <em>Estudiantes</em></>}
        sub={`153 estudiantes registrados · escribí el nombre, cédula o código del estudiante para buscar`}
      />

      {/* Barra de búsqueda */}
      <div style={{
        display:'flex', alignItems:'center', gap:14,
        background:'var(--surface)', border:'2px solid var(--an-navy)',
        borderRadius:'var(--r-lg)', padding:'14px 20px',
        marginBottom:20, boxShadow:'0 4px 20px rgba(12,45,92,0.1)',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--an-navy)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>
        </svg>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nombre, cédula o código de expediente…"
          autoFocus
          style={{
            flex:1, border:'none', outline:'none', background:'transparent',
            fontFamily:'var(--f-sans)', fontSize:17, color:'var(--ink)',
          }}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ background:'none', border:'none', color:'var(--ink-3)', cursor:'pointer', fontSize:20, lineHeight:1 }}>×</button>
        )}
      </div>

      {/* Estado vacío */}
      {!query.trim() && (
        <div style={{ textAlign:'center', padding:'48px 20px', color:'var(--ink-3)' }}>
          <div style={{ fontSize:52, marginBottom:12 }}>🔍</div>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, color:'var(--an-navy-ink)', marginBottom:6 }}>
            Busca un estudiante
          </div>
          <div style={{ fontSize:14, maxWidth:360, margin:'0 auto', lineHeight:1.6 }}>
            Escribe al menos 2 caracteres del nombre o cédula para ver resultados.
          </div>
        </div>
      )}

      {/* Sin resultados */}
      {query.trim().length >= 2 && resultados.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--ink-3)' }}>
          <div style={{ fontSize:40, marginBottom:10 }}>😕</div>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:20, fontWeight:500, color:'var(--ink-2)', marginBottom:4 }}>
            Sin resultados
          </div>
          <div style={{ fontSize:13 }}>Intentá con otro nombre, cédula o código de expediente.</div>
        </div>
      )}

      {/* Resultados */}
      {resultados.length > 0 && (
        <>
          <div style={{ fontSize:12, color:'var(--ink-3)', marginBottom:10, fontWeight:600 }}>
            {resultados.length} resultado{resultados.length!==1?'s':''}{resultados.length===30?' (mostrando primeros 30)':''}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {resultados.map(est => {
              const niv = est.nivel_actual;
              const c = NIVEL_COLOR_B[niv] || 'var(--ink-3)';
              const cursando = est.historial?.find(h => h.status==='CA');
              return (
                <div key={est.rec_m} onClick={() => seleccionar(est)} style={{
                  display:'grid', gridTemplateColumns:'auto 1fr auto',
                  gap:16, alignItems:'center',
                  background:'var(--surface)', border:'1px solid var(--line)',
                  borderRadius:'var(--r-md)', padding:'14px 18px',
                  cursor:'pointer', transition:'all .15s',
                  borderLeft:`4px solid ${c}`,
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow='var(--sh-1)'; e.currentTarget.style.transform='translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='none'; }}>
                  {/* Avatar */}
                  <div style={{
                    width:42, height:42, borderRadius:'50%',
                    background: niv ? c : 'var(--an-navy)',
                    color:'white', fontSize:14, fontWeight:700,
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                  }}>
                    {(est.display || est.nombre).split(' ').slice(0,2).map(w=>w[0]).join('')}
                  </div>

                  {/* Info */}
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:15, color:'var(--ink)', marginBottom:2 }}>
                      {est.nombre}
                    </div>
                    <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                      <span style={{ fontSize:12, color:'var(--ink-3)', fontFamily:'var(--f-mono)' }}>
                        {est.cedula}
                      </span>
                      <span style={{ fontSize:10, color:'var(--ink-3)' }}>·</span>
                      <span style={{ fontSize:11, color:'var(--ink-3)' }}>Exp. {est.rec_m}</span>
                      {est.grupo_actual && (
                        <>
                          <span style={{ fontSize:10, color:'var(--ink-3)' }}>·</span>
                          <span style={{ fontSize:11, color:'var(--ink-2)' }}>{est.grupo_actual}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
                    {niv && <NivelBadge nivel={niv} />}
                    <StatusChip code={est.status_actual} small />
                    {est.convenio && (
                      <span style={{ padding:'3px 8px', borderRadius:999, background:'color-mix(in srgb, #2E7D32 10%, white)', color:'#2E7D32', fontSize:10, fontWeight:700 }}>CONAPE</span>
                    )}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PAGOS ACORDEÓN — vista por nivel con rubros y estados
// ─────────────────────────────────────────────────────────────────────────
const fmtCRC = n => '₡' + (n||0).toLocaleString('es-CR');

// Construir rubros de un nivel según pagos existentes y modalidad
function buildRubrosNivel(nivel, histEntry, pagosEst) {
  const MAT = 20000;
  const CERT = 15000;
  const CUOTA_MAP = { B1:74800, B2:74800, I1:74800, I2:116483 };
  const cuota = CUOTA_MAP[nivel] || 74800;

  // Detectar modalidad: si el grupo contiene 'B' (bimestral) → 8 cuotas, sino 4
  const grupo = histEntry?.grupo || '';
  const esBimestral = grupo.includes('-B') || grupo.includes('-b');
  const nCuotas = esBimestral ? 8 : 4;

// Pagos reales de este nivel — filtrar por concepto que mencione el nivel
  const pagosNivel = pagosEst.filter(p => {
    const concepto = (p.concepto || '').toUpperCase();
    return concepto.includes(nivel);
  });

  // Si no hay ningún match por nivel en el concepto, intentar por grupo
  const pagosNivelFinal = pagosNivel.length > 0
    ? pagosNivel
    : pagosEst.filter(p => {
        const g = (p.grupo || '').toUpperCase();
        const gr = grupo.toUpperCase();
        return g === gr;
      });

  const findPago = (keyword) => pagosNivelFinal.find(p =>
    (p.concepto||'').toLowerCase().includes(keyword.toLowerCase())
  );

  const rubros = [];

  // Matrícula
  const pagoMat = findPago('Matr') || findPago('matricula');
  rubros.push({
    concepto: 'Matrícula',
    obligatorio: true,
    monto: MAT,
    estado: pagoMat ? 'PAGADO' : 'PENDIENTE',
    fecha: pagoMat?.fecha || null,
    recibo: pagoMat?.recibo || pagoMat?.id || null,
  });

  // Cuotas
  for (let i = 1; i <= nCuotas; i++) {
    const pagoCuota = findPago(`Cuota ${i}`) || findPago(`cuota ${i}`) ||
      pagosNivel.find(p => (p.concepto||'').toLowerCase().includes(`${i}/${nCuotas}`));
    rubros.push({
      concepto: `Cuota ${i}/${nCuotas}`,
      obligatorio: true,
      monto: cuota,
      estado: pagoCuota ? 'PAGADO' : 'PENDIENTE',
      fecha: pagoCuota?.fecha || null,
      recibo: pagoCuota?.recibo || null,
    });
  }

  // Certificado
  const pagoCert = findPago('cert') || findPago('Cert');
  rubros.push({
    concepto: 'Certificado del nivel',
    obligatorio: false,
    monto: CERT,
    estado: pagoCert ? 'PAGADO' : 'PENDIENTE',
    fecha: pagoCert?.fecha || null,
    recibo: pagoCert?.recibo || null,
  });

  const totalPagado = rubros.filter(r=>r.estado==='PAGADO').reduce((a,r)=>a+r.monto,0);
  const totalTotal  = rubros.reduce((a,r)=>a+r.monto,0);
  return { rubros, totalPagado, totalTotal, nCuotas };
}

function PagosAcordeon({ est, pagosEst, nivelMap }) {
  const [abiertos, setAbiertos] = React.useState({ B1:true, B2:true, I1:false, I2:false });
  const toggle = (niv) => setAbiertos(a => ({...a, [niv]: !a[niv]}));

  // Lógica de desbloqueo
  const desbloqueado = { B1: true };
  desbloqueado.B2 = ['APR','CNV'].includes(nivelMap['B1']?.status);
  desbloqueado.I1 = ['APR','CNV'].includes(nivelMap['B2']?.status);
  desbloqueado.I2 = ['APR','CNV'].includes(nivelMap['I1']?.status);

  // Calcular resumen global
  let globalPagado = 0, globalPendiente = 0;
  const nivelData = {};
  NIVEL_ORDER.forEach(niv => {
    const h = nivelMap[niv];
    if (h) {
      const d = buildRubrosNivel(niv, h, pagosEst);
      nivelData[niv] = d;
      globalPagado   += d.totalPagado;
      globalPendiente += (d.totalTotal - d.totalPagado);
    }
  });
  const globalTotal = globalPagado + globalPendiente;

  // Periodo por nivel (aprox cuatrimestral)
  const PERIODO = { B1:'Básico I (4 meses)', B2:'Básico II (4 meses)', I1:'Intermedio I (4 meses)', I2:'Intermedio II (4 meses)' };

  return (
    <div>
      {/* Resumen global */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total pagado',   val:globalPagado,    bg:'color-mix(in srgb,#2E7D32 8%,white)', border:'#2E7D32', color:'#2E7D32' },
          { label:'Pendiente',      val:globalPendiente, bg:'color-mix(in srgb,#E5A823 12%,white)', border:'#E5A823', color:'#6B4A00' },
          { label:'Total programa', val:globalTotal,     bg:'var(--surface-2)', border:'var(--line)', color:'var(--an-navy-ink)' },
        ].map(({label,val,bg,border,color},i) => (
          <div key={i} style={{ padding:'16px 18px', background:bg, border:`1.5px solid ${border}`, borderRadius:'var(--r-lg)' }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:6 }}>{label}</div>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:26, fontWeight:500, letterSpacing:'-0.03em', color }}>{fmtCRC(val)}</div>
          </div>
        ))}
      </div>

      {/* Acordeón por nivel */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {NIVEL_ORDER.map(niv => {
          const c   = NIVEL_COLOR_B[niv];
          const h   = nivelMap[niv];
          const desbloq = desbloqueado[niv];
          const d   = nivelData[niv];
          const abierto = abiertos[niv];

          // Estatus financiero del nivel
          const pctPagado = d ? Math.round((d.totalPagado/d.totalTotal)*100) : 0;
          const completamentePagado = d && d.totalPagado >= d.totalTotal;

          return (
            <div key={niv} style={{
              border: `2px solid ${desbloq ? c : 'var(--line)'}`,
              borderRadius:'var(--r-lg)',
              overflow:'hidden',
              opacity: desbloq ? 1 : 0.55,
            }}>
              {/* Header del acordeón */}
              <div
                onClick={() => desbloq && toggle(niv)}
                style={{
                  padding:'16px 20px',
                  background: desbloq ? `color-mix(in srgb,${c} 6%,white)` : 'var(--surface-2)',
                  cursor: desbloq ? 'pointer' : 'default',
                  display:'grid',
                  gridTemplateColumns:'auto 1fr auto auto auto',
                  gap:14, alignItems:'center',
                }}
              >
                {/* Pill de color */}
                <div style={{ width:14, height:44, borderRadius:4, background:c }} />

                {/* Nombre + periodo */}
                <div>
                  <div style={{ fontWeight:700, fontSize:15, color:'var(--ink)' }}>{NIVEL_LABEL_B[niv]}</div>
                  <div style={{ fontSize:11, color:'var(--ink-3)' }}>
                    {desbloq ? (h?.grupo ? `${h.grupo} · ${PERIODO[niv]}` : PERIODO[niv]) : 'Nivel bloqueado — requiere aprobar el nivel anterior'}
                  </div>
                </div>

                {/* Badge status académico */}
                {h && <StatusChip code={h.status} />}

                {/* Monto pagado / total */}
                {d && (
                  <div style={{ textAlign:'right', minWidth:180 }}>
                    <div style={{ fontSize:12, color:'var(--ink-3)', marginBottom:2 }}>
                      <span style={{ fontFamily:'var(--f-mono)', fontWeight:700, color:'#2E7D32' }}>{fmtCRC(d.totalPagado)}</span>
                      <span style={{ color:'var(--ink-3)' }}> / {fmtCRC(d.totalTotal)}</span>
                    </div>
                    {/* Barra de progreso */}
                    <div style={{ height:5, background:'var(--bg-deep)', borderRadius:3, overflow:'hidden', width:160, marginLeft:'auto' }}>
                      <div style={{ width:`${pctPagado}%`, height:'100%', background: completamentePagado ? '#2E7D32' : c, borderRadius:3 }} />
                    </div>
                    <div style={{ fontSize:10, color: completamentePagado?'#2E7D32':'var(--ink-3)', marginTop:2, fontWeight:600 }}>
                      {pctPagado}% pagado
                    </div>
                  </div>
                )}

                {/* Chevron */}
                {desbloq && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: abierto?'rotate(180deg)':'none', transition:'transform .2s' }}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                )}
              </div>

              {/* Tabla interna */}
              {abierto && desbloq && d && (
                <>
                  <table className="table-soft" style={{ fontSize:12 }}>
                    <thead>
                      <tr>
                        <th>Concepto</th>
                        <th style={{ textAlign:'center', width:70 }}>Oblig.</th>
                        <th style={{ textAlign:'right' }}>Monto</th>
                        <th style={{ textAlign:'center', width:100 }}>Estado</th>
                        <th>Fecha</th>
                        <th>Recibo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.rubros.map((r, i) => (
                        <tr key={i} style={{ background: r.estado==='PAGADO'?'color-mix(in srgb,#2E7D32 3%,white)':r.estado==='PENDIENTE'?'color-mix(in srgb,#E5A823 4%,white)':'transparent' }}>
                          <td style={{ fontWeight:500 }}>{r.concepto}</td>
                          <td style={{ textAlign:'center' }}>
                            <span style={{ fontSize:11, fontWeight:700, color: r.obligatorio?'#C00000':'#8B8178' }}>
                              {r.obligatorio ? 'Sí' : 'No'}
                            </span>
                          </td>
                          <td style={{ textAlign:'right', fontFamily:'var(--f-mono)', fontWeight:600 }}>{fmtCRC(r.monto)}</td>
                          <td style={{ textAlign:'center' }}>
                            {r.estado === 'PAGADO' ? (
                              <span style={{ padding:'3px 9px', borderRadius:999, background:'color-mix(in srgb,#2E7D32 12%,white)', color:'#2E7D32', fontSize:11, fontWeight:700 }}>Pagado</span>
                            ) : (
                              <span style={{ padding:'3px 9px', borderRadius:999, background:'color-mix(in srgb,#E5A823 15%,white)', color:'#6B4A00', fontSize:11, fontWeight:700, border:'1px solid #E5A823' }}>Pendiente</span>
                            )}
                          </td>
                          <td style={{ fontSize:11, color:'var(--ink-3)' }}>{r.fecha ? fmtFechaBus(r.fecha) : '—'}</td>
                          <td style={{ fontSize:11, fontFamily:'var(--f-mono)', color:'var(--ink-3)' }}>{r.recibo || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Footer del nivel */}
                  <div style={{
                    padding:'12px 20px',
                    background: completamentePagado ? 'color-mix(in srgb,#2E7D32 6%,white)' : 'color-mix(in srgb,#E5A823 8%,white)',
                    borderTop:'1px solid var(--line)',
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                  }}>
                    <div style={{ fontSize:12, fontWeight:700, color: completamentePagado?'#2E7D32':'#6B4A00' }}>
                      {completamentePagado ? '✓ Nivel completamente pagado' : `Pendiente: ${fmtCRC(d.totalTotal - d.totalPagado)}`}
                    </div>
                    <div style={{ fontFamily:'var(--f-serif)', fontSize:20, fontWeight:500, color:'var(--an-navy-ink)' }}>
                      Total: {fmtCRC(d.totalTotal)}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { BuscadorEstudiantes });
