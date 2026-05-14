/* global React, Icon, Ring, Stat, Chip, AnimatedBar, STUDENT, NEXT_LESSONS, RECENT_LESSONS, FEEDBACK, LEVELS, ICAN_SESSIONS, HOMEWORK */

function StudentDashboard({ toast, onNavigate }) {
  const s = STUDENT;
  const nextClass = NEXT_LESSONS[0];
  const nextExam = NEXT_LESSONS.find(l => l.type==='oral' || l.type==='esc');
  const icanEnrolled = ICAN_SESSIONS.find(x => x.enrolled);
  const pendingHw = HOMEWORK.filter(h => h.status==='pending');

  return (
    <div>
      {/* Hero */}
      <div className="hero">
        <div className="watermark-a">A</div>
        <div className="hero-grid">
          <div>
            <div className="hero-kicker">Lun 15 jul · Semana 10 de 16</div>
            <h1 className="hero-h1">
              Buen día,<br/>
              <em>{s.short}</em>
            </h1>
            <div className="hero-sub">Estás en la mitad del camino de <strong>Interchange Intro</strong> — sigue así.</div>
            <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
              <div className="level-spine">
                {LEVELS.map((l,i) => <span key={i} className={i===s.levelIdx?'on':''}>{l.name.replace('Básico','Bás.').replace('Intermedio','Int.')}</span>)}
              </div>
              <Chip tone="gold" dot>Grupo {s.group}</Chip>
              <Chip tone="navy">Prof. {s.teacher.split(' ')[0]}</Chip>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'center' }}>
            <Ring pct={s.progress} size={220}>
              <div className="ring-pct">{s.progress}<sup>%</sup></div>
              <div className="ring-label">Módulo completado</div>
              <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:4 }}>18 de 32 lecciones</div>
            </Ring>
          </div>
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <Stat label="Asistencia" num="94" suffix="%" sub="17 de 18 clases" subTone="ok" pct={94} color="var(--ok)" />
        <Stat label="Nota acumulada" num="88" suffix="/100" sub="Promedio: A − Muy bueno" subTone="ok" pct={88} color="var(--an-granate)" />
        <Stat label="Tareas pendientes" num={pendingHw.length} sub="Próxima: hoy" subTone="warn" pct={50} color="var(--warn)" />
        <Stat label="I CAN asistidas" num="8" suffix="/9" sub="Excelente participación" subTone="ok" pct={89} color="var(--an-gold)" />
      </div>

      {/* Next class — editorial card */}
      <div className="next-class" style={{ marginBottom:16 }}>
        <div className="nc-date-box">
          <div className="nc-day">15</div>
          <div className="nc-month">Jul</div>
        </div>
        <div style={{ position:'relative', zIndex:1 }}>
          <div className="nc-kicker">Próxima clase · Hoy · 6:00–9:00 pm</div>
          <div className="nc-title">Lección {nextClass.n} · {nextClass.title}</div>
          <div className="nc-meta">{nextClass.unit} · Prof. {s.teacher} · Aula virtual A1</div>
        </div>
        <div style={{ display:'flex', gap:8, position:'relative', zIndex:1 }}>
          <button className="btn btn-ghost" style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.25)', color:'white' }}>Ver detalles</button>
          <button className="btn btn-primary" style={{ background:'var(--an-granate)' }} onClick={() => toast('Abriendo Zoom…')}>
            Entrar a clase <Icon name="arrow" size={14} className="" />
          </button>
        </div>
      </div>

      {/* Two-col: timeline + side */}
      <div className="grid-2">
        {/* Timeline */}
        <div className="card">
          <div className="card-h">
            <div className="card-title">Próximas clases <small>2 semanas</small></div>
            <button className="btn btn-ghost" onClick={() => onNavigate('calendario')}>Ver calendario →</button>
          </div>
          <div className="timeline">
            {NEXT_LESSONS.map((l, i) => (
              <div key={i} className={`t-item ${l.status==='next'?'next':''} ${l.type==='oral'||l.type==='esc'?'exam':''}`}>
                <div className="t-date">{l.date} · {l.time}</div>
                <div className="t-title">
                  L{l.n} · {l.title}
                  {l.type==='oral' && <Chip tone="granate" style={{ marginLeft:8 }}>Oral · {l.weight}</Chip>}
                  {l.type==='esc'  && <Chip tone="red">Written · {l.weight}</Chip>}
                  {l.type==='prg'  && <Chip tone="gold">Progress</Chip>}
                </div>
                <div className="t-sub">{l.unit}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Next exam highlight */}
          <div className="card" style={{ background:'linear-gradient(135deg, #FCF6E5, #FBEEC9)', border:'1px solid var(--an-gold-soft)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'var(--an-gold)', color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name="bolt" size={18} className="" />
              </div>
              <div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'#6B4A00' }}>Próximo examen · en 5 días</div>
                <div style={{ fontFamily:'var(--f-serif)', fontSize:18, fontWeight:500, color:'var(--an-navy-ink)' }}>Oral Test 2</div>
              </div>
            </div>
            <div style={{ fontSize:12, color:'var(--ink-2)', marginBottom:12 }}>
              Units 5–8 · Vale <strong>15%</strong> de tu nota final · Lec 17
            </div>
            <button className="btn btn-navy" style={{ width:'100%' }}>Prepararme con el banco de preguntas →</button>
          </div>

          {/* I CAN reservation */}
          <div className="card">
            <div className="card-h">
              <div className="card-title" style={{ fontSize:16 }}>Mi I CAN</div>
              <Chip tone="gold">8/9 asistidas</Chip>
            </div>
            {icanEnrolled && (
              <div style={{ padding:12, background:'color-mix(in srgb, var(--an-gold) 12%, white)', borderRadius:10, border:'1px solid var(--an-gold-soft)' }}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#6B4A00' }}>Reservado · {icanEnrolled.shift === 'tarde' ? '🌙' : '☀'} {icanEnrolled.day}</div>
                <div style={{ fontFamily:'var(--f-serif)', fontSize:17, color:'var(--ink)', marginTop:4 }}>{icanEnrolled.topic}</div>
                <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:2 }}>{icanEnrolled.time} · {icanEnrolled.teacher}</div>
              </div>
            )}
            <button className="btn btn-ghost" style={{ width:'100%', marginTop:10 }} onClick={() => onNavigate('ican')}>Ver más sesiones →</button>
          </div>
        </div>
      </div>

      {/* Feedback strip */}
      <div className="card" style={{ marginTop:20 }}>
        <div className="card-h">
          <div className="card-title">Retroalimentación reciente</div>
          <button className="btn btn-ghost" onClick={() => onNavigate('notas')}>Historial completo →</button>
        </div>
        {FEEDBACK.slice(0,2).map((f,i) => (
          <div key={i} className="fb">
            <div className="fb-meta">Lección {f.lesson} · {f.date} · {f.teacher}</div>
            <div className="fb-text">{f.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { StudentDashboard });
