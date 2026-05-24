/* global React, Icon, Chip, PageHeader, PRIORITY_BLOCK, SYLLABUS_BY_LEVEL, ICAN_SLOTS_AFTER,
   ICAN_CATALOG, ICAN_HISTORY,
   buildGroupSchedule, fmtDate, fmtDateLong, MONTHS_ES */

// URL del Apps Script: fuente única en data.jsx → window.APPS_SCRIPT_URL
const SCRIPT_URL_SV = window.APPS_SCRIPT_URL;

const LEVEL_LABEL = {
  b1:'Básico I', b2:'Básico II',
  i1:'Intermedio I', i2:'Intermedio II',
  a1:'Avanzado I', a2:'Avanzado II',
};
const DIAS_LABEL = { LM:'Lun/Mié', KJ:'Mar/Jue', LJ:'Lun/Jue', SA:'Sáb' };

// Hook: lee usuario de session, llama getGrupoInfo, devuelve { grupoInfo, codGrupo, grupo, loading }
function useGroupFromSession() {
  const [grupoInfo, setGrupoInfo] = React.useState(null);
  const [loading, setLoading]     = React.useState(true);
  const codGrupo = React.useMemo(() => {
    const usr = JSON.parse(sessionStorage.getItem('an_usuario') || 'null');
    return usr?.grupo || usr?.grupos?.[0] || '';
  }, []);

  React.useEffect(() => {
    if (!codGrupo) { setLoading(false); return; }
    fetch(`${SCRIPT_URL_SV}?fn=getGrupoInfo&cod_grupo=${encodeURIComponent(codGrupo)}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setGrupoInfo(d); })
      .finally(() => setLoading(false));
  }, [codGrupo]);

  // Construye el objeto que espera buildGroupSchedule
  const grupo = React.useMemo(() => {
    if (!grupoInfo || !codGrupo) return null;
    const partes   = codGrupo.split('-');
    const diasCode = (partes[1] || 'LM').replace(/\d/g, '').toUpperCase();
    return {
      code:         codGrupo,
      levelId:      grupoInfo.levelId || 'b1',
      scheduleDays: DIAS_LABEL[diasCode] || 'Lun/Mié',
      startDate:    grupoInfo.startDate,
      teacher:      grupoInfo.teacherName || '',
    };
  }, [grupoInfo, codGrupo]);

  return { grupoInfo, grupo, codGrupo, loading };
}

// (SyllabusLoadingState eliminado — usa <LoadingState/> de primitives.jsx.)

// ─────────────────────────────────────────────────────────────────────────
// SYLLABUS + SCHEDULE — shared by Materiales, Calendario, Docente, Admin
// ─────────────────────────────────────────────────────────────────────────

const TODAY = new Date();
TODAY.setHours(0,0,0,0);

function useScheduleState(grupoInfo, grupo) {
  // Generamos schedule a partir del grupo real (suspensiones aún no implementadas → [])
  const schedule = React.useMemo(() => {
    if (!grupoInfo || !grupo?.startDate) return [];
    return buildGroupSchedule(grupoInfo.levelId || 'b1', grupo, []);
  }, [grupoInfo, grupo]);
  // Marcar done/next/future basándonos en HOY
  return React.useMemo(() => schedule.map(s => {
    const st = (() => {
      if (s.status === 'suspended' || s.status === 'rescheduled') {
        // Si ya pasó la fecha nueva => done; si no, upcoming
        if (s.status === 'rescheduled' && s.date < TODAY) return 'done-rescheduled';
        return s.status;
      }
      if (s.date < TODAY) return 'done';
      // mismo día
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
// MATERIALES — sílabus completo, pestañas Actuales/Futuras/Completadas
// ─────────────────────────────────────────────────────────────────────────
function MaterialesView({ initialLesson = null } = {}) {
  const { grupoInfo, grupo, loading } = useGroupFromSession();
  const schedule = useScheduleState(grupoInfo, grupo);
  if (loading) return <LoadingState title="Cargando datos del grupo…" />;
  if (!grupoInfo || !grupo) return <LoadingState title="No se encontró el grupo del estudiante." />;
  const [tab, setTab] = React.useState('calendario'); // calendario | futuras | completadas | todas
  const [open, setOpen] = React.useState(initialLesson);

  // If opened with a lesson, jump to "todas" tab so the row is in view
  React.useEffect(() => {
    if (initialLesson) {
      setTab('todas');
      // scroll the detail into view after next paint
      setTimeout(() => {
        const el = document.getElementById(`lesson-row-${initialLesson}`);
        if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 50);
    }
  }, [initialLesson]);

  const filter = (s) => {
    if (tab === 'todas') return true;
    if (tab === 'futuras') return s.computedStatus === 'upcoming';
    if (tab === 'completadas') return s.computedStatus === 'done' || s.computedStatus === 'done-rescheduled';
    return true;
  };

  const filtered = schedule.filter(filter);

  return (
    <div>
      <PageHeader
        kicker="Sílabus oficial del nivel"
        title={<>Materiales · <em>Básico I</em></>}
        sub="Interchange Intro (5ª ed.) · 32 lecciones · A1 — todo el material del nivel en un solo lugar"
        right={
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <Chip tone="navy">INA 2519</Chip>
            <Chip tone="gold">A1 · MCER</Chip>
          </div>
        }
      />

      {/* Banner prioridad INA */}
      <PriorityBanner />

      {/* Resumen del nivel */}
      <div className="card" style={{ padding:'20px 24px', marginBottom:18 }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:20, alignItems:'center' }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3)' }}>
              Objetivo general
            </div>
            <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:4, lineHeight:1.5 }}>
              {SYLLABUS_BY_LEVEL.b1.objective}
            </div>
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3)' }}>Libro</div>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:16, fontWeight:500, color:'var(--an-navy-ink)', marginTop:3, lineHeight:1.2 }}>
              Interchange Intro
            </div>
            <div style={{ fontSize:11, color:'var(--ink-3)' }}>Cambridge · 5ª ed.</div>
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3)' }}>Duración</div>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:16, fontWeight:500, color:'var(--an-navy-ink)', marginTop:3 }}>
              128 h
            </div>
            <div style={{ fontSize:11, color:'var(--ink-3)' }}>96 módulo + 32 I CAN</div>
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3)' }}>Plataforma</div>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:16, fontWeight:500, color:'var(--an-navy-ink)', marginTop:3 }}>
              Zoom
            </div>
            <div style={{ fontSize:11, color:'var(--ink-3)' }}>Contingencia: Meet</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom:14 }}>
        {[
          ['calendario', 'Calendario', schedule.length],
          ['futuras', 'Futuras', schedule.filter(s => s.computedStatus==='upcoming').length],
          ['completadas', 'Completadas', schedule.filter(s => s.computedStatus==='done' || s.computedStatus==='done-rescheduled').length],
          ['todas', 'Todas las 32', 32],
        ].map(([k,l,n]) => (
          <button key={k} className={`tab ${tab===k?'active':''}`} onClick={() => setTab(k)}>
            {l} <span style={{ opacity:0.5, marginLeft:6, fontSize:11, fontFamily:'var(--f-mono)' }}>{n}</span>
          </button>
        ))}
      </div>

      {tab === 'calendario' ? (
        <InlineCalendar schedule={schedule} onOpenLesson={(n) => { setOpen(n); setTab('todas'); setTimeout(() => { const el = document.getElementById(`lesson-row-${n}`); if (el) el.scrollIntoView({ block:'center', behavior:'smooth' }); }, 60); }} />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map(s => <LessonRow key={s.n} lesson={s} isOpen={open===s.n} onToggle={() => setOpen(v => v===s.n ? null : s.n)} />)}
          {filtered.length === 0 && (
            <div className="card" style={{ padding:40, textAlign:'center', color:'var(--ink-3)', borderStyle:'dashed' }}>
              No hay lecciones en esta categoría.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// INLINE CALENDAR — shown as the "Calendario" tab inside Materiales
// ─────────────────────────────────────────────────────────────────────────
function InlineCalendar({ schedule, onOpenLesson }) {
  const [month, setMonth] = React.useState(TODAY.getMonth());
  const [year, setYear] = React.useState(TODAY.getFullYear());
  const [selected, setSelected] = React.useState(null);
  const [showSuspendModal, setShowSuspendModal] = React.useState(null);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells = [];
  for (let i = 0; i < startWeekDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

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
    <>
      {/* Legend */}
      <div style={{
        display:'flex', gap:14, flexWrap:'wrap', padding:'10px 14px',
        background:'var(--surface-2)', border:'1px solid var(--line)',
        borderRadius:'var(--r-md)', marginBottom:14, fontSize:11,
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
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <button className="btn btn-ghost" onClick={() => navMonth(-1)}>← Mes anterior</button>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, color:'var(--an-navy-ink)', textTransform:'capitalize' }}>
              {new Date(year, month, 1).toLocaleDateString('es-CR', { month:'long', year:'numeric' })}
            </div>
            <button className="btn btn-ghost" onClick={() => navMonth(1)}>Mes siguiente →</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4, marginBottom:4 }}>
            {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
              <div key={d} style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-3)', textAlign:'center', padding:'4px 0' }}>{d}</div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4 }}>
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const lessons = lessonsByDate[d.toDateString()] || [];
              const isToday = d.toDateString() === TODAY.toDateString();
              return (
                <div key={i} style={{
                  minHeight: 70, padding: 6,
                  background: isToday ? 'color-mix(in srgb, var(--an-granate) 8%, white)' : 'var(--surface)',
                  border: isToday ? '2px solid var(--an-granate)' : '1px solid var(--line)',
                  borderRadius: 6,
                  cursor: lessons.length ? 'pointer' : 'default',
                  opacity: d < TODAY && lessons.length === 0 ? 0.5 : 1,
                }}
                onClick={() => lessons[0] && setSelected(lessons[0])}>
                  <div style={{ fontSize: 11, fontWeight: isToday ? 700 : 500, color: isToday ? 'var(--an-granate)' : 'var(--ink-2)', marginBottom: 3 }}>{d.getDate()}</div>
                  {lessons.map(l => (
                    <div key={l.n} style={{
                      fontSize: 9, padding:'2px 4px', marginBottom:2, borderRadius:3,
                      background: l.computedStatus==='done' || l.computedStatus==='done-rescheduled' ? 'var(--ok)'
                        : l.computedStatus==='today' ? 'var(--an-granate)'
                        : l.computedStatus==='rescheduled' ? 'var(--an-gold)'
                        : l.computedStatus==='suspended' ? 'var(--warn)'
                        : 'var(--an-navy)',
                      color:'white', fontWeight:600,
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
          {!selected ? (
            <>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:6 }}>
                Próximas lecciones
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {schedule.filter(s => s.computedStatus === 'today' || s.computedStatus === 'upcoming' || s.computedStatus === 'rescheduled').slice(0,5).map(s => (
                  <div key={s.n} onClick={() => setSelected(s)} style={{
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
                  </div>
                ))}
              </div>
            </>
          ) : (
            <LessonDetailPanel
              lesson={selected}
              onClose={() => setSelected(null)}
              onSuspendRequest={() => setShowSuspendModal(selected)}
              onOpenMaterials={() => onOpenLesson(selected.n)} />
          )}
        </div>
      </div>

      {showSuspendModal && (
        <SuspendModal lesson={showSuspendModal} onClose={() => setShowSuspendModal(null)} />
      )}
    </>
  );
}

function LessonRow({ lesson, isOpen, onToggle }) {
  return <LessonRowInner lesson={lesson} isOpen={isOpen} onToggle={onToggle} />;
}

function LessonRowInner({ lesson, isOpen, onToggle }) {
  const s = lesson;
  const statusMeta = {
    'done':              { label:'Completada',  color:'var(--ok)',         dot:'var(--ok)' },
    'done-rescheduled':  { label:'Dada (recuperada)', color:'var(--ok)',   dot:'var(--ok)' },
    'today':             { label:'Hoy',         color:'var(--an-granate)', dot:'var(--an-granate)' },
    'upcoming':          { label:'Próxima',     color:'var(--an-navy)',    dot:'var(--an-navy)' },
    'suspended':         { label:'Suspendida (cascada)', color:'var(--warn)', dot:'var(--warn)' },
    'rescheduled':       { label:'Reprogramada', color:'var(--an-gold)',   dot:'var(--an-gold)' },
  }[s.computedStatus] || { label:'Planificada', color:'var(--ink-3)', dot:'var(--ink-3)' };

  const kindMeta = {
    'lesson':       { label:'Lección',        bg:'color-mix(in srgb, var(--an-navy) 10%, white)', color:'var(--an-navy)' },
    'exam-oral':    { label:'Examen Oral',    bg:'color-mix(in srgb, var(--an-granate) 12%, white)', color:'var(--an-granate-ink)' },
    'exam-written': { label:'Examen Escrito', bg:'color-mix(in srgb, var(--an-granate) 12%, white)', color:'var(--an-granate-ink)' },
  }[s.kind];

  return (
    <div id={`lesson-row-${lesson.n}`} className="card" style={{
      padding: 0,
      borderLeft: `4px solid ${statusMeta.dot}`,
      overflow:'hidden',
    }}>
      <div
        onClick={onToggle}
        style={{
          padding:'14px 18px',
          display:'grid',
          gridTemplateColumns:'auto auto 1fr auto auto',
          gap:16,
          alignItems:'center',
          cursor:'pointer',
        }}>
        {/* Número */}
        <div style={{
          width:44, height:44, borderRadius:10,
          background: s.computedStatus==='done' || s.computedStatus==='done-rescheduled' ? 'var(--ok)'
            : s.computedStatus==='today' ? 'var(--an-granate)'
            : s.computedStatus==='suspended' ? 'var(--warn)'
            : s.computedStatus==='rescheduled' ? 'var(--an-gold)'
            : 'var(--bg-deep)',
          color: s.computedStatus==='upcoming' ? 'var(--ink-2)' : 'white',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          flexShrink:0,
        }}>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.08em', opacity:0.85 }}>LEC</div>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:18, fontWeight:600, lineHeight:1 }}>{String(s.n).padStart(2,'0')}</div>
        </div>

        {/* Kind badge */}
        <div style={{
          padding:'4px 10px', borderRadius:'var(--r-pill)',
          background: kindMeta.bg, color: kindMeta.color,
          fontSize:10, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase',
          whiteSpace:'nowrap',
        }}>
          {kindMeta.label}
        </div>

        {/* Title */}
        <div style={{ minWidth:0 }}>
          <div style={{ display:'flex', gap:8, alignItems:'baseline', flexWrap:'wrap' }}>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:16, fontWeight:500, color:'var(--ink)', letterSpacing:'-0.01em' }}>
              {s.title}
            </div>
            {s.progress && <Chip tone="gold">Progress Check</Chip>}
          </div>
          <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>
            {s.unit} · {fmtDateLong(s.date)}
            {s.computedStatus === 'rescheduled' && s.suspension && (
              <span style={{ color:'var(--warn)', fontWeight:600, marginLeft:8 }}>
                · reprogramada desde {fmtDate(s.baseDate)}
              </span>
            )}
          </div>
        </div>

        {/* Status */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3, minWidth:90 }}>
          <div style={{
            padding:'3px 8px', borderRadius:'var(--r-pill)',
            background: `color-mix(in srgb, ${statusMeta.color} 14%, white)`,
            color: statusMeta.color,
            fontSize:10, fontWeight:700, letterSpacing:'0.05em',
            whiteSpace:'nowrap',
          }}>
            {statusMeta.label}
          </div>
          <div style={{ fontSize:11, color:'var(--ink-3)', fontFamily:'var(--f-mono)' }}>{s.hours}h</div>
        </div>

        {/* Chevron */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition:'transform .2s' }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>

      {isOpen && (
        <div style={{ padding:'0 18px 16px', display:'grid', gridTemplateColumns:'2fr 1fr', gap:18 }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--an-granate)', marginBottom:6 }}>
              Objetivo específico
            </div>
            <div style={{ fontSize:13, color:'var(--ink)', marginBottom:14, lineHeight:1.45 }}>
              {s.objective}
            </div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--an-granate)', marginBottom:6 }}>
              Situación de aprendizaje
            </div>
            <div style={{ fontSize:13, color:'var(--ink-2)', lineHeight:1.45 }}>
              {s.activity}
            </div>
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:6 }}>
              Materiales de la lección
            </div>
            {[
              { t:'Planeamiento — Estudiante', tone:'red',  type:'PDF', sub:'~3 pp' },
              { t:'Planeamiento — Docente',    tone:'granate', type:'PDF', sub:'uso interno' },
              s.kind === 'lesson' && { t:`Libro · ${s.unit} (páginas asignadas)`, tone:'navy', type:'PDF', sub:'Interchange Intro' },
              s.kind === 'lesson' && { t:'Audio Self-Study', tone:'navy', type:'MP3', sub:'~8 min' },
              s.kind === 'exam-oral' && { t:'Rúbrica oficial', tone:'granate', type:'PDF', sub:'INA 2519' },
              s.kind === 'exam-written' && { t:'Formulario FORMS / Drive', tone:'granate', type:'Link', sub:'evaluación' },
            ].filter(Boolean).map((m, i) => (
              <div key={i} style={{
                padding:'8px 10px', background:'var(--surface-2)', borderRadius:8,
                display:'flex', alignItems:'center', gap:10, marginBottom:6,
              }}>
                <span style={{
                  padding:'2px 6px', borderRadius:4,
                  background: m.tone==='red' ? 'color-mix(in srgb, var(--danger) 14%, white)'
                    : m.tone==='granate' ? 'color-mix(in srgb, var(--an-granate) 14%, white)'
                    : 'color-mix(in srgb, var(--an-navy) 14%, white)',
                  color: m.tone==='red' ? 'var(--danger)' : m.tone==='granate' ? 'var(--an-granate)' : 'var(--an-navy)',
                  fontSize:9, fontWeight:700, letterSpacing:'0.06em',
                }}>{m.type}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:'var(--ink)' }}>{m.t}</div>
                  <div style={{ fontSize:10, color:'var(--ink-3)' }}>{m.sub}</div>
                </div>
                <button className="btn btn-icon btn-ghost" title="Descargar">
                  <Icon name="download" size={13} className="" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detalle de suspensión si aplica */}
      {(s.computedStatus === 'suspended' || s.computedStatus === 'rescheduled') && s.suspension && !isOpen && (
        <div style={{
          padding:'8px 18px 12px',
          background: 'color-mix(in srgb, var(--warn) 4%, white)',
          borderTop:'1px dashed var(--warn)',
          fontSize:11, color:'var(--ink-2)',
        }}>
          <strong style={{ color:'var(--warn)' }}>{s.suspension.reason}</strong>
          {' · '}reportada por <strong>{s.suspension.byName}</strong>
          {s.suspension.detail && <> — {s.suspension.detail}</>}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// CALENDARIO — cronograma del grupo con suspender/recuperar
// ─────────────────────────────────────────────────────────────────────────
function CalendarioView() {
  const { grupoInfo, grupo, codGrupo, loading } = useGroupFromSession();
  const schedule = useScheduleState(grupoInfo, grupo);
  if (loading) return <LoadingState title="Cargando datos del grupo…" />;
  if (!grupoInfo || !grupo) return <LoadingState title="No se encontró el grupo del estudiante." />;
  const nivelLbl = LEVEL_LABEL[grupoInfo.levelId] || grupoInfo.levelId || '—';
  const [month, setMonth] = React.useState(TODAY.getMonth());
  const [year, setYear] = React.useState(TODAY.getFullYear());
  const [selectedLesson, setSelectedLesson] = React.useState(null);
  const [showSuspendModal, setShowSuspendModal] = React.useState(null);

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
  const [tab, setTab] = React.useState('proximas'); // proximas | historial

  const alerts = ICAN_CATALOG.filter(s => s.enrolled >= 15);

  return (
    <div>
      <PageHeader
        kicker="Club de conversación"
        title={<>Club <em>I CAN</em></>}
        sub="Sesiones semanales de conversación · sin costo para matriculados · cupo máx. 20 por sesión"
        right={<Chip tone="gold">16 sesiones · abr 2026</Chip>}
      />

      {/* KPI strip */}
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:18,
      }}>
        {[
          ['Esta semana', ICAN_CATALOG.length, 'sesiones abiertas'],
          ['Ocupación promedio', Math.round(ICAN_CATALOG.reduce((a,s)=>a+s.enrolled,0) / ICAN_CATALOG.length / 20 * 100) + '%', 'del cupo'],
          ['Sesiones cerca del límite', alerts.length, '15+ inscritos'],
          ['Dadas (mes)', ICAN_HISTORY.filter(h => h.status==='given').length, `de ${ICAN_HISTORY.length} programadas`],
        ].map(([l,n,s], i) => (
          <div key={i} className="card" style={{ padding:14 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-3)' }}>{l}</div>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:28, fontWeight:500, color:'var(--an-navy-ink)', letterSpacing:'-0.025em', marginTop:3 }}>{n}</div>
            <div style={{ fontSize:11, color:'var(--ink-3)' }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Alertas de cupo */}
      {alerts.length > 0 && (role === 'teacher' || role === 'admin') && (
        <div style={{
          padding:'14px 16px', marginBottom:16,
          background:'color-mix(in srgb, var(--warn) 8%, white)',
          border:'1px solid var(--warn)', borderRadius:'var(--r-md)',
          display:'flex', gap:12, alignItems:'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div style={{ flex:1 }}>
            <strong style={{ fontSize:13 }}>Atención — {alerts.length} sesión{alerts.length>1?'es':''} cerca del cupo máximo</strong>
            <div style={{ fontSize:11, color:'var(--ink-2)', marginTop:2 }}>
              Es momento de considerar abrir una sesión adicional con otro docente.
            </div>
          </div>
          <button className="btn btn-primary" style={{ fontSize:12 }}>Abrir sesión adicional</button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom:14 }}>
        <button className={`tab ${tab==='proximas'?'active':''}`} onClick={() => setTab('proximas')}>Próximas sesiones</button>
        <button className={`tab ${tab==='historial'?'active':''}`} onClick={() => setTab('historial')}>Historial</button>
      </div>

      {tab === 'proximas' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:12 }}>
          {ICAN_CATALOG.map(s => {
            const pct = (s.enrolled / s.cap) * 100;
            const nearFull = s.enrolled >= 15;
            return (
              <div key={s.id} className="card" style={{
                padding:16, cursor:'pointer',
                borderLeft: nearFull ? '4px solid var(--warn)' : '4px solid var(--an-gold)',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <Chip tone={s.level.includes('Básico I')?'gold':s.level.includes('Básico II')?'red':'navy'}>
                    {s.level}
                  </Chip>
                  {nearFull && <Chip tone="red" dot>Casi lleno</Chip>}
                </div>
                <div style={{ fontFamily:'var(--f-serif)', fontSize:18, fontWeight:500, letterSpacing:'-0.015em', color:'var(--ink)' }}>
                  {s.topic}
                </div>
                <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:3 }}>
                  {s.date} · {s.time}
                </div>
                <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>
                  {s.teacher} · {s.language}
                </div>

                <div style={{ marginTop:12, paddingTop:10, borderTop:'1px solid var(--line)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4 }}>
                    <span style={{ color:'var(--ink-3)' }}>Inscritos</span>
                    <span style={{ fontWeight:700, color: nearFull ? 'var(--warn)' : 'var(--ink)' }}>
                      {s.enrolled}/{s.cap}
                    </span>
                  </div>
                  <div style={{ height:5, background:'var(--bg-deep)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background: nearFull ? 'var(--warn)' : 'var(--ok)' }} />
                  </div>
                </div>

                <button className="btn" style={{ width:'100%', marginTop:10, background:'var(--an-gold)', color:'#6B4A00', border:'none', fontSize:12 }}>
                  Reservar cupo
                </button>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'historial' && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <table className="table-soft">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tema</th>
                <th>Docente</th>
                <th style={{ textAlign:'center' }}>Asistencia</th>
                <th>Estado</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {ICAN_HISTORY.map(h => (
                <tr key={h.id}>
                  <td style={{ fontSize:12 }}>{fmtDate(new Date(h.date))}</td>
                  <td style={{ fontSize:13, fontWeight:500 }}>{h.topic}</td>
                  <td style={{ fontSize:12 }}>{h.teacher}</td>
                  <td style={{ textAlign:'center', fontFamily:'var(--f-mono)', fontWeight:600 }}>
                    {h.status === 'cancelled' ? '—' : `${h.attended}/${h.cap}`}
                  </td>
                  <td>
                    {h.status === 'given' && <Chip tone="green" dot>Dada</Chip>}
                    {h.status === 'cancelled' && <Chip tone="red">Cancelada</Chip>}
                  </td>
                  <td style={{ fontSize:11, color:'var(--ink-3)' }}>
                    {h.status === 'cancelled' ? (
                      <>Por {h.cancelledBy} · {h.cancelReason}</>
                    ) : (
                      <>{h.duration}h dadas</>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(20,18,30,0.65)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:200, padding:20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'var(--surface)', borderRadius:'var(--r-lg)',
        maxWidth:620, width:'100%', overflow:'hidden',
        boxShadow:'0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          padding:'30px 30px 20px',
          background:'linear-gradient(135deg, var(--an-granate) 0%, var(--an-red) 100%)',
          color:'white',
        }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', opacity:0.85 }}>
            Academia Norteamericana · Campus Virtual
          </div>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:34, fontWeight:400, letterSpacing:'-0.03em', marginTop:4 }}>
            ¡Bienvenido, Santiago!
          </div>
          <div style={{ fontSize:13, opacity:0.9, marginTop:6, lineHeight:1.5 }}>
            Nos alegra tenerte en el programa. Antes de tu primera lección, revisa el material obligatorio del INA. Puedes volver a esto desde tu <strong>Perfil</strong> o desde <strong>Materiales</strong> en cualquier momento.
          </div>
        </div>
        <div style={{ padding:'20px 30px 26px' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--an-granate)', marginBottom:10 }}>
            Material obligatorio antes de empezar
          </div>
          {PRIORITY_BLOCK.items.filter(i => i.required).map(item => (
            <div key={item.id} style={{
              padding:'10px 12px', background:'var(--surface-2)', borderRadius:8,
              display:'flex', alignItems:'center', gap:10, marginBottom:6,
            }}>
              <span style={{ fontFamily:'var(--f-mono)', fontSize:10, color:'var(--ink-3)', fontWeight:700 }}>{item.code}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>{item.title}</div>
                <div style={{ fontSize:11, color:'var(--ink-3)' }}>{item.desc}</div>
              </div>
              <span style={{ fontSize:11, color:'var(--ink-3)', fontWeight:600 }}>~{item.minutes}min</span>
            </div>
          ))}

          <div style={{ display:'flex', gap:8, marginTop:18, justifyContent:'flex-end' }}>
            <button onClick={onClose} className="btn btn-ghost">Más tarde</button>
            <button onClick={onClose} className="btn btn-primary">Comenzar a revisar →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MaterialesView, CalendarioView, ICANViewNew, AdminHorasDocentesView, WelcomeBanner, PriorityBanner });
