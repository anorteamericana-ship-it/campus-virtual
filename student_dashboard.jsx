/* global React, Icon, Ring, Stat, Chip, AnimatedBar, STUDENT, FEEDBACK, LEVELS, ICAN_SESSIONS, HOMEWORK */

const SCRIPT_URL_SD = 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';
const COD_ESTUDIANTE_SD = (() => {
  try {
    const usr = JSON.parse(sessionStorage.getItem('an_usuario') || 'null');
    if (usr?.codigo) return String(usr.codigo);
  } catch {}
  return typeof STUDENT !== 'undefined' ? String(STUDENT.rec_m) : '17055';
})();

function calcularAcceso(datosReales) {
  if (!datosReales) return { nivel: 'sin_acceso', leccionesDesbloqueadas: [] };
  const convenio = datosReales?.estudiante?.CONVENIO || '';
  const grupoActual = datosReales?.grupo?.CODIGO_GRUPO || '';
  const todosLosPagos = datosReales?.pagos || [];
  // Solo contar pagos del grupo actual (nivel activo)
  const pagos = todosLosPagos.filter(p =>
    !grupoActual || String(p.grupo || '').trim() === grupoActual
  );
  const otros    = datosReales?.otrosPagos || [];

  // CONAPE — acceso completo
  if (convenio === 'CONAPE') {
    return { nivel: 'completo', leccionesDesbloqueadas: Array.from({length:32},(_,i)=>i+1) };
  }

  // Verificar matrícula pagada
  const tieneMatricula = otros.some(p => String(p.descripcion || '').toUpperCase().includes('MATRICULA'));
  if (!tieneMatricula) return { nivel: 'sin_acceso', leccionesDesbloqueadas: [] };

  // Cuatrimestre completo — 4+ cuotas pagadas
  if (pagos.length >= 4) {
    return { nivel: 'completo', leccionesDesbloqueadas: Array.from({length:32},(_,i)=>i+1) };
  }

  // Por cuota — cada cuota habilita 8 lecciones aprox
  const cuotasPagadas = pagos.length;
  if (cuotasPagadas === 0) {
    // Solo matrícula → lecciones 1 y 2
    return { nivel: 'matricula', leccionesDesbloqueadas: [1, 2] };
  }
  const hasta = Math.min(cuotasPagadas * 8, 32);
  return {
    nivel: 'parcial',
    leccionesDesbloqueadas: Array.from({length: hasta}, (_, i) => i + 1),
    cuotasPagadas,
  };
}

function estaDesbloqueada(leccionNum, acceso) {
  if (!acceso) return false;
  if (acceso.nivel === 'completo') return true;
  return acceso.leccionesDesbloqueadas.includes(Number(leccionNum));
}

function useEstadoConape(cedula) {
  const [estado, setEstado] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    if (!cedula) return;
    setLoading(true);
    fetch(`${SCRIPT_URL_SD}?fn=getEstadoConape&cedula=${encodeURIComponent(cedula)}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setEstado(d); })
      .finally(() => setLoading(false));
  }, [cedula]);
  return { estado, loading };
}

function StudentDashboard({ toast, onNavigate }) {
  const s = STUDENT;
  const nextClass    = null; // dato real pendiente de conectar
  const nextExam     = null;
  const icanEnrolled = ICAN_SESSIONS.find(x => x.enrolled);
  const pendingHw    = HOMEWORK.filter(h => h.status==='pending');

  // Datos reales del servidor (sobrescriben bundle cuando están disponibles)
  const [datosReales, setDatosReales] = React.useState(null);
  React.useEffect(() => {
    fetch(`${SCRIPT_URL_SD}?fn=getEstudiante&codigo=${encodeURIComponent(COD_ESTUDIANTE_SD)}`)
      .then(r => r.json())
      .then(data => { if (data.ok) setDatosReales(data); })
      .catch(() => {}); // fallback silencioso a bundle
  }, []);

  // Valores con fallback: servidor > bundle
  const nombreCorto  = datosReales?.estudiante?.NOMBRE?.split(' ')[0]
    || (datosReales?.estudiante?.NOMBRE ? datosReales.estudiante.NOMBRE.split(' ').slice(0,2).join(' ') : s.short);
  const grupoActual  = datosReales?.grupo?.COD_GRUPO  || s.group;
  const docente      = datosReales?.grupo?.DOCENTE    || s.teacher;
  const nivelActual  = datosReales?.grupo?.NIVEL_ACTUAL || null;
  const periodoActual= datosReales?.grupo?.PERIODO_ACTUAL || null;
  const proximoPer   = datosReales?.grupo?.PROXIMO_PERIODO || null;

  // CONAPE — solo si el estudiante está en convenio CONAPE
  const cedula = datosReales?.estudiante?.CEDULA || null;
  const esConape = datosReales?.estudiante?.CONVENIO === 'CONAPE';
  const { estado: conapeEstado } = useEstadoConape(esConape ? cedula : null);

  // Control de acceso por pago — expuesto a otros módulos vía window.__ACCESO
  const acceso = React.useMemo(() => calcularAcceso(datosReales), [datosReales]);
  React.useEffect(() => { window.__ACCESO = acceso; }, [acceso]);
  React.useEffect(() => { window.__EST_DATA = datosReales; }, [datosReales]);

  return (
    <div>
      {/* Hero */}
      <div className="hero">
        <div className="watermark-a">A</div>
        <div className="hero-grid">
          <div>
            <div className="hero-kicker">{periodoActual || 'Lun 28 abr · Semana 10 de 16'}</div>
            <h1 className="hero-h1">
              Buen día,<br/>
              <em>{nombreCorto}</em>
            </h1>
            <div className="hero-sub">Estás en la mitad del camino de <strong>{nivelActual || 'Interchange Intro'}</strong> — sigue así.</div>
            <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
              <div className="level-spine">
                {LEVELS.map((l,i) => <span key={i} className={i===s.levelIdx?'on':''}>{l.name.replace('Básico','Bás.').replace('Intermedio','Int.')}</span>)}
              </div>
              <Chip tone="gold" dot>Grupo {grupoActual}</Chip>
              <Chip tone="navy">Prof. {docente.split(' ')[0]}</Chip>
              {proximoPer && <Chip tone="navy">Próximo: {proximoPer}</Chip>}
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'center' }}>
            <Ring pct={s.progress} size={220}>
              <div className="ring-pct">{s.progress}<sup>%</sup></div>
              <div className="ring-label">Módulo completado</div>
              <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:4 }}>18 de 32 lecciones{datosReales ? ' · datos en tiempo real' : ''}</div>
            </Ring>
          </div>
        </div>
      </div>

      {/* Banner de acceso parcial — solo cuando hay cuotas pagadas pero no todo el ciclo */}
      {acceso.nivel === 'parcial' && (
        <div style={{
          background: 'color-mix(in srgb, var(--warn) 12%, white)',
          border: '1px solid var(--warn)',
          borderRadius: 10, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 16,
        }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              Tenés {acceso.cuotasPagadas} cuota{acceso.cuotasPagadas !== 1 ? 's' : ''} pagada{acceso.cuotasPagadas !== 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>
              Lecciones {acceso.leccionesDesbloqueadas[0]}–{acceso.leccionesDesbloqueadas.at(-1)} desbloqueadas.
              Pagá la siguiente cuota para avanzar.
            </div>
          </div>
        </div>
      )}

      {/* Banner sin acceso — sin matrícula */}
      {acceso.nivel === 'sin_acceso' && datosReales && (
        <div style={{
          background: 'color-mix(in srgb, var(--danger) 10%, white)',
          border: '1px solid var(--danger)',
          borderRadius: 10, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 16,
        }}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Acceso restringido</div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>
              Pagá tu matrícula para ver el horario y las primeras lecciones.
            </div>
          </div>
        </div>
      )}

      {/* CONAPE status — solo estudiantes con convenio CONAPE */}
      {esConape && conapeEstado && (
        <div style={{
          background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
          borderRadius: 12,
          padding: '16px 20px',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 32 }}>🏛️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
              Financiamiento CONAPE
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
              {conapeEstado.estadoTexto}
            </div>
            {conapeEstado.desembolsoTexto && (
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                {conapeEstado.desembolsoTexto}
              </div>
            )}
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 8,
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: 700,
          }}>
            ✓ Activo
          </div>
        </div>
      )}

      {/* KPI stats */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <Stat label="Asistencia" num="94" suffix="%" sub="17 de 18 clases" subTone="ok" pct={94} color="var(--ok)" />
        <Stat label="Nota acumulada" num="88" suffix="/100" sub="Promedio: A − Muy bueno" subTone="ok" pct={88} color="var(--an-granate)" />
        <Stat label="Tareas pendientes" num={pendingHw.length} sub="Próxima: hoy" subTone="warn" pct={50} color="var(--warn)" />
        <Stat label="I CAN asistidas" num="8" suffix="/9" sub="Excelente participación" subTone="ok" pct={89} color="var(--an-gold)" />
      </div>

      {/* Next class — editorial card */}
      {nextClass && (
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
      )}

      {/* Two-col: timeline + side */}
      <div className="grid-2">
        {/* Timeline */}
        <div className="card">
          <div className="card-h">
            <div className="card-title">Próximas clases <small>2 semanas</small></div>
            <button className="btn btn-ghost" onClick={() => onNavigate('calendario')}>Ver calendario →</button>
          </div>
          <div className="timeline">
            {/* Próximas lecciones: pendiente de conectar a Apps Script */}
            <div style={{ padding:'24px 12px', textAlign:'center', color:'var(--ink-3)', fontSize:13 }}>
              Las próximas clases se mostrarán cuando esté conectado el cronograma del grupo.
            </div>
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
