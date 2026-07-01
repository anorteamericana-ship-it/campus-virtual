// F98.4-Z6-AU · Diagnóstico limpio + corrección controlada 17115/17106
/* global React, PageHeader */
// CALGRUPO_F33_20260617_DIAGNOSTICO_INTERNO_FRONTEND
// CALGRUPO_F61_20260618_REPARADOR_ESTRUCTURAL_SEGURO_FRONTEND
// CALGRUPO_F60_20260618_DIAGNOSTICO_INTERNO_FRONTEND_LABELS
// CALGRUPO_F62_20260618_DIAGNOSTICO_OPERATIVO_NO_BLOQUEAR_CAMPUS_POR_ALERTAS_ACADEMICAS_UI

const SCRIPT_URL_DIAG = window.APPS_SCRIPT_URL;

async function postDiagnosticoInterno(fn, payload = {}) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const res = await fetch(`${SCRIPT_URL_DIAG}?fn=${encodeURIComponent(fn)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, token, ...payload }),
  });
  const raw = await res.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; }
  catch (_) {
    const sample = String(raw || '').replace(/\s+/g, ' ').slice(0, 180);
    throw new Error(`Apps Script respondió HTML/texto en ${fn} (HTTP ${res.status}). ${sample || 'Respuesta vacía.'}`);
  }
  if (!res.ok) throw new Error(data?.error || data?.mensaje || `Error HTTP ${res.status} en ${fn}.`);
  return data;
}

const DIAG_STATUS_STYLE = {
  ok:      { bg: 'rgba(22, 163, 74, .10)',  fg: '#166534', border: 'rgba(22,163,74,.25)',  label: 'OK' },
  warn:    { bg: 'rgba(202, 138, 4, .12)',  fg: '#854D0E', border: 'rgba(202,138,4,.25)',  label: 'Revisar' },
  error:   { bg: 'rgba(185, 28, 28, .10)',  fg: '#991B1B', border: 'rgba(185,28,28,.25)',  label: 'Crítico' },
  missing: { bg: 'rgba(185, 28, 28, .10)',  fg: '#991B1B', border: 'rgba(185,28,28,.25)',  label: 'Falta' },
  info:    { bg: 'rgba(30, 64, 175, .10)',  fg: '#1E3A8A', border: 'rgba(30,64,175,.22)',  label: 'Info' },
};

function diagStatusMeta(status) {
  const s = String(status || '').toLowerCase();
  return DIAG_STATUS_STYLE[s] || DIAG_STATUS_STYLE.info;
}

function DiagBadge({ status, children }) {
  const m = diagStatusMeta(status);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 9px', borderRadius: 999,
      background: m.bg, color: m.fg, border: `1px solid ${m.border}`,
      fontSize: 11, fontWeight: 800, letterSpacing: '.04em', whiteSpace: 'nowrap',
    }}>
      {children || m.label}
    </span>
  );
}

function DiagCard({ title, value, sub, status = 'info', onClick }) {
  const m = diagStatusMeta(status);
  return (
    <button type="button" onClick={onClick} style={{
      textAlign: 'left', padding: 16, borderRadius: 16,
      border: `1px solid ${m.border}`,
      background: `linear-gradient(135deg, ${m.bg}, rgba(255,255,255,.88))`,
      boxShadow: '0 8px 26px rgba(15,23,42,.05)',
      cursor: onClick ? 'pointer' : 'default', fontFamily: 'inherit',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', gap:10, alignItems:'center', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{title}</div>
        <DiagBadge status={status} />
      </div>
      <div style={{ fontSize: 26, lineHeight: 1.05, fontWeight: 800, color: 'var(--an-navy-ink)' }}>{value}</div>
      {sub && <div style={{ marginTop: 6, fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.45 }}>{sub}</div>}
    </button>
  );
}

function DiagSection({ title, sub, children }) {
  return (
    <section style={{
      background: 'var(--surface, #fff)', border: '1px solid var(--line, #e5e0d8)',
      borderRadius: 18, padding: 18, boxShadow: '0 10px 30px rgba(15,23,42,.04)',
    }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily:'var(--f-serif)', fontSize: 24, color:'var(--an-navy-ink)', lineHeight: 1.08 }}>{title}</div>
        {sub && <div style={{ fontSize: 12.5, color:'var(--ink-3)', marginTop: 4 }}>{sub}</div>}
      </div>
      {children}
    </section>
  );
}

const th = { textAlign:'left', padding:'10px 12px', fontWeight:900, fontSize:11, textTransform:'uppercase', letterSpacing:'.08em', whiteSpace:'nowrap' };
const td = { padding:'10px 12px', verticalAlign:'top', color:'var(--ink-2)' };

function DiagTable({ rows = [], type = 'sheets' }) {
  if (!rows.length) {
    return <div style={{ padding: 14, border: '1px dashed var(--line)', borderRadius: 12, color: 'var(--ink-3)', fontSize: 13 }}>Sin registros para mostrar.</div>;
  }
  if (type === 'advanced') {
    return (
      <div style={{ overflowX:'auto', border:'1px solid var(--line)', borderRadius:14 }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize: 12.5 }}>
          <thead>
            <tr style={{ background:'color-mix(in srgb, var(--an-navy) 5%, white)', color:'var(--ink-2)' }}>
              <th style={th}>Estado</th>
              <th style={th}>Categoría</th>
              <th style={th}>Control</th>
              <th style={th}>Total</th>
              <th style={th}>Detalle / acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} style={{ borderTop:'1px solid var(--line)' }}>
                <td style={td}><DiagBadge status={r.status}>{r.status_label}</DiagBadge></td>
                <td style={{ ...td, fontWeight: 800, color:'var(--an-navy-ink)' }}>{r.categoria || '—'}</td>
                <td style={{ ...td, fontWeight: 800 }}>{r.titulo || '—'}</td>
                <td style={td}>{r.total === '' || r.total == null ? '—' : r.total}</td>
                <td style={td}>
                  <div>{r.detalle || '—'}</div>
                  {r.accion && <div style={{ marginTop:4, fontSize:12, color:'var(--ink-3)' }}><b>Acción:</b> {r.accion}</div>}
                  {Array.isArray(r.muestra) && r.muestra.length > 0 && (
                    <details style={{ marginTop:7 }}>
                      <summary style={{ cursor:'pointer', fontWeight:800 }}>Ver muestra ({r.muestra.length})</summary>
                      <div style={{ marginTop:6, whiteSpace:'pre-wrap', fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize:11.5, color:'var(--ink-2)' }}>{r.muestra.join('\n')}</div>
                    </details>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div style={{ overflowX:'auto', border:'1px solid var(--line)', borderRadius:14 }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize: 12.5 }}>
        <thead>
          <tr style={{ background:'color-mix(in srgb, var(--an-navy) 5%, white)', color:'var(--ink-2)' }}>
            <th style={th}>Estado</th>
            <th style={th}>{type === 'endpoints' ? 'Endpoint / función' : 'Hoja'}</th>
            <th style={th}>Ubicación</th>
            <th style={th}>Detalle</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => {
            const faltan = Array.isArray(r.columnas_faltantes) ? r.columnas_faltantes : [];
            const detalle = type === 'endpoints'
              ? (r.existe ? `Función detectada${r.roles ? ' · ' + r.roles : ''}` : 'No se detectó la función')
              : (r.existe ? `${r.filas || 0} filas · ${r.columnas || 0} columnas${faltan.length ? ' · faltan: ' + faltan.join(', ') : ''}` : 'Hoja no encontrada');
            return (
              <tr key={idx} style={{ borderTop:'1px solid var(--line)' }}>
                <td style={td}><DiagBadge status={r.status}>{r.status_label}</DiagBadge></td>
                <td style={{ ...td, fontWeight: 800, color:'var(--an-navy-ink)' }}>{r.nombre || r.fn || '—'}</td>
                <td style={td}>{r.libro || r.modulo || '—'}</td>
                <td style={td}>{detalle}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DiagnosticoInternoView() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [tab, setTab] = React.useState('resumen');
  const [categoria, setCategoria] = React.useState('Todas');
  const [atStatus, setAtStatus] = React.useState(null);
  const [atStatusLoading, setAtStatusLoading] = React.useState(false);
  const [atRepairResult, setAtRepairResult] = React.useState(null);
  const [atRepairLoading, setAtRepairLoading] = React.useState(false);
  const sessionRole = React.useMemo(() => {
    try { return String((window.getSesion && window.getSesion() || {}).rol || '').toLowerCase(); }
    catch (_) { return ''; }
  }, []);
  const canUseAT = sessionRole === 'superadmin';

  const cargar = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await postDiagnosticoInterno('diagnosticoSistemaInterno', { detalle: true });
      if (!resp || resp.ok !== true) throw new Error(resp?.error || resp?.mensaje || 'No se pudo ejecutar diagnóstico.');
      setData(resp);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { cargar(); }, [cargar]);


  const cargarEstadoAT = async () => {
    if (!canUseAT) {
      setError('La corrección temporal AU está disponible únicamente para superadmin.');
      return null;
    }
    setAtStatusLoading(true);
    setError('');
    try {
      const resp = await postDiagnosticoInterno('estadoCorreccionTrasladosAT', {});
      if (!resp || resp.ok !== true) throw new Error(resp?.error || resp?.mensaje || 'No se pudo revisar la corrección AU.');
      setAtStatus(resp);
      return resp;
    } catch (e) {
      setError(e.message || String(e));
      return null;
    } finally {
      setAtStatusLoading(false);
    }
  };

  const ejecutarCorreccionAT = async () => {
    const estadoActual = atStatus || await cargarEstadoAT();
    if (!estadoActual) return;
    if (!estadoActual.puede_aplicar) {
      alert('Los expedientes ya aparecen limpios. No se realizará ninguna escritura.');
      return;
    }
    const texto = window.prompt(
      `Esta acción corregirá únicamente los registros 17115 y 17106. No sincronizará CONAPE automáticamente.

Escribí CORREGIR para continuar.`
    );
    if (String(texto || '').trim().toUpperCase() !== 'CORREGIR') return;
    setAtRepairLoading(true);
    setError('');
    setAtRepairResult(null);
    try {
      const resp = await postDiagnosticoInterno('aplicarCorreccionTrasladosAT', {
        confirmacion: 'AT_17115_17106',
        sincronizar_conape: false,
      });
      if (!resp || resp.ok !== true) throw new Error(resp?.error || resp?.mensaje || 'No se pudo aplicar la corrección AU.');
      setAtRepairResult(resp);
      await cargarEstadoAT();
      await cargar();
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setAtRepairLoading(false);
    }
  };

  const resumen = data?.resumen || {};
  const estado = resumen.estado_general || 'info';
  const hojas = data?.hojas || [];
  const endpoints = data?.endpoints || [];
  const avanzado = data?.avanzado || [];
  const recomendaciones = data?.recomendaciones || [];
  const criticos = Number(resumen.criticos || 0);
  const advertencias = Number(resumen.advertencias || 0);
  const ok = Number(resumen.ok || 0);
  const categorias = ['Todas', ...Array.from(new Set(avanzado.map(x => x.categoria).filter(Boolean)))];
  const avanzadoFiltrado = categoria === 'Todas' ? avanzado : avanzado.filter(x => x.categoria === categoria);

  const copiarResumen = async () => {
    if (!data) return;
    const lines = [];
    lines.push('DIAGNÓSTICO INTERNO AVANZADO · CAMPUS VIRTUAL');
    lines.push('Versión backend: ' + (data.version || '—'));
    lines.push('Estado general: ' + (resumen.estado_label || estado));
    lines.push('OK: ' + ok + ' · Revisar: ' + advertencias + ' · Crítico: ' + criticos);
    lines.push('Avanzado: OK ' + (resumen.avanzado_ok ? 'sí' : 'no') + ' · Warn ' + (resumen.avanzado_warn || 0) + ' · Error ' + (resumen.avanzado_error || 0));
    lines.push('Fecha: ' + (data.fecha || '—'));
    if (recomendaciones.length) {
      lines.push('');
      lines.push('RECOMENDACIONES:');
      recomendaciones.forEach((r, i) => lines.push((i + 1) + '. ' + (r.titulo ? r.titulo + ': ' : '') + (r.texto || r)));
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      alert('Resumen copiado.');
    } catch (_) {
      alert(lines.join('\n'));
    }
  };

  return (
    <div data-screen-label="Admin · Diagnóstico interno avanzado" style={{ padding: 22, maxWidth: 1360, margin: '0 auto' }}>
      <PageHeader
        kicker="Sistema · AU"
        title="Diagnóstico interno avanzado"
        sub="Verifica backend, hojas, columnas, endpoints y riesgos operativos. Las herramientas temporales quedan separadas y visibles para ejecutar correcciones controladas sin automatismos ocultos."
        right={
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'flex-end' }}>
            <button type="button" onClick={copiarResumen} disabled={!data} className="btn" style={{ padding:'9px 14px' }}>Copiar resumen</button>
            <button type="button" onClick={cargar} disabled={loading} className="btn btn-primary" style={{ padding:'9px 16px' }}>{loading ? 'Diagnosticando…' : 'Ejecutar diagnóstico'}</button>
          </div>
        }
      />

      {error && (
        <div style={{ padding: 14, marginBottom: 16, borderRadius: 14, background:'rgba(185,28,28,.10)', color:'#991B1B', border:'1px solid rgba(185,28,28,.25)', fontWeight:700 }}>
          {error}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(6, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
        <DiagCard title="Estado general" value={resumen.estado_label || (loading ? '...' : '—')} status={estado} sub={data?.version || 'Backend no consultado'} />
        <DiagCard title="OK" value={ok || '0'} status="ok" sub="Controles listos" onClick={() => setTab('resumen')} />
        <DiagCard title="Revisar" value={advertencias || '0'} status={advertencias ? 'warn' : 'ok'} sub="Advertencias no bloqueantes" onClick={() => setTab('avanzado')} />
        <DiagCard title="Críticos técnicos" value={criticos || '0'} status={criticos ? 'error' : 'ok'} sub="Bloquean producción general" onClick={() => setTab('recomendaciones')} />
        <DiagCard title="Certificados" value={resumen.certificados_bloqueados ? 'Bloqueados' : 'Listos'} status={resumen.certificados_bloqueados ? 'warn' : 'ok'} sub="Bloqueo por área, no campus completo" onClick={() => setTab('recomendaciones')} />
        <DiagCard title="Avanzado" value={resumen.avanzado_ok ? 'Listo' : 'Revisar'} status={resumen.avanzado_ok ? 'ok' : (resumen.avanzado_error ? 'error' : 'warn')} sub={`${avanzado.length || 0} controles · bloqueos académicos: ${resumen.bloqueos_academicos || 0}`} onClick={() => setTab('avanzado')} />
      </div>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom: 16 }}>
        {[
          ['resumen','Resumen'], ['herramientas','Herramientas temporales'], ['avanzado','Riesgos avanzados'], ['hojas','Hojas y columnas'], ['endpoints','Endpoints'], ['recomendaciones','Recomendaciones']
        ].map(([id,label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} style={{
            padding:'8px 12px', borderRadius:999, border:'1px solid var(--line)', cursor:'pointer',
            background: tab === id ? 'var(--an-navy)' : 'var(--surface)', color: tab === id ? 'white' : 'var(--ink-2)',
            fontWeight:800, fontSize:12, fontFamily:'inherit',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'resumen' && (
        <div style={{ display:'grid', gridTemplateColumns:'1.05fr .95fr', gap: 16 }}>
          <DiagSection title="Lectura ejecutiva" sub="Este bloque resume si el sistema está listo para operar módulos delicados.">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              <DiagCard title="Hojas revisadas" value={hojas.length} status="info" sub="Base maestra + operativo" onClick={() => setTab('hojas')} />
              <DiagCard title="Endpoints revisados" value={endpoints.length} status="info" sub="Funciones críticas F24–F60" onClick={() => setTab('endpoints')} />
              <DiagCard title="Base maestra" value={resumen.master_ok ? 'Lista' : 'Revisar'} status={resumen.master_ok ? 'ok' : 'warn'} sub="DATOS, ESTATUS, GRUPOS, USUARIOS" />
              <DiagCard title="Operativo" value={resumen.operativo_ok ? 'Lista' : 'Revisar'} status={resumen.operativo_ok ? 'ok' : 'warn'} sub="Calendario, exámenes, logs y seguimiento" />
            </div>
          </DiagSection>

          <DiagSection title="Acciones inmediatas" sub="Orden sugerido si aparece alguna alerta.">
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {(recomendaciones.length ? recomendaciones.slice(0, 7) : [{status:'ok', texto:'No hay acciones críticas. El sistema respondió correctamente.'}]).map((r, i) => (
                <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:12, borderRadius:12, border:'1px solid var(--line)', background:'color-mix(in srgb, var(--an-gold) 4%, white)' }}>
                  <DiagBadge status={r.status || 'info'} />
                  <div style={{ fontSize:13, color:'var(--ink-2)', lineHeight:1.45 }}>{r.titulo ? <b>{r.titulo}: </b> : null}{r.texto || r}</div>
                </div>
              ))}
            </div>
          </DiagSection>
        </div>
      )}


      {tab === 'herramientas' && (
        <DiagSection title="Herramientas temporales controladas" sub="Estas acciones se usan durante la estabilización y se retirarán antes de la entrega final. No hay ejecución automática al iniciar sesión.">
          <div style={{ padding:16, border:'1px solid var(--line)', borderRadius:16, background:'color-mix(in srgb, var(--an-gold) 5%, white)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', gap:12, alignItems:'flex-start', flexWrap:'wrap' }}>
              <div>
                <div style={{ fontWeight:900, color:'var(--an-navy-ink)', fontSize:16 }}>Corrección controlada · 17115 y 17106</div>
                <div style={{ marginTop:5, fontSize:13, color:'var(--ink-3)', lineHeight:1.5, maxWidth:820 }}>
                  Elimina el RJ duplicado nocturno de 17115 y revierte localmente el cambio de B2 de 17106 para repetirlo desde el motor oficial. B1 APR de 17106 nunca se modifica. CONAPE queda pendiente de sincronización manual después de verificar los expedientes.
                </div>
              </div>
              <DiagBadge status={atStatus?.estado === 'PENDIENTE' || atStatus?.estado === 'INCONSISTENTE' ? 'warn' : (atStatus ? 'ok' : 'info')}>
                {atStatus?.estado || 'Sin revisar'}
              </DiagBadge>
            </div>

            {!canUseAT && <div style={{ marginTop:12, color:'#991B1B', fontWeight:800, fontSize:12.5 }}>Solo superadmin puede revisar o ejecutar esta corrección.</div>}
            <div style={{ display:'flex', gap:9, flexWrap:'wrap', marginTop:14 }}>
              <button type="button" onClick={cargarEstadoAT} disabled={!canUseAT || atStatusLoading || atRepairLoading} className="btn" style={{ padding:'9px 14px' }}>
                {atStatusLoading ? 'Revisando…' : 'Revisar estado'}
              </button>
              <button type="button" onClick={ejecutarCorreccionAT} disabled={!canUseAT || atRepairLoading || atStatusLoading || (atStatus && !atStatus.puede_aplicar)} className="btn btn-primary" style={{ padding:'9px 14px' }}>
                {atRepairLoading ? 'Corrigiendo…' : 'Aplicar corrección 17115 / 17106'}
              </button>
            </div>

            {atStatus && (
              <div style={{ marginTop:15, display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:12 }}>
                <div style={{ padding:13, border:'1px solid var(--line)', borderRadius:13, background:'var(--surface)' }}>
                  <div style={{ fontWeight:900, color:'var(--an-navy-ink)' }}>17115 · William Zúñiga</div>
                  <div style={{ marginTop:7, fontSize:12.5, color:'var(--ink-2)', lineHeight:1.55 }}>
                    RJ original sábados: <b>{atStatus.codigo_17115?.original_rj_sabados ?? 0}</b><br/>
                    RJ duplicado nocturno: <b>{atStatus.codigo_17115?.duplicado_rj_nocturno ?? 0}</b>
                  </div>
                </div>
                <div style={{ padding:13, border:'1px solid var(--line)', borderRadius:13, background:'var(--surface)' }}>
                  <div style={{ fontWeight:900, color:'var(--an-navy-ink)' }}>17106 · Chadday Elizondo</div>
                  <div style={{ marginTop:7, fontSize:12.5, color:'var(--ink-2)', lineHeight:1.55 }}>
                    DATOS.GRUPO: <b>{atStatus.codigo_17106?.datos_grupo || '—'}</b><br/>
                    Filas B2–I2 fuera del origen: <b>{atStatus.codigo_17106?.filas_fuera_origen ?? 0}</b><br/>
                    Plan / convalidación / avisos: <b>{atStatus.codigo_17106?.plan_cambio ?? 0}</b> / <b>{atStatus.codigo_17106?.convalidaciones ?? 0}</b> / <b>{atStatus.codigo_17106?.notificaciones ?? 0}</b><br/>
                    Cambio reversado: <b>{atStatus.codigo_17106?.cambio_reversado ? 'Sí' : 'No'}</b>
                  </div>
                </div>
              </div>
            )}

            {atRepairResult && (
              <div style={{ marginTop:14, padding:13, borderRadius:13, border:'1px solid rgba(22,163,74,.28)', background:'rgba(22,163,74,.08)', color:'#166534', fontSize:13, lineHeight:1.5 }}>
                <b>{atRepairResult.mensaje || 'Corrección ejecutada.'}</b>
                <div style={{ marginTop:5 }}>Ahora revisá 17115 y 17106 en Consulta individual y Calendario académico. Después ejecutá Sync CONAPE manualmente para ambos.</div>
              </div>
            )}
          </div>

          <div style={{ marginTop:12, padding:12, border:'1px dashed var(--line)', borderRadius:12, color:'var(--ink-3)', fontSize:12.5, lineHeight:1.5 }}>
            Los botones históricos <b>Crear logs F61</b> y <b>Revisión F62</b> fueron retirados de la interfaz porque esas estructuras ya existen. Las funciones backend se conservan temporalmente para compatibilidad y se evaluarán en la limpieza final.
          </div>
        </DiagSection>
      )}

      {tab === 'avanzado' && (
        <DiagSection title="Riesgos avanzados" sub="Revisa inconsistencias operativas que no siempre se detectan con solo ver si la hoja existe.">
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom: 12 }}>
            {categorias.map(cat => (
              <button key={cat} type="button" onClick={() => setCategoria(cat)} style={{
                padding:'7px 11px', borderRadius:999, border:'1px solid var(--line)', cursor:'pointer',
                background: categoria === cat ? 'var(--an-gold)' : 'var(--surface)', color:'var(--an-navy-ink)',
                fontWeight:800, fontSize:12, fontFamily:'inherit',
              }}>{cat}</button>
            ))}
          </div>
          <DiagTable rows={avanzadoFiltrado} type="advanced" />
        </DiagSection>
      )}

      {tab === 'hojas' && (
        <DiagSection title="Hojas y columnas críticas" sub="No modifica hojas. Solo revisa existencia, encabezados y tamaño básico.">
          <DiagTable rows={hojas} type="sheets" />
        </DiagSection>
      )}

      {tab === 'endpoints' && (
        <DiagSection title="Endpoints principales" sub="Verifica que las funciones críticas existan en el Apps Script instalado.">
          <DiagTable rows={endpoints} type="endpoints" />
        </DiagSection>
      )}

      {tab === 'recomendaciones' && (
        <DiagSection title="Recomendaciones técnicas" sub="Lista priorizada para evitar operar con datos incompletos.">
          <div style={{ display:'grid', gap:10 }}>
            {(recomendaciones.length ? recomendaciones : [{ status:'ok', texto:'Sin recomendaciones críticas por ahora.' }]).map((r, i) => (
              <div key={i} style={{ padding: 13, borderRadius: 13, border:'1px solid var(--line)', background:'var(--surface)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <DiagBadge status={r.status || 'info'} />
                  <div style={{ fontWeight:800, color:'var(--an-navy-ink)' }}>{r.titulo || `Recomendación ${i + 1}`}</div>
                </div>
                <div style={{ marginTop:7, color:'var(--ink-3)', fontSize:13, lineHeight:1.45 }}>{r.texto || r}</div>
              </div>
            ))}
          </div>
        </DiagSection>
      )}
    </div>
  );
}

// F96.2-LAZY-A export explícito para carga diferida
Object.assign(window, { DiagnosticoInternoView });
