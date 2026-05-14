/* global React, Icon, Chip, Stat, PageHeader */

// ─────────────────────────────────────────────────────────────────────────
// TEACHER VIEWS — conectado a Apps Script real
// ─────────────────────────────────────────────────────────────────────────

const SCRIPT_URL_TV = 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';

// ── Lección sugerida según fecha de inicio + días de clase ──────────────
function calcularLeccionSugerida(startDate, diasCode) {
  if (!startDate) return '';
  const inicio = new Date(startDate);
  inicio.setHours(0,0,0,0);
  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  if (hoy < inicio) return '1';

  // Días de clase según código (0=Dom, 1=Lun, ..., 6=Sáb)
  const diasMap = {
    'LM': [1,3], 'KJ': [2,4], 'LJ': [1,4],
    'SA': [6],   'LM94': [1,3],
  };
  const codigo = (diasCode || '').replace(/\d/g,'').toUpperCase();
  const dias = diasMap[codigo] || [1,3];

  let leccion = 0;
  const cursor = new Date(inicio);
  while (cursor <= hoy) {
    if (dias.includes(cursor.getDay())) leccion++;
    cursor.setDate(cursor.getDate() + 1);
  }
  if (codigo === 'SA') leccion = leccion * 2;
  if (codigo === 'LJ') leccion = leccion * 2;

  return String(Math.min(Math.max(leccion, 1), 32));
}

// Deriva startDate del último segmento del codGrupo (MMYY → día 1 del mes)
function __startDateFromCodGrupo(codGrupo) {
  const parts = (codGrupo || '').split('-');
  const last = parts[parts.length - 1] || '';
  if (!/^\d{4}$/.test(last)) return null;
  const mm = parseInt(last.slice(0,2), 10);
  const yy = parseInt(last.slice(2,4), 10);
  if (!mm || mm < 1 || mm > 12) return null;
  return new Date(2000 + yy, mm - 1, 1);
}

// ── Sesión real del docente ──────────────────────────────────────────────
// Hook que lee la sesión del sessionStorage y trae el roster del Apps Script.
// Cache en módulo para que, al cambiar de vista, no se refetchee siempre.
let __TV_ROSTER_CACHE = null; // { codGrupo, roster }

function useTeacherSession() {
  const [state, setState] = React.useState(() => {
    let usuario = null;
    try { usuario = JSON.parse(sessionStorage.getItem('an_usuario') || 'null'); } catch(_) {}
    const codGrupo   = usuario?.grupo || '';
    const programa   = usuario?.programa || 'SIN_INA';
    const nombre     = usuario?.nombre || '';
    // leccionNum NO viene de sesión: el docente la ingresa manualmente en cada vista
    if (__TV_ROSTER_CACHE && __TV_ROSTER_CACHE.codGrupo === codGrupo) {
      return { codGrupo, programa, nombre, roster: __TV_ROSTER_CACHE.roster, loading:false, error:null };
    }
    return { codGrupo, programa, nombre, roster: [], loading: !!codGrupo, error: codGrupo ? null : 'No hay sesión de docente activa.' };
  });

  React.useEffect(() => {
    if (!state.codGrupo || !state.loading) return;
    let cancel = false;
    (async () => {
      try {
        const url = `${SCRIPT_URL_TV}?fn=getGrupoEstudiantes&cod_grupo=${encodeURIComponent(state.codGrupo)}`;
        const res  = await fetch(url);
        const data = await res.json();
        if (cancel) return;
        if (!data.ok) {
          setState(s => ({ ...s, loading:false, error: data.error || 'No se pudo cargar el grupo.' }));
          return;
        }
        const roster = (data.estudiantes || []).map(e => ({
          code: e.code,
          name: e.name,
          status: 'al-dia',
          att: null, avg: null, oral: null, lastSeen: null,
        }));
        __TV_ROSTER_CACHE = { codGrupo: state.codGrupo, roster };
        setState(s => ({ ...s, loading:false, error:null, roster }));
      } catch(e) {
        if (cancel) return;
        setState(s => ({ ...s, loading:false, error: 'Error de conexión: ' + e.message }));
      }
    })();
    return () => { cancel = true; };
  }, [state.codGrupo, state.loading]);

  // grupoInfo derivado: startDate desde el último segmento del codGrupo (MMYY)
  const grupoInfo = React.useMemo(() => ({
    startDate: __startDateFromCodGrupo(state.codGrupo),
  }), [state.codGrupo]);

  return { ...state, grupoInfo };
}

// Pantalla de carga / error compartida
function TeacherLoadingState({ loading, error }) {
  return (
    <div style={{ padding:'80px 20px', textAlign:'center' }}>
      {loading ? (
        <>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:22, color:'var(--an-navy-ink)', marginBottom:8 }}>Cargando grupo…</div>
          <div style={{ fontSize:13, color:'var(--ink-3)' }}>Consultando lista de estudiantes</div>
        </>
      ) : (
        <>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:22, color:'var(--danger)', marginBottom:8 }}>No se pudo cargar el grupo</div>
          <div style={{ fontSize:13, color:'var(--ink-3)' }}>{error}</div>
        </>
      )}
    </div>
  );
}

// ── Tareas pendientes derivadas del cronograma real ─────────────────────
function calcularTareasPendientes(startDate, diasCode, leccionActual) {
  const lec = parseInt(leccionActual) || 1;
  const tareas = [];

  // Progress Check — cada 4 lecciones aproximadamente
  const lcProgress = [4,8,13,16,21,24,28,30];
  const proximoPC = lcProgress.find(l => l >= lec);
  if (proximoPC) {
    const unidadesMap = {
      4:'U1-U2', 8:'U3-U4', 13:'U5-U6', 16:'U7-U8',
      21:'U9-U10', 24:'U11-U12', 28:'U13-U14', 30:'U15-U16'
    };
    tareas.push({
      t: 'Progress Check ' + (unidadesMap[proximoPC] || ''),
      g: 'Lección ' + proximoPC,
      pr: proximoPC - lec <= 2 ? 'alta' : 'media',
    });
  }

  // Exámenes orales — lecciones 9,17,25,31
  const lcOrales = [9,17,25,31];
  const proximoOral = lcOrales.find(l => l >= lec);
  if (proximoOral) {
    const unidOrales = { 9:'U1-U4', 17:'U5-U8', 25:'U9-U12', 31:'U13-U16' };
    tareas.push({
      t: 'Oral ' + (unidOrales[proximoOral] || ''),
      g: 'Lección ' + proximoOral,
      pr: proximoOral - lec <= 2 ? 'alta' : 'media',
    });
  }

  // Exámenes escritos — lecciones 18 y 32
  const lcEscritos = [18,32];
  const proximoEscrito = lcEscritos.find(l => l >= lec);
  if (proximoEscrito) {
    tareas.push({
      t: 'Escrito ' + (proximoEscrito === 18 ? 'U1-U8' : 'U9-U16'),
      g: 'Lección ' + proximoEscrito,
      pr: proximoEscrito - lec <= 2 ? 'alta' : 'baja',
    });
  }

  return tareas;
}

// ── CalificarView — tipos de evaluación válidos SIN_INA ───────────────────
// Orales: 15 pts c/u — Escritos: 15 pts c/u — Social: 10 pts
const EVAL_TYPES_SIN_INA = [
  { key:'ORAL_1',    label:'Oral 1',    max:15 },
  { key:'ORAL_2',    label:'Oral 2',    max:15 },
  { key:'ORAL_3',    label:'Oral 3',    max:15 },
  { key:'ORAL_4',    label:'Oral 4',    max:15 },
  { key:'ESCRITO_1', label:'Escrito 1', max:15 },
  { key:'ESCRITO_2', label:'Escrito 2', max:15 },
  { key:'SOCIAL',    label:'Social',    max:10 },
];

// ─────────────────────────────────────────────────────────────────────────
function TeacherDashboard({ setActive }) {
  const { codGrupo, roster, nombre, grupoInfo, loading, error } = useTeacherSession();
  if (loading || error) return <TeacherLoadingState loading={loading} error={error} />;

  const diasCode = (codGrupo || '').split('-')[1] || 'LM';
  const leccionSugerida = calcularLeccionSugerida(grupoInfo?.startDate, diasCode);
  const tareas = calcularTareasPendientes(grupoInfo?.startDate, diasCode, leccionSugerida);

  const ontime  = roster.filter(r => r.status==='al-dia').length;
  const risk    = roster.filter(r => r.status==='riesgo').length;
  const valid   = roster.filter(r => typeof r.avg === 'number');
  const avgClass = valid.length ? (valid.reduce((a,r)=>a+r.avg,0)/valid.length).toFixed(1) : '—';
  // Tomar el primer token del nombre como display ("EMILY VEGA SALAS" → "Emily")
  const firstToken = (nombre || '').trim().split(/\s+/)[0] || 'Docente';
  const displayName = firstToken.charAt(0).toUpperCase() + firstToken.slice(1).toLowerCase();

  return (
    <div>
      <div className="hero">
        <div className="watermark-a">A</div>
        <div className="hero-grid">
          <div>
            <div className="hero-kicker">Panel docente · {new Date().toLocaleDateString('es-CR',{weekday:'short',day:'numeric',month:'short'})}</div>
            <h1 className="hero-h1">Bienvenido,<br/><em>Prof. {displayName}</em></h1>
            <div className="hero-sub">Tu grupo activo es <strong>{codGrupo}</strong> con <strong>{roster.length} {roster.length === 1 ? 'estudiante' : 'estudiantes'}</strong>.</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <Chip tone="granate" dot>1 grupo activo</Chip>
              <Chip tone="navy">{roster.length} {roster.length === 1 ? 'estudiante' : 'estudiantes'}</Chip>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12 }}>
            <QuickStat n={roster.length} l={`Estudiantes en ${codGrupo}`} />
            <QuickStat n={`${avgClass}%`} l="Promedio del grupo" />
            <QuickStat n={ontime} l="Al día" color="var(--ok)" />
            <QuickStat n={risk}   l="En riesgo" color="var(--danger)" />
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-h">
            <div className="card-title">Pendientes por revisar</div>
            <button className="btn btn-ghost" onClick={() => setActive('calificar')}>Ir a calificar →</button>
          </div>
          <div style={{ display:'grid', gap:10 }}>
            {tareas.length === 0 && (
              <div style={{ padding:'20px 0', textAlign:'center', color:'var(--ink-3)', fontSize:13 }}>
                Sin tareas próximas en el cronograma.
              </div>
            )}
            {tareas.map((h, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i<tareas.length-1?'1px solid var(--line)':'none' }}>
                <div style={{ width:6, height:32, borderRadius:3, background: h.pr==='alta'?'var(--danger)':h.pr==='media'?'var(--warn)':'var(--ink-3)' }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{h.t}</div>
                  <div style={{ fontSize:11, color:'var(--ink-3)' }}>{h.g}</div>
                </div>
                {h.pr!=='programado' && <button className="btn btn-ghost">Abrir</button>}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div className="card-title">Estudiantes que requieren atención</div>
          </div>
          {roster.filter(r => r.status!=='al-dia').map((r, i, arr) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom: i<arr.length-1?'1px solid var(--line)':'none' }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background: r.status==='riesgo'?'var(--danger)':'var(--warn)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12 }}>
                {r.name.split(' ').slice(0,2).map(w=>w[0]).join('')}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13 }}>{r.name}</div>
                <div style={{ fontSize:11, color:'var(--ink-3)' }}>Asistencia {r.att ?? '—'}% · Promedio {r.avg ?? '—'}</div>
              </div>
              <Chip tone={r.status==='riesgo'?'red':'gold'}>{r.status==='riesgo'?'Riesgo':'Atención'}</Chip>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickStat({ n, l, color='var(--an-navy-ink)' }) {
  return (
    <div style={{ background:'var(--surface-2)', border:'1px solid var(--line)', borderRadius:'var(--r-md)', padding:14 }}>
      <div style={{ fontFamily:'var(--f-serif)', fontSize:30, fontWeight:500, lineHeight:1, color, letterSpacing:'-0.03em' }}>{n}</div>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3)', marginTop:6 }}>{l}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
function GruposView() {
  const { codGrupo, roster, loading, error } = useTeacherSession();
  if (loading || error) return <TeacherLoadingState loading={loading} error={error} />;

  // Derivar nivel humano del código del grupo: B1-LM69-C3-0225 → "Básico I"
  const NIVEL_LABEL = { B1:'Básico I', B2:'Básico II', I1:'Intermedio I', I2:'Intermedio II', A1:'Avanzado I', A2:'Avanzado II' };
  const nivelInicio = (codGrupo.split('-')[0] || '').toUpperCase();
  const nivelLabel  = NIVEL_LABEL[nivelInicio] || nivelInicio || '—';

  // Promedio y asistencia reales del roster cargado
  const valid    = roster.filter(r => typeof r.avg === 'number');
  const avgClass = valid.length ? (valid.reduce((a,r)=>a+r.avg,0)/valid.length).toFixed(1) : null;
  const attValid = roster.filter(r => typeof r.att === 'number');
  const attClass = attValid.length ? Math.round(attValid.reduce((a,r)=>a+r.att,0)/attValid.length) : null;

  return (
    <div>
      <PageHeader
        kicker="Gestión académica"
        title={<>Mi <em>Grupo</em></>}
        sub={`Lista de matriculados de ${codGrupo}`}
      />
      <div className="tabs">
        <button className="tab active">{codGrupo} · {nivelLabel}</button>
      </div>

      <div className="grid-4" style={{ marginBottom:20 }}>
        <Stat label="Matriculados"   num={roster.length}                 sub="Máximo: 12" pct={roster.length/12*100} color="var(--an-navy)" />
        <Stat label="Nivel actual"   num={nivelLabel}                    sub={codGrupo}   pct={0}                    color="var(--an-granate)" />
        <Stat label="Promedio grupo" num={avgClass ?? '—'} suffix={avgClass?'%':''} sub={avgClass?'Sobre 100':'Sin notas aún'} subTone={avgClass?'ok':'muted'} pct={avgClass?Number(avgClass):0} color="var(--ok)" />
        <Stat label="Asistencia"     num={attClass ?? '—'} suffix={attClass!=null?'%':''} sub={attClass!=null?'Promedio del grupo':'Sin registro aún'} subTone={attClass!=null?'warn':'muted'} pct={attClass||0} color="var(--warn)" />
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="card-h" style={{ padding:'18px 20px' }}>
          <div className="card-title">Roster · {codGrupo}</div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-ghost"><Icon name="download" size={14} className="" /> Exportar</button>
          </div>
        </div>
        <table className="table-soft">
          <thead>
            <tr>
              <th>Cód.</th>
              <th>Estudiante</th>
              <th style={{ textAlign:'right' }}>Promedio</th>
              <th style={{ textAlign:'right' }}>Asistencia</th>
              <th style={{ textAlign:'right' }}>Oral 1 /15</th>
              <th>Últ. visto</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {roster.map((r,i) => (
              <tr key={i}>
                <td style={{ fontFamily:'var(--f-mono)', color:'var(--ink-3)' }}>{r.code}</td>
                <td>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <div style={{ width:30, height:30, borderRadius:'50%', background:'var(--an-navy)', color:'white', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {r.name.split(' ').slice(0,2).map(w=>w[0]).join('')}
                    </div>
                    <span style={{ fontWeight:500 }}>{r.name}</span>
                  </div>
                </td>
                <td style={{ textAlign:'right', fontWeight:600, color: r.avg==null?'var(--ink-3)':r.avg>=85?'var(--ok)':r.avg>=75?'var(--ink)':'var(--danger)' }}>{r.avg ?? '—'}</td>
                <td style={{ textAlign:'right', fontWeight:500 }}>
                  {r.att==null ? <span style={{ color:'var(--ink-3)' }}>—</span> : (
                    <div style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:50, height:4, background:'var(--bg-deep)', borderRadius:2 }}>
                        <div style={{ width:`${r.att}%`, height:'100%', background: r.att>=85?'var(--ok)':r.att>=70?'var(--warn)':'var(--danger)', borderRadius:2 }} />
                      </div>
                      {r.att}%
                    </div>
                  )}
                </td>
                <td style={{ textAlign:'right', fontFamily:'var(--f-mono)' }}>{r.oral ?? '—'}</td>
                <td style={{ fontSize:11, color:'var(--ink-3)' }}>{r.lastSeen ?? '—'}</td>
                <td style={{ textAlign:'right' }}>
                  <button className="btn btn-icon btn-ghost"><Icon name="messages" size={14} className="" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
function CalificarView({ toast }) {
  const { codGrupo, programa, roster, grupoInfo, loading, error } = useTeacherSession();
  const diasCode = (codGrupo || '').split('-')[1] || 'LM';
  const leccionSugerida = calcularLeccionSugerida(grupoInfo?.startDate, diasCode);
  const [tipoEval, setTipoEval]   = React.useState('ORAL_2');
  const [leccion,  setLeccion]    = React.useState(leccionSugerida || '');
  const [cargando, setCargando]   = React.useState(false);
  const [resultado, setResultado] = React.useState(null); // { ok, guardados, errores }
  const [errGlobal, setErrGlobal] = React.useState('');

  const evalDef = EVAL_TYPES_SIN_INA.find(e => e.key === tipoEval) || EVAL_TYPES_SIN_INA[0];

  // El docente ingresa la lección manualmente en cada vista.

  const [notas, setNotas] = React.useState({});
  // Re-init notas cuando cambia el roster
  React.useEffect(() => {
    const o = {};
    roster.forEach(r => { o[r.code] = ''; });
    setNotas(o);
  }, [roster]);

  if (loading || error) return <TeacherLoadingState loading={loading} error={error} />;

  const setNota = (code, v) => {
    if (v !== '' && (parseFloat(v) < 0 || parseFloat(v) > evalDef.max)) return;
    setNotas(prev => ({ ...prev, [code]: v }));
  };

  const guardar = async () => {
    setCargando(true);
    setErrGlobal('');
    setResultado(null);

    const lec = parseInt(leccion);
    if (!lec || lec < 1 || lec > 32) {
      setErrGlobal('Ingresá un número de lección válido (1–32) antes de guardar.');
      setCargando(false);
      return;
    }

    const estudiantesConNota = roster.filter(r => notas[r.code] !== '' && parseFloat(notas[r.code]) > 0);

    if (estudiantesConNota.length === 0) {
      setErrGlobal('Ingresá al menos una nota antes de guardar.');
      setCargando(false);
      return;
    }

    try {
      const resultados = await Promise.allSettled(
        estudiantesConNota.map(r =>
          fetch(`${SCRIPT_URL_TV}?fn=registrarEvaluacion`, {
            method: 'POST',
            body: JSON.stringify({
              cod_grupo:      codGrupo,
              cod_estudiante: r.code,
              nivel:          'B1',
              programa:       programa,
              tipo_eval:      tipoEval,
              leccion_num:    lec,
              nota_obtenida:  parseFloat(notas[r.code]),
              registrado_por: 'DOCENTE',
            }),
          }).then(res => res.json())
        )
      );

      const ok  = resultados.filter(r => r.status==='fulfilled' && r.value?.ok).length;
      const err = resultados.length - ok;
      setResultado({ ok, errores: err, total: resultados.length });
      if (toast) toast(`${ok} calificación${ok!==1?'es':''} guardada${ok!==1?'s':''}`);
    } catch(e) {
      setErrGlobal('Error de conexión: ' + e.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div>
      <PageHeader
        kicker="Evaluación"
        title={<>Calificar · <em>{evalDef.label}</em></>}
        sub={`${codGrupo} · Programa ${programa} · ${evalDef.max} pts máximo`}
        right={
          <button className="btn btn-primary" onClick={guardar} disabled={cargando}
            style={{ opacity: cargando?0.6:1 }}>
            {cargando ? 'Guardando…' : 'Guardar calificaciones'}
          </button>
        }
      />

      {/* Selector de tipo de evaluación y lección */}
      <div className="card" style={{ marginBottom:16, display:'flex', gap:16, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <label style={{ fontSize:11, fontWeight:700, color:'var(--ink-3)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Tipo de evaluación</label>
          <select value={tipoEval} onChange={e => setTipoEval(e.target.value)}
            style={{ padding:'8px 12px', border:'1.5px solid var(--line)', borderRadius:'var(--r-md)', fontFamily:'inherit', fontSize:13, fontWeight:600, outline:'none', cursor:'pointer' }}>
            {EVAL_TYPES_SIN_INA.map(ev => (
              <option key={ev.key} value={ev.key}>{ev.label} ({ev.max} pts)</option>
            ))}
          </select>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <label style={{ fontSize:11, fontWeight:700, color:'var(--ink-3)', letterSpacing:'0.1em', textTransform:'uppercase' }}>N° Lección (1–32)</label>
          <input type="number" value={leccion} onChange={e => setLeccion(e.target.value)} min={1} max={32}
            placeholder="—"
            style={{ width:90, padding:'8px 12px', border:'1.5px solid var(--line)', borderRadius:'var(--r-md)', fontFamily:'var(--f-mono)', fontSize:13, fontWeight:600, outline:'none' }} />
          <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:4 }}>
            Sugerida según fecha de inicio del grupo
          </div>
        </div>
        <div style={{ marginLeft:'auto', padding:'10px 16px', background:'color-mix(in srgb,var(--an-navy) 6%,white)', borderRadius:'var(--r-md)', fontSize:12, color:'var(--an-navy)', fontWeight:600 }}>
          Programa: {programa} · Grupo: {codGrupo}
        </div>
      </div>

      {/* Tabla de notas */}
      <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:16 }}>
        <table className="table-soft">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th style={{ textAlign:'center', width:120 }}>Nota / {evalDef.max}</th>
              <th style={{ textAlign:'center' }}>Estado</th>
              <th>Comentario</th>
            </tr>
          </thead>
          <tbody>
            {roster.map(r => {
              const nota = parseFloat(notas[r.code]) || 0;
              const pct  = evalDef.max > 0 ? nota / evalDef.max : 0;
              const aprobado = pct >= 0.7;
              return (
                <tr key={r.code}>
                  <td>
                    <div style={{ fontWeight:600, fontSize:13 }}>{r.name}</div>
                    <div style={{ fontFamily:'var(--f-mono)', fontSize:10, color:'var(--ink-3)' }}>{r.code}</div>
                  </td>
                  <td style={{ textAlign:'center', padding:'8px' }}>
                    <input
                      value={notas[r.code]}
                      onChange={e => setNota(r.code, e.target.value)}
                      placeholder="—"
                      type="number" min={0} max={evalDef.max} step={0.5}
                      style={{
                        width:72, height:40, textAlign:'center',
                        border:'1.5px solid var(--line)', borderRadius:8,
                        fontFamily:'var(--f-mono)', fontSize:15, fontWeight:700,
                        outline:'none',
                      }}
                    />
                  </td>
                  <td style={{ textAlign:'center' }}>
                    {notas[r.code] === '' ? (
                      <span style={{ fontSize:11, color:'var(--ink-3)', fontStyle:'italic' }}>Sin nota</span>
                    ) : (
                      <span style={{ display:'inline-block', padding:'5px 12px', borderRadius:999, background: aprobado?'color-mix(in srgb,var(--ok) 14%,white)':'color-mix(in srgb,var(--danger) 14%,white)', fontFamily:'var(--f-mono)', fontWeight:700, color: aprobado?'var(--ok)':'var(--danger)', fontSize:12 }}>
                        {nota}/{evalDef.max} {aprobado?'✓':'✕'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding:'8px' }}>
                    <input placeholder="Retroalimentación breve…"
                      style={{ width:'100%', height:38, padding:'0 10px', border:'1px solid var(--line)', borderRadius:8, fontSize:12, outline:'none', fontFamily:'inherit' }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Errores y resultado */}
      {errGlobal && (
        <div style={{ padding:'10px 14px', background:'color-mix(in srgb,#C00000 8%,white)', border:'1px solid #C00000', borderRadius:'var(--r-md)', color:'#C00000', fontSize:13, marginBottom:12 }}>
          ⚠ {errGlobal}
        </div>
      )}
      {resultado && (
        <div style={{ padding:'14px 18px', background: resultado.errores===0?'color-mix(in srgb,var(--ok) 8%,white)':'color-mix(in srgb,var(--warn) 10%,white)', border:`1px solid ${resultado.errores===0?'var(--ok)':'var(--warn)'}`, borderRadius:'var(--r-md)', fontSize:13, fontWeight:600, color: resultado.errores===0?'#166534':'#92400E' }}>
          {resultado.errores === 0
            ? `✅ ${resultado.ok} calificación${resultado.ok!==1?'es':''} guardada${resultado.ok!==1?'s':''}  correctamente en APOLLO_G3`
            : `⚠ ${resultado.ok} guardadas, ${resultado.errores} con error — revisá la conexión`}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
function AsistenciaView({ toast }) {
  const { codGrupo, programa, roster, grupoInfo, loading, error } = useTeacherSession();
  const diasCode = (codGrupo || '').split('-')[1] || 'LM';
  const leccionSugerida = calcularLeccionSugerida(grupoInfo?.startDate, diasCode);
  const [leccion, setLeccion]     = React.useState(leccionSugerida || '');
  const [att, setAtt]             = React.useState({});
  const [cargando, setCargando]   = React.useState(false);
  const [resultado, setResultado] = React.useState(null);
  const [errGlobal, setErrGlobal] = React.useState('');

  // Re-init att cuando cambia el roster
  React.useEffect(() => {
    const o = {};
    roster.forEach(r => { o[r.code] = 'present'; });
    setAtt(o);
  }, [roster]);

  if (loading || error) return <TeacherLoadingState loading={loading} error={error} />;

  const counts = {
    present: Object.values(att).filter(v => v==='present').length,
    late:    Object.values(att).filter(v => v==='late').length,
    absent:  Object.values(att).filter(v => v==='absent').length,
  };

  const cerrarLista = async () => {
    setCargando(true);
    setErrGlobal('');
    setResultado(null);

    const lec = parseInt(leccion);
    if (!lec || lec < 1 || lec > 32) {
      setErrGlobal('Ingresá un número de lección válido (1–32) antes de cerrar la lista.');
      setCargando(false);
      return;
    }

    const hoy = new Date().toLocaleDateString('es-CR', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g,'/');

    const body = {
      cod_grupo:      codGrupo,
      leccion_num:    lec,
      fecha_leccion:  hoy,
      programa:       programa,
      registrado_por: 'DOCENTE',
      lista: roster.map(r => ({
        cod_estudiante: r.code,
        presente:       att[r.code] !== 'absent',
      })),
    };

    try {
      const res  = await fetch(`${SCRIPT_URL_TV}?fn=registrarAsistencia`, {
        method: 'POST',
        body:   JSON.stringify(body),
      });
      const data = await res.json();

      if (!data.ok) {
        setErrGlobal(data.error || 'Error al registrar asistencia');
        return;
      }

      setResultado({ presentes: counts.present + counts.late, ausentes: counts.absent });
      if (toast) toast(`Asistencia registrada · ${counts.present + counts.late} presentes`);
    } catch(e) {
      setErrGlobal('Error de conexión: ' + e.message);
    } finally {
      setCargando(false);
    }
  };

  const total = roster.length;

  return (
    <div>
      <PageHeader
        kicker={`Asistencia · ${new Date().toLocaleDateString('es-CR',{weekday:'short',day:'numeric',month:'short'})}`}
        title={<>Pasar <em>lista</em></>}
        sub={`${codGrupo} · Programa ${programa}`}
        right={
          <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <label style={{ fontSize:10, fontWeight:700, color:'var(--ink-3)', letterSpacing:'0.1em', textTransform:'uppercase' }}>N° Lección (1–32)</label>
              <input type="number" value={leccion} onChange={e => setLeccion(e.target.value)} min={1} max={32}
                placeholder="—" disabled={!!resultado}
                style={{ width:90, padding:'8px 12px', border:'1.5px solid var(--line)', borderRadius:'var(--r-md)', fontFamily:'var(--f-mono)', fontSize:13, fontWeight:600, outline:'none' }} />
              <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:4 }}>
                Sugerida según fecha de inicio del grupo
              </div>
            </div>
            <button className="btn btn-primary" onClick={cerrarLista} disabled={cargando || !!resultado}
              style={{ opacity: cargando||resultado?0.6:1 }}>
              {cargando ? 'Guardando…' : resultado ? 'Lista cerrada ✓' : 'Cerrar lista'}
            </button>
          </div>
        }
      />

      <div className="grid-4" style={{ marginBottom:20 }}>
        <div className="card" style={{ textAlign:'center', background:'color-mix(in srgb, var(--ok) 10%, white)', borderColor:'var(--ok)' }}>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:42, fontWeight:500, color:'var(--ok)' }}>{counts.present}</div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ok)' }}>Presentes</div>
        </div>
        <div className="card" style={{ textAlign:'center', background:'color-mix(in srgb, var(--warn) 10%, white)', borderColor:'var(--warn)' }}>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:42, fontWeight:500, color:'var(--warn)' }}>{counts.late}</div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--warn)' }}>Tardíos</div>
        </div>
        <div className="card" style={{ textAlign:'center', background:'color-mix(in srgb, var(--danger) 10%, white)', borderColor:'var(--danger)' }}>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:42, fontWeight:500, color:'var(--danger)' }}>{counts.absent}</div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--danger)' }}>Ausentes</div>
        </div>
        <div className="card" style={{ textAlign:'center' }}>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:42, fontWeight:500, color:'var(--an-navy-ink)' }}>
            {total > 0 ? (((counts.present+counts.late)/total)*100).toFixed(0) : 0}%
          </div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3)' }}>Asistencia hoy</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ display:'grid', gap:8 }}>
          {roster.map(r => (
            <div key={r.code} style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:14, alignItems:'center', padding:'10px 12px', background:'var(--surface-2)', borderRadius:'var(--r-md)', opacity: resultado?0.7:1 }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--an-navy)', color:'white', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {r.name.split(' ').slice(0,2).map(w=>w[0]).join('')}
              </div>
              <div>
                <div style={{ fontWeight:600, fontSize:14 }}>{r.name}</div>
                <div style={{ fontSize:11, color:'var(--ink-3)', fontFamily:'var(--f-mono)' }}>{r.code}{r.att!=null && ` · Asistencia general ${r.att}%`}</div>
              </div>
              <div style={{ display:'flex', gap:4 }}>
                {[
                  ['present', 'P', 'var(--ok)'],
                  ['late',    'T', 'var(--warn)'],
                  ['absent',  'A', 'var(--danger)'],
                ].map(([k, lab, color]) => (
                  <button key={k} onClick={() => { if (!resultado) setAtt(prev => ({ ...prev, [r.code]: k })); }}
                    disabled={!!resultado}
                    style={{
                      width:42, height:42, borderRadius:10,
                      border: att[r.code]===k ? `2px solid ${color}` : '1px solid var(--line)',
                      background: att[r.code]===k ? `color-mix(in srgb, ${color} 18%, white)` : 'white',
                      color: att[r.code]===k ? color : 'var(--ink-3)',
                      fontWeight:700, fontSize:14, cursor: resultado?'not-allowed':'pointer',
                    }}>
                    {lab}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {errGlobal && (
        <div style={{ padding:'10px 14px', background:'color-mix(in srgb,#C00000 8%,white)', border:'1px solid #C00000', borderRadius:'var(--r-md)', color:'#C00000', fontSize:13, marginBottom:12 }}>
          ⚠ {errGlobal}
        </div>
      )}

      {/* Confirmación */}
      {resultado && (
        <div style={{ padding:'16px 20px', background:'color-mix(in srgb,var(--ok) 8%,white)', border:'1px solid var(--ok)', borderRadius:'var(--r-md)', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ fontSize:28 }}>✅</div>
          <div>
            <div style={{ fontWeight:700, fontSize:14, color:'#166534' }}>Lista cerrada correctamente</div>
            <div style={{ fontSize:12, color:'#166534', marginTop:2 }}>
              {resultado.presentes} presente{resultado.presentes!==1?'s':''} · {resultado.ausentes} ausente{resultado.ausentes!==1?'s':''} · Lección {leccion} · {codGrupo}
            </div>
          </div>
          <button onClick={() => setResultado(null)} className="btn btn-ghost" style={{ marginLeft:'auto', fontSize:12 }}>
            Editar
          </button>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { TeacherDashboard, GruposView, CalificarView, AsistenciaView });
