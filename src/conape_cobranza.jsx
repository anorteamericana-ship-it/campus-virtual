/* global React, PageHeader */
// CALGRUPO_F36_20260617_CONAPE_COBRANZA_PANEL_OPERATIVO

const SCRIPT_URL_CC = window.APPS_SCRIPT_URL;

async function postConapeCobranza(fn, payload = {}) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const r = await fetch(`${SCRIPT_URL_CC}?fn=${encodeURIComponent(fn)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, token, ...payload }),
  });
  return await r.json();
}

function ccSafeUserError(raw, fallback, context = '') {
  const msg=String(raw==null?'':raw).trim();
  if(!msg)return fallback;
  const technicalCode=/^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);
  const technicalText=/apps?\s*script|script\.google|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|aborterror|failed to fetch|network request failed|<html|\bjson\b|\btoken\b|unauthorized|forbidden|internal server|http\s*\d{3}|status\s*\d{3}|respuesta inv[aá]lida|request[_ -]?id|file_id|base64|sha-?256|\bmime\b|driveapp|spreadsheet|\bsheet\b|\btabla\b|\bhoja\b|getPanelConapeCobranza|sincronizarCONAPE/i.test(msg);
  if(technicalCode||technicalText){console.warn('[ConapeCobranza] Detalle técnico oculto al operador.',{context,error:msg});return fallback;}
  return msg;
}

function ccText(v, fallback = '—') {
  const s = String(v ?? '').trim();
  return s || fallback;
}
function ccUpper(v) { return String(v || '').trim().toUpperCase(); }
function ccNum(v) { const n = Number(v || 0); return Number.isFinite(n) ? n : 0; }
function ccStatusLabel(value, fallback = '—') {
  const raw=String(value==null?'':value).trim();
  if(!raw)return fallback;
  const key=raw.toUpperCase();
  const known={
    CON_DESEMBOLSO:'Con desembolso',
    APROBADO_SIN_DESEMBOLSO:'Aprobado · pendiente de desembolso',
    CONAPE_SOLICITUD:'Solicitud CONAPE',
    CONAPE_DOCUMENTOS:'Documentos CONAPE',
    SIN_NOVEDAD:'Sin novedad',
  };
  if(known[key])return known[key];
  if(raw.includes('_'))return raw.toLowerCase().split('_').filter(Boolean).map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ');
  return raw;
}
function ccBadgeMeta(status) {
  const s = ccUpper(status);
  if (['ALTA','CRITICO','CRÍTICO','DESEMBOLSO','MORA','URGENTE'].includes(s)) return { bg:'rgba(185,28,28,.10)', fg:'#991B1B', bd:'rgba(185,28,28,.24)', label: status || 'Alta' };
  if (['MEDIA','APROBADO','REVISION','REVISIÓN','DOCUMENTOS'].includes(s)) return { bg:'rgba(202,138,4,.13)', fg:'#854D0E', bd:'rgba(202,138,4,.26)', label: status || 'Media' };
  if (['BAJA','OK','ACTIVO','SINCRONIZADO'].includes(s)) return { bg:'rgba(22,163,74,.10)', fg:'#166534', bd:'rgba(22,163,74,.24)', label: status || 'OK' };
  return { bg:'rgba(30,64,175,.09)', fg:'#1E3A8A', bd:'rgba(30,64,175,.20)', label: status || 'Info' };
}
function CCBadge({ status, children }) {
  const m = ccBadgeMeta(status);
  return <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 9px', borderRadius:999, background:m.bg, color:m.fg, border:`1px solid ${m.bd}`, fontSize:11, fontWeight:900, whiteSpace:'nowrap' }}>{children || m.label}</span>;
}
function CCCard({ title, value, sub, status, onClick }) {
  const m = ccBadgeMeta(status);
  return (
    <button type="button" onClick={onClick} style={{
      textAlign:'left', padding:16, borderRadius:18, border:`1px solid ${m.bd}`,
      background:`linear-gradient(135deg, ${m.bg}, rgba(255,255,255,.94))`,
      boxShadow:'0 12px 30px rgba(15,23,42,.055)', fontFamily:'inherit',
      cursor:onClick ? 'pointer' : 'default', minHeight:112,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, marginBottom:10 }}>
        <div style={{ fontSize:11, color:'var(--ink-3)', fontWeight:900, letterSpacing:'.13em', textTransform:'uppercase' }}>{title}</div>
        <CCBadge status={status} />
      </div>
      <div style={{ fontSize:30, fontWeight:900, color:'var(--an-navy-ink)', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ marginTop:7, fontSize:12.5, lineHeight:1.4, color:'var(--ink-3)' }}>{sub}</div>}
    </button>
  );
}
function CCToolButton({ children, onClick, primary, disabled }) {
  return <button type="button" onClick={onClick} disabled={disabled} style={{
    border:'1px solid ' + (primary ? 'rgba(122,30,44,.35)' : 'var(--line, #E5E0D8)'),
    background: primary ? 'var(--an-granate, #7A1E2C)' : 'white',
    color: primary ? 'white' : 'var(--ink-2)',
    padding:'8px 12px', borderRadius:11, fontSize:12.5, fontWeight:850,
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .55 : 1, fontFamily:'inherit',
  }}>{children}</button>;
}
function ccPhoneLink(tel, text) {
  const n = String(tel || '').replace(/\D/g, '');
  if (!n) return null;
  const cr = n.length === 8 ? '506' + n : n;
  return 'https://wa.me/' + cr + '?text=' + encodeURIComponent(text || 'Hola, le saludamos de Academia Norteamericana.');
}
function ccDownloadCsv(filename, rows) {
  const csv = rows.map(row => row.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type:'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 600);
}
function ccCopy(text, setMsg) {
  const done = () => setMsg && setMsg('Copiado al portapapeles.');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => {});
  } else {
    const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); done();
  }
}

function ConapeCobranzaView({ onNavigate }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);
  const [error, setError] = React.useState('');
  const [msg, setMsg] = React.useState('');
  const [filtro, setFiltro] = React.useState('prioridad');
  const [q, setQ] = React.useState('');

  const cargar = React.useCallback(() => {
    setLoading(true); setError(''); setMsg('');
    postConapeCobranza('getPanelConapeCobranza', { detalle: true })
      .then(r => {
        if (!r || r.ok === false) throw new Error(r?.error || 'No se pudo cargar CONAPE/Cobranza');
        setData(r);
      })
      .catch(e => setError(ccSafeUserError(e?.message || String(e), 'No se pudo cargar CONAPE y Cobranza. Intentá de nuevo.', 'cargar_panel')))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { cargar(); }, [cargar]);

  const k = data?.kpis || {};
  const prospectos = data?.prospectos || [];
  const estudiantes = data?.estudiantes || [];
  const grupos = data?.grupos || [];
  const asesores = data?.asesores || [];

  const textoBusqueda = ccUpper(q);
  const prospectosFiltrados = React.useMemo(() => {
    return prospectos.filter(p => {
      const hay = [p.nombre, p.cedula, p.telefono, p.asesor, p.grupo, p.etapa, p.ws_novedad, p.accion_sugerida].map(ccUpper).join(' | ');
      if (textoBusqueda && !hay.includes(textoBusqueda)) return false;
      if (filtro === 'todos') return true;
      if (filtro === 'prioridad') return ccUpper(p.prioridad) === 'ALTA';
      if (filtro === 'desembolso') return ccUpper(p.ws_novedad) === 'CON_DESEMBOLSO' || ccUpper(p.etapa).includes('DESEMBOLSO');
      if (filtro === 'aprobado') return ccUpper(p.ws_novedad) === 'APROBADO_SIN_DESEMBOLSO' || ccUpper(p.etapa).includes('APROBADO');
      if (filtro === 'documentos') return ['CONAPE_SOLICITUD','CONAPE_DOCUMENTOS'].includes(ccUpper(p.etapa));
      if (filtro === 'activos') return ccUpper(p.estado_cuenta) === 'ACTIVO' || ccUpper(p.etapa) === 'ACTIVO';
      return true;
    });
  }, [prospectos, filtro, textoBusqueda]);

  const estudiantesFiltrados = React.useMemo(() => {
    return estudiantes.filter(e => {
      const hay = [e.codigo, e.nombre, e.cedula, e.telefono, e.grupo, e.nivel, e.estatus].map(ccUpper).join(' | ');
      if (textoBusqueda && !hay.includes(textoBusqueda)) return false;
      if (filtro === 'mora') return e.grupo_mora > 0 || ccUpper(e.mora) === 'SI';
      if (filtro === 'activos') return true;
      return filtro === 'todos' || filtro === 'prioridad' || filtro === 'desembolso' || filtro === 'aprobado' || filtro === 'documentos';
    });
  }, [estudiantes, filtro, textoBusqueda]);

  const sincronizar = async () => {
    if (!confirm('Esto consultará CONAPE y actualizará la información de desembolsos/aprobaciones. ¿Continuar?')) return;
    setSyncing(true); setMsg(''); setError('');
    try {
      const r = await postConapeCobranza('sincronizarCONAPE', {});
      if (!r || r.ok === false) throw new Error(r?.error || 'CONAPE no pudo sincronizarse');
      setMsg(ccSafeUserError(r?.mensaje, 'CONAPE sincronizado correctamente.', 'sincronizar_conape_exito'));
      cargar();
    } catch (e) {
      setError(ccSafeUserError(e?.message || String(e), 'No se pudo sincronizar CONAPE. Intentá de nuevo.', 'sincronizar_conape'));
    } finally { setSyncing(false); }
  };

  const exportar = () => {
    const rows = [[
      'Tipo','Prioridad','Cédula','Código','Nombre','Teléfono','Asesor','Grupo','Nivel','Etapa','Estado de cuenta','Novedad CONAPE','Último desembolso','Acción sugerida'
    ]];
    prospectosFiltrados.forEach(p => rows.push(['prospecto', p.prioridad, p.cedula, '', p.nombre, p.telefono, p.asesor, p.grupo, '', ccStatusLabel(p.etapa, ''), ccStatusLabel(p.estado_cuenta, ''), ccStatusLabel(p.ws_novedad, ''), p.ultimo_desembolso, p.accion_sugerida]));
    estudiantesFiltrados.forEach(e => rows.push(['estudiante', e.prioridad || '', e.cedula, e.codigo, e.nombre, e.telefono, '', e.grupo, e.nivel, e.estatus, 'ACTIVO', '', '', e.accion_sugerida]));
    ccDownloadCsv('conape_cobranza_' + new Date().toISOString().slice(0,10) + '.csv', rows);
  };

  const copiar = () => {
    const lines = [];
    lines.push('CONAPE / Cobranza · Academia Norteamericana');
    lines.push('Fecha: ' + (data?.fecha || new Date().toLocaleString('es-CR')));
    lines.push('Pendientes CONAPE: ' + ccNum(k.prospectos_pendientes));
    lines.push('Desembolso sin matrícula: ' + ccNum(k.desembolso_sin_matricula));
    lines.push('Aprobados sin desembolso: ' + ccNum(k.aprobado_sin_desembolso));
    lines.push('Activos CONAPE: ' + ccNum(k.activos_conape));
    lines.push('Grupos con mora: ' + ccNum(k.grupos_con_mora));
    lines.push('');
    prospectosFiltrados.slice(0, 40).forEach((p, i) => {
      lines.push(`${i+1}. ${p.nombre || '—'} · ${p.cedula || '—'} · ${p.telefono || '—'} · ${ccStatusLabel(p.etapa, '—')} · ${p.accion_sugerida || ''}`);
    });
    ccCopy(lines.join('\n'), setMsg);
  };

  const abrirGrupo = (grupo) => {
    if (!grupo || !onNavigate) return;
    onNavigate('calendario_grupo', { grupo });
  };

  return (
    <div data-screen-label="Admin · CONAPE y Cobranza" style={{ padding: 22, display:'flex', flexDirection:'column', gap:18 }}>
      <PageHeader
        title="CONAPE y Cobranza"
        subtitle="Seguimiento operativo de solicitudes, desembolsos, matrícula, activos CONAPE y grupos con mora."
      />

      <section style={{ border:'1px solid var(--line)', borderRadius:22, background:'linear-gradient(135deg, rgba(122,30,44,.06), rgba(214,169,74,.08), white)', padding:18, boxShadow:'0 14px 34px rgba(15,23,42,.06)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', gap:14, flexWrap:'wrap', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:900, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--an-granate)' }}>Panel de recuperación</div>
            <h2 style={{ margin:'4px 0 4px', fontSize:26, lineHeight:1.1, color:'var(--an-navy-ink)', fontFamily:'var(--f-serif)' }}>Flujo CONAPE → matrícula → cobro</h2>
            <div style={{ fontSize:13, color:'var(--ink-3)' }}>Última lectura: {ccText(data?.fecha)} · Última sincronización CONAPE: {ccText(data?.ultimo_sync_conape, 'sin dato')}</div>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <CCToolButton onClick={cargar} disabled={loading}>Actualizar</CCToolButton>
            <CCToolButton onClick={sincronizar} primary disabled={syncing || loading}>{syncing ? 'Sincronizando…' : 'Sincronizar CONAPE'}</CCToolButton>
            <CCToolButton onClick={copiar} disabled={!data}>Copiar seguimiento</CCToolButton>
            <CCToolButton onClick={exportar} disabled={!data}>Exportar CSV</CCToolButton>
          </div>
        </div>
        {(msg || error) && <div style={{ marginTop:12, padding:'9px 12px', borderRadius:12, background:error ? 'rgba(185,28,28,.08)' : 'rgba(22,163,74,.09)', color:error ? '#991B1B' : '#166534', fontSize:13, fontWeight:700 }}>{error || msg}</div>}
      </section>

      {loading && <div style={{ padding:30, textAlign:'center', color:'var(--ink-3)' }}>Cargando CONAPE y cobranza…</div>}

      {!loading && data && (
        <>
          <section style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(190px, 1fr))', gap:12 }}>
            <CCCard title="Alta prioridad" value={ccNum(k.alta_prioridad)} status="ALTA" sub="Desembolsos sin matrícula, aprobados críticos o mora." onClick={() => setFiltro('prioridad')} />
            <CCCard title="Desembolso sin matrícula" value={ccNum(k.desembolso_sin_matricula)} status="DESEMBOLSO" sub="Casos que deben convertirse en matrícula/pago." onClick={() => setFiltro('desembolso')} />
            <CCCard title="Aprobado sin desembolso" value={ccNum(k.aprobado_sin_desembolso)} status="MEDIA" sub="Acompañar firma/desembolso." onClick={() => setFiltro('aprobado')} />
            <CCCard title="Solicitud / documentos" value={ccNum(k.solicitud_documentos)} status="DOCUMENTOS" sub="Prospectos CONAPE todavía en trámite." onClick={() => setFiltro('documentos')} />
            <CCCard title="Activos CONAPE" value={ccNum(k.activos_conape)} status="ACTIVO" sub="Estudiantes activos con convenio CONAPE." onClick={() => setFiltro('activos')} />
            <CCardMora gruposConMora={ccNum(k.grupos_con_mora)} moraTotal={ccNum(k.mora_cache_total)} onClick={() => setFiltro('mora')} />
          </section>

          <section style={{ display:'grid', gridTemplateColumns:'minmax(260px, 1.1fr) minmax(260px, .9fr)', gap:14 }}>
            <div style={{ border:'1px solid var(--line)', borderRadius:18, background:'white', padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:12, alignItems:'center', marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:900, color:'var(--ink-3)', letterSpacing:'.12em', textTransform:'uppercase' }}>Embudo CONAPE</div>
                  <div style={{ fontSize:20, fontWeight:850, color:'var(--an-navy-ink)' }}>Prospectos y matrícula pendiente</div>
                </div>
                <CCBadge status={prospectosFiltrados.length ? 'MEDIA' : 'OK'}>{prospectosFiltrados.length} casos</CCBadge>
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
                {[
                  ['prioridad','Prioridad'], ['todos','Todos'], ['desembolso','Desembolso'], ['aprobado','Aprobado'], ['documentos','Documentos'], ['activos','Activos'], ['mora','Mora']
                ].map(([id, lab]) => (
                  <button key={id} type="button" onClick={() => setFiltro(id)} style={{
                    padding:'7px 10px', borderRadius:999, border:'1px solid ' + (filtro === id ? 'rgba(122,30,44,.35)' : 'var(--line)'),
                    background: filtro === id ? 'rgba(122,30,44,.08)' : 'white', color: filtro === id ? 'var(--an-granate)' : 'var(--ink-2)',
                    fontSize:12, fontWeight:850, cursor:'pointer', fontFamily:'inherit'
                  }}>{lab}</button>
                ))}
              </div>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre, cédula, asesor, teléfono o grupo…" style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', border:'1px solid var(--line)', borderRadius:12, fontSize:13, marginBottom:12 }} />
              <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:620, overflow:'auto', paddingRight:4 }}>
                {prospectosFiltrados.length === 0 && <div style={{ padding:18, color:'var(--ink-3)', textAlign:'center', background:'rgba(15,23,42,.03)', borderRadius:14 }}>No hay prospectos para este filtro.</div>}
                {prospectosFiltrados.map((p, idx) => {
                  const wa = ccPhoneLink(p.telefono, `Hola ${p.nombre || ''}, le saluda Academia Norteamericana. Queremos darle seguimiento a su proceso CONAPE (${p.etapa || 'en trámite'}).`);
                  return (
                    <div key={(p.cedula || '') + idx} style={{ border:'1px solid var(--line)', borderRadius:16, padding:13, background:'linear-gradient(135deg, rgba(255,255,255,.98), rgba(248,246,242,.75))' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', gap:10, alignItems:'start' }}>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:15, fontWeight:900, color:'var(--an-navy-ink)' }}>{ccText(p.nombre)}</div>
                          <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:2 }}>{ccText(p.cedula)} · {ccText(p.telefono)} · Asesor: {ccText(p.asesor)}</div>
                        </div>
                        <CCBadge status={p.prioridad}>{p.prioridad || 'Media'}</CCBadge>
                      </div>
                      <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginTop:10 }}>
                        <CCBadge status={p.etapa}>{ccStatusLabel(p.etapa, 'Sin etapa')}</CCBadge>
                        <CCBadge status={p.ws_novedad}>{ccStatusLabel(p.ws_novedad, 'Sin novedad CONAPE')}</CCBadge>
                        {p.grupo && <button type="button" onClick={() => abrirGrupo(p.grupo)} style={{ border:'1px solid var(--line)', background:'white', borderRadius:999, padding:'4px 9px', fontSize:11, fontWeight:850, cursor:'pointer' }}>{p.grupo}</button>}
                        {wa && <a href={wa} target="_blank" rel="noreferrer" style={{ border:'1px solid rgba(22,163,74,.22)', background:'rgba(22,163,74,.08)', color:'#166534', borderRadius:999, padding:'4px 9px', fontSize:11, fontWeight:850, textDecoration:'none' }}>WA</a>}
                      </div>
                      <div style={{ marginTop:9, fontSize:12.5, color:'var(--ink-2)', lineHeight:1.45 }}>{p.accion_sugerida || 'Dar seguimiento administrativo.'}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ border:'1px solid var(--line)', borderRadius:18, background:'white', padding:16 }}>
                <div style={{ fontSize:11, fontWeight:900, color:'var(--ink-3)', letterSpacing:'.12em', textTransform:'uppercase' }}>Grupos con atención</div>
                <div style={{ fontSize:20, fontWeight:850, color:'var(--an-navy-ink)', marginBottom:10 }}>Cobranza por grupo</div>
                <div style={{ display:'flex', flexDirection:'column', gap:9, maxHeight:260, overflow:'auto' }}>
                  {grupos.slice(0, 12).map(g => (
                    <button key={g.code} type="button" onClick={() => abrirGrupo(g.code)} style={{ textAlign:'left', border:'1px solid var(--line)', background:'rgba(248,246,242,.65)', borderRadius:14, padding:11, cursor:'pointer', fontFamily:'inherit' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                        <strong style={{ color:'var(--an-navy-ink)' }}>{g.code}</strong>
                        <CCBadge status={g.prioridad}>{g.prioridad}</CCBadge>
                      </div>
                      <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:4 }}>{g.nivel || '—'} · CA {ccNum(g.ca)} · Mora {ccNum(g.mora)} · CONAPE {ccNum(g.conape_activos)}</div>
                    </button>
                  ))}
                  {!grupos.length && <div style={{ color:'var(--ink-3)', fontSize:13 }}>No hay grupos con alerta de cobranza en caché.</div>}
                </div>
              </div>

              <div style={{ border:'1px solid var(--line)', borderRadius:18, background:'white', padding:16 }}>
                <div style={{ fontSize:11, fontWeight:900, color:'var(--ink-3)', letterSpacing:'.12em', textTransform:'uppercase' }}>Activos CONAPE</div>
                <div style={{ fontSize:20, fontWeight:850, color:'var(--an-navy-ink)', marginBottom:10 }}>Estudiantes financiados</div>
                <div style={{ display:'flex', flexDirection:'column', gap:9, maxHeight:310, overflow:'auto' }}>
                  {estudiantesFiltrados.slice(0, 30).map(e => {
                    const wa = ccPhoneLink(e.telefono, `Hola ${e.nombre || ''}, le saluda Academia Norteamericana. Queremos darle seguimiento a su estado de cuenta/CONAPE.`);
                    return (
                      <div key={e.codigo || e.cedula} style={{ border:'1px solid var(--line)', borderRadius:14, padding:10, background:'rgba(255,255,255,.9)' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                          <strong style={{ color:'var(--an-navy-ink)' }}>{e.nombre || '—'}</strong>
                          <span style={{ fontFamily:'var(--f-mono)', fontSize:11, color:'var(--ink-3)' }}>{e.codigo}</span>
                        </div>
                        <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:3 }}>{e.cedula || '—'} · {e.grupo || '—'} · {e.nivel || '—'} · Mora grupo: {ccNum(e.grupo_mora)}</div>
                        <div style={{ display:'flex', gap:7, marginTop:7, flexWrap:'wrap' }}>
                          {e.grupo && <button type="button" onClick={() => abrirGrupo(e.grupo)} style={{ border:'1px solid var(--line)', background:'white', borderRadius:999, padding:'4px 8px', fontSize:11, fontWeight:850, cursor:'pointer' }}>Abrir grupo</button>}
                          {wa && <a href={wa} target="_blank" rel="noreferrer" style={{ border:'1px solid rgba(22,163,74,.22)', background:'rgba(22,163,74,.08)', color:'#166534', borderRadius:999, padding:'4px 8px', fontSize:11, fontWeight:850, textDecoration:'none' }}>WA</a>}
                        </div>
                      </div>
                    );
                  })}
                  {!estudiantesFiltrados.length && <div style={{ color:'var(--ink-3)', fontSize:13 }}>No hay estudiantes activos CONAPE para este filtro.</div>}
                </div>
              </div>

              <div style={{ border:'1px solid var(--line)', borderRadius:18, background:'white', padding:16 }}>
                <div style={{ fontSize:11, fontWeight:900, color:'var(--ink-3)', letterSpacing:'.12em', textTransform:'uppercase' }}>Asesores</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
                  {asesores.slice(0, 8).map(a => (
                    <div key={a.nombre} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, borderBottom:'1px solid var(--line)', paddingBottom:7 }}>
                      <span style={{ fontWeight:800, color:'var(--ink-2)' }}>{a.nombre || 'Sin asesor'}</span>
                      <span style={{ fontSize:12, color:'var(--ink-3)' }}>{a.total} casos · {a.alta} alta</span>
                    </div>
                  ))}
                  {!asesores.length && <div style={{ color:'var(--ink-3)', fontSize:13 }}>Sin resumen por asesor.</div>}
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function CCardMora({ gruposConMora, moraTotal, onClick }) {
  return <CCCard title="Mora por grupo" value={gruposConMora} status={gruposConMora ? 'MORA' : 'OK'} sub={`${moraTotal || 0} estudiantes en mora según caché de grupos.`} onClick={onClick} />;
}

window.ConapeCobranzaView = ConapeCobranzaView;
