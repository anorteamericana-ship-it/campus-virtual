/* global React, Icon, Chip, PageHeader */

const SCRIPT_URL_CR = 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';

// Hook: lee usuario de session, llama getEstudiante + getGrupoInfo en paralelo
function useCronogramaData() {
  const [data, setData]       = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError]     = React.useState(null);
  React.useEffect(() => {
    const usr      = JSON.parse(sessionStorage.getItem('an_usuario') || 'null');
    const codigo   = usr?.codigo;
    const codGrupo = usr?.grupo || usr?.grupos?.[0];
    if (!codigo || !codGrupo) { setLoading(false); setError('sin_sesion'); return; }
    Promise.all([
      fetch(`${SCRIPT_URL_CR}?fn=getEstudiante&codigo=${encodeURIComponent(codigo)}`).then(r=>r.json()),
      fetch(`${SCRIPT_URL_CR}?fn=getGrupoInfo&cod_grupo=${encodeURIComponent(codGrupo)}`).then(r=>r.json()),
      fetch(`${SCRIPT_URL_CR}?fn=getAsistenciaEstudiante&codigo=${encodeURIComponent(codigo)}`).then(r=>r.json()),
      fetch(`${SCRIPT_URL_CR}?fn=getEvaluacionesEstudiante&codigo=${encodeURIComponent(codigo)}`).then(r=>r.json()),
    ])
    .then(([est, grp, asist, eval_]) => {
      if (est.ok && grp.ok) setData({
        estudiante: est,
        grupo: grp,
        codGrupo,
        asistencia: asist?.ok ? asist.asistencia : [],
        evaluaciones: eval_?.ok ? eval_.evaluaciones : [],
      });
      else setError('No se pudo cargar el cronograma');
    })
    .catch(e => setError(e.message))
    .finally(() => setLoading(false));
  }, []);
  return { data, loading, error };
}

// ── CronogramaModulo — P7 ────────────────────────────────────────────────
// Paleta oficial por nivel (portadas Interchange 5th Ed.)
const NIVEL_COLOR = {
  B1: '#E5A823', // Intro — amarillo/dorado
  B2: '#E8372A', // Book 1 — rojo coral
  I1: '#2B7FC1', // Book 2 — azul
  I2: '#4CAF50', // Book 3 — verde
};
const NIVEL_LABEL = { B1:'Básico I', B2:'Básico II', I1:'Intermedio I', I2:'Intermedio II' };
const NIVEL_BOOK  = { B1:'Interchange Intro', B2:'Interchange 1', I1:'Interchange 2', I2:'Interchange 3' };

// ── Feriados CR 2026 ─────────────────────────────────────────────────────
const FERIADOS_2026 = new Set([
  '2026-01-01','2026-04-09','2026-04-10','2026-04-11','2026-05-01',
  '2026-07-25','2026-08-02','2026-08-15','2026-09-15',
  '2026-10-12','2026-11-01','2026-12-08','2026-12-25',
]);
const DOW_MAP = { LUN:1, MAR:2, MIE:3, MIÉ:3, JUE:4, VIE:5, SAB:6, SÁB:6 };

function nextClassDay(from, weekdays) {
  const d = new Date(from);
  d.setDate(d.getDate() + 1);
  for (let i = 0; i < 90; i++) {
    const iso = d.toISOString().slice(0,10);
    if (weekdays.includes(d.getDay()) && !FERIADOS_2026.has(iso)) return new Date(d);
    d.setDate(d.getDate() + 1);
  }
  return d;
}

function buildFechas(fechaInicio, diasStr) {
  // diasStr e.g. "LUN,MIE" or ["LUN","MIE"]
  const parts = Array.isArray(diasStr) ? diasStr : diasStr.split(/[,/\s]+/).map(s=>s.trim().toUpperCase().slice(0,3));
  const weekdays = parts.map(p => DOW_MAP[p] ?? DOW_MAP[p.slice(0,3)]).filter(Boolean);
  const dates = [];
  let cur = new Date(fechaInicio + 'T00:00:00');
  // Find first valid class day
  while (!weekdays.includes(cur.getDay()) || FERIADOS_2026.has(cur.toISOString().slice(0,10))) {
    cur.setDate(cur.getDate() + 1);
  }
  for (let i = 0; i < 32; i++) {
    dates.push(new Date(cur));
    cur = nextClassDay(cur, weekdays);
  }
  return dates;
}

function buildICANFechas(fechaInicio, diasStr) {
  // I CAN: viernes o sábado — para el prototipo, usamos viernes semanales desde inicio
  const dates = [];
  let cur = new Date(fechaInicio + 'T00:00:00');
  // advance to first Friday
  while (cur.getDay() !== 5) cur.setDate(cur.getDate() + 1);
  for (let i = 0; i < 16; i++) {
    if (!FERIADOS_2026.has(cur.toISOString().slice(0,10))) {
      dates.push(new Date(cur));
      if (dates.length === 16) break;
    }
    cur.setDate(cur.getDate() + 7);
  }
  return dates;
}

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DIAS_LABEL = ['dom','lun','mar','mié','jue','vie','sáb'];
function fmtFecha(d) {
  if (!d) return '—';
  return `${DIAS_LABEL[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtCorto(d) {
  if (!d) return '—';
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

// Exámenes INA (escrito = 5%, ICAN cubre el 20% restante)
const EXAMENES_INA = {
  9:  { tipo:'oral',    label:'1er Oral',     unidades:'U1–4',   peso:15 },
  17: { tipo:'oral',    label:'2do Oral',     unidades:'U5–8',   peso:15 },
  18: { tipo:'escrito', label:'1er Escrito',  unidades:'U1–8',   peso:5  },
  25: { tipo:'oral',    label:'3er Oral',     unidades:'U9–12',  peso:15 },
  31: { tipo:'oral',    label:'4to Oral',     unidades:'U13–16', peso:15 },
  32: { tipo:'escrito', label:'2do Escrito',  unidades:'U9–16',  peso:5  },
};
// Exámenes sin INA (escrito = 15%, no hay ICAN en el peso)
const EXAMENES_NO_INA = {
  9:  { tipo:'oral',    label:'1er Oral',     unidades:'U1–4',   peso:15 },
  17: { tipo:'oral',    label:'2do Oral',     unidades:'U5–8',   peso:15 },
  18: { tipo:'escrito', label:'1er Escrito',  unidades:'U1–8',   peso:15 },
  25: { tipo:'oral',    label:'3er Oral',     unidades:'U9–12',  peso:15 },
  31: { tipo:'oral',    label:'4to Oral',     unidades:'U13–16', peso:15 },
  32: { tipo:'escrito', label:'2do Escrito',  unidades:'U9–16',  peso:15 },
};
const PROGRESS_CHECKS = [4,8,13,16,21,24,28,30];
// I CAN intercalado: cada 2 lecciones hay 1 sesión ICAN
const ICAN_AFTER_LEC = [2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,31];

// ─────────────────────────────────────────────────────────────────────────
// DATOS DE PRUEBA
// ─────────────────────────────────────────────────────────────────────────
// Mapas para derivar campos del código del grupo (ej. B1-LM69-C1-0126)
const DIAS_LABEL_CR = { LM:'Lun/Mié', KJ:'Mar/Jue', LJ:'Lun-Jue', SA:'Sáb' };
const DIAS_ARRAY_CR = { LM:['LUN','MIE'], KJ:['MAR','JUE'], LJ:['LUN','MAR','MIE','JUE'], SA:['SAB'] };
const MODALIDAD_LBL = { C:'CUATRIMESTRE', B:'BIMESTRE', S:'SEMESTRE' };

// ─────────────────────────────────────────────────────────────────────────
// RETRO AUTOMÁTICA INA — fallback cuando el profe no ha escrito la suya
// ─────────────────────────────────────────────────────────────────────────
const PC_UNIDADES = {
  4:'Unidades 1 y 2 (saludos, presentaciones, alfabeto)',
  8:'Unidades 3 y 4 (posesivos, ropa, colores, clima)',
  13:'Unidades 5 y 6 (la hora, rutinas, vocabulario turístico)',
  16:'Unidades 7 y 8 (planes, tareas, ocupaciones)',
  21:'Unidades 9 y 10 (comida, hábitos, deportes)',
  24:'Unidades 11 y 12 (ubicaciones, can/can\'t, present continuous)',
  28:'Unidades 13 y 14 (going to, past simple)',
  30:'Unidades 15 y 16 (origen, must/mustn\'t)',
};

function getRetroAutomatica(lec) {
  if (lec.estado === 'A') {
    if (lec.esProgress) {
      const u = PC_UNIDADES[lec.n] || 'las unidades correspondientes';
      return `No se registró asistencia al Progress Check. Para ponerte al día: repasá ${u}. Coordiná con tu docente si necesitás retroalimentación adicional.`;
    }
    if (lec.esExamen) {
      return `No se registró asistencia a este examen. Contactá a tu docente o administración para conocer el proceso de recuperación.`;
    }
    return `No se registró asistencia en esta lección. Repasá el material de la unidad correspondiente en Materiales, y coordiná con tu docente si tenés dudas del contenido perdido.`;
  }
  if (lec.esProgress && lec.estado === 'P') {
    const u = PC_UNIDADES[lec.n] || 'las unidades correspondientes';
    return `Progress Check completado. Revisá tu desempeño en ${u}. Tu docente anotará retroalimentación específica próximamente.`;
  }
  return null;
}

// Mapa leccion_num → estado ("P"/"A"/"J") a partir del array de asistencia del backend
function buildAsistenciaMap(asistencia) {
  const map = {};
  (asistencia || []).forEach(r => {
    map[String(r.leccion_num)] = r.estado;
  });
  return map;
}

// Mapa leccion_num → { nota, max, tipo, fecha } a partir del array de evaluaciones del backend
function buildEvaluacionesMap(evaluaciones) {
  const map = {};
  (evaluaciones || []).forEach(r => {
    map[String(r.leccion_num)] = {
      nota:  parseFloat(r.nota)     || 0,
      max:   parseFloat(r.nota_max) || 15,
      tipo:  r.tipo,
      fecha: r.fecha,
    };
  });
  return map;
}

function buildLecciones(grupo, asistMap = {}, evalMap = {}) {
  const fechas = buildFechas(grupo.fechaInicio, grupo.diasClase);
  const retros = {
    1: 'Excelente primera clase. Tu pronunciación fue clara y participaste activamente en las presentaciones.',
    3: 'Buena participación hoy. Trabaja más en la formación de preguntas con "do/does".',
    5: 'Gran mejora en vocabulario. Las preposiciones de lugar siguen siendo un área de práctica.',
    7: 'Mostraste confianza al hablar. Practica más la entonación en preguntas yes/no.',
  };
  const examenesMap = grupo.esINA ? EXAMENES_INA : EXAMENES_NO_INA;
  return fechas.map((fecha, i) => {
    const n = i + 1;
    const lec = {
      n, fecha,
      estado: asistMap[String(n)] || null,
      retroalimentacion: retros[n] || null,
      esExamen: examenesMap[n] || null,
      esProgress: PROGRESS_CHECKS.includes(n),
      evalNota: null,
      eval: evalMap[String(n)] || null,
    };
    // INA: retro automática obligatoria en ausencias y progress checks sin retro del profe
    if (grupo.esINA && !lec.retroalimentacion) {
      lec.retroalimentacion = getRetroAutomatica(lec);
    }
    return lec;
  });
}

function buildICANSesiones(grupo) {
  const fechas = buildICANFechas(grupo.fechaInicio, grupo.diasClase);
  return fechas.map((fecha, i) => ({
    n: i + 1,
    fecha,
    estado: null,
    retro: i===0 ? 'Buena participación en la conversación sobre saludos y presentaciones.' : null,
  }));
}

// ─────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────
function CronogramaModulo() {
  const { data, loading, error } = useCronogramaData();
  const [vista, setVista] = React.useState('cuadricula'); // cuadricula | lista
  const [leccionAbierta, setLeccionAbierta] = React.useState(null);

  if (loading) return <div style={{padding:40,textAlign:'center',color:'var(--ink-3)'}}>Cargando cronograma…</div>;
  if (error === 'sin_sesion') return (
    <div style={{ padding:40, textAlign:'center', color:'var(--ink-3)' }}>
      <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
      <div style={{ fontFamily:'var(--f-serif)', fontSize:18, color:'var(--ink)' }}>
        Seleccioná un estudiante para ver su cronograma
      </div>
      <div style={{ fontSize:13, marginTop:8 }}>
        Usá el panel superior para cargar un código de expediente.
      </div>
    </div>
  );
  if (error || !data) return <div style={{padding:40,textAlign:'center',color:'var(--ink-3)'}}>No se pudo cargar el cronograma.</div>;

  // Construir estudiante + grupo en la forma que espera el resto del componente
  const est       = data.estudiante.estudiante || {};
  const estudiante = {
    nombre: est.NOMBRE  || '—',
    cedula: est.CEDULA  || '—',
    codigo: est.CODIGO  || '—',
  };
  const codGrupo  = data.codGrupo || '';
  const partes    = codGrupo.split('-');
  const diasCode  = (partes[1] || 'LM').replace(/\d/g, '').toUpperCase();
  const periodCh  = (partes[2] || 'C1').charAt(0).toUpperCase();
  const grupo = {
    codigo:       codGrupo,
    nivel:        (data.grupo.levelId || 'b1').toUpperCase(),
    modalidad:    MODALIDAD_LBL[periodCh] || 'CUATRIMESTRE',
    docente:      data.grupo.teacherName || data.estudiante.grupo?.DOCENTE || '—',
    horario:      DIAS_LABEL_CR[diasCode] || 'Lun/Mié',
    esINA:        data.grupo.programa === 'CON_INA',
    fechaInicio:  data.grupo.startDate,
    diasClase:    DIAS_ARRAY_CR[diasCode] || ['LUN','MIE'],
  };

  const asistMap  = React.useMemo(() => buildAsistenciaMap(data.asistencia), [data.asistencia]);
  const evalMap   = React.useMemo(() => buildEvaluacionesMap(data.evaluaciones), [data.evaluaciones]);
  const lecciones = React.useMemo(() => buildLecciones(grupo, asistMap, evalMap), [grupo, asistMap, evalMap]);
  const icanSes   = React.useMemo(() => (grupo.esINA ? buildICANSesiones(grupo) : []), [grupo]);

  const color = NIVEL_COLOR[grupo.nivel] || NIVEL_COLOR.B1;
  const colorDark = grupo.nivel==='B1'?'#8B6210':grupo.nivel==='B2'?'#7B1515':grupo.nivel==='I1'?'#1A4F7A':'#2D7A30';

  // Cálculo de asistencia
  const lecsDadas    = lecciones.filter(l => l.estado !== null);
  const lecsPresente = lecciones.filter(l => l.estado === 'P').length;
  const lecsAusente  = lecciones.filter(l => l.estado === 'A').length;
  const pctCurso     = lecsDadas.length ? Math.round((lecsPresente / 32) * 100) : null;
  const icanDadas    = icanSes.filter(s => s.estado !== null);
  const icanPresente = icanSes.filter(s => s.estado === 'P').length;
  const icanAusente  = icanSes.filter(s => s.estado === 'A').length;
  const pctICAN      = icanDadas.length ? Math.round((icanPresente / 16) * 100) : null;

  // Tabla de evaluaciones — pesos varían según INA, notas vienen de evalMap
  const examenesMap = grupo.esINA ? EXAMENES_INA : EXAMENES_NO_INA;
  const notaDe = (n) => evalMap[String(n)]?.nota ?? null;
  const evaluaciones = [
    { n:9,  ...examenesMap[9],  nota:notaDe(9),  max:25 },
    { n:17, ...examenesMap[17], nota:notaDe(17), max:25 },
    { n:18, ...examenesMap[18], nota:notaDe(18), max:25 },
    { n:25, ...examenesMap[25], nota:notaDe(25), max:25 },
    { n:31, ...examenesMap[31], nota:notaDe(31), max:25 },
    { n:32, ...examenesMap[32], nota:notaDe(32), max:25 },
    { n:0,  tipo:'social', label:'Participación Social', unidades:'L1–32', peso:10, nota:null, max:10 },
    ...(grupo.esINA ? [{ n:-1, tipo:'ican', label:'Club I CAN', unidades:'S1–16', peso:20, nota:null, max:20 }] : []),
  ];
  const notaTotal = evaluaciones.reduce((acc, e) => {
    if (e.nota == null) return acc;
    return acc + Math.round((e.nota / e.max) * e.peso);
  }, 0);
  const notaTotalPosible = evaluaciones.reduce((acc, e) => acc + e.peso, 0); // 100

  // Siguiente clase
  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  const proxima = lecciones.find(l => l.fecha >= hoy);

  return (
    <div>
      {/* ── HEADER DEL CRONOGRAMA ────────────────────────────────────────── */}
      <div style={{
        background: color,
        borderRadius: 'var(--r-xl)',
        padding: '22px 28px',
        marginBottom: 16,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Watermark nivel */}
        <div style={{
          position:'absolute', right:-20, top:-30,
          fontFamily:'var(--f-serif)', fontSize:180, fontWeight:700,
          color:'rgba(255,255,255,0.1)', lineHeight:1, pointerEvents:'none', userSelect:'none',
        }}>{grupo.nivel}</div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:20, alignItems:'flex-start', position:'relative' }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', opacity:0.8, marginBottom:6 }}>
              Cronograma de Módulo · {NIVEL_LABEL[grupo.nivel]}
            </div>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:26, fontWeight:500, letterSpacing:'-0.025em', lineHeight:1.1, marginBottom:12 }}>
              {estudiante.nombre}
            </div>

            {/* Datos en grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, auto)', gap:'4px 24px', fontSize:12, opacity:0.9 }}>
              {[
                ['Cédula', estudiante.cedula],
                ['Código', estudiante.codigo],
                ['Grupo', grupo.codigo],
                ['Nivel', `${NIVEL_LABEL[grupo.nivel]} · ${NIVEL_BOOK[grupo.nivel]}`],
                ['Docente', grupo.docente],
                ['Horario', grupo.horario],
                ['Modalidad', grupo.modalidad],
                ['Inicio', fmtFecha(new Date(grupo.fechaInicio + 'T00:00:00'))],
                ['Tipo', grupo.esINA ? 'INA – Acreditado' : 'Programa propio'],
              ].map(([k,v]) => (
                <div key={k}>
                  <span style={{ opacity:0.7, marginRight:4 }}>{k}:</span>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Nota total + status aprobación */}
          <div style={{ textAlign:'center', background:'rgba(255,255,255,0.15)', borderRadius:'var(--r-lg)', padding:'16px 24px', backdropFilter:'blur(8px)' }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', opacity:0.8, marginBottom:4 }}>Nota total</div>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:52, fontWeight:500, lineHeight:1, letterSpacing:'-0.04em' }}>
              {notaTotal || '—'}
            </div>
            <div style={{ fontSize:11, opacity:0.75, marginTop:4 }}>de 100%</div>
            {notaTotal >= 70 && (
              <div style={{ marginTop:8, padding:'4px 10px', background:'rgba(255,255,255,0.25)', borderRadius:'var(--r-pill)', fontSize:10, fontWeight:700 }}>
                ✓ APRUEBA
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RESÚMENES DE ASISTENCIA ──────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns: grupo.esINA ? '1fr 1fr' : '1fr', gap:12, marginBottom:16 }}>
        {/* Asistencia curso */}
        <AsistenciaCard
          titulo="Asistencia al Curso · Mínimo 85%"
          presente={lecsPresente}
          ausente={lecsAusente}
          total={32}
          horas={lecsPresente * 3}
          totalHoras={96}
          pct={pctCurso}
          minPct={85}
          maxAusencias={4}
          color={color}
          alerta={lecsAusente > 4 ? `⚠ ${lecsAusente} ausencias — supera el máximo INA (4)` : lecsAusente === 4 ? '⚠ En el límite máximo de ausencias' : null}
        />
        {/* Asistencia I CAN */}
        {grupo.esINA && (
          <AsistenciaCard
            titulo="Asistencia Club I CAN · Máx. 2 ausencias"
            presente={icanPresente}
            ausente={icanAusente}
            total={16}
            horas={icanPresente * 2}
            totalHoras={32}
            pct={pctICAN}
            minPct={null}
            maxAusencias={2}
            color="#008080"
            alerta={icanAusente > 2 ? `⚠ ${icanAusente} ausencias — supera el máximo INA (2)` : null}
          />
        )}
      </div>

      {/* ── TABLA DE EVALUACIONES (solo INA) ────────────────────────────── */}
      {grupo.esINA && (
        <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:16 }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div className="card-title" style={{ fontSize:17 }}>Evaluaciones</div>
            <div style={{ fontSize:11, color:'var(--ink-3)' }}>
              Nota de aprobación: <strong style={{ color: notaTotal >= 70 ? 'var(--ok)' : 'var(--danger)' }}>70%</strong>
            </div>
          </div>
          <table className="table-soft" style={{ fontSize:12 }}>
            <thead>
              <tr>
                <th>Evaluación</th>
                <th style={{ textAlign:'center' }}>Lección</th>
                <th style={{ textAlign:'center' }}>Unidades</th>
                <th style={{ textAlign:'center' }}>Peso</th>
                <th style={{ textAlign:'center' }}>Nota</th>
                <th style={{ textAlign:'center' }}>%Obtenido</th>
              </tr>
            </thead>
            <tbody>
              {evaluaciones.map((e,i) => {
                const pctObt = e.nota != null ? Math.round((e.nota/e.max)*e.peso) : null;
                const tipoColor = e.tipo==='oral'?color:e.tipo==='escrito'?'var(--an-granate)':e.tipo==='social'?'var(--an-navy)':'#008080';
                return (
                  <tr key={i}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ width:8, height:8, borderRadius:'50%', background:tipoColor, flexShrink:0 }} />
                        <span style={{ fontWeight:600 }}>{e.label}</span>
                      </div>
                    </td>
                    <td style={{ textAlign:'center', fontFamily:'var(--f-mono)', color:'var(--ink-3)' }}>
                      {e.n > 0 ? `L${e.n}` : '—'}
                    </td>
                    <td style={{ textAlign:'center', color:'var(--ink-2)' }}>{e.unidades}</td>
                    <td style={{ textAlign:'center' }}>
                      <span style={{ fontFamily:'var(--f-mono)', fontWeight:700, color:tipoColor }}>{e.peso}%</span>
                    </td>
                    <td style={{ textAlign:'center' }}>
                      {e.nota != null
                        ? <span style={{ fontFamily:'var(--f-mono)', fontWeight:700 }}>{e.nota}/{e.max}</span>
                        : <span style={{ color:'var(--ink-3)' }}>—</span>}
                    </td>
                    <td style={{ textAlign:'center' }}>
                      {pctObt != null
                        ? <span style={{ fontFamily:'var(--f-mono)', fontWeight:700, color: pctObt >= e.peso*0.7 ? 'var(--ok)' : 'var(--danger)' }}>{pctObt}%</span>
                        : <span style={{ color:'var(--ink-3)' }}>pendiente</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background:'var(--surface-2)' }}>
                <td colSpan={3} style={{ padding:'12px 14px', fontWeight:700, fontSize:13 }}>TOTAL</td>
                <td style={{ textAlign:'center', fontFamily:'var(--f-mono)', fontWeight:700, color:'var(--an-navy)' }}>100%</td>
                <td></td>
                <td style={{ textAlign:'center' }}>
                  <span style={{ fontFamily:'var(--f-serif)', fontSize:20, fontWeight:600, color: notaTotal >= 70 ? 'var(--ok)' : notaTotal > 0 ? 'var(--warn)' : 'var(--ink-3)' }}>
                    {notaTotal > 0 ? `${notaTotal}%` : '—'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── SELECTOR DE VISTA ────────────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexWrap:'wrap', gap:10 }}>
        <div>
          <div className="card-title" style={{ fontSize:17 }}>
            {vista === 'lista' ? 'Lecciones — Vista lista' : 'Vista cuadrícula'}
          </div>
          {proxima && (
            <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:2 }}>
              Próxima: <strong>L{proxima.n}</strong> · {fmtFecha(proxima.fecha)}
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:4, background:'var(--bg-deep)', padding:4, borderRadius:'var(--r-md)' }}>
          {[['lista','☰ Lista'],['cuadricula','⊞ Cuadrícula']].map(([k,l]) => (
            <button key={k} onClick={() => setVista(k)} style={{
              padding:'7px 14px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:600,
              background: vista===k ? 'var(--surface)' : 'transparent',
              color: vista===k ? 'var(--ink)' : 'var(--ink-3)',
              boxShadow: vista===k ? 'var(--sh-1)' : 'none',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── VISTAS ───────────────────────────────────────────────────────── */}
      {vista === 'lista'
        ? <VistaLista lecciones={lecciones} icanSes={icanSes} color={color} esINA={grupo.esINA}
            leccionAbierta={leccionAbierta} setLeccionAbierta={setLeccionAbierta} />
        : <VistaCuadricula lecciones={lecciones} icanSes={icanSes} color={color} esINA={grupo.esINA}
            leccionAbierta={leccionAbierta} setLeccionAbierta={setLeccionAbierta} />}

      {/* ── PROGRESS CHECKS (solo INA) ───────────────────────────────────── */}
      {grupo.esINA && (
        <div style={{ marginTop:20 }}>
          <div className="card-title" style={{ marginBottom:12, fontSize:17 }}>Progress Checks</div>
          <div style={{ padding:'10px 14px', background:'color-mix(in srgb, var(--an-navy) 6%, white)', border:'1px solid color-mix(in srgb, var(--an-navy) 20%, white)', borderRadius:'var(--r-md)', fontSize:12, color:'var(--an-navy-ink)', marginBottom:12 }}>
            ℹ️ Los Progress Checks son evaluaciones formativas por pares — <strong>no tienen nota</strong>. Solo retroalimentación escrita del docente. No afectan el porcentaje final.
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            {PROGRESS_CHECKS.map((n,i) => {
              const lec = lecciones.find(l => l.n===n);
              const unidades = ['U1–U2','U3–U4','U5–U6','U7–U8','U9–U10','U11–U12','U13–U14','U15–U16'][i];
              const hecho = lec && lec.estado !== null;
              return (
                <div key={n} style={{
                  padding:'14px', borderRadius:'var(--r-md)',
                  background: hecho ? 'var(--surface)' : 'var(--surface-2)',
                  border: `1px solid ${hecho ? color : 'var(--line)'}`,
                  opacity: hecho ? 1 : 0.65,
                }}>
                  <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:hecho?color:'var(--ink-3)', marginBottom:4 }}>
                    PC {i+1} · {unidades}
                  </div>
                  <div style={{ fontFamily:'var(--f-mono)', fontWeight:700, fontSize:13, color:'var(--ink)', marginBottom:2 }}>
                    L{n}
                  </div>
                  <div style={{ fontSize:11, color:'var(--ink-3)' }}>
                    {lec ? fmtCorto(lec.fecha) : '—'}
                  </div>
                  {lec?.retroalimentacion && (
                    <div style={{ fontSize:11, color:'var(--ink-2)', marginTop:8, lineHeight:1.4, paddingTop:8, borderTop:'1px dashed var(--line)' }}>
                      {lec.retroalimentacion}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TARJETA DE ASISTENCIA
// ─────────────────────────────────────────────────────────────────────────
function AsistenciaCard({ titulo, presente, ausente, total, horas, totalHoras, pct, minPct, maxAusencias, color, alerta }) {
  const pctDisplay = pct ?? 0;
  const cumple = ausente <= maxAusencias;
  const barColor = !cumple ? 'var(--danger)' : minPct && pctDisplay < minPct ? 'var(--warn)' : 'var(--ok)';

  return (
    <div className="card" style={{ padding:'18px 20px', borderLeft:`5px solid ${barColor}` }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:10 }}>
        {titulo}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:32, fontWeight:500, letterSpacing:'-0.03em', color:'var(--ok)', lineHeight:1 }}>{presente}</div>
          <div style={{ fontSize:10, color:'var(--ink-3)', marginTop:3 }}>presentes</div>
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:32, fontWeight:500, letterSpacing:'-0.03em', color: ausente > maxAusencias ? 'var(--danger)' : 'var(--warn)', lineHeight:1 }}>{ausente}</div>
          <div style={{ fontSize:10, color:'var(--ink-3)', marginTop:3 }}>ausencias</div>
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:32, fontWeight:500, letterSpacing:'-0.03em', color: pctDisplay >= (minPct||70) ? 'var(--ok)' : 'var(--danger)', lineHeight:1 }}>
            {pct != null ? `${pct}%` : '—'}
          </div>
          <div style={{ fontSize:10, color:'var(--ink-3)', marginTop:3 }}>{horas}h / {totalHoras}h</div>
        </div>
      </div>
      <div style={{ height:8, background:'var(--bg-deep)', borderRadius:4, overflow:'hidden', marginBottom:6 }}>
        <div style={{ width:`${Math.min(pctDisplay,100)}%`, height:'100%', background:barColor, borderRadius:4, transition:'width .6s' }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--ink-3)' }}>
        <span>Máx. ausencias: <strong style={{ color: !cumple?'var(--danger)':'var(--ink-2)' }}>{maxAusencias}</strong></span>
        {minPct && <span>Mínimo: {minPct}%</span>}
        <span>Total: {total} sesiones</span>
      </div>
      {alerta && (
        <div style={{ marginTop:8, padding:'6px 10px', background:'color-mix(in srgb, var(--danger) 8%, white)', border:'1px solid color-mix(in srgb, var(--danger) 25%, white)', borderRadius:6, fontSize:11, color:'var(--danger)', fontWeight:600 }}>
          {alerta}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// VISTA LISTA
// ─────────────────────────────────────────────────────────────────────────
function VistaLista({ lecciones, icanSes, color, esINA, leccionAbierta, setLeccionAbierta }) {
  const hoy = new Date();
  hoy.setHours(0,0,0,0);

  const LecRow = ({ lec }) => {
    const abierta = leccionAbierta === lec.n;
    const isPast = lec.fecha < hoy;
    const isToday = lec.fecha.toDateString() === hoy.toDateString();
    const isExamen = !!lec.esExamen;
    const isProgress = lec.esProgress;

    const rowBg = isExamen ? `color-mix(in srgb, ${color} 5%, white)` :
                  isProgress ? 'color-mix(in srgb, var(--an-navy) 3%, white)' :
                  isToday ? 'color-mix(in srgb, var(--ok) 4%, white)' :
                  'var(--surface)';

    const estadoColor = lec.estado === 'P' ? 'var(--ok)' : lec.estado === 'A' ? 'var(--danger)' : 'var(--ink-3)';
    const estadoLabel = lec.estado === 'P' ? 'PRESENTE' : lec.estado === 'A' ? 'AUSENTE' : isPast ? 'PASADA' : isToday ? 'HOY' : 'PENDIENTE';

    return (
      <>
        <tr onClick={() => setLeccionAbierta(abierta ? null : lec.n)} style={{
          cursor:'pointer', background:rowBg,
          borderLeft: isToday ? `3px solid var(--ok)` : isExamen ? `3px solid ${color}` : '3px solid transparent',
        }}>
          <td style={{ fontFamily:'var(--f-mono)', fontWeight:700, color: isExamen?color:isProgress?'var(--an-navy)':'var(--ink-3)', textAlign:'center' }}>
            {String(lec.n).padStart(2,'0')}
          </td>
          <td style={{ fontSize:12 }}>{fmtFecha(lec.fecha)}</td>
          <td>
            {isExamen && (
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ padding:'2px 8px', background:color, color:'white', borderRadius:'var(--r-pill)', fontSize:10, fontWeight:700 }}>
                  {lec.esExamen.label}
                </span>
                <span style={{ fontSize:11, color:'var(--ink-3)' }}>{lec.esExamen.unidades} · {lec.esExamen.peso}%</span>
              </div>
            )}
            {isProgress && !isExamen && (
              <span style={{ padding:'2px 8px', background:'color-mix(in srgb, var(--an-navy) 10%, white)', color:'var(--an-navy)', borderRadius:'var(--r-pill)', fontSize:10, fontWeight:700 }}>
                Progress Check
              </span>
            )}
            {!isExamen && !isProgress && <span style={{ fontSize:12, color:'var(--ink-2)' }}>Lección regular</span>}
          </td>
          <td style={{ textAlign:'center' }}>
            <span style={{ fontFamily:'var(--f-mono)', fontSize:11, fontWeight:700, color:estadoColor,
              padding:'3px 8px', borderRadius:'var(--r-pill)',
              background: lec.estado === 'P' ? 'color-mix(in srgb, var(--ok) 10%, white)' :
                          lec.estado === 'A' ? 'color-mix(in srgb, var(--danger) 10%, white)' :
                          'var(--bg-deep)',
            }}>
              {estadoLabel}
            </span>
          </td>
          <td style={{ textAlign:'center', color:'var(--ink-3)', fontSize:14 }}>
            {lec.retroalimentacion ? '💬' : '—'}
          </td>
        </tr>
        {abierta && lec.retroalimentacion && (
          <tr style={{ background:'var(--surface-2)' }}>
            <td colSpan={5} style={{ padding:'12px 20px', borderTop:'1px dashed var(--line)' }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:color, marginBottom:4 }}>
                Retroalimentación del docente · L{lec.n}
              </div>
              <div style={{ fontSize:13, color:'var(--ink-2)', lineHeight:1.55 }}>{lec.retroalimentacion}</div>
            </td>
          </tr>
        )}
        {abierta && !lec.retroalimentacion && (
          <tr style={{ background:'var(--surface-2)' }}>
            <td colSpan={5} style={{ padding:'10px 20px', fontSize:12, color:'var(--ink-3)', fontStyle:'italic', borderTop:'1px dashed var(--line)' }}>
              Sin retroalimentación registrada para esta lección.
            </td>
          </tr>
        )}
      </>
    );
  };

  return (
    <div>
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table className="table-soft" style={{ fontSize:12 }}>
          <thead>
            <tr>
              <th style={{ textAlign:'center', width:52 }}>Lec.</th>
              <th>Fecha</th>
              <th>Tipo</th>
              <th style={{ textAlign:'center', width:110 }}>Asistencia</th>
              <th style={{ textAlign:'center', width:50 }}>Retro</th>
            </tr>
          </thead>
          <tbody>
            {lecciones.map(l => <LecRow key={l.n} lec={l} />)}
          </tbody>
        </table>
      </div>

      {esINA && icanSes.length > 0 && (
        <div style={{ marginTop:20 }}>
          <div className="card-title" style={{ marginBottom:10, fontSize:17 }}>Sesiones Club I CAN</div>
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <table className="table-soft" style={{ fontSize:12 }}>
              <thead>
                <tr>
                  <th style={{ textAlign:'center', width:52 }}>Ses.</th>
                  <th>Fecha</th>
                  <th style={{ textAlign:'center' }}>Asistencia</th>
                  <th>Retroalimentación</th>
                </tr>
              </thead>
              <tbody>
                {icanSes.map(s => {
                  const eColor = s.estado==='P'?'var(--ok)':s.estado==='A'?'var(--danger)':'var(--ink-3)';
                  return (
                    <tr key={s.n}>
                      <td style={{ fontFamily:'var(--f-mono)', fontWeight:700, color:'#008080', textAlign:'center' }}>I{String(s.n).padStart(2,'0')}</td>
                      <td style={{ fontSize:12 }}>{fmtFecha(s.fecha)}</td>
                      <td style={{ textAlign:'center' }}>
                        {s.estado ? (
                          <span style={{ fontFamily:'var(--f-mono)', fontSize:11, fontWeight:700, color:eColor,
                            padding:'3px 8px', borderRadius:'var(--r-pill)',
                            background:s.estado==='P'?'color-mix(in srgb, var(--ok) 10%, white)':'color-mix(in srgb, var(--danger) 10%, white)',
                          }}>{s.estado==='P'?'PRESENTE':'AUSENTE'}</span>
                        ) : <span style={{ color:'var(--ink-3)' }}>—</span>}
                      </td>
                      <td style={{ fontSize:11, color:'var(--ink-2)' }}>{s.retro || <span style={{ color:'var(--ink-3)' }}>—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// VISTA CUADRÍCULA — layout real del cronograma
// INA:    6 columnas por fila: L1 · L2 · ICAN1 ║ L3 · L4 · ICAN2
// No-INA: 4 columnas por fila: L1 · L2 · L3 · L4
// ─────────────────────────────────────────────────────────────────────────
function VistaCuadricula({ lecciones, icanSes, color, esINA, leccionAbierta, setLeccionAbierta }) {
  const hoy = new Date();
  hoy.setHours(0,0,0,0);

  // Leyenda
  const leyenda = [
    { color:'#1B8A1B', label:'PRESENTE' },
    { color:'#C00000', label:'AUSENTE'  },
    { color:color,     label:'Examen'   },
    { color:'var(--an-navy)', label:'Progress Check' },
    { color:'#008080', label:'I CAN'    },
    { color:'var(--bg-deep)', label:'Pendiente' },
  ];

  // Construir grupos: INA → grupos de [L(2k-1), L(2k), ICAN(k)]
  // Poner 2 grupos por fila → 6 celdas por fila
  const grupos = [];
  if (esINA) {
    let ican = 0;
    for (let i = 0; i < lecciones.length; i += 2) {
      grupos.push({ l1: lecciones[i], l2: lecciones[i+1], ican: icanSes[ican++] || null });
    }
  }

  // Tarjeta de lección — diseño para rango 16-50 años
  const TarjetaLec = ({ lec }) => {
    if (!lec) return null;
    const abierta = leccionAbierta === lec.n;
    const isPast = lec.fecha < hoy;
    const isToday = lec.fecha.toDateString() === hoy.toDateString();
    const isExamen = !!lec.esExamen;
    const isProgress = lec.esProgress;

    // Colores de asistencia — sólidos, sin medias tintas
    const asistColor = lec.estado === 'P' ? '#1B8A1B' :
                       lec.estado === 'A' ? '#C00000' : null;

    // Borde según tipo
    const borderColor = isExamen ? color :
                        isProgress ? 'var(--an-navy)' :
                        isToday ? '#1B8A1B' :
                        'var(--line-2)';

    // Fondo de la tarjeta
    const bgColor = isExamen ? `color-mix(in srgb, ${color} 6%, white)` :
                    isProgress ? 'color-mix(in srgb, var(--an-navy) 4%, white)' :
                    isToday ? 'color-mix(in srgb, #1B8A1B 4%, white)' :
                    isPast ? 'var(--surface)' : '#FAFAF8';

    return (
      <div
        onClick={() => setLeccionAbierta(abierta ? null : lec.n)}
        style={{
          background: bgColor,
          border: `2px solid ${abierta ? borderColor : isExamen || isProgress || isToday ? borderColor : 'var(--line)'}`,
          borderRadius: 10,
          padding: '14px 14px 12px',
          cursor: 'pointer',
          transition: 'box-shadow .15s',
          boxShadow: abierta ? '0 4px 18px rgba(0,0,0,0.12)' : 'none',
          position: 'relative',
          minHeight: 160,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Fila superior: número + badge asistencia */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <div style={{
            fontSize:13, fontWeight:700,
            color: isExamen ? color : isProgress ? 'var(--an-navy)' : 'var(--ink-3)',
            letterSpacing:'0.02em',
          }}>
            Lección {String(lec.n).padStart(2,'0')}
          </div>
          {asistColor && (
            <div style={{
              background: asistColor, color:'white',
              fontSize:11, fontWeight:800,
              padding:'3px 10px', borderRadius:6,
              letterSpacing:'0.05em',
            }}>
              {lec.estado === 'P' ? 'PRESENTE' : 'AUSENTE'}
            </div>
          )}
        </div>

        {/* Fecha — grande y clara */}
        <div style={{
          fontSize:16, fontWeight:600,
          color: isPast ? 'var(--ink-2)' : 'var(--ink)',
          marginBottom:6,
          letterSpacing:'-0.01em',
        }}>
          {fmtFecha(lec.fecha)}
        </div>

        {/* Badge examen o progress */}
        {isExamen && (
          <div style={{
            display:'inline-block',
            background: color, color:'white',
            fontSize:11, fontWeight:700,
            padding:'3px 9px', borderRadius:5,
            marginBottom:6,
          }}>
            {lec.esExamen.label} · {lec.esExamen.peso}%
          </div>
        )}
        {isProgress && !isExamen && (
          <div style={{
            display:'inline-block',
            background:'var(--an-navy)', color:'white',
            fontSize:11, fontWeight:700,
            padding:'3px 9px', borderRadius:5,
            marginBottom:6,
          }}>
            Progress Check
          </div>
        )}

        {/* Comentario del docente — siempre visible, sin truncar */}
        {lec.retroalimentacion && (
          <div style={{
            marginTop:8,
            paddingTop:8,
            borderTop:`1px solid ${borderColor === 'var(--line-2)' ? 'var(--line)' : `color-mix(in srgb, ${borderColor} 20%, var(--line))`}`,
            fontSize:14,
            color:'var(--ink-2)',
            lineHeight:1.55,
          }}>
            <span style={{ fontWeight:700, color: isExamen?color:'var(--an-granate)', marginRight:4 }}>Profe:</span>
            {abierta ? lec.retroalimentacion : (
              lec.retroalimentacion.length > 90
                ? <>
                    {lec.retroalimentacion.slice(0,90)}…{' '}
                    <span style={{ color:color, fontWeight:600, fontSize:12 }}>Ver más</span>
                  </>
                : lec.retroalimentacion
            )}
          </div>
        )}

        {/* Panel expandido completo */}
        {abierta && lec.retroalimentacion && lec.retroalimentacion.length > 90 && (
          <div style={{
            marginTop:6, padding:'12px 14px',
            background:'var(--surface)', border:`2px solid ${color}`,
            borderRadius:10, boxShadow:'0 6px 24px rgba(0,0,0,0.15)',
            position:'absolute', top:'calc(100% + 6px)', left:0, right:0, zIndex:20,
          }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:color, marginBottom:6 }}>
              Retroalimentación completa · Lección {lec.n}
            </div>
            <div style={{ fontSize:14, color:'var(--ink)', lineHeight:1.6 }}>
              {lec.retroalimentacion}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Tarjeta I CAN — más compacta
  const TarjetaICAN = ({ ses }) => {
    if (!ses) return (
      <div style={{
        background:'var(--bg-deep)', border:'1px solid var(--line)',
        borderRadius:8, padding:'10px 12px', opacity:0.4,
        display:'flex', alignItems:'center', justifyContent:'center',
        minHeight:80,
      }}>
        <span style={{ fontSize:12, color:'var(--ink-3)' }}>I CAN —</span>
      </div>
    );

    const asistColor = ses.estado==='P' ? '#1B8A1B' : ses.estado==='A' ? '#C00000' : null;
    const estadoLabel = ses.estado==='P' ? 'ASISTIÓ' : ses.estado==='A' ? 'AUSENTE' : 'No inscrito';

    return (
      <div style={{
        background: ses.estado ? 'color-mix(in srgb, #008080 6%, white)' : '#F5F5F5',
        border:`1.5px solid ${ses.estado ? '#008080' : 'var(--line)'}`,
        borderRadius:8,
        padding:'10px 12px',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#008080', letterSpacing:'0.08em', textTransform:'uppercase' }}>
            I CAN {String(ses.n).padStart(2,'0')}
          </div>
          {asistColor ? (
            <div style={{ background:asistColor, color:'white', fontSize:10, fontWeight:800, padding:'2px 7px', borderRadius:5 }}>
              {estadoLabel}
            </div>
          ) : (
            <div style={{ color:'var(--ink-3)', fontSize:10, fontWeight:600 }}>{estadoLabel}</div>
          )}
        </div>
        <div style={{ fontSize:13, color: ses.estado ? 'var(--ink)' : 'var(--ink-3)', fontWeight:500 }}>
          {fmtCorto(ses.fecha)}
        </div>
        {ses.retro && (
          <div style={{ marginTop:6, fontSize:12, color:'#005555', lineHeight:1.4 }}>
            {ses.retro}
          </div>
        )}
      </div>
    );
  };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) setLeccionAbierta(null); }}>
      {/* Leyenda */}
      <div style={{ display:'flex', gap:18, flexWrap:'wrap', fontSize:13, marginBottom:16, padding:'10px 14px', background:'var(--surface)', border:'1px solid var(--line)', borderRadius:10 }}>
        {leyenda.map(({ color:c, label }) => (
          <span key={label} style={{ display:'flex', gap:7, alignItems:'center', fontWeight:500, color:'var(--ink-2)' }}>
            <span style={{ width:14, height:14, borderRadius:4, background:c, flexShrink:0 }} />
            {label}
          </span>
        ))}
      </div>

      {esINA ? (
        /* INA: filas de 6 → L · L · ICAN ║ L · L · ICAN */
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {Array.from({ length: Math.ceil(grupos.length / 2) }, (_, rowIdx) => {
            const gA = grupos[rowIdx * 2];
            const gB = grupos[rowIdx * 2 + 1];
            return (
              <div key={rowIdx} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 0.7fr 1fr 1fr 0.7fr', gap:10, alignItems:'stretch' }}>
                {gA && <TarjetaLec lec={gA.l1} />}
                {gA && <TarjetaLec lec={gA.l2} />}
                {gA && <TarjetaICAN ses={gA.ican} />}
                {gB ? <TarjetaLec lec={gB.l1} /> : <div />}
                {gB ? <TarjetaLec lec={gB.l2} /> : <div />}
                {gB ? <TarjetaICAN ses={gB.ican} /> : <div />}
              </div>
            );
          })}
        </div>
      ) : (
        /* No-INA: 4 por fila */
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {Array.from({ length: 8 }, (_, rowIdx) => (
            <div key={rowIdx} style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, alignItems:'start' }}>
              {lecciones.slice(rowIdx * 4, rowIdx * 4 + 4).map(l => l && <TarjetaLec key={l.n} lec={l} />)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { CronogramaModulo });
