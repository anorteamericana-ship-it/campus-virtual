// F98.4-Z6-BK · mora I2 unificada + cuotas sin pendiente ocultas
/* global React, PageHeader */

// ─────────────────────────────────────────────────────────────────────────
// APLICAR PAGO — conectado a Apps Script / APOLLO_G3
// ─────────────────────────────────────────────────────────────────────────

// URL del Apps Script: fuente única en data.jsx → window.APPS_SCRIPT_URL
const SCRIPT_URL_AP = window.APPS_SCRIPT_URL;

// ── FIX-PAGOS-ADMIN-001 ──────────────────────────────────────────────────
// Lecturas y acciones SENSIBLES de pago van por POST text/plain (mismo patrón
// que postVentas): el `fn`, el `token` y los datos viajan en el BODY JSON,
// NUNCA en la URL.
//   • token (y fn) fuera de la URL → elimina el Error CORS de las llamadas GET
//     con token en query string (mismo bug que se corrigió en ventas con
//     getProspectoDetalle → postVentas) y deja de exponer el token.
//   • Content-Type text/plain;charset=utf-8 esquiva el preflight CORS; Apps
//     Script lee el JSON en e.postData.contents igual.
async function postAP(payload, timeoutMs = 45000) {
  const fn = (payload && payload.fn) || '';
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(`${SCRIPT_URL_AP}?fn=${encodeURIComponent(fn)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        token: window.getSessionToken ? window.getSessionToken() : '',
        ...payload,
      }),
      cache: 'no-store',
      redirect: 'follow',
      signal: controller ? controller.signal : undefined,
    });
    const raw = await res.text();
    const text = String(raw || '').trim();
    if (!text) throw new Error(`El backend no devolvió contenido en ${fn}.`);
    if (/^<!doctype\s+html|^<html/i.test(text)) {
      throw new Error('Apps Script devolvió una página HTML. Revisá la implementación publicada y la sesión.');
    }
    let data;
    try { data = JSON.parse(text); }
    catch (_) { throw new Error(`Respuesta inválida del backend en ${fn}.`); }
    if (!res.ok) throw new Error(data?.error || data?.mensaje || `HTTP ${res.status}`);
    return data;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error(`El backend tardó demasiado en responder (${fn}).`);
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
function crearRequestIdPagoAP() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return `PAY-${window.crypto.randomUUID()}`;
  return `PAY-${Date.now()}-${Math.random().toString(36).slice(2,12)}`;
}

function apSafeUserError(raw, fallback, context = '') {
  const msg=String(raw==null?'':raw).trim();
  if(!msg)return fallback;
  const technicalCode=/^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);
  const technicalText=/apps?\s*script|script\.google|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|aborterror|failed to fetch|network request failed|<html|\bjson\b|\btoken\b|unauthorized|forbidden|internal server|http\s*\d{3}|status\s*\d{3}|respuesta inv[aá]lida|request[_ -]?id|file_id|base64|sha-?256|\bmime\b|driveapp|spreadsheet|\bsheet\b|\btabla\b|\bhoja\b|getEstudiante|getComprobantes|aplicarPago|configurarToeicEstudiante/i.test(msg);
  if(technicalCode||technicalText){console.warn('[AplicarPago] Detalle técnico oculto al operador.',{context,error:msg});return fallback;}
  return msg;
}

const NIVEL_COLOR_A = { B1:'#E5A823', B2:'#E8372A', I1:'#2B7FC1', I2:'#4CAF50' };
const NIVEL_LABEL_A = { B1:'Básico I', B2:'Básico II', I1:'Intermedio I', I2:'Intermedio II' };
const NIVEL_ORDER_A = ['B1','B2','I1','I2'];
const STATUS_APROBADO = ['APR','CNV'];

const fmtCRC_A = n => '₡' + (n||0).toLocaleString('es-CR');

// ── Stepper ──────────────────────────────────────────────────────────────
function StepperA({ paso }) {
  const pasos = ['Estudiante', 'Nivel', 'Comprobante', 'Aplicar'];
  return (
    <div style={{ display:'flex', alignItems:'center', marginBottom:24 }}>
      {pasos.map((label, i) => {
        const n = i + 1;
        const activo = paso === n;
        const hecho  = paso > n;
        return (
          <React.Fragment key={i}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, flex: i<3?0:1, minWidth:0 }}>
              <div style={{
                width:34, height:34, borderRadius:'50%',
                background: hecho?'var(--ok)': activo?'var(--an-granate)':'var(--bg-deep)',
                color: (hecho||activo)?'white':'var(--ink-3)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontWeight:700, fontSize:13,
                boxShadow: activo?'0 0 0 4px color-mix(in srgb,var(--an-granate) 20%,transparent)':'none',
              }}>{hecho?'✓':n}</div>
              <div style={{ fontSize:10, fontWeight:activo?700:500, color:activo?'var(--an-granate)':hecho?'var(--ok)':'var(--ink-3)', whiteSpace:'nowrap' }}>
                {label}
              </div>
            </div>
            {i < 3 && <div style={{ flex:1, height:2, margin:'0 6px', marginBottom:18, background:paso>i+1?'var(--ok)':'var(--line-2)', borderRadius:1 }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Panel lateral — resumen del flujo ────────────────────────────────────
function PanelResumen({ est, nivel, comprobante, totalAplicar }) {
  const c = nivel ? NIVEL_COLOR_A[nivel] : 'var(--an-navy)';
  const saldo = comprobante ? (comprobante.saldo ?? (comprobante.credito - comprobante.aplicado)) : 0;
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--r-lg)', padding:'18px 16px', display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-3)' }}>Resumen</div>

      <div>
        <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:4 }}>Estudiante</div>
        {est ? (
          <>
            <div style={{ fontWeight:700, fontSize:13, color:'var(--ink)', lineHeight:1.2 }}>{est.NOMBRE || est.nombre || '—'}</div>
            <div style={{ fontSize:11, color:'var(--ink-3)', fontFamily:'var(--f-mono)', marginTop:2 }}>{est.CEDULA || est.cedula} · {est.CODIGO || est.rec_m}</div>
          </>
        ) : <div style={{ fontSize:12, color:'var(--ink-3)', fontStyle:'italic' }}>Sin seleccionar</div>}
      </div>

      <div>
        <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:4 }}>Nivel</div>
        {nivel ? (
          <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:999, background:`color-mix(in srgb,${c} 12%,white)`, color:c, fontSize:12, fontWeight:700 }}>
            {NIVEL_LABEL_A[nivel] || nivel}
          </span>
        ) : <div style={{ fontSize:12, color:'var(--ink-3)', fontStyle:'italic' }}>Sin seleccionar</div>}
      </div>

      <div>
        <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:4 }}>Comprobante BCR</div>
        {comprobante ? (
          <>
            <div style={{ fontFamily:'var(--f-mono)', fontSize:12, fontWeight:700 }}>#{comprobante.doc}</div>
            <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>{comprobante.fecha}</div>
            <div style={{ fontSize:11, color:'#2E7D32', fontWeight:700, marginTop:4 }}>Saldo: {fmtCRC_A(saldo)}</div>
          </>
        ) : <div style={{ fontSize:12, color:'var(--ink-3)', fontStyle:'italic' }}>Sin seleccionar</div>}
      </div>

      <div style={{ borderTop:'2px solid var(--line)', paddingTop:14 }}>
        <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:4 }}>Total a aplicar</div>
        <div style={{ fontFamily:'var(--f-serif)', fontSize:26, fontWeight:500, color: totalAplicar>0?'var(--an-granate)':'var(--ink-3)', letterSpacing:'-0.03em', lineHeight:1 }}>
          {totalAplicar > 0 ? fmtCRC_A(totalAplicar) : '—'}
        </div>
        {comprobante && totalAplicar > 0 && (
          <div style={{ fontSize:11, marginTop:4, color: totalAplicar > saldo ? '#C00000':'#2E7D32', fontWeight:600 }}>
            {totalAplicar > saldo ? '⚠ Excede el saldo' : `Saldo restante: ${fmtCRC_A(saldo - totalAplicar)}`}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Fila de rubro con stepper de cantidad ────────────────────────────────
function RubroRow({ label, monto, qty, maxQty, onQty, subtotalMax }) {
  const subtotalBruto = qty * monto;
  const subtotal = Number.isFinite(Number(subtotalMax)) ? Math.min(subtotalBruto, Number(subtotalMax)) : subtotalBruto;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto auto', gap:12, alignItems:'center', padding:'12px 16px', background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--r-md)' }}>
      <div>
        <div style={{ fontWeight:600, fontSize:13 }}>{label}</div>
        <div style={{ fontSize:11, color:'var(--ink-3)', fontFamily:'var(--f-mono)' }}>{fmtCRC_A(monto)} c/u</div>
      </div>
      <button onClick={()=>onQty(Math.max(0,qty-1))} style={{ width:32,height:32,borderRadius:8,border:'1px solid var(--line)',background:'var(--surface)',fontWeight:700,fontSize:18,cursor:'pointer',color:'var(--ink-2)',lineHeight:1 }}>−</button>
      <div style={{ width:36,textAlign:'center',fontFamily:'var(--f-mono)',fontWeight:700,fontSize:16 }}>{qty}</div>
      <button onClick={()=>onQty(Math.min(maxQty,qty+1))} style={{ width:32,height:32,borderRadius:8,border:'1px solid var(--line)',background:'var(--surface)',fontWeight:700,fontSize:18,cursor:'pointer',color:'var(--ink-2)',lineHeight:1 }}>+</button>
      <div style={{ fontFamily:'var(--f-mono)',fontWeight:700,fontSize:14,color:qty>0?'var(--an-granate)':'var(--ink-3)',textAlign:'right',minWidth:100 }}>
        {qty > 0 ? fmtCRC_A(subtotal) : '—'}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PASO 1 — Buscar estudiante (componente independiente)
// ─────────────────────────────────────────────────────────────────────────
function Paso1AP({ setEstSel, setEstData, setError, setPaso }) {
  const [q, setQ] = React.useState('');
  const [buscando, setBuscando] = React.useState(false);
  const [errLocal, setErrLocal] = React.useState('');

  const buscar = async () => {
    const codigo = q.trim();
    if (!codigo) return;
    setBuscando(true);
    setErrLocal('');
    try {
      // FIX-PAGOS-ADMIN-001: GET con token en URL → POST text/plain (sin CORS).
      const data = await postAP({ fn: 'getEstudiante', codigo });
      if (!data.ok) { setErrLocal(apSafeUserError(data?.error || data?.mensaje, 'No se pudo cargar el estudiante. Verificá el código e intentá de nuevo.', 'buscar_estudiante')); return; }
      setEstSel(data.estudiante);
      setEstData({
        niveles:    data.niveles    || {},
        pagos:      data.pagos      || [],
        otrosPagos: data.otrosPagos || [],
        grupo:      data.cod_grupo || String(data.grupo?.CODIGO_GRUPO || data.grupo || ''),
        grupo_tipo: data.grupo_tipo || '',
        pendientes: data.pendientes || {},
        otros_cargos: data.otros_cargos || [],
      });
      setError('');
      setPaso(2);
    } catch(e) {
      setErrLocal(apSafeUserError(e?.message || String(e), 'No se pudo cargar el estudiante. Revisá la conexión e intentá de nuevo.', 'buscar_estudiante'));
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div>
      <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, marginBottom:16, color:'var(--an-navy-ink)' }}>
        Buscar estudiante
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:12, background:'var(--surface)', border:'2px solid var(--an-granate)', borderRadius:'var(--r-lg)', padding:'12px 18px', marginBottom:12 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--an-granate)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
        <input value={q} onChange={e=>setQ(e.target.value)} autoFocus
          onKeyDown={e=>{ if(e.key==='Enter') buscar(); }}
          placeholder="Código de expediente (ej: 17024)…"
          style={{ flex:1, border:'none', outline:'none', fontFamily:'var(--f-mono)', fontSize:16, background:'transparent', color:'var(--ink)' }} />
        {q && <button onClick={()=>setQ('')} style={{ background:'none',border:'none',color:'var(--ink-3)',cursor:'pointer',fontSize:20 }}>×</button>}
      </div>
      <button onClick={buscar} disabled={!q.trim() || buscando} className="btn btn-primary"
        style={{ width:'100%', padding:13, fontSize:15, background:'var(--an-granate)', borderColor:'var(--an-granate)', marginBottom:12, opacity: q.trim()&&!buscando?1:0.5 }}>
        {buscando ? 'Buscando…' : 'Buscar estudiante →'}
      </button>
      {errLocal && (
        <div style={{ padding:'10px 14px', background:'color-mix(in srgb,#C00000 8%,white)', border:'1px solid #C00000', borderRadius:'var(--r-md)', color:'#C00000', fontSize:13 }}>
          ⚠ {errLocal}
        </div>
      )}
    </div>
  );
}

function ToeicDecisionAP({ estData, setEstData, estSel }) {
  const info = estData?.pendientes?.por_nivel?.I2 || {};
  const aplica = info.toeic_aplica !== false && Number(info.precio_toeic || 0) > 0;
  const pagado = Number(info.toeic_pagado || 0) > 0 || String(info.toeic_estado || '').toUpperCase() === 'PAGADO';
  const cobrable = info.toeic_cobrable === true;
  const [omitido, setOmitido] = React.useState(!!info.toeic_omitido);
  const [motivo, setMotivo] = React.useState(info.toeic_motivo_omision || '');
  const [guardando, setGuardando] = React.useState(false);
  const [mensaje, setMensaje] = React.useState('');

  React.useEffect(() => {
    setOmitido(!!info.toeic_omitido);
    setMotivo(info.toeic_motivo_omision || '');
  }, [info.toeic_omitido, info.toeic_motivo_omision, info.toeic_estado]);

  if (!aplica) return null;
  const guardar = async () => {
    if (omitido && !motivo.trim()) { setMensaje('Indicá el motivo de la omisión.'); return; }
    setGuardando(true); setMensaje('');
    try {
      const data = await postAP({ fn:'configurarToeicEstudiante', codigo:estSel?.CODIGO || estSel?.rec_m, omitido, motivo:motivo.trim() });
      if (!data.ok) { setMensaje(apSafeUserError(data?.error || data?.mensaje, 'Error al guardar la decisión TOEIC. Intentá de nuevo.', 'configurar_toeic')); return; }
      const f = data.ficha || {};
      setEstData(prev => ({
        ...(prev || {}),
        niveles:f.niveles || prev?.niveles || {}, pagos:f.pagos || prev?.pagos || [], otrosPagos:f.otrosPagos || prev?.otrosPagos || [],
        grupo:f.cod_grupo || prev?.grupo || '', grupo_tipo:f.grupo_tipo || prev?.grupo_tipo || '', pendientes:f.pendientes || prev?.pendientes || {}, otros_cargos:f.otros_cargos || prev?.otros_cargos || [],
      }));
      setMensaje(omitido ? 'TOEIC omitido. Ya no bloquea la mora.' : 'TOEIC reactivado como pendiente de pago.');
    } catch (e) { setMensaje(apSafeUserError(e?.message || String(e), 'Error al guardar la decisión TOEIC. Revisá la conexión e intentá de nuevo.', 'configurar_toeic')); }
    finally { setGuardando(false); }
  };
  const estado = String(info.toeic_estado || 'PENDIENTE').toUpperCase();
  return <div onClick={e=>e.stopPropagation()} style={{marginTop:9,padding:'9px 10px',border:'1px solid #D8E0EA',borderRadius:10,background:'white'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center',flexWrap:'wrap'}}>
      <div><b style={{fontSize:11}}>TOEIC {fmtCRC_A(info.precio_toeic)}</b><div style={{fontSize:9.5,color:estado==='PAGADO'||estado==='OMITIDO'?'#2E7D32':'#9A5B00'}}>Estado: {estado.replace(/_/g,' ')}</div></div>
      <label style={{display:'flex',gap:6,alignItems:'center',fontSize:10.5,fontWeight:700,cursor:pagado?'not-allowed':'pointer'}}>
        <input type="checkbox" checked={omitido} disabled={pagado||guardando||!cobrable} onChange={e=>setOmitido(e.target.checked)} /> Omitir cobro
      </label>
    </div>
    {omitido && !pagado && <input value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Motivo obligatorio" style={{width:'100%',marginTop:7,padding:'7px 9px',border:'1px solid var(--line)',borderRadius:8,fontSize:10.5}} />}
    {!pagado && cobrable && <button type="button" onClick={guardar} disabled={guardando} className="btn btn-ghost" style={{marginTop:7,padding:'6px 9px',fontSize:10}}>{guardando?'Guardando…':'Guardar decisión TOEIC'}</button>}
    {!cobrable && <div style={{fontSize:9.5,color:'#756D65',marginTop:5}}>La decisión se habilita cuando I2 esté CA o APR.</div>}
    {mensaje && <div style={{fontSize:9.5,color:mensaje.startsWith('Error')||mensaje.startsWith('Indicá')?'#C00000':'#2E7D32',marginTop:5,fontWeight:700}}>{mensaje}</div>}
  </div>;
}

// ─────────────────────────────────────────────────────────────────────────
// PASO 2 — Seleccionar nivel (componente independiente)
// ─────────────────────────────────────────────────────────────────────────
function Paso2AP({ estData, setEstData, estSel, setNivelSel, setError, setPaso, resetRubros }) {
  const niveles    = estData?.niveles  || {};
  const pendientes = estData?.pendientes || {};
  const grupo      = estData?.grupo    || '';

  // F98.4-Z6-BG: un nivel solo admite pagos si existe realmente en ESTATUS
  // y no está PE. El nivel siguiente además requiere APR/CNV del anterior.
  // Esto evita cobrar cursos proyectados que todavía no están matriculados.
  const desbloq = {};
  NIVEL_ORDER_A.forEach((niv, i) => {
    const actual = niveles[niv];
    const estadoActual = String(actual?.estatus || '').trim().toUpperCase();
    const existe = !!actual && typeof actual === 'object';
    const activoFinanciero = existe && estadoActual !== 'PE';
    if (i === 0) { desbloq[niv] = activoFinanciero; return; }
    const prev = NIVEL_ORDER_A[i-1];
    const estadoPrev = String(niveles[prev]?.estatus || '').trim().toUpperCase();
    desbloq[niv] = activoFinanciero && STATUS_APROBADO.includes(estadoPrev);
  });

  const seleccionarNivel = (niv) => {
    if (!desbloq[niv]) return;
    setNivelSel(niv);
    setError('');
    // T-fix-stepper: al cambiar de nivel hay que limpiar los contadores del paso 4,
    // si no, los valores del nivel anterior persisten en pantalla cuando se llega ahí.
    if (resetRubros) resetRubros();
    setPaso(3);
  };

  // Precios de pendientes (globales por estudiante, no por nivel)
  const cuota     = pendientes.cuota_mensual || 0;
  const matricula = pendientes.matricula     || 0;

  return (
    <div>
      <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, marginBottom:6, color:'var(--an-navy-ink)' }}>Seleccionar nivel</div>
      <div style={{ fontSize:13, color:'var(--ink-3)', marginBottom:18 }}>Solo los niveles existentes y no proyectados (PE) pueden recibir pagos.</div>

      {/* Info estudiante */}
      <div style={{ padding:'12px 16px', background:'color-mix(in srgb,var(--an-navy) 5%,white)', border:'1px solid color-mix(in srgb,var(--an-navy) 20%,white)', borderRadius:'var(--r-md)', marginBottom:18, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
        <div>
          <div style={{ fontWeight:700, fontSize:14 }}>{estSel?.NOMBRE || '—'}</div>
          <div style={{ fontSize:11, color:'var(--ink-3)', fontFamily:'var(--f-mono)' }}>{estSel?.CEDULA} · Cód. {estSel?.CODIGO} {grupo ? `· ${grupo}` : ''}</div>
        </div>
        {estSel?.CONVENIO === 'CONAPE' && (
          <span style={{ padding:'3px 10px', borderRadius:999, background:'color-mix(in srgb,#2E7D32 10%,white)', color:'#2E7D32', fontSize:11, fontWeight:700 }}>CONAPE</span>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
        {NIVEL_ORDER_A.filter(niv => niv in niveles).map(niv => {
          const c   = NIVEL_COLOR_A[niv];
          const h   = niveles[niv];
          const ok  = desbloq[niv];
          const pNivel = pendientes?.por_nivel?.[niv] || {};
          const cuotaNivel = Number(pNivel.precio_cuota ?? cuota ?? 0);
          const matriculaNivel = Number(pNivel.matricula_pend ?? matricula ?? 0);
          const grupoNivel = h?.grupo || grupo;
          const cargoNivel = (estData?.otros_cargos || []).find(x => String(x.ESTADO||'').toUpperCase()==='PENDIENTE' && String(x.NIVEL||'').toUpperCase()===niv);
          return (
            <div key={niv} onClick={()=>seleccionarNivel(niv)} style={{
              padding:'18px 20px', borderRadius:'var(--r-lg)',
              border:`2px solid ${ok?c:'var(--line)'}`,
              background: ok?`color-mix(in srgb,${c} 5%,white)`:'var(--surface-2)',
              opacity: ok?1:0.5, cursor: ok?'pointer':'not-allowed',
              transition:'all .15s',
            }}
            onMouseEnter={e=>{ if(ok){ e.currentTarget.style.boxShadow='var(--sh-1)'; e.currentTarget.style.transform='translateY(-1px)'; }}}
            onMouseLeave={e=>{ e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform=''; }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ padding:'3px 10px', borderRadius:999, background:c, color:'white', fontSize:11, fontWeight:700 }}>{NIVEL_LABEL_A[niv]}</span>
                {h?.estatus && <span style={{ padding:'3px 8px', borderRadius:999, background:`color-mix(in srgb,${c} 14%,white)`, color:c, fontSize:10, fontWeight:700 }}>{h.estatus}</span>}
              </div>
              {ok ? (
                <>
                  <div style={{ fontSize:11, color:'var(--ink-3)', marginBottom:4 }}>{grupoNivel || 'Sin grupo asignado'}</div>
                  <div style={{ fontSize:12, color:'var(--ink-2)' }}>
                    {cuotaNivel > 0 && Number(pNivel.cuotas_pend || 0) > 0
                      ? <>Cuota: <strong style={{ color:c }}>{fmtCRC_A(cuotaNivel)}</strong> · pendiente {fmtCRC_A(pNivel.cuotas_pend)}</>
                      : <span style={{ color:'#2E7D32', fontWeight:600 }}>✓ Sin cuotas pendientes</span>}
                  </div>
                  {matriculaNivel > 0 && <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>Matrícula pendiente: {fmtCRC_A(matriculaNivel)}</div>}
                  {cargoNivel && <div style={{ fontSize:11, color:'#9A5B00', fontWeight:700, marginTop:2 }}>{cargoNivel.CONCEPTO}: {fmtCRC_A(cargoNivel.MONTO)}</div>}
                  {h?.periodo_corto && <div style={{ fontSize:10, color:'var(--ink-3)', marginTop:3 }}>{h.periodo_corto} · {h.convenio || 'Sin convenio'}</div>}
                  {niv === 'I2' && <ToeicDecisionAP estData={estData} setEstData={setEstData} estSel={estSel} />}
                </>
              ) : (
                <div style={{ fontSize:12, color:'var(--ink-3)', fontStyle:'italic' }}>
                  {String(h?.estatus || '').toUpperCase() === 'PE'
                    ? '🔒 Nivel proyectado: no admite pagos hasta su matrícula/activación'
                    : '🔒 Debe promover el nivel anterior primero'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PASO 3 — Buscar comprobante (componente independiente)
// ─────────────────────────────────────────────────────────────────────────
function Paso3AP({ comprobantes, setComprobantes, setComprSel, setPaso, setError }) {
  const [q, setQ] = React.useState('');
  const [cargandoCompr, setCargandoCompr] = React.useState(false);
  const [errLocal, setErrLocal] = React.useState('');

  React.useEffect(() => {
    if (comprobantes.length > 0) return; // ya cargados
    setCargandoCompr(true);
    // FIX-PAGOS-ADMIN-001: GET con token en URL → POST text/plain (sin CORS).
    postAP({ fn: 'getComprobantes' })
      .then(data => {
        if (!data.ok) { setErrLocal(apSafeUserError(data?.error || data?.mensaje, 'No se pudieron cargar los comprobantes. Intentá de nuevo.', 'cargar_comprobantes')); return; }
        setComprobantes(data.comprobantes || []);
      })
      .catch(e => setErrLocal(apSafeUserError(e?.message || String(e), 'No se pudieron cargar los comprobantes. Revisá la conexión e intentá de nuevo.', 'cargar_comprobantes')))
      .finally(() => setCargandoCompr(false));
  }, []);

  const resultados = comprobantes.filter(m => {
    const saldo = m.saldo ?? (m.credito - m.aplicado);
    if (saldo <= 0) return false;
    if (!q.trim()) return true;
    const qn = q.trim().toLowerCase();
    return String(m.doc).includes(qn) || (m.descripcion||'').toLowerCase().includes(qn) || (m.fecha||'').includes(qn);
  });

  return (
    <div>
      <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, marginBottom:6, color:'var(--an-navy-ink)' }}>Buscar comprobante bancario</div>
      <div style={{ fontSize:13, color:'var(--ink-3)', marginBottom:14 }}>Solo se muestran comprobantes con saldo disponible mayor a ₡0.</div>

      <div style={{ display:'flex', alignItems:'center', gap:10, background:'var(--surface)', border:'2px solid var(--an-granate)', borderRadius:'var(--r-md)', padding:'10px 16px', marginBottom:14 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--an-granate)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
        <input value={q} onChange={e=>setQ(e.target.value)} autoFocus placeholder="N° documento, fecha o descripción…"
          style={{ flex:1, border:'none', outline:'none', fontFamily:'var(--f-mono)', fontSize:14, background:'transparent' }} />
      </div>

      {errLocal && (
        <div style={{ padding:'10px 14px', background:'color-mix(in srgb,#C00000 8%,white)', border:'1px solid #C00000', borderRadius:'var(--r-md)', color:'#C00000', fontSize:13, marginBottom:12 }}>
          ⚠ {errLocal}
        </div>
      )}

      {cargandoCompr ? (
        <div style={{ textAlign:'center', padding:40, color:'var(--ink-3)', fontSize:14 }}>Cargando comprobantes…</div>
      ) : (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <table className="table-soft" style={{ fontSize:12 }}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>N° Documento</th>
                <th>Descripción</th>
                <th style={{ textAlign:'right' }}>Crédito</th>
                <th style={{ textAlign:'right' }}>Saldo disponible</th>
              </tr>
            </thead>
            <tbody>
              {resultados.length > 0 ? resultados.map((m, i) => {
                const saldo = m.saldo ?? (m.credito - m.aplicado);
                return (
                  <tr key={i} onClick={()=>{ setComprSel(m); setPaso(4); setError(''); }} style={{ cursor:'pointer' }}>
                    <td style={{ fontFamily:'var(--f-mono)', fontSize:11 }}>{m.fecha}</td>
                    <td style={{ fontFamily:'var(--f-mono)', fontWeight:700, color:'var(--an-navy)' }}>{m.doc}</td>
                    <td style={{ maxWidth:260, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.descripcion}</td>
                    <td style={{ textAlign:'right', fontFamily:'var(--f-mono)' }}>{fmtCRC_A(m.credito)}</td>
                    <td style={{ textAlign:'right' }}>
                      <span style={{ fontFamily:'var(--f-mono)', fontWeight:700, fontSize:14, color:'#2E7D32' }}>{fmtCRC_A(saldo)}</span>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={5} style={{ textAlign:'center', color:'var(--ink-3)', padding:24, fontStyle:'italic' }}>Sin comprobantes con saldo disponible</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PASO 4 — Configurar y aplicar (componente independiente)
// ─────────────────────────────────────────────────────────────────────────
function Paso4AP({
  estSel, nivelSel, comprSel, estData,
  qMat, setQMat, qCuota, setQCuota, qCert, setQCert, qTitulo, setQTitulo, qToeic, setQToeic, qOtro, setQOtro,
  setTotalAplicarPanel, setComprobantes, setConfirmado,
  confirmado, setPaso, reiniciar, error, onNavigate, returnTarget
}) {
  const est    = estSel;
  const niv    = nivelSel;
  const compr  = comprSel;
  const pend   = estData?.pendientes || {};
  const saldo  = compr ? (compr.saldo ?? (compr.credito - compr.aplicado)) : 0;

  const pendNivel = pend?.por_nivel?.[niv] || {};
  const estadoNivel = String(pendNivel.estatus || estData?.niveles?.[niv]?.estatus || '').trim().toUpperCase();
  const nivelMatriculado = !!estData?.niveles?.[niv] && estadoNivel !== 'PE';
  const documentoCobrable = nivelMatriculado && ['CA','APR'].includes(estadoNivel);
  const montoMat   = nivelMatriculado ? Number(pendNivel.matricula_pend ?? pend.matricula ?? 0) : 0;
  const montoCuota = nivelMatriculado ? Number(pendNivel.precio_cuota ?? pend.cuota_mensual ?? 0) : 0;

  // El certificado puede cobrarse durante CA. La morosidad sigue exigiéndolo
  // únicamente al aprobar; aquí solo se habilita el cobro anticipado/controlado.
  const precioCert = Number(pendNivel.precio_certificado || 0);
  const pagadoCert = Number(pendNivel.cert_pagado || 0);
  const saldoCert = Math.max(0, precioCert - pagadoCert);
  const montoCert = documentoCobrable
    ? Math.max(Number(pendNivel.cert_pend || 0), saldoCert)
    : 0;

  // I2 cierra con certificado de nivel, certificado de Programa Completo y TOEIC.
  // Programa Completo no aplica cuando existe CNV por examen de nivelación.
  const precioTitulo = Number(pendNivel.precio_programa_completo ?? pendNivel.precio_titulo ?? 0);
  const pagadoTitulo = Number(pendNivel.programa_completo_pagado ?? pendNivel.titulo_pagado ?? 0);
  const montoTitulo = niv === 'I2' && documentoCobrable && pendNivel.programa_completo_aplica !== false && pendNivel.programa_completo_cobrable !== false
    ? Math.max(Number(pendNivel.programa_completo_pend ?? pendNivel.titulo_pend ?? 0), Math.max(0, precioTitulo - pagadoTitulo))
    : 0;
  const precioToeic = Number(pendNivel.precio_toeic || 0);
  const montoToeic = niv === 'I2' && documentoCobrable && pendNivel.toeic_aplica !== false && !pendNivel.toeic_omitido
    ? Math.max(Number(pendNivel.toeic_pend || 0), Math.max(0, precioToeic - Number(pendNivel.toeic_pagado || 0)))
    : 0;

  const cargoOtro = (estData?.otros_cargos || []).find(c =>
    String(c.ESTADO || '').toUpperCase() === 'PENDIENTE' &&
    (!c.NIVEL || String(c.NIVEL).toUpperCase() === String(niv || '').toUpperCase())
  ) || null;
  const montoOtro = Number(cargoOtro?.MONTO || 0);

  // Cantidad realmente pendiente del intento seleccionado. Evita cobrar de más
  // cuando ya existen una o más cuotas aplicadas en ese mismo grupo/intento.
  const cuotaPendienteTotal = Number(pendNivel.cuotas_pend || 0);
  const nCuotasPeriodo = Number(pendNivel.n_cuotas_periodo || (estData?.grupo_tipo === 'B' ? 2 : 4));
  const nCuotas = montoCuota > 0 && cuotaPendienteTotal > 0
    ? Math.min(nCuotasPeriodo, Math.ceil(cuotaPendienteTotal / montoCuota))
    : 0;
  const mostrarCuotas = montoCuota > 0 && cuotaPendienteTotal > 0 && nCuotas > 0;
  const subtotalCuotas = mostrarCuotas ? Math.min(qCuota * montoCuota, cuotaPendienteTotal) : 0;
  React.useEffect(() => {
    if (!mostrarCuotas && qCuota !== 0) setQCuota(0);
    else if (mostrarCuotas && qCuota > nCuotas) setQCuota(nCuotas);
  }, [mostrarCuotas, nCuotas, qCuota, setQCuota]);

  const [cargandoApl, setCargandoApl] = React.useState(false);
  const [errLocal, setErrLocal] = React.useState('');
  const requestIdRef = React.useRef('');
  React.useEffect(() => {
    requestIdRef.current = '';
  }, [est?.CODIGO, est?.rec_m, niv, compr?.doc, qMat, qCuota, qCert, qTitulo, qToeic, qOtro]);

  const total       = qMat*montoMat + subtotalCuotas + qCert*montoCert + qTitulo*montoTitulo + qToeic*montoToeic + qOtro*montoOtro;
  const excedeSaldo = total > saldo;
  const puedeAplicar = total > 0 && !excedeSaldo && !cargandoApl;

  // Sync panel
  React.useEffect(() => { setTotalAplicarPanel(total); }, [total]);

  const aplicar = async () => {
    setCargandoApl(true);
    setErrLocal('');
    try {
      // est.GRUPO viene de la hoja DATOS y corresponde al grupo ORIGINAL de matrícula
      // (siempre B1). Para escribir el grupo correcto del nivel seleccionado en
      // OTROS_PAGOS y PAGOS usamos estData.grupo que llega de getEstudiante.
      const grupoActual = estData?.niveles?.[niv]?.grupo || estData?.grupo || '';
      const rubros = [
        { tipo:'MATRICULA',   nivel:niv, monto:qMat*montoMat,     grupo: grupoActual },
        { tipo:'CUOTA',       nivel:niv, monto:subtotalCuotas, grupo: grupoActual },
        { tipo:'CERTIFICADO', nivel:niv, monto:qCert*montoCert,   grupo: grupoActual },
        { tipo:'PROGRAMA_COMPLETO', nivel:'I2', monto:qTitulo*montoTitulo, grupo: grupoActual },
        { tipo:'TOEIC', nivel:'I2', monto:qToeic*montoToeic, grupo: grupoActual },
        { tipo:'OTRO', nivel:niv, monto:qOtro*montoOtro, grupo: grupoActual, codigo_precio:cargoOtro?.CODIGO_PRECIO || '', concepto:cargoOtro?.CONCEPTO || 'OTRO PAGO', cargo_id:cargoOtro?.CARGO_ID || '' },
      ].filter(r => r.monto > 0);

      // FIX-PAGOS-ADMIN-001: ya era POST; ahora con Content-Type text/plain
      // explícito (vía postAP) para garantizar que no se dispare un preflight
      // CORS. El shape del body NO cambia (doc, monto_total, cod_estudiante,
      // rubros); el token sigue viajando en el body.
      if (!requestIdRef.current) requestIdRef.current = crearRequestIdPagoAP();
      const data = await postAP({
        fn:             'aplicarPago',
        request_id:     requestIdRef.current,
        doc:            compr.doc,
        monto_total:    total,
        cod_estudiante: est?.CODIGO || est?.rec_m,
        rubros,
      });
      if (!data.ok) { setErrLocal(apSafeUserError(data?.error || data?.mensaje, 'No se pudo aplicar el pago. Revisá los datos e intentá de nuevo.', 'aplicar_pago')); return; }
      requestIdRef.current = '';
      // v4.15: si CONAPE no se sincronizó lo dejamos en la consola — y además lo
      // pasamos a la pantalla de confirmación para que el admin lo vea.
      const conapeSyncFallo = data.conape_sync === false;
      if (conapeSyncFallo) {
        console.warn('CONAPE no sincronizado — tablas 4-7 requieren sync manual');
      }

      // Actualizar saldo del comprobante localmente
      setComprobantes(prev => prev.map(c =>
        c.doc === compr.doc
          ? { ...c, aplicado: (c.aplicado||0)+total, saldo: (c.saldo ?? (c.credito-c.aplicado)) - total }
          : c
      ));

      setConfirmado({
        recibos:        data.recibos || [],
        monto:          total,
        saldoRestante:  data.saldo_restante ?? (saldo - total),
        conapeSyncFallo,
      });
    } catch(e) {
      setErrLocal(apSafeUserError(e?.message || String(e), 'No se pudo aplicar el pago. Revisá la conexión e intentá de nuevo.', 'aplicar_pago'));
    } finally {
      setCargandoApl(false);
    }
  };

  if (confirmado) {
    return (
      <div style={{ textAlign:'center' }}>
        <div style={{
          background:'linear-gradient(135deg,var(--an-granate),color-mix(in srgb,var(--an-granate) 80%,black))',
          borderRadius:'var(--r-xl)', padding:'40px 32px', color:'white', marginBottom:20,
        }}>
          <div style={{ fontSize:60, marginBottom:12 }}>✅</div>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:28, fontWeight:500, marginBottom:6 }}>Pago aplicado</div>
          {confirmado.recibos.map((rec, i) => (
            <div key={i} style={{ fontSize:28, fontFamily:'var(--f-mono)', fontWeight:700, letterSpacing:'0.04em', marginBottom:6 }}>
              REC-{rec}
            </div>
          ))}
          <div style={{ fontSize:22, fontWeight:700, fontFamily:'var(--f-serif)', marginBottom:8 }}>{fmtCRC_A(confirmado.monto)}</div>
          {confirmado.saldoRestante > 0 && (
            <div style={{ fontSize:13, opacity:0.85 }}>
              Saldo restante del comprobante: <strong>{fmtCRC_A(confirmado.saldoRestante)}</strong>
            </div>
          )}
        </div>
        {confirmado.conapeSyncFallo && (
          <div style={{
            padding:'12px 16px', marginBottom:16,
            background:'color-mix(in srgb,#E59500 12%,white)',
            border:'1px solid #E59500',
            borderRadius:'var(--r-md)',
            color:'#8A4B00', fontSize:13, fontWeight:600,
            textAlign:'left', display:'flex', gap:10, alignItems:'flex-start',
          }}>
            <span style={{ fontSize:16, lineHeight:1 }}>⚠</span>
            <span>
              CONAPE no pudo sincronizarse automáticamente. El pago se aplicó correctamente,
              pero deberás verificar el estado en la sección <strong>CONAPE</strong>.
            </span>
          </div>
        )}
        <div style={{ display:'grid', gridTemplateColumns:returnTarget ? 'repeat(3,1fr)' : '1fr 1fr', gap:10 }}>
          <button onClick={reiniciar} className="btn btn-ghost" style={{ padding:14 }}>Nuevo pago</button>
          <button onClick={()=>{ setConfirmado(null); setTotalAplicarPanel(0); setPaso(3); }} className="btn btn-primary" style={{ background:'var(--an-granate)', borderColor:'var(--an-granate)', padding:14 }}>Otro comprobante</button>
          {returnTarget && <button onClick={()=>onNavigate?.(returnTarget.route || 'calendario_grupo', returnTarget.context || {})} className="btn btn-primary" style={{ background:'var(--an-navy)', borderColor:'var(--an-navy)', padding:14 }}>Volver al panel</button>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:14 }}>
        <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, color:'var(--an-navy-ink)' }}>Configurar pago</div>
        {niv && (
          <span style={{
            padding:'4px 12px', borderRadius:999,
            background: NIVEL_COLOR_A[niv] || 'var(--an-navy)',
            color:'white', fontSize:12, fontWeight:700,
            letterSpacing:'0.02em', whiteSpace:'nowrap',
          }}>
            {NIVEL_LABEL_A[niv] || niv}
          </span>
        )}
      </div>

      {/* Comprobante seleccionado */}
      <div style={{ padding:'12px 16px', background:'color-mix(in srgb,#2E7D32 6%,white)', border:'1px solid #2E7D32', borderRadius:'var(--r-md)', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'#2E7D32', textTransform:'uppercase', letterSpacing:'0.1em' }}>Comprobante #{compr.doc}</div>
          <div style={{ fontSize:12, color:'var(--ink-2)' }}>{compr.descripcion}</div>
          <div style={{ fontSize:11, color:'var(--ink-3)' }}>{compr.fecha}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:11, color:'var(--ink-3)' }}>Saldo disponible</div>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:24, fontWeight:500, color:'#2E7D32', letterSpacing:'-0.02em' }}>{fmtCRC_A(saldo)}</div>
        </div>
      </div>

      {/* Rubros */}
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
        {montoMat   > 0 && <RubroRow label="Matrícula"                       monto={montoMat}   qty={qMat}   maxQty={1}       onQty={setQMat}   />}
        {mostrarCuotas && <RubroRow label={`Cuota mensual (máx. ${nCuotas})`} monto={montoCuota} qty={qCuota} maxQty={nCuotas} onQty={setQCuota} subtotalMax={cuotaPendienteTotal} />}
        {montoCert  > 0 && <RubroRow label={`Certificado de ${NIVEL_LABEL_A[niv] || niv}`} monto={montoCert} qty={qCert} maxQty={1} onQty={setQCert} />}
        {montoTitulo > 0 && <RubroRow label="Certificado Programa Completo" monto={montoTitulo} qty={qTitulo} maxQty={1} onQty={setQTitulo} />}
        {niv === 'I2' && pendNivel.programa_completo_estado === 'NO_APLICA_NIVELACION' && <div style={{padding:'10px 12px',borderRadius:9,background:'#F4F1EC',color:'#756D65',fontSize:11,fontWeight:700}}>Programa Completo: no aplica por nivel convalidado mediante examen de nivelación.</div>}
        {montoToeic > 0 && <RubroRow label="Prueba TOEIC" monto={montoToeic} qty={qToeic} maxQty={1} onQty={setQToeic} />}
        {niv === 'I2' && pendNivel.toeic_omitido && <div style={{padding:'10px 12px',borderRadius:9,background:'#E8F5E9',color:'#2E7D32',fontSize:11,fontWeight:700}}>TOEIC omitido administrativamente: no bloquea la mora.</div>}
        {montoOtro > 0 && <RubroRow label={cargoOtro?.CONCEPTO || 'Otro pago'} monto={montoOtro} qty={qOtro} maxQty={1} onQty={setQOtro} />}
        {montoMat === 0 && !mostrarCuotas && montoCert === 0 && montoTitulo === 0 && montoToeic === 0 && montoOtro === 0 && (
          <div style={{ padding:'16px', background:'var(--surface-2)', border:'1px dashed var(--line-2)', borderRadius:'var(--r-md)', color:'var(--ink-3)', fontSize:13, textAlign:'center' }}>
            No hay rubros pendientes para este estudiante
          </div>
        )}
      </div>

      {/* Total */}
      <div style={{ padding:'16px 18px', background:'var(--surface-2)', borderRadius:'var(--r-md)', border:'1px solid var(--line)', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontWeight:700, fontSize:15 }}>Total a aplicar</span>
        <span style={{ fontFamily:'var(--f-serif)', fontSize:28, fontWeight:500, color:excedeSaldo?'#C00000':total>0?'var(--an-granate)':'var(--ink-3)', letterSpacing:'-0.02em' }}>{total>0?fmtCRC_A(total):'—'}</span>
      </div>

      {/* Errores */}
      {excedeSaldo && (
        <div style={{ padding:'10px 14px', background:'color-mix(in srgb,#C00000 8%,white)', border:'1px solid #C00000', borderRadius:'var(--r-md)', color:'#C00000', fontSize:13, fontWeight:600, marginBottom:12 }}>
          ⚠ El total ({fmtCRC_A(total)}) excede el saldo disponible ({fmtCRC_A(saldo)})
        </div>
      )}
      {errLocal && (
        <div style={{ padding:'10px 14px', background:'color-mix(in srgb,#C00000 8%,white)', border:'1px solid #C00000', borderRadius:'var(--r-md)', color:'#C00000', fontSize:13, marginBottom:12 }}>
          ⚠ {errLocal}
        </div>
      )}
      {error && (
        <div style={{ padding:'10px 14px', background:'color-mix(in srgb,#C00000 8%,white)', border:'1px solid #C00000', borderRadius:'var(--r-md)', color:'#C00000', fontSize:13, marginBottom:12 }}>
          {error}
        </div>
      )}

      <button onClick={aplicar} disabled={!puedeAplicar} className="btn btn-primary" style={{
        width:'100%', padding:18, fontSize:16,
        background: puedeAplicar?'var(--an-granate)':'var(--line-2)',
        borderColor: puedeAplicar?'var(--an-granate)':'var(--line-2)',
        letterSpacing:'0.02em',
        cursor: puedeAplicar?'pointer':'not-allowed',
        transition:'all .2s',
      }}>
        {cargandoApl ? 'Aplicando…' : puedeAplicar ? `APLICAR PAGO · ${fmtCRC_A(total)}` : 'Configure los rubros a aplicar'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────
function AplicarPago({ onNavigate }) {
  const [paso, setPaso]             = React.useState(1);
  const [estSel, setEstSel]         = React.useState(null);   // objeto estudiante del servidor
  const [estData, setEstData]       = React.useState(null);   // { niveles, pagos, pendientes, grupo }
  const [nivelSel, setNivelSel]     = React.useState(null);
  const [comprSel, setComprSel]     = React.useState(null);
  const [comprobantes, setComprobantes] = React.useState([]);
  const [error, setError]           = React.useState('');
  const [confirmado, setConfirmado] = React.useState(null);
  const [cargando, setCargando]     = React.useState(false);
  const [totalAplicarPanel, setTotalAplicarPanel] = React.useState(0);
  const [qMat,  setQMat]   = React.useState(0);
  const [qCuota,setQCuota] = React.useState(0);
  const [qCert, setQCert]  = React.useState(0);
  const [qTitulo, setQTitulo] = React.useState(0);
  const [qToeic, setQToeic] = React.useState(0);
  const [qOtro, setQOtro]  = React.useState(0);
  const [returnTarget, setReturnTarget] = React.useState(null);

  // FIX-NAVEGACION-APLICAR-PAGO-001: acceso rápido desde Estudiantes / Solicitudes.
  const [prefillError, setPrefillError] = React.useState('');
  const [prefillNota, setPrefillNota]   = React.useState(null); // { numero, monto }

  // Prefill desde admin_students (💳) o solicitudes_pago ("Aplicar pago")
  React.useEffect(() => {
    const raw = sessionStorage.getItem('an_pago_prefill');
    if (!raw) return;
    sessionStorage.removeItem('an_pago_prefill');

    let prefill;
    try { prefill = JSON.parse(raw); } catch (e) { return; }
    if (!prefill) return;

    // Si viene codigo, usar codigo; si no, caer a cedula como fallback.
    const codigo = String(prefill.codigo || '').trim();
    const cedula = String(prefill.cedula || '').trim();
    const idBusqueda = codigo || cedula;
    if (!idBusqueda) return;

    // PARTE 4 — nota discreta cuando la solicitud trae comprobante reportado.
    if (prefill.origen === 'solicitudes_pago' && prefill.numero_comprobante) {
      setPrefillNota({
        numero: prefill.numero_comprobante,
        monto:  prefill.monto_reportado || '',
      });
    }

    setCargando(true);
    setPrefillError('');
    // Siempre llamamos getEstudiante con codigo || cedula.
    postAP({ fn: 'getEstudiante', codigo: idBusqueda })
      .then(data => {
        if (!data.ok) {
          setPrefillError(apSafeUserError(data?.error || data?.mensaje, 'No se pudo cargar el estudiante desde el acceso rápido. Abrí la búsqueda e intentá de nuevo.', 'prefill_estudiante'));
          return;
        }
        setEstSel(data.estudiante);
        setEstData({
          niveles:    data.niveles    || {},
          pagos:      data.pagos      || [],
          otrosPagos: data.otrosPagos || [],
          grupo:      data.cod_grupo || String(data.grupo?.CODIGO_GRUPO || data.grupo || ''),
          grupo_tipo: data.grupo_tipo || '',
          pendientes: data.pendientes || {},
          otros_cargos: data.otros_cargos || [],
        });
        if (prefill.return_route) setReturnTarget({ route:prefill.return_route, context:prefill.return_context || {} });
        setError('');
        // forcePaso siempre 2: caemos en "Seleccionar nivel" con el estudiante
        // cargado. NO saltamos al paso 3 aunque el prefill traiga nivel.
        setPaso(2);
      })
      .catch(e => {
        setPrefillError(apSafeUserError(e?.message || String(e), 'No se pudo cargar el estudiante desde el acceso rápido. Abrí la búsqueda e intentá de nuevo.', 'prefill_estudiante'));
      })
      .finally(() => setCargando(false));
  }, []);

  const reiniciar = () => {
    setPaso(1); setEstSel(null); setEstData(null); setNivelSel(null);
    setComprSel(null); setComprobantes([]); setError(''); setConfirmado(null);
    setCargando(false); setTotalAplicarPanel(0);
    setQMat(0); setQCuota(0); setQCert(0); setQTitulo(0); setQToeic(0); setQOtro(0);
  };

  // T-fix-stepper: al volver del paso 4 al 3 los contadores deben quedar en 0
  // para que cuando se vuelva a entrar al paso 4 no aparezcan los valores viejos.
  const resetRubros = () => {
    setQMat(0); setQCuota(0); setQCert(0); setQTitulo(0); setQToeic(0); setQOtro(0); setTotalAplicarPanel(0);
  };

  const handlePrev = () => {
    setError('');
    if (paso === 2) { setPaso(1); setNivelSel(null); }
    else if (paso === 3) { setPaso(2); setComprSel(null); }
    else if (paso === 4) { setPaso(3); setConfirmado(null); resetRubros(); }
  };


  if (cargando && paso === 1) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300, flexDirection:'column', gap:16 }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width:40, height:40, border:'4px solid var(--line)', borderTopColor:'var(--an-granate)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <div style={{ fontSize:14, color:'var(--ink-3)' }}>Cargando estudiante…</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Conciliación"
        title={<>Aplicar <em>Pago</em></>}
        sub="Vincula comprobantes bancarios BCR con los rubros del estudiante"
      />

      <StepperA paso={paso} />

      {/* Acceso rápido — error de carga del estudiante (no fallar en silencio) */}
      {prefillError && (
        <div style={{ padding:'12px 16px', marginBottom:16, background:'color-mix(in srgb,#C00000 8%,white)', border:'1px solid #C00000', borderRadius:'var(--r-md)', color:'#C00000', fontSize:13, fontWeight:600, display:'flex', alignItems:'flex-start', gap:10 }}>
          <span style={{ fontSize:16, lineHeight:1 }}>⚠</span>
          <span style={{ flex:1 }}>{prefillError}</span>
          <button onClick={()=>setPrefillError('')} style={{ background:'none', border:'none', color:'#C00000', cursor:'pointer', fontSize:18, lineHeight:1 }}>×</button>
        </div>
      )}

      {/* Acceso rápido desde Solicitudes — nota discreta del comprobante reportado */}
      {prefillNota && paso > 1 && !confirmado && (
        <div style={{ padding:'10px 14px', marginBottom:16, background:'#FFF4D6', border:'1px solid #F2D584', borderRadius:'var(--r-md)', color:'#8A5A00', fontSize:12.5, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:14, lineHeight:1 }}>📎</span>
          <span style={{ flex:1 }}>
            Solicitud pendiente: comprobante <b style={{ fontFamily:'var(--f-mono)' }}>#{prefillNota.numero}</b>
            {prefillNota.monto ? <> por <b style={{ fontFamily:'var(--f-mono)' }}>{fmtCRC_A(Number(prefillNota.monto) || 0)}</b></> : null}.
          </span>
          <button onClick={()=>setPrefillNota(null)} style={{ background:'none', border:'none', color:'#8A5A00', cursor:'pointer', fontSize:16, lineHeight:1 }}>×</button>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns: paso>1?'1fr 280px':'1fr', gap:20, alignItems:'flex-start' }}>
        {/* Contenido principal */}
        <div className="card" style={{ padding:'24px 26px', minHeight:400 }}>
          {paso===1 && (
            <Paso1AP
              setEstSel={setEstSel}
              setEstData={setEstData}
              setError={setError}
              setPaso={setPaso}
            />
          )}
          {paso===2 && (
            <Paso2AP
              estData={estData}
              setEstData={setEstData}
              estSel={estSel}
              setNivelSel={setNivelSel}
              setError={setError}
              setPaso={setPaso}
              resetRubros={resetRubros}
            />
          )}
          {paso===3 && (
            <Paso3AP
              comprobantes={comprobantes}
              setComprobantes={setComprobantes}
              setComprSel={setComprSel}
              setPaso={setPaso}
              setError={setError}
            />
          )}
          {paso===4 && (
            <Paso4AP
              estSel={estSel}
              nivelSel={nivelSel}
              comprSel={comprSel}
              estData={estData}
              qMat={qMat}   setQMat={setQMat}
              qCuota={qCuota} setQCuota={setQCuota}
              qCert={qCert}  setQCert={setQCert}
              qTitulo={qTitulo} setQTitulo={setQTitulo}
              qToeic={qToeic} setQToeic={setQToeic}
              qOtro={qOtro} setQOtro={setQOtro}
              setTotalAplicarPanel={setTotalAplicarPanel}
              setComprobantes={setComprobantes}
              setConfirmado={setConfirmado}
              confirmado={confirmado}
              setPaso={setPaso}
              reiniciar={reiniciar}
              error={error}
              onNavigate={onNavigate}
              returnTarget={returnTarget}
            />
          )}

          {paso > 1 && !confirmado && (
            <button onClick={handlePrev} className="btn btn-ghost" style={{ marginTop:20, fontSize:12 }}>← Anterior</button>
          )}
        </div>

        {/* Panel lateral */}
        {paso > 1 && (
          <div style={{ position:'sticky', top:20 }}>
            <PanelResumen est={estSel} nivel={nivelSel} comprobante={comprSel} totalAplicar={totalAplicarPanel} />
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { AplicarPago });
