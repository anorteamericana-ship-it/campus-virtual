/* global React, Icon, Chip, Stat, PageHeader */

// ─────────────────────────────────────────────────────────────────────────
// TEACHER VIEWS — conectado a Apps Script real
// ─────────────────────────────────────────────────────────────────────────

// URL del Apps Script: fuente única en data.jsx → window.APPS_SCRIPT_URL
const SCRIPT_URL_TV = window.APPS_SCRIPT_URL;

// FIX-ADMIN-CORE-POST-001: lecturas sensibles vía POST text/plain (token en body).
async function postTeacher(fn, payload = {}) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const res = await fetch(`${SCRIPT_URL_TV}?fn=${encodeURIComponent(fn)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, token, ...payload }),
  });
  return await res.json();
}

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


function tvGroupCode(v){
  if (!v) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'object') return String(v.code || v.cod_grupo || v.codigo_grupo || v.grupo || v.codigo || v.id || '').trim();
  return String(v || '').trim();
}
function tvText(v){ return String(v == null ? '' : (typeof v === 'object' ? tvGroupCode(v) : v)).trim(); }
function tvUpper(v){ return tvText(v).toUpperCase(); }
function tvCiclo(code){ const c=tvGroupCode(code) || tvText(code); const p=c.split('-'); return p.length>=2 ? p[p.length-1] : c; }
function tvScheduleFromCode(code){
  const s=tvUpper(tvGroupCode(code) || code).replace(/\s+/g,'');
  const m=s.match(/-(LM|KJ|LJ|L4|SA|SAB|L|K|M|J|V|D)(\d{2})-/) || s.match(/-(LM|KJ|LJ|L4|SA|SAB|L|K|M|J|V|D)(\d{2})/);
  if(!m) return {};
  const dias=m[1]==='SAB'?'SA':m[1]; const hh=m[2];
  const horas={ '69':['6pm','9pm'], '94':['9am','4pm'], '96':['9am','12pm'] }[hh] || [];
  return { dias, hora_i:horas[0]||'', hora_f:horas[1]||'' };
}
function tvDiasLabel(code){
  const d=tvUpper(code);
  return ({LM:'Lunes y miércoles',KJ:'Martes y jueves',LJ:'Lunes y jueves',L4:'Lunes a jueves',SA:'Sábado',SAB:'Sábado',L:'Lunes',K:'Martes',M:'Miércoles',J:'Jueves',V:'Viernes',D:'Domingo'}[d]) || d || 'Horario';
}
function tvHoraLabel(g){
  const code = tvGroupCode(g) || tvGroupCode(g?.code || g?.cod_grupo || '');
  const sched=tvScheduleFromCode(code);
  const hi=tvText(g?.hora_i || g?.hora_inicio || sched.hora_i);
  const hf=tvText(g?.hora_f || g?.hora_fin || sched.hora_f);
  const norm=(x)=>{ const m=String(x).match(/^(\d{1,2})(?::(\d{2}))?/); if(!m) return x; const h=Number(m[1]); const min=m[2]&&m[2]!=='00'? ':'+m[2] : ''; return (h===0?'12':h>12?String(h-12):String(h))+min+(h>=12?'pm':'am'); };
  return [norm(hi), norm(hf)].filter(Boolean).join(' a ');
}
function tvGrupoLabel(g){
  const code=tvGroupCode(g) || tvGroupCode(g?.code || g?.cod_grupo || '');
  const sched=tvScheduleFromCode(code);
  const dias=tvDiasLabel(g?.dias || g?.diasCode || sched.dias || '');
  const hora=tvHoraLabel(g);
  return { dias, hora, ciclo:tvCiclo(code), full:`${dias}${hora?' de '+hora:''} - ${tvCiclo(code)}` };
}
function tvNivelId(g){ const code = tvGroupCode(g) || tvGroupCode(g?.code||g?.cod_grupo); return tvUpper(g?.nivelId || g?.nivel || (code.split('-')[0]) || 'B1'); }
function tvNivelLabel(g){ return VD_NIVEL_LABEL[tvNivelId(g)] || tvNivelId(g); }
function tvIsToday(iso){ return iso && iso === new Date().toISOString().slice(0,10); }
function tvMinutes(hhmm){ const m=String(hhmm||'').match(/^(\d{1,2})(?::(\d{2}))?/); return m ? Number(m[1])*60 + Number(m[2]||0) : null; }
function tvSessionGroups(usuario){
  const raw = Array.isArray(usuario?.grupos) && usuario.grupos.length ? usuario.grupos : (usuario?.grupo ? [usuario.grupo] : []);
  const out = [];
  const seen = new Set();
  raw.forEach((g) => {
    const code = tvGroupCode(g);
    if (!code || seen.has(code)) return;
    seen.add(code);
    const base = typeof g === 'object' ? { ...g } : {};
    out.push({
      ...base,
      code,
      cod_grupo: code,
      nivelId: base.nivelId || base.nivel || code.split('-')[0] || 'B1',
      nivel: base.nivel || base.nivelId || code.split('-')[0] || 'B1',
      docente: base.docente || usuario?.nombre || usuario?.nombre_completo || usuario?.usuario || '',
      source:'SESSION_FALLBACK'
    });
  });
  return out;
}
function tvNowMinutes(){ const d=new Date(); return d.getHours()*60+d.getMinutes(); }
function useTeacherSession() {
  const readSession = React.useCallback(() => {
    let usuario = null;
    try { usuario = JSON.parse(sessionStorage.getItem('an_usuario') || 'null'); } catch(_) {}
    const nombre = usuario?.nombre || usuario?.nombre_completo || usuario?.usuario || '';
    const programa = usuario?.programa || '';
    const grupoActivoRaw = (typeof window.getGrupoActivoDocente === 'function')
      ? window.getGrupoActivoDocente()
      : (usuario?.grupoActivo || usuario?.grupo || '');
    return { usuario, nombre, programa, grupoActivo:tvGroupCode(grupoActivoRaw) };
  }, []);

  const [{ usuario, nombre, programa, grupoActivo }, setSesionLocal] = React.useState(readSession);
  const [gruposMeta, setGruposMeta] = React.useState([]);
  const [codGrupo, setCodGrupo] = React.useState(grupoActivo || '');
  const [roster, setRoster] = React.useState([]);
  const [lecciones, setLecciones] = React.useState([]);
  const [asistenciaGrupo, setAsistenciaGrupo] = React.useState({});
  const [asistenciaDetalle, setAsistenciaDetalle] = React.useState({});
  const [comentariosDetalle, setComentariosDetalle] = React.useState({});
  const [notasGrupo, setNotasGrupo] = React.useState({});
  const [resumenGrupo, setResumenGrupo] = React.useState({});
  const [leccionHoy, setLeccionHoy] = React.useState(null);
  const [sesionClase, setSesionClase] = React.useState(null);
  const [loadingGroups, setLoadingGroups] = React.useState(true);
  const [loadingPanel, setLoadingPanel] = React.useState(false);
  const [errorGroups, setErrorGroups] = React.useState(null);
  const [errorPanel, setErrorPanel] = React.useState(null);
  const [reloadTick, setReloadTick] = React.useState(0);

  React.useEffect(() => {
    const onChange = () => setSesionLocal(readSession());
    window.addEventListener('an:session-changed', onChange);
    return () => window.removeEventListener('an:session-changed', onChange);
  }, [readSession]);

  React.useEffect(() => {
    let cancel = false;
    setLoadingGroups(true);
    setErrorGroups(null);
    postTeacher('getDocenteGruposActuales', {})
      .then(d => {
        if (cancel) return;
        if (!d?.ok) throw new Error(d?.error || d?.mensaje || 'No se pudieron cargar los grupos del docente.');
        const grupos = Array.isArray(d.grupos) ? d.grupos.filter(g => tvGroupCode(g)) : [];
        setGruposMeta(grupos);
        if (!grupos.length) {
          setCodGrupo('');
          setErrorGroups(d.mensaje || 'No hay grupos marcados En curso para este docente en APOLLO.GRUPOS.');
          return;
        }
        const vigente = grupos.find(g => tvGroupCode(g) === grupoActivo);
        const nuevo = tvGroupCode(vigente || grupos[0]);
        setCodGrupo(nuevo);
        if (nuevo && nuevo !== grupoActivo && typeof window.setGrupoActivoDocente === 'function') {
          window.setGrupoActivoDocente(nuevo);
        }
      })
      .catch(e => { if (!cancel) setErrorGroups(e?.message || String(e)); })
      .finally(() => { if (!cancel) setLoadingGroups(false); });
    return () => { cancel = true; };
  }, [nombre]);

  React.useEffect(() => {
    if (!grupoActivo || !gruposMeta.length) return;
    if (grupoActivo === codGrupo) return;
    if (gruposMeta.some(g => tvGroupCode(g) === grupoActivo)) setCodGrupo(grupoActivo);
  }, [grupoActivo, gruposMeta, codGrupo]);

  const meta = React.useMemo(
    () => gruposMeta.find(g => tvGroupCode(g) === codGrupo) || gruposMeta[0] || {},
    [gruposMeta, codGrupo]
  );
  const nivel = tvNivelId(meta);

  React.useEffect(() => {
    if (!codGrupo || !nivel) {
      setRoster([]); setLecciones([]); setLoadingPanel(false);
      return;
    }
    let cancel = false;
    setLoadingPanel(true);
    setErrorPanel(null);
    postTeacher('getDocenteGrupoPanelF79', { cod_grupo:codGrupo, nivel })
      .then(r => {
        if (cancel) return;
        if (!r?.ok) throw new Error(r?.error || r?.mensaje || 'No se pudo cargar el panel del grupo.');
        const notes = r.notas || {};
        const rs = (r.estudiantes || []).map(e => {
          const code = String(e.code || e.codigo || e.CODIGO || '').trim();
          const note = notes[code] || null;
          return {
            code,
            name:e.name || e.nombre || e.NOMBRE || '',
            avg:note?.tiene_notas ? note.nota_total : null,
            note,
            lastSeen:null,
          };
        });
        setRoster(rs);
        setLecciones(Array.isArray(r.lecciones) ? r.lecciones : []);
        setAsistenciaGrupo(r.asistencia || {});
        setAsistenciaDetalle(r.asistencia_detalle || {});
        setComentariosDetalle(r.comentarios || {});
        setNotasGrupo(notes);
        setLeccionHoy(r.leccion_hoy || null);
        setSesionClase(r.sesion_clase || null);
        setResumenGrupo({
          totalCA:r.total_ca ?? rs.length,
          promedioGrupo:r.promedio_grupo,
          promedioAsistencia:r.promedio_asistencia,
          cerradas:r.cerradas || 0,
          estudiantesConNotas:r.estudiantes_con_notas || 0,
        });
      })
      .catch(e => { if (!cancel) setErrorPanel(e?.message || String(e)); })
      .finally(() => { if (!cancel) setLoadingPanel(false); });
    return () => { cancel = true; };
  }, [codGrupo, nivel, reloadTick]);

  const cambiarGrupo = React.useCallback((code) => {
    const limpio = tvGroupCode(code);
    if (!limpio || limpio === codGrupo) return;
    setCodGrupo(limpio);
    if (typeof window.setGrupoActivoDocente === 'function') window.setGrupoActivoDocente(limpio);
  }, [codGrupo]);
  const recargarPanel = React.useCallback(() => setReloadTick(v => v + 1), []);

  return {
    usuario, nombre, programa,
    codGrupo, grupos:gruposMeta, meta, nivel, grupoInfo:meta,
    roster, lecciones, asistenciaGrupo, asistenciaDetalle, comentariosDetalle,
    notasGrupo, resumenGrupo, leccionHoy, sesionClase,
    loading:loadingGroups || loadingPanel,
    loadingGroups, loadingPanel,
    error:errorGroups || errorPanel,
    cambiarGrupo, recargarPanel,
  };
}
// (TeacherLoadingState eliminado — usa <LoadingState/> + <ErrorState/> de primitives.jsx.)

// ── Tareas pendientes derivadas del cronograma real ─────────────────────
// (Antes alimentaba el TeacherDashboard viejo — ya eliminado en bloque 2.
// Se conserva por si una vista futura lo necesita; no hace fetch ni efectos
// colaterales, es puro cálculo.)
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

// (TeacherDashboard y QuickStat eliminados en bloque 2 — VistaDocente es
// ahora la única pantalla principal del docente, conectada al backend.)
// ─────────────────────────────────────────────────────────────────────────

// ── DOCENTE F77: Mis Grupos operativo desde APOLLO.GRUPOS ────────────────
const NIVEL_LABEL_GRUPO = { B1:'Básico I', B2:'Básico II', I1:'Intermedio I', I2:'Intermedio II', A1:'Avanzado I', A2:'Avanzado II' };
function nivelLabelDe(code) {
  const ini = ((code || '').split('-')[0] || '').toUpperCase();
  return NIVEL_LABEL_GRUPO[ini] || ini || '—';
}

function MisGruposSwitcher({ grupos, activo, onSelect }) {
  const lista = grupos || [];
  return (
    <div className="card" style={{ marginBottom:18, padding:'16px 18px', background:'#FBF7EF' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(245px, 1fr))', gap:12 }}>
        {lista.map(g => {
          const code = tvGroupCode(g);
          const active = String(code) === String(activo);
          const n = tvNivelId(g);
          const pal = nivelPal(n);
          const lab = tvGrupoLabel(g);
          return (
            <button key={code} type="button" onClick={() => onSelect(code)} disabled={active}
              style={{
                textAlign:'left', minHeight:112, borderRadius:'var(--r-lg)', padding:'16px 18px',
                border:`1.8px solid ${active ? pal.dark : 'var(--line)'}`,
                background: active ? `color-mix(in srgb, ${pal.light} 68%, white)` : '#FFF',
                boxShadow: active ? '0 0 0 1px rgba(7,59,122,.08)' : '0 1px 0 rgba(11,31,58,.05)',
                cursor: active ? 'default' : 'pointer', fontFamily:'inherit', position:'relative',
                display:'flex', flexDirection:'column', justifyContent:'center', gap:6,
              }}>
              {active && <span style={{ position:'absolute', top:13, right:14, background:'var(--an-navy)', color:'#fff', borderRadius:999, padding:'4px 11px', fontSize:10, fontWeight:900, letterSpacing:'.08em' }}>● ACTIVO</span>}
              <div style={{ fontSize:17, fontWeight:900, color:'var(--ink)', lineHeight:1.05 }}>{lab.dias}</div>
              <div style={{ fontSize:20, fontWeight:900, color:'var(--an-navy)', lineHeight:1 }}>{lab.hora || 'Horario'}</div>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:2 }}>
                <span style={{ fontSize:13, fontWeight:900, fontFamily:'var(--f-mono)', color:'var(--ink-2)' }}>{lab.ciclo}</span>
                <span style={{ fontSize:10, fontWeight:900, color:pal.dark, background:pal.light, borderRadius:999, padding:'2px 8px' }}>{n}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatF77({ label, value, sub, color='var(--an-navy)' }) {
  return <div className="card" style={{ padding:'18px 20px' }}>
    <div style={{ ...vdLabelStyle, marginBottom:8 }}>{label}</div>
    <div style={{ fontFamily:'var(--f-serif)', fontSize:32, fontWeight:700, color, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:8 }}>{sub}</div>}
  </div>;
}

function SesionClaseBox({ meta, leccionHoy, sesionClase, onStarted, onClosed }) {
  const [busy, setBusy] = React.useState(false);
  if (!leccionHoy) return null;
  const abierta = sesionClase && sesionClase.estado === 'ABIERTA';
  const cerrada = sesionClase && sesionClase.estado === 'CERRADA';
  const iniciar = async () => {
    const zoom = prompt('Pegá el link de Zoom para iniciar la sesión de clase:');
    if (!zoom) return;
    const hi = tvMinutes(meta.hora_i || tvScheduleFromCode(tvGroupCode(meta)).hora_i);
    const hf = tvMinutes(meta.hora_f || tvScheduleFromCode(tvGroupCode(meta)).hora_f);
    const now = tvNowMinutes();
    let motivo = '';
    if (hi != null && (now < hi || (hf != null && now > hf))) {
      motivo = prompt('Brinda una breve explicación de la razón de inicio fuera del horario establecido:') || '';
      if (!motivo.trim()) { alert('El motivo es obligatorio si iniciás fuera del horario.'); return; }
    }
    setBusy(true);
    try {
      const r = await postTeacher('docenteIniciarSesionClaseF77', { cod_grupo:tvGroupCode(meta), nivel:tvNivelId(meta), leccion:leccionHoy.leccion, zoom_link:zoom, motivo_inicio:motivo });
      if (!r?.ok) throw new Error(r?.error || 'No se pudo iniciar sesión.');
      onStarted && onStarted(r.sesion || r);
    } catch(e){ alert(e.message || String(e)); }
    finally { setBusy(false); }
  };
  const finalizar = async () => {
    if (!confirm('¿Finalizar la sesión? Esta acción no se podrá modificar.')) return;
    setBusy(true);
    try {
      const r = await postTeacher('docenteFinalizarSesionClaseF77', { cod_grupo:tvGroupCode(meta), nivel:tvNivelId(meta), leccion:leccionHoy.leccion });
      if (!r?.ok) throw new Error(r?.error || 'No se pudo finalizar sesión.');
      onClosed && onClosed(r.sesion || r);
    } catch(e){ alert(e.message || String(e)); }
    finally { setBusy(false); }
  };
  return <div className="card" style={{ padding:'14px 18px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, borderLeft:'4px solid var(--an-navy)' }}>
    <div>
      <div style={vdLabelStyle}>Clase de hoy</div>
      <div style={{ fontSize:18, fontWeight:800, color:'var(--ink)' }}>Lección {String(leccionHoy.leccion).padStart(2,'0')} · {tvHoraLabel(meta)}</div>
      <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:2 }}>
        {cerrada ? 'Sesión finalizada. Registro bloqueado para planilla.' : abierta ? 'Sesión abierta. Recordá finalizar al terminar la clase.' : 'Iniciá sesión para registrar horas reales de planilla.'}
      </div>
    </div>
    <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
      {!abierta && !cerrada && <button className="btn btn-primary" disabled={busy} onClick={iniciar}>INICIAR SESIÓN</button>}
      {abierta && <button className="btn btn-primary" disabled={busy} onClick={finalizar}>FINALIZAR SESIÓN</button>}
      {cerrada && <span style={{ padding:'10px 14px', borderRadius:'var(--r-md)', background:'color-mix(in srgb, var(--ok) 12%, white)', color:'#166534', fontWeight:800 }}>✓ Sesión cerrada</span>}
    </div>
  </div>;
}

function NotaDetalleDrawerF79({ estudiante, nota, onClose }) {
  if (!estudiante) return null;
  const defs = [
    ['ORAL_1','Lección 09 · Oral 1'], ['ORAL_2','Lección 17 · Oral 2'],
    ['ESCRITO_1','Lección 18 · Escrito 1'], ['ORAL_3','Lección 25 · Oral 3'],
    ['ORAL_4','Lección 31 · Oral 4'], ['ESCRITO_2','Lección 32 · Escrito 2'],
    ['SOCIAL','Social Skill'],
  ];
  return <div style={{ position:'fixed', inset:0, zIndex:1900, background:'rgba(7,22,45,.48)', display:'flex', justifyContent:'flex-end' }} onMouseDown={e=>{ if(e.target===e.currentTarget) onClose(); }}>
    <aside style={{ width:'min(440px, 94vw)', height:'100%', background:'#FFF', boxShadow:'-18px 0 50px rgba(0,0,0,.2)', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'22px 22px 18px', borderBottom:'1px solid var(--line)', display:'flex', justifyContent:'space-between', gap:12 }}>
        <div>
          <div style={{ ...labelStyle, marginBottom:5 }}>Historial académico</div>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:700 }}>{estudiante.name}</div>
          <div style={{ color:'var(--ink-3)', fontSize:12, marginTop:3 }}>Código {estudiante.code}</div>
        </div>
        <button type="button" onClick={onClose} style={{ border:0, background:'transparent', fontSize:24, cursor:'pointer', color:'var(--ink-3)' }}>×</button>
      </div>
      <div style={{ padding:22, overflowY:'auto', flex:1 }}>
        <div style={{ padding:'18px 20px', borderRadius:'var(--r-lg)', background:'var(--an-navy)', color:'#FFF', marginBottom:18 }}>
          <div style={{ fontSize:11, letterSpacing:'.12em', textTransform:'uppercase', opacity:.75 }}>Nota acumulada</div>
          <div style={{ fontSize:42, fontWeight:900, lineHeight:1.05, marginTop:4 }}>{nota?.tiene_notas ? nota.nota_total : '—'}</div>
          <div style={{ fontSize:12, opacity:.78, marginTop:4 }}>{nota?.tiene_notas ? 'Puntos oficiales acumulados' : 'Sin notas oficiales registradas'}</div>
        </div>
        <div style={{ display:'grid', gap:10 }}>
          {defs.map(([key,label]) => {
            const c = nota?.componentes?.[key];
            const value = c?.puntos ?? 0;
            return <div key={key} style={{ border:'1px solid var(--line)', borderRadius:'var(--r-md)', padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div>
                <div style={{ fontWeight:750, fontSize:13 }}>{label}</div>
                <div style={{ fontSize:10, color:'var(--ink-3)', marginTop:2 }}>{key}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <strong style={{ fontSize:18, color:value ? 'var(--an-navy)' : 'var(--ink-3)' }}>{value || '—'}</strong>
                <div style={{ fontSize:10, color:'var(--ink-3)' }}>de {c?.max ?? (key==='SOCIAL'?10:15)}</div>
              </div>
            </div>;
          })}
        </div>
      </div>
    </aside>
  </div>;
}

function RosterAcademicoF79({ roster, lecciones, asistenciaDetalle, asistenciaGrupo, comentariosDetalle, notasGrupo, meta, docenteNombre, leccionHoy, onSaved }) {
  const hoyIso = new Date().toISOString().slice(0,10);
  const lessons = React.useMemo(() => (lecciones || [])
    .filter(l => String(l.tipo || '').toUpperCase() !== 'FERIADO' && String(l.tipo || '').toUpperCase() !== 'ICAN')
    .slice(0,32), [lecciones]);
  const hoy = leccionHoy || lessons.find(l => String(l.fecha || '') === hoyIso && String(l.estado || '').toUpperCase() !== 'FERIADO') || null;
  const [draft, setDraft] = React.useState({});
  const [comments, setComments] = React.useState({});
  const [notaGeneral, setNotaGeneral] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState(null);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    const next = {}, nextComments = {};
    roster.forEach(r => {
      const det = hoy ? asistenciaDetalle?.[String(hoy.leccion)]?.[r.code] : null;
      next[r.code] = det ? det.presente !== false : true;
      nextComments[r.code] = hoy ? (comentariosDetalle?.[String(hoy.leccion)]?.[r.code] || '') : '';
    });
    setDraft(next); setComments(nextComments);
  }, [hoy?.leccion, roster, asistenciaDetalle, comentariosDetalle]);

  React.useEffect(() => {
    const box = scrollRef.current;
    if (!box || !lessons.length) return;
    const idxToday = hoy ? lessons.findIndex(l => Number(l.leccion) === Number(hoy.leccion)) : -1;
    const idxClosed = lessons.reduce((acc,l,i) => String(l.estado||'').toUpperCase()==='CERRADA' ? i : acc, -1);
    const idx = idxToday >= 0 ? idxToday : Math.max(0, idxClosed);
    requestAnimationFrame(() => { box.scrollLeft = Math.max(0, idx * 104 - 90); });
  }, [hoy?.leccion, lessons.length, tvGroupCode(meta)]);

  const hoyCerrada = hoy && String(hoy.estado || '').toUpperCase() === 'CERRADA';
  const guardarHoy = async () => {
    if (!hoy || hoyCerrada || String(hoy.fecha || '') !== hoyIso) return;
    setSaving(true);
    try {
      const r = await postTeacher('cerrarLeccionDesdeMisGruposF79', {
        cod_grupo:tvGroupCode(meta), nivel:tvNivelId(meta), leccion:hoy.leccion,
        nota_docente:notaGeneral,
        asistencias:draft,
        comentarios,
        programa:meta?.programa || '',
      });
      if (!r?.ok) throw new Error(r?.error || r?.detalle || 'No se pudo guardar asistencia.');
      alert('Asistencia de la clase de hoy guardada.');
      onSaved && onSaved();
    } catch (e) { alert(e?.message || String(e)); }
    finally { setSaving(false); }
  };

  const scrollBy = delta => scrollRef.current?.scrollBy({ left:delta, behavior:'smooth' });
  return <>
    <div className="card" style={{ padding:0, overflow:'hidden' }}>
      <div style={{ padding:'16px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:14, flexWrap:'wrap', borderBottom:'1px solid var(--line)' }}>
        <div>
          <div className="card-title">Estudiantes · asistencia y notas</div>
          <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:3 }}>
            El historial queda hacia la izquierda; la clase de hoy se abre directamente para marcar Presente o Ausente.
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button type="button" onClick={()=>scrollBy(-420)} className="btn btn-ghost" style={{ width:38, padding:8 }}>←</button>
          <button type="button" onClick={()=>scrollBy(420)} className="btn btn-ghost" style={{ width:38, padding:8 }}>→</button>
          {hoy && !hoyCerrada && String(hoy.fecha||'')===hoyIso && <button type="button" className="btn btn-primary" disabled={saving} onClick={guardarHoy}>{saving?'Guardando…':'✓ Pasar asistencia de hoy'}</button>}
        </div>
      </div>
      <div style={{ padding:'12px 18px', background:'#FBF7EF', borderBottom:'1px solid var(--line)', display:'grid', gridTemplateColumns:'minmax(240px,1fr) auto', gap:12, alignItems:'center' }}>
        <div>
          <strong style={{ fontSize:13 }}>{hoy ? `Clase de hoy · Lección ${String(hoy.leccion).padStart(2,'0')}` : 'Hoy no hay una clase programada para este grupo'}</strong>
          {hoy && <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>{hoy.fecha} · {tvHoraLabel(meta)}</div>}
        </div>
        <div style={{ fontSize:11, fontWeight:800, color:hoyCerrada?'#166534':'var(--an-navy)' }}>{hoyCerrada?'✓ Asistencia cerrada':hoy?'Pendiente de cierre':'Sin acción hoy'}</div>
      </div>
      {hoy && !hoyCerrada && String(hoy.fecha||'')===hoyIso && <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--line)' }}>
        <label style={{ ...labelStyle, display:'block', marginBottom:6 }}>Nota general del docente · opcional</label>
        <textarea value={notaGeneral} onChange={e=>setNotaGeneral(e.target.value)} placeholder="Cubrimos hasta la página 14..." style={{ width:'100%', minHeight:52, border:'1px solid var(--line)', borderRadius:'var(--r-md)', padding:10, fontFamily:'inherit', resize:'vertical' }} />
      </div>}
      <div ref={scrollRef} style={{ overflowX:'auto', overflowY:'visible', position:'relative', scrollbarGutter:'stable', borderTop:'0' }}>
        <table className="table-soft" style={{ minWidth:430 + lessons.length * 104, borderCollapse:'separate', borderSpacing:0 }}>
          <thead>
            <tr>
              <th style={{ ...stickyStudentCellF79(true), minWidth:330, width:330 }}>Estudiante</th>
              {lessons.map(l => {
                const isToday = hoy && Number(l.leccion)===Number(hoy.leccion);
                return <th key={`${l.leccion}-${l.fecha}`} style={{ minWidth:104, width:104, textAlign:'center', background:isToday?'#EAF3FF':'var(--surface-2)', borderTop:isToday?'3px solid var(--an-navy)':'3px solid transparent' }}>
                  <div style={{ fontSize:11, fontWeight:900 }}>Lec {String(l.leccion).padStart(2,'0')}</div>
                  <div style={{ fontSize:9, color:'var(--ink-3)', marginTop:2 }}>{String(l.fecha||'').slice(5).split('-').reverse().join('/')}</div>
                  {isToday && <div style={{ fontSize:8, color:'var(--an-navy)', fontWeight:900, marginTop:3 }}>HOY</div>}
                </th>;
              })}
              <th style={{ ...stickyNoteCellF79(true), minWidth:190, width:190 }}>Nota completa</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((r,i) => {
              const att = asistenciaGrupo?.[r.code];
              const note = notasGrupo?.[r.code] || r.note;
              return <tr key={r.code || i}>
                <td style={{ ...stickyStudentCellF79(false), minWidth:330, width:330 }}>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <div style={{ width:34, height:34, flex:'0 0 34px', borderRadius:'50%', background:'var(--an-navy)', color:'#FFF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800 }}>{(r.name||'').split(' ').slice(0,2).map(w=>w[0]).join('')}</div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontWeight:750, lineHeight:1.25 }}>{r.name}</div>
                      <div style={{ fontSize:10, color:'var(--ink-3)', marginTop:3 }}>Código {r.code} · Asistencia {att?.pct != null ? `${att.pct}%` : '—'}</div>
                    </div>
                  </div>
                </td>
                {lessons.map(l => {
                  const key=String(l.leccion), det=asistenciaDetalle?.[key]?.[r.code], comment=comentariosDetalle?.[key]?.[r.code] || '';
                  const isToday=hoy && Number(hoy.leccion)===Number(l.leccion);
                  const closed=String(l.estado||'').toUpperCase()==='CERRADA' || !!det;
                  const future=String(l.fecha||'')>hoyIso;
                  return <td key={`${r.code}-${key}`} style={{ minWidth:104, width:104, textAlign:'center', verticalAlign:'middle', padding:'7px 6px', background:isToday?'#F7FBFF':'#FFF' }}>
                    {isToday && !closed && String(l.fecha||'')===hoyIso ? <div style={{ display:'grid', gap:5 }}>
                      <button type="button" onClick={()=>setDraft(d=>({...d,[r.code]:true}))} style={miniAttendBtn(draft[r.code]!==false,true)}>Presente</button>
                      <button type="button" onClick={()=>setDraft(d=>({...d,[r.code]:false}))} style={miniAttendBtn(draft[r.code]===false,false)}>Ausente</button>
                      <input value={comments[r.code]||''} onChange={e=>setComments(c=>({...c,[r.code]:e.target.value}))} placeholder="Comentario" style={{ width:'100%', border:'1px solid var(--line)', borderRadius:6, padding:'5px 6px', fontSize:9, fontFamily:'inherit' }} />
                    </div> : closed ? <div title={comment || 'Sin comentario'}>
                      <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:58, padding:'5px 7px', borderRadius:999, fontSize:10, fontWeight:900, color:det?.presente===false?'#B3261E':'#166534', background:det?.presente===false?'#FDECEA':'#E8F5E9' }}>{det?.presente===false?'Ausente':'Presente'}</div>
                      {comment && <div style={{ fontSize:9, color:'var(--ink-3)', marginTop:4 }}>💬 comentario</div>}
                    </div> : future ? <span style={{ color:'var(--ink-3)', fontSize:10 }}>Programada</span> : <span style={{ color:'var(--ink-3)', fontSize:10 }}>Sin dato</span>}
                  </td>;
                })}
                <td style={{ ...stickyNoteCellF79(false), minWidth:190, width:190 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
                    <div>
                      <div style={{ fontSize:22, fontWeight:900, color:note?.tiene_notas?'var(--an-navy)':'var(--ink-3)' }}>{note?.tiene_notas ? note.nota_total : '—'}</div>
                      <div style={{ fontSize:9, color:'var(--ink-3)', marginTop:1 }}>{note?.tiene_notas?'acumulada':'sin notas'}</div>
                    </div>
                    <button type="button" className="btn btn-ghost" onClick={()=>setSelectedStudent(r)} style={{ padding:'7px 9px', fontSize:10 }}>Ver detalle</button>
                  </div>
                </td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
    <NotaDetalleDrawerF79 estudiante={selectedStudent} nota={selectedStudent ? (notasGrupo?.[selectedStudent.code] || selectedStudent.note) : null} onClose={()=>setSelectedStudent(null)} />
  </>;
}
function stickyStudentCellF79(head){ return { position:'sticky', left:0, zIndex:head?8:5, background:head?'var(--surface-2)':'#FFF', boxShadow:'8px 0 14px -14px rgba(0,0,0,.55)', borderRight:'1px solid var(--line)' }; }
function stickyNoteCellF79(head){ return { position:'sticky', right:0, zIndex:head?8:5, background:head?'var(--surface-2)':'#FFF', boxShadow:'-8px 0 14px -14px rgba(0,0,0,.55)', borderLeft:'1px solid var(--line)' }; }
function miniAttendBtn(active, present){ return { border:'1px solid '+(active?(present?'#166534':'#B3261E'):'var(--line)'), background:active?(present?'#E8F5E9':'#FDECEA'):'#FFF', color:active?(present?'#166534':'#B3261E'):'var(--ink-2)', borderRadius:7, padding:'6px 7px', fontSize:9.5, fontWeight:850, cursor:'pointer' }; }

function GruposView() {
  const { codGrupo, grupos, meta, nivel, nombre, roster, loading, error, asistenciaGrupo, asistenciaDetalle, comentariosDetalle, notasGrupo, resumenGrupo, lecciones, sesionClase, leccionHoy, cambiarGrupo, recargarPanel } = useTeacherSession();
  const lista = grupos || [];

  if (!lista.length && !loading) {
    return <div><PageHeader kicker="Gestión académica" title={<>Mis <em>Grupos</em></>} sub="Grupos asignados" /><ErrorState message={error || 'No hay grupos En curso asignados.'} onRetry={() => location.reload()} /></div>;
  }

  const promedioGrupo = resumenGrupo?.promedioGrupo;
  const promedioAsistencia = resumenGrupo?.promedioAsistencia;
  return <div>
    <PageHeader kicker="Gestión académica" title={<>Mis <em>Grupos</em></>} sub={lista.length > 1 ? `Tenés ${lista.length} grupos en curso` : tvGrupoLabel(meta).full} />
    <MisGruposSwitcher grupos={lista} activo={codGrupo} onSelect={cambiarGrupo} />
    {error && !loading && <div style={{ marginBottom:14 }}><ErrorState message={error} onRetry={recargarPanel} /></div>}
    {loading ? <LoadingState title="Cargando grupo…" subtitle="Uniendo GRUPOS, ESTATUS, cronograma, asistencia y notas oficiales" /> : <>
      <div className="grid-4" style={{ marginBottom:20 }}>
        <StatF77 label="Matriculados CA" value={resumenGrupo?.totalCA ?? roster.length} sub="Solo estudiantes CA del nivel en curso" color="var(--an-navy)" />
        <StatF77 label="Nivel actual" value={tvNivelLabel(meta)} sub={tvGrupoLabel(meta).full} color={nivelPal(nivel).dark} />
        <StatF77 label="Promedio grupo" value={promedioGrupo != null ? promedioGrupo : '—'} sub={promedioGrupo != null ? `${resumenGrupo?.estudiantesConNotas || 0} estudiantes con notas` : 'Sin notas oficiales registradas'} color="var(--an-navy)" />
        <StatF77 label="Asistencia" value={promedioAsistencia != null ? `${promedioAsistencia}%` : '—'} sub={promedioAsistencia != null ? `${resumenGrupo?.cerradas || 0} clases cerradas` : 'Sin registro aún'} color="var(--warn)" />
      </div>
      <SesionClaseBox meta={meta} leccionHoy={leccionHoy} sesionClase={sesionClase} onStarted={recargarPanel} onClosed={recargarPanel} />
      <RosterAcademicoF79 roster={roster} lecciones={lecciones} asistenciaDetalle={asistenciaDetalle} asistenciaGrupo={asistenciaGrupo} comentariosDetalle={comentariosDetalle} notasGrupo={notasGrupo} meta={meta} docenteNombre={nombre} leccionHoy={leccionHoy} onSaved={recargarPanel} />
    </>}
  </div>;
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
  const [comentarios, setComentarios] = React.useState({});
  React.useEffect(() => {
    const o = {};
    roster.forEach(r => { o[r.code] = ''; });
    setComentarios(o);
  }, [roster]);
  // Re-init notas cuando cambia el roster
  React.useEffect(() => {
    const o = {};
    roster.forEach(r => { o[r.code] = ''; });
    setNotas(o);
  }, [roster]);

  if (error)   return <ErrorState message={error} onRetry={() => location.reload()} />;
  if (loading) return <LoadingState title="Cargando grupo…" subtitle="Consultando lista de estudiantes" />;

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
      const token = window.getSessionToken ? window.getSessionToken() : '';
      const resultados = await Promise.allSettled(
        estudiantesConNota.map(r =>
          fetch(`${SCRIPT_URL_TV}?fn=registrarNotaEstatus`, {
            method: 'POST',
            body: JSON.stringify({
              token,
              cod_estudiante: r.code,
              grupo:          codGrupo,
              nivel:          (codGrupo.split('-')[0] || 'B1').toUpperCase(),
              programa:       programa,
              tipo_eval:      tipoEval,
              leccion_num:    lec,
              nota:           parseFloat(notas[r.code]),
              comentario:     comentarios[r.code] || '',
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
                    <input
                      placeholder="Retroalimentación breve…"
                      value={comentarios[r.code] || ''}
                      onChange={e => setComentarios(prev => ({ ...prev, [r.code]: e.target.value }))}
                      style={{ width:'100%', height:38, padding:'0 10px', border:'1px solid var(--line)', borderRadius:8, fontSize:12, outline:'none', fontFamily:'inherit' }}
                    />
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

  if (error)   return <ErrorState message={error} onRetry={() => location.reload()} />;
  if (loading) return <LoadingState title="Cargando grupo…" subtitle="Consultando lista de estudiantes" />;

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
      token:          window.getSessionToken ? window.getSessionToken() : '',
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

Object.assign(window, { GruposView, CalificarView, AsistenciaView });
