/* global React, Icon, Ring, Chip, Stat, AnimatedBar, GRADES, ICAN_SESSIONS, HOMEWORK, MATERIALS, MESSAGES, PAYMENTS, CERTIFICATES, LEVEL_FINANCE, STUDENT, LEVELS, FEEDBACK */

const SCRIPT_URL_SM = 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';
const COD_ESTUDIANTE_SM = typeof STUDENT !== 'undefined' ? STUDENT.rec_m : '17055';

// Lee el acceso por pago expuesto por StudentDashboard vía window.__ACCESO
function estaDesbloqueada(leccionNum, acceso) {
  if (!acceso) return false;
  if (acceso.nivel === 'completo') return true;
  return acceso.leccionesDesbloqueadas.includes(Number(leccionNum));
}

function calcularInsignias(datosEst, acceso) {
  const insignias = [
    {
      id: 'primera_clase',
      titulo: 'Primera clase',
      emoji: '🎓',
      desbloqueada: (datosEst?.asistencia?.length || 0) >= 1,
    },
    {
      id: 'puntual',
      titulo: 'Siempre puntual',
      emoji: '⏰',
      desbloqueada: (() => {
        const total = datosEst?.asistencia?.length || 0;
        const presentes = (datosEst?.asistencia || []).filter(a => a.estado === 'P').length;
        return total >= 4 && presentes === total;
      })(),
    },
    {
      id: 'primer_examen',
      titulo: 'Primer examen',
      emoji: '📝',
      desbloqueada: (datosEst?.evaluaciones?.length || 0) >= 1,
    },
    {
      id: 'mitad_nivel',
      titulo: 'Mitad del camino',
      emoji: '🏃',
      desbloqueada: (acceso?.leccionesDesbloqueadas?.length || 0) >= 16,
    },
    {
      id: 'nivel_completo',
      titulo: 'Nivel completo',
      emoji: '🏆',
      desbloqueada: acceso?.nivel === 'completo' && (datosEst?.evaluaciones?.length || 0) >= 6,
    },
    {
      id: 'al_dia',
      titulo: 'Al día',
      emoji: '💳',
      desbloqueada: (datosEst?.pagos?.length || 0) >= 1,
    },
  ];
  return insignias;
}
function useAcceso() {
  const [a, setA] = React.useState(window.__ACCESO || null);
  React.useEffect(() => {
    const t = setInterval(() => {
      if (window.__ACCESO !== a) setA(window.__ACCESO || null);
    }, 600);
    return () => clearInterval(t);
  }, [a]);
  return a;
}
function LeccionLocked({ acceso }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 32, gap: 8,
      color: 'var(--ink-3)', textAlign: 'center',
    }}>
      <span style={{ fontSize: 28 }}>🔒</span>
      <div style={{ fontWeight: 600, fontSize: 14 }}>Lección bloqueada</div>
      <div style={{ fontSize: 12 }}>
        {acceso?.nivel === 'matricula'
          ? 'Pagá tu primera cuota para desbloquear esta lección.'
          : 'Pagá la siguiente cuota para continuar.'}
      </div>
    </div>
  );
}

// Mapea pagos reales del servidor al formato de LEVEL_FINANCE
function patchLevelFinance(baseFinance, pagos, otrosPagos, cuotaMensual) {
  if (!pagos && !otrosPagos && !cuotaMensual) return baseFinance;
  const todosPagos = [...(pagos||[]), ...(otrosPagos||[])];
  return baseFinance.map(level => {
    const niv = level.id?.toUpperCase(); // B1, B2, I1, I2
    const pagosNivel = todosPagos.filter(p =>
      (p.concepto||'').toUpperCase().includes(niv) ||
      (p.nivel||'').toUpperCase() === niv
    );
    const tieneMatricula = pagosNivel.some(p => (p.concepto||'').toLowerCase().includes('matr'));
    const tieneCert      = pagosNivel.some(p => (p.concepto||'').toLowerCase().includes('cert'));
    const cuotasPagadas  = pagosNivel.filter(p =>
      (p.concepto||'').toLowerCase().includes('cuota') ||
      (p.tipo||'').toLowerCase() === 'cuota'
    ).length;
    const montoBase = cuotaMensual || level.cuotas[0]?.amount || 74800;
    return {
      ...level,
      matricula: { ...level.matricula, status: tieneMatricula ? 'paid' : level.matricula.status },
      certificado: { ...level.certificado, status: tieneCert ? 'paid' : level.certificado.status },
      cuotas: level.cuotas.map((c, i) => ({
        ...c,
        amount: montoBase,
        status: i < cuotasPagadas ? 'paid' : c.status,
      })),
    };
  });
}

// ──────────────────────────────────────────────────────────────────────────
function NotasView({ toast }) {
  const acceso = useAcceso();
  const gradeColor = (g) => {
    if (g?.startsWith('A')) return 'var(--ok)';
    if (g?.startsWith('B')) return 'var(--an-navy)';
    if (g?.startsWith('C')) return 'var(--warn)';
    if (g === '—') return 'var(--ink-3)';
    return 'var(--danger)';
  };

  // Evaluaciones con nota (orales y escritos), ordenadas por lección
  const GRADES_EVAL = [...GRADES]
    .filter(g => g.type !== 'prg')
    .sort((a,b) => a.lesson - b.lesson);

  // Progress checks sin nota — solo retro
  const GRADES_PROGRESS = [...GRADES]
    .filter(g => g.type === 'prg')
    .sort((a,b) => a.lesson - b.lesson);

  const completed = GRADES_EVAL.filter(g => g.pct != null);
  const avg = completed.length ? (completed.reduce((a,g) => a + g.pct, 0) / completed.length).toFixed(1) : '—';
  const [filter, setFilter] = React.useState('all');

  return (
    <div>
      <PageHeader
        kicker="Mi rendimiento"
        title={<>Mis <em>Notas</em></>}
        sub="Historial completo de evaluaciones de Básico I · Interchange Intro"
      />

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <Stat label="Promedio acumulado" num={avg} suffix="%" sub="A − Muy bueno" subTone="ok" pct={parseFloat(avg)||0} color="var(--an-granate)" />
        <Stat label="Asistencia" num="94" suffix="%" sub="17/18 clases" subTone="ok" pct={94} color="var(--ok)" />
        <Stat label="Evaluaciones hechas" num={completed.length} suffix={`/${GRADES_EVAL.length}`} sub={`Pendientes: ${GRADES_EVAL.length - completed.length}`} subTone="" pct={(completed.length/GRADES_EVAL.length)*100} color="var(--an-navy)" />
        <Stat label="Peor / Mejor" num="80" suffix="·100" sub="Margen sólido" subTone="" pct={100} color="var(--an-gold)" />
      </div>

      {/* Tabs — sin progress checks */}
      <div className="tabs">
        {[
          ['all', 'Todo'],
          ['oral', 'Orales'],
          ['esc', 'Escritos'],
        ].map(([k, l]) => (
          <button key={k} className={`tab ${filter===k?'active':''}`} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>

      {/* Tabla de evaluaciones — sin progress checks, ordenada por lección */}
      <div className="card" style={{ padding: 0, overflow:'hidden' }}>
        <table className="table-soft">
          <thead>
            <tr>
              <th>Lec.</th>
              <th>Evaluación</th>
              <th>Fecha</th>
              <th style={{ textAlign:'right' }}>Puntaje</th>
              <th style={{ textAlign:'right' }}>%</th>
              <th>Peso</th>
              <th style={{ textAlign:'right' }}>Contribución</th>
              <th style={{ textAlign:'center' }}>Nota</th>
            </tr>
          </thead>
          <tbody>
            {GRADES_EVAL.filter(g => filter === 'all' || g.type === filter).map((g, i) => {
              const unlocked = acceso ? estaDesbloqueada(g.lesson, acceso) : true;
              if (!unlocked) {
                return (
                  <tr key={i} style={{ opacity:0.55 }}>
                    <td style={{ fontFamily:'var(--f-mono)', color:'var(--ink-3)' }}>L{String(g.lesson).padStart(2,'0')}</td>
                    <td colSpan={7} style={{ fontSize:12, color:'var(--ink-3)' }}>
                      🔒 Lección bloqueada · {acceso?.nivel === 'matricula' ? 'pagá tu primera cuota para desbloquear.' : 'pagá la siguiente cuota para continuar.'}
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={i} style={{ opacity: g.status==='pending'?0.55:1 }}>
                  <td style={{ fontFamily:'var(--f-mono)', color:'var(--ink-3)' }}>L{String(g.lesson).padStart(2,'0')}</td>
                  <td>
                    <div style={{ fontWeight:600 }}>{g.title}</div>
                    <div style={{ fontSize:11, color:'var(--ink-3)' }}>{g.unit}</div>
                  </td>
                  <td style={{ fontSize:12, color:'var(--ink-2)' }}>{g.date}</td>
                  <td style={{ textAlign:'right', fontFamily:'var(--f-mono)' }}>{g.score!=null ? `${g.score}/${g.max}` : '—'}</td>
                  <td style={{ textAlign:'right', fontWeight:600 }}>{g.pct!=null ? `${g.pct}%` : '—'}</td>
                  <td><Chip tone="navy">{g.weight}</Chip></td>
                  <td style={{ textAlign:'right', fontFamily:'var(--f-mono)', color:'var(--ink-2)' }}>{g.final}</td>
                  <td style={{ textAlign:'center' }}>
                    <span style={{
                      display:'inline-flex', alignItems:'center', justifyContent:'center',
                      width:36, height:36, borderRadius:10,
                      background: g.pct!=null ? `color-mix(in srgb, ${gradeColor(g.grade)} 14%, white)` : 'var(--bg-deep)',
                      color: gradeColor(g.grade),
                      fontFamily:'var(--f-serif)', fontSize:16, fontWeight:600,
                    }}>{g.grade}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Progress Checks — sin nota, solo como referencia */}
      {GRADES_PROGRESS.length > 0 && (
        <div style={{ marginTop:24 }}>
          <div className="card-h" style={{ padding:'0 4px', marginBottom:10 }}>
            <div className="card-title">Progress Checks <small>Evaluación formativa · sin nota</small></div>
          </div>
          <div style={{ padding:'10px 14px', background:'color-mix(in srgb, var(--an-navy) 6%, white)', border:'1px solid color-mix(in srgb, var(--an-navy) 20%, white)', borderRadius:'var(--r-md)', fontSize:12, color:'var(--an-navy-ink)', marginBottom:10 }}>
            ℹ️ Los Progress Checks son evaluaciones formativas. <strong>No tienen nota</strong> — verifican el avance por unidades y reciben retroalimentación del docente.
          </div>
          {GRADES_PROGRESS.map((g, i) => (
            <div key={i} className="fb" style={{ marginBottom:8 }}>
              <div className="fb-meta">L{String(g.lesson).padStart(2,'0')} · {g.unit} · {g.date}</div>
              <div className="fb-text" style={{ color:'var(--ink-3)', fontStyle:'italic' }}>Sin retroalimentación registrada</div>
            </div>
          ))}
        </div>
      )}

      {/* Feedback del docente */}
      <div style={{ marginTop:24 }}>
        <div className="card-h" style={{ padding:'0 4px' }}>
          <div className="card-title">Retroalimentación del docente</div>
          <Chip tone="granate">{FEEDBACK.length} comentarios</Chip>
        </div>
        {FEEDBACK.map((f,i) => (
          <div key={i} className="fb">
            <div className="fb-meta">L{f.lesson} · {f.date} · {f.teacher}</div>
            <div className="fb-text">{f.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
function TareasView({ toast }) {
  const pending = HOMEWORK.filter(h => h.status==='pending');
  const done = HOMEWORK.filter(h => h.status==='done');

  const typeIcon = { workbook: 'book', listening: 'audio', video: 'video', reading: 'doc', speaking: 'bolt' };

  const Card = ({ h }) => (
    <div className="card" style={{ padding: 16, display:'flex', gap:14, alignItems:'center', borderLeft: h.status==='done' ? '4px solid var(--ok)' : '4px solid var(--warn)' }}>
      <div style={{
        width:46, height:46, borderRadius:12,
        background: h.status==='done' ? 'color-mix(in srgb, var(--ok) 14%, white)' : 'color-mix(in srgb, var(--warn) 14%, white)',
        color: h.status==='done' ? 'var(--ok)' : 'var(--warn)',
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
      }}>
        <Icon name={typeIcon[h.type]||'doc'} size={22} className="" />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:600, fontSize:14 }}>{h.title}</div>
        <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:2 }}>
          Asignada {h.assigned} · Entregar {h.due}
        </div>
      </div>
      {h.status==='done'
        ? <Chip tone="green" dot>Entregada · {h.grade}</Chip>
        : <button className="btn btn-primary" onClick={() => toast('Abriendo tarea…')}>Hacer</button>
      }
    </div>
  );

  return (
    <div>
      <PageHeader
        kicker="Trabajo independiente"
        title={<>Mis <em>Tareas</em></>}
        sub="Self-study semanal · conecta tu progreso entre clases"
      />

      <div className="grid-3" style={{ marginBottom:24 }}>
        <Stat label="Pendientes" num={pending.length} sub="Próxima: mañana" subTone="warn" pct={(pending.length/HOMEWORK.length)*100} color="var(--warn)" />
        <Stat label="Completadas" num={done.length} sub="Al día" subTone="ok" pct={(done.length/HOMEWORK.length)*100} color="var(--ok)" />
        <Stat label="Promedio entregas" num="A" sub="Muy consistente" subTone="ok" pct={90} color="var(--an-granate)" />
      </div>

      <div className="card-h" style={{ padding:'0 4px' }}>
        <div className="card-title">Por entregar</div>
      </div>
      <div style={{ display:'grid', gap:10, marginBottom:24 }}>
        {pending.map(h => <Card key={h.id} h={h} />)}
      </div>

      <div className="card-h" style={{ padding:'0 4px' }}>
        <div className="card-title">Historial</div>
      </div>
      <div style={{ display:'grid', gap:10 }}>
        {done.map(h => <Card key={h.id} h={h} />)}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
function MaterialesView() {
  const typeChip = {
    pdf: { tone:'red',   label:'PDF' },
    audio:{ tone:'navy', label:'Audio' },
    video:{ tone:'granate', label:'Video' },
  };
  return (
    <div>
      <PageHeader
        kicker="Recursos del curso"
        title={<>Materiales de <em>clase</em></>}
        sub="Interchange Intro · 5ta edición — Cambridge University Press"
      />

      {/* Book row */}
      <div className="grid-4" style={{ marginBottom:24 }}>
        {LEVELS.map((l, i) => (
          <div key={i} className={`book-card b${i+1} ${i > STUDENT.levelIdx ? 'locked':''}`}>
            <div className="bc-tag">Nivel {i+1}</div>
            <div className="bc-title">{l.name}</div>
            <div className="bc-sub">{l.book}</div>
            {i > STUDENT.levelIdx && (
              <div style={{ position:'absolute', top:14, right:14, fontSize:10, fontWeight:700, letterSpacing:'0.1em', opacity:0.85 }}>
                🔒 BLOQUEADO
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card-h" style={{ padding:'0 4px' }}>
        <div className="card-title">Descargas disponibles</div>
        <div className="search-box" style={{ width:260 }}>
          <Icon name="search" size={16} className="" />
          <input placeholder="Buscar material..." />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12 }}>
        {MATERIALS.map((m, i) => (
          <div key={i} className="card" style={{ padding:16, display:'flex', gap:14, alignItems:'center' }}>
            <div style={{
              width:46, height:46, borderRadius:10,
              background:'var(--bg-deep)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              color: m.type==='pdf'?'var(--danger)':m.type==='audio'?'var(--an-navy)':'var(--an-granate)',
            }}>
              <Icon name={m.icon} size={22} className="" />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:600, fontSize:13 }}>{m.title}</div>
              <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>
                {m.unit} · {m.size}
              </div>
            </div>
            <Chip tone={typeChip[m.type].tone}>{typeChip[m.type].label}</Chip>
            <button className="btn btn-icon btn-ghost" title="Descargar">
              <Icon name="download" size={16} className="" />
            </button>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop:20, background:'var(--surface-2)', borderStyle:'dashed' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <Icon name="book" size={24} className="" />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:600 }}>¿Aún no tienes tu Interchange Intro físico?</div>
            <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:2 }}>Puedes adquirirlo en recepción o usar la versión digital mientras tanto.</div>
          </div>
          <button className="btn btn-navy">Solicitar libro</button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
function ICANView({ toast }) {
  const [enrolled, setEnrolled] = React.useState(() => new Set(ICAN_SESSIONS.filter(s => s.enrolled).map(s => s.id)));

  const toggle = (s) => {
    if (s.seats === 0 && !enrolled.has(s.id)) { toast('Sesión llena'); return; }
    const next = new Set(enrolled);
    if (next.has(s.id)) { next.delete(s.id); toast('Reserva cancelada'); }
    else { next.add(s.id); toast(`Reservaste: ${s.topic}`); }
    setEnrolled(next);
  };

  return (
    <div>
      <PageHeader
        kicker="Club de conversación"
        title={<>Club <em>I CAN</em></>}
        sub="Sesiones semanales sin costo para practicar inglés en contexto real con otros estudiantes"
      />

      {/* Explainer strip */}
      <div style={{
        background: 'linear-gradient(135deg, #FCF6E5, #FBEEC9)',
        border: '1px solid var(--an-gold-soft)',
        borderRadius: 'var(--r-lg)',
        padding: '20px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        marginBottom: 24,
      }}>
        {[
          ['8/9', 'Sesiones asistidas'],
          ['2h', 'Duración promedio'],
          ['Gratuito', 'Para matriculados'],
          ['Reserva', '24h antes'],
        ].map(([n,l], i) => (
          <div key={i}>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:28, fontWeight:500, color:'var(--an-navy-ink)' }}>{n}</div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#6B4A00' }}>{l}</div>
          </div>
        ))}
      </div>

      <div className="card-h" style={{ padding:'0 4px' }}>
        <div className="card-title">Próximas sesiones</div>
        <Chip tone="gold">{enrolled.size} reservadas</Chip>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14 }}>
        {ICAN_SESSIONS.map(s => {
          const isEnrolled = enrolled.has(s.id);
          const pct = (s.seats/s.cap)*100;
          return (
            <div key={s.id} className={`ican-card ${isEnrolled?'enrolled':''} ${s.seats===0?'full':''}`} onClick={() => toggle(s)}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--an-granate)' }}>
                  {s.shift==='tarde'?'🌙':'☀️'} {s.day}
                </div>
                {isEnrolled && <Chip tone="gold" dot>Reservada</Chip>}
              </div>
              <div style={{ fontFamily:'var(--f-serif)', fontSize:18, fontWeight:500, lineHeight:1.2, color:'var(--ink)' }}>
                {s.topic}
              </div>
              <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:4 }}>
                {s.time} · {s.teacher}
              </div>
              <div style={{ marginTop:12, paddingTop:10, borderTop:'1px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontSize:11, color:'var(--ink-3)' }}>
                  <strong style={{ color:'var(--ink)' }}>{s.seats}</strong> / {s.cap} cupos
                </div>
                <div style={{ width:70, height:4, background:'var(--bg-deep)', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ width:`${100-pct+(s.seats/s.cap)*0}%`, height:'100%', background: pct < 25 ? 'var(--danger)' : pct < 50 ? 'var(--warn)' : 'var(--ok)' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
function MensajesView() {
  const [text, setText] = React.useState('');
  const [msgs, setMsgs] = React.useState(MESSAGES);
  const endRef = React.useRef(null);

  React.useEffect(() => {
    if (endRef.current) endRef.current.scrollTop = endRef.current.scrollHeight;
  }, [msgs]);

  const send = () => {
    if (!text.trim()) return;
    setMsgs([...msgs, { from:'Santiago', role:'Yo', me:true, text, time:'ahora' }]);
    setText('');
  };

  return (
    <div>
      <PageHeader
        kicker="Comunicación"
        title={<>Mis <em>Mensajes</em></>}
        sub="Canal directo con tu docente y administración"
      />

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:16, height:'calc(100vh - 260px)', minHeight:500 }}>
        {/* Conversation list */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:14, borderBottom:'1px solid var(--line)', fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-3)' }}>Conversaciones</div>
          {[
            { n:'Ricardo Arias', r:'Docente · G0001', m:'Tranquilo. Revisa el material…', t:'10:48 am', un:true, av:'RA' },
            { n:'Admin. Academia', r:'Administración', m:'Recordatorio: mensualidad…', t:'Ayer', un:false, av:'AC' },
            { n:'Sofía Méndez', r:'I CAN Club', m:'¡Nos vemos el viernes!', t:'13 jul', un:false, av:'SM' },
          ].map((c, i) => (
            <div key={i} style={{
              padding:14, display:'flex', gap:10, alignItems:'center',
              borderBottom:'1px solid var(--line)', cursor:'pointer',
              background: i===0?'var(--surface-2)':'transparent',
              borderLeft: i===0?'3px solid var(--an-granate)':'3px solid transparent',
            }}>
              <div style={{
                width:40, height:40, borderRadius:'50%',
                background: i===0?'var(--an-granate)':i===1?'var(--an-navy)':'var(--an-gold)',
                color:'white', fontSize:13, fontWeight:700,
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              }}>{c.av}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{c.n}</div>
                  <div style={{ fontSize:10, color:'var(--ink-3)' }}>{c.t}</div>
                </div>
                <div style={{ fontSize:11, color:'var(--ink-3)' }}>{c.r}</div>
                <div style={{ fontSize:12, color: c.un?'var(--ink)':'var(--ink-3)', fontWeight: c.un?600:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:2 }}>{c.m}</div>
              </div>
              {c.un && <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--an-red)' }} />}
            </div>
          ))}
        </div>

        {/* Thread */}
        <div className="card" style={{ padding:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--an-granate)', color:'white', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>RA</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600 }}>Ricardo Arias Arroyo</div>
              <div style={{ fontSize:11, color:'var(--ok)' }}>● Activo · Docente de tu grupo</div>
            </div>
          </div>
          <div ref={endRef} style={{ flex:1, overflow:'auto', padding:20, background:'var(--bg-deep)' }}>
            <div className="msg-thread">
              {msgs.map((m, i) => (
                <div key={i} className={`msg ${m.me?'me':''}`}>
                  <div className="msg-av">{m.me?'SS':'RA'}</div>
                  <div>
                    <div className="msg-bubble">{m.text}</div>
                    <div style={{ fontSize:10, color:'var(--ink-3)', marginTop:3, textAlign: m.me?'right':'left' }}>{m.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding:14, borderTop:'1px solid var(--line)', display:'flex', gap:8 }}>
            <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}
              placeholder="Escribe un mensaje…"
              style={{ flex:1, padding:'10px 14px', border:'1px solid var(--line)', borderRadius:'var(--r-md)', outline:'none', fontFamily:'inherit', fontSize:13 }} />
            <button className="btn btn-primary" onClick={send}>Enviar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// ── Helper: traffic-light dot for each concept row ─────────────────────────
function FinanceDot({ status }) {
  const map = {
    paid:     { bg:'var(--ok)',        label:'Pagado',        border:'var(--ok)' },
    pending:  { bg:'var(--an-gold)',   label:'Pendiente',     border:'var(--an-gold)' },
    upcoming: { bg:'var(--surface)',   label:'Por pagar',     border:'var(--an-granate)', ring:true },
    locked:   { bg:'var(--bg-deep)',   label:'Próximamente',  border:'var(--line-2)' },
    waived:   { bg:'var(--info)',      label:'Exonerado',     border:'var(--info)' },
  };
  const c = map[status] || map.locked;
  return (
    <span style={{
      width:12, height:12, borderRadius:'50%',
      background: c.bg, border:`2px solid ${c.border}`,
      boxShadow: c.ring ? `0 0 0 3px color-mix(in srgb, ${c.border} 20%, transparent)` : 'none',
      flexShrink:0, display:'inline-block',
    }} />
  );
}

// ── Per-level status chip ─────────────────────────────────────────────────
function LevelStatusChip({ status, academic }) {
  const map = {
    completed: { bg:'color-mix(in srgb, var(--ok) 14%, white)',      color:'var(--ok)',            label:'Completado' },
    current:   { bg:'color-mix(in srgb, var(--an-granate) 12%, white)', color:'var(--an-granate-ink)', label:'Cursando' },
    next:      { bg:'color-mix(in srgb, var(--an-gold) 18%, white)', color:'#6B4A00',              label:'Por matricular' },
    locked:    { bg:'var(--bg-deep)',                                color:'var(--ink-3)',         label:'Próximo nivel' },
  };
  const c = map[status] || map.locked;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding:'4px 10px', borderRadius:'var(--r-pill)',
      background:c.bg, color:c.color,
      fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase',
    }}>{c.label}</span>
  );
}

// ── Status chip for a single concept (compact) ────────────────────────────
function ConceptStatusLabel({ status, date }) {
  const map = {
    paid:     { color:'var(--ok)',        label:'Pagado' },
    pending:  { color:'var(--warn)',      label:'Pendiente' },
    upcoming: { color:'var(--an-granate)',label:'Por pagar' },
    locked:   { color:'var(--ink-3)',     label:'—' },
  };
  const c = map[status] || map.locked;
  return (
    <span style={{ fontSize:11, fontWeight:600, color:c.color, letterSpacing:'0.02em' }}>
      {c.label}{date ? ` · ${date}` : ''}
    </span>
  );
}

// ── A single LEVEL BLOCK — matrícula + cuotas + certificado ───────────────
function LevelFinanceCard({ level, showAmounts, expanded, onToggle }) {
  const fmt = (n) => '₡' + n.toLocaleString('es-CR');
  const mask = (n) => showAmounts ? fmt(n) : '₡ • • •';

  // counts
  const conceptsPaid = (level.matricula.status === 'paid' ? 1 : 0)
                     + level.cuotas.filter(c => c.status === 'paid').length
                     + (level.certificado.status === 'paid' ? 1 : 0);
  const conceptsTotal = 2 + level.cuotas.length; // mat + cuotas + cert
  const conceptsPending = (level.matricula.status === 'pending' ? 1 : 0)
                        + level.cuotas.filter(c => c.status === 'pending' || c.status === 'upcoming').length
                        + (level.certificado.status === 'pending' ? 1 : 0);

  const levelIsLocked = level.status === 'locked';

  // headline line: status-aware, NO big amount
  let headline;
  if (level.status === 'completed') {
    headline = <>Nivel <strong>aprobado</strong> y al día. Felicidades.</>;
  } else if (level.status === 'current') {
    if (conceptsPending === 0) headline = <>Al día en este nivel.</>;
    else headline = <><strong>{conceptsPending} cuota{conceptsPending>1?'s':''}</strong> por cubrir este ciclo.</>;
  } else if (level.status === 'next') {
    headline = <>Matrícula abierta · <strong>reserva tu cupo</strong> antes de que inicie.</>;
  } else {
    headline = <>Se habilita al aprobar el nivel anterior.</>;
  }

  // CTA
  let cta = null;
  if (level.matricula.status === 'pending' && level.status === 'next') {
    cta = <button className="btn btn-primary" style={{ fontSize:13 }}>Matricular Nivel →</button>;
  } else if (level.status === 'current' && conceptsPending > 0) {
    cta = <button className="btn btn-primary" style={{ fontSize:13 }}>
      <Icon name="payments" size={14} className="" /> Pagar próxima cuota
    </button>;
  }

  return (
    <div className="card" style={{
      padding: 0,
      overflow: 'hidden',
      opacity: levelIsLocked ? 0.62 : 1,
      borderColor: level.status === 'current' ? level.color : 'var(--line)',
      borderWidth: level.status === 'current' ? 2 : 1,
      transition:'all .2s',
    }}>
      {/* ── Header row — color bar + title + status + toggle ───────────── */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'auto 1fr auto auto',
        gap:18,
        alignItems:'center',
        padding:'18px 22px',
        background: level.status === 'current'
          ? `linear-gradient(90deg, color-mix(in srgb, ${level.color} 10%, white) 0%, var(--surface) 60%)`
          : 'var(--surface)',
        borderBottom: expanded ? '1px solid var(--line)' : 'none',
        cursor: levelIsLocked ? 'default' : 'pointer',
      }} onClick={levelIsLocked ? undefined : onToggle}>
        {/* color indicator (book spine) */}
        <div style={{
          width: 6, height: 44,
          borderRadius: 3,
          background: level.color,
          opacity: levelIsLocked ? 0.4 : 1,
        }} />

        {/* title block */}
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <div style={{
              fontFamily:'var(--f-serif)', fontWeight:500,
              fontSize:22, letterSpacing:'-0.02em',
              color: levelIsLocked ? 'var(--ink-3)' : 'var(--ink)',
              lineHeight:1.1,
            }}>
              {level.name}
            </div>
            <LevelStatusChip status={level.status} />
            {level.status === 'current' && conceptsPending === 0 && (
              <span className="chip chip-green" style={{ fontSize:10 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                AL DÍA
              </span>
            )}
          </div>
          <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:3 }}>
            {level.book} · {level.period}
          </div>
          <div style={{ fontSize:13, color:'var(--ink-2)', marginTop:6 }}>
            {headline}
          </div>
        </div>

        {/* concept progress compact — 6 dots on a row */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, minWidth:140 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3)' }}>
            {conceptsPaid}/{conceptsTotal} cubiertos
          </div>
          <div style={{ display:'flex', gap:4 }}>
            <span title="Matrícula"><FinanceDot status={level.matricula.status} /></span>
            {level.cuotas.map((c, i) => (
              <span key={i} title={`Cuota ${c.label}`}><FinanceDot status={c.status} /></span>
            ))}
            <span title="Certificado"><FinanceDot status={level.certificado.status} /></span>
          </div>
          <div style={{ fontSize:10, color:'var(--ink-3)', display:'flex', gap:8, letterSpacing:'0.04em' }}>
            <span>MAT</span>
            <span>·</span>
            <span>CUOTAS</span>
            <span>·</span>
            <span>CERT</span>
          </div>
        </div>

        {/* chevron */}
        {!levelIsLocked && (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="var(--ink-3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition:'transform .25s' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}
        {levelIsLocked && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        )}
      </div>

      {/* ── Expanded detail — 3 sections: matrícula / cuotas / certificado ── */}
      {expanded && !levelIsLocked && (
        <div style={{ padding:'4px 0 18px' }}>
          {/* MATRÍCULA */}
          <FinanceRow
            section="Matrícula"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l10 6-10 6L2 9l10-6z" /><path d="M6 10.6V16c3 2 9 2 12 0v-5.4" /></svg>
            }
            items={[{
              label: level.matricula.note ? `Apertura de cupo · ${level.matricula.note}` : 'Apertura de cupo',
              amount: level.matricula.amount,
              status: level.matricula.status,
              date: level.matricula.date,
              id: level.matricula.id,
            }]}
            showAmounts={showAmounts}
            mask={mask}
            color={level.color}
          />

          {/* CUOTAS — en UNA sola línea (4 cuotas lado a lado, se pagan juntas) */}
          <FinanceRowInline
            section={`Cuotas mensuales · ${level.cuotas.length}`}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
            }
            items={level.cuotas.map(c => ({
              label: c.label,
              amount: c.amount,
              status: c.status,
              date: c.date,
              id: c.id,
              n: c.n,
            }))}
            showAmounts={showAmounts}
            mask={mask}
            color={level.color}
            allowPagarJuntas={level.status === 'current' || level.status === 'next'}
          />

          {/* CERTIFICADO */}
          <FinanceRow
            section="Certificado del nivel"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M8.5 13L7 22l5-3 5 3-1.5-9" /></svg>
            }
            items={[{
              label: level.certificado.label + (level.certificado.note ? ` · ${level.certificado.note}` : ''),
              amount: level.certificado.amount,
              status: level.certificado.status,
            }]}
            showAmounts={showAmounts}
            mask={mask}
            color={level.color}
            muted={level.certificado.status === 'locked' || level.certificado.status === 'pending'}
          />

          {/* CTA strip */}
          {cta && (
            <div style={{
              margin:'14px 22px 0',
              padding:'14px 16px',
              background:'var(--surface-2)',
              borderRadius:'var(--r-md)',
              display:'flex', alignItems:'center', justifyContent:'space-between',
              gap:12, flexWrap:'wrap',
            }}>
              <div style={{ fontSize:13, color:'var(--ink-2)' }}>
                {level.status === 'next'
                  ? '¿Listo para seguir? Asegura tu cupo sin compromiso por las siguientes cuotas.'
                  : 'Continúa con tu ciclo sin interrupciones.'}
              </div>
              {cta}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Single concept row inside an expanded level ──────────────────────────
function FinanceRow({ section, icon, items, showAmounts, mask, color, muted }) {
  return (
    <div style={{ padding:'14px 22px 4px' }}>
      <div style={{
        display:'flex', alignItems:'center', gap:8,
        fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase',
        color: muted ? 'var(--ink-3)' : color,
        marginBottom: 8,
      }}>
        <span style={{ color: muted ? 'var(--ink-3)' : color, display:'inline-flex' }}>{icon}</span>
        {section}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
        {items.map((it, i) => (
          <div key={i} style={{
            display:'grid', gridTemplateColumns:'auto 1fr auto auto', gap:14, alignItems:'center',
            padding:'10px 4px', borderBottom: i < items.length-1 ? '1px dashed var(--line)' : 'none',
          }}>
            <FinanceDot status={it.status} />
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:500, color: it.status==='locked' ? 'var(--ink-3)' : 'var(--ink)' }}>
                {it.label}
              </div>
              <ConceptStatusLabel status={it.status} date={it.date} />
            </div>
            <div style={{
              fontFamily: showAmounts ? 'var(--f-mono)' : 'var(--f-sans)',
              fontWeight: 600,
              fontSize: 13,
              color: it.status === 'locked' ? 'var(--ink-3)' : 'var(--ink)',
              minWidth: 90, textAlign:'right',
              letterSpacing: showAmounts ? 0 : '0.1em',
            }}>
              {it.status === 'locked' && !showAmounts ? '—' : mask(it.amount)}
            </div>
            <div style={{ minWidth: 36, textAlign:'right' }}>
              {it.status === 'paid' && it.id && (
                <button className="btn btn-icon btn-ghost" title={`Descargar ${it.id}`}>
                  <Icon name="download" size={12} className="" />
                </button>
              )}
              {it.status === 'pending' && (
                <button className="btn" style={{ fontSize:11, padding:'6px 10px', background:'var(--an-granate)', color:'white', border:'none' }}>
                  Pagar
                </button>
              )}
              {it.status === 'upcoming' && (
                <span style={{ fontSize:10, color:'var(--ink-3)', letterSpacing:'0.08em' }}>PRÓXIMO</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Inline (horizontal) financial row — for cuotas que suelen pagarse juntas ─
function FinanceRowInline({ section, icon, items, showAmounts, mask, color, allowPagarJuntas }) {
  const fmt = (n) => '₡' + n.toLocaleString('es-CR');
  const unpaidItems = items.filter(it => it.status === 'pending' || it.status === 'upcoming');
  const totalUnpaid = unpaidItems.reduce((a, it) => a + it.amount, 0);
  const totalAll = items.reduce((a, it) => a + it.amount, 0);
  const allPaid = unpaidItems.length === 0;

  return (
    <div style={{ padding:'14px 22px 4px' }}>
      {/* Section header with summary line */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
        marginBottom: 10, flexWrap:'wrap',
      }}>
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase',
          color: color,
        }}>
          <span style={{ color: color, display:'inline-flex' }}>{icon}</span>
          {section}
        </div>
        {showAmounts && !allPaid && (
          <div style={{
            fontSize:11, color:'var(--ink-3)', letterSpacing:'0.04em',
            display:'inline-flex', alignItems:'center', gap:6,
          }}>
            <span>Pendiente: </span>
            <span style={{ fontFamily:'var(--f-mono)', fontWeight:700, color:'var(--ink)' }}>{fmt(totalUnpaid)}</span>
            <span style={{ opacity:0.5 }}>·</span>
            <span>Total ciclo: </span>
            <span style={{ fontFamily:'var(--f-mono)', fontWeight:600 }}>{fmt(totalAll)}</span>
          </div>
        )}
      </div>

      {/* 4-column grid of quota cards */}
      <div style={{
        display:'grid',
        gridTemplateColumns:`repeat(${items.length}, 1fr)`,
        gap: 8,
      }}>
        {items.map((it, i) => {
          const isPaid = it.status === 'paid';
          const isLocked = it.status === 'locked';
          const isPending = it.status === 'pending';
          const isUpcoming = it.status === 'upcoming';
          return (
            <div key={i} style={{
              padding:'12px 10px 10px',
              borderRadius:'var(--r-md)',
              border:`1px solid ${isPaid ? 'color-mix(in srgb, var(--ok) 30%, var(--line))'
                : isUpcoming ? color
                : isPending ? 'var(--an-gold)'
                : 'var(--line)'}`,
              background: isPaid ? 'color-mix(in srgb, var(--ok) 6%, white)'
                : isUpcoming ? `color-mix(in srgb, ${color} 5%, white)`
                : isPending ? 'color-mix(in srgb, var(--an-gold) 8%, white)'
                : 'var(--surface-2)',
              opacity: isLocked ? 0.55 : 1,
              display:'flex', flexDirection:'column', gap:4,
              position:'relative',
              cursor: (isPending || isUpcoming) ? 'pointer' : 'default',
              transition:'transform .15s, box-shadow .15s',
            }}
            onMouseEnter={e => {
              if (isPending || isUpcoming) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = 'var(--sh-1)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '';
            }}>
              {/* top row: cuota number + dot */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
                <div style={{
                  fontSize:10, fontWeight:700, letterSpacing:'0.1em',
                  color: isLocked ? 'var(--ink-3)' : color,
                  textTransform:'uppercase',
                }}>
                  Cuota {it.n}
                </div>
                <FinanceDot status={it.status} />
              </div>

              {/* month */}
              <div style={{
                fontFamily:'var(--f-serif)', fontWeight:500,
                fontSize:18, lineHeight:1.1, letterSpacing:'-0.02em',
                color: isLocked ? 'var(--ink-3)' : 'var(--ink)',
              }}>
                {it.label}
              </div>

              {/* amount */}
              <div style={{
                fontFamily: showAmounts ? 'var(--f-mono)' : 'var(--f-sans)',
                fontSize: 13, fontWeight: 600,
                color: isLocked ? 'var(--ink-3)' : 'var(--ink)',
                letterSpacing: showAmounts ? 0 : '0.1em',
                marginTop:2,
              }}>
                {isLocked && !showAmounts ? '—' : mask(it.amount)}
              </div>

              {/* date / status line */}
              <div style={{
                fontSize:10, marginTop:2, letterSpacing:'0.02em',
                color: isPaid ? 'var(--ok)'
                  : isPending ? 'var(--warn)'
                  : isUpcoming ? color
                  : 'var(--ink-3)',
                fontWeight: 600,
              }}>
                {isPaid && <>✓ Pagado · {it.date}</>}
                {isPending && <>Vence {it.date}</>}
                {isUpcoming && <>{it.date}</>}
                {isLocked && <>—</>}
              </div>
            </div>
          );
        })}
      </div>

      {/* PAGAR JUNTAS — atajo para cuando se cancelan todas de una vez */}
      {allowPagarJuntas && unpaidItems.length >= 2 && (
        <div style={{
          marginTop: 10,
          padding: '10px 14px',
          background: `linear-gradient(90deg, color-mix(in srgb, ${color} 8%, white) 0%, var(--surface-2) 100%)`,
          border: `1px dashed ${color}`,
          borderRadius:'var(--r-md)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          gap:12, flexWrap:'wrap',
        }}>
          <div style={{ fontSize:12, color:'var(--ink-2)', lineHeight:1.4 }}>
            <strong style={{ color:'var(--ink)' }}>¿Pagar las {unpaidItems.length} cuotas juntas?</strong>
            {' '}Es lo más común — un solo pago cubre todo el ciclo.
            {showAmounts && <> Total: <span style={{ fontFamily:'var(--f-mono)', fontWeight:700, color:'var(--ink)' }}>{fmt(totalUnpaid)}</span></>}
          </div>
          <button className="btn" style={{
            background: color, color:'white', border:'none', fontSize:12,
          }}>
            <Icon name="payments" size={13} className="" /> Pagar ciclo completo
          </button>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
function PagosView({ tweaks = {} }) {
  const [showAmounts, setShowAmounts] = React.useState(tweaks.showAmounts !== false);

  // Datos reales del servidor
  const [datosReales, setDatosReales] = React.useState(null);
  React.useEffect(() => {
    fetch(`${SCRIPT_URL_SM}?fn=getEstudiante&codigo=${encodeURIComponent(COD_ESTUDIANTE_SM)}`)
      .then(r => r.json())
      .then(data => { if (data.ok) setDatosReales(data); })
      .catch(() => {});
  }, []);

  // LEVEL_FINANCE patcheado con datos reales (o base si no hay)
  const financeData = React.useMemo(() => {
    if (!datosReales) return LEVEL_FINANCE;
    return patchLevelFinance(
      LEVEL_FINANCE,
      datosReales.pagos,
      datosReales.otrosPagos,
      datosReales.pendientes?.cuota_mensual
    );
  }, [datosReales]);

  React.useEffect(() => {
    if (tweaks.showAmounts !== undefined) setShowAmounts(tweaks.showAmounts);
  }, [tweaks.showAmounts]);
  const [expandedId, setExpandedId] = React.useState(() => {
    const cur = financeData.find(l => l.status === 'current');
    return cur ? cur.id : financeData[0].id;
  });

  // global status — flattens all levels for the hero
  const allCuotas    = financeData.flatMap(l => l.cuotas);
  const allConcepts  = financeData.flatMap(l => [l.matricula, ...l.cuotas, l.certificado]);
  const paidCount    = allConcepts.filter(c => c.status === 'paid').length;
  const pendingCount = allConcepts.filter(c => c.status === 'pending').length;
  const upcomingCount= allConcepts.filter(c => c.status === 'upcoming').length;
  const isAlDia      = pendingCount === 0;

  const currentLevel = financeData.find(l => l.status === 'current');

  return (
    <div>
      <PageHeader
        kicker="Finanzas por nivel"
        title={<>Estado de <em>cuenta</em></>}
        sub="Tu progreso financiero nivel por nivel · matrícula, cuotas y certificado"
        right={
          <button className="btn btn-ghost" onClick={() => setShowAmounts(v => !v)} style={{ fontSize:12 }}>
            {showAmounts
              ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg> Ocultar montos</>
              : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Ver montos</>}
          </button>
        }
      />

      {/* ── HERO compacto: status del nivel actual ────────────────────────── */}
      <div className="card" style={{
        padding: '22px 28px',
        marginBottom: 16,
        background: isAlDia
          ? 'linear-gradient(135deg, #FBF8F2 0%, #FFFFFF 50%, color-mix(in srgb, var(--ok) 8%, white) 100%)'
          : 'linear-gradient(135deg, #FBF8F2 0%, #FFFFFF 50%, color-mix(in srgb, var(--an-gold) 10%, white) 100%)',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', right:-30, top:-30, width:180, height:180, borderRadius:'50%',
          background: isAlDia ? 'var(--ok)' : 'var(--an-gold)', opacity: 0.05, pointerEvents:'none' }} />
        <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:24, alignItems:'center', position:'relative' }}>
          <div style={{
            width:60, height:60, borderRadius:'50%',
            background: isAlDia ? 'var(--ok)' : 'var(--an-gold)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'white', flexShrink:0,
            boxShadow: `0 8px 20px -6px ${isAlDia ? 'rgba(46,125,50,0.4)' : 'rgba(229,168,35,0.4)'}`,
          }}>
            {isAlDia
              ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
              : <span style={{ fontFamily:'var(--f-serif)', fontSize:28, fontWeight:600, lineHeight:1 }}>{pendingCount}</span>}
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-3)' }}>
              Tu estado global
            </div>
            <div style={{
              fontFamily:'var(--f-serif)', fontWeight:500,
              fontSize:38, lineHeight:1.05, letterSpacing:'-0.035em',
              color: isAlDia ? 'var(--ok)' : 'var(--an-granate-ink)',
              marginTop:3,
            }}>
              {isAlDia ? 'Al día' : (pendingCount === 1 ? '1 cuota por cubrir' : `${pendingCount} cuotas por cubrir`)}
            </div>
            <div style={{ fontSize:13, color:'var(--ink-2)', marginTop:4 }}>
              {currentLevel
                ? <>Cursando <strong style={{ color:'var(--ink)' }}>{currentLevel.name}</strong> · {paidCount} conceptos cubiertos · {upcomingCount} próximo{upcomingCount!==1?'s':''}</>
                : 'Revisa cada nivel para ver tu progreso financiero.'}
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3)' }}>
              Recorrido completo
            </div>
            <div style={{ display:'flex', gap:3 }}>
              {financeData.map((l, i) => (
                <div key={i} style={{
                  width: 36, height: 6, borderRadius: 3,
                  background: l.status === 'completed' ? 'var(--ok)'
                    : l.status === 'current' ? l.color
                    : l.status === 'next' ? 'color-mix(in srgb, ' + l.color + ' 35%, var(--bg-deep))'
                    : 'var(--bg-deep)',
                }} title={l.name} />
              ))}
            </div>
            <div style={{ fontSize:11, color:'var(--ink-3)' }}>
              {financeData.filter(l => l.status === 'completed').length + (currentLevel ? 1 : 0)} / {financeData.length} niveles iniciados
            </div>
          </div>
        </div>
      </div>

      {/* ── Contexto / tranquilizador ─────────────────────────────────────── */}
      <div style={{
        display:'flex', alignItems:'center', gap:10, flexWrap:'wrap',
        padding:'12px 18px', marginBottom:18,
        background:'var(--surface-2)',
        border:'1px dashed var(--line-2)',
        borderRadius:'var(--r-md)',
        fontSize:12, color:'var(--ink-2)', lineHeight:1.5,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--an-granate)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
        </svg>
        <span>
          Cada nivel incluye <strong>matrícula</strong>, <strong>4 cuotas mensuales</strong> y <strong>certificado</strong>. Haz click en un nivel para ver el desglose. Los montos están ocultos por defecto para mantener el foco en tu avance.
        </span>
      </div>

      {/* ── NIVELES ─────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {financeData.map(level => (
          <LevelFinanceCard
            key={level.id}
            level={level}
            showAmounts={showAmounts}
            expanded={expandedId === level.id}
            onToggle={() => setExpandedId(prev => prev === level.id ? null : level.id)}
          />
        ))}
      </div>

      {/* ── Soporte financiero, empático ──────────────────────────────────── */}
      <div style={{
        marginTop: 20,
        padding: '16px 20px',
        border:'1px solid var(--line)',
        borderRadius:'var(--r-md)',
        background:'var(--surface)',
        display:'flex', alignItems:'center', gap:14, flexWrap:'wrap',
        fontSize:13, color:'var(--ink-2)',
      }}>
        <div style={{ flex:1, minWidth:240 }}>
          <strong style={{ color:'var(--ink)' }}>¿Alguna dificultad este mes?</strong>
          <span style={{ opacity:0.85 }}> Podemos acomodar fechas o conversar opciones. Nadie pausa su aprendizaje por lo económico.</span>
        </div>
        <a className="btn btn-ghost" href="https://wa.me/50688881234" target="_blank" rel="noopener" style={{ fontSize:12 }}>
          Hablar con Administración
        </a>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
function CertificadosView() {
  return (
    <div>
      <PageHeader
        kicker="Documentos oficiales"
        title={<>Mis <em>Certificados</em></>}
        sub="Avalados por INA Resolución 2519 y CONAPE"
      />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:16, marginBottom:24 }}>
        {CERTIFICATES.map((c, i) => (
          <div key={i} className="card" style={{
            padding:24, background:'linear-gradient(135deg, #FFFFFF 0%, #FBF8F2 100%)',
            position:'relative', overflow:'hidden', minHeight:200,
          }}>
            <div style={{
              position:'absolute', right:-40, bottom:-40, width:180, height:180,
              background:'var(--an-granate)', opacity:0.04, borderRadius:'50%',
            }} />
            <div style={{ display:'flex', alignItems:'flex-start', gap:16, position:'relative' }}>
              <div style={{
                width:56, height:56, borderRadius:'50%',
                background:'linear-gradient(135deg, var(--an-gold) 0%, var(--an-gold-soft) 100%)',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'white', flexShrink:0, boxShadow: 'var(--sh-1)',
              }}>
                <Icon name="certificates" size={26} className="" />
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--an-granate)' }}>
                  Certificado oficial · Activo
                </div>
                <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, lineHeight:1.2, margin:'6px 0', color:'var(--an-navy-ink)' }}>
                  {c.title}
                </div>
                <div style={{ fontSize:12, color:'var(--ink-2)' }}>Emitido el {c.issued}</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:20, position:'relative' }}>
              <button className="btn btn-primary"><Icon name="download" size={14} className="" /> Descargar PDF</button>
              <button className="btn btn-ghost">Compartir enlace</button>
            </div>
          </div>
        ))}
      </div>

      {/* Coming up */}
      <div className="card-h" style={{ padding:'0 4px' }}>
        <div className="card-title">Por desbloquear</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14 }}>
        {[
          { t:'Básico I', sub:'Al terminar módulo', pct:56 },
          { t:'Básico II', sub:'Bloqueado', pct:0 },
          { t:'Intermedio I', sub:'Bloqueado', pct:0 },
          { t:'Conversacional', sub:'Tras nivel II', pct:0 },
        ].map((b,i) => (
          <div key={i} className="card" style={{ textAlign:'center', padding:20, opacity: b.pct>0?1:0.55 }}>
            <div className="badge" style={b.pct===56? { background:'linear-gradient(135deg, var(--an-granate), var(--an-red))', color:'white', border:'none', margin:'0 auto 10px', width:72, height:72 } : { margin:'0 auto 10px', width:72, height:72 }}>
              <div className="badge-num">{b.pct}%</div>
            </div>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:16, fontWeight:500 }}>{b.t}</div>
            <div style={{ fontSize:11, color:'var(--ink-3)' }}>{b.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
function PerfilView({ onNavigate } = {}) {
  const usr = JSON.parse(sessionStorage.getItem('an_usuario') || 'null');
  const s = {
    ...STUDENT, // mantener email, phone, teacher, schedule, book como fallback
    name:     usr?.nombre || STUDENT.name,
    initials: usr?.nombre ? usr.nombre.split(' ').slice(0,2).map(w=>w[0]).join('') : STUDENT.initials,
    code:     usr?.codigo || STUDENT.code,
    group:    usr?.grupo  || STUDENT.group,
    level:    usr?.nivel  || STUDENT.level,
  };
  const TODAY_P = new Date();
  return (
    <div>
      <PageHeader
        kicker="Mi cuenta"
        title={<>Mi <em>Perfil</em></>}
        sub="Información personal, académica y configuración"
      />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:20 }}>
        {/* Left: Identity */}
        <div className="card" style={{ textAlign:'center' }}>
          <div style={{
            width:120, height:120, borderRadius:'50%',
            background:'linear-gradient(135deg, var(--an-granate), var(--an-red))',
            color:'white', fontFamily:'var(--f-serif)', fontSize:48, fontWeight:500,
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 14px', boxShadow:'var(--sh-2)',
            border:'4px solid white',
          }}>{s.initials}</div>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, lineHeight:1.15, color:'var(--an-navy-ink)' }}>
            {s.name}
          </div>
          <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:4, fontFamily:'var(--f-mono)' }}>
            Código {s.code}
          </div>

          <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap', marginTop:14 }}>
            <Chip tone="granate">Estudiante activo</Chip>
            <Chip tone="navy">{s.group}</Chip>
          </div>

          <div style={{ marginTop:22, textAlign:'left', borderTop:'1px solid var(--line)', paddingTop:16 }}>
            {[
              ['Correo', s.email],
              ['Teléfono', s.phone],
              ['Nivel actual', s.level],
              ['Libro', s.book],
              ['Docente', s.teacher],
              ['Horario', s.schedule],
              ['Ingreso', '5 may 2026'],
            ].map(([k,v],i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'7px 0', borderBottom: i<6?'1px solid var(--line)':'none' }}>
                <span style={{ color:'var(--ink-3)', fontWeight:600 }}>{k}</span>
                <span style={{ color:'var(--ink)', fontWeight:500, textAlign:'right', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis' }}>{v}</span>
              </div>
            ))}
          </div>

          <button className="btn btn-ghost" style={{ width:'100%', marginTop:16 }}>Editar información</button>
        </div>

        {/* Right: Journey */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div className="card">
            <div className="card-h">
              <div className="card-title">Mi camino</div>
              <Chip tone="gold">48h / 96h acumuladas</Chip>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10 }}>
              {LEVELS.map((l, i) => (
                <div key={i} style={{
                  padding:'14px 12px',
                  borderRadius:'var(--r-md)',
                  background: i===s.levelIdx ? 'color-mix(in srgb, var(--an-granate) 10%, white)' : i < s.levelIdx ? 'color-mix(in srgb, var(--ok) 10%, white)' : 'var(--surface-2)',
                  border: i===s.levelIdx ? '2px solid var(--an-granate)' : '1px solid var(--line)',
                  position:'relative',
                }}>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color: i===s.levelIdx?'var(--an-granate)':'var(--ink-3)' }}>
                    Nivel {i+1}
                  </div>
                  <div style={{ fontFamily:'var(--f-serif)', fontSize:17, fontWeight:500, marginTop:3, color:'var(--ink)' }}>
                    {l.name}
                  </div>
                  <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>{l.book}</div>
                  {i===s.levelIdx && <div style={{ marginTop:8, fontSize:11, fontWeight:700, color:'var(--an-granate)' }}>● En curso · {s.progress}%</div>}
                  {i < s.levelIdx && <div style={{ marginTop:8, fontSize:11, fontWeight:700, color:'var(--ok)' }}>✓ Completado</div>}
                  {i > s.levelIdx && <div style={{ marginTop:8, fontSize:11, color:'var(--ink-3)' }}>🔒 Bloqueado</div>}
                </div>
              ))}
            </div>
          </div>

          {(() => {
            const insignias = calcularInsignias(window.__EST_DATA || null, window.__ACCESO || null);
            const desbloqueadas = insignias.filter(i => i.desbloqueada).length;
            return (
              <div className="card">
                <div className="card-h">
                  <div className="card-title">Insignias</div>
                  <Chip tone="gold">{desbloqueadas} desbloqueadas</Chip>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:12 }}>
                  {insignias.map((b) => (
                    <div key={b.id} className={`badge ${b.desbloqueada?'earned':''}`} style={ b.desbloqueada ? undefined : { opacity:0.3, filter:'grayscale(1)' } }>
                      <div className="badge-num" style={{ fontSize:22 }}>{b.emoji}</div>
                      <div className="badge-label">{b.titulo}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="card">
            <div className="card-h">
              <div className="card-title">Configuración</div>
            </div>
            <div style={{ display:'grid', gap:10 }}>
              {[
                ['Notificaciones por correo', true],
                ['Recordatorios de clase por WhatsApp', true],
                ['Acceso al Club I CAN', true],
                ['Modo oscuro del campus', false],
              ].map(([l, v], i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom: i<3?'1px solid var(--line)':'none' }}>
                  <span style={{ fontSize:13 }}>{l}</span>
                  <span style={{
                    width:40, height:22, borderRadius:11,
                    background: v?'var(--an-granate)':'var(--line-2)',
                    position:'relative', transition:'all .2s',
                  }}>
                    <span style={{ position:'absolute', top:2, left: v?20:2, width:18, height:18, background:'white', borderRadius:'50%', transition:'all .2s' }} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PerfilMiniCalendar removido: dependía de DEMO_GROUP/schedule (datos demo) */}
    </div>
  );
}

// Shared page header
function PageHeader({ kicker, title, sub, right }) {
  return (
    <div style={{ marginBottom:24, display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
      <div>
        <div className="hero-kicker" style={{ marginBottom:8 }}>{kicker}</div>
        <h1 style={{ fontFamily:'var(--f-serif)', fontSize:40, fontWeight:400, letterSpacing:'-0.035em', lineHeight:1.05, margin:0, color:'var(--an-navy-ink)' }}>
          {title}
        </h1>
        <div style={{ fontSize:13, color:'var(--ink-2)', marginTop:6, maxWidth:640 }}>{sub}</div>
      </div>
      {right}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// External-linked modules: embed iframes for calendario & examen oral
function CalendarioView_UNUSED() {
  return (
    <div>
      <PageHeader
        kicker="Planificación"
        title={<>Mi <em>Calendario</em></>}
        sub="Vista mensual con todas tus clases, tareas, exámenes y sesiones I CAN"
        right={<a href="modulos/calendario.html" target="_blank" className="btn btn-ghost">Abrir en pestaña nueva →</a>}
      />
      <div className="card" style={{ padding:0, overflow:'hidden', height:'calc(100vh - 220px)', minHeight:620 }}>
        <iframe src="modulos/calendario.html" style={{ width:'100%', height:'100%', border:0 }} title="Calendario" />
      </div>
    </div>
  );
}

function ExamenOralView() {
  return (
    <div>
      <PageHeader
        kicker="Evaluación"
        title={<>Examen <em>Oral</em></>}
        sub="Banco de preguntas y estructura del test · Units 5–8"
        right={<a href="modulos/examen_oral.html" target="_blank" className="btn btn-ghost">Abrir en pestaña nueva →</a>}
      />
      <div className="card" style={{ padding:0, overflow:'hidden', height:'calc(100vh - 220px)', minHeight:620 }}>
        <iframe src="modulos/examen_oral.html" style={{ width:'100%', height:'100%', border:0 }} title="Examen Oral" />
      </div>
    </div>
  );
}

Object.assign(window, {
  PageHeader,
  NotasView, TareasView, ICANView, MensajesView, PagosView,
  CertificadosView, PerfilView, ExamenOralView,
  estaDesbloqueada, LeccionLocked,
});
