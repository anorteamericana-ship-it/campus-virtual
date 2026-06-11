/* global React, PageHeader */

// ─────────────────────────────────────────────────────────────────────────
// APLICAR PAGO — conectado a Apps Script / APOLLO_G3
// ─────────────────────────────────────────────────────────────────────────

// URL del Apps Script: fuente única en data.jsx → window.APPS_SCRIPT_URL
const SCRIPT_URL_AP = window.APPS_SCRIPT_URL;

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
function RubroRow({ label, monto, qty, maxQty, onQty }) {
  const subtotal = qty * monto;
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
      const res = await fetch(`${SCRIPT_URL_AP}?fn=getEstudiante&codigo=${encodeURIComponent(codigo)}&token=${encodeURIComponent(window.getSessionToken ? window.getSessionToken() : '')}`);
      const data = await res.json();
      if (!data.ok) { setErrLocal(data.error || 'Estudiante no encontrado'); return; }
      setEstSel(data.estudiante);
      setEstData({
        niveles:    data.niveles    || {},
        pagos:      data.pagos      || [],
        otrosPagos: data.otrosPagos || [],
        grupo:      data.cod_grupo || String(data.grupo?.CODIGO_GRUPO || data.grupo || ''),
        grupo_tipo: data.grupo_tipo || '',
        pendientes: data.pendientes || {},
      });
      setError('');
      setPaso(2);
    } catch(e) {
      setErrLocal('Error de conexión: ' + e.message);
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

// ─────────────────────────────────────────────────────────────────────────
// PASO 2 — Seleccionar nivel (componente independiente)
// ─────────────────────────────────────────────────────────────────────────
function Paso2AP({ estData, estSel, setNivelSel, setError, setPaso, resetRubros }) {
  const niveles    = estData?.niveles  || {};
  const pendientes = estData?.pendientes || {};
  const grupo      = estData?.grupo    || '';

  // Desbloqueo: B1 siempre; siguiente requiere APR/CNV del anterior
  const desbloq = {};
  NIVEL_ORDER_A.forEach((niv, i) => {
    if (i === 0) { desbloq[niv] = true; return; }
    const prev = NIVEL_ORDER_A[i-1];
    desbloq[niv] = STATUS_APROBADO.includes(niveles[prev]?.estatus);
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
      <div style={{ fontSize:13, color:'var(--ink-3)', marginBottom:18 }}>Solo los niveles desbloqueados pueden recibir pagos.</div>

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
        {NIVEL_ORDER_A.filter(niv => niv in niveles || NIVEL_ORDER_A.indexOf(niv) === 0).map(niv => {
          const c   = NIVEL_COLOR_A[niv];
          const h   = niveles[niv];
          const ok  = desbloq[niv];
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
                  <div style={{ fontSize:11, color:'var(--ink-3)', marginBottom:4 }}>{grupo || 'Sin grupo asignado'}</div>
                  <div style={{ fontSize:12, color:'var(--ink-2)' }}>
                    {cuota > 0
                      ? <>Cuota: <strong style={{ color:c }}>{fmtCRC_A(cuota)}</strong></>
                      : <span style={{ color:'#2E7D32', fontWeight:600 }}>✓ Sin cuotas pendientes</span>}
                  </div>
                  {matricula > 0 && <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>Matrícula: {fmtCRC_A(matricula)}</div>}
                </>
              ) : (
                <div style={{ fontSize:12, color:'var(--ink-3)', fontStyle:'italic' }}>
                  🔒 Debe promover el nivel anterior primero
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
    fetch(`${SCRIPT_URL_AP}?fn=getComprobantes&token=${encodeURIComponent(window.getSessionToken ? window.getSessionToken() : '')}`)
      .then(r => r.json())
      .then(data => {
        if (!data.ok) { setErrLocal(data.error || 'Error al cargar comprobantes'); return; }
        setComprobantes(data.comprobantes || []);
      })
      .catch(e => setErrLocal('Error de conexión: ' + e.message))
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
  qMat, setQMat, qCuota, setQCuota, qCert, setQCert,
  setTotalAplicarPanel, setComprobantes, setConfirmado,
  confirmado, setPaso, reiniciar, error
}) {
  const est    = estSel;
  const niv    = nivelSel;
  const compr  = comprSel;
  const pend   = estData?.pendientes || {};
  const saldo  = compr ? (compr.saldo ?? (compr.credito - compr.aplicado)) : 0;

  const montoMat   = pend.matricula     || 0;
  const montoCuota = pend.cuota_mensual || 0;
  const montoCert  = pend.certificado   || 0;

  // tipo_periodo 'B' (bimestral) = 2 cuotas; 'C' (cuatrimestral) o default = 4
  const nCuotas = estData?.grupo_tipo === 'B' ? 2 : 4;

  const [cargandoApl, setCargandoApl] = React.useState(false);
  const [errLocal, setErrLocal] = React.useState('');

  const total       = qMat*montoMat + qCuota*montoCuota + qCert*montoCert;
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
      const grupoActual = estData?.grupo || '';
      const rubros = [
        { tipo:'MATRICULA',   nivel:niv, monto:qMat*montoMat,     grupo: grupoActual },
        { tipo:'CUOTA',       nivel:niv, monto:qCuota*montoCuota, grupo: grupoActual },
        { tipo:'CERTIFICADO', nivel:niv, monto:qCert*montoCert,   grupo: grupoActual },
      ].filter(r => r.monto > 0);

      const body = {
        token:         window.getSessionToken ? window.getSessionToken() : '',
        doc:           compr.doc,
        monto_total:   total,
        cod_estudiante: est?.CODIGO || est?.rec_m,
        rubros,
      };

      const res = await fetch(`${SCRIPT_URL_AP}?fn=aplicarPago`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) { setErrLocal(data.error || 'Error al aplicar el pago'); return; }
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
      setErrLocal('Error de conexión: ' + e.message);
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
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <button onClick={reiniciar} className="btn btn-ghost" style={{ padding:14 }}>Nuevo pago</button>
          <button onClick={()=>{ setConfirmado(null); setTotalAplicarPanel(0); setPaso(3); }} className="btn btn-primary" style={{ background:'var(--an-granate)', borderColor:'var(--an-granate)', padding:14 }}>
            Otro comprobante
          </button>
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
        {montoCuota > 0 && <RubroRow label={`Cuota mensual (máx. ${nCuotas})`} monto={montoCuota} qty={qCuota} maxQty={nCuotas} onQty={setQCuota} />}
        {montoCert  > 0 && <RubroRow label="Certificado del nivel"            monto={montoCert}  qty={qCert}  maxQty={1}       onQty={setQCert}  />}
        {montoMat === 0 && montoCuota === 0 && montoCert === 0 && (
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
function AplicarPago() {
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

  // Prefill desde admin_students (botón 💳)
  React.useEffect(() => {
    const raw = sessionStorage.getItem('an_pago_prefill');
    if (!raw) return;
    sessionStorage.removeItem('an_pago_prefill');
    try {
      const { codigo, nivel } = JSON.parse(raw);
      if (!codigo) return;
      setCargando(true);
      fetch(`${SCRIPT_URL_AP}?fn=getEstudiante&codigo=${encodeURIComponent(codigo)}&token=${encodeURIComponent(window.getSessionToken ? window.getSessionToken() : '')}`)
        .then(r => r.json())
        .then(data => {
          if (!data.ok) return;
          setEstSel(data.estudiante);
          setEstData({
            niveles:    data.niveles    || {},
            pagos:      data.pagos      || [],
            otrosPagos: data.otrosPagos || [],
            grupo:      data.grupo      || '',
            pendientes: data.pendientes || {},
          });
          if (nivel) setNivelSel(nivel);
          setPaso(nivel ? 3 : 2); // si viene nivel saltar directo al comprobante
        })
        .catch(() => {})
        .finally(() => setCargando(false));
    } catch(e) {}
  }, []);

  const reiniciar = () => {
    setPaso(1); setEstSel(null); setEstData(null); setNivelSel(null);
    setComprSel(null); setComprobantes([]); setError(''); setConfirmado(null);
    setCargando(false); setTotalAplicarPanel(0);
    setQMat(0); setQCuota(0); setQCert(0);
  };

  // T-fix-stepper: al volver del paso 4 al 3 los contadores deben quedar en 0
  // para que cuando se vuelva a entrar al paso 4 no aparezcan los valores viejos.
  const resetRubros = () => {
    setQMat(0); setQCuota(0); setQCert(0); setTotalAplicarPanel(0);
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
              setTotalAplicarPanel={setTotalAplicarPanel}
              setComprobantes={setComprobantes}
              setConfirmado={setConfirmado}
              confirmado={confirmado}
              setPaso={setPaso}
              reiniciar={reiniciar}
              error={error}
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
