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
  return await res.json();
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
  const [repairResult, setRepairResult] = React.useState(null);
  const [repairLoading, setRepairLoading] = React.useState(false);
  const [reviewF61, setReviewF61] = React.useState(null);
  const [reviewLoading, setReviewLoading] = React.useState(false);

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


  const ejecutarReparacionF61 = async () => {
    if (!confirm('F61 solo creará/normalizará hojas de bitácora faltantes. No tocará notas, certificados ni activaciones. ¿Continuar?')) return;
    setRepairLoading(true);
    setError('');
    try {
      const resp = await postDiagnosticoInterno('repararEstructuraOperativaF61', {});
      if (!resp || resp.ok !== true) throw new Error(resp?.error || resp?.mensaje || 'No se pudo ejecutar reparación F61.');
      setRepairResult(resp);
      await cargar();
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setRepairLoading(false);
    }
  };

  const cargarRevisionF61 = async () => {
    setReviewLoading(true);
    setError('');
    try {
      const resp = await postDiagnosticoInterno('revisionAcademicaAsistidaF62', {});
      if (!resp || resp.ok !== true) throw new Error(resp?.error || resp?.mensaje || 'No se pudo cargar revisión F61.');
      setReviewF61(resp);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setReviewLoading(false);
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
        kicker="Sistema · F62"
        title="Diagnóstico interno avanzado"
        sub="Verifica backend, hojas, columnas, endpoints y riesgos operativos. F62 separa bloqueos técnicos de bloqueos académicos por área: certificados, cronograma, exámenes, notas, cierre académico y seguimiento."
        right={
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'flex-end' }}>
            <button type="button" onClick={ejecutarReparacionF61} disabled={repairLoading} className="btn" style={{ padding:'9px 14px' }}>{repairLoading ? 'Reparando…' : 'Crear logs F61'}</button>
            <button type="button" onClick={() => { setTab('f61'); cargarRevisionF61(); }} disabled={reviewLoading} className="btn" style={{ padding:'9px 14px' }}>{reviewLoading ? 'Cargando…' : 'Revisión F62'}</button>
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
        <DiagCard title="Certificados" value={resumen.certificados_bloqueados ? 'Bloqueados' : 'Listos'} status={resumen.certificados_bloqueados ? 'warn' : 'ok'} sub="Bloqueo por área, no campus completo" onClick={() => setTab('f61')} />
        <DiagCard title="Avanzado" value={resumen.avanzado_ok ? 'Listo' : 'Revisar'} status={resumen.avanzado_ok ? 'ok' : (resumen.avanzado_error ? 'error' : 'warn')} sub={`${avanzado.length || 0} controles · bloqueos académicos: ${resumen.bloqueos_academicos || 0}`} onClick={() => setTab('avanzado')} />
      </div>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom: 16 }}>
        {[
          ['resumen','Resumen'], ['f61','F61/F62 limpieza segura'], ['avanzado','Riesgos avanzados'], ['hojas','Hojas y columnas'], ['endpoints','Endpoints'], ['recomendaciones','Recomendaciones']
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


      {tab === 'f61' && (
        <DiagSection title="F61/F62 · reparación segura y revisión asistida" sub="Crea únicamente hojas/logs faltantes. F62 separa bloqueos técnicos de bloqueos académicos por área, sin arreglos automáticos peligrosos.">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div style={{ padding:14, border:'1px solid var(--line)', borderRadius:14, background:'color-mix(in srgb, var(--an-gold) 5%, white)' }}>
              <div style={{ fontWeight:900, color:'var(--an-navy-ink)', marginBottom:6 }}>Reparación estructural segura</div>
              <div style={{ fontSize:13, color:'var(--ink-3)', lineHeight:1.45, marginBottom:12 }}>
                Crea SEGUIMIENTO_ESTUDIANTES, NOTAS_OFICIALES_LOG y CIERRE_ACADEMICO_LOG si faltan. No toca datos académicos existentes.
              </div>
              <button type="button" onClick={ejecutarReparacionF61} disabled={repairLoading} className="btn btn-primary" style={{ padding:'9px 14px' }}>
                {repairLoading ? 'Ejecutando…' : 'Ejecutar reparación F61'}
              </button>
              {repairResult && (
                <div style={{ marginTop:12, fontSize:12.5, color:'var(--ink-2)', lineHeight:1.45 }}>
                  <b>Resultado:</b> {repairResult.ok ? 'OK' : 'Con errores'} · {repairResult.fecha}
                  <ul style={{ margin:'8px 0 0 18px' }}>
                    {(repairResult.acciones || []).map((a, i) => (
                      <li key={i}>{a.hoja}: {a.creada ? 'creada' : 'existente'}{a.encabezados_agregados?.length ? ' · encabezados agregados: ' + a.encabezados_agregados.length : ''}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div style={{ padding:14, border:'1px solid var(--line)', borderRadius:14, background:'var(--surface)' }}>
              <div style={{ fontWeight:900, color:'var(--an-navy-ink)', marginBottom:6 }}>Revisión académica asistida</div>
              <div style={{ fontSize:13, color:'var(--ink-3)', lineHeight:1.45, marginBottom:12 }}>
                Agrupa certificados duplicados, APR/CNV sin registro, cronogramas sin CA y exámenes sin activación. Solo lectura; certificados duplicados bloquean certificados, no todo el campus.
              </div>
              <button type="button" onClick={cargarRevisionF61} disabled={reviewLoading} className="btn" style={{ padding:'9px 14px' }}>
                {reviewLoading ? 'Cargando…' : 'Cargar revisión académica'}
              </button>
              {reviewF61 && <div style={{ marginTop:12 }}><DiagBadge status={(reviewF61.decision || '').includes('CRITICOS') ? 'error' : (reviewF61.pendientes_total ? 'warn' : 'ok')}>{reviewF61.decision}</DiagBadge> <span style={{ fontSize:13, color:'var(--ink-3)' }}>{reviewF61.pendientes_total || 0} pendientes</span>{reviewF61.nota_f62 && <div style={{ marginTop:6, fontSize:12, color:'var(--ink-3)' }}>{reviewF61.nota_f62}</div>}</div>}
            </div>
          </div>
          {reviewF61 && (
            <div style={{ display:'grid', gap:12 }}>
              {(reviewF61.grupos || []).map((g, idx) => (
                <div key={idx} style={{ border:'1px solid var(--line)', borderRadius:14, overflow:'hidden' }}>
                  <div style={{ padding:'12px 14px', background:'color-mix(in srgb, var(--an-navy) 5%, white)', display:'flex', justifyContent:'space-between', gap:10 }}>
                    <b style={{ color:'var(--an-navy-ink)' }}>{g.categoria}</b>
                    <span style={{ fontSize:12, color:'var(--ink-3)' }}>{g.total} pendientes · {g.criticos} críticos · {g.advertencias} revisar</span>
                  </div>
                  <div style={{ padding:12, display:'grid', gap:10 }}>
                    {(g.items || []).map((it, i) => (
                      <div key={i} style={{ padding:12, border:'1px solid var(--line)', borderRadius:12, background:'var(--surface)' }}>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}><DiagBadge status={it.status}>{it.status_label}</DiagBadge><b>{it.titulo}</b><span style={{ marginLeft:'auto', fontSize:12, color:'var(--ink-3)' }}>{it.total || 0}</span></div>
                        <div style={{ marginTop:6, fontSize:13, color:'var(--ink-3)', lineHeight:1.45 }}>{it.detalle}</div>
                        {it.accion && <div style={{ marginTop:6, fontSize:12.5 }}><b>Acción:</b> {it.accion}</div>}
                        {Array.isArray(it.muestra) && it.muestra.length > 0 && (
                          <details style={{ marginTop:8 }}><summary style={{ cursor:'pointer', fontWeight:800 }}>Ver muestra</summary><pre style={{ whiteSpace:'pre-wrap', fontSize:11.5 }}>{it.muestra.join('\n')}</pre></details>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
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
