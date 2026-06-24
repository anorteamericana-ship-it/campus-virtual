/* global React, Icon, Chip, PageHeader, PRIORITY_BLOCK, SYLLABUS_BY_LEVEL, ICAN_SLOTS_AFTER,
   useUsuario, EmptyState, ErrorState, LoadingState,
   buildGroupSchedule, fmtDate, fmtDateLong, MONTHS_ES */

// URL del Apps Script: fuente única en data.jsx → window.APPS_SCRIPT_URL
const SCRIPT_URL_SV = window.APPS_SCRIPT_URL;

// FIX-ADMIN-CORE-POST-001: lectura sensible vía POST text/plain (token en body).
async function postSyllabus(fn, payload = {}) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const res = await fetch(`${SCRIPT_URL_SV}?fn=${encodeURIComponent(fn)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, token, ...payload }),
  });
  return await res.json();
}

const LEVEL_LABEL = {
  b1:'Básico I', b2:'Básico II',
  i1:'Intermedio I', i2:'Intermedio II',
  a1:'Avanzado I', a2:'Avanzado II',
};
const DIAS_LABEL = { LM:'Lun/Mié', KJ:'Mar/Jue', LJ:'Lun/Jue', SA:'Sáb' };

// FIX STUDENT-PANEL-001-B: inferir el nivel (levelId) desde el código del grupo
// (B1/B2/I1/I2) cuando el backend no devuelve levelId. Evita caer siempre en
// Básico I y mostrar libro/datos equivocados para B2/I1/I2.
function inferirLevelIdDesdeGrupo(codigo = '') {
  const s = String(codigo || '').toUpperCase();
  if (s.includes('B1')) return 'b1';
  if (s.includes('B2')) return 'b2';
  if (s.includes('I1')) return 'i1';
  if (s.includes('I2')) return 'i2';
  return '';
}

// Hook: lee usuario de session, llama getGrupoInfo, devuelve { grupoInfo, codGrupo, grupo, loading }
function useGroupFromSession() {
  const [grupoInfo, setGrupoInfo] = React.useState(null);
  const [loading, setLoading]     = React.useState(true);
  const [error, setError]         = React.useState(''); // '' | 'autoriz' | 'fallo' | 'sin_grupo'
  const codGrupo = React.useMemo(() => {
    // DOCENTE-002-A: para docente, el grupo activo manda. Para estudiante no
    // existe grupoActivo, así que cae a su grupo (mismo comportamiento previo).
    if (typeof window.getGrupoActivoDocente === 'function') {
      const u = (typeof window.getSesion === 'function') ? window.getSesion() : null;
      if (u && u.rol === 'teacher') return window.getGrupoActivoDocente();
    }
    const usr = JSON.parse(sessionStorage.getItem('an_usuario') || 'null');
    return usr?.grupoActivo || usr?.grupo || usr?.grupos?.[0] || '';
  }, []);

  // FIX STUDENT-PANEL-001 (R4): getGrupoInfo es el endpoint permitido al
  // estudiante (POST seguro, token en el body via postSyllabus). Capturamos el
  // error para mostrar un mensaje amigable + Reintentar en vez de quedarnos
  // colgados o exponer "no_autorizado" crudo.
  const cargar = React.useCallback(() => {
    if (!codGrupo) { setLoading(false); setError('sin_grupo'); return; }
    setLoading(true); setError('');
    postSyllabus('getGrupoInfo', { cod_grupo: codGrupo })
      .then(d => {
        if (d && d.ok) { setGrupoInfo(d); return; }
        const raw = String((d && d.error) || '').toLowerCase();
        setError(raw.includes('autoriz') ? 'autoriz' : 'fallo');
      })
      .catch(() => setError('fallo'))
      .finally(() => setLoading(false));
  }, [codGrupo]);

  React.useEffect(() => { cargar(); }, [cargar]);

  // Construye el objeto que espera buildGroupSchedule
  const grupo = React.useMemo(() => {
    if (!grupoInfo || !codGrupo) return null;
    const partes   = codGrupo.split('-');
    const diasCode = (partes[1] || 'LM').replace(/\d/g, '').toUpperCase();
    return {
      code:         codGrupo,
      levelId:      grupoInfo.levelId || inferirLevelIdDesdeGrupo(codGrupo) || 'b1',
      scheduleDays: DIAS_LABEL[diasCode] || 'Lun/Mié',
      startDate:    grupoInfo.startDate,
      teacher:      grupoInfo.teacherName || '',
    };
  }, [grupoInfo, codGrupo]);

  return { grupoInfo, grupo, codGrupo, loading, error, reload: cargar };
}

// (SyllabusLoadingState eliminado — usa <LoadingState/> de primitives.jsx.)

// ─────────────────────────────────────────────────────────────────────────
// SYLLABUS + SCHEDULE — shared by Materiales, Calendario, Docente, Admin
// ─────────────────────────────────────────────────────────────────────────

const TODAY = new Date();
TODAY.setHours(0,0,0,0);

function useScheduleState(grupoInfo, grupo) {
  const [fechasReales, setFechasReales] = React.useState(null);

  React.useEffect(() => {
    if (!grupoInfo || !grupo?.code) { setFechasReales(null); return; }
    let cancelled = false;
    const nivel = String(grupo.levelId || grupoInfo.levelId || 'b1').toUpperCase();
    postSyllabus('getFechasGrupo', { cod_grupo: grupo.code, nivel, riel:'curso' })
      .then(d => { if (!cancelled) setFechasReales(d?.ok && Array.isArray(d.lecciones) ? d.lecciones : []); })
      .catch(() => { if (!cancelled) setFechasReales([]); });
    return () => { cancelled = true; };
  }, [grupoInfo, grupo?.code, grupo?.levelId]);

  const schedule = React.useMemo(() => {
    if (!grupoInfo || !grupo?.startDate) return [];
    const base = buildGroupSchedule(grupo?.levelId || grupoInfo.levelId || 'b1', grupo, []);
    if (!Array.isArray(fechasReales) || !fechasReales.length) return base;
    const porLeccion = new Map(fechasReales.filter(x => Number(x.leccion) > 0 && String(x.riel || (String(x.tipo).toUpperCase() === 'ICAN' ? 'ican' : 'curso')).toLowerCase() === 'curso').map(x => [Number(x.leccion), x]));
    return base.map(item => {
      const real = porLeccion.get(Number(item.n));
      if (!real?.fecha) return item;
      const date = new Date(`${String(real.fecha).slice(0,10)}T00:00:00`);
      const estado = String(real.estado || '').toUpperCase();
      return {
        ...item,
        date: isNaN(date) ? item.date : date,
        status: real.reprogramada ? 'rescheduled' : (estado === 'CERRADA' ? 'done' : 'scheduled'),
        backendEstado: estado,
        horaInicio: real.hora_inicio || '',
        horaFin: real.hora_fin || '',
        suspension: real.reprogramada ? { action:'rescheduled', reason:'Cambio aprobado por administración', byName:'Administración', detail:`Fecha original: ${real.fecha_original || '—'}` } : null,
      };
    });
  }, [grupoInfo, grupo, fechasReales]);

  return React.useMemo(() => schedule.map(s => {
    const st = (() => {
      if (s.status === 'done') return 'done';
      if (s.status === 'rescheduled') return s.date < TODAY ? 'done-rescheduled' : 'rescheduled';
      if (s.date < TODAY) return 'done';
      if (s.date.toDateString() === TODAY.toDateString()) return 'today';
      return 'upcoming';
    })();
    return { ...s, computedStatus: st };
  }), [schedule]);
}

// ─────────────────────────────────────────────────────────────────────────
// BANNER PRIORIDAD INA — aparece siempre arriba en Materiales
// ─────────────────────────────────────────────────────────────────────────
function PriorityBanner({ compact = false, onDismiss }) {
  const [expanded, setExpanded] = React.useState(!compact);

  return (
    <div style={{
      border:'2px solid var(--an-granate)',
      borderRadius:'var(--r-lg)',
      overflow:'hidden',
      marginBottom: 20,
      background:'linear-gradient(135deg, color-mix(in srgb, var(--an-granate) 6%, white) 0%, #FBF8F2 100%)',
      position:'relative',
    }}>
      {/* Corner flag */}
      <div style={{
        position:'absolute', top:0, right:0,
        background:'var(--an-granate)', color:'white',
        padding:'4px 14px 4px 14px',
        fontSize:9, fontWeight:800, letterSpacing:'0.18em',
        borderBottomLeftRadius:'var(--r-md)',
      }}>INA · OBLIGATORIO</div>

      <div style={{ padding:'18px 22px', display:'grid', gridTemplateColumns:'auto 1fr auto', gap:16, alignItems:'center' }}>
        <div style={{
          width:52, height:52, borderRadius:'50%',
          background:'var(--an-granate)', color:'white',
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--an-granate)' }}>
            Antes de empezar tu programa
          </div>
          <div style={{
            fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, letterSpacing:'-0.02em',
            lineHeight:1.15, color:'var(--an-navy-ink)', marginTop:3,
          }}>
            {PRIORITY_BLOCK.title}
          </div>
          <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:4, lineHeight:1.45 }}>
            {PRIORITY_BLOCK.note}
          </div>
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="btn"
          style={{ background: 'var(--an-granate)', color:'white', border:'none', fontSize:12 }}>
          {expanded ? 'Ocultar' : 'Ver material'}
        </button>
      </div>

      {expanded && (
        <div style={{ padding:'0 22px 18px', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:10 }}>
          {PRIORITY_BLOCK.items.map(item => (
            <div key={item.id} style={{
              padding:'12px 14px',
              background:'var(--surface)',
              border:'1px solid var(--line)',
              borderLeft: item.required ? '4px solid var(--an-granate)' : '4px solid var(--an-gold)',
              borderRadius:'var(--r-md)',
              display:'flex', gap:10, alignItems:'flex-start',
              cursor:'pointer',
              transition:'transform .15s, box-shadow .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--sh-1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
              <div style={{
                width:32, height:32, borderRadius:8, flexShrink:0,
                background: item.type==='video' ? 'color-mix(in srgb, var(--an-navy) 10%, white)' : 'color-mix(in srgb, var(--an-granate) 10%, white)',
                color: item.type==='video' ? 'var(--an-navy)' : 'var(--an-granate)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                {item.type==='video'
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', gap:6, alignItems:'baseline', flexWrap:'wrap' }}>
                  <span style={{ fontFamily:'var(--f-mono)', fontSize:10, color:'var(--ink-3)' }}>{item.code}</span>
                  <span style={{ fontWeight:600, fontSize:13, color:'var(--ink)', lineHeight:1.25 }}>{item.title}</span>
                </div>
                <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:3, lineHeight:1.4 }}>
                  {item.desc}
                </div>
                <div style={{ fontSize:10, color:'var(--ink-3)', marginTop:4, fontWeight:600, letterSpacing:'0.06em' }}>
                  {item.required ? 'REQUERIDO' : 'RECOMENDADO'} · ~{item.minutes} min
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STUDENT-ACCESS-CALENDAR-001 — Biblioteca bloqueada (mora / sin primera cuota)
// ─────────────────────────────────────────────────────────────────────────
function BibliotecaBloqueo({ variante, mensaje, nivelNombre, onNavigate }) {
  const esMora = variante === 'mora';
  const color  = esMora ? '#B71C1C' : '#9A6A00';
  return (
    <div>
      <PageHeader
        kicker="Biblioteca del curso"
        title={<>Biblioteca del curso{nivelNombre ? <> · <em>{nivelNombre}</em></> : null}</>}
        sub="Libro, audios, PDFs y recursos de tu nivel"
      />
      <div className="card" style={{ padding:'44px 30px', textAlign:'center', maxWidth:560, margin:'18px auto 0' }}>
        <div style={{
          width:54, height:54, margin:'0 auto 16px', borderRadius:'50%',
          background:`color-mix(in srgb, ${color} 14%, white)`, color,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div style={{
          display:'inline-block', padding:'3px 11px', borderRadius:'var(--r-pill)', marginBottom:14,
          background:`color-mix(in srgb, ${color} 12%, white)`, color,
          fontSize:10.5, fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase',
        }}>{esMora ? 'Acceso limitado · mora' : 'Biblioteca bloqueada'}</div>
        <div style={{ fontFamily:'var(--f-serif)', fontSize:24, fontWeight:500, letterSpacing:'-0.02em', color:'var(--an-navy-ink)', marginBottom:10 }}>
          {esMora ? 'Biblioteca temporalmente limitada' : 'La biblioteca aún no está habilitada'}
        </div>
        <div style={{ fontSize:14, color:'var(--ink-2)', lineHeight:1.6, maxWidth:420, margin:'0 auto 22px' }}>{mensaje}</div>
        <button type="button" onClick={() => onNavigate && onNavigate(esMora ? 'pagos' : 'dashboard')}
                className="btn btn-primary" style={{ padding:'10px 20px', fontSize:14 }}>
          {esMora ? 'Ir a Estado de cuenta' : 'Volver al inicio'}
        </button>
      </div>
    </div>
  );
}



// F98.4-F · Catálogo oficial + planeamiento real desde APOLLO G3.
// Libros y recursos se cargan por IDs fijos; los audios se reproducen pista
// por pista y se ordenan por unidad. No se exponen keys, scripts ni DOCs.
function BibliotecaCatalogoNivel({ nivelCode, codigoUsr, codGrupo, leccionInicial }) {
  const [estado, setEstado] = React.useState('load');
  const [catalogo, setCatalogo] = React.useState(null);
  const [error, setError] = React.useState('');
  const [unidadPlanActiva, setUnidadPlanActiva] = React.useState('');
  const [audioQuery, setAudioQuery] = React.useState('');
  const [audioSeleccionado, setAudioSeleccionado] = React.useState(null);

  React.useEffect(() => {
    let vivo = true;
    setEstado('load');
    setError('');
    setCatalogo(null);
    setAudioQuery('');
    setAudioSeleccionado(null);
    postSyllabus('getBibliotecaNivelEstudiante', {
      nivel:nivelCode,
      codigo:codigoUsr,
      cod_grupo:codGrupo,
    }).then(r => {
      if (!vivo) return;
      if (r?.ok && r?.acceso && r?.catalogo) {
        const cat = r.catalogo;
        setCatalogo(cat);
        const unidadesPlan = Array.isArray(cat.planeamiento_unidades) ? cat.planeamiento_unidades : [];
        const porLeccion = unidadesPlan.find(u => (u.lecciones || []).some(l => Number(l.leccion) === Number(leccionInicial)));
        setUnidadPlanActiva(porLeccion?.key || unidadesPlan[0]?.key || '');
        setEstado('ok');
      } else if (r?.ok && r?.acceso === false) {
        setError(r.motivo || 'La biblioteca no está habilitada para tu estado académico.');
        setEstado('blocked');
      } else {
        setError(r?.mensaje || r?.error || 'No se pudo cargar el catálogo del nivel.');
        setEstado('error');
      }
    }).catch(e => {
      if (!vivo) return;
      setError(e?.message || 'No se pudo cargar el catálogo del nivel.');
      setEstado('error');
    });
    return () => { vivo = false; };
  }, [nivelCode, codigoUsr, codGrupo, leccionInicial]);

  React.useEffect(() => {
    if (estado !== 'ok') return;
    let focus = '';
    try {
      focus = sessionStorage.getItem('an_biblioteca_focus') || '';
      sessionStorage.removeItem('an_biblioteca_focus');
    } catch (_) {}
    if (!focus) return;
    setTimeout(() => {
      const el = document.getElementById(`biblioteca-${focus}`);
      if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
    }, 120);
  }, [estado]);

  if (estado === 'load') {
    return <div className="card" style={{ padding:18, marginBottom:18 }}><LoadingState title="Cargando planeamiento, libros y audios del nivel…" /></div>;
  }
  if (estado === 'error' || estado === 'blocked') {
    return (
      <div className="card" style={{ padding:18, marginBottom:18, borderStyle:'dashed' }}>
        <div style={{ fontWeight:800, color:'var(--ink)' }}>Biblioteca del nivel no disponible</div>
        <div style={{ marginTop:5, fontSize:12.5, color:'var(--ink-3)', lineHeight:1.5 }}>{error}</div>
      </div>
    );
  }

  const libros = catalogo?.libros || [];
  const unidadesAudio = catalogo?.audios_unidades || [];
  const unidadesPlan = catalogo?.planeamiento_unidades || [];
  const unidadPlan = unidadesPlan.find(u => String(u.key) === String(unidadPlanActiva)) || unidadesPlan[0] || null;
  const audioOptions = unidadesAudio.flatMap(unidad => (unidad.pistas || []).map(pista => ({
    id:pista.id,
    display:`${unidad.label} · ${pista.nombre}`,
    unidad:unidad.label,
    pista,
  })));

  const handleAudioQuery = (value) => {
    setAudioQuery(value);
    const exacto = audioOptions.find(x => x.display === value);
    setAudioSeleccionado(exacto || null);
  };

  const campo = (label, value) => {
    if (!value) return null;
    return (
      <div style={{ padding:'11px 12px', border:'1px solid var(--line)', borderRadius:12, background:'#fff' }}>
        <div style={{ fontSize:9.5, fontWeight:900, letterSpacing:'.11em', textTransform:'uppercase', color:'var(--ink-3)' }}>{label}</div>
        <div style={{ marginTop:5, fontSize:12.2, lineHeight:1.5, color:'var(--ink)' }}>{value}</div>
      </div>
    );
  };

  return (
    <div style={{ display:'grid', gap:18, marginBottom:20 }}>
      <section id="biblioteca-planeamiento" className="card" style={{ padding:'18px 20px', scrollMarginTop:20, borderLeft:'4px solid var(--an-navy)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:14, flexWrap:'wrap' }}>
          <div>
            <BiblioKicker icon="calendar">Planeamiento académico</BiblioKicker>
            <div style={{ marginTop:5, fontFamily:'var(--f-serif)', fontSize:22, fontWeight:600, color:'var(--an-navy-ink)' }}>PLANEAMIENTO POR UNIDAD</div>
            <div style={{ marginTop:4, fontSize:11.5, color:'var(--ink-3)' }}>Fuente: APOLLO G3 · DETALLE DEL PROGRAMA</div>
          </div>
          <label style={{ minWidth:250, maxWidth:360, flex:'0 1 360px' }}>
            <span style={{ display:'block', marginBottom:6, fontSize:10, fontWeight:900, letterSpacing:'.11em', textTransform:'uppercase', color:'var(--an-navy)' }}>Seleccionar unidad</span>
            <select value={unidadPlanActiva} onChange={e => setUnidadPlanActiva(e.target.value)} style={{ width:'100%', border:'1px solid var(--line)', borderRadius:12, padding:'10px 12px', background:'#fff', color:'var(--ink)', fontSize:13, fontWeight:750 }}>
              {unidadesPlan.map(u => <option key={u.key} value={u.key}>{u.label}{u.titulo_unidad ? ` · ${u.titulo_unidad}` : ''}</option>)}
            </select>
          </label>
        </div>

        {!unidadPlan ? (
          <div style={{ marginTop:14, padding:20, border:'1px dashed var(--line)', borderRadius:14, color:'var(--ink-3)', textAlign:'center' }}>No se encontró planeamiento para este nivel.</div>
        ) : (
          <div style={{ marginTop:16 }}>
            <div style={{ padding:'14px 15px', borderRadius:14, background:'color-mix(in srgb, var(--an-navy) 6%, white)', border:'1px solid color-mix(in srgb, var(--an-navy) 18%, white)' }}>
              <div style={{ fontSize:10, fontWeight:900, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--an-navy)' }}>{unidadPlan.label}</div>
              <div style={{ marginTop:4, fontFamily:'var(--f-serif)', fontSize:19, fontWeight:600, color:'var(--an-navy-ink)' }}>{unidadPlan.titulo_unidad || unidadPlan.label}</div>
              <div style={{ marginTop:4, fontSize:11.5, color:'var(--ink-3)' }}>{unidadPlan.lecciones?.length || 0} lecciones en esta selección</div>
            </div>

            <div style={{ display:'grid', gap:12, marginTop:12 }}>
              {(unidadPlan.lecciones || []).map(lec => (
                <article key={`${unidadPlan.key}-${lec.leccion}`} style={{ border:'1px solid var(--line)', borderRadius:16, background:'var(--surface)', overflow:'hidden' }}>
                  <div style={{ padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap', borderBottom:'1px solid var(--line)', background:'var(--surface-2)' }}>
                    <div>
                      <div style={{ fontSize:10, fontWeight:900, letterSpacing:'.11em', textTransform:'uppercase', color:'var(--an-granate)' }}>{lec.leccion_label || `LECCIÓN ${String(lec.leccion).padStart(2,'0')}`}</div>
                      <div style={{ marginTop:3, fontFamily:'var(--f-serif)', fontSize:17, fontWeight:600, color:'var(--an-navy-ink)' }}>{lec.titulo_unidad || unidadPlan.titulo_unidad}</div>
                    </div>
                    <span style={{ padding:'4px 10px', borderRadius:999, background:'color-mix(in srgb, var(--an-navy) 9%, white)', color:'var(--an-navy)', fontSize:10, fontWeight:900, letterSpacing:'.07em' }}>{lec.tipo || 'TEÓRICA'}</span>
                  </div>
                  <div style={{ padding:14, display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:10 }}>
                    {campo('Asignatura', lec.asignatura)}
                    {campo('Tema / Objetivo general', lec.tema_objetivo_general)}
                    {campo('Speaking', lec.speaking)}
                    {campo('Grammar', lec.grammar)}
                    {campo('Pronunciation / Listening', lec.pronunciation_listening)}
                    {campo('Writing / Reading', lec.writing_reading)}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <section id="biblioteca-libros" className="card" style={{ padding:'18px 20px', scrollMarginTop:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:12, flexWrap:'wrap' }}>
          <div>
            <BiblioKicker icon="book">Libros del nivel</BiblioKicker>
            <div style={{ marginTop:5, fontFamily:'var(--f-serif)', fontSize:19, color:'var(--an-navy-ink)' }}>Student Book y Workbook</div>
          </div>
          <span style={{ fontSize:11, color:'var(--ink-3)' }}>{libros.length} archivos oficiales</span>
        </div>
        <div style={{ marginTop:14, display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))', gap:10 }}>
          {libros.map(item => (
            <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" style={{ padding:'13px 14px', border:'1px solid var(--line)', borderRadius:'var(--r-md)', textDecoration:'none', background:'#fff', color:'var(--ink)', display:'flex', gap:10, alignItems:'center' }}>
              <span style={{ fontSize:22 }}>📘</span>
              <span style={{ minWidth:0 }}>
                <strong style={{ display:'block', fontSize:12.5, lineHeight:1.35 }}>{item.nombre}</strong>
                <span style={{ display:'block', marginTop:3, fontSize:10.5, color:'var(--ink-3)' }}>Abrir en Drive</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      <section id="biblioteca-audios" className="card" style={{ padding:'18px 20px', scrollMarginTop:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:12, flexWrap:'wrap' }}>
          <div>
            <BiblioKicker icon="materials">Audios por unidad</BiblioKicker>
            <div style={{ marginTop:5, fontFamily:'var(--f-serif)', fontSize:19, color:'var(--an-navy-ink)' }}>Reproductor individual por pista</div>
          </div>
          <span style={{ fontSize:11, color:'var(--ink-3)' }}>{catalogo?.totales?.audios || 0} pistas · {unidadesAudio.length} unidades</span>
        </div>

        <div style={{ marginTop:14 }}>
          <label htmlFor="audio-combobox-biblioteca" style={{ display:'block', marginBottom:6, fontSize:10, fontWeight:900, letterSpacing:'.11em', textTransform:'uppercase', color:'var(--an-navy)' }}>Buscar audio por unidad</label>
          <input
            id="audio-combobox-biblioteca"
            type="search"
            list="biblioteca-audio-opciones"
            value={audioQuery}
            onChange={e => handleAudioQuery(e.target.value)}
            placeholder="Escribí la unidad o el nombre de la pista"
            autoComplete="off"
            style={{ width:'100%', border:'1px solid var(--line)', borderRadius:12, padding:'11px 13px', background:'#fff', color:'var(--ink)', fontSize:13 }}
          />
          <datalist id="biblioteca-audio-opciones">
            {audioOptions.map(x => <option key={x.id} value={x.display} />)}
          </datalist>
          <div style={{ marginTop:6, fontSize:11, color:'var(--ink-3)' }}>El buscador contiene cada pista agrupada por el nombre de su unidad. Solo se muestra el reproductor del audio seleccionado.</div>
        </div>

        {!audioSeleccionado ? (
          <div style={{ marginTop:14, padding:20, border:'1px dashed var(--line)', borderRadius:'var(--r-md)', color:'var(--ink-3)', textAlign:'center' }}>Buscá y seleccioná una pista para abrir el reproductor.</div>
        ) : (
          <div style={{ marginTop:14, padding:'14px 15px', border:'1px solid var(--line)', borderRadius:14, background:'#fff' }}>
            <div style={{ fontSize:10, fontWeight:900, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--an-navy)' }}>{audioSeleccionado.unidad}</div>
            <div style={{ marginTop:5, fontSize:13, fontWeight:800, color:'var(--ink)', lineHeight:1.4, wordBreak:'break-word' }}>{audioSeleccionado.pista.nombre}</div>
            <audio controls preload="none" src={audioSeleccionado.pista.stream_url} style={{ width:'100%', height:38, marginTop:10 }}>
              Tu navegador no puede reproducir este audio.
            </audio>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap', marginTop:6 }}>
              <a href={audioSeleccionado.pista.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:'var(--an-navy)' }}>Abrir pista en Drive</a>
              <button type="button" className="btn btn-ghost" style={{ fontSize:11, padding:'6px 10px' }} onClick={() => { setAudioQuery(''); setAudioSeleccionado(null); }}>Limpiar selección</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// MATERIALES — sílabus completo, pestañas Actuales/Futuras/Completadas
// ─────────────────────────────────────────────────────────────────────────
function MaterialesView({ initialLesson = null, onNavigate } = {}) {
  // STUDENT-LEARNING-EXPERIENCE-001: "Materiales" se reinventa como
  // "Biblioteca del curso". El calendario oficial vive SOLO en el Cronograma
  // académico (cronograma_grupo.jsx). Acá ya NO se genera ni muestra un
  // calendario mensual: solo libro, audios, PDFs y recursos por lección.
  const { grupoInfo, grupo, codGrupo, loading, error, reload } = useGroupFromSession();

  // `initialLesson` llega desde el Cronograma y selecciona la unidad real en APOLLO G3.
  const [openLec, setOpenLec] = React.useState(initialLesson);
  React.useEffect(() => { if (initialLesson) setOpenLec(initialLesson); }, [initialLesson]);
  const sesion = React.useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('an_usuario') || 'null'); } catch { return null; }
  }, []);

  // STUDENT-ACCESS-CALENDAR-001: la Biblioteca respeta el acceso del estudiante.
  // (Docente/admin no se gatean: codigoBiblio queda vacío → sin fetch.)
  const esStudentBiblio = (sesion?.rol || 'student') === 'student';
  const codigoBiblio = esStudentBiblio ? (sesion?.codigo || sesion?.cedula || '') : '';
  const accBiblioState = window.useStudentAccess(codigoBiblio, '');
  const accBiblio = accBiblioState.access;

  if (loading) return <LoadingState title="Cargando la biblioteca de tu curso…" />;
  if (error || !grupoInfo || !grupo) {
    const msg = error === 'autoriz'
      ? 'No pudimos cargar tu biblioteca. Verificá tu sesión o contactá a la administración.'
      : 'No pudimos cargar la biblioteca de tu curso. Intentá de nuevo o contactá a la administración.';
    return (
      <div>
        <PageHeader
          kicker="Biblioteca del curso"
          title={<>Biblioteca del curso</>}
          sub="Libro, audios, PDFs y recursos de tu nivel"
        />
        <ErrorState message={msg} onRetry={reload} />
      </div>
    );
  }

  // STUDENT-ACCESS-CALENDAR-001: bloqueo honesto de la biblioteca por acceso.
  // Solo bloquea cuando el estado es DETERMINADO (no sobre-bloquea sin datos).
  if (esStudentBiblio && accBiblio && accBiblio.determinado) {
    if (accBiblio.flags.accountOnly) {
      return <BibliotecaBloqueo variante="mora" mensaje={accBiblio.mensaje} onNavigate={onNavigate} />;
    }
    if (!accBiblio.flags.canBiblioteca) {
      return <BibliotecaBloqueo
        variante="cuota"
        mensaje="La biblioteca se habilitará con la primera cuota del nivel."
        nivelNombre={grupoInfo.nivel || ''}
        onNavigate={onNavigate} />;
    }
  }

  // FIX STUDENT-PANEL-001-B (R4): nivel/material DINÁMICOS desde el grupo real
  // del estudiante. Inferimos el nivel del código del grupo cuando el backend no
  // manda levelId; NUNCA caemos por defecto a Básico I.
  const levelId      = String(
    grupoInfo.levelId ||
    grupo.levelId ||
    inferirLevelIdDesdeGrupo(grupoInfo.codigo || grupoInfo.cod_grupo || grupo.code || grupo.grupo || '')
  ).toLowerCase();
  const syl          = SYLLABUS_BY_LEVEL[levelId] || {};
  const nivelNombre  = grupoInfo.nivel || syl.levelName || 'Nivel actual';
  const libro        = grupoInfo.libro || syl.book || 'Libro del curso';
  const cefr         = syl.cefr || '';
  const programa     = grupoInfo.programa || grupo.programa || '';
  const esINA        = programa === 'INA' || programa === 'CON_INA';

  const rol       = sesion?.rol || 'student';
  const codigoUsr = sesion?.codigo || sesion?.cedula || '';
  const nivelCode = levelId.toUpperCase(); // B1/B2/I1/I2 para fetchMaterialLeccion
  const irCronograma = () => { if (onNavigate) onNavigate('cronograma_grupo'); };

  return (
    <div>
      <PageHeader
        kicker="Biblioteca del curso"
        title={<>Biblioteca del curso · <em>{nivelNombre}</em></>}
        sub={`${libro}${cefr ? ' · ' + cefr + ' · MCER' : ''} — planeamiento, libros y audios por unidad`}
        right={
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {esINA && <Chip tone="navy">Programa INA</Chip>}
            {cefr && <Chip tone="gold">{cefr} · MCER</Chip>}
            <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={irCronograma}>← Cronograma académico</button>
          </div>
        }
      />

      {/* Banner prioridad INA — solo para programa INA */}
      {esINA && <PriorityBanner />}

      <BibliotecaCatalogoNivel
        nivelCode={nivelCode}
        codigoUsr={codigoUsr}
        codGrupo={codGrupo}
        leccionInicial={openLec}
      />

      {/* Volver al Cronograma académico */}
      <div style={{ marginTop:18, display:'flex', justifyContent:'center' }}>
        <button className="btn btn-ghost" onClick={irCronograma}>← Volver al Cronograma académico</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// BIBLIOTECA DEL CURSO — subcomponentes (sin calendario, sin datos falsos)
// ─────────────────────────────────────────────────────────────────────────
function BiblioKicker({ icon, children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
      <span style={{ width:26, height:26, borderRadius:7, background:'var(--bg-deep)', color:'var(--ink-2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon name={icon} size={14} className="" />
      </span>
      <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3)' }}>{children}</span>
    </div>
  );
}

// CALENDARIO — cronograma del grupo con suspender/recuperar
// ─────────────────────────────────────────────────────────────────────────
function CalendarioView() {
  const { grupoInfo, grupo, codGrupo, loading, error, reload } = useGroupFromSession();
  const schedule = useScheduleState(grupoInfo, grupo);
  // FIX STUDENT-PANEL-001-B (R2): TODOS los hooks antes de cualquier return
  // condicional (Rules of Hooks). Antes vivían debajo de los returns de loading
  // y error, rompiendo el conteo de hooks entre renders.
  const [month, setMonth] = React.useState(TODAY.getMonth());
  const [year, setYear] = React.useState(TODAY.getFullYear());
  const [selectedLesson, setSelectedLesson] = React.useState(null);
  const [showSuspendModal, setShowSuspendModal] = React.useState(null);
  if (loading) return <LoadingState title="Cargando datos del grupo…" />;
  if (error || !grupoInfo || !grupo) {
    const msg = error === 'autoriz'
      ? 'No pudimos cargar el calendario de tu grupo. Verificá tu sesión o contactá a la administración.'
      : 'No pudimos cargar el calendario de tu grupo. Intentá de nuevo o contactá a la administración.';
    return (
      <div>
        <PageHeader kicker="Cronograma del grupo" title={<>Mi <em>Calendario</em></>} />
        <ErrorState message={msg} onRetry={reload} />
      </div>
    );
  }
  const nivelLbl = LEVEL_LABEL[grupoInfo.levelId] || grupoInfo.levelId || '—';

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  // Build calendar grid
  const cells = [];
  for (let i = 0; i < startWeekDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  // Lessons by date
  const lessonsByDate = {};
  schedule.forEach(s => {
    const k = s.date.toDateString();
    if (!lessonsByDate[k]) lessonsByDate[k] = [];
    lessonsByDate[k].push(s);
  });

  const navMonth = (delta) => {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
  };

  return (
    <div>
      <PageHeader
        kicker="Cronograma del grupo"
        title={<>Mi <em>Calendario</em></>}
        sub={`${codGrupo} · ${nivelLbl} · ${grupo.scheduleDays} · Inicio ${fmtDateLong(new Date(grupoInfo.startDate))}`}
        right={
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <Chip tone="granate" dot>Lección actual: L{schedule.find(s => s.computedStatus === 'today' || s.computedStatus === 'upcoming')?.n || 1}</Chip>
          </div>
        }
      />

      {/* Legenda de estados */}
      <div style={{
        display:'flex', gap:14, flexWrap:'wrap', padding:'10px 14px',
        background:'var(--surface-2)', border:'1px solid var(--line)',
        borderRadius:'var(--r-md)', marginBottom:16, fontSize:11,
      }}>
        {[
          ['Completada', 'var(--ok)'],
          ['Hoy / Próxima', 'var(--an-granate)'],
          ['Programada', 'var(--an-navy)'],
          ['Reprogramada', 'var(--an-gold)'],
          ['Suspendida (cascada)', 'var(--warn)'],
        ].map(([l,c]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:10, height:10, borderRadius:3, background:c }} />
            <span style={{ color:'var(--ink-2)' }}>{l}</span>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
        {/* Calendar grid */}
        <div className="card" style={{ padding:16 }}>
          {/* Month nav */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <button className="btn btn-ghost" onClick={() => navMonth(-1)}>← Mes anterior</button>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, color:'var(--an-navy-ink)', textTransform:'capitalize' }}>
              {new Date(year, month, 1).toLocaleDateString('es-CR', { month:'long', year:'numeric' })}
            </div>
            <button className="btn btn-ghost" onClick={() => navMonth(1)}>Mes siguiente →</button>
          </div>

          {/* Weekday headers */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4, marginBottom:4 }}>
            {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
              <div key={d} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-3)', textAlign:'center', padding:'4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Days */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4 }}>
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const lessons = lessonsByDate[d.toDateString()] || [];
              const isToday = d.toDateString() === TODAY.toDateString();
              return (
                <div key={i} style={{
                  minHeight: 70,
                  padding: 6,
                  background: isToday ? 'color-mix(in srgb, var(--an-granate) 8%, white)' : 'var(--surface)',
                  border: isToday ? '2px solid var(--an-granate)' : '1px solid var(--line)',
                  borderRadius: 6,
                  cursor: lessons.length ? 'pointer' : 'default',
                  opacity: d < TODAY && lessons.length === 0 ? 0.5 : 1,
                }}
                onClick={() => lessons[0] && setSelectedLesson(lessons[0])}>
                  <div style={{
                    fontSize: 11, fontWeight: isToday ? 700 : 500,
                    color: isToday ? 'var(--an-granate)' : 'var(--ink-2)',
                    marginBottom: 3,
                  }}>{d.getDate()}</div>
                  {lessons.map(l => (
                    <div key={l.n} style={{
                      fontSize: 9, padding:'2px 4px', marginBottom:2, borderRadius:3,
                      background: l.computedStatus==='done' || l.computedStatus==='done-rescheduled' ? 'var(--ok)'
                        : l.computedStatus==='today' ? 'var(--an-granate)'
                        : l.computedStatus==='rescheduled' ? 'var(--an-gold)'
                        : l.computedStatus==='suspended' ? 'var(--warn)'
                        : 'var(--an-navy)',
                      color:'white',
                      fontWeight:600,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    }}>
                      L{l.n} · {l.kind==='exam-oral' ? 'Oral' : l.kind==='exam-written' ? 'Escrito' : l.unit.replace('Unit ','U')}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        <div className="card" style={{ padding:18, height:'fit-content' }}>
          {!selectedLesson ? (
            <>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:6 }}>
                Próximas lecciones
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {schedule.filter(s => s.computedStatus === 'today' || s.computedStatus === 'upcoming' || s.computedStatus === 'rescheduled').slice(0,5).map(s => (
                  <div key={s.n} onClick={() => setSelectedLesson(s)} style={{
                    padding:'10px 12px', borderRadius:8,
                    background:'var(--surface-2)', border:'1px solid var(--line)',
                    cursor:'pointer',
                  }}>
                    <div style={{ display:'flex', gap:8, alignItems:'baseline' }}>
                      <span style={{ fontFamily:'var(--f-mono)', fontSize:10, color:'var(--ink-3)', fontWeight:600 }}>L{String(s.n).padStart(2,'0')}</span>
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>{s.title}</span>
                    </div>
                    <div style={{ fontSize:11, color:'var(--ink-2)', marginTop:2 }}>{fmtDateLong(s.date)}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop:16, paddingTop:14, borderTop:'1px dashed var(--line)', fontSize:11, color:'var(--ink-3)', lineHeight:1.5 }}>
                <div style={{ fontWeight:700, color:'var(--ink-2)', marginBottom:4 }}>Suspensiones registradas</div>
                {[].map((s,i) => (
                  <div key={i} style={{ marginBottom:6 }}>
                    <strong style={{ color: s.action==='rescheduled'?'var(--an-gold)':'var(--warn)' }}>L{s.lessonN}</strong>
                    {' · '}{s.reason}
                    {s.by === 'teacher' && ' · propuesto por docente, aprobado admin'}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <LessonDetailPanel
              lesson={selectedLesson}
              onClose={() => setSelectedLesson(null)}
              onSuspendRequest={() => setShowSuspendModal(selectedLesson)} />
          )}
        </div>
      </div>

      {showSuspendModal && (
        <SuspendModal lesson={showSuspendModal} onClose={() => setShowSuspendModal(null)} />
      )}
    </div>
  );
}

function LessonDetailPanel({ lesson, onClose, onSuspendRequest, onOpenMaterials }) {
  const s = lesson;
  return (
    <>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--an-granate)' }}>
          Lección {String(s.n).padStart(2,'0')} · {s.unit}
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--ink-3)', cursor:'pointer', fontSize:18, padding:0 }}>✕</button>
      </div>
      <div style={{ fontFamily:'var(--f-serif)', fontSize:20, fontWeight:500, letterSpacing:'-0.02em', lineHeight:1.2, color:'var(--an-navy-ink)', marginBottom:6 }}>
        {s.title}
      </div>
      <div style={{ fontSize:12, color:'var(--ink-2)', marginBottom:14 }}>
        {fmtDateLong(s.date)} · {s.hours}h · Ricardo Arias
      </div>

      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:4 }}>Objetivo</div>
      <div style={{ fontSize:12, color:'var(--ink-2)', marginBottom:12, lineHeight:1.5 }}>{s.objective}</div>

      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:4 }}>Situación de aprendizaje</div>
      <div style={{ fontSize:12, color:'var(--ink-2)', marginBottom:14, lineHeight:1.5 }}>{s.activity}</div>

      <div style={{ display:'flex', gap:8, flexDirection:'column' }}>
        {onOpenMaterials && (
          <button onClick={onOpenMaterials} className="btn btn-primary" style={{ width:'100%', fontSize:12 }}>
            → Ver materiales de esta lección
          </button>
        )}
        {(s.computedStatus === 'upcoming' || s.computedStatus === 'today') && (
          <button onClick={onSuspendRequest} className="btn" style={{ width:'100%', border:'1px solid var(--warn)', color:'var(--warn)', background:'white', fontSize:12 }}>
            Proponer suspensión / reprogramación
          </button>
        )}
      </div>

      {s.suspension && (
        <div style={{ marginTop:12, padding:'10px 12px', background:'color-mix(in srgb, var(--warn) 6%, white)', border:'1px dashed var(--warn)', borderRadius:8 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--warn)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
            {s.suspension.action === 'rescheduled' ? 'Reprogramada' : 'Suspendida'}
          </div>
          <div style={{ fontSize:12, color:'var(--ink)', marginTop:3, fontWeight:600 }}>{s.suspension.reason}</div>
          <div style={{ fontSize:11, color:'var(--ink-2)', marginTop:3, lineHeight:1.4 }}>
            Por {s.suspension.byName}
            {s.suspension.approvedBy && <> · aprobado por {s.suspension.approvedBy}</>}
            {s.suspension.detail && <><br />{s.suspension.detail}</>}
          </div>
        </div>
      )}
    </>
  );
}

function SuspendModal({ lesson, onClose }) {
  const [action, setAction] = React.useState('rescheduled'); // suspended | rescheduled
  const [reason, setReason] = React.useState('Enfermedad del profesor');
  const [detail, setDetail] = React.useState('');
  const [newDate, setNewDate] = React.useState('');

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(20,18,30,0.55)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:100, padding:20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'var(--surface)', borderRadius:'var(--r-lg)',
        maxWidth:520, width:'100%', padding:26, boxShadow:'var(--sh-3)',
      }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--an-granate)' }}>
          Solicitud de cambio · Lección {lesson.n}
        </div>
        <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, color:'var(--an-navy-ink)', marginTop:4 }}>
          {lesson.title}
        </div>
        <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:2, marginBottom:18 }}>
          {fmtDateLong(lesson.date)}
        </div>

        <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-2)', marginBottom:6 }}>Tipo de cambio</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
          {[
            ['rescheduled', 'Recuperar en otro día', 'La lección se da en fecha nueva — no afecta al resto'],
            ['suspended',   'Suspender (cascada)',   'Mueve esta y todas las siguientes un slot adelante'],
          ].map(([k, l, d]) => (
            <label key={k} style={{
              padding:'10px 12px', border:`2px solid ${action===k?'var(--an-granate)':'var(--line)'}`,
              borderRadius:8, cursor:'pointer',
              background: action===k ? 'color-mix(in srgb, var(--an-granate) 5%, white)' : 'var(--surface)',
            }}>
              <input type="radio" name="action" checked={action===k} onChange={() => setAction(k)} style={{ marginRight:6 }} />
              <strong style={{ fontSize:12 }}>{l}</strong>
              <div style={{ fontSize:10, color:'var(--ink-3)', marginTop:3, lineHeight:1.4 }}>{d}</div>
            </label>
          ))}
        </div>

        {action === 'rescheduled' && (
          <>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-2)', marginBottom:6 }}>Nueva fecha</div>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
              style={{ width:'100%', padding:'10px 12px', border:'1px solid var(--line)', borderRadius:8, marginBottom:14, fontFamily:'inherit' }} />
          </>
        )}

        <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-2)', marginBottom:6 }}>Motivo</div>
        <select value={reason} onChange={e => setReason(e.target.value)}
          style={{ width:'100%', padding:'10px 12px', border:'1px solid var(--line)', borderRadius:8, marginBottom:14, fontFamily:'inherit' }}>
          {['Feriado oficial','Enfermedad del profesor','Clima / emergencia','Evento institucional','Falta de quórum','Decisión administrativa','Otro'].map(r => (
            <option key={r}>{r}</option>
          ))}
        </select>

        <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-2)', marginBottom:6 }}>Detalle</div>
        <textarea value={detail} onChange={e => setDetail(e.target.value)} rows={3}
          placeholder="Ej. Acordamos con los estudiantes por WhatsApp dar la lección el sábado..."
          style={{ width:'100%', padding:'10px 12px', border:'1px solid var(--line)', borderRadius:8, marginBottom:14, fontFamily:'inherit', fontSize:12, resize:'vertical' }} />

        <div style={{ fontSize:11, color:'var(--ink-3)', padding:'10px 12px', background:'var(--surface-2)', borderRadius:6, marginBottom:16, lineHeight:1.5 }}>
          ℹ️ Esta solicitud pasará al admin para aprobación. Recibirás notificación por correo.
        </div>

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} className="btn btn-ghost">Cancelar</button>
          <button onClick={onClose} className="btn btn-primary">Enviar solicitud</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// I CAN VIEW — catálogo + historial + alertas de cupo
// ─────────────────────────────────────────────────────────────────────────
function ICANViewNew({ toast, role = 'student' }) {
  // FIX STUDENT-PANEL-001 (R5): Club I CAN SIN datos quemados.
  // Antes esta vista se alimentaba de ICAN_CATALOG / ICAN_HISTORY (días, cupos,
  // horarios y temas inventados). Ahora consulta ÚNICAMENTE el estado real del
  // estudiante logueado vía getICANEstudiante (POST seguro, token en el body).
  // El Club I CAN es de asistencia flexible: no inventamos agenda.
  const usr = (typeof useUsuario === 'function') ? useUsuario() : null;
  const codigo = usr?.codigo || usr?.cedula || '';

  const [data, setData]   = React.useState(null); // null = cargando
  const [error, setError] = React.useState('');   // '' = sin error

  const cargar = React.useCallback(() => {
    if (!codigo) { setData({}); setError(''); return; }
    setData(null); setError('');
    postSyllabus('getICANEstudiante', { codigo })
      .then(d => {
        if (d && d.ok) { setData(d); return; }
        const raw = String((d && d.error) || '').toLowerCase();
        if (raw.includes('autoriz')) {
          setError('No tenés autorización para ver esta información. Si creés que es un error, contactá a la administración.');
        } else if (raw) {
          setError('No pudimos cargar tu Club I CAN. Intentá de nuevo.');
        }
        setData({});
      })
      .catch(() => { setError('No pudimos cargar tu Club I CAN. Intentá de nuevo.'); setData({}); });
  }, [codigo]);

  React.useEffect(() => { cargar(); }, [cargar]);

  const header = (
    <PageHeader
      kicker="Club de conversación"
      title={<>Club <em>I CAN</em></>}
      sub="Asistencia flexible · sesiones de conversación sin costo para estudiantes matriculados"
      right={<Chip tone="gold">Asistencia flexible</Chip>}
    />
  );

  // Sin sesión activa
  if (!usr) {
    return (
      <div>
        {header}
        <EmptyState
          icon="👤"
          title="No hay sesión activa"
          subtitle="Ingresá con tu código de estudiante para ver tu Club I CAN."
        />
      </div>
    );
  }

  // Cargando
  if (data === null) {
    return (
      <div>
        {header}
        <LoadingState title="Cargando tu Club I CAN…" />
      </div>
    );
  }

  // Error controlado (nunca texto técnico crudo)
  if (error) {
    return (
      <div>
        {header}
        <ErrorState message={error} onRetry={cargar} />
      </div>
    );
  }

  // Solo mostramos lo que el backend devuelve. NO inventamos días, cupos,
  // horarios ni temas.
  const asistidas  = (typeof data.asistidas  === 'number') ? data.asistidas  : null;
  const requeridas = (typeof data.requeridas === 'number') ? data.requeridas : null;
  const sesiones   = Array.isArray(data.sesiones)  ? data.sesiones
                   : Array.isArray(data.historial) ? data.historial
                   : Array.isArray(data.registros) ? data.registros
                   : [];

  const sinDatos = asistidas == null && requeridas == null && sesiones.length === 0;
  if (sinDatos) {
    return (
      <div>
        {header}
        <EmptyState
          icon="🗣️"
          title="Aún no hay registros de Club I CAN para tu usuario"
          subtitle="El Club I CAN es de asistencia flexible. Cuando participes en una sesión, tu registro aparecerá acá."
        />
      </div>
    );
  }

  const pct = (asistidas != null && requeridas)
    ? Math.min(100, Math.round((asistidas / requeridas) * 100))
    : null;

  return (
    <div>
      {header}

      {/* Resumen real del estudiante */}
      {(asistidas != null || requeridas != null) && (
        <div className="card" style={{ padding:'20px 24px', marginBottom:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:20, alignItems:'center' }}>
            <div style={{
              width:64, height:64, borderRadius:'50%',
              background:'color-mix(in srgb, var(--an-gold) 16%, white)',
              color:'#6B4A00', display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', flexShrink:0,
            }}>
              <span style={{ fontFamily:'var(--f-serif)', fontSize:24, fontWeight:600, lineHeight:1 }}>
                {asistidas != null ? asistidas : '—'}
              </span>
              {requeridas != null && (
                <span style={{ fontSize:11, opacity:0.75, marginTop:2 }}>de {requeridas}</span>
              )}
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3)' }}>
                Tus sesiones I CAN
              </div>
              <div style={{ fontFamily:'var(--f-serif)', fontSize:24, fontWeight:500, color:'var(--an-navy-ink)', marginTop:2 }}>
                {asistidas != null
                  ? `${asistidas} sesión${asistidas === 1 ? '' : 'es'} asistida${asistidas === 1 ? '' : 's'}`
                  : 'Asistencia registrada'}
              </div>
              {requeridas != null && (
                <div style={{ marginTop:10, height:6, background:'var(--bg-deep)', borderRadius:3, overflow:'hidden', maxWidth:360 }}>
                  <div style={{ width:`${pct || 0}%`, height:'100%', background:'var(--an-gold)' }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Historial real (solo si el backend lo provee) */}
      {sesiones.length > 0 ? (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--line)' }}>
            <div className="card-title">Tus sesiones registradas</div>
          </div>
          <table className="table-soft">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tema</th>
                <th>Docente</th>
                <th style={{ textAlign:'center' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {sesiones.map((s, i) => {
                const estado = String(s.estado || s.status || '').toLowerCase();
                const cancelada = estado === 'cancelled' || estado === 'cancelada';
                return (
                  <tr key={s.id || i}>
                    <td style={{ fontSize:12, color:'var(--ink-2)' }}>{s.fecha || s.date || '—'}</td>
                    <td style={{ fontSize:13, fontWeight:500 }}>{s.tema || s.topic || '—'}</td>
                    <td style={{ fontSize:12 }}>{s.docente || s.teacher || '—'}</td>
                    <td style={{ textAlign:'center' }}>
                      {cancelada ? <Chip tone="red">Cancelada</Chip> : <Chip tone="green" dot>Asistida</Chip>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{
          padding:'16px 20px', background:'var(--surface-2)',
          border:'1px solid var(--line)', borderRadius:'var(--r-md)',
          fontSize:13, color:'var(--ink-2)',
        }}>
          Tu asistencia al Club I CAN se contabiliza arriba. El detalle por sesión aparecerá acá cuando esté disponible.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ADMIN — Horas por docente (calendario + reporte para pagos)
// ─────────────────────────────────────────────────────────────────────────
const TEACHER_HOURS_DATA = [
  { id:'t1', name:'Ricardo Arias Arroyo',  groups:3, totalGiven: 42, totalCancelled: 2, rate: 8500,  avatar:'RA', color:'var(--an-granate)' },
  { id:'t2', name:'Sofía Méndez',          groups:2, totalGiven: 28, totalCancelled: 1, rate: 7500,  avatar:'SM', color:'var(--an-navy)' },
  { id:'t3', name:'Kevin Brown',           groups:2, totalGiven: 30, totalCancelled: 0, rate: 8500,  avatar:'KB', color:'var(--an-gold)' },
  { id:'t4', name:'Ana Castro Mora',       groups:2, totalGiven: 24, totalCancelled: 3, rate: 8500,  avatar:'AC', color:'#5E8C5E' },
  { id:'t5', name:'Laura Vargas',          groups:1, totalGiven: 12, totalCancelled: 0, rate: 7500,  avatar:'LV', color:'#A0519A' },
  { id:'t6', name:'Daniel Castro',         groups:2, totalGiven: 22, totalCancelled: 1, rate: 7500,  avatar:'DC', color:'#C06A30' },
];

function AdminHorasDocentesView() {
  const [period, setPeriod] = React.useState('q1-abr'); // q1 | q2 | mes

  const fmtC = (n) => '₡' + n.toLocaleString('es-CR');

  return (
    <div>
      <PageHeader
        kicker="Reporte de horas · pagos docentes"
        title={<>Horas por <em>docente</em></>}
        sub="Calendario de lecciones dadas vs canceladas · base para planilla quincenal"
        right={
          <div style={{ display:'flex', gap:6 }}>
            <button className="btn btn-ghost" style={{ fontSize:12 }}>📊 Excel</button>
            <button className="btn btn-ghost" style={{ fontSize:12 }}>📄 PDF</button>
          </div>
        }
      />

      {/* Period filter */}
      <div className="tabs" style={{ marginBottom:16 }}>
        {[
          ['q1-abr', '1ª quincena abr'],
          ['q2-abr', '2ª quincena abr'],
          ['mes-abr', 'Abril completo'],
          ['mes-mar', 'Marzo'],
        ].map(([k,l]) => (
          <button key={k} className={`tab ${period===k?'active':''}`} onClick={() => setPeriod(k)}>{l}</button>
        ))}
      </div>

      {/* KPI summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:18 }}>
        {[
          ['Horas a pagar', TEACHER_HOURS_DATA.reduce((a,t)=>a+t.totalGiven,0), 'h dadas'],
          ['Canceladas', TEACHER_HOURS_DATA.reduce((a,t)=>a+t.totalCancelled,0), 'h no pagadas'],
          ['Total planilla', fmtC(TEACHER_HOURS_DATA.reduce((a,t)=>a+t.totalGiven*t.rate,0)), 'por período'],
          ['Promedio/docente', Math.round(TEACHER_HOURS_DATA.reduce((a,t)=>a+t.totalGiven,0)/TEACHER_HOURS_DATA.length), 'horas'],
        ].map(([l,n,s], i) => (
          <div key={i} className="card" style={{ padding:14 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-3)' }}>{l}</div>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:26, fontWeight:500, color:'var(--an-navy-ink)', letterSpacing:'-0.025em', marginTop:3 }}>{n}</div>
            <div style={{ fontSize:11, color:'var(--ink-3)' }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Tabla resumen */}
      <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:18 }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div className="card-title">Resumen por docente</div>
          <div style={{ fontSize:11, color:'var(--ink-3)' }}>Tarifa promedio: ₡8.000/hora</div>
        </div>
        <table className="table-soft">
          <thead>
            <tr>
              <th>Docente</th>
              <th style={{ textAlign:'center' }}>Grupos</th>
              <th style={{ textAlign:'center' }}>Dadas</th>
              <th style={{ textAlign:'center' }}>Canceladas</th>
              <th style={{ textAlign:'right' }}>Tarifa/h</th>
              <th style={{ textAlign:'right' }}>A pagar</th>
              <th style={{ textAlign:'center' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {TEACHER_HOURS_DATA.map(t => (
              <tr key={t.id}>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:t.color, color:'white', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{t.avatar}</div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{t.name}</div>
                      <div style={{ fontSize:11, color:'var(--ink-3)' }}>{t.groups} grupos activos</div>
                    </div>
                  </div>
                </td>
                <td style={{ textAlign:'center', fontFamily:'var(--f-mono)' }}>{t.groups}</td>
                <td style={{ textAlign:'center' }}>
                  <span style={{ color:'var(--ok)', fontWeight:700, fontFamily:'var(--f-mono)' }}>{t.totalGiven}h</span>
                </td>
                <td style={{ textAlign:'center' }}>
                  {t.totalCancelled > 0 ? (
                    <span style={{ color:'var(--warn)', fontWeight:700, fontFamily:'var(--f-mono)' }}>{t.totalCancelled}h</span>
                  ) : <span style={{ color:'var(--ink-3)' }}>—</span>}
                </td>
                <td style={{ textAlign:'right', fontFamily:'var(--f-mono)' }}>{fmtC(t.rate)}</td>
                <td style={{ textAlign:'right', fontWeight:700, fontFamily:'var(--f-mono)' }}>{fmtC(t.totalGiven * t.rate)}</td>
                <td style={{ textAlign:'center' }}>
                  <Chip tone="green" dot>Al día</Chip>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background:'var(--surface-2)', fontWeight:700 }}>
              <td colSpan="2" style={{ padding:'12px 14px', fontSize:13 }}>Total planilla</td>
              <td style={{ textAlign:'center', fontFamily:'var(--f-mono)', color:'var(--ok)' }}>
                {TEACHER_HOURS_DATA.reduce((a,t)=>a+t.totalGiven,0)}h
              </td>
              <td style={{ textAlign:'center', fontFamily:'var(--f-mono)', color:'var(--warn)' }}>
                {TEACHER_HOURS_DATA.reduce((a,t)=>a+t.totalCancelled,0)}h
              </td>
              <td></td>
              <td style={{ textAlign:'right', fontFamily:'var(--f-mono)', fontSize:15, color:'var(--an-granate)' }}>
                {fmtC(TEACHER_HOURS_DATA.reduce((a,t)=>a+t.totalGiven*t.rate,0))}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mini calendar grid per teacher */}
      <div className="card" style={{ padding:18 }}>
        <div className="card-h">
          <div className="card-title">Calendario por docente · Abril 2026</div>
          <div style={{ fontSize:11, color:'var(--ink-3)', display:'flex', gap:14 }}>
            <span><span style={{ display:'inline-block', width:10, height:10, background:'var(--ok)', borderRadius:2, marginRight:4 }} /> Dada</span>
            <span><span style={{ display:'inline-block', width:10, height:10, background:'var(--warn)', borderRadius:2, marginRight:4 }} /> Cancelada</span>
            <span><span style={{ display:'inline-block', width:10, height:10, background:'var(--bg-deep)', borderRadius:2, marginRight:4 }} /> Sin clase</span>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {TEACHER_HOURS_DATA.map(t => (
            <TeacherCalendarRow key={t.id} teacher={t} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TeacherCalendarRow({ teacher }) {
  // Generate 30 days of Abril with random pattern deterministic by teacher id
  const seed = teacher.id.charCodeAt(1);
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = i + 1;
    const hasClass = (d + seed) % 2 === 0 && ![4,5,11,12,18,19,25,26].includes(d);
    if (!hasClass) return { d, type: 'none' };
    const cancelled = (d * seed) % 17 === 0;
    return { d, type: cancelled ? 'cancelled' : 'given' };
  });

  return (
    <div style={{ display:'grid', gridTemplateColumns:'180px 1fr auto', gap:12, alignItems:'center' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:28, height:28, borderRadius:'50%', background:teacher.color, color:'white', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{teacher.avatar}</div>
        <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{teacher.name}</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(30, 1fr)', gap:2 }}>
        {days.map((d, i) => (
          <div key={i} title={`Día ${d.d} · ${d.type==='given'?'Dada':d.type==='cancelled'?'Cancelada':'Sin clase'}`} style={{
            height: 22, borderRadius:3,
            background: d.type==='given' ? 'var(--ok)' : d.type==='cancelled' ? 'var(--warn)' : 'var(--bg-deep)',
            opacity: d.type==='none' ? 0.4 : 1,
          }} />
        ))}
      </div>
      <div style={{ fontSize:11, color:'var(--ink-2)', textAlign:'right', minWidth:90 }}>
        <div style={{ color:'var(--ok)', fontWeight:700, fontFamily:'var(--f-mono)' }}>{teacher.totalGiven}h dadas</div>
        {teacher.totalCancelled > 0 && <div style={{ color:'var(--warn)', fontFamily:'var(--f-mono)' }}>{teacher.totalCancelled}h canc.</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// WELCOME MODAL — aparece post-login primera vez
// ─────────────────────────────────────────────────────────────────────────
function WelcomeBanner({ onClose }) {
  // F96.5 UX/INA — primer ingreso con datos a la mano y material obligatorio.
  // Es una guía visual; la evidencia oficial de lectura debe cerrarse en backend
  // cuando exista endpoint específico. No inventamos confirmación oficial aquí.
  const u = (() => {
    try { return JSON.parse(sessionStorage.getItem('an_usuario') || 'null') || {}; }
    catch { return {}; }
  })();
  const primerNombre = (() => {
    const n = String(u?.nombre || '').trim().split(/\s+/).filter(Boolean)[0] || '';
    return n ? n.charAt(0).toUpperCase() + n.slice(1).toLowerCase() : '';
  })();
  const datos = [
    ['Nombre', u?.nombre || 'Verificar en Mi Campus'],
    ['Cédula', u?.cedula || 'Verificar en Mi Campus'],
    ['Código', u?.codigo || u?.REC_M || 'Verificar en Mi Campus'],
    ['Grupo', u?.grupo || u?.grupoActivo || 'Verificar en Mi Campus'],
    ['Nivel', u?.nivel_activo || u?.nivel || 'Verificar en Mi Campus'],
  ];
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(20,18,30,0.68)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:200, padding:20,
    }}>
      <div style={{
        background:'var(--surface)', borderRadius:'var(--r-lg)',
        maxWidth:760, width:'100%', overflow:'hidden',
        boxShadow:'0 22px 70px rgba(0,0,0,0.34)', border:'1px solid rgba(255,255,255,.25)'
      }}>
        <div style={{
          padding:'30px 32px 22px',
          background:'linear-gradient(135deg, var(--an-granate) 0%, var(--an-red) 55%, #7A1E2C 100%)',
          color:'white', position:'relative', overflow:'hidden'
        }}>
          <div style={{ position:'absolute', right:-34, top:-52, fontFamily:'var(--f-serif)', fontSize:180, opacity:.08, lineHeight:1 }}>A</div>
          <div style={{ fontSize:10, fontWeight:900, letterSpacing:'0.18em', textTransform:'uppercase', opacity:0.86 }}>
            Academia Norteamericana · Campus Virtual
          </div>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:36, fontWeight:500, letterSpacing:'-0.03em', marginTop:5, lineHeight:1.05 }}>
            Bienvenido{primerNombre ? `, ${primerNombre}` : ''}.
          </div>
          <div style={{ fontSize:13.5, opacity:0.92, marginTop:9, lineHeight:1.55, maxWidth:590 }}>
            Antes de usar el campus, tenés que tener tus datos académicos a mano y revisar el material obligatorio de lectura. Esta guía queda disponible desde <strong>Mi Campus</strong> e <strong>Información del Programa</strong>.
          </div>
        </div>

        <div style={{ padding:'20px 30px 26px', display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(260px,.8fr)', gap:18 }}>
          <div>
            <div style={{ fontSize:10.5, fontWeight:900, letterSpacing:'0.13em', textTransform:'uppercase', color:'var(--an-granate)', marginBottom:10 }}>
              Material obligatorio antes de empezar
            </div>
            {PRIORITY_BLOCK.items.filter(i => i.required).map(item => (
              <div key={item.id} style={{
                padding:'10px 12px', background:'var(--surface-2)', borderRadius:10,
                display:'flex', alignItems:'center', gap:10, marginBottom:7,
                border:'1px solid var(--line)'
              }}>
                <span style={{ fontFamily:'var(--f-mono)', fontSize:10, color:'var(--an-granate)', fontWeight:900, minWidth:46 }}>{item.code}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:'var(--ink)' }}>{item.title}</div>
                  <div style={{ fontSize:11, color:'var(--ink-3)', lineHeight:1.35 }}>{item.desc}</div>
                </div>
                <span style={{ fontSize:11, color:'var(--ink-3)', fontWeight:700 }}>~{item.minutes}min</span>
              </div>
            ))}
          </div>

          <div style={{ border:'1px solid var(--line)', borderRadius:14, overflow:'hidden', background:'#fff' }}>
            <div style={{ padding:'13px 14px', background:'linear-gradient(135deg, color-mix(in srgb, var(--an-navy) 8%, white), #fff)', borderBottom:'1px solid var(--line)' }}>
              <div style={{ fontSize:10, fontWeight:900, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--an-navy)' }}>Tus datos</div>
              <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:2 }}>Verificalos en Mi Campus.</div>
            </div>
            <div>
              {datos.map(([label,value]) => (
                <div key={label} style={{ padding:'9px 14px', borderBottom:'1px solid var(--line)' }}>
                  <div style={{ fontSize:9.5, fontWeight:900, letterSpacing:'.11em', textTransform:'uppercase', color:'var(--ink-3)' }}>{label}</div>
                  <div style={{ fontSize:12.5, fontWeight:800, color:'var(--ink)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ gridColumn:'1 / -1', display:'flex', gap:10, marginTop:2, justifyContent:'flex-end', flexWrap:'wrap' }}>
            <button onClick={onClose} className="btn btn-ghost">Entrar a Mi Campus</button>
            <button onClick={onClose} className="btn btn-primary">Entendido, revisaré el material →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// INFO PROGRAMA — Documentos institucionales (Info General 1.1–1.4)
// Reglamento estudiantil, netiqueta, video de bienvenida y guías.
// Endpoint: getInfoGeneral (sin parámetros). La sección la ven TODOS los
// estudiantes (INA y SIN_INA por igual): el reglamento aplica a todos.
//
// REGLA DE HOOKS: useState/useEffect SIEMPRE antes de cualquier return
// condicional. (Bug "Rendered more hooks" ya hizo crashear MaterialesView
// antes — no repetir el patrón.)
// ─────────────────────────────────────────────────────────────────────────
function InfoProgramaView() {
  const [docs, setDocs]       = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError]     = React.useState('');

  const cargar = React.useCallback(() => {
    setLoading(true);
    setError('');
    // FIX STUDENT-PANEL-001 (R3): getInfoGeneral por POST seguro (token en el
    // body via postSyllabus), NUNCA GET con token en la URL. Si el backend aún
    // no expone la función (p. ej. "Función GET/POST no reconocida"), mostramos
    // un mensaje controlado en vez del texto técnico crudo.
    postSyllabus('getInfoGeneral')
      .then(d => {
        if (d && d.ok) {
          const lista = Array.isArray(d.docs) ? d.docs.slice() : [];
          lista.sort((a, b) => (a.orden || 0) - (b.orden || 0));
          setDocs(lista);
          return;
        }
        const raw = String((d && d.error) || '').toLowerCase();
        if (raw.includes('no reconocida') || raw.includes('getinfogeneral') || raw.includes('not found')) {
          setError('La información general del programa aún no está disponible.');
        } else if (raw.includes('autoriz')) {
          setError('No tenés autorización para ver esta información. Si creés que es un error, contactá a la administración.');
        } else {
          setError('No pudimos cargar la información del programa. Intentá de nuevo.');
        }
      })
      .catch(() => setError('No pudimos cargar la información del programa. Intentá de nuevo.'))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { cargar(); }, [cargar]);

  // ── render ─────────────────────────────────────────────────────────────
  const header = (
    <PageHeader
      kicker="Documentos institucionales"
      title="Información del Programa"
      sub="Reglamentos, guías y video de bienvenida — material institucional para todos los estudiantes"
      right={<Chip tone="navy">Info general</Chip>}
    />
  );

  if (loading) {
    return (
      <div>
        {header}
        <LoadingState title="Cargando documentos del programa…" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        {header}
        <ErrorState message={error} onRetry={cargar} />
      </div>
    );
  }

  if (!docs.length) {
    return (
      <div>
        {header}
        <div style={{ padding:'40px 20px', textAlign:'center', color:'var(--ink-2)', background:'white', border:'1px solid var(--line)', borderRadius:'var(--r-lg)' }}>
          No hay documentos disponibles en este momento.
        </div>
      </div>
    );
  }

  return (
    <div>
      {header}
      <div style={{ display:'grid', gap:16 }}>
        {docs.map((doc) => (
          <InfoProgramaCard key={doc.codigo || doc.seccion} doc={doc} />
        ))}
      </div>
      <RevisadoSesionBtn />
      {/* STUDENT-CONTACT-ADMIN-002: dudas de reglamento/netiqueta/proceso →
          contacto ACADÉMICO dinámico. Solo aparece si hay número real. */}
      {typeof window.ContactoAdmin === 'function' && (
        <div className="card" style={{ marginTop:14, padding:'14px 18px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:220, fontSize:13, color:'var(--ink-2)' }}>
            <strong style={{ color:'var(--ink)' }}>¿Dudas sobre el reglamento o el proceso académico?</strong>
          </div>
          <window.ContactoAdmin tipo="academico" hideWhenPending />
        </div>
      )}
    </div>
  );
}

// STUDENT-LEARNING-EXPERIENCE-001 (PARTE D): confirmación de lectura HONESTA.
// No hay endpoint de persistencia, así que solo recordamos el clic en ESTA
// sesión y lo decimos explícitamente. No sustituye ningún registro oficial.
function RevisadoSesionBtn() {
  const KEY = 'an_info_revisado_sesion';
  const [ok, setOk] = React.useState(() => {
    try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; }
  });
  const marcar = () => { try { sessionStorage.setItem(KEY, '1'); } catch {} setOk(true); };
  return (
    <div className="card" style={{ marginTop:18, padding:'16px 18px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', borderStyle:'dashed' }}>
      <div style={{ flex:1, minWidth:220 }}>
        <div style={{ fontWeight:600, fontSize:14, color:'var(--ink)' }}>Confirmación de lectura</div>
        <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:2, lineHeight:1.5 }}>
          Esta acción no sustituye el registro oficial; queda guardada solo en esta sesión.
        </div>
      </div>
      {ok ? (
        <span style={{ display:'inline-flex', alignItems:'center', gap:6, color:'var(--ok)', fontWeight:600, fontSize:13 }}>✓ Revisado en esta sesión</span>
      ) : (
        <button className="btn btn-primary" onClick={marcar}>Ya lo revisé en esta sesión</button>
      )}
    </div>
  );
}

// Tarjeta individual — un doc del programa (PDF o video).
// Hooks arriba, returns abajo.
function InfoProgramaCard({ doc }) {
  const esVideo = doc.tipo === 'video';
  const url_view    = doc.url_view    || doc.url_preview || '';
  const url_preview = doc.url_preview || doc.url_view    || '';

  return (
    <div style={{
      background:'white',
      border:'1px solid var(--line)',
      borderRadius:'var(--r-lg)',
      padding:'18px 20px',
      boxShadow:'0 1px 2px rgba(15,30,60,0.04)',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
        <div style={{
          width:44, height:44, borderRadius:'var(--r-md)',
          background: esVideo ? 'color-mix(in srgb, var(--an-granate) 12%, white)' : 'color-mix(in srgb, var(--an-navy) 10%, white)',
          color: esVideo ? 'var(--an-granate)' : 'var(--an-navy)',
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        }}>
          <Icon name={esVideo ? 'play' : 'doc'} size={22} />
        </div>
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ fontSize:11, fontFamily:'var(--font-mono, monospace)', color:'var(--ink-2)', letterSpacing:'0.04em' }}>
            {doc.codigo ? `${doc.codigo} · ` : ''}{esVideo ? 'Video institucional' : 'Documento PDF'}
          </div>
          <div style={{ fontWeight:700, fontSize:16, color:'var(--an-navy)', marginTop:2 }}>
            {doc.seccion}
          </div>
          {doc.nombre && doc.nombre !== doc.seccion && (
            <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:2 }}>{doc.nombre}</div>
          )}
        </div>
        {!esVideo && url_view && (
          <a
            href={url_view}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ fontSize:13, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6 }}
          >
            Abrir <Icon name="arrow" size={14} />
          </a>
        )}
      </div>

      {esVideo && url_preview && (
        <div style={{
          marginTop:14,
          position:'relative',
          width:'100%',
          paddingTop:'56.25%', // 16:9
          background:'#000',
          borderRadius:'var(--r-md)',
          overflow:'hidden',
        }}>
          <iframe
            src={url_preview}
            title={doc.seccion}
            allow="autoplay; encrypted-media"
            allowFullScreen
            style={{
              position:'absolute', top:0, left:0, width:'100%', height:'100%',
              border:'0',
            }}
          />
        </div>
      )}
    </div>
  );
}

Object.assign(window, { MaterialesView, InfoProgramaView, CalendarioView, ICANViewNew, AdminHorasDocentesView, WelcomeBanner, PriorityBanner });