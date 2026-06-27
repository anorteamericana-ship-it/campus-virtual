// F98.4-Z6-K · horario I CAN estable + Progress Check obligatorio y recuperable
// Base preservada: F98.4-Z6-H · Asistencia inteligente: TOTAL / SOLO LECCIONES / SOLO I CAN
// F98.4-O_20260625_FIX_MIS_GRUPOS_LABELSTYLE_CIERRE_LECCION
// F92.7_20260620_DRAWER_DOCENTE_ESTADO_SEGURO
// F89_20260620_ACCESO_EXAMENES_Y_AVISO_CIERRE
// F86_20260619_DOCENTE_ETIQUETAS_Y_APLICACION_ORAL
// CALGRUPO_F82_20260619_MIS_GRUPOS_SEMANA_PROXIMA_LECCION_DRAWER
/* global React, Icon, Chip, Stat, PageHeader */

// ─────────────────────────────────────────────────────────────────────────
// TEACHER VIEWS — conectado a Apps Script real
// ─────────────────────────────────────────────────────────────────────────

// URL del Apps Script: fuente única en data.jsx → window.APPS_SCRIPT_URL
const SCRIPT_URL_TV = window.APPS_SCRIPT_URL;

// FIX-ADMIN-CORE-POST-001: lecturas sensibles vía POST text/plain (token en body).
async function postTeacher(fn, payload = {}, timeoutMs = 30000) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(`${SCRIPT_URL_TV}?fn=${encodeURIComponent(fn)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn, token, ...payload }),
      signal: controller ? controller.signal : undefined,
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; }
    catch (_) { throw new Error(`Respuesta inválida del backend en ${fn}.`); }
    if (!res.ok) throw new Error((data && (data.error || data.mensaje)) || `HTTP ${res.status}`);
    return data;
  } catch (e) {
    if (e && e.name === 'AbortError') throw new Error(`El backend tardó demasiado en responder (${fn}).`);
    throw e;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// F80: el panel consolidado es la ruta principal. Si falla, usamos las rutas
// estables anteriores para que el docente no quede atrapado en un spinner.
async function cargarPanelDocenteF80(codGrupo, nivel) {
  try {
    const r = await postTeacher('getDocenteGrupoPanelF80', { cod_grupo:codGrupo, nivel }, 45000);
    if (r && r.ok) return r;
    throw new Error((r && (r.error || r.mensaje)) || 'Panel consolidado no disponible.');
  } catch (primaryError) {
    const calls = await Promise.allSettled([
      postTeacher('getEstudiantesParaCierre', { cod_grupo:codGrupo, nivel }, 30000),
      postTeacher('getAsistenciaGrupoCompleta', { cod_grupo:codGrupo, nivel }, 30000),
      postTeacher('getFechasGrupo', { cod_grupo:codGrupo, nivel, riel:'curso' }, 30000),
      postTeacher('getFechasGrupo', { cod_grupo:codGrupo, nivel, riel:'ican' }, 30000),
      postTeacher('getAsistenciaDetalleGrupoF77', { cod_grupo:codGrupo, nivel }, 30000),
      postTeacher('getDocenteSesionClaseF77', { cod_grupo:codGrupo, nivel }, 30000),
    ]);
    const value = (i) => calls[i].status === 'fulfilled' ? calls[i].value : null;
    const rEst=value(0), rAsis=value(1), rCurso=value(2), rIcan=value(3), rDet=value(4), rSesion=value(5);
    if (!rEst || !rEst.ok) throw primaryError;
    const lecciones = [
      ...((rCurso&&rCurso.ok&&Array.isArray(rCurso.lecciones)?rCurso.lecciones:[]).map(l=>({...l,riel:'curso'}))),
      ...((rIcan&&rIcan.ok&&Array.isArray(rIcan.lecciones)?rIcan.lecciones:[]).map(l=>({...l,riel:'ican',tipo:'ICAN'}))),
    ].sort(tvLessonSortF97);
    const today = new Date().toISOString().slice(0,10);
    const leccionHoy = lecciones.find(l => String(l.fecha || '') === today && String(l.estado || '').toUpperCase() !== 'FERIADO') || null;
    const asistencia = rAsis && rAsis.ok ? (rAsis.asistencia || {}) : {};
    const vals = Object.values(asistencia).map(v => Number(v && v.pct)).filter(Number.isFinite);
    return {
      ok:true,
      version:'F80_FALLBACK',
      parcial:true,
      estudiantes:rEst.estudiantes || [],
      total_ca:(rEst.estudiantes || []).length,
      lecciones,
      leccion_hoy:leccionHoy,
      cerradas:lecciones.filter(l => String(l.estado || '').toUpperCase() === 'CERRADA').length,
      asistencia,
      asistencia_detalle:rDet && rDet.ok ? (rDet.detalle || {}) : {},
      comentarios:rDet && rDet.ok ? (rDet.comentarios || {}) : {},
      ican:rDet && rDet.ok ? (rDet.ican || {}) : {},
      notas:{},
      promedio_grupo:null,
      estudiantes_con_notas:0,
      promedio_asistencia:vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : null,
      sesion_clase:rSesion && rSesion.ok ? (rSesion.sesion || null) : null,
      advertencia:'Se cargó el panel básico porque el resumen consolidado no respondió.'
    };
  }
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
  // F87: el horario codificado (SA94/KJ69/etc.) prevalece sobre valores Date
  // de Sheets, que en navegadores podían aparecer desplazados a minutos :23.
  const rawHi=sched.hora_i || g?.hora_i || g?.hora_inicio;
  const rawHf=sched.hora_f || g?.hora_f || g?.hora_fin;
  const norm=(x)=>{
    if(x instanceof Date&&!Number.isNaN(x.getTime())){const h=x.getHours(),min=x.getMinutes();return `${h===0?'12':h>12?h-12:h}${min?':'+String(min).padStart(2,'0'):''}${h>=12?'pm':'am'}`;}
    const str=String(x==null?'':x).trim();
    const m=str.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i); if(!m)return str;
    let h=Number(m[1]),min=m[2]&&m[2]!=='00'?':'+m[2]:'',ap=(m[3]||'').toLowerCase();
    if(ap){return `${h}${min}${ap}`;}
    return `${h===0?'12':h>12?h-12:h}${min}${h>=12?'pm':'am'}`;
  };
  return [norm(rawHi),norm(rawHf)].filter(Boolean).join(' a ');
}
function tvLessonHoraLabel(lesson, meta){
  const esIcan=String(lesson?.riel||'').toLowerCase()==='ican'||tvUpper(lesson?.tipo)==='ICAN';
  // Z6-K: I CAN usa primero el horario oficial del grupo. Las filas históricas
  // del calendario podían contener 20:23–23:23 por serialización Date(1899).
  if(esIcan){
    const hiI=meta?.hora_i_ican||meta?.hora_inicio_ican||meta?.horaIniIcan;
    const hfI=meta?.hora_f_ican||meta?.hora_fin_ican||meta?.horaFinIcan;
    if(hiI&&hfI)return tvHoraLabel({hora_i:hiI,hora_f:hfI});
  }
  const hi=lesson?.hora_inicio,hf=lesson?.hora_fin;
  if(hi&&hf)return tvHoraLabel({hora_i:hi,hora_f:hf});
  return tvHoraLabel(meta);
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
function tvMinutes(hhmm){ const m=String(hhmm||'').trim().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i); if(!m)return null; let h=Number(m[1]),ap=(m[3]||'').toLowerCase(); if(ap==='pm'&&h<12)h+=12; if(ap==='am'&&h===12)h=0; return h*60+Number(m[2]||0); }
function tvLocalIsoF88(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function tvSessionToneF88(lesson,nowMs=Date.now(),session=null){
  const now=new Date(nowMs), date=String(session?.FECHA||session?.fecha||lesson?.fecha||'').slice(0,10), end=tvMinutes(session?.HORA_PROGRAMADA_FIN||session?.HORA_FIN||session?.hora_fin||lesson?.hora_fin||'');
  const green={bg:'#16834A',soft:'#EAF8EF',ink:'#145C38',label:'● SESIÓN ACTIVA'};
  if(date&&date<tvLocalIsoF88(now))return {bg:'#C62828',soft:'#FDECEA',ink:'#8B1F1F',label:'● SESIÓN ACTIVA · PENDIENTE DE CIERRE'};
  if(date&&date>tvLocalIsoF88(now))return green;
  if(end==null)return green;
  const remain=end-(now.getHours()*60+now.getMinutes());
  if(remain<=0)return {bg:'#C62828',soft:'#FDECEA',ink:'#8B1F1F',label:'● SESIÓN ACTIVA · PENDIENTE DE CIERRE'};
  if(remain<=30)return {bg:'#B77900',soft:'#FFF4D6',ink:'#704A00',label:'● SESIÓN ACTIVA · ÚLTIMOS 30 MINUTOS'};
  return green;
}
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
  const [icanResumen, setIcanResumen] = React.useState({});
  const [panelPrograma, setPanelPrograma] = React.useState('');
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
    postTeacher('getDocenteGruposActuales', { docente:nombre }, 30000)
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
    cargarPanelDocenteF80(codGrupo, nivel)
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
            cedula:String(e.cedula || e.CEDULA || e.NUM_CEDULA || e.identificacion || '').trim(),
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
        setIcanResumen(r.ican || {});
        setPanelPrograma(r.programa || r.grupo?.programa || '');
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
    usuario, nombre, programa:panelPrograma || meta?.programa || programa,
    codGrupo, grupos:gruposMeta, meta, nivel, grupoInfo:meta,
    roster, lecciones, asistenciaGrupo, asistenciaDetalle, comentariosDetalle,
    notasGrupo, resumenGrupo, icanResumen, leccionHoy, sesionClase,
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

const TV_WEEK_DAYS_F82 = [
  { key:1, label:'LUNES' }, { key:2, label:'MARTES' }, { key:3, label:'MIÉRCOLES' },
  { key:4, label:'JUEVES' }, { key:5, label:'VIERNES' }, { key:6, label:'SÁBADO' },
  { key:0, label:'DOMINGO' },
];
function tvGroupDayIndexesF82(g) {
  const code = tvUpper(g?.dias || g?.diasCode || tvScheduleFromCode(tvGroupCode(g)).dias || '');
  const exact = {
    LM:[1,3], KJ:[2,4], LJ:[1,4], L4:[1,2,3,4], SA:[6], SAB:[6],
    L:[1], K:[2], M:[3], J:[4], V:[5], D:[0],
  };
  if (exact[code]) return exact[code];
  const raw = tvUpper(g?.dias_semana || g?.dias_label || code);
  const out = [];
  const checks = [
    [1,/LUN/], [2,/MAR/], [3,/MI[ÉE]R/], [4,/JUE/], [5,/VIE/], [6,/S[ÁA]B/], [0,/DOM/],
  ];
  checks.forEach(([n,re]) => { if (re.test(raw)) out.push(n); });
  return out.length ? out : [1,3];
}
function tvStartMinutesF82(g) {
  const sched = tvScheduleFromCode(tvGroupCode(g));
  const direct = tvMinutes(g?.hora_i || g?.hora_inicio);
  const fallback = tvMinutes(sched.hora_i);
  return direct != null ? direct : (fallback != null ? fallback : 9999);
}
function tvIcanDayIndexesF82(g) {
  const raw = tvUpper(g?.dias_ican || g?.diasIcan || g?.dias_ican_code || '');
  if (!raw) return [];
  return tvGroupDayIndexesF82({ dias:raw, diasCode:raw, code:'' });
}
function tvIcanStartMinutesF82(g) {
  const direct = tvMinutes(g?.hora_i_ican || g?.hora_inicio_ican);
  return direct != null ? direct : 9999;
}
function tvIcanHoraLabelF82(g) {
  return tvHoraLabel({ hora_i:g?.hora_i_ican || g?.hora_inicio_ican, hora_f:g?.hora_f_ican || g?.hora_fin_ican });
}
function tvGroupHasIcanF82(g) {
  const configured = !!(g?.dias_ican && (g?.hora_i_ican || g?.hora_inicio_ican) && (g?.hora_f_ican || g?.hora_fin_ican));
  return g?.puede_ican === true || tvUpper(g?.programa)==='INA' || configured;
}
function MisGruposSwitcher({ grupos, activo, onSelect, activeSession }) {
  const lista = Array.isArray(grupos) ? grupos : [];
  return (
    <div className="card" style={{ marginBottom:18, padding:0, background:'#FBF7EF', width:'100%', maxWidth:'100%', minWidth:0, overflow:'hidden' }}>
      <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
        <div style={{ minWidth:980, display:'grid', gridTemplateColumns:'repeat(7, minmax(128px, 1fr))', borderTop:'1px solid var(--line)', borderLeft:'1px solid var(--line)' }}>
          {TV_WEEK_DAYS_F82.map(day => {
            const dayItems=[];
            lista.forEach(g=>{
              if(g?.puede_curso!==false && tvGroupDayIndexesF82(g).includes(day.key)) dayItems.push({g,riel:'curso',start:tvStartMinutesF82(g)});
              const canIcan=g?.puede_ican===true || (g?.puede_ican==null && tvGroupHasIcanF82(g));
              if(canIcan && tvIcanDayIndexesF82(g).includes(day.key)) dayItems.push({g,riel:'ican',start:tvIcanStartMinutesF82(g)});
            });
            dayItems.sort((a,b)=>a.start-b.start||String(a.riel).localeCompare(String(b.riel)));
            return (
              <div key={day.key} style={{ minHeight:158, borderRight:'1px solid var(--line)', borderBottom:'1px solid var(--line)', background:'#FFF' }}>
                <div style={{ padding:'11px 8px', textAlign:'center', fontSize:11, fontWeight:900, letterSpacing:'.08em', color:'var(--ink-2)', borderBottom:'1px solid var(--line)', background:'#F7F3EC' }}>{day.label}</div>
                <div style={{ display:'grid', gap:7, padding:7 }}>
                  {dayItems.map(({g,riel}) => {
                    const code=tvGroupCode(g), active=String(code)===String(activo), n=tvNivelId(g), pal=nivelPal(n), lab=tvGrupoLabel(g), isIcan=riel==='ican';
                    const activeRiel=String(activeSession?.RIEL||activeSession?.riel||'curso').trim().toLowerCase()==='ican'?'ican':'curso';
                    const sessionHere=tvUpper(activeSession?.ESTADO||activeSession?.estado)==='ABIERTA'&&String(activeSession?.COD_GRUPO||activeSession?.cod_grupo||'')===String(code)&&activeRiel===riel;
                    const dark=isIcan?'#57217F':pal.dark, light=isIcan?'#EADCF5':pal.light;
                    const daysLabel=isIcan?'Club I CAN':lab.dias;
                    const hourLabel=isIcan?tvIcanHoraLabelF82(g):lab.hora;
                    const title=isIcan?`Club I CAN · ${tvDiasLabel(g?.dias_ican||'')} de ${hourLabel} - ${lab.ciclo}`:lab.full;
                    return <button key={`${day.key}-${code}-${riel}`} type="button" onClick={()=>onSelect(code)} title={title} style={{
                      border:`1.5px solid ${sessionHere?'#C62828':active?dark:'var(--line)'}`, borderLeft:`4px solid ${sessionHere?'#C62828':dark}`,
                      background:sessionHere?'#FDECEA':active?light:'#FFF', borderRadius:10,
                      padding:'8px 9px', textAlign:'left', cursor:active?'default':'pointer', fontFamily:'inherit',
                      boxShadow:active?(isIcan?'0 0 0 3px rgba(87,33,127,.18), 0 8px 18px rgba(87,33,127,.12)':'0 0 0 2px rgba(7,59,122,.10)'):(isIcan?'0 4px 12px rgba(87,33,127,.12)':'0 2px 8px rgba(8,30,60,.05)'), position:'relative', minHeight:68,
                    }}>
                      <div style={{ fontSize:10.5, fontWeight:900, color:isIcan?dark:'var(--ink)', lineHeight:1.15 }}>{daysLabel}</div>
                      <div style={{ fontSize:15, fontWeight:900, color:isIcan?dark:'var(--an-navy)', lineHeight:1.1, marginTop:3 }}>{hourLabel||'Horario pendiente'}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4 }}>
                        <span style={{ fontSize:9.5, fontWeight:900, fontFamily:'var(--f-mono)', color:'var(--ink-2)' }}>{lab.ciclo}</span>
                        <span style={{ fontSize:8, fontWeight:900, color:dark, background:light, borderRadius:999, padding:'1px 5px' }}>{isIcan?'I CAN':n}</span>
                        {sessionHere ? <span style={{ marginLeft:'auto', fontSize:7.5, fontWeight:900, color:'#FFF', background:'#C62828', borderRadius:999, padding:'2px 5px' }}>SESIÓN ACTIVA</span> : active && <span style={{ marginLeft:'auto', fontSize:7.5, fontWeight:900, color:'#FFF', background:isIcan?dark:'var(--an-navy)', borderRadius:999, padding:'2px 5px' }}>SELECCIONADO</span>}
                      </div>
                    </button>;
                  })}
                  {!dayItems.length && <div style={{ height:58 }} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatF77({ label, value, sub, color='var(--an-navy)' }) {
  return <div className="card" style={{ padding:'16px 18px', minWidth:0, overflow:'hidden' }}>
    <div style={{ ...vdLabelStyle, marginBottom:8 }}>{label}</div>
    <div style={{ fontFamily:'var(--f-serif)', fontSize:32, fontWeight:700, color, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:8 }}>{sub}</div>}
  </div>;
}

function SesionClaseBox({ meta, leccionHoy, sesionClase, onStarted, onClosed }) {
  const [busy, setBusy] = React.useState(false);
  if (!leccionHoy) return null;
  const estadoSesion = String((sesionClase && (sesionClase.estado || sesionClase.ESTADO)) || '').toUpperCase();
  const abierta = estadoSesion === 'ABIERTA';
  const cerrada = estadoSesion === 'CERRADA';
  const iniciar = async () => {
    const zoom = prompt('Pegá el link de Zoom para iniciar la sesión de clase:');
    if (!zoom) return;
    setBusy(true);
    try {
      const r = await postTeacher('docenteIniciarSesionClaseF77', { cod_grupo:tvGroupCode(meta), nivel:tvNivelId(meta), leccion:leccionHoy.leccion, zoom_link:zoom });
      if (!r?.ok) throw new Error(r?.error || 'No se pudo iniciar sesión.');
      onStarted && onStarted(r.sesion || r);
    } catch(e){ alert(e.message || String(e)); }
    finally { setBusy(false); }
  };
  const finalizar = async () => {
    if (!confirm('¿Cerrar la clase?')) return;
    setBusy(true);
    try {
      const r = await postTeacher('docenteFinalizarSesionClaseF77', { cod_grupo:tvGroupCode(meta), nivel:tvNivelId(meta), leccion:leccionHoy.leccion });
      if (!r?.ok) throw new Error(r?.error || 'No se pudo finalizar sesión.');
      onClosed && onClosed(r.sesion || r);
    } catch(e){ alert(e.message || String(e)); }
    finally { setBusy(false); }
  };
  return <div className="card" style={{ padding:'14px 18px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, borderLeft:'4px solid var(--an-navy)', width:'100%', maxWidth:'100%', minWidth:0, flexWrap:'wrap' }}>
    <div>
      <div style={vdLabelStyle}>Clase de hoy</div>
      <div style={{ fontSize:18, fontWeight:800, color:'var(--ink)' }}>Lección {String(leccionHoy.leccion).padStart(2,'0')} · {tvLessonHoraLabel(leccionHoy, meta)}</div>
      <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:2 }}>
        {cerrada ? 'Clase cerrada.' : abierta ? 'Sesión abierta. Recordá finalizar al terminar la clase.' : 'Iniciá la clase cuando estés listo.'}
      </div>
    </div>
    <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
      {!abierta && !cerrada && <button className="btn btn-primary" disabled={busy} onClick={iniciar}>INICIAR SESIÓN</button>}
      {abierta && <button className="btn btn-primary" disabled={busy} onClick={finalizar}>FINALIZAR SESIÓN</button>}
      {cerrada && <span style={{ padding:'10px 14px', borderRadius:'var(--r-md)', background:'color-mix(in srgb, var(--ok) 12%, white)', color:'#166534', fontWeight:800 }}>✓ Sesión cerrada</span>}
    </div>
  </div>;
}

function tvLessonIdF82(nivel, leccion) {
  const off={B1:0,B2:32,I1:64,I2:96};
  return 'L'+String((off[tvUpper(nivel)]||0)+Number(leccion||0)).padStart(3,'0');
}
function tvEvalLabelF86(tipo, leccion, largo=false) {
  const t=tvUpper(tipo), n=Number(leccion||0);
  const map={
    EVAL_ORAL:{9:['1.er oral','1.er Examen Oral'],17:['2.º oral','2.º Examen Oral'],25:['3.er oral','3.er Examen Oral'],31:['4.º oral','4.º Examen Oral']},
    EVAL_ESCRITO:{18:['1.er escrito','1.er Examen Escrito'],32:['2.º escrito','2.º Examen Escrito']},
  };
  const v=map[t]?.[n];
  return v ? v[largo?1:0] : '';
}
const TV_PROGRESS_CHECK_LESSONS_F96 = new Set([4,8,13,16,21,24,28,30]);
function tvIsIcanEventF96(evento) {
  return tvUpper(evento?.tipo)==='ICAN' || String(evento?.riel||'').trim().toLowerCase()==='ican';
}
function tvLessonRielF97(evento) {
  return tvIsIcanEventF96(evento) ? 'ican' : 'curso';
}
function tvLessonKeyF97(evento) {
  return `${tvLessonRielF97(evento)}:${Number(evento?.leccion||0)}`;
}
function tvLessonSortF97(a,b) {
  const da=String(a?.fecha||''), db=String(b?.fecha||'');
  if(da!==db) return da.localeCompare(db);
  const ma=tvMinutes(a?.hora_inicio||a?.hora_i||'') ?? (tvLessonRielF97(a)==='ican'?23*60:0);
  const mb=tvMinutes(b?.hora_inicio||b?.hora_i||'') ?? (tvLessonRielF97(b)==='ican'?23*60:0);
  if(ma!==mb) return ma-mb;
  if(tvLessonRielF97(a)!==tvLessonRielF97(b)) return tvLessonRielF97(a)==='curso'?-1:1;
  return Number(a?.leccion||0)-Number(b?.leccion||0);
}
function tvIsProgressCheckF96(evento) {
  return !tvIsIcanEventF96(evento) && (evento?.progress_check===true || String(evento?.progress_check||'').toUpperCase()==='TRUE');
}
function tvAgendaEventLabelF96(evento, largo=false) {
  const n=Number(evento?.leccion||0);
  if(tvIsIcanEventF96(evento)) return largo?`Club I CAN · Sesión ${String(n).padStart(2,'0')}`:`I CAN ${String(n).padStart(2,'0')}`;
  if(tvIsProgressCheckF96(evento)) return largo?`Progress Check · Lección ${String(n).padStart(2,'0')}`:'Progress Check';
  return tvEvalLabelF86(evento?.tipo,n,largo)||(largo?`Lección ${String(n).padStart(2,'0')}`:`Lec ${String(n).padStart(2,'0')}`);
}
function tvAgendaToneF96(evento, meta) {
  if(tvIsIcanEventF96(evento)) return {dark:'#6A3D91',light:'#F2EAF8'};
  if(tvIsProgressCheckF96(evento)) return {dark:'#A45D00',light:'#FFF1D8'};
  const tipo=tvUpper(evento?.tipo);
  if(tipo==='EVAL_ORAL'||tipo==='EVAL_ESCRITO') return {dark:'#A32424',light:'#FDE8E8'};
  return nivelPal(tvNivelId(meta));
}
function tvDateLabelF82(iso) {
  if (!iso) return '—';
  const d=new Date(String(iso).slice(0,10)+'T00:00:00');
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('es-CR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
}
function TeacherMaterialButtonF82({ lesson, nivel }) {
  const [state,setState]=React.useState({loading:true,data:null});
  React.useEffect(()=>{
    let live=true; setState({loading:true,data:null});
    const fn=window.fetchMaterialLeccion;
    if(typeof fn!=='function'){ setState({loading:false,data:null}); return ()=>{live=false;}; }
    fn({nivel,leccion:lesson?.leccion,riel:String(lesson?.tipo||'').toUpperCase()==='ICAN'?'ican':'curso',rol:'teacher'})
      .then(d=>{if(live)setState({loading:false,data:d});}).catch(()=>{if(live)setState({loading:false,data:null});});
    return()=>{live=false;};
  },[lesson?.leccion,lesson?.tipo,nivel]);
  const d=state.data;
  const url=d?.pdf_url || (d?.pdf_id?`https://drive.google.com/file/d/${d.pdf_id}/view`:'');
  return <button type="button" disabled={state.loading||!url} onClick={()=>url&&window.open(url,'_blank','noopener')} className="btn btn-primary" style={{ minWidth:150, opacity:(state.loading||!url)?0.55:1 }}>
    {state.loading?'Verificando material…':url?'Ver material PDF':'Material no disponible'}
  </button>;
}
function LessonDrawerF82({ lesson, meta, roster, asistenciaDetalle, comentariosDetalle, onClose, onChanged, onNavigate, activeSession, activeSessionReady=true, activeSessionError=false }) {
  const [detalle,setDetalle]=React.useState(null), [loading,setLoading]=React.useState(true), [sesion,setSesion]=React.useState(null);
  const [sessionCheck,setSessionCheck]=React.useState('loading');
  const [oralSummary,setOralSummary]=React.useState(null), [busy,setBusy]=React.useState(''), [attendanceOpen,setAttendanceOpen]=React.useState(false), [suspOpen,setSuspOpen]=React.useState(false);
  const nivel=tvNivelId(meta), code=tvGroupCode(meta), today=tvLocalIsoF88();
  const rielLeccion=tvIsIcanEventF96(lesson)?'ican':'curso';
  const railPermissions=meta?.permisos_riel||{};
  const canOperateRail=railPermissions[rielLeccion] !== false;
  const tipoLeccion=tvUpper(lesson?.tipo), closed=tvUpper(lesson?.estado)==='CERRADA', esOral=rielLeccion==='curso'&&tipoLeccion==='EVAL_ORAL';
  const esEscrito=rielLeccion==='curso'&&(tipoLeccion==='EVAL_ESCRITO'||[18,32].includes(Number(lesson?.leccion||0)));
  const esExamen=rielLeccion==='curso'&&(esOral||esEscrito||[9,17,18,25,31,32].includes(Number(lesson?.leccion||0)));
  const estadoSesion=tvUpper(sesion?.ESTADO||sesion?.estado);
  const globalEstado=tvUpper(activeSession?.ESTADO||activeSession?.estado);
  const globalOpen=globalEstado==='ABIERTA';
  const globalCode=String(activeSession?.COD_GRUPO||activeSession?.cod_grupo||'');
  const globalNivel=tvUpper(activeSession?.NIVEL||activeSession?.nivel);
  const globalLec=Number(activeSession?.LECCION||activeSession?.leccion||0);
  const globalRiel=String(activeSession?.RIEL||activeSession?.riel||'curso').trim().toLowerCase()==='ican'?'ican':'curso';
  const sameGlobal=globalOpen&&globalCode===String(code)&&globalNivel===tvUpper(nivel)&&globalLec===Number(lesson?.leccion||0)&&globalRiel===rielLeccion;
  const otherGlobal=globalOpen&&!sameGlobal;
  const abierta=estadoSesion==='ABIERTA'||sameGlobal, sesionCerrada=estadoSesion==='CERRADA';
  const oralTotal=Number(oralSummary?.total||(roster||[]).length||0);
  const oralListoParaCerrar=esOral && oralTotal>0 && Number(oralSummary?.cerradas||0)>=oralTotal;
  const oralContext={grupo:code,nivel,leccion:Number(lesson?.leccion||0),fecha:String(lesson?.fecha||'').slice(0,10)};

  const load=React.useCallback(()=>{
    if(!lesson)return; setLoading(true); setSessionCheck('loading');
    const calls=[
      postTeacher('getLeccionDetalle',{id_leccion:tvLessonIdF82(nivel,lesson.leccion),nivel,leccion:lesson.leccion,riel:rielLeccion},30000),
      postTeacher('getDocenteSesionClaseF77',{cod_grupo:code,nivel,leccion:lesson.leccion,riel:rielLeccion},30000),
      esOral?postTeacher('oralGetResumenGrupo',{cod_grupo:code,nivel,leccion:lesson.leccion},30000):Promise.resolve(null),
    ];
    Promise.allSettled(calls).then(rs=>{
      const a=rs[0].status==='fulfilled'?rs[0].value:null, b=rs[1].status==='fulfilled'?rs[1].value:null, c=rs[2].status==='fulfilled'?rs[2].value:null;
      setDetalle(a?.ok?a.leccion:null);
      if(b?.ok){ setSesion(b.sesion||null); setSessionCheck('ok'); }
      else { setSesion(null); setSessionCheck('error'); }
      setOralSummary(c?.ok?c:null);
    }).finally(()=>setLoading(false));
  },[lesson?.leccion,lesson?.fecha,lesson?.tipo,code,nivel,esOral,rielLeccion]);
  React.useEffect(()=>{load();},[load]);
  React.useEffect(()=>{ const k=e=>{if(e.key==='Escape')onClose();}; window.addEventListener('keydown',k); return()=>window.removeEventListener('keydown',k); },[onClose]);
  React.useEffect(()=>{ const h=()=>load(); window.addEventListener('an:oral-updated',h); return()=>window.removeEventListener('an:oral-updated',h); },[load]);

  const iniciar=async()=>{
    if(!activeSessionReady||activeSessionError){alert('No se pudo verificar la sesión docente global. Reintentá antes de iniciar otra clase.');return;}
    if(otherGlobal){alert(`Ya existe una sesión activa en la lección ${String(globalLec).padStart(2,'0')}. Cerrala antes de iniciar otra clase.`);return;}
    const zoom=prompt('Pegá el link de Zoom para iniciar la clase:'); if(!zoom)return;
    setBusy('start');
    try{
      const r=await postTeacher('docenteIniciarSesionClaseF77',{cod_grupo:code,nivel,leccion:lesson.leccion,riel:rielLeccion,zoom_link:zoom});
      if(!r?.ok)throw new Error(r?.mensaje||r?.error||'No se pudo iniciar la clase.');
      setSesion(r.sesion||r); setSessionCheck('ok'); window.dispatchEvent(new CustomEvent('an:teacher-session-changed')); onChanged&&onChanged();
    }catch(e){alert(e.message||String(e));}finally{setBusy('');}
  };
  const abrirExamen=()=>{ if(onNavigate) onNavigate('examenes',{oral:oralContext}); };
  const abrirCierre=()=>setAttendanceOpen(true);
  const lessonKey=tvLessonKeyF97(lesson);
  const detByStudent=asistenciaDetalle?.[lessonKey]||asistenciaDetalle?.[String(lesson?.leccion)]||{}, comByStudent=comentariosDetalle?.[lessonKey]||comentariosDetalle?.[String(lesson?.leccion)]||{};
  const workflow=()=>{
    if(!canOperateRail) return <div style={{gridColumn:'1/-1',padding:'12px 14px',border:'1px solid #D9C7EA',borderRadius:10,background:'#FBF7FE',color:'#6A3D91',fontWeight:800,textAlign:'center'}}>Esta actividad pertenece al docente asignado a {rielLeccion==='ican'?'Club I CAN':'Inglés Conversacional'}. Podés consultar el registro, pero no iniciarla ni cerrarla.</div>;
    if(!activeSessionReady) return <div style={{gridColumn:'1/-1',padding:'12px 14px',border:'1px solid var(--line)',borderRadius:10,background:'#F8FAFE',color:'var(--ink-3)',fontWeight:800,textAlign:'center'}}>VERIFICANDO SI EXISTE OTRA SESIÓN ACTIVA…</div>;
    if(activeSessionError) return <div style={{gridColumn:'1/-1',padding:'12px 14px',border:'1px solid #F0B9B9',borderRadius:10,background:'#FDECEA',color:'#8B1F1F',fontSize:12,fontWeight:800,lineHeight:1.5}}>No se pudo verificar la sesión docente global. No se muestran acciones para evitar abrir dos clases al mismo tiempo.</div>;
    if(loading||sessionCheck==='loading') return <div style={{gridColumn:'1/-1',padding:'12px 14px',border:'1px solid var(--line)',borderRadius:10,background:'#F8FAFE',color:'var(--ink-3)',fontWeight:800,textAlign:'center'}}>VERIFICANDO ESTADO DE LA CLASE…</div>;
    if(sessionCheck==='error') return <div style={{gridColumn:'1/-1',padding:'12px 14px',border:'1px solid #F0B9B9',borderRadius:10,background:'#FDECEA',display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',flexWrap:'wrap'}}><span style={{fontSize:12,color:'#8B1F1F',fontWeight:750}}>No se pudo verificar si la clase está abierta o cerrada. No hay acciones disponibles por seguridad.</span><button className="btn btn-ghost" type="button" onClick={load}>REINTENTAR</button></div>;
    if(closed||sesionCerrada) return <button className="btn btn-primary" disabled style={{gridColumn:'1/-1',opacity:.7}}>CLASE CERRADA</button>;
    if(otherGlobal) return <div style={{gridColumn:'1/-1',padding:'12px 14px',border:'1px solid #F0B9B9',borderRadius:10,background:'#FDECEA',color:'#8B1F1F',fontSize:12,fontWeight:800,lineHeight:1.5}}>TENÉS OTRA SESIÓN ACTIVA · Lección {String(globalLec).padStart(2,'0')}. Debés cerrarla antes de iniciar esta clase.</div>;
    if(!abierta) return <button className="btn btn-primary" disabled={!!busy} onClick={iniciar} style={{gridColumn:'1/-1'}}>{busy==='start'?'PREPARANDO MENSAJE A ESTUDIANTES…':'INICIAR CLASE'}</button>;
    const bloqueadoPorOral=esOral&&!oralListoParaCerrar;
    return <button className="btn btn-primary" disabled={bloqueadoPorOral} title={bloqueadoPorOral?'Completá primero el examen oral desde el botón Exámenes.':''} onClick={abrirCierre} style={{gridColumn:'1/-1',opacity:bloqueadoPorOral?.58:1}}>CERRAR CLASE</button>;
  };
  return <>
    <div style={{position:'fixed',inset:0,zIndex:1850,background:'rgba(5,18,38,.45)',display:'flex',justifyContent:'flex-end'}} onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
      <aside style={{width:'min(520px,96vw)',height:'100%',background:'#FFF',boxShadow:'-20px 0 55px rgba(0,0,0,.22)',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'18px 20px',borderBottom:'1px solid var(--line)',display:'flex',justifyContent:'space-between',gap:12}}>
          <div><div style={{...vdLabelStyle,marginBottom:4}}>Detalle de clase</div><div style={{fontFamily:'var(--f-serif)',fontSize:24,fontWeight:700}}>{tvAgendaEventLabelF96(lesson,true)}</div><div style={{fontSize:12,color:'var(--ink-2)',fontWeight:700,marginTop:5}}>{tvGrupoLabel(meta).full}</div><div style={{fontSize:12,color:'var(--ink-3)',marginTop:3}}>Lección {String(lesson?.leccion||'').padStart(2,'0')} · {tvDateLabelF82(lesson?.fecha)}{lesson?.turno?` · ${lesson.turno}`:''} · {tvLessonHoraLabel(lesson, meta)}</div></div>
          <button type="button" onClick={onClose} style={{border:0,background:'transparent',fontSize:28,cursor:'pointer',color:'var(--ink-3)'}}>×</button>
        </div>
        <div style={{padding:20,overflowY:'auto',flex:1}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:9,marginBottom:16}}>
            {workflow()}
            {!loading&&sessionCheck==='ok'&&<>
              {abierta&&esExamen&&<button className="btn btn-primary" type="button" onClick={abrirExamen} style={{gridColumn:'1/-1',background:'#16834A',borderColor:'#16834A'}}>EXÁMENES</button>}
              <TeacherMaterialButtonF82 lesson={lesson} nivel={nivel}/>
              {!closed&&String(lesson?.fecha||'')>=today&&!abierta&&!otherGlobal&&<button className="btn btn-ghost" onClick={()=>setSuspOpen(true)}>SOLICITAR SUSPENSIÓN O REPROGRAMACIÓN</button>}
            </>}
          </div>
          {esOral&&abierta&&<div style={{padding:'10px 12px',borderRadius:10,background:oralListoParaCerrar?'#E8F5E9':'#EAF8EF',color:'#166534',fontSize:12,fontWeight:750,marginBottom:14}}>Examen oral: {oralSummary?.cerradas||0} de {oralSummary?.total??(roster||[]).length} evaluaciones cerradas.{!oralListoParaCerrar?' Aplicá el examen antes de cerrar la clase.':''}</div>}
          {sesionCerrada&&<div style={{padding:'10px 12px',borderRadius:10,background:'#E8F5E9',color:'#166534',fontWeight:800,marginBottom:14}}>✓ Clase cerrada</div>}
          {loading?<LoadingState variant="small" title="Cargando detalle…"/>:<>
            <div style={{padding:'16px 17px',border:'1px solid var(--line)',borderRadius:'var(--r-lg)',background:'#FBF7EF',marginBottom:15}}>
              <div style={{...vdLabelStyle,marginBottom:5}}>{detalle?.unidad||`Nivel ${nivel}`}</div>
              <div style={{fontFamily:'var(--f-serif)',fontSize:21,fontWeight:700}}>{detalle?.titulo||'Clase programada'}</div>
              {detalle?.objetivo&&<div style={{marginTop:12}}><div style={vdLabelStyle}>Objetivo</div><div style={{fontSize:13,lineHeight:1.55,marginTop:4}}>{detalle.objetivo}</div></div>}
              {detalle?.speaking&&<div style={{marginTop:10}}><div style={vdLabelStyle}>Speaking</div><div style={{fontSize:12.5,lineHeight:1.5,marginTop:3}}>{detalle.speaking}</div></div>}
              {detalle?.grammar&&<div style={{marginTop:10}}><div style={vdLabelStyle}>Grammar</div><div style={{fontSize:12.5,lineHeight:1.5,marginTop:3}}>{detalle.grammar}</div></div>}
            </div>
            <div style={{...vdLabelStyle,marginBottom:8}}>Asistencia registrada</div>
            <div style={{display:'grid',gap:7}}>{(roster||[]).map(s=>{const d=detByStudent[s.code],c=d?comByStudent[s.code]:'';return <div key={s.code} style={{display:'grid',gridTemplateColumns:'1fr auto',gap:10,padding:'9px 11px',border:'1px solid var(--line)',borderRadius:9}}><div><strong style={{fontSize:12}}>{s.name}</strong>{c&&<div style={{fontSize:10,color:'var(--ink-3)',marginTop:3}}>💬 {c}</div>}</div><span style={{fontSize:10,fontWeight:900,color:!d?'var(--ink-3)':d.presente===false?'#B3261E':'#166534'}}>{!d?'Pendiente':d.presente===false?'Ausente':'Presente'}</span></div>;})}</div>
          </>}
        </div>
      </aside>
    </div>
    {attendanceOpen&&typeof ModalCierreLeccion==='function'&&<ModalCierreLeccion lec={{cod_grupo:code,nivel,leccion:lesson.leccion,fecha:lesson.fecha,turno:tvLessonHoraLabel(lesson,meta),hora_inicio:rielLeccion==='ican'?(meta?.hora_i_ican||meta?.hora_inicio_ican||lesson.hora_inicio||''):(lesson.hora_inicio||''),hora_fin:rielLeccion==='ican'?(meta?.hora_f_ican||meta?.hora_fin_ican||lesson.hora_fin||''):(lesson.hora_fin||''),tipo:lesson.tipo,riel:rielLeccion,programa:meta?.programa||'',progress_check:lesson?.progress_check===true,horario_label:tvGrupoLabel(meta).full,estado:lesson.estado}} docenteNombre={meta?.docente||''} registradoPor={meta?.docente||''} submitLabel="Guardar asistencia y cerrar clase" submitFn={(body)=>postTeacher('docenteCerrarClaseConAsistenciaF87',body,45000)} onClose={()=>setAttendanceOpen(false)} onSuccess={(res)=>{setAttendanceOpen(false);setSesion(res?.sesion||{ESTADO:'CERRADA'});setSessionCheck('ok');window.dispatchEvent(new CustomEvent('an:teacher-session-changed'));onChanged&&onChanged();}} onSolicitudEnviada={()=>{setAttendanceOpen(false);onChanged&&onChanged();}}/>}
    {suspOpen&&typeof ModalSolicitarSuspension==='function'&&<ModalSolicitarSuspension lec={{cod_grupo:code,nivel,leccion:lesson.leccion,fecha:lesson.fecha,turno:lesson.turno,tipo:lesson.tipo,estado:lesson.estado,hora_inicio:lesson.hora_inicio,hora_fin:lesson.hora_fin,riel:rielLeccion}} solicitante={meta?.docente||''} onCerrar={()=>setSuspOpen(false)} onEnviada={()=>{setSuspOpen(false);onChanged&&onChanged();}}/>}
  </>;
}

function NotaDetalleDrawerF79({ estudiante, nota, onClose }) {
  if (!estudiante) return null;
  const defs = [
    ['ORAL_1','Lección 09 · Oral 1'], ['ORAL_2','Lección 17 · Oral 2'],
    ['ESCRITO_1','Lección 18 · Escrito 1'], ['ORAL_3','Lección 25 · Oral 3'],
    ['ORAL_4','Lección 31 · Oral 4'], ['ESCRITO_2','Lección 32 · Escrito 2'],
    ['SOCIAL','Social Skill'],
    ...(tvUpper(nota?.programa)==='INA' ? [['ICAN','Club I CAN · asistencia']] : []),
  ];
  return <div style={{ position:'fixed', inset:0, zIndex:1900, background:'rgba(7,22,45,.48)', display:'flex', justifyContent:'flex-end' }} onMouseDown={e=>{ if(e.target===e.currentTarget) onClose(); }}>
    <aside style={{ width:'min(440px, 94vw)', height:'100%', background:'#FFF', boxShadow:'-18px 0 50px rgba(0,0,0,.2)', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'22px 22px 18px', borderBottom:'1px solid var(--line)', display:'flex', justifyContent:'space-between', gap:12 }}>
        <div>
          <div style={{ ...vdLabelStyle, marginBottom:5 }}>Historial académico</div>
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
                <div style={{ fontSize:10, color:'var(--ink-3)' }}>de {c?.max ?? (key==='ICAN'?20:key==='SOCIAL'?10:15)}</div>
                {key==='ICAN'&&<div style={{fontSize:9,color:'#6A3D91',fontWeight:800,marginTop:2}}>{Number(c?.asistidas||0)}/{Number(c?.requeridas||16)} sesiones · {Number(c?.pct_asistencia||0)}%</div>}
              </div>
            </div>;
          })}
        </div>
      </div>
    </aside>
  </div>;
}

function tvSearchNormalizeF98(value) {
  return String(value == null ? '' : value)
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
function tvTodayIsoCostaRicaF98() {
  try {
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Costa_Rica',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const map={};parts.forEach(p=>{if(p.type!=='literal')map[p.type]=p.value;});
    return `${map.year}-${map.month}-${map.day}`;
  } catch (_) {
    return new Date(Date.now()-6*60*60*1000).toISOString().slice(0,10);
  }
}

function RosterAcademicoF79({ roster, lecciones, asistenciaDetalle, asistenciaGrupo, comentariosDetalle, notasGrupo, meta, programa, docenteNombre, leccionHoy, onSaved, onNavigate, activeSession, activeSessionReady=true, activeSessionError=false }) {
  const todayIso=tvTodayIsoCostaRicaF98();
  const allLessons=React.useMemo(()=>(lecciones||[])
    .filter(l=>tvUpper(l.tipo)!=='FERIADO')
    .slice()
    .sort(tvLessonSortF97)
    .slice(0,64),[lecciones]);
  const courseCount=React.useMemo(()=>allLessons.filter(l=>!tvIsIcanEventF96(l)).length,[allLessons]);
  const icanCount=React.useMemo(()=>allLessons.filter(tvIsIcanEventF96).length,[allLessons]);
  const programLabel=tvUpper(meta?.programa||meta?.tipo_programa||meta?.modelo_programa||programa||'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
  const programSaysNoIcan=programLabel.includes('SIN INA')||programLabel.includes('PROGRAMA LIBRE')||programLabel==='LIBRE'||programLabel==='NO INA';
  const programSaysIna=!programSaysNoIcan&&/(^| )INA( |$)/.test(programLabel);
  const iCanApplies=icanCount>0||programSaysIna;
  const groupCode=tvGroupCode(meta);
  const viewStorageKey=`an_teacher_attendance_view:${groupCode||'default'}`;
  const [viewMode,setViewMode]=React.useState('total');
  const [studentSearch,setStudentSearch]=React.useState('');
  const filteredRoster=React.useMemo(()=>{
    const terms=tvSearchNormalizeF98(studentSearch).split(' ').filter(Boolean);
    if(!terms.length)return roster||[];
    return (roster||[]).filter(r=>{
      const haystack=tvSearchNormalizeF98([r?.name,r?.nombre,r?.code,r?.codigo,r?.cedula,r?.CEDULA,r?.NUM_CEDULA].filter(Boolean).join(' '));
      return terms.every(term=>haystack.includes(term));
    });
  },[roster,studentSearch]);
  React.useEffect(()=>setStudentSearch(''),[groupCode]);
  React.useEffect(()=>{
    let saved='total';
    try{saved=sessionStorage.getItem(viewStorageKey)||'total';}catch(_){}
    if(!['total','curso','ican'].includes(saved))saved='total';
    if(saved==='ican'&&!iCanApplies)saved='total';
    setViewMode(saved);
  },[viewStorageKey,iCanApplies]);
  const selectView=React.useCallback((mode)=>{
    const clean=['total','curso','ican'].includes(mode)?mode:'total';
    if(clean==='ican'&&!iCanApplies)return;
    setViewMode(clean);
    try{sessionStorage.setItem(viewStorageKey,clean);}catch(_){}
  },[iCanApplies,viewStorageKey]);
  const lessons=React.useMemo(()=>{
    if(viewMode==='curso')return allLessons.filter(l=>!tvIsIcanEventF96(l));
    if(viewMode==='ican')return allLessons.filter(tvIsIcanEventF96);
    return allLessons;
  },[allLessons,viewMode]);
  const pickNextLesson=React.useCallback((rows)=>{
    const upcoming=(rows||[]).find(l=>String(l.fecha||'')>=todayIso&&tvUpper(l.estado)!=='CERRADA');
    return upcoming||(rows||[]).find(l=>tvUpper(l.estado)!=='CERRADA')||(rows||[])[(rows||[]).length-1]||null;
  },[todayIso]);
  const nextCourseLesson=React.useMemo(()=>pickNextLesson(allLessons.filter(l=>!tvIsIcanEventF96(l))),[allLessons,pickNextLesson]);
  const nextIcanLesson=React.useMemo(()=>pickNextLesson(allLessons.filter(tvIsIcanEventF96)),[allLessons,pickNextLesson]);
  const nextLesson=React.useMemo(()=>pickNextLesson(lessons),[lessons,pickNextLesson]);
  const nextKey=nextLesson?`${tvLessonKeyF97(nextLesson)}|${String(nextLesson.fecha||'')}`:'';
  const isRailNext=React.useCallback((lesson)=>{
    const target=tvIsIcanEventF96(lesson)?nextIcanLesson:nextCourseLesson;
    return !!target&&tvLessonKeyF97(lesson)===tvLessonKeyF97(target)&&String(lesson.fecha||'')===String(target.fecha||'')&&tvUpper(lesson.estado)!=='CERRADA';
  },[nextCourseLesson,nextIcanLesson]);
  const [selectedStudent,setSelectedStudent]=React.useState(null),[selectedLesson,setSelectedLesson]=React.useState(null);
  const calendarRef=React.useRef(null), topScrollRef=React.useRef(null), positionedRef=React.useRef('');
  const COL_W=94, LEFT_W=286, RIGHT_W=154, HEADER_H=104, ROW_H=68;

  React.useEffect(()=>{
    const box=calendarRef.current;
    if(!box||!lessons.length||!nextLesson)return;
    const key=`${tvGroupCode(meta)}|${viewMode}|${nextKey}|${lessons.length}`;
    if(positionedRef.current===key)return;
    positionedRef.current=key;
    const idx=lessons.findIndex(l=>tvLessonKeyF97(l)===tvLessonKeyF97(nextLesson)&&String(l.fecha||'')===String(nextLesson.fecha||''));
    requestAnimationFrame(()=>{
      const penultimateX=Math.max(0,box.clientWidth-(2*COL_W));
      const actualX=Math.max(0,idx)*COL_W;
      const targetLeft=Math.max(0,actualX-penultimateX);
      box.scrollLeft=targetLeft;
      if(topScrollRef.current)topScrollRef.current.scrollLeft=targetLeft;
    });
  },[tvGroupCode(meta),viewMode,nextKey,lessons.length]);

  const syncHorizontalScroll=(source,targetRef)=>{
    const target=targetRef.current;
    if(target&&Math.abs(target.scrollLeft-source.currentTarget.scrollLeft)>1)target.scrollLeft=source.currentTarget.scrollLeft;
  };
  const scrollBy=d=>{
    const box=calendarRef.current;
    if(!box)return;
    box.scrollBy({left:d,behavior:'smooth'});
  };
  const activeCode=String(activeSession?.COD_GRUPO||activeSession?.cod_grupo||''), activeLec=Number(activeSession?.LECCION||activeSession?.leccion||0), activeRiel=String(activeSession?.RIEL||activeSession?.riel||'curso').trim().toLowerCase()==='ican'?'ican':'curso';
  const tableBase={border:0,borderRadius:0,boxShadow:'none',margin:0,tableLayout:'fixed',borderCollapse:'separate',borderSpacing:0,background:'#fff'};
  const headCell={height:HEADER_H,minHeight:HEADER_H,maxHeight:HEADER_H,verticalAlign:'middle',borderBottom:'1px solid var(--line)',background:'var(--surface-2)',padding:'9px 10px'};
  const bodyCell={height:ROW_H,minHeight:ROW_H,maxHeight:ROW_H,verticalAlign:'middle',borderBottom:'1px solid var(--line)',background:'#fff',padding:'7px 10px'};

  return <>
    <div className="card teacher-roster-fixed" style={{padding:0,overflow:'hidden',width:'100%',maxWidth:'100%',minWidth:0}}>
      <div style={{padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',borderBottom:'1px solid var(--line)'}}>
        <div style={{minWidth:240,flex:'1 1 320px'}}>
          <div className="card-title">Estudiantes · asistencia y notas</div>
          <div style={{fontSize:10.5,color:'var(--ink-3)',marginTop:3}}>{viewMode==='total'?'Vista TOTAL: lecciones e I CAN mezclados por fecha y hora.':viewMode==='curso'?'Vista SOLO LECCIONES: seguimiento de las 32 lecciones del curso.':'Vista SOLO I CAN: seguimiento independiente de las 16 sesiones complementarias.'}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:8,flexWrap:'wrap',flex:'1 1 420px'}}>
          <div role="tablist" aria-label="Filtrar asistencia" style={{display:'inline-flex',gap:5,padding:4,border:'1px solid var(--line)',borderRadius:12,background:'#F7F9FC',flexWrap:'wrap'}}>
            {[
              {id:'total',label:'TOTAL',count:allLessons.length},
              {id:'curso',label:'SOLO LECCIONES',count:courseCount},
              ...(iCanApplies?[{id:'ican',label:'SOLO I CAN',count:icanCount}]:[]),
            ].map(opt=>{
              const active=viewMode===opt.id, purple=opt.id==='ican';
              return <button key={opt.id} type="button" role="tab" aria-selected={active} onClick={()=>selectView(opt.id)} style={{border:'1px solid '+(active?(purple?'#6A3D91':'var(--an-navy)'):'transparent'),background:active?(purple?'#6A3D91':'var(--an-navy)'):'#FFF',color:active?'#FFF':purple?'#6A3D91':'var(--ink-2)',borderRadius:9,padding:'7px 10px',fontSize:9.5,fontWeight:900,letterSpacing:'.02em',cursor:'pointer',whiteSpace:'nowrap'}}>{opt.label} <span style={{opacity:.78}}>({opt.count})</span></button>;
            })}
          </div>
          {!iCanApplies&&<span title="No existen sesiones I CAN configuradas para este grupo y nivel" style={{padding:'7px 9px',borderRadius:9,background:'#F1F3F6',color:'var(--ink-3)',fontSize:9,fontWeight:850,whiteSpace:'nowrap'}}>I CAN · NO APLICA</span>}
          <div style={{display:'flex',gap:7}}>
            <button type="button" onClick={()=>scrollBy(-6*COL_W)} className="btn btn-ghost" style={{width:38,padding:8}} aria-label="Desplazar columnas a la izquierda">←</button>
            <button type="button" onClick={()=>scrollBy(6*COL_W)} className="btn btn-ghost" style={{width:38,padding:8}} aria-label="Desplazar columnas a la derecha">→</button>
          </div>
        </div>
      </div>

      <div className="teacher-roster-top-scroll-grid" style={{display:'grid',gridTemplateColumns:`${LEFT_W}px minmax(0,1fr) ${RIGHT_W}px`,width:'100%',minWidth:0,background:'#F7F9FC',borderBottom:'1px solid var(--line)'}}>
        <div style={{borderRight:'1px solid var(--line)'}} />
        <div ref={topScrollRef} className="teacher-roster-top-scroll" onScroll={e=>syncHorizontalScroll(e,calendarRef)} aria-label="Desplazamiento horizontal de lecciones">
          <div style={{width:Math.max(COL_W,lessons.length*COL_W),height:1}} />
        </div>
        <div style={{borderLeft:'1px solid var(--line)'}} />
      </div>

      <div className="teacher-roster-fixed-grid" style={{display:'grid',gridTemplateColumns:`${LEFT_W}px minmax(0,1fr) ${RIGHT_W}px`,width:'100%',minWidth:0,background:'#fff'}}>
        <div className="teacher-roster-identity" style={{zIndex:3,borderRight:'1px solid var(--line)',boxShadow:'8px 0 14px -14px rgba(0,0,0,.55)'}}>
          <table className="teacher-roster-fixed-table" style={{...tableBase,width:LEFT_W}}>
            <thead><tr><th style={{...headCell,width:LEFT_W,minWidth:LEFT_W,maxWidth:LEFT_W,textAlign:'left',padding:'9px 12px'}}>
              <label htmlFor={`teacher-student-search-${groupCode||'grupo'}`} style={{display:'block',fontSize:10.5,fontWeight:900,color:'var(--ink-2)',marginBottom:6}}>Buscar estudiante en lista</label>
              <input id={`teacher-student-search-${groupCode||'grupo'}`} type="search" value={studentSearch} onChange={e=>setStudentSearch(e.target.value)} placeholder="Nombre, apellido, cédula o código" aria-label="Buscar estudiante por nombre, apellido, cédula o código" style={{width:'100%',height:34,border:'1.5px solid #B7C3D4',borderRadius:8,padding:'0 10px',fontFamily:'inherit',fontSize:10.5,fontWeight:650,color:'var(--ink)',background:'#FFF',outline:'none'}} />
              <div style={{fontSize:8.5,color:'var(--ink-3)',marginTop:4,fontWeight:750}}>{filteredRoster.length} de {(roster||[]).length} estudiantes</div>
            </th></tr></thead>
            <tbody>{filteredRoster.length?filteredRoster.map((r,i)=>{const att=asistenciaGrupo?.[r.code];return <tr key={r.code||i}>
              <td title={r.cedula?`Cédula ${r.cedula}`:''} style={{...bodyCell,width:LEFT_W,minWidth:LEFT_W,maxWidth:LEFT_W}}>
                <div style={{display:'flex',gap:9,alignItems:'center'}}>
                  <div style={{width:33,height:33,flex:'0 0 33px',borderRadius:'50%',background:'var(--an-navy)',color:'#FFF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800}}>{(r.name||'').split(' ').slice(0,2).map(w=>w[0]).join('')}</div>
                  <div style={{minWidth:0}}>
                    <div style={{fontWeight:750,lineHeight:1.2,fontSize:12,whiteSpace:'normal'}}>{r.name}</div>
                    <div style={{fontSize:9.5,color:'var(--ink-3)',marginTop:3}}>Código {r.code} · Asistencia {att?.pct!=null?`${att.pct}%`:'—'}{notasGrupo?.[r.code]?.componentes?.ICAN?` · I CAN ${Number(notasGrupo[r.code].componentes.ICAN.puntos||0)}/20`:''}</div>
                  </div>
                </div>
              </td>
            </tr>;}) : <tr><td style={{...bodyCell,width:LEFT_W,minWidth:LEFT_W,maxWidth:LEFT_W,height:ROW_H,color:'var(--ink-3)',fontSize:10.5,fontWeight:750,textAlign:'center'}}>No se encontraron estudiantes.</td></tr>}</tbody>
          </table>
        </div>

        <div ref={calendarRef} className="teacher-roster-calendar-scroll" onScroll={e=>syncHorizontalScroll(e,topScrollRef)} style={{overflowX:'auto',overflowY:'hidden',minWidth:0,scrollbarGutter:'stable',WebkitOverflowScrolling:'touch'}}>
          {!lessons.length?<div style={{minHeight:HEADER_H+(Math.max(1,roster.length)*ROW_H),display:'flex',alignItems:'center',justifyContent:'center',padding:28,textAlign:'center',background:viewMode==='ican'?'#FBF7FE':'#FFF',color:viewMode==='ican'?'#6A3D91':'var(--ink-3)',fontWeight:850,fontSize:12,borderBottom:'1px solid var(--line)'}}>{viewMode==='ican'?'Todavía no hay sesiones I CAN programadas para este grupo.':'No hay actividades programadas en esta vista.'}</div>:<table className="teacher-roster-fixed-table teacher-roster-calendar-table" style={{...tableBase,width:Math.max(COL_W,lessons.length*COL_W),minWidth:Math.max(COL_W,lessons.length*COL_W)}}>
            <thead><tr>{lessons.map(l=>{
              const isNext=isRailNext(l);
              const isToday=String(l.fecha||'')===todayIso;
              const isIcan=tvIsIcanEventF96(l), isPC=tvIsProgressCheckF96(l);
              const isActive=activeCode===tvGroupCode(meta)&&activeLec===Number(l.leccion)&&activeRiel===tvLessonRielF97(l);
              const isExam=[9,17,18,25,31,32].includes(Number(l.leccion||0));
              return <th key={`${tvLessonKeyF97(l)}-${l.fecha}`} onClick={()=>setSelectedLesson({...l,__isNextDate:isNext})} style={{...headCell,minWidth:COL_W,width:COL_W,maxWidth:COL_W,textAlign:'center',cursor:'pointer',background:isActive?'#FDECEA':isNext?(isIcan?'#E4D2F2':'#DDEBFF'):isIcan?'#F0E5F8':isPC?'#FFF1D8':'var(--surface-2)',borderTop:isActive?'4px solid #C62828':isNext?(isIcan?'4px solid #57217F':'4px solid #003B7A'):isIcan?'4px solid #6A3D91':isPC?'4px solid #A45D00':'4px solid transparent',boxShadow:isActive?'0 -5px 16px rgba(198,40,40,.16)':isNext?(isIcan?'0 -5px 18px rgba(87,33,127,.28)':'0 -5px 18px rgba(0,59,122,.22)'):'none'}}>
                <div style={{fontSize:10.5,fontWeight:900,color:isIcan?'#57217F':isPC?'#8A5500':undefined}}>{isIcan?`I CAN ${String(l.leccion).padStart(2,'0')}`:isPC?'Progress Check':tvEvalLabelF86(l.tipo,l.leccion)||`Lec ${String(l.leccion).padStart(2,'0')}`}</div>
                {!isIcan&&(tvEvalLabelF86(l.tipo,l.leccion)||isPC)&&<div style={{fontSize:8,color:'var(--ink-3)',marginTop:1}}>Lec {String(l.leccion).padStart(2,'0')}</div>}
                <div style={{fontSize:8.5,color:isNext?(isIcan?'#57217F':'#003B7A'):'var(--ink-3)',marginTop:2,fontWeight:isNext?850:500}}>{String(l.fecha||'').slice(5).split('-').reverse().join('/')}</div>
                {isActive?<div style={{fontSize:7.2,color:'#C62828',fontWeight:900,marginTop:3}}>SESIÓN ACTIVA</div>:isNext?<div style={{display:'inline-block',fontSize:7,color:'#FFF',background:isIcan?'#57217F':'#003B7A',fontWeight:900,marginTop:4,padding:'2px 5px',borderRadius:999,letterSpacing:'.02em'}}>PRÓXIMA LECCIÓN</div>:isToday?<div style={{fontSize:7.5,color:'#C67100',fontWeight:900,marginTop:3}}>HOY</div>:null}
                {isExam&&<div style={{fontSize:7.2,color:'#7A1E2C',fontWeight:900,marginTop:2}}>EXAMEN</div>}
              </th>;
            })}</tr></thead>
            <tbody>{filteredRoster.length?filteredRoster.map((r,i)=><tr key={r.code||i}>{lessons.map(l=>{
              const key=tvLessonKeyF97(l),det=asistenciaDetalle?.[key]?.[r.code]||asistenciaDetalle?.[String(l.leccion)]?.[r.code],comment=det?(comentariosDetalle?.[key]?.[r.code]||comentariosDetalle?.[String(l.leccion)]?.[r.code]||''):'',future=String(l.fecha||'')>todayIso,isNext=isRailNext(l),isIcan=tvIsIcanEventF96(l),isPC=tvIsProgressCheckF96(l);
              return <td key={`${r.code}-${key}-${l.fecha}`} onDoubleClick={()=>setSelectedLesson({...l,__isNextDate:isNext})} style={{...bodyCell,minWidth:COL_W,width:COL_W,maxWidth:COL_W,textAlign:'center',padding:'6px 5px',background:isNext?(isIcan?'#F2E8F9':'#F0F7FF'):isIcan?'#FBF7FE':isPC?'#FFFBF2':'#FFF',borderLeft:isNext?`1px solid ${isIcan?'#A985C7':'#8EB9E8'}`:undefined,borderRight:isNext?`1px solid ${isIcan?'#A985C7':'#8EB9E8'}`:undefined}}>
                {det?<div title={comment||'Sin comentario'}><div style={{display:'inline-flex',minWidth:54,justifyContent:'center',padding:'4px 5px',borderRadius:999,fontSize:9,fontWeight:900,color:det.presente===false?'#B3261E':'#166534',background:det.presente===false?'#FDECEA':'#E8F5E9'}}>{det.presente===false?'Ausente':'Presente'}</div>{comment&&<div style={{fontSize:8.3,color:'var(--ink-3)',marginTop:3}}>💬 comentario</div>}</div>:future?<span style={{color:'var(--ink-3)',fontSize:9}}>Programada</span>:<span style={{color:'var(--ink-3)',fontSize:9}}>Pendiente</span>}
              </td>;
            })}</tr>):<tr><td colSpan={Math.max(1,lessons.length)} style={{...bodyCell,height:ROW_H,textAlign:'center',color:'var(--ink-3)',fontSize:10.5,fontWeight:750}}>Ajustá la búsqueda para volver a mostrar estudiantes.</td></tr>}</tbody>
          </table>}
        </div>

        <div className="teacher-roster-final-note" style={{zIndex:3,borderLeft:'1px solid var(--line)',boxShadow:'-8px 0 14px -14px rgba(0,0,0,.55)'}}>
          <table className="teacher-roster-fixed-table" style={{...tableBase,width:RIGHT_W}}>
            <thead><tr><th style={{...headCell,width:RIGHT_W,minWidth:RIGHT_W,maxWidth:RIGHT_W,textAlign:'left'}}>Nota completa</th></tr></thead>
            <tbody>{filteredRoster.length?filteredRoster.map((r,i)=>{const note=notasGrupo?.[r.code]||r.note;return <tr key={r.code||i}>
              <td style={{...bodyCell,width:RIGHT_W,minWidth:RIGHT_W,maxWidth:RIGHT_W}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:7}}>
                  <div><div style={{fontSize:20,fontWeight:900,color:note?.tiene_notas?'var(--an-navy)':'var(--ink-3)'}}>{note?.tiene_notas?note.nota_total:'—'}</div><div style={{fontSize:8.5,color:'var(--ink-3)'}}>{note?.tiene_notas?'acumulada':'sin notas'}</div></div>
                  <button type="button" className="btn btn-ghost" onClick={()=>setSelectedStudent(r)} style={{padding:'5px 6px',fontSize:8.8,whiteSpace:'nowrap'}}>Ver detalle</button>
                </div>
              </td>
            </tr>;}) : <tr><td style={{...bodyCell,width:RIGHT_W,minWidth:RIGHT_W,maxWidth:RIGHT_W,height:ROW_H}} /></tr>}</tbody>
          </table>
        </div>
      </div>
    </div>
    <NotaDetalleDrawerF79 estudiante={selectedStudent} nota={selectedStudent?(notasGrupo?.[selectedStudent.code]||selectedStudent.note):null} onClose={()=>setSelectedStudent(null)}/>
    {selectedLesson&&<LessonDrawerF82 lesson={selectedLesson} meta={meta} roster={roster} asistenciaDetalle={asistenciaDetalle} comentariosDetalle={comentariosDetalle} onClose={()=>setSelectedLesson(null)} onChanged={()=>{onSaved&&onSaved();}} onNavigate={onNavigate} activeSession={activeSession} activeSessionReady={activeSessionReady} activeSessionError={activeSessionError}/>}  
  </>;
}
function stickyStudentCellF79(head){ return { position:'sticky', left:0, zIndex:head?8:5, background:head?'var(--surface-2)':'#FFF', boxShadow:'8px 0 14px -14px rgba(0,0,0,.55)', borderRight:'1px solid var(--line)' }; }
function stickyNoteCellF79(head){ return { position:'sticky', right:0, zIndex:head?8:5, background:head?'var(--surface-2)':'#FFF', boxShadow:'-8px 0 14px -14px rgba(0,0,0,.55)', borderLeft:'1px solid var(--line)' }; }
function miniAttendBtn(active, present){ return { border:'1px solid '+(active?(present?'#166534':'#B3261E'):'var(--line)'), background:active?(present?'#E8F5E9':'#FDECEA'):'#FFF', color:active?(present?'#166534':'#B3261E'):'var(--ink-2)', borderRadius:7, padding:'6px 7px', fontSize:9.5, fontWeight:850, cursor:'pointer' }; }

function GruposView({ onNavigate, activeSession, activeSessionReady=true, activeSessionError=false }) {
  const { codGrupo, grupos, meta, nivel, nombre, programa, roster, loading, error, asistenciaGrupo, asistenciaDetalle, comentariosDetalle, notasGrupo, resumenGrupo, lecciones, leccionHoy, cambiarGrupo, recargarPanel } = useTeacherSession();
  const lista=grupos||[];
  const sessionCode=String(activeSession?.COD_GRUPO||activeSession?.cod_grupo||'');
  React.useEffect(()=>{if(sessionCode&&sessionCode!==String(codGrupo||'')&&lista.some(g=>tvGroupCode(g)===sessionCode))cambiarGrupo(sessionCode);},[sessionCode,codGrupo,lista.length]);
  if(!lista.length&&!loading)return <div><PageHeader kicker="Gestión académica" title={<>Mis <em>Grupos</em></>} sub="Grupos asignados"/><ErrorState message={error||'No hay grupos En curso asignados.'} onRetry={recargarPanel}/></div>;
  const promedioGrupo=resumenGrupo?.promedioGrupo,promedioAsistencia=resumenGrupo?.promedioAsistencia;
  return <div style={{width:'100%',maxWidth:'100%',minWidth:0,overflow:'hidden'}}>
    <PageHeader kicker="Gestión académica" title={<>Mis <em>Grupos</em></>} sub={<strong style={{fontWeight:900,letterSpacing:'.035em'}}>ELIJE EL GRUPO QUE DESEAS VISUALIZAR.</strong>}/>
    <MisGruposSwitcher grupos={lista} activo={codGrupo} onSelect={cambiarGrupo} activeSession={activeSession}/>
    {error&&!loading&&<div style={{marginBottom:14}}><ErrorState message={error} onRetry={recargarPanel}/></div>}
    {loading?<LoadingState title="Cargando grupo…" subtitle="Uniendo GRUPOS, ESTATUS, cronograma, asistencia y notas oficiales"/>:<>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(210px,100%),1fr))',gap:14,marginBottom:20,width:'100%'}}>
        <StatF77 label="Matriculados" value={resumenGrupo?.totalCA??roster.length} color="var(--an-navy)"/>
        <StatF77 label="Nivel actual" value={tvNivelLabel(meta)} sub={tvGrupoLabel(meta).full} color={nivelPal(nivel).dark}/>
        <StatF77 label="Promedio grupo" value={promedioGrupo!=null?promedioGrupo:'—'} sub={promedioGrupo!=null?`${resumenGrupo?.estudiantesConNotas||0} estudiantes con notas`:'Sin notas oficiales registradas'} color="var(--an-navy)"/>
        <StatF77 label="Asistencia" value={promedioAsistencia!=null?`${promedioAsistencia}%`:'—'} sub={promedioAsistencia!=null?`${resumenGrupo?.cerradas||0} clases cerradas`:'Sin registro aún'} color="var(--warn)"/>
      </div>
      <RosterAcademicoF79 roster={roster} lecciones={lecciones} asistenciaDetalle={asistenciaDetalle} asistenciaGrupo={asistenciaGrupo} comentariosDetalle={comentariosDetalle} notasGrupo={notasGrupo} meta={meta} programa={programa} docenteNombre={nombre} leccionHoy={leccionHoy} onSaved={recargarPanel} onNavigate={onNavigate} activeSession={activeSession} activeSessionReady={activeSessionReady} activeSessionError={activeSessionError}/>
    </>}
  </div>;
}

function TeacherAgendaLegendF96() {
  const items=[
    ['#0B5AA6','#E7F1FB','Lección'],
    ['#A45D00','#FFF1D8','Progress Check'],
    ['#6A3D91','#F2EAF8','Club I CAN'],
    ['#A32424','#FDE8E8','Exámenes'],
  ];
  return <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>{items.map(([c,b,l])=><span key={l} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 8px',borderRadius:999,background:b,color:c,fontSize:9.5,fontWeight:900}}><span style={{width:7,height:7,borderRadius:'50%',background:c}}/>{l}</span>)}</div>;
}
function TeacherAgendaMonthF82({ month, events, onSelect }) {
  const y=month.getFullYear(),m=month.getMonth(),first=(new Date(y,m,1).getDay()+6)%7,days=new Date(y,m+1,0).getDate(),cells=[];
  for(let i=0;i<first;i++)cells.push(null);for(let d=1;d<=days;d++)cells.push(d);
  const names=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return <div className="card" style={{padding:0,overflow:'hidden'}}><div style={{padding:'11px 13px',display:'flex',justifyContent:'space-between',borderBottom:'1px solid var(--line)'}}><strong>{names[m]}</strong><span style={{fontSize:11,color:'var(--ink-3)'}}>{y}</span></div><div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',fontSize:9,fontWeight:900,textAlign:'center',padding:'7px 5px',borderBottom:'1px solid var(--line)'}}>{['L','M','M','J','V','S','D'].map((x,i)=><span key={i}>{x}</span>)}</div><div style={{display:'grid',gridTemplateColumns:'repeat(7,minmax(0,1fr))'}}>{cells.map((d,i)=>{if(!d)return <div key={i} style={{minHeight:78,background:'#F7F3EC',borderRight:'1px solid #FFF',borderBottom:'1px solid #FFF'}}/>;const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,ev=events.filter(x=>String(x.fecha||'')===iso);return <div key={i} style={{minHeight:78,padding:4,background:'#F8F5EF',borderRight:'1px solid #FFF',borderBottom:'1px solid #FFF'}}><div style={{fontSize:9,color:'var(--ink-3)',fontWeight:800}}>{d}</div><div style={{display:'grid',gap:3,marginTop:3}}>{ev.map((e,j)=>{const tone=tvAgendaToneF96(e,e.meta);return <button key={`${e.cod_grupo||''}-${e.riel||''}-${e.leccion||''}-${j}`} onClick={()=>onSelect(e)} title={`${tvAgendaEventLabelF96(e,true)} · ${tvGrupoLabel(e.meta).full}`} style={{border:0,borderLeft:`3px solid ${tone.dark}`,background:tone.light,color:tone.dark,borderRadius:5,padding:'3px 4px',fontSize:8.5,fontWeight:900,textAlign:'left',cursor:'pointer'}}>{tvAgendaEventLabelF96(e)}<br/><span style={{fontSize:7.5}}>Lec {String(e.leccion).padStart(2,'0')} · {tvLessonHoraLabel(e,e.meta)}</span></button>;})}</div></div>;})}</div></div>;
}
function CronogramaDocenteSeguroF82({ onNavigate, activeSession, activeSessionReady=true, activeSessionError=false, onlyIcan=false }) {
  const {grupos,meta,codGrupo,cambiarGrupo,roster,asistenciaDetalle,comentariosDetalle,recargarPanel,loading,error}=useTeacherSession();
  const [events,setEvents]=React.useState([]),[loadingAgenda,setLoadingAgenda]=React.useState(true),[monthCount,setMonthCount]=React.useState(2),[selected,setSelected]=React.useState(null);
  const groupKey=JSON.stringify((grupos||[]).map(g=>[tvGroupCode(g),tvNivelId(g),String(g?.programa||'')]));
  React.useEffect(()=>{
    let live=true;
    const list=grupos||[];
    if(!list.length){setEvents([]);setLoadingAgenda(false);return()=>{live=false;};}
    setLoadingAgenda(true);
    Promise.all(list.map(g=>{
      const payload={cod_grupo:tvGroupCode(g),nivel:tvNivelId(g)};
      return Promise.allSettled([
        postTeacher('getFechasGrupo',{...payload,riel:'curso'},30000),
        postTeacher('getFechasGrupo',{...payload,riel:'ican'},30000),
      ]).then(rs=>({g,curso:rs[0].status==='fulfilled'?rs[0].value:null,ican:rs[1].status==='fulfilled'?rs[1].value:null}));
    })).then(rows=>{
      if(!live)return;
      const out=[];
      rows.forEach(({g,curso,ican})=>{
        const cursoRows=curso?.lecciones||[],icanRows=ican?.lecciones||[];
        const programaIna=tvUpper(g?.programa)==='INA'||icanRows.length>0;
        cursoRows.forEach(l=>out.push({...l,cod_grupo:tvGroupCode(g),nivel:tvNivelId(g),meta:g,progress_check:programaIna&&TV_PROGRESS_CHECK_LESSONS_F96.has(Number(l.leccion||0))}));
        icanRows.forEach(l=>out.push({...l,cod_grupo:tvGroupCode(g),nivel:tvNivelId(g),meta:{...g,programa:'INA'},progress_check:false,riel:'ican',tipo:'ICAN'}));
      });
      const filtered=onlyIcan?out.filter(tvIsIcanEventF96):out;
      filtered.sort((a,b)=>String(a.fecha||'').localeCompare(String(b.fecha||''))||Number(a.leccion)-Number(b.leccion)||String(a.riel||'').localeCompare(String(b.riel||'')));
      setEvents(filtered);
    }).finally(()=>live&&setLoadingAgenda(false));
    return()=>{live=false;};
  },[groupKey,onlyIcan]);
  const base=React.useMemo(()=>{const today=new Date(),future=events.find(e=>String(e.fecha||'')>=today.toISOString().slice(0,10));const d=future?new Date(String(future.fecha).slice(0,10)+'T00:00:00'):today;return new Date(d.getFullYear(),d.getMonth(),1);},[events]);
  const months=Array.from({length:monthCount},(_,i)=>new Date(base.getFullYear(),base.getMonth()+i,1));
  const title=onlyIcan?<>Club <em>I CAN</em></>:<>Cronograma <em>Inglés Conversacional</em></>;
  const kicker=onlyIcan?'Programa INA · sesiones complementarias':'Calendario académico · vista docente';
  const sub=onlyIcan?'Sesiones I CAN reales de tus grupos asignados. Podés abrir cada fecha y operar la clase desde el mismo panel.':'Curso, Progress Check, exámenes y Club I CAN reunidos en una sola agenda.';
  return <div style={{width:'100%',minWidth:0}}><PageHeader kicker={kicker} title={title} sub={sub}/>
    <MisGruposSwitcher grupos={grupos||[]} activo={codGrupo} onSelect={cambiarGrupo} activeSession={activeSession}/>
    <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',marginBottom:12,flexWrap:'wrap'}}><TeacherAgendaLegendF96/><div style={{display:'flex',gap:7,alignItems:'center',flexWrap:'wrap'}}>{[[1,'1 mes'],[2,'2 meses'],[4,'Cuatrimestre']].map(([n,l])=><button key={n} className={monthCount===n?'btn btn-primary':'btn btn-ghost'} onClick={()=>setMonthCount(n)}>{l}</button>)}<button className="btn btn-ghost" onClick={recargarPanel}>Actualizar</button></div></div>
    {(loading||loadingAgenda)?<LoadingState title={onlyIcan?'Cargando Club I CAN…':'Cargando cronograma…'} subtitle="Consultando el calendario real de tus grupos"/>:error?<ErrorState message={error} onRetry={recargarPanel}/>:!events.length?<ErrorState message={onlyIcan?'No hay sesiones de Club I CAN asignadas a tus grupos actuales.':'No hay actividades visibles en el cronograma docente.'} onRetry={recargarPanel}/>:<div style={{display:'grid',gridTemplateColumns:monthCount===1?'1fr':'repeat(2,minmax(0,1fr))',gap:12}}>{months.map((m,i)=><TeacherAgendaMonthF82 key={i} month={m} events={events} onSelect={e=>{if(e.cod_grupo!==codGrupo)cambiarGrupo(e.cod_grupo);setSelected(e);}}/>)}</div>}
    {selected&&<LessonDrawerF82 lesson={selected} meta={selected.meta||meta} roster={selected.cod_grupo===codGrupo?roster:[]} asistenciaDetalle={selected.cod_grupo===codGrupo?asistenciaDetalle:{}} comentariosDetalle={selected.cod_grupo===codGrupo?comentariosDetalle:{}} onClose={()=>setSelected(null)} onChanged={recargarPanel} onNavigate={onNavigate} activeSession={activeSession} activeSessionReady={activeSessionReady} activeSessionError={activeSessionError}/>}</div>;
}
function ClubICANDocenteView(props) {
  return <CronogramaDocenteSeguroF82 {...props} onlyIcan={true}/>;
}

// ─────────────────────────────────────────────────────────────────────────
function CalificarView({ toast }) {
  const { codGrupo, programa, roster, grupoInfo, meta, loading, error } = useTeacherSession();
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
        sub={`${tvGrupoLabel(meta || { code:codGrupo }).full} · Programa ${programa} · ${evalDef.max} pts máximo`}
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
          Programa: {programa} · Grupo: {tvGrupoLabel(meta || { code:codGrupo }).full}
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
  const { codGrupo, programa, roster, grupoInfo, meta, loading, error } = useTeacherSession();
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
        sub={`${tvGrupoLabel(meta || { code:codGrupo }).full} · Programa ${programa}`}
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

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(210px, 100%), 1fr))', gap:14, marginBottom:20, width:'100%', minWidth:0 }}>
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
              {resultado.presentes} presente{resultado.presentes!==1?'s':''} · {resultado.ausentes} ausente{resultado.ausentes!==1?'s':''} · Lección {leccion} · {tvGrupoLabel(meta || { code:codGrupo }).full}
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

// F96.2-LAZY-A export explícito para carga diferida
Object.assign(window, { CronogramaDocenteSeguroF82 });
