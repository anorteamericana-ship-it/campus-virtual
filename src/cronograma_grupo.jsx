// CALGRUPO_F86_20260619_ETIQUETAS_EXAMEN_ORAL_INTEGRADO
// CALGRUPO_F80_20260619_CRONOGRAMA_TIMEOUT_RESPUESTA_SEGURA
// CALGRUPO_F74_20260618_AGENDA_DOCENTE_TARJETAS_PANEL_FIJO_LEGIBLE
// CALGRUPO_F71_20260618_AGENDA_DOCENTE_SIN_SELECTOR_COMPACTA
// CALGRUPO_F70_20260618_AGENDA_DOCENTE_SOLO_GRUPOS_EN_CURSO_REALES
// CALGRUPO_F68_20260618_AGENDA_DOCENTE_CUATRIMESTRE_COMPACTA
// CALGRUPO_F68_20260618_FIX_HORA_1899_FRONTEND
// CALGRUPO_F67_20260618_AGENDA_DOCENTE_UNIFICADA_GRUPOS_EN_CURSO
// CALGRUPO_F66_20260618_CRONOGRAMA_ASISTENCIA_UNICA_DOCENTE
/* global React */
// ── CronogramaGrupo v2 — Calendario mensual de lecciones ────────────────
// CALGRUPO_F3_20260616_MES_INDIVIDUAL_CASILLAS_AMPLIAS
// Lee CALENDARIO_LECCIONES vía Apps Script.
// Roles: student / teacher / admin / superadmin
// • student → grupo fijo de sesión; teacher → grupos actuales desde APOLLO.GRUPOS.DOCENTE
// • admin / superadmin → selector de grupo

// URL del Apps Script: fuente única en data.jsx → window.APPS_SCRIPT_URL
const SCRIPT_URL_CG = window.APPS_SCRIPT_URL;

// FIX-ADMIN-CORE-POST-001: lectura sensible vía POST text/plain (token en body).
async function postCronoGrupo(fn, payload = {}, timeoutMs = 30000) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(`${SCRIPT_URL_CG}?fn=${encodeURIComponent(fn)}`, {
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

// Sentinel para la vista "Todos los grupos" (solo admin/superadmin).
const TODOS_GRUPOS = '__TODOS__';

// La lista de grupos AHORA viene del backend (getGruposActivos). Ver CronogramaGrupo.

const NIVEL_COLOR_CG  = { B1:'#E5A823', B2:'#E8372A', I1:'#2B7FC1', I2:'#4CAF50' };
const NIVEL_LABEL_CG  = { B1:'Básico I', B2:'Básico II', I1:'Intermedio I', I2:'Intermedio II' };
const NIVEL_OFFSET    = { B1:0, B2:32, I1:64, I2:96 };

// CALGRUPO_F64_20260618_DOCENTE_CRONOGRAMA_GRUPO_PROPIO
// CALGRUPO_F52_20260617_FIX_STUDENT_CRONOGRAMA_UNLOCK_RACE
function normalizarNivelCG(n) {
  const s = String(n || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
  if (!s) return '';
  if (['B1', 'BASICO 1', 'BASICO I', 'BASIC 1', 'BASIC I'].includes(s)) return 'B1';
  if (['B2', 'BASICO 2', 'BASICO II', 'BASIC 2', 'BASIC II'].includes(s)) return 'B2';
  if (['I1', 'INTERMEDIO 1', 'INTERMEDIO I', 'INTERMEDIATE 1', 'INTERMEDIATE I'].includes(s)) return 'I1';
  if (['I2', 'INTERMEDIO 2', 'INTERMEDIO II', 'INTERMEDIATE 2', 'INTERMEDIATE II'].includes(s)) return 'I2';
  return s;
}

function normalizarEstatusCG(v) {
  const s = String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
  if (!s) return '';
  if (s === 'CURSANDO' || s === 'CURSANDO ACTUALMENTE' || s === 'ACTIVO') return 'CA';
  if (s === 'APROBADO' || s === 'APROBADA') return 'APR';
  if (s === 'CONVALIDADO' || s === 'CONVALIDADA') return 'CNV';
  return s;
}

const TIPO_BADGE = {
  CLASE:           '',
  PROGRESS_CHECK:  'PC',
  EVAL_ORAL:       'Oral',
  EVAL_ESCRITO:    'Escrito',
  ICAN:            'I CAN',
};
const TIPO_LABEL_LARGO = {
  CLASE:           'Clase regular',
  PROGRESS_CHECK:  'Progress Check',
  EVAL_ORAL:       'Examen Oral',
  EVAL_ESCRITO:    'Examen Escrito',
  ICAN:            'Sesión I CAN',
};

// F86 — Nombre humano y orden de cada evaluación dentro del nivel.
// Evita que dos bloques del mismo sábado se vean solo como “Oral/Escrito”.
const EVALUACION_LABEL_CG = {
  EVAL_ORAL: {
    9:  { corto:'1.er oral', largo:'1.er Examen Oral' },
    17: { corto:'2.º oral',  largo:'2.º Examen Oral' },
    25: { corto:'3.er oral', largo:'3.er Examen Oral' },
    31: { corto:'4.º oral',  largo:'4.º Examen Oral' },
  },
  EVAL_ESCRITO: {
    18: { corto:'1.er escrito', largo:'1.er Examen Escrito' },
    32: { corto:'2.º escrito',  largo:'2.º Examen Escrito' },
  },
};
function etiquetaEvaluacionCG(tipo, leccion, larga = false) {
  const item = EVALUACION_LABEL_CG[String(tipo || '').toUpperCase()]?.[Number(leccion)];
  return item ? (larga ? item.largo : item.corto) : '';
}
function modalidadPeriodoCronoCG(meta) {
  const raw = String(meta?.modalidad || meta?.MODALIDAD || '').trim().toUpperCase();
  const code = String(meta?.code || meta?.cod_grupo || '').trim().toUpperCase();
  const sched = typeof cgScheduleFromCode === 'function' ? cgScheduleFromCode(code) : {};
  const esBimestre = raw.includes('SUPER') || raw.includes('BIMEST') || sched?.dayCode === 'L4' || sched?.dayCode === 'LJ';
  return esBimestre
    ? { meses:2, key:'bimestre', label:'Bimestre completo' }
    : { meses:4, key:'cuatrimestre', label:'Cuatrimestre completo' };
}
function contextoOralCG(lec, nivelFallback) {
  return {
    grupo: String(lec?.cod_grupo || lec?.grupo || '').trim(),
    nivel: normalizarNivelCG(lec?.nivel || lec?.nivelId || nivelFallback || ''),
    leccion: Number(lec?.leccion || 0),
    fecha: String(lec?.fecha || '').slice(0, 10),
  };
}

// Color base por nivel
const NIVEL_BASE = {
  B1: { dark:'#9A6A00', mid:'#E5A823', light:'#FFF8DC', lighter:'#FFFDF0' },
  B2: { dark:'#8B1A10', mid:'#E8372A', light:'#FDECEA', lighter:'#FFF5F4' },
  I1: { dark:'#0D47A1', mid:'#2B7FC1', light:'#E8F1FD', lighter:'#F0F7FF' },
  I2: { dark:'#1B5E20', mid:'#4CAF50', light:'#EBF5EB', lighter:'#F5FBF5' },
};

// Paleta de celda — devuelve {bg, fg, accent}
// v4.22: las lecciones CERRADAS usan el MISMO color que los segmentos llenos
// de la barra de progreso superior (base.dark) para unificar visualmente.
function paletaCelda(estado, tipo, nivel) {
  const base = NIVEL_BASE[nivel] || NIVEL_BASE.B1;
  const tipoNorm = String(tipo || '').toUpperCase();

  if (estado === 'FERIADO') return { bg:'#FDECEA', fg:'#B71C1C', accent:'#B71C1C' };

  if (tipoNorm === 'ICAN') {
    if (estado === 'CERRADA') return { bg:'#1B5E20', fg:'#FFFFFF', accent:'#1B5E20' };
    if (estado === 'HOY') return { bg:'#4CAF50', fg:'#FFFFFF', accent:'#1B5E20' };
    return { bg:'#F1F8E9', fg:'#2E7D32', accent:'#4CAF50' };
  }
  if (tipoNorm === 'PROGRESS_CHECK') {
    if (estado === 'CERRADA') return { bg:'#6A1B9A', fg:'#FFFFFF', accent:'#6A1B9A' };
    if (estado === 'HOY') return { bg:'#7B1FA2', fg:'#FFFFFF', accent:'#6A1B9A' };
    return { bg:'#F3E5F5', fg:'#7B1FA2', accent:'#7B1FA2' };
  }
  if (tipoNorm === 'EVAL_ORAL') {
    if (estado === 'CERRADA') return { bg:'#E65100', fg:'#FFFFFF', accent:'#E65100' };
    if (estado === 'HOY') return { bg:'#F57F17', fg:'#FFFFFF', accent:'#E65100' };
    return { bg:'#FFF8E1', fg:'#9A6A00', accent:'#F57F17' };
  }
  if (tipoNorm === 'EVAL_ESCRITO') {
    if (estado === 'CERRADA') return { bg:'#BF360C', fg:'#FFFFFF', accent:'#BF360C' };
    if (estado === 'HOY') return { bg:'#E65100', fg:'#FFFFFF', accent:'#BF360C' };
    return { bg:'#FFF3E0', fg:'#BF360C', accent:'#E65100' };
  }

  if (estado === 'HOY') return { bg: base.mid, fg:'#FFFFFF', accent: base.dark };
  if (estado === 'CERRADA') return { bg: base.dark, fg:'#FFFFFF', accent: base.dark };
  return { bg: base.lighter, fg: base.mid, accent: base.mid + '60' };
}

// Color para segmento de progress bar
function colorProgreso(estado, tipo, nivel) {
  const tipoNorm = String(tipo || '').toUpperCase();
  if (estado === 'FERIADO') return '#B71C1C';
  const pal = paletaCelda(estado, tipoNorm, nivel);
  if (estado === 'HOY') return pal.bg;
  if (estado === 'CERRADA') return pal.bg;
  if (tipoNorm === 'PROGRESS_CHECK' || tipoNorm === 'EVAL_ORAL' || tipoNorm === 'EVAL_ESCRITO' || tipoNorm === 'ICAN') return pal.accent;
  const base = NIVEL_BASE[nivel] || NIVEL_BASE.B1;
  return base.light;
}

// Feriados CR — fallback para mostrar nombres en panel
const FERIADOS_CR_NAMES = {
  '2026-01-01':'Año Nuevo',
  '2026-04-02':'Jueves Santo',
  '2026-04-03':'Viernes Santo',
  '2026-04-11':'Día de Juan Santamaría',
  '2026-05-01':'Día del Trabajo',
  '2026-07-25':'Anexión de Guanacaste',
  '2026-08-02':'Día de la Virgen de los Ángeles',
  '2026-08-15':'Día de la Madre',
  '2026-09-15':'Día de la Independencia',
  '2026-12-25':'Navidad',
};

const MESES_NOMBRES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MES_CORTO     = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DIA_INICIAL   = ['L','M','M','J','V','S','D']; // semana inicia lunes

function parseISO(iso) { return iso ? new Date(iso + 'T00:00:00') : null; }
function isoOf(d) { return d.toISOString().slice(0,10); }
function fmtDDMMM(iso) {
  const d = parseISO(iso); if (!d) return '—';
  return `${String(d.getDate()).padStart(2,'0')}/${MES_CORTO[d.getMonth()]}`;
}
function fmtLargo(iso) {
  const d = parseISO(iso); if (!d) return '—';
  return `${String(d.getDate()).padStart(2,'0')}/${MES_CORTO[d.getMonth()]}/${d.getFullYear()}`;
}
function diasEntre(iso) {
  const d = parseISO(iso); if (!d) return null;
  const h = new Date(); h.setHours(0,0,0,0);
  return Math.round((d - h) / 86400000);
}
function idLeccion(nivel, num) {
  return 'L' + String((NIVEL_OFFSET[nivel] || 0) + num).padStart(3,'0');
}

// CALGRUPO_F66_20260618_HORARIO_GRUPO_VISIBLE_NO_CODIGO
// El docente no debe leer códigos internos como B1-SA94-C1-0326.
// En interfaz mostramos horario + ciclo: "Sábado de 9am a 4pm - C1-0326".
function cgDiasLabel(dias) {
  const s = String(dias || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, '');
  const map = {
    LM:'Lunes y miércoles', KJ:'Martes y jueves', MJ:'Martes y jueves',
    LJ:'Lunes a jueves', L4:'Lunes a jueves', SA:'Sábado', SAB:'Sábado',
    S:'Sábado', L:'Lunes', K:'Martes', M:'Miércoles', MI:'Miércoles',
    J:'Jueves', V:'Viernes', D:'Domingo'
  };
  return map[s] || String(dias || '').trim() || 'Horario';
}
function cgTimePart(v) {
  const raw = String(v == null ? '' : v).trim();
  if (!raw) return '';
  // No volver a imprimir fechas fantasma de Sheets como horario.
  // Si llega un Date.toString() de 1899, no intentamos usar esa hora histórica:
  // F70 cae al horario inferido desde el código del grupo (KJ69, SA94, etc.).
  if (/1899|GMT|hora est[aá]ndar|standard/i.test(raw)) return '';
  const m = raw.match(/^(\d{1,2})(?::(\d{2}))?/);
  if (!m) return raw;
  let h = parseInt(m[1], 10);
  const min = m[2] && m[2] !== '00' ? ':' + m[2] : '';
  const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return h + min + ap;
}
function cgScheduleFromCode(code) {
  const s = String(code || '').toUpperCase().replace(/\s+/g, '');
  const m = s.match(/-(LM|KJ|LJ|L4|SA|SAB|L|K|M|J|V|D)(\d{2})-/) || s.match(/-(LM|KJ|LJ|L4|SA|SAB|L|K|M|J|V|D)(\d{2})/);
  if (!m) return {};
  const dias = m[1] === 'SAB' ? 'SA' : m[1];
  const map = { '69':['18:00','21:00'], '94':['09:00','16:00'], '96':['09:00','12:00'] };
  const hh = map[m[2]] || [];
  return { dias, hora_i: hh[0] || '', hora_f: hh[1] || '' };
}
function cgHoraLabel(g) {
  if (!g) return '';
  const sched = cgScheduleFromCode(g.code || g.cod_grupo || g.grupo || '');
  // CALGRUPO_F70_20260618_UI_HORARIO_CODIGO_PRIORITARIO
  // Si el código trae horario (KJ69/SA94/etc.), ese es el horario limpio.
  // Evita volver a pintar 23:23/6:23 derivados de Date 1899 de Sheets.
  const schedLabel = [cgTimePart(sched.hora_i), cgTimePart(sched.hora_f)].filter(Boolean).join(' a ');
  if (schedLabel) return schedLabel;
  const hi = g.hora_i || g.hora_inicio || g.horaInicio || '';
  const hf = g.hora_f || g.hora_fin || g.horaFin || '';
  const fromParts = [cgTimePart(hi), cgTimePart(hf)].filter(Boolean).join(' a ');
  if (fromParts) return fromParts;
  const h = String(g.hora || g.horario || '').trim();
  if (!h || /1899|GMT|hora est[aá]ndar|standard/i.test(h)) return '';
  const parts = h.split(/[–-]/).map(x => x.trim()).filter(Boolean);
  const out = parts.length >= 2 ? (cgTimePart(parts[0]) + ' a ' + cgTimePart(parts[1])) : h;
  return /1899|GMT|hora est[aá]ndar|standard/i.test(out) ? '' : out;
}
function cgCicloGrupo(code) {
  const parts = String(code || '').split('-').filter(Boolean);
  if (parts.length >= 2) return parts.slice(-2).join('-');
  return String(code || '').trim();
}
function cgUltimoCodigoGrupo(code) {
  const parts = String(code || '').split('-').filter(Boolean);
  return parts.length ? parts[parts.length - 1] : String(code || '').trim();
}
function grupoHorarioLabelCG(g) {
  if (!g) return '—';
  const code = g.code || g.cod_grupo || g.grupo || '';
  const sched = cgScheduleFromCode(code);
  const dias = cgDiasLabel(g.dias || g.diasCode || sched.dias || '');
  const hora = cgHoraLabel(g);
  const ciclo = cgCicloGrupo(code);
  return `${dias}${hora ? ' de ' + hora : ''}${ciclo ? ' - ' + ciclo : ''}`;
}

// ─────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────
function CronogramaGrupo({ rol = 'admin', onNavigate }) {
  const usr = React.useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('an_usuario') || 'null'); } catch { return null; }
  }, []);

  const esAdmin    = rol === 'admin' || rol === 'superadmin';
  const esSuperadmin = rol === 'superadmin';
  const esStudent  = rol === 'student';
  const esTeacher  = rol === 'teacher';

  // ── PASO A: lista de grupos REALES del backend (getGruposActivos) ─────
  // Reemplaza la antigua constante hardcodeada GRUPOS_DISPONIBLES.
  // Si la red falla, mostramos ErrorState (NO datos inventados).
  const [gruposReales,  setGruposReales]  = React.useState([]);
  const [loadingGrupos, setLoadingGrupos] = React.useState(true);
  const [errorGrupos,   setErrorGrupos]   = React.useState(null);

  const cargarGrupos = React.useCallback(() => {
    setLoadingGrupos(true); setErrorGrupos(null);

    // FIX STUDENT-PANEL-001 (R1/R2): el ESTUDIANTE nunca pide getGruposActivos
    // (endpoint administrativo → no_autorizado). Usa únicamente su propio grupo
    // de la sesión y lo describe con getGrupoInfo (endpoint permitido al
    // estudiante). Así no se consultan todos los grupos ni datos de otros.
    // CALGRUPO_F65_20260618_CRONOGRAMA_DOCENTE_DESDE_GRUPOS
    // Teacher no usa USUARIOS.GRUPO como fuente de verdad. USUARIOS solo identifica
    // al docente; los grupos/niveles vigentes se resuelven desde APOLLO.GRUPOS.DOCENTE.
    if (esTeacher) {
      return postCronoGrupo('getDocenteGruposActuales', {})
        .then(d => {
          if (d?.ok && Array.isArray(d.grupos) && d.grupos.length) {
            const mapped = d.grupos.map(g => {
              const nivelId = String(g.nivelId || g.levelId || g.nivel || 'B1').toUpperCase();
              return {
                code: g.code || g.cod_grupo,
                nivelId,
                nivel: NIVEL_LABEL_CG[nivelId] || g.nivel || nivelId,
                docente: g.docente || g.teacherName || usr?.nombre || '—',
                dias: g.dias || g.diasCode || '',
                hora: /1899|GMT|hora est[aá]ndar|standard/i.test(String(g.hora || '')) ? '' : (g.hora || ''),
                hora_i: g.hora_i || g.hora_inicio || '',
                hora_f: g.hora_f || g.hora_fin || '',
                programa: g.programa || usr?.programa || 'SIN_INA',
                comentario_calculado: g.comentario_calculado || '',
                estado_calculado: g.estado_calculado || '',
                source: g.source || 'GRUPOS_F65',
                lecciones: Array.isArray(g.lecciones) ? g.lecciones : [],
              };
            }).filter(g => g.code);
            setGruposReales(mapped);
            if (d.mensaje && !mapped.length) setErrorGrupos(d.mensaje);
          } else {
            setGruposReales([]);
            setErrorGrupos(d?.mensaje || d?.error || 'No hay grupos en curso o proyectados para este docente según APOLLO.GRUPOS. Revisá columna DOCENTE y fechas de inicio.');
          }
        })
        .catch(e => setErrorGrupos('Error de conexión cargando grupos docentes desde GRUPOS: ' + (e?.message || e)))
        .finally(() => setLoadingGrupos(false));
    }

    if (esStudent) {
      const rawGroups = [];
      if (usr?.grupo) rawGroups.push(usr.grupo);
      if (usr?.grupoActivo) rawGroups.push(usr.grupoActivo);
      if (usr?.cod_grupo) rawGroups.push(usr.cod_grupo);
      if (Array.isArray(usr?.grupos)) {
        usr.grupos.forEach(g => rawGroups.push(typeof g === 'string' ? g : (g?.grupo || g?.cod_grupo || g?.codigo || g?.code || '')));
      }
      const propios = [...new Set(rawGroups.map(g => String(g || '').trim()).filter(Boolean))];
      if (!propios.length) {
        setErrorGrupos('No se pudo cargar el calendario del grupo. Contactá a la administración.');
        setLoadingGrupos(false);
        return Promise.resolve();
      }
      return Promise.all(propios.map(miGrupo =>
        postCronoGrupo('getGrupoInfo', { cod_grupo: miGrupo })
          .then(d => {
            if (!d?.ok) return { code: miGrupo, error: d?.error || 'no_disponible' };
            const nivelId = String(d.nivelId || d.levelId || usr?.nivel_activo || 'B1').toUpperCase();
            return {
              code: miGrupo,
              nivelId,
              nivel: NIVEL_LABEL_CG[nivelId] || nivelId,
              docente: d.docente || d.teacherName || usr?.nombre || '—',
              dias: d.dias || '',
              hora: d.hora || '',
              hora_i: d.hora_i || d.hora_inicio || '',
              hora_f: d.hora_f || d.hora_fin || '',
              programa: d.programa || usr?.programa || 'SIN_INA',
              lecciones: Array.isArray(d.lecciones) ? d.lecciones : [],
            };
          })
          .catch(() => ({ code: miGrupo, error: 'conexion' }))
      )).then(items => {
        const okItems = items.filter(x => x && !x.error);
        if (okItems.length) setGruposReales(okItems);
        else setErrorGrupos('No pudimos cargar el calendario de tu grupo. Intentá de nuevo o contactá a la administración.');
      }).finally(() => setLoadingGrupos(false));
    }

    return postCronoGrupo('getGruposActivos')
      .then(d => {
        if (d?.ok && Array.isArray(d.grupos)) {
          setGruposReales(d.grupos);
        } else {
          setErrorGrupos(d?.error || 'No se pudieron cargar los grupos activos.');
        }
      })
      .catch(e => setErrorGrupos('Error de red: ' + (e?.message || e)))
      .finally(() => setLoadingGrupos(false));
  }, [esStudent, esTeacher, usr]);

  React.useEffect(() => { cargarGrupos(); }, [cargarGrupos]);

  // ADMIN/SUPERADMIN deben entrar SIEMPRE al panel global por defecto.
  // La vista individual queda disponible desde el selector, pero no debe
  // reemplazar el tablero de todos los grupos.
  const [codGrupo, setCodGrupo] = React.useState(() => esAdmin ? TODOS_GRUPOS : '');
  React.useEffect(() => {
    if (esAdmin) {
      if (!codGrupo) setCodGrupo(TODOS_GRUPOS);
      return;
    }
    if (codGrupo || !gruposReales.length) return;
    const usrGrupoOk = !esTeacher && usr?.grupo && gruposReales.some(g => g.code === usr.grupo);
    setCodGrupo(usrGrupoOk ? usr.grupo : gruposReales[0].code);
  }, [gruposReales, codGrupo, esAdmin, usr]);

  const esTodosGrupos = codGrupo === TODOS_GRUPOS;

  // Meta del grupo activo — todo lo derivado sale de aquí.
  // En "Todos los grupos", meta es un placeholder neutro (no se usa para datos).
  const meta = (esTodosGrupos
    ? null
    : gruposReales.find(g => g.code === codGrupo))
    || { code: codGrupo, nivelId: 'B1', nivel: 'Básico I', docente: '—',
         dias: 'LM', programa: 'SIN_INA', lecciones: [] };
  // Backend devuelve UN nivel activo por grupo (nivelId). El selector de
  // niveles múltiples del componente viejo se reduce a ese nivel activo.
  const niveles = [meta.nivelId];
  const periodoPrograma = modalidadPeriodoCronoCG(meta);

  // ── CONTROL DE ACCESO POR NIVEL (solo student) ─────────────────────
  // Reglas:
  //   • student: solo niveles con estatus CA / APR / CNV son "desbloqueados"
  //   • teacher / admin: acceso total
  const nivelesEstatus = (esStudent && usr?.niveles_estatus && typeof usr.niveles_estatus === 'object') ? usr.niveles_estatus : null;
  const nivelActivoStudent = esStudent ? normalizarNivelCG(usr?.nivel_activo || usr?.nivel || meta?.nivelId || '') : '';

  const nivelDesbloqueado = React.useCallback((n) => {
    if (!esStudent) return true;
    const nn = normalizarNivelCG(n);

    // El nivel activo del estudiante nunca debe quedar bloqueado por un mapa
    // stale/incompleto de sessionStorage. Eso era lo que hacía aparecer
    // "Nivel bloqueado" aunque el alumno estuviera en su grupo actual.
    if (nivelActivoStudent && nn === nivelActivoStudent) return true;

    if (!nivelesEstatus) return true; // sin datos: no bloqueamos (fail-open en dev)

    const e = normalizarEstatusCG(
      nivelesEstatus[n] ||
      nivelesEstatus[nn] ||
      nivelesEstatus[NIVEL_LABEL_CG[nn]] ||
      nivelesEstatus[String(NIVEL_LABEL_CG[nn] || '').toUpperCase()]
    );
    return e === 'CA' || e === 'APR' || e === 'CNV';
  }, [esStudent, nivelesEstatus, nivelActivoStudent]);

  // Nivel inicial: para student, preferir nivel_activo si está en el grupo
  const nivelInicial = (esStudent && nivelActivoStudent && niveles.includes(nivelActivoStudent))
    ? nivelActivoStudent
    : niveles[0];
  const [nivel, setNivel] = React.useState(nivelInicial);
  const nivelBloqueado = !nivelDesbloqueado(nivel);

  React.useEffect(() => {
    if (!niveles.includes(nivel)) setNivel(niveles[0]);
  }, [codGrupo]); // eslint-disable-line

  // Data
  const [lecciones, setLecciones]   = React.useState([]);
  const [loading, setLoading]       = React.useState(true);
  const [error, setError]           = React.useState(null);
  const [usandoMock, setUsandoMock] = React.useState(false);
  const loadSeqRef = React.useRef(0);

  // CALGRUPO_F67_20260618_AGENDA_DOCENTE_TODOS_GRUPOS_MISMO_CALENDARIO
// CALGRUPO_F72_20260618_AGENDA_DOCENTE_PANEL_DERECHO_FIJO_FILTROS_GRUPO
  // Para teacher, el cronograma ya no es “grupo seleccionado”: es agenda docente.
  // Carga todas las líneas EN_CURSO que vienen de APOLLO.GRUPOS.DOCENTE y las
  // pinta juntas en el mismo calendario, como una agenda tipo Google Calendar.
  const agendaDocenteMode = esTeacher;
  const [agendaLecciones, setAgendaLecciones] = React.useState([]);
  const [loadingAgenda, setLoadingAgenda] = React.useState(false);
  const [errorAgenda, setErrorAgenda] = React.useState(null);
  // F72: filtro visual. El docente entra en TODOS, pero puede aislar un horario
  // sin que aparezca el selector-modal de grupo ni se pierda el panel derecho.
  const [agendaGrupoFiltro, setAgendaGrupoFiltro] = React.useState(TODOS_GRUPOS);
  const agendaSeqRef = React.useRef(0);

  const cargar = React.useCallback(() => {
    if (!codGrupo || codGrupo === TODOS_GRUPOS) {
      // No hay grupo activo (todavía o porque está en "Todos los grupos"):
      // no se fetchean lecciones; la vista Todos consume gruposReales directo.
      setLecciones([]); setLoading(false); setError(null);
      return;
    }
    const seq = ++loadSeqRef.current;
    setLoading(true); setError(null); setUsandoMock(false);
    setSelLec(null); setDetalle(null);

    if (nivel === 'ICAN') {
      // I CAN: usamos las lecciones que ya vinieron embebidas en el grupo del
      // backend (filtradas por tipo). Sin mock; si el backend no las trajo,
      // queda vacío (estado válido para un grupo sin sesiones I CAN).
      const grupoMeta = gruposReales.find(g => g.code === codGrupo);
      if (grupoMeta?.programa === 'INA' && Array.isArray(grupoMeta.lecciones)) {
        setLecciones(grupoMeta.lecciones.filter(l => l.tipo === 'ICAN'));
      } else {
        setLecciones([]);
      }
      setLoading(false);
      return;
    }

    return postCronoGrupo('getFechasGrupo', { cod_grupo: codGrupo, nivel })
      .then(d => {
        if (seq !== loadSeqRef.current) return;
        if (d?.ok && Array.isArray(d.lecciones)) {
          setLecciones(d.lecciones);
        } else {
          // Sin mock fallback. Para estudiante NUNCA mostramos el error crudo
          // del backend (p. ej. no_autorizado): mensaje amigable + Reintentar.
          setLecciones([]);
          setError(esStudent
            ? 'No pudimos cargar las lecciones de tu grupo. Intentá de nuevo o contactá a la administración.'
            : (d?.error || 'No se pudieron cargar las lecciones.'));
        }
      })
      .catch(e => {
        if (seq !== loadSeqRef.current) return;
        setLecciones([]);
        setError(esStudent
          ? 'No pudimos cargar las lecciones de tu grupo. Intentá de nuevo o contactá a la administración.'
          : ('No se pudieron cargar las lecciones. ' + (e?.message || '')));
      })
      .finally(() => { if (seq === loadSeqRef.current) setLoading(false); });
  }, [codGrupo, nivel, gruposReales, esStudent]);

  React.useEffect(() => { cargar(); }, [cargar]);

  React.useEffect(() => {
    if (!agendaDocenteMode) return;
    const seq = ++agendaSeqRef.current;
    // CALGRUPO_F70_20260618_FRONTEND_NO_REFILTRA_GRUPOS_DOCENTE
    // El backend ya devuelve SOLO APOLLO.GRUPOS con COMENTARIO=En curso.
    // El frontend no puede volver a meter calculados/proyectados porque inventa horarios.
    const gruposAgenda = (gruposReales || []);
    if (!gruposAgenda.length) {
      setAgendaLecciones([]); setLoadingAgenda(false); setErrorAgenda(null);
      return;
    }
    setLoadingAgenda(true); setErrorAgenda(null);
    Promise.all(gruposAgenda.map(g => {
      const nivelG = normalizarNivelCG(g.nivelId || g.nivel || 'B1');
      return postCronoGrupo('getFechasGrupo', { cod_grupo: g.code || g.cod_grupo, nivel: nivelG })
        .then(d => {
          if (!d?.ok || !Array.isArray(d.lecciones)) {
            return { ok:false, grupo:g, nivel:nivelG, error:d?.error || 'sin_lecciones', lecciones:[] };
          }
          return { ok:true, grupo:g, nivel:nivelG, lecciones:d.lecciones };
        })
        .catch(e => ({ ok:false, grupo:g, nivel:nivelG, error:e?.message || String(e || 'error_red'), lecciones:[] }));
    })).then(results => {
      if (seq !== agendaSeqRef.current) return;
      const eventos = [];
      const errores = [];
      results.forEach(res => {
        if (!res.ok) errores.push(`${grupoHorarioLabelCG(res.grupo)}: ${res.error}`);
        (res.lecciones || []).forEach((lec, idx) => {
          eventos.push({
            ...lec,
            cod_grupo: res.grupo.code || res.grupo.cod_grupo,
            grupoLabel: grupoHorarioLabelCG(res.grupo),
            horario_label: grupoHorarioLabelCG(res.grupo),
            grupoSuffix: '-' + cgUltimoCodigoGrupo(res.grupo.code || res.grupo.cod_grupo || ''),
            estudiantes_count: res.grupo.estudiantes_count || res.grupo.estudiantes || res.grupo.total_estudiantes || '',
            nivel: res.nivel,
            nivelId: res.nivel,
            docente: res.grupo.docente,
            hora_i: res.grupo.hora_i || res.grupo.hora_inicio || '',
            hora_f: res.grupo.hora_f || res.grupo.hora_fin || '',
            dias: res.grupo.dias || res.grupo.diasCode || '',
            agenda_event_id: `${res.grupo.code || res.grupo.cod_grupo}|${res.nivel}|${lec.fecha}|${lec.leccion}|${idx}`,
          });
        });
      });
      eventos.sort((a,b) => String(a.fecha).localeCompare(String(b.fecha)) || String(a.hora_i||'').localeCompare(String(b.hora_i||'')) || String(a.grupoLabel||'').localeCompare(String(b.grupoLabel||'')) || ((a.leccion||0)-(b.leccion||0)));
      setAgendaLecciones(eventos);
      setErrorAgenda(errores.length ? errores.slice(0,3).join(' · ') : null);
    }).catch(e => {
      if (seq !== agendaSeqRef.current) return;
      setAgendaLecciones([]);
      setErrorAgenda('No se pudo cargar la agenda docente: ' + (e?.message || e));
    }).finally(() => { if (seq === agendaSeqRef.current) setLoadingAgenda(false); });
  }, [agendaDocenteMode, gruposReales]);

  // Selección de lección (panel lateral)
  const [selLec, setSelLec]         = React.useState(null);
  const [detalle, setDetalle]       = React.useState(null);
  const [cargandoDet, setCargandoDet] = React.useState(false);

  // STUDENT-ACCESS-CALENDAR-001: vista activa (persistida) + acceso del estudiante.
  const [vista, setVista] = React.useState(() => {
    try { return localStorage.getItem('an_crono_vista') || 'proxima'; } catch (_) { return 'proxima'; }
  });
  React.useEffect(() => { try { localStorage.setItem('an_crono_vista', vista); } catch (_) {} }, [vista]);
  const [mesesVista, setMesesVista] = React.useState(() => {
    try { return Number(localStorage.getItem('an_crono_meses_vista') || (esTeacher ? 4 : 1)); } catch (_) { return esTeacher ? 4 : 1; }
  });
  React.useEffect(() => { try { localStorage.setItem('an_crono_meses_vista', String(mesesVista)); } catch (_) {} }, [mesesVista]);
  React.useEffect(() => {
    if (esTeacher || esAdmin) return;
    const validos = new Set([1, periodoPrograma.meses]);
    if (!validos.has(Number(mesesVista))) setMesesVista(1);
  }, [esTeacher, esAdmin, mesesVista, periodoPrograma.meses]);

  // Acceso del estudiante (matrícula / cuota / mora). Para teacher/admin no se
  // consulta (codigoAcceso vacío → hook no hace fetch). El hook está siempre
  // cargado (campus.html lo importa antes que este archivo).
  const codigoAcceso = esStudent ? (usr?.codigo || usr?.cedula || '') : '';
  const accessState = window.useStudentAccess(codigoAcceso, nivel);
  const acc    = accessState.access;
  const accDet = !!(acc && acc.determinado);
  // Solo bloqueamos en duro cuando el dato es DETERMINADO (no sobre-bloquear).
  const studentAccountOnly   = esStudent && accDet && acc.flags.accountOnly;
  const studentSinCalendario = esStudent && accDet && !acc.flags.canCalendar && !acc.flags.accountOnly;
  const studentSoloFechas    = esStudent && accDet && acc.flags.canCalendar && !acc.flags.canMateriales;

  // v4.22: Cobertura puntual de lecciones (admin)
  // Override local por id_leccion — sobrevive a re-fetches del detalle.
  const [coberturas, setCoberturas]     = React.useState({});
  const [modalCobertura, setModalCobertura] = React.useState(null); // { selLec } | null
  const [modalEditarCerrada, setModalEditarCerrada] = React.useState(null); // { selLec } | null
  const [modalCierreAsistencia, setModalCierreAsistencia] = React.useState(null); // F66: asistencia desde cronograma
  const [toast, setToast]               = React.useState(null);     // { msg, kind } | null

  const showToast = React.useCallback((msg, kind = 'ok') => {
    setToast({ msg, kind, t: Date.now() });
    setTimeout(() => setToast(t => (t && Date.now() - t.t >= 3800) ? null : t), 4000);
  }, []);

  const onCoberturaAsignada = React.useCallback((idLec, docente_cobertura, docente_anterior) => {
    setCoberturas(prev => ({
      ...prev,
      [idLec]: { docente_cobertura, docente_anterior, ts: Date.now() },
    }));
    setModalCobertura(null);
    showToast(`Cobertura asignada: la lección la dará ${docente_cobertura}`, 'ok');
  }, [showToast]);

  const agendaLeccionesFiltradas = React.useMemo(() => {
    if (!agendaDocenteMode) return [];
    if (!agendaGrupoFiltro || agendaGrupoFiltro === TODOS_GRUPOS) return agendaLecciones;
    return (agendaLecciones || []).filter(l => String(l.cod_grupo || '') === String(agendaGrupoFiltro));
  }, [agendaDocenteMode, agendaGrupoFiltro, agendaLecciones]);

  const leccionesVista = agendaDocenteMode ? agendaLeccionesFiltradas : lecciones;
  const loadingVista = agendaDocenteMode ? loadingAgenda : loading;
  const errorVista = agendaDocenteMode ? errorAgenda : error;

  // Auto-seleccionar HOY o primera PROGRAMADA/CALCULADA al cargar
  React.useEffect(() => {
    if (!leccionesVista.length) return;
    const currentKey = selLec && (selLec.agenda_event_id || `${selLec.cod_grupo||codGrupo}|${selLec.nivel||nivel}|${selLec.fecha}|${selLec.leccion}`);
    const stillExists = currentKey && leccionesVista.some(l => (l.agenda_event_id || `${l.cod_grupo||codGrupo}|${l.nivel||nivel}|${l.fecha}|${l.leccion}`) === currentKey);
    if (stillExists) return;
    const sel = leccionesVista.find(l => l.estado === 'HOY')
             || leccionesVista.find(l => l.estado === 'PROGRAMADA')
             || leccionesVista.find(l => l.estado === 'CALCULADA')
             || leccionesVista[0];
    if (sel?.cod_grupo) setCodGrupo(sel.cod_grupo);
    if (sel?.nivel) setNivel(sel.nivel);
    setSelLec(sel);
  }, [leccionesVista]);

  // Carga el detalle de la lección seleccionada. Extraído a un callback
  // para que el botón "Reintentar" del panel pueda volver a dispararlo.
  const cargarDetalle = React.useCallback(() => {
    if (!selLec) { setDetalle(null); return; }
    if (selLec.estado === 'FERIADO') { setDetalle(null); return; }
    // ✱ Si el nivel está bloqueado para el estudiante: NO llamar getLeccionDetalle
    if (nivelBloqueado) { setDetalle(null); return; }
    setCargandoDet(true);
    // CALGRUPO_F53_20260617_CRONOGRAMA_DETALLE_ROUTER_FIX
    const riel = selLec.tipo === 'ICAN' ? 'ican' : 'curso';
    const id = riel === 'curso' ? idLeccion(nivel, selLec.leccion) : '';
    postCronoGrupo('getLeccionDetalle', { id_leccion: id, nivel, leccion: selLec.leccion, riel })
      .then(d => {
        if (d?.ok && d.leccion) setDetalle(d.leccion);
        else setDetalle(null);
      })
      .catch(() => setDetalle(null))
      .finally(() => setCargandoDet(false));
  }, [selLec, nivel, nivelBloqueado]);

  React.useEffect(() => { cargarDetalle(); }, [cargarDetalle]);

  // Stats
  const stats = React.useMemo(() => {
    const esFutura     = l => l.estado === 'CALCULADA' || l.estado === 'PROGRAMADA';
    const cerradas     = leccionesVista.filter(l => l.estado === 'CERRADA').length;
    const feriados     = leccionesVista.filter(l => l.estado === 'FERIADO').length;
    const calculadas   = leccionesVista.filter(esFutura).length;
    const hoy          = leccionesVista.filter(l => l.estado === 'HOY').length;
    const proxima      = leccionesVista.find(l => esFutura(l) || l.estado === 'HOY');
    const primera      = leccionesVista[0];
    const ultima       = [...leccionesVista].reverse()
                          .find(l => l.estado === 'CERRADA' || esFutura(l) || l.estado === 'HOY');
    return { cerradas, feriados, calculadas, hoy, proxima, primera, ultima, total: leccionesVista.length };
  }, [leccionesVista]);

  const nivelColor = NIVEL_COLOR_CG[nivel] || NIVEL_COLOR_CG.B1;

  // Construir lista de meses a renderizar
  const meses = React.useMemo(() => {
    if (!leccionesVista.length) return [];
    const fechas = leccionesVista.map(l => parseISO(l.fecha)).filter(Boolean);
    if (!fechas.length) return [];
    const fMin = new Date(Math.min(...fechas));
    const fMax = new Date(Math.max(...fechas));
    const out = [];
    const cur = new Date(fMin.getFullYear(), fMin.getMonth(), 1);
    const fin = new Date(fMax.getFullYear(), fMax.getMonth(), 1);
    while (cur <= fin) {
      out.push(new Date(cur));
      cur.setMonth(cur.getMonth() + 1);
    }
    return out;
  }, [leccionesVista]);

  // Mapa fecha → lecciones (puede haber 2 para SA)
  const mapaLecciones = React.useMemo(() => {
    const m = {};
    leccionesVista.forEach(l => {
      if (!m[l.fecha]) m[l.fecha] = [];
      m[l.fecha].push(l);
    });
    return m;
  }, [leccionesVista]);

  const codGrupoSeleccionado = selLec?.cod_grupo || codGrupo;
  const nivelSeleccionado = normalizarNivelCG(selLec?.nivel || nivel);
  const metaSeleccionada = gruposReales.find(g => g.code === codGrupoSeleccionado || g.cod_grupo === codGrupoSeleccionado) || meta;
  const nivelColorSeleccionado = NIVEL_COLOR_CG[nivelSeleccionado] || NIVEL_COLOR_CG.B1;

  // CALGRUPO_F73_20260618_CIERRE_ASISTENCIA_REFRESCO_INMEDIATO
  // Al guardar/cerrar asistencia no podemos esperar a que el docente recargue.
  // Marcamos la lección localmente como CERRADA en la agenda y en el panel para
  // que el color cambie al instante, igual que en el tablero superadmin.
  const marcarLeccionCerradaLocal = React.useCallback((lecBase) => {
    if (!lecBase) return;
    const cod = String(lecBase.cod_grupo || codGrupoSeleccionado || '').trim();
    const niv = normalizarNivelCG(lecBase.nivel || nivelSeleccionado || nivel);
    const num = Number(lecBase.leccion);
    const matches = (x) => {
      if (!x) return false;
      return String(x.cod_grupo || codGrupoSeleccionado || '').trim() === cod
        && normalizarNivelCG(x.nivel || niv) === niv
        && Number(x.leccion) === num
        && String(x.fecha || '') === String(lecBase.fecha || '');
    };
    const closeOne = (x) => matches(x) ? { ...x, estado:'CERRADA', asistencia_guardada:true } : x;
    setAgendaLecciones(prev => Array.isArray(prev) ? prev.map(closeOne) : prev);
    setLecciones(prev => Array.isArray(prev) ? prev.map(closeOne) : prev);
    setSelLec(prev => matches(prev) ? { ...prev, estado:'CERRADA', asistencia_guardada:true } : prev);
  }, [codGrupoSeleccionado, nivelSeleccionado, nivel]);

  // ── Early states: grupos cargando o caídos ───────────────────────────
  // Todos los hooks arriba ya corrieron; estos returns son seguros.
  if (loadingGrupos) {
    return (
      <div data-screen-label="Cronograma de grupo" style={{ padding:40, textAlign:'center', color:'var(--ink-3)' }}>
        <div style={{
          width:24, height:24, margin:'0 auto 12px',
          borderRadius:'50%',
          border:'2.5px solid var(--line)', borderTopColor:'var(--ink)',
          animation:'an-spin .8s linear infinite',
        }} />
        Cargando grupos activos…
      </div>
    );
  }

  if (errorGrupos || !gruposReales.length) {
    return (
      <div data-screen-label="Cronograma de grupo" style={{ padding:24 }}>
        <div style={errorBoxStyle}>
          <span>⚠ {errorGrupos || 'No hay grupos activos para mostrar.'}</span>
          <button onClick={cargarGrupos} className="btn btn-ghost"
                  style={{ padding:'6px 12px', fontSize:12 }}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div data-screen-label="Cronograma de grupo" style={{ position:'relative' }}>
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'flex-end',
        flexWrap:'wrap', gap:14, marginBottom:18,
      }}>
        <div>
          {!esStudent && (
            <div style={{
              fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase',
              color:'var(--ink-3)', marginBottom:6,
            }}>
              Calendario de lecciones · {esAdmin ? 'Administración' : rol === 'teacher' ? 'Vista docente' : 'Mis lecciones'}
            </div>
          )}
          <h1 style={{
            fontFamily:'var(--f-serif)', fontWeight:500, letterSpacing:'-0.025em',
            fontSize:32, lineHeight:1.05, margin:0, color:'var(--ink)',
          }}>
            {rol === 'student' ? 'Mis lecciones' : rol === 'teacher' ? 'Agenda docente' : 'Cronograma de grupo'}
          </h1>
          {!esStudent && (
            <div style={{ fontSize:13, color:'var(--ink-2)', marginTop:6 }}>
              {rol === 'teacher' ? 'Todos tus grupos en curso, vistos en una sola agenda.' : 'Vista única de las 32 lecciones — reemplaza los spreadsheets por grupo.'}
              {usandoMock && (
                <span style={{
                  marginLeft:10, padding:'2px 8px', fontSize:10, fontWeight:700,
                  background:'color-mix(in srgb, var(--an-gold) 18%, white)',
                  color:'#7B5600', borderRadius:'var(--r-pill)', letterSpacing:'0.06em',
                }}>VISTA PREVIA · datos simulados</span>
              )}
            </div>
          )}
        </div>

        {/* Selector/grupos visibles — F67: teacher ve agenda unificada, no grupo seleccionado */}
        <div style={{ display:'flex', gap:10, alignItems:'flex-end', maxWidth: esTeacher ? 780 : undefined }}>
          {esAdmin ? (
            <div>
              <div style={labelStyle}>Grupo</div>
              <select value={codGrupo} onChange={e => setCodGrupo(e.target.value)} style={{ ...selectStyle, minWidth:360 }}>
                {esAdmin && (
                  <option value={TODOS_GRUPOS}>★ Todos los grupos ({gruposReales.length})</option>
                )}
                {gruposReales.map(g => (
                  <option key={g.code} value={g.code}>{grupoHorarioLabelCG(g)} · {g.docente}</option>
                ))}
              </select>
            </div>
          ) : esTeacher ? (
            <div style={{ display:'none' }} aria-hidden="true" />
          ) : (
            <div>
              {rol === 'teacher' ? <div style={labelStyle}>Horario asignado</div> : null}
              <div style={{
                padding:'10px 14px', background:'var(--surface)',
                border:'1.5px solid var(--line)', borderRadius:'var(--r-md)',
                fontWeight:800, fontSize:13,
                color:'var(--ink)', minWidth:260,
              }} title={codGrupo}>
                {grupoHorarioLabelCG(meta)}
              </div>
            </div>
          )}
        </div>
      </div>

      {esTodosGrupos ? (
        typeof window.TodosLosGruposView === 'function' ? (
          React.createElement(window.TodosLosGruposView, { gruposReales, onNavigate })
        ) : (
          <div className="card" style={{ padding:24, color:'var(--ink-3)' }}>No se pudo cargar la vista global de todos los grupos. Verificá que src/cronograma_todos.jsx esté cargado antes de cronograma_grupo.jsx.</div>
        )
      ) : studentAccountOnly ? (
        <CronoAccesoBloqueo
          badge="Acceso limitado · mora" badgeColor="#B71C1C"
          icon={<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>}
          titulo="Cronograma temporalmente limitado"
          mensaje={acc.mensaje}
          accionLabel="Ir a Estado de cuenta"
          onAccion={() => onNavigate && onNavigate('pagos')} />
      ) : studentSinCalendario ? (
        <CronoAccesoBloqueo
          badge={acc.label} badgeColor="#9A6A00"
          icon={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}
          titulo="Tu cronograma todavía no está disponible"
          mensaje={acc.mensaje}
          accionLabel="Ver estado de inscripción"
          onAccion={() => onNavigate && onNavigate('dashboard')} />
      ) : (
      <React.Fragment>
      {/* ── NIVEL TABS ──────────────────────────────────────────────────── */}
      {!agendaDocenteMode && (niveles.length > 1 || meta.programa === 'INA') && (
        <div style={{
          display:'flex', gap:6, marginBottom:14, padding:5,
          background:'var(--bg-deep)', borderRadius:'var(--r-md)', width:'fit-content',
        }}>
          {niveles.map(n => {
            const c = NIVEL_COLOR_CG[n];
            const active = n === nivel;
            const locked = !nivelDesbloqueado(n);
            return (
              <button key={n} onClick={() => setNivel(n)} style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'8px 16px', borderRadius:'var(--r-sm)', border:'none',
                background: active ? 'var(--surface)' : 'transparent',
                boxShadow: active ? 'var(--sh-1)' : 'none',
                cursor:'pointer', fontWeight:600, fontSize:13,
                color: active ? 'var(--ink)' : 'var(--ink-3)',
                opacity: locked && !active ? 0.6 : 1,
                transition:'background .15s',
              }}>
                <span style={{ width:10, height:10, borderRadius:3, background:c,
                               flexShrink:0, opacity: active ? 1 : 0.5 }} />
                <span style={{ fontFamily:'var(--f-mono)', fontWeight:700 }}>{n}</span>
                <span style={{ opacity: active ? 1 : 0.7 }}>· {NIVEL_LABEL_CG[n]}</span>
                {locked && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                       style={{ marginLeft:2, color:'var(--ink-3)' }} aria-label="Bloqueado">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                )}
              </button>
            );
          })}
          {meta.programa === 'INA' && (
            <button
              onClick={() => setNivel('ICAN')}
              style={{
                padding:'6px 14px', borderRadius:'var(--r-sm)', fontWeight:700, fontSize:12,
                border:'none', cursor:'pointer', transition:'all .15s',
                background: nivel === 'ICAN' ? '#4CAF50' : 'transparent',
                color:       nivel === 'ICAN' ? 'white'   : 'var(--ink-3)',
              }}>
              I CAN
            </button>
          )}
        </div>
      )}

      {/* ── RESUMEN / PROGRESS ───────────────────────────────────────────── */}
      {agendaDocenteMode ? (
        <AgendaDocenteResumenF72
          grupos={gruposReales}
          filtro={agendaGrupoFiltro}
          onFiltro={setAgendaGrupoFiltro}
          lecciones={agendaLecciones}
          stats={stats}
          loading={loadingAgenda}
          error={errorAgenda}
        />
      ) : (
        <ProgressBar32 lecciones={lecciones} stats={stats} loading={loading}
                       onClickSeg={l => setSelLec(l)} selLec={selLec} nivel={nivel} />
      )}

      {agendaDocenteMode && selLec && !selLec.estado?.includes?.('FERIADO') && (
        <AgendaAccionesLeccionF76
          selLec={selLec}
          detalle={detalle}
          nivel={nivelSeleccionado}
          rol={rol}
          codigoUsr={codigoUsr}
          grupoUsr={grupoUsr}
          esAdmin={esAdmin}
          onAbrirAsistencia={() => setModalCierreAsistencia({ selLec })}
          onNavigate={onNavigate}
        />
      )}

      {errorVista && (
        <div style={errorBoxStyle}>
          <span>⚠ {errorVista}</span>
          <button onClick={cargar} className="btn btn-ghost"
                  style={{ padding:'6px 12px', fontSize:12 }}>Reintentar</button>
        </div>
      )}

      {/* ── CALENDAR_ONLY: aviso de matrícula pagada sin primera cuota ──── */}
      {studentSoloFechas && (
        <div style={{
          marginTop:14, padding:'12px 16px', display:'flex', alignItems:'center', gap:12,
          background:'color-mix(in srgb, var(--an-gold) 12%, white)',
          border:'1px solid color-mix(in srgb, var(--an-gold) 35%, white)',
          borderRadius:'var(--r-md)', fontSize:13, color:'#6B4A00', lineHeight:1.5,
        }}>
          <span style={{ fontSize:18 }}>🗓️</span>
          <span>{acc.mensaje}</span>
        </div>
      )}

      {/* ── VISTA TABS ─────────────────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, marginTop:14, marginBottom:6, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <VistaTabsCrono vista={vista} setVista={setVista} />
          {vista === 'mes' && (
            <MesesVistaControl valor={mesesVista} setValor={setMesesVista} esAlumno={esStudent} fullRangeMonths={periodoPrograma.meses} fullRangeLabel={periodoPrograma.label} />
          )}
        </div>
      </div>

      {/* ── VISTA + PANEL DETALLE ──────────────────────────────────────── */}
      <div className="cg-layout-f984e" style={{
        // CALGRUPO_F73_20260618_DOS_ZONAS_SCROLL_INDEPENDIENTE
        // Agenda docente profesional: calendario y detalle no comparten scroll.
        // El panel derecho queda visible para leer material y accionar asistencia
        // sin bajar zoom.
        display:'grid',
        // CALGRUPO_F74_20260618_LAYOUT_DOCENTE_PANEL_LEGIBLE
        // El calendario tiene su scroll; el panel derecho queda fijo, completo y legible.
        gridTemplateColumns: agendaDocenteMode ? 'minmax(620px, 1fr) minmax(360px, 380px)' : 'minmax(0, 1fr) minmax(390px, 420px)',
        gap: agendaDocenteMode ? 14 : 18,
        marginTop:6,
        alignItems:'start',
        height: agendaDocenteMode ? 'calc(100dvh - 156px)' : 'auto',
        minHeight: agendaDocenteMode ? 540 : undefined,
        maxHeight: agendaDocenteMode ? 'calc(100dvh - 156px)' : undefined,
        overflow: agendaDocenteMode ? 'hidden' : 'visible',
      }}>
        <div style={{
          minWidth:0, minHeight:0, height: agendaDocenteMode ? '100%' : 'auto',
          overflowY: agendaDocenteMode ? 'auto' : 'visible',
          overflowX:'hidden',
          paddingRight: agendaDocenteMode ? 10 : 0,
          paddingBottom: agendaDocenteMode ? 18 : 0,
          borderRadius: agendaDocenteMode ? 'var(--r-lg)' : undefined,
          scrollbarGutter: agendaDocenteMode ? 'stable' : undefined,
        }}>
          {loadingVista ? (
            <div className="card" style={{ padding:18 }}><SkeletonMeses /></div>
          ) : !leccionesVista.length ? (
            <div className="card" style={{ padding:60, textAlign:'center', color:'var(--ink-3)' }}>
              No hay lecciones registradas para este nivel.
            </div>
          ) : vista === 'proxima' ? (
            <VistaProxima lecciones={leccionesVista} mapaLecciones={mapaLecciones} stats={stats}
                          nivel={nivelSeleccionado} meta={metaSeleccionada} codGrupo={codGrupoSeleccionado} onSelect={l => { if (l?.cod_grupo) setCodGrupo(l.cod_grupo); if (l?.nivel) setNivel(l.nivel); setSelLec(l); }} />
          ) : vista === 'semana' ? (
            <VistaSemana lecciones={leccionesVista} mapaLecciones={mapaLecciones} nivel={nivelSeleccionado}
                         selLec={selLec} onSelect={l => { if (l?.cod_grupo) setCodGrupo(l.cod_grupo); if (l?.nivel) setNivel(l.nivel); setSelLec(l); }} />
          ) : vista === 'lista' ? (
            <VistaLista lecciones={leccionesVista} mapaLecciones={mapaLecciones} nivel={nivelSeleccionado}
                        selLec={selLec} onSelect={l => { if (l?.cod_grupo) setCodGrupo(l.cod_grupo); if (l?.nivel) setNivel(l.nivel); setSelLec(l); }} />
          ) : (
            <VistaMes meses={meses} mapaLecciones={mapaLecciones} selLec={selLec}
                      nivel={nivelSeleccionado} agenda={agendaDocenteMode} mesesVista={mesesVista} onClickLec={l => { if (l?.cod_grupo) setCodGrupo(l.cod_grupo); if (l?.nivel) setNivel(l.nivel); setSelLec(l); }} />
          )}
        </div>

        {/* Panel detalle sticky */}
        <PanelDetalle
          agendaDocente={agendaDocenteMode}
          onNavigate={onNavigate}
          selLec={selLec}
          detalle={detalle}
          cargando={cargandoDet}
          nivelColor={nivelColorSeleccionado}
          stats={stats}
          nivel={nivelSeleccionado}
          codGrupo={codGrupoSeleccionado}
          grupoLabel={grupoHorarioLabelCG(metaSeleccionada)}
          docente={metaSeleccionada.docente}
          bloqueado={nivelBloqueado}
          soloFechas={studentSoloFechas}
          soloFechasMsg={acc ? acc.mensaje : ''}
          esAdmin={esAdmin}
          rol={rol}
          codigoUsr={usr?.codigo || ''}
          grupoUsr={usr?.grupo || codGrupoSeleccionado}
          esSuperadmin={esSuperadmin}
          adminNombre={usr?.nombre || ''}
          cobertura={selLec ? coberturas[idLeccion(nivelSeleccionado, selLec.leccion)] : null}
          onPedirCobertura={() => setModalCobertura({ selLec })}
          onPedirEditarCerrada={() => setModalEditarCerrada({ selLec })}
          onAbrirAsistencia={() => setModalCierreAsistencia({ selLec })}
          onCerrar={() => setSelLec(null)}
          onRecargar={cargarDetalle}
        />
      </div>
      </React.Fragment>
      )}

      {modalCobertura && (
        <ModalCobertura
          selLec={modalCobertura.selLec}
          codGrupo={codGrupo}
          nivel={nivel}
          docenteTitular={meta.docente}
          adminNombre={usr?.nombre || 'admin'}
          onCerrar={() => setModalCobertura(null)}
          onAsignada={onCoberturaAsignada}
        />
      )}

      {modalEditarCerrada && (
        <ModalEditarCerrada
          selLec={modalEditarCerrada.selLec}
          codGrupo={codGrupo}
          nivel={nivel}
          superadminNombre={usr?.nombre || 'superadmin'}
          onCerrar={() => setModalEditarCerrada(null)}
          onGuardado={(mensaje) => {
            setModalEditarCerrada(null);
            showToast(mensaje || 'Lección actualizada', 'ok');
            // Forzar refetch del detalle re-tocando selLec
            setSelLec(s => (s ? { ...s } : s));
          }}
        />
      )}

      {modalCierreAsistencia && typeof ModalCierreLeccion === 'function' && (
        <ModalCierreLeccion
          lec={{
            cod_grupo: modalCierreAsistencia.selLec?.cod_grupo || codGrupoSeleccionado,
            nivel: modalCierreAsistencia.selLec?.nivel || nivelSeleccionado,
            leccion: modalCierreAsistencia.selLec?.leccion,
            fecha: modalCierreAsistencia.selLec?.fecha,
            turno: modalCierreAsistencia.selLec?.turno || cgHoraLabel(metaSeleccionada),
            tipo: modalCierreAsistencia.selLec?.tipo,
            riel: modalCierreAsistencia.selLec?.tipo === 'ICAN' ? 'ican' : 'curso',
            horario_label: modalCierreAsistencia.selLec?.grupoLabel || grupoHorarioLabelCG(metaSeleccionada),
          }}
          docenteNombre={metaSeleccionada.docente || usr?.nombre || ''}
          registradoPor={usr?.nombre || metaSeleccionada.docente || ''}
          onClose={() => setModalCierreAsistencia(null)}
          onSuccess={(res) => {
            const cerrada = modalCierreAsistencia.selLec;
            setModalCierreAsistencia(null);
            marcarLeccionCerradaLocal(cerrada);
            showToast(`Asistencia guardada ✓ · ${res?.asistencia?.presentes ?? 0} presentes, ${res?.asistencia?.ausentes ?? 0} ausentes`, 'ok');
            // En vista docente unificada el cierre se refleja localmente de inmediato;
            // en vistas no-docente seguimos refrescando la fuente normal.
            if (!agendaDocenteMode) cargar();
          }}
          onSolicitudEnviada={(mensaje) => showToast(mensaje || 'Solicitud de suspensión enviada', 'ok')}
        />
      )}

      {toast && (
        <div
          role="status"
          style={{
            position:'fixed', bottom:24, right:24, zIndex:1200,
            background: toast.kind === 'err' ? '#7A1F15' : '#1E4D2B',
            color:'#FFFFFF',
            padding:'12px 16px',
            borderRadius:'var(--r-md)',
            boxShadow:'0 12px 32px rgba(0,0,0,0.25)',
            display:'flex', alignItems:'center', gap:10,
            maxWidth:380, fontSize:13, fontWeight:600,
            letterSpacing:'0.01em',
          }}>
          <span style={{
            width:22, height:22, borderRadius:'50%',
            background:'rgba(255,255,255,0.18)',
            display:'inline-flex', alignItems:'center', justifyContent:'center',
          }}>
            {toast.kind === 'err' ? '!' : '✓'}
          </span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Estilos compartidos
// ─────────────────────────────────────────────────────────────────────────
const labelStyle = {
  fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase',
  color:'var(--ink-3)', marginBottom:6,
};
const selectStyle = {
  padding:'10px 36px 10px 14px',
  border:'1.5px solid var(--line)',
  borderRadius:'var(--r-md)',
  background:'var(--surface)',
  fontFamily:'var(--f-mono)', fontWeight:600, fontSize:13,
  color:'var(--ink)', outline:'none', cursor:'pointer',
  minWidth:280, appearance:'none',
  backgroundImage:'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%238B8178\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E")',
  backgroundRepeat:'no-repeat',
  backgroundPosition:'right 12px center',
};
const errorBoxStyle = {
  marginTop:12, padding:'10px 14px', display:'flex', justifyContent:'space-between',
  alignItems:'center', gap:10,
  background:'color-mix(in srgb, var(--danger) 6%, white)',
  border:'1px solid color-mix(in srgb, var(--danger) 25%, white)',
  borderRadius:'var(--r-sm)', fontSize:12, color:'var(--danger)',
};

// ═════════════════════════════════════════════════════════════════════════
// STUDENT-ACCESS-CALENDAR-001 — Vistas del cronograma
//   Tabs: Próxima clase · Semana · Mes · Lista
//   Doble lección por día = dos tarjetas legibles (no texto apretado).
//   NUNCA se inventan horas: solo se muestran si el backend las provee.
// ═════════════════════════════════════════════════════════════════════════

// ── Helpers de fecha/semana ────────────────────────────────────────────────
function mondayOfCG(d) {
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  const dow = (x.getDay() + 6) % 7;            // 0 = lunes
  x.setDate(x.getDate() - dow);
  return x;
}
function addDaysCG(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function weeksBetweenCG(a, b) { return Math.round((b - a) / (7 * 86400000)); }
function fmtRangoSemana(lunes) {
  const dom = addDaysCG(lunes, 6);
  const f = d => `${String(d.getDate()).padStart(2,'0')} ${MES_CORTO[d.getMonth()]}`;
  return `${f(lunes)} – ${f(dom)}`;
}

// Horas REALES de la lección — '' si el backend no las trae (no inventamos).
function horarioDe(l) {
  if (!l) return '';
  const ini = l.hora_inicio || l.horaInicio || l.inicio || '';
  const fin = l.hora_fin    || l.horaFin    || l.fin    || '';
  if (ini && fin) return `${String(ini).trim()}–${String(fin).trim()}`;
  const h = l.hora || l.horario || l.hora_text || l.horaText || '';
  if (h && typeof h === 'string' && /\d/.test(h)) return h.trim();
  return '';
}
function turnoLabel(l) {
  const t = (l && l.turno) ? String(l.turno) : '';
  if (/ma(ñ|n)ana/i.test(t)) return 'Mañana';
  if (/tarde/i.test(t)) return 'Tarde';
  if (/noche/i.test(t)) return 'Noche';
  return t.trim();
}
function ordenTurno(l) {
  const t = (l && l.turno) ? String(l.turno) : '';
  if (/ma(ñ|n)ana/i.test(t)) return 0;
  if (/tarde/i.test(t)) return 1;
  if (/noche/i.test(t)) return 2;
  return 0.5;
}
// Devuelve [lecciones] de una fecha, ordenadas Mañana→Tarde→Noche y por número.
function lecsDeFecha(mapaLecciones, fecha, fallback) {
  const raw = mapaLecciones && mapaLecciones[fecha];
  const arr = Array.isArray(raw) ? raw : (fallback ? [fallback] : []);
  return arr.slice().sort((a, b) => (ordenTurno(a) - ordenTurno(b)) || ((a?.leccion || 0) - (b?.leccion || 0)));
}

// Color/etiqueta por estado para chips de las tarjetas.
function estadoMetaCG(l) {
  const e = l.estado;
  if (e === 'FERIADO') return { label:'Feriado',  color:'#B71C1C', bg:'#FDECEA' };
  if (e === 'HOY')     return { label:'Hoy',       color:'#9A6A00', bg:'#FFF8E1' };
  if (e === 'CERRADA') return { label:'Cerrada',   color:'#2E7D32', bg:'#EBF5EB' };
  if (l.tipo === 'EVAL_ORAL' || l.tipo === 'EVAL_ESCRITO')
    return { label: TIPO_LABEL_LARGO[l.tipo], color:'#E65100', bg:'#FFF3E0' };
  if (l.tipo === 'PROGRESS_CHECK') return { label:'Progress Check', color:'#7B1FA2', bg:'#F3E5F5' };
  if (e === 'PROGRAMADA') return { label:'Programada', color:'#1565C0', bg:'#EBF0FB' };
  if (e === 'CALCULADA')  return { label:'Proyectada', color:'#1565C0', bg:'#EBF0FB' };
  return { label: e || '—', color:'var(--ink-2)', bg:'var(--surface-2)' };
}

// ── Selector de vista (tabs) ───────────────────────────────────────────────
function VistaTabsCrono({ vista, setVista }) {
  const tabs = [
    { id:'proxima', label:'Próxima clase' },
    { id:'semana',  label:'Semana' },
    { id:'mes',     label:'Mes' },
    { id:'lista',   label:'Lista' },
  ];
  return (
    <div style={{ display:'inline-flex', gap:4, padding:4, background:'var(--bg-deep)', borderRadius:'var(--r-md)' }}>
      {tabs.map(t => {
        const active = vista === t.id;
        return (
          <button key={t.id} onClick={() => setVista(t.id)} style={{
            padding:'7px 15px', borderRadius:'var(--r-sm)', border:'none',
            background: active ? 'var(--surface)' : 'transparent',
            boxShadow: active ? 'var(--sh-1)' : 'none',
            color: active ? 'var(--ink)' : 'var(--ink-3)',
            fontWeight: active ? 700 : 600, fontSize:13, cursor:'pointer',
            fontFamily:'inherit', transition:'background .15s',
          }}>{t.label}</button>
        );
      })}
    </div>
  );
}

// ── Tarjeta de una lección (bloque) — usada en Semana/Lista/Próxima ─────────
function LeccionBloque({ lec, nivel, onSelect, selected, dense }) {
  const meta = estadoMetaCG(lec);
  const hor   = horarioDe(lec);
  const turno = turnoLabel(lec);
  const isFeriado = lec.estado === 'FERIADO';
  const accent = NIVEL_COLOR_CG[nivel] || '#1565C0';

  if (isFeriado) {
    return (
      <div style={{
        padding: dense ? '10px 12px' : '12px 14px', borderRadius:'var(--r-md)',
        background:'#FDECEA', border:'1px solid #F3C9C4', display:'flex', alignItems:'center', gap:10,
      }}>
        <span style={{ fontSize:16 }}>🚫</span>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'#B71C1C' }}>Feriado</div>
          <div style={{ fontSize:11, color:'#B71C1C', opacity:0.8 }}>No hay clase este día.</div>
        </div>
      </div>
    );
  }

  return (
    <button type="button" onClick={() => onSelect && onSelect(lec)} style={{
      textAlign:'left', width:'100%', cursor:'pointer', fontFamily:'inherit',
      padding: dense ? '10px 12px' : '13px 15px', borderRadius:'var(--r-md)',
      background:'var(--surface)',
      border:`1.5px solid ${selected ? accent : 'var(--line)'}`,
      borderLeft:`4px solid ${meta.color}`,
      boxShadow: selected ? `0 0 0 2px ${accent}33` : 'none',
      display:'flex', flexDirection:'column', gap:6, transition:'border-color .12s, box-shadow .12s',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
        <span style={{
          display:'inline-flex', alignItems:'center', gap:6,
          fontSize:11, fontWeight:700, color:'var(--ink-2)', fontFamily:'var(--f-mono)',
        }}>
          {(turno || hor) ? (
            <>
              {turno && <span>{turno === 'Mañana' ? '☀' : turno === 'Tarde' ? '🌙' : '◷'} {turno}</span>}
              {hor && <span style={{ color:'var(--ink-3)' }}>· {hor}</span>}
            </>
          ) : <span style={{ color:'var(--ink-3)' }}>Horario por confirmar</span>}
        </span>
        <span style={{
          padding:'2px 8px', borderRadius:'var(--r-pill)', background:meta.bg, color:meta.color,
          fontSize:10, fontWeight:800, letterSpacing:'0.04em', whiteSpace:'nowrap',
        }}>{meta.label}</span>
      </div>
      <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
        <span style={{ fontFamily:'var(--f-mono)', fontSize:14, fontWeight:700, color:'var(--ink)' }}>
          Lección {String(lec.leccion).padStart(2,'0')}
        </span>
        {lec.tipo && lec.tipo !== 'CLASE' && (
          <span style={{ fontSize:11, color:meta.color, fontWeight:600 }}>{TIPO_LABEL_LARGO[lec.tipo]}</span>
        )}
      </div>
    </button>
  );
}

// ── VISTA: Próxima clase ────────────────────────────────────────────────────
function VistaProxima({ lecciones, mapaLecciones, stats, nivel, meta, codGrupo, onSelect }) {
  const safeLecciones = Array.isArray(lecciones) ? lecciones : [];
  const safeMapaLecciones = (mapaLecciones && typeof mapaLecciones === 'object') ? mapaLecciones : {};
  const safeStats = stats || {};
  const prox = safeStats.proxima;
  const accent = NIVEL_COLOR_CG[nivel] || '#1565C0';
  const proxExamen = safeLecciones.find(l =>
    (l.estado === 'CALCULADA' || l.estado === 'PROGRAMADA' || l.estado === 'HOY') &&
    (l.tipo === 'EVAL_ORAL' || l.tipo === 'EVAL_ESCRITO'));

  if (!prox) {
    return (
      <div className="card" style={{ padding:'44px 24px', textAlign:'center' }}>
        <div style={{ fontSize:30, opacity:0.4, marginBottom:8 }}>🎓</div>
        <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, color:'var(--ink)' }}>Curso finalizado</div>
        <div style={{ fontSize:13, color:'var(--ink-3)', marginTop:6 }}>No hay próximas clases programadas en este nivel.</div>
      </div>
    );
  }

  const lecsDia = lecsDeFecha(safeMapaLecciones, prox.fecha, prox);
  const doble   = lecsDia.length >= 2;
  const dias    = diasEntre(prox.fecha);
  const cuando  = dias === 0 ? 'Hoy' : dias === 1 ? 'Mañana' : dias > 1 ? `En ${dias} días` : '—';
  const d       = parseISO(prox.fecha);
  const diaSem  = d ? ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][d.getDay()] : '';
  const programaLbl = meta.programa === 'INA' || meta.programa === 'CON_INA' ? 'Programa INA' : 'Programa propio';

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ height:5, background:accent }} />
        <div style={{ padding:'20px 24px' }}>
          {/* Kicker + cuando */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--ink-3)' }}>
              Próxima clase
            </div>
            <span style={{
              padding:'4px 12px', borderRadius:'var(--r-pill)',
              background: dias === 0 ? '#FFF8E1' : 'color-mix(in srgb, '+accent+' 12%, white)',
              color: dias === 0 ? '#9A6A00' : accent,
              fontSize:12, fontWeight:800, letterSpacing:'0.02em',
            }}>{cuando}</span>
          </div>

          {/* Fecha grande */}
          <div style={{ marginTop:6, display:'flex', alignItems:'baseline', gap:12, flexWrap:'wrap' }}>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:34, fontWeight:500, letterSpacing:'-0.025em', color:'var(--ink)', lineHeight:1.05 }}>
              {fmtLargo(prox.fecha)}
            </div>
            <div style={{ fontSize:14, color:'var(--ink-3)' }}>{diaSem}</div>
          </div>

          {/* Bloque(s) de lección */}
          {doble && (
            <div style={{ fontSize:11, fontWeight:700, color:accent, letterSpacing:'0.04em', marginTop:14, marginBottom:6 }}>
              Este día tiene 2 lecciones
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns: doble ? 'repeat(auto-fit, minmax(220px, 1fr))' : '1fr', gap:10, marginTop: doble ? 0 : 14 }}>
            {lecsDia.map((lec, i) => (
              <LeccionBloque key={i} lec={lec} nivel={nivel} onSelect={onSelect} />
            ))}
          </div>

          {/* Meta del grupo */}
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:'12px 18px',
            marginTop:18, paddingTop:16, borderTop:'1px solid var(--line)',
          }}>
            <ProxMeta label="Grupo" value={codGrupo} mono />
            <ProxMeta label="Docente" value={meta.docente || '—'} />
            <ProxMeta label="Días" value={meta.dias || '—'} />
            <ProxMeta label="Modalidad" value={programaLbl} />
          </div>

          <div style={{ marginTop:16 }}>
            <button type="button" onClick={() => onSelect(lecsDia[0])} style={{
              display:'inline-flex', alignItems:'center', gap:8, padding:'10px 18px',
              background:'var(--an-navy, #0B1F3A)', color:'#fff', border:'none',
              borderRadius:'var(--r-md)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
            }}>
              Ver detalle de la clase →
            </button>
          </div>
        </div>
      </div>

      {/* Próximo examen */}
      {proxExamen && (
        <button type="button" onClick={() => onSelect(proxExamen)} className="card" style={{
          padding:'14px 18px', textAlign:'left', cursor:'pointer', fontFamily:'inherit',
          display:'flex', alignItems:'center', gap:14, background:'linear-gradient(135deg, #FCF6E5, #FBEEC9)',
          border:'1px solid var(--an-gold-soft, #F0DDA8)',
        }}>
          <span style={{ width:38, height:38, borderRadius:10, background:'#E65100', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:18 }}>⚡</span>
          <div>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase', color:'#6B4A00' }}>Próximo examen</div>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:16, fontWeight:500, color:'var(--an-navy-ink)', marginTop:1 }}>
              {proxExamen.tipo === 'EVAL_ORAL' ? 'Examen Oral' : 'Examen Escrito'} · Lec {String(proxExamen.leccion).padStart(2,'0')}
            </div>
            <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:1 }}>{fmtLargo(proxExamen.fecha)}</div>
          </div>
        </button>
      )}
    </div>
  );
}
function ProxMeta({ label, value, mono }) {
  return (
    <div style={{ minWidth:0 }}>
      <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', fontFamily: mono ? 'var(--f-mono)' : 'inherit', overflow:'hidden', textOverflow:'ellipsis' }}>{value}</div>
    </div>
  );
}

// ── VISTA: Semana ────────────────────────────────────────────────────────────
function VistaSemana({ lecciones, mapaLecciones, nivel, selLec, onSelect }) {
  const safeLecciones = Array.isArray(lecciones) ? lecciones : [];
  const safeMapaLecciones = (mapaLecciones && typeof mapaLecciones === 'object') ? mapaLecciones : {};
  const baseLunes = React.useMemo(() => mondayOfCG(new Date()), []);
  const initOff = React.useMemo(() => {
    const prox = safeLecciones.find(l => l.estado === 'HOY')
      || safeLecciones.find(l => l.estado === 'PROGRAMADA' || l.estado === 'CALCULADA');
    if (!prox) return 0;
    const dt = parseISO(prox.fecha);
    return dt ? weeksBetweenCG(baseLunes, mondayOfCG(dt)) : 0;
  }, [safeLecciones, baseLunes]);
  const [off, setOff] = React.useState(initOff);
  React.useEffect(() => { setOff(initOff); }, [initOff]);

  const lunes = addDaysCG(baseLunes, off * 7);
  const esActual = off === 0;
  const DIAS_NOM = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

  const dias = [];
  for (let i = 0; i < 7; i++) {
    const dd = addDaysCG(lunes, i);
    const iso = isoOf(dd);
    const lecs = lecsDeFecha(safeMapaLecciones, iso);
    if (lecs.length) dias.push({ dd, iso, nom: DIAS_NOM[i], lecs });
  }

  return (
    <div className="card" style={{ padding:18 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ fontFamily:'var(--f-sans)', fontWeight:600, fontSize:17, color:'var(--ink)' }}>
              Semana del {fmtRangoSemana(lunes)}
            </div>
            {esActual && (
              <span style={{ padding:'2px 9px', borderRadius:'var(--r-pill)', background:'#FFF8E1', color:'#9A6A00', fontSize:10, fontWeight:800, letterSpacing:'0.06em' }}>ACTUAL</span>
            )}
          </div>
          <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>{lunes.getFullYear()}</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={() => setOff(o => o - 1)} className="btn btn-ghost" style={{ padding:'7px 12px', fontSize:12 }}>← Anterior</button>
          {!esActual && <button onClick={() => setOff(0)} className="btn btn-ghost" style={{ padding:'7px 12px', fontSize:12 }}>Hoy</button>}
          <button onClick={() => setOff(o => o + 1)} className="btn btn-ghost" style={{ padding:'7px 12px', fontSize:12 }}>Siguiente →</button>
        </div>
      </div>

      {dias.length === 0 ? (
        <div style={{ padding:'40px 16px', textAlign:'center', color:'var(--ink-3)', fontSize:13 }}>
          <div style={{ fontSize:26, opacity:0.4, marginBottom:6 }}>🗓️</div>
          No hay clases programadas esta semana.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {dias.map(({ dd, nom, lecs }) => {
            const hoy = isoOf(dd) === isoOf(new Date());
            return (
              <div key={isoOf(dd)} style={{ display:'grid', gridTemplateColumns:'92px 1fr', gap:14, alignItems:'start' }}>
                <div style={{ paddingTop:4 }}>
                  <div style={{ fontSize:12, fontWeight:700, color: hoy ? '#9A6A00' : 'var(--ink-2)' }}>{nom}</div>
                  <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:600, color: hoy ? '#9A6A00' : 'var(--ink)', lineHeight:1 }}>
                    {String(dd.getDate()).padStart(2,'0')}
                  </div>
                  <div style={{ fontSize:10, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{MES_CORTO[dd.getMonth()]}</div>
                  {lecs.length >= 2 && (
                    <div style={{ marginTop:4, fontSize:9.5, fontWeight:700, color:'var(--an-granate)' }}>2 lecciones</div>
                  )}
                </div>
                <div style={{ display:'grid', gridTemplateColumns: lecs.length >= 2 ? 'repeat(auto-fit, minmax(200px, 1fr))' : '1fr', gap:10 }}>
                  {lecs.map((lec, i) => (
                    <LeccionBloque key={i} lec={lec} nivel={nivel} onSelect={onSelect}
                      selected={selLec && selLec.fecha === lec.fecha && selLec.leccion === lec.leccion} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Leyenda nivel={nivel} />
    </div>
  );
}

// ── VISTA: Lista ───────────────────────────────────────────────────────────
function VistaLista({ lecciones, mapaLecciones, nivel, selLec, onSelect }) {
  // Agrupar por fecha en orden cronológico.
  const fechas = React.useMemo(() => {
    const set = [];
    const seen = new Set();
    lecciones.slice()
      .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)) || (ordenTurno(a) - ordenTurno(b)))
      .forEach(l => { if (!seen.has(l.fecha)) { seen.add(l.fecha); set.push(l.fecha); } });
    return set;
  }, [lecciones]);

  const hoyIso = isoOf(new Date());

  return (
    <div className="card" style={{ padding:18 }}>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {fechas.map(fecha => {
          const lecs = lecsDeFecha(mapaLecciones, fecha);
          const d = parseISO(fecha);
          const diaSem = d ? ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()] : '';
          const esHoy = fecha === hoyIso;
          const doble = lecs.length >= 2;
          return (
            <div key={fecha} style={{
              display:'grid', gridTemplateColumns:'76px 1fr', gap:14, alignItems:'start',
              padding:'10px', borderRadius:'var(--r-md)',
              background: esHoy ? '#FFFBF0' : 'transparent',
              border: esHoy ? '1px solid #F0DDA8' : '1px solid transparent',
            }}>
              <div style={{ textAlign:'center', paddingTop:2 }}>
                <div style={{ fontSize:10, fontWeight:700, color: esHoy ? '#9A6A00' : 'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{diaSem}</div>
                <div style={{ fontFamily:'var(--f-serif)', fontSize:20, fontWeight:600, color: esHoy ? '#9A6A00' : 'var(--ink)', lineHeight:1.05 }}>
                  {d ? String(d.getDate()).padStart(2,'0') : '—'}
                </div>
                <div style={{ fontSize:10, color:'var(--ink-3)', textTransform:'uppercase' }}>{d ? MES_CORTO[d.getMonth()] : ''}</div>
                {doble && <div style={{ marginTop:3, fontSize:9, fontWeight:700, color:'var(--an-granate)' }}>2 lec.</div>}
              </div>
              <div style={{ display:'grid', gridTemplateColumns: doble ? 'repeat(auto-fit, minmax(200px, 1fr))' : '1fr', gap:8 }}>
                {lecs.map((lec, i) => (
                  <LeccionBloque key={i} lec={lec} nivel={nivel} onSelect={onSelect} dense
                    selected={selLec && selLec.fecha === lec.fecha && selLec.leccion === lec.leccion} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <Leyenda nivel={nivel} />
    </div>
  );
}

// ── VISTA: Mes (compacta, scroll horizontal — ya no se estira) ──────────────
function MesesVistaControl({ valor, setValor, esAlumno = false, fullRangeMonths = 4, fullRangeLabel = 'Cuatrimestre completo' }) {
  const opts = esAlumno
    ? [{ n:1, t:'Mes actual' }, { n:fullRangeMonths, t:fullRangeLabel }]
    : [{ n:1, t:'1 mes' }, { n:2, t:'2 meses' }, { n:4, t:'Cuatrimestre' }];
  return (
    <div style={{ display:'inline-flex', padding:4, borderRadius:'var(--r-pill)', background:'var(--surface)', border:'1px solid var(--line)', gap:4 }}>
      {opts.map(o => (
        <button key={`${o.n}-${o.t}`} type="button" onClick={() => setValor(o.n)} style={{
          border:'none', borderRadius:'var(--r-pill)', padding:'7px 11px', cursor:'pointer',
          background: valor === o.n ? 'var(--an-navy)' : 'transparent',
          color: valor === o.n ? '#fff' : 'var(--ink-2)', fontSize:11, fontWeight:900,
          fontFamily:'inherit'
        }}>{o.t}</button>
      ))}
    </div>
  );
}

// ── VISTA: Mes / cuatrimestre docente ──────────────────────────────────────
function VistaMes({ meses, mapaLecciones, selLec, nivel, agenda = false, mesesVista = 1, onClickLec }) {
  // CALGRUPO_F68_20260618_CUATRIMESTRE_1_2_4_MESES
  // F72: el calendario vive dentro de su propio scroll; el detalle no debe empujarse fuera de pantalla.
  const visibles = (meses || []).slice(0, Math.max(1, Number(mesesVista) || 1));
  const cols = Number(mesesVista) >= 2 ? 'repeat(2, minmax(300px, 1fr))' : 'minmax(0, 760px)';
  return (
    <div className="card" style={{ padding: agenda ? 10 : 18, background: agenda ? '#FBF7EF' : undefined, borderColor: agenda ? '#E6DCCB' : undefined }}>
      <div style={{
        display:'grid', gridTemplateColumns: cols,
        gap: agenda ? 12 : 14, justifyContent:'stretch', alignItems:'start', overflowX:'visible',
      }}>
        {visibles.map(mes => (
          <div key={`${mes.getFullYear()}-${mes.getMonth()}`} style={{ width:'100%', minWidth:0 }}>
            <Mes mes={mes} mapaLecciones={mapaLecciones} selLec={selLec} nivel={nivel} agenda={agenda} compacto={agenda || Number(mesesVista) >= 2} onClickLec={onClickLec} />
          </div>
        ))}
      </div>
      {!agenda && <Leyenda nivel={nivel} />}
    </div>
  );
}

// ── Pantallas de bloqueo de acceso (estudiante) ─────────────────────────────
function CronoAccesoBloqueo({ icon, badge, badgeColor, titulo, mensaje, accionLabel, onAccion }) {
  return (
    <div className="card" style={{ padding:'44px 30px', textAlign:'center', maxWidth:560, margin:'0 auto' }}>
      <div style={{
        width:54, height:54, margin:'0 auto 16px', borderRadius:'50%',
        background:'color-mix(in srgb, '+badgeColor+' 14%, white)', color:badgeColor,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </div>
      {badge && (
        <div style={{
          display:'inline-block', padding:'3px 11px', borderRadius:'var(--r-pill)', marginBottom:14,
          background:'color-mix(in srgb, '+badgeColor+' 12%, white)', color:badgeColor,
          fontSize:10.5, fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase',
        }}>{badge}</div>
      )}
      <div style={{ fontFamily:'var(--f-serif)', fontSize:26, fontWeight:500, letterSpacing:'-0.02em', color:'var(--an-navy-ink)', marginBottom:10 }}>{titulo}</div>
      <div style={{ fontSize:14, color:'var(--ink-2)', lineHeight:1.6, maxWidth:420, margin:'0 auto 22px' }}>{mensaje}</div>
      {accionLabel && (
        <button type="button" onClick={onAccion} className="btn btn-primary" style={{ padding:'10px 20px', fontSize:14 }}>
          {accionLabel}
        </button>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────
// F67 — Resumen agenda docente unificada
// ─────────────────────────────────────────────────────────────────────────
function AgendaDocenteResumenF72({ grupos, filtro, onFiltro, lecciones, stats, loading, error }) {
  // CALGRUPO_F74_20260618_TARJETAS_GRUPO_DOCENTE_COMO_MIS_GRUPOS
  // Filtro superior útil: tarjetas limpias con día, hora y ciclo. No se repiten códigos
  // largos ni se usa modal de selección.
  const activo = filtro || TODOS_GRUPOS;
  const totalLecciones = Array.isArray(lecciones) ? lecciones.length : (stats.total || 0);
  const gruposNorm = grupos || [];
  return (
    <div className="card" style={{ padding:'13px 15px', background:'#FBF7EF', borderColor:'#E7DCC8' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, marginBottom:12, flexWrap:'wrap' }}>
        <div>
          <div style={{ ...labelStyle, marginBottom:3 }}>Agenda docente · grupos en curso</div>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:20, fontWeight:600, color:'var(--ink)', letterSpacing:'-0.02em' }}>
            {loading ? 'Cargando agenda…' : `${gruposNorm.length} grupo${gruposNorm.length === 1 ? '' : 's'} · ${totalLecciones || 0} lecciones`}
          </div>
          {error && <div style={{ marginTop:4, fontSize:11, color:'#9A6A00' }}>⚠ {error}</div>}
        </div>
        <button type="button" onClick={() => onFiltro && onFiltro(TODOS_GRUPOS)}
          style={agendaCardFiltroStyle(activo === TODOS_GRUPOS, '#073B7A', true)}>
          <span style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', opacity:.8 }}>Vista</span>
          <strong>Todos los grupos</strong>
          <small>{gruposNorm.length} horarios activos</small>
        </button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(205px, 1fr))', gap:10 }}>
        {gruposNorm.map(g => {
          const code = g.code || g.cod_grupo || '';
          const n = normalizarNivelCG(g.nivelId || g.nivel);
          const col = NIVEL_COLOR_CG[n] || '#073B7A';
          const sched = cgScheduleFromCode(code);
          const dias = cgDiasLabel(g.dias || g.diasCode || sched.dias || '');
          const hora = cgHoraLabel(g) || 'Horario';
          const ciclo = cgCicloGrupo(code);
          const active = String(activo) === String(code);
          return (
            <button key={code} type="button" onClick={() => onFiltro && onFiltro(code)} title={grupoHorarioLabelCG(g)}
              style={agendaCardFiltroStyle(active, col)}>
              <span style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                <strong style={{ fontSize:15, lineHeight:1.1 }}>{dias}</strong>
                <em style={{ fontStyle:'normal', fontSize:10, fontWeight:900, color: active ? '#fff' : col, background: active ? 'rgba(255,255,255,.18)' : col + '18', borderRadius:999, padding:'2px 7px' }}>{n}</em>
              </span>
              <span style={{ fontSize:18, fontWeight:900, lineHeight:1 }}>{hora}</span>
              <small style={{ fontSize:12, fontWeight:800, opacity:.85 }}>{ciclo}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function agendaCardFiltroStyle(active, color, todos) {
  return {
    width:'100%',
    minHeight: todos ? 58 : 92,
    textAlign:'left',
    border:'1.8px solid ' + (active ? color : 'color-mix(in srgb, '+color+' 28%, #D7CCBC)'),
    background: active ? color : '#FFFFFF',
    color: active ? '#FFFFFF' : 'var(--ink)',
    borderRadius:'var(--r-lg)',
    padding: todos ? '10px 16px' : '13px 16px',
    cursor:'pointer',
    fontFamily:'inherit',
    display:'flex',
    flexDirection:'column',
    justifyContent:'center',
    gap: todos ? 3 : 7,
    boxShadow: active ? '0 10px 22px rgba(0,0,0,.13)' : '0 1px 0 rgba(11,31,58,.05)',
    transition:'transform .12s, box-shadow .12s, border-color .12s',
  };
}
function agendaFiltroChipStyle(active, color) { return agendaCardFiltroStyle(active, color); }


// ─────────────────────────────────────────────────────────────────────────
// Barra de 32 segmentos
// ─────────────────────────────────────────────────────────────────────────
function ProgressBar32({ lecciones, stats, loading, onClickSeg, selLec, nivel }) {
  // Para SA, lecciones.length puede ser >32; agrupamos por número de lección únicos
  const unicas = React.useMemo(() => {
    const seen = new Set();
    return lecciones.filter(l => {
      if (seen.has(l.leccion)) return false;
      seen.add(l.leccion); return true;
    });
  }, [lecciones]);

  return (
    <div className="card" style={{ padding:'14px 18px' }}>
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'baseline',
        marginBottom:10, gap:14, flexWrap:'wrap',
      }}>
        <div>
          <span style={{
            fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500,
            letterSpacing:'-0.02em', color:'var(--ink)',
          }}>
            {stats.cerradas + stats.hoy}
          </span>
          <span style={{ fontSize:14, color:'var(--ink-3)', marginLeft:6 }}>
            de 32 lecciones dadas
          </span>
        </div>
        <div style={{ fontSize:12, color:'var(--ink-2)' }}>
          {stats.proxima ? (
            <>
              Próxima:&nbsp;
              <strong style={{ color:'var(--an-navy)', fontFamily:'var(--f-mono)' }}>
                Lec {String(stats.proxima.leccion).padStart(2,'0')}
              </strong>
              &nbsp;·&nbsp;{fmtLargo(stats.proxima.fecha)}
              <span style={{ color:'var(--ink-3)' }}>
                &nbsp;({diasEntre(stats.proxima.fecha) === 0 ? 'hoy' :
                       diasEntre(stats.proxima.fecha) === 1 ? 'mañana' :
                       `en ${diasEntre(stats.proxima.fecha)} días`})
              </span>
            </>
          ) : <span style={{ color:'var(--ink-3)' }}>Curso finalizado</span>}
        </div>
      </div>

      {loading ? (
        <div style={{ height:10, background:'var(--bg-deep)', borderRadius:4 }} />
      ) : (
        <div style={{ display:'flex', gap:2, height:10 }}>
          {unicas.map(l => (
            <div key={l.leccion}
                 onClick={() => onClickSeg(l)}
                 title={`${etiquetaEvaluacionCG(l.tipo, l.leccion, true) || `Lección ${l.leccion}`} · ${fmtDDMMM(l.fecha)} · ${l.estado}`}
                 style={{
                   flex:1, height:'100%', borderRadius:2,
                   background: colorProgreso(l.estado, l.tipo, nivel),
                   cursor:'pointer',
                   boxShadow: selLec && selLec.leccion === l.leccion
                     ? '0 0 0 2px var(--ink) inset' : 'none',
                   transition: 'transform .15s',
                 }}
                 onMouseEnter={e => e.currentTarget.style.transform = 'scaleY(1.5)'}
                 onMouseLeave={e => e.currentTarget.style.transform = 'scaleY(1)'} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Mes (cuadrícula Lun-Dom)
// ─────────────────────────────────────────────────────────────────────────
function Mes({ mes, mapaLecciones, selLec, nivel, agenda = false, compacto = false, onClickLec }) {
  const year  = mes.getFullYear();
  const month = mes.getMonth();
  const primero = new Date(year, month, 1);
  const celdas = [];
  const cur = new Date(primero);
  cur.setDate(1 - primero.getDay());
  for (let i = 0; i < 42; i++) {
    const fecha = new Date(cur);
    const iso = isoOf(fecha);
    const dentro = fecha.getMonth() === month;
    const lecs = dentro ? (mapaLecciones[iso] || []) : [];
    celdas.push({ diaNum: fecha.getDate(), dentro, iso, lecs, fecha });
    cur.setDate(cur.getDate() + 1);
  }
  const diasHdr = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  return (
    <div style={{ marginBottom: agenda ? 0 : 26 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, gap:12 }}>
        <div style={{ fontFamily:'var(--f-serif)', fontSize:compacto ? 18 : 20, fontWeight:600, color:'var(--an-navy-ink)' }}>
          {MESES_NOMBRES[month]} De {year}
        </div>
        {!agenda && (
          <div style={{ padding:'6px 12px', borderRadius:'999px', border:'1px solid var(--line)', background:'#fff', fontSize:11, fontWeight:800, color:'var(--ink-2)' }}>
            Ver mes →
          </div>
        )}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4 }}>
        {diasHdr.map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:800, color:'var(--ink-3)', padding:'3px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
        {celdas.map((c, i) => (
          <CeldaDia key={i} celda={c} selLec={selLec} nivel={nivel} agenda={agenda} compacto={compacto} onClickLec={onClickLec} />
        ))}
      </div>
    </div>
  );
}

function CeldaDia({ celda, selLec, nivel, agenda = false, compacto = false, onClickLec }) {
  const { diaNum, dentro, lecs } = celda;
  const minH = compacto ? 54 : (agenda ? 66 : 72);
  if (!dentro) {
    return (
      <div style={{ minHeight:minH, borderRadius:6, padding:'6px 7px', opacity:0.38 }}>
        <div style={{ fontSize:11, color:'var(--ink-3)' }}>{diaNum}</div>
      </div>
    );
  }
  if (!lecs.length) {
    return (
      <div style={{ minHeight:minH, borderRadius:6, padding:'6px 7px', background:'var(--surface-2)', border:'1px solid var(--line)' }}>
        <div style={{ fontSize:11, color:'var(--ink-3)' }}>{diaNum}</div>
      </div>
    );
  }
  return (
    <div style={{ minHeight:minH, display:'grid', gap:4, gridTemplateRows:`repeat(${Math.max(1, lecs.length)}, minmax(${compacto ? 24 : 30}px, auto))` }}>
      {lecs.map((lec, i) => (
        <BloqueLeccion key={i} lec={lec} diaNum={i === 0 ? diaNum : null}
                       nivel={lec.nivel || nivel}
                       agenda={agenda}
                       compacto={compacto}
                       selected={selLec && selLec.fecha === lec.fecha && selLec.leccion === lec.leccion && (!lec.cod_grupo || !selLec.cod_grupo || lec.cod_grupo === selLec.cod_grupo)}
                       onClick={() => onClickLec(lec)} />
      ))}
    </div>
  );
}

function BloqueLeccion({ lec, diaNum, selected, onClick, nivel, agenda = false, compacto = false }) {
  const pal = paletaCelda(lec.estado, lec.tipo, nivel);
  const evalLabel = etiquetaEvaluacionCG(lec.tipo, lec.leccion);
  const badgeText = lec.tipo === 'ICAN'
    ? 'ICAN'
    : (evalLabel ? evalLabel.replace(/\s+/g, ' ') : `${String((lec.nivel || nivel || '')).toUpperCase()} L${String(lec.leccion).padStart(2,'0')}`);
  const isFeriado = lec.estado === 'FERIADO';
  return (
    <div
      onClick={onClick}
      style={{
        background: pal.bg,
        border:`1px solid ${selected ? pal.accent : pal.bg}`,
        borderRadius:6,
        padding: compacto ? '4px 5px' : '6px 7px',
        cursor:'pointer',
        display:'flex', flexDirection:'column', gap:4,
        boxShadow: selected ? `0 0 0 2px ${pal.accent}` : 'none',
        minHeight:0,
      }}
      onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.97)'; }}
      onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:4 }}>
        <span style={{ fontSize:11, fontWeight:700, color:pal.fg, lineHeight:1 }}>{diaNum != null ? diaNum : ''}</span>
        {isFeriado ? null : (
          <span style={{ fontSize:8.5, fontWeight:800, color:'#fff', background:'rgba(0,0,0,0.18)', borderRadius:3, padding:'1px 4px', lineHeight:1.3, whiteSpace:'nowrap' }}>
            {badgeText}
          </span>
        )}
      </div>
      {isFeriado ? (
        <div style={{ fontSize:9.5, color:pal.fg, fontWeight:700, lineHeight:1.1 }}>Fer.</div>
      ) : agenda ? (
        <div style={{ fontSize:9.2, color:pal.fg, opacity:0.92, fontWeight:800, lineHeight:1.1, whiteSpace:'nowrap' }}>
          {cgHoraLabel(lec)}
        </div>
      ) : null}
    </div>
  );
}


function AgendaAccionesLeccionF76({ selLec, detalle, nivel, rol, codigoUsr, grupoUsr, esAdmin, onAbrirAsistencia, onNavigate }) {
  if (!selLec) return null;
  const fecha = fmtDDMMM(selLec.fecha);
  const pal = paletaCelda(selLec.estado, selLec.tipo, nivel);
  const status = selLec.estado === 'CERRADA' ? 'Clase dada' : selLec.estado === 'HOY' ? 'Hoy' : selLec.estado === 'PROGRAMADA' ? 'Programada' : 'Proyectada';
  return (
    <div className="card" style={{
      marginTop:12,
      padding:'10px 12px',
      display:'grid',
      gridTemplateColumns:'minmax(220px, 1fr) auto',
      gap:12,
      alignItems:'center',
      borderLeft:`5px solid ${pal.accent}`,
      background:'#FFFFFF',
    }}>
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:10, fontWeight:900, color:'var(--ink-3)', letterSpacing:'0.12em', textTransform:'uppercase' }}>
          Lección seleccionada
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginTop:3 }}>
          <strong style={{ fontFamily:'var(--f-serif)', fontSize:18, color:'var(--ink)' }}>
            {etiquetaEvaluacionCG(selLec.tipo, selLec.leccion, true) || `Lec ${String(selLec.leccion).padStart(2,'0')}`}
          </strong>
          <span style={{ fontSize:12, fontWeight:800, color:pal.fg, background:pal.bg, borderRadius:999, padding:'4px 9px' }}>{status}</span>
          <span style={{ fontSize:12, color:'var(--ink-3)', fontWeight:700 }}>{fecha}</span>
          <span style={{ fontSize:12, color:'var(--ink-3)', fontWeight:700 }}>{cgHoraLabel(selLec)}</span>
        </div>
      </div>
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', justifyContent:'flex-end' }}>
        <button type="button" onClick={onAbrirAsistencia} style={{
          padding:'10px 14px', border:'none', borderRadius:'var(--r-md)',
          background:'var(--an-navy, #073B7A)', color:'#FFF',
          fontSize:12, fontWeight:900, cursor:'pointer', fontFamily:'inherit',
        }}>✓ Pasar asistencia</button>
        {detalle && (
          <BotonMaterialPDF
            selLec={selLec}
            nivel={nivel}
            rol={rol}
            codigoUsr={codigoUsr}
            grupoUsr={grupoUsr}
            detalle={detalle}
          />
        )}
        {selLec.tipo === 'EVAL_ESCRITO' && onNavigate && (
          <button type="button" onClick={() => onNavigate('examenes')} style={{
            padding:'10px 14px', border:'1.5px solid var(--an-navy, #073B7A)',
            borderRadius:'var(--r-md)', background:'var(--surface)', color:'var(--an-navy, #073B7A)',
            fontSize:12, fontWeight:900, cursor:'pointer', fontFamily:'inherit',
          }}>Ver exámenes</button>
        )}
        {selLec.tipo === 'EVAL_ORAL' && onNavigate && (
          <button type="button" onClick={() => onNavigate('examen_oral', { oral: contextoOralCG(selLec, nivel) })} style={{
            padding:'10px 14px', border:'1.5px solid #8B1A10', borderRadius:'var(--r-md)',
            background:'var(--surface)', color:'#8B1A10', fontSize:12, fontWeight:900,
            cursor:'pointer', fontFamily:'inherit',
          }}>{`Aplicar ${etiquetaEvaluacionCG(selLec.tipo, selLec.leccion) || 'oral'}`}</button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Panel de detalle (sticky a la derecha)
// ─────────────────────────────────────────────────────────────────────────
function PanelDetalle({ agendaDocente = false, selLec, detalle, cargando, nivelColor, stats, nivel, codGrupo, grupoLabel, docente, bloqueado, soloFechas, soloFechasMsg, esAdmin, rol, codigoUsr, grupoUsr, esSuperadmin, adminNombre, cobertura, onPedirCobertura, onPedirEditarCerrada, onAbrirAsistencia, onCerrar, onRecargar, onNavigate }) {
  return (
    <div className="cg-panel-f984e" style={{
      // CALGRUPO_F73_20260618_PANEL_DETALLE_FIJO_VISIBLE
      position:'sticky', top: agendaDocente ? 8 : 12,
      alignSelf:'start',
      height: agendaDocente ? 'calc(100dvh - 156px)' : 'calc(100dvh - 24px)',
      maxHeight: agendaDocente ? 'calc(100dvh - 156px)' : 'calc(100dvh - 24px)',
      overflowY:'auto', overflowX:'hidden', paddingRight:6, paddingBottom:8,
      display:'flex', flexDirection:'column', gap:10,
      scrollbarGutter:'stable',
    }}>

      {/* Resumen del nivel */}
      <div className="card" style={{ padding: agendaDocente ? 10 : 16, overflow:'hidden', position:'relative' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:nivelColor }} />
        <div style={{ marginTop:4 }}>
          <div style={labelStyle}>Nivel activo</div>
          <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
            <span style={{
              fontFamily:'var(--f-mono)', fontSize: agendaDocente ? 18 : 22, fontWeight:700, color:nivelColor,
            }}>{nivel}</span>
            <span style={{
              fontFamily:'var(--f-serif)', fontWeight:500, fontSize: agendaDocente ? 13 : 15,
              color:'var(--ink)', letterSpacing:'-0.015em',
            }}>{NIVEL_LABEL_CG[nivel]}</span>
            {bloqueado && (
              <span style={{
                marginLeft:'auto', padding:'2px 8px', fontSize:10, fontWeight:700,
                background:'color-mix(in srgb, var(--ink-3) 15%, white)',
                color:'var(--ink-2)', borderRadius:'var(--r-pill)',
                letterSpacing:'0.06em', display:'inline-flex', alignItems:'center', gap:4,
              }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                BLOQUEADO
              </span>
            )}
          </div>
        </div>
        <div style={{
          display:'grid', gridTemplateColumns:'repeat(3, 1fr)',
          gap:6, marginTop: agendaDocente ? 8 : 12, textAlign:'center',
        }}>
          <MiniStat n={stats.cerradas + stats.hoy} l="dadas" c="#2E7D32" />
          <MiniStat n={stats.feriados}             l="feriados" c="#C67100" />
          <MiniStat n={stats.calculadas}           l="por venir" c="#1565C0" />
        </div>
      </div>

      {/* Detalle de la lección seleccionada */}
      {selLec ? (
        <DetalleLeccion
          onNavigate={onNavigate}
          selLec={selLec}
          detalle={detalle}
          cargando={cargando}
          nivel={nivel}
          bloqueado={bloqueado}
          soloFechas={soloFechas}
          soloFechasMsg={soloFechasMsg}
          esAdmin={esAdmin}
          rol={rol}
          codigoUsr={codigoUsr}
          grupoUsr={grupoUsr}
          esSuperadmin={esSuperadmin}
          cobertura={cobertura}
          docenteTitular={docente}
          onAbrirAsistencia={onAbrirAsistencia}
          onPedirCobertura={onPedirCobertura}
          onPedirEditarCerrada={onPedirEditarCerrada}
          onCerrar={onCerrar}
          onRecargar={onRecargar}
        />
      ) : (
        <div className="card" style={{ padding:'24px 18px', textAlign:'center' }}>
          <div style={{ fontSize:30, marginBottom:6, opacity:0.4 }}>📅</div>
          <div style={{ fontSize:12, color:'var(--ink-3)' }}>
            Seleccioná una lección del calendario para ver el detalle.
          </div>
        </div>
      )}

      {/* Información técnica plegable: no ocupa el espacio de las acciones */}
    </div>
  );
}

function DetalleLeccion({ selLec, detalle, cargando, nivel, bloqueado, soloFechas, soloFechasMsg, esAdmin, rol, codigoUsr, grupoUsr, esSuperadmin, cobertura, docenteTitular, onAbrirAsistencia, onPedirCobertura, onPedirEditarCerrada, onCerrar, onRecargar, onNavigate }) {
  const pal = paletaCelda(selLec.estado, selLec.tipo, nivel);
  const isFeriado = selLec.estado === 'FERIADO';
  const feriadoName = FERIADOS_CR_NAMES[selLec.fecha] || 'Feriado nacional';
  const dias = diasEntre(selLec.fecha);
  const estadoLabel =
    selLec.estado === 'CERRADA'    ? '✓ Clase dada' :
    selLec.estado === 'HOY'        ? '● Hoy' :
    selLec.estado === 'PROGRAMADA' ? '○ Programada' :
    selLec.estado === 'CALCULADA'  ? '○ Proyectada' : '🚫 Feriado CR';

  // Color "apagado" para nivel bloqueado: ignoramos la paleta normal
  const palVis = bloqueado && !isFeriado
    ? { bg:'#F2EFEA', fg:'#6A6058', accent:'#8B8178' }
    : pal;

  return (
    <div className="card" style={{ padding:0, overflow:'hidden' }}>
      <div style={{ height:4, background: palVis.accent }} />
      <div style={{ padding: rol === 'teacher' ? '10px 12px 12px' : '14px 18px 18px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
          <div>
            <div style={{ ...labelStyle, marginBottom:4 }}>
              {isFeriado ? 'Feriado' : selLec.leccion ? `${etiquetaEvaluacionCG(selLec.tipo, selLec.leccion, true) || `Lección ${String(selLec.leccion).padStart(2,'0')}`} · ${idLeccion(nivel, selLec.leccion)}` : 'Sin lección asignada'}
            </div>
            <div style={{
              fontFamily:'var(--f-serif)', fontSize: rol === 'teacher' ? 18 : 20, fontWeight:500,
              color:'var(--ink)', lineHeight:1.15, letterSpacing:'-0.02em',
            }}>
              {fmtLargo(selLec.fecha)}
            </div>
            <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:3 }}>
              {selLec.dia}
              {selLec.turno && <> · {selLec.turno}</>}
              {dias === 0 ? '' : dias === 1 ? ' · mañana' : dias > 1 ? ` · en ${dias} días` : ` · hace ${-dias} días`}
            </div>
          </div>
          <button onClick={onCerrar} title="Cerrar"
                  style={{ background:'none', border:'none', cursor:'pointer',
                           padding:4, color:'var(--ink-3)', lineHeight:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Status badge */}
        <div style={{
          marginTop:10,
          display:'inline-block',
          padding:'4px 10px',
          background: palVis.bg,
          color: palVis.fg,
          fontSize:11, fontWeight:700, letterSpacing:'0.04em',
          borderRadius:'var(--r-pill)',
        }}>
          {estadoLabel}
        </div>
        {!isFeriado && selLec.tipo !== 'CLASE' && !bloqueado && (() => {
          const tipoExtraLabel = etiquetaEvaluacionCG(selLec.tipo, selLec.leccion, true) || TIPO_LABEL_LARGO[selLec.tipo] || '';
          return tipoExtraLabel ? (
            <div style={{
              marginLeft:6, display:'inline-block',
              padding:'4px 10px', background: pal.accent, color:'white',
              fontSize:11, fontWeight:700, letterSpacing:'0.04em',
              borderRadius:'var(--r-pill)',
            }}>
              {tipoExtraLabel}
            </div>
          ) : null;
        })()}

        {!isFeriado && !bloqueado && esAdmin && (
          <div style={{
            // Acciones siempre visibles arriba del material.
            display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8, alignItems:'stretch',
            position:'sticky', top:0, zIndex:5,
            background:'#FFFFFFEE', backdropFilter:'blur(6px)',
            padding:'8px 0 10px', borderBottom:'1px solid var(--line)',
          }}>
            <button type="button" onClick={onAbrirAsistencia} style={{
              display:'inline-flex', alignItems:'center', gap:7,
              padding:'9px 10px', border:'none', borderRadius:'var(--r-md)',
              background:'var(--an-navy, #073B7A)', color:'#FFF',
              fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:'inherit',
            }}>✓ Pasar asistencia</button>
            {detalle && !soloFechas && (
              <div style={{ flex:'1 1 155px', minWidth:150 }}>
                <BotonMaterialPDF
                  selLec={selLec}
                  nivel={nivel}
                  rol={rol}
                  codigoUsr={codigoUsr}
                  grupoUsr={grupoUsr}
                  detalle={detalle}
                />
              </div>
            )}
            {selLec.tipo === 'EVAL_ESCRITO' && onNavigate && (
              <button type="button" onClick={() => onNavigate('examenes')} style={{
                padding:'9px 10px', border:'1.5px solid var(--an-navy, #073B7A)',
                borderRadius:'var(--r-md)', background:'var(--surface)', color:'var(--an-navy, #073B7A)',
                fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:'inherit',
              }}>Ver exámenes escritos</button>
            )}
            {selLec.tipo === 'EVAL_ORAL' && onNavigate && (
              <button type="button" onClick={() => onNavigate('examen_oral', { oral: contextoOralCG(selLec, nivel) })} style={{
                padding:'9px 10px', border:'1.5px solid #8B1A10', borderRadius:'var(--r-md)',
                background:'var(--surface)', color:'#8B1A10', fontSize:12, fontWeight:800,
                cursor:'pointer', fontFamily:'inherit',
              }}>{`Aplicar ${etiquetaEvaluacionCG(selLec.tipo, selLec.leccion) || 'examen oral'}`}</button>
            )}
          </div>
        )}

        {/* Cuerpo */}
        {isFeriado ? (
          <div style={{
            marginTop:14, padding:'14px 14px',
            background: pal.bg,
            border: `1px solid ${pal.accent}33`,
            borderRadius:'var(--r-md)',
          }}>
            <div style={{ fontSize:24, marginBottom:6 }}>🚫</div>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:16, fontWeight:500, color:pal.fg }}>
              {feriadoName}
            </div>
            <div style={{ fontSize:11, color:pal.fg, opacity:0.8, marginTop:4 }}>
              No hay clase este día. La lección se proyecta al siguiente día hábil.
            </div>
          </div>
        ) : bloqueado ? (
          <div style={{
            marginTop:14, padding:'18px 16px',
            background: '#F6F2EC',
            border: '1px dashed #C9BFB1',
            borderRadius:'var(--r-md)',
            textAlign:'center',
          }}>
            <div style={{
              width:42, height:42, margin:'0 auto 10px',
              borderRadius:'50%', background:'#E7DECD',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#6A6058',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div style={{
              fontFamily:'var(--f-serif)', fontSize:16, fontWeight:600,
              color:'var(--ink)', letterSpacing:'-0.015em', marginBottom:4,
            }}>
              Nivel bloqueado
            </div>
            <div style={{ fontSize:12, color:'var(--ink-2)', lineHeight:1.5, maxWidth:260, margin:'0 auto' }}>
              Completá los niveles anteriores para acceder al título,
              temas y material de esta lección.
            </div>
            <div style={{
              marginTop:12, fontSize:10, color:'var(--ink-3)',
              fontFamily:'var(--f-mono)', letterSpacing:'0.06em',
            }}>
              {idLeccion(nivel, selLec.leccion)} · {fmtDDMMM(selLec.fecha)}
            </div>
          </div>
        ) : cargando ? (
          <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:6 }}>
            <div style={skeletonLine(70)} />
            <div style={skeletonLine(40)} />
            <div style={skeletonLine(85)} />
          </div>
        ) : !detalle ? (
          <div style={{
            marginTop:14, padding:'16px 14px',
            background:'#FBF6EE',
            border:'1px dashed var(--line-2)',
            borderRadius:'var(--r-md)',
            textAlign:'center',
          }}>
            <div style={{
              width:38, height:38, margin:'0 auto 8px',
              borderRadius:'50%', background:'#F1E8D6',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'var(--an-granate, #8E1B2C)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4M12 17h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z"/>
              </svg>
            </div>
            <div style={{
              fontFamily:'var(--f-serif)', fontSize:14, fontWeight:600,
              color:'var(--ink)', letterSpacing:'-0.01em', marginBottom:4,
            }}>
              No se pudo cargar el detalle
            </div>
            <div style={{ fontSize:11, color:'var(--ink-3)', lineHeight:1.5, maxWidth:240, margin:'0 auto 12px' }}>
              No recibimos los datos de esta lección. Probá de nuevo en unos segundos.
            </div>
            {onRecargar && (
              <button
                type="button"
                onClick={onRecargar}
                style={{
                  display:'inline-flex', alignItems:'center', gap:6,
                  padding:'7px 14px',
                  background:'var(--an-navy, #0B1F3A)',
                  color:'#FFF',
                  border:'none',
                  borderRadius:'var(--r-sm, 6px)',
                  fontSize:11, fontWeight:600,
                  letterSpacing:'0.04em',
                  cursor:'pointer',
                  fontFamily:'inherit',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Reintentar
              </button>
            )}
          </div>
        ) : (
          <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:12 }}>
            {/* Cobertura aplicada — banner */}
            {cobertura && (
              <div style={{
                padding:'10px 12px',
                background:'#F1F8E9',
                border:'1px solid #C5E1A5',
                borderRadius:'var(--r-md)',
                display:'flex', alignItems:'flex-start', gap:10,
              }}>
                <span style={{
                  width:22, height:22, flexShrink:0, borderRadius:'50%',
                  background:'#2E7D32', color:'#FFF',
                  display:'inline-flex', alignItems:'center', justifyContent:'center',
                  fontSize:13, fontWeight:800,
                }}>✓</span>
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{
                    fontSize:9, fontWeight:700, letterSpacing:'0.12em',
                    textTransform:'uppercase', color:'#1B5E20', marginBottom:2,
                  }}>
                    Cobertura asignada
                  </div>
                  <div style={{ fontSize:13, color:'var(--ink)', fontWeight:600, lineHeight:1.35 }}>
                    {cobertura.docente_cobertura}
                  </div>
                  {cobertura.docente_anterior && (
                    <div style={{
                      fontSize:11, color:'var(--ink-3)', marginTop:2,
                      textDecoration:'line-through',
                    }}>
                      Titular: {cobertura.docente_anterior}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Unidad + título */}
            <div>
              {detalle.unidad && (
                <div style={{
                  fontSize:10, fontWeight:700, color:'var(--ink-3)',
                  letterSpacing:'0.1em', textTransform:'uppercase',
                }}>
                  {detalle.unidad}
                </div>
              )}
              <div style={{
                fontFamily:'var(--f-serif)', fontSize:17, fontWeight:600,
                color:'var(--ink)', lineHeight:1.25, letterSpacing:'-0.015em',
                marginTop:2,
              }}>
                {detalle.titulo || 'Sin título registrado'}
              </div>
            </div>

            {/* F98.4-E: acciones del estudiante siempre visibles antes del detalle largo */}
            {rol === 'student' && !soloFechas && (
              <div style={{
                position:'sticky', top:0, zIndex:6,
                background:'rgba(255,255,255,.97)', backdropFilter:'blur(7px)',
                padding:'10px 0 11px', borderBottom:'1px solid var(--line)',
                display:'grid', gap:8,
              }}>
                <BotonMaterialPDF
                  selLec={selLec}
                  nivel={nivel}
                  rol={rol}
                  codigoUsr={codigoUsr}
                  grupoUsr={grupoUsr}
                  detalle={detalle}
                />
                <AccionesClaseEstudiante
                  selLec={selLec}
                  detalle={detalle}
                  nivel={nivel}
                  codigoUsr={codigoUsr}
                  grupoUsr={grupoUsr}
                  onNavigate={onNavigate}
                />
              </div>
            )}

            {/* Objetivo */}
            {detalle.objetivo && (
              <Bloque titulo="Objetivo" texto={detalle.objetivo} />
            )}

            {/* Temas */}
            {detalle.speaking      && <Bloque titulo="Speaking"      texto={detalle.speaking} compact />}
            {detalle.grammar       && <Bloque titulo="Grammar"       texto={detalle.grammar} compact />}
            {detalle.pronunciacion && <Bloque titulo="Pronunciación" texto={detalle.pronunciacion} compact />}
            {detalle.writing       && <Bloque titulo="Writing"       texto={detalle.writing} compact />}

            {/* STUDENT-ACCESS-CALENDAR-001: en CALENDAR_ONLY (matrícula pagada
                sin primera cuota) el estudiante ve fecha/horario/tema básico
                pero NO material ni Zoom. */}
            {soloFechas ? (
              <div style={{
                marginTop:2, padding:'12px 14px', display:'flex', gap:10, alignItems:'flex-start',
                background:'color-mix(in srgb, var(--an-gold) 10%, white)',
                border:'1px dashed color-mix(in srgb, var(--an-gold) 40%, white)',
                borderRadius:'var(--r-md)', fontSize:12, color:'#6B4A00', lineHeight:1.5,
              }}>
                <span style={{ color:'#9A6A00', flexShrink:0, marginTop:1 }}><IconoCandado /></span>
                <span>Material disponible al cancelar la primera cuota.</span>
              </div>
            ) : (
              <>
              </>
            )}

            {/* Botón Asignar cobertura — solo admin + lección PROGRAMADA */}
            {esAdmin && selLec.estado === 'PROGRAMADA' && (
              <button
                type="button"
                onClick={onPedirCobertura}
                style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  padding:'10px 14px',
                  background:'var(--surface)',
                  border:'1.5px solid var(--ink)',
                  color:'var(--ink)',
                  fontSize:13, fontWeight:700,
                  borderRadius:'var(--r-md)',
                  cursor:'pointer',
                  letterSpacing:'0.02em',
                  marginTop: detalle.pdf_drive_id ? 0 : 2,
                  fontFamily:'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-deep)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 1l4 4-4 4"/>
                  <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                  <path d="M7 23l-4-4 4-4"/>
                  <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
                {cobertura ? 'Reasignar cobertura' : 'Asignar cobertura'}
              </button>
            )}

            {/* Botón Editar (SUPERADMIN) — solo lecciones CERRADA/CALCULADA */}
            {esSuperadmin && (selLec.estado === 'CERRADA' || selLec.estado === 'CALCULADA') && (
              <button
                type="button"
                onClick={onPedirEditarCerrada}
                title="Acción reservada para superadmin: edita datos de una lección ya cerrada."
                style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  padding:'10px 14px',
                  background:'#FFF8E1',
                  border:'1.5px dashed #9A6A00',
                  color:'#9A6A00',
                  fontSize:12, fontWeight:700,
                  borderRadius:'var(--r-md)',
                  cursor:'pointer',
                  letterSpacing:'0.04em',
                  textTransform:'uppercase',
                  marginTop:2,
                  fontFamily:'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FFECB3'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FFF8E1'; }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  <path d="M11 15.5l1.5 1.5L16 13"/>
                </svg>
                Editar lección cerrada
                <span style={{
                  marginLeft:4, padding:'2px 6px',
                  background:'#9A6A00', color:'#FFF',
                  borderRadius:'var(--r-pill)',
                  fontSize:9, letterSpacing:'0.1em',
                }}>SUPERADMIN</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Bloque({ titulo, texto, compact }) {
  return (
    <div>
      <div style={{
        fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase',
        color:'var(--ink-3)', marginBottom:3,
      }}>{titulo}</div>
      <div style={{
        fontSize: compact ? 11.5 : 12.4,
        color:'var(--ink-2)', lineHeight:1.38,
      }}>{texto}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Botón de planeamiento PDF. En estudiante abre el PDF oficial directamente.
// Backend v4.22.4: getMaterialLeccion decide acceso por rol/estado.
// ─────────────────────────────────────────────────────────────────
// STUDENT-LEARNING-EXPERIENCE-001 — Acciones de clase para el estudiante.
// getZoomLinkClase: devuelve un link REAL de Zoom/Meet de la lección o su
// detalle si existe; si ningún campo es una URL http(s) válida → '' (no se
// inventa nada). AccionesClaseEstudiante: "Abrir Zoom" solo si hay link (si no,
// mensaje honesto) + "Ver materiales de esta clase" → Biblioteca filtrada.
function AccionesClaseEstudiante({ selLec, detalle, nivel, codigoUsr, grupoUsr, onNavigate }) {
  const [sesionClase, setSesionClase] = React.useState({ estado:'CARGANDO', activa:false, link:'' });

  React.useEffect(() => {
    let vivo = true;
    setSesionClase({ estado:'CARGANDO', activa:false, link:'' });
    postCronoGrupo('getSesionClaseEstudiante', {
      codigo:codigoUsr,
      cod_grupo:grupoUsr,
      nivel,
      leccion:selLec?.leccion,
      fecha:selLec?.fecha,
    }, 18000).then(r => {
      if (!vivo) return;
      if (r?.ok) setSesionClase({ estado:r.estado || 'NO_DISPONIBLE', activa:!!r.activa, link:r.link || '' });
      else setSesionClase({ estado:'ERROR', activa:false, link:'' });
    }).catch(() => { if (vivo) setSesionClase({ estado:'ERROR', activa:false, link:'' }); });
    return () => { vivo = false; };
  }, [codigoUsr, grupoUsr, nivel, selLec?.leccion, selLec?.fecha]);

  const irBiblioteca = (focus) => {
    try { sessionStorage.setItem('an_biblioteca_focus', focus); } catch (_) {}
    if (onNavigate) onNavigate('materiales', { lesson:selLec.leccion });
  };

  const estadoTexto =
    sesionClase.estado === 'CARGANDO' ? 'Verificando la sesión de clase…' :
    sesionClase.estado === 'FUTURA' ? 'El enlace se habilitará cuando el docente inicie la clase.' :
    sesionClase.estado === 'NO_INICIADA' ? 'La clase de hoy aún no ha sido iniciada.' :
    sesionClase.estado === 'ERROR' ? 'No se pudo verificar el enlace de la clase.' : '';

  return (
    <div style={{ display:'grid', gap:8 }}>
      {sesionClase.activa && sesionClase.link ? (
        <a href={sesionClase.link} target="_blank" rel="noopener noreferrer"
           style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px 14px', background:'#1565C0', color:'#fff', borderRadius:'var(--r-md)', fontSize:13, fontWeight:800, textDecoration:'none', letterSpacing:'0.02em' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
          Entrar a clase
        </a>
      ) : estadoTexto ? (
        <div style={{ padding:'9px 12px', background:'var(--surface-2)', border:'1px dashed var(--line-2)', borderRadius:'var(--r-md)', fontSize:11.5, color:'var(--ink-3)', textAlign:'center', lineHeight:1.45 }}>
          {estadoTexto}
        </div>
      ) : null}

      {onNavigate && selLec?.leccion && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <button type="button" onClick={() => irBiblioteca('libros')} style={studentActionButtonStyleCG('#073B7A')}>📘 Libros y workbook</button>
          <button type="button" onClick={() => irBiblioteca('audios')} style={studentActionButtonStyleCG('#6B4BA1')}>🎧 Audios por unidad</button>
          <button type="button" onClick={() => irBiblioteca('recursos')} style={studentActionButtonStyleCG('#2E7D32')}>📚 Recursos adicionales</button>
          <button type="button" onClick={() => irBiblioteca('leccion')} style={studentActionButtonStyleCG('#8B1A10')}>▶ Biblioteca de la lección</button>
        </div>
      )}
    </div>
  );
}

function studentActionButtonStyleCG(color) {
  return {
    display:'flex', alignItems:'center', justifyContent:'center', gap:6,
    padding:'9px 8px', background:'#fff', border:`1.4px solid ${color}`,
    color, fontSize:11.2, fontWeight:800, borderRadius:'var(--r-md)',
    cursor:'pointer', fontFamily:'inherit', lineHeight:1.25, textAlign:'center'
  };
}

function BotonMaterialPDF({ selLec, nivel, rol, codigoUsr, grupoUsr, detalle }) {
  const [mat, setMat]           = React.useState(null);
  const [cargando, setCargando] = React.useState(true);
  const [errRed, setErrRed]     = React.useState(false);
  const [abierto, setAbierto]   = React.useState(false);

  const leccionNum = selLec.leccion;
  const tipo       = selLec.tipo;
  const riel       = tipo === 'ICAN' ? 'ican' : 'curso';

  React.useEffect(() => {
    let vivo = true;
    setMat(null);
    setErrRed(false);
    setCargando(true);
    setAbierto(false);

    const helper = window.fetchMaterialLeccion;
    if (typeof helper !== 'function') {
      // Helper no cargado — degradar a fallback con pdf_drive_id si existe.
      setCargando(false);
      return () => { vivo = false; };
    }

    helper({
      nivel,
      leccion: leccionNum,
      riel,
      rol,
      codigo:    rol === 'student' ? codigoUsr : undefined,
      cod_grupo: rol === 'student' ? grupoUsr  : undefined,
    })
      .then(d => { if (vivo) setMat(d || { ok: false }); })
      .catch(()=> { if (vivo) setErrRed(true); })
      .finally(()=>{ if (vivo) setCargando(false); });

    return () => { vivo = false; };
  }, [leccionNum, tipo, nivel, rol, codigoUsr, grupoUsr, riel]);

  // Skeleton mientras consulta permisos
  if (cargando) {
    return (
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        padding:'10px 14px',
        background:'var(--bg-deep)',
        border:'1px dashed var(--line)',
        borderRadius:'var(--r-md)',
        fontSize:12, color:'var(--ink-3)',
        letterSpacing:'0.04em', marginTop:2,
      }}>
        <span style={{
          width:12, height:12, borderRadius:'50%',
          border:'2px solid var(--line)',
          borderTopColor:'var(--ink-3)',
          animation:'an-spin .8s linear infinite',
          display:'inline-block',
        }} />
        Verificando material…
      </div>
    );
  }

  // Fallback de red: nunca usar el PDF legacy del detalle para estudiantes,
  // porque ese campo puede corresponder al material interno del docente.
  if (errRed || !mat || mat.ok === false) {
    if (rol !== 'student' && detalle && detalle.pdf_drive_id) {
      return (
        <a
          href={`https://drive.google.com/file/d/${detalle.pdf_drive_id}/view`}
          target="_blank" rel="noopener noreferrer"
          style={btnPDFActivo}>
          <IconoPDF />
          Ver planeamiento PDF
        </a>
      );
    }
    return (
      <button type="button" disabled
        title="No se pudo verificar el planeamiento. Reintentá más tarde."
        style={btnPDFDisabled}>
        <IconoPDF />
        Planeamiento no disponible
      </button>
    );
  }

  // Sin acceso: botón deshabilitado, motivo en tooltip
  if (!mat.acceso) {
    const motivo = mat.motivo || 'Material disponible solo para estudiantes activos.';
    return (
      <button type="button" disabled
        title={motivo}
        style={btnPDFDisabled}>
        <IconoCandado />
        Material disponible al rematricularte
      </button>
    );
  }

  // Estudiante: abrir directamente el PDF oficial de planeamiento en Drive.
  // Se elimina el modal interno que quedaba atrapado dentro del panel derecho.
  if (rol === 'student') {
    const hrefPlaneamiento = mat.pdf_url || (mat.pdf_id ? `https://drive.google.com/file/d/${mat.pdf_id}/view` : '');
    if (!hrefPlaneamiento) {
      return (
        <button type="button" disabled style={btnPDFDisabled}>
          <IconoPDF />
          Planeamiento no disponible
        </button>
      );
    }
    return (
      <a
        href={hrefPlaneamiento}
        target="_blank"
        rel="noopener noreferrer"
        style={btnPDFActivo}
      >
        <IconoPDF />
        Ver planeamiento PDF
        <span style={{
          marginLeft:6, padding:'2px 7px', borderRadius:'var(--r-pill)',
          background:'rgba(255,255,255,0.18)', fontSize:10, fontWeight:700,
          letterSpacing:'0.08em', textTransform:'uppercase',
        }}>Estudiante</span>
      </a>
    );
  }

  // Docente y administración conservan el visor embebido interno.
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        style={{ ...btnPDFActivo, border:'none', cursor:'pointer', fontFamily:'inherit' }}>
        <IconoPDF />
        Ver planeamiento PDF
        {mat.tipo_pdf === 'estudiante' && (
          <span style={{
            marginLeft:6, padding:'2px 7px', borderRadius:'var(--r-pill)',
            background:'rgba(255,255,255,0.18)', fontSize:10, fontWeight:700,
            letterSpacing:'0.08em', textTransform:'uppercase',
          }}>Estudiante</span>
        )}
        {mat.tipo_pdf === 'profe' && (
          <span style={{
            marginLeft:6, padding:'2px 7px', borderRadius:'var(--r-pill)',
            background:'rgba(255,255,255,0.18)', fontSize:10, fontWeight:700,
            letterSpacing:'0.08em', textTransform:'uppercase',
          }}>Profe</span>
        )}
      </button>

      {abierto && (
        <ModalPDF
          pdfId={mat.pdf_id}
          pdfUrl={mat.pdf_url}
          titulo={mat.titulo || detalle?.titulo || ''}
          unidad={mat.unidad || detalle?.unidad || ''}
          leccion={leccionNum}
          nivel={nivel}
          tipoPdf={mat.tipo_pdf}
          onCerrar={() => setAbierto(false)}
        />
      )}
    </>
  );
}

const btnPDFActivo = {
  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
  padding:'10px 14px',
  background:'var(--an-granate)', color:'white',
  fontSize:13, fontWeight:700,
  borderRadius:'var(--r-md)',
  textDecoration:'none',
  letterSpacing:'0.02em',
  marginTop:2,
};
const btnPDFDisabled = {
  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
  padding:'10px 14px',
  background:'var(--bg-deep)',
  border:'1.5px solid var(--line)',
  color:'var(--ink-3)',
  fontSize:13, fontWeight:600,
  borderRadius:'var(--r-md)',
  cursor:'not-allowed',
  letterSpacing:'0.02em',
  marginTop:2,
  fontFamily:'inherit',
};
function IconoPDF() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M9 13h6M9 17h4"/>
    </svg>
  );
}
function IconoCandado() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function ModalPDF({ pdfId, pdfUrl, titulo, unidad, leccion, nivel, tipoPdf, onCerrar }) {
  // ESC cierra
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onCerrar]);

  const colorNivel = NIVEL_COLOR_CG[nivel] || 'var(--an-navy)';
  const idLec = idLeccion(nivel, leccion);
  const embedUrl = `https://drive.google.com/file/d/${pdfId}/preview`;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
      style={{
        position:'fixed', inset:0, zIndex:1100,
        background:'rgba(20, 16, 12, 0.65)',
        backdropFilter:'blur(4px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'min(3vh, 24px) min(3vw, 24px)',
        animation:'an-fade-in .14s ease-out',
      }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Material PDF — ${titulo}`}
        style={{
          width:'100%', height:'100%',
          maxWidth: 1080,
          background:'var(--surface)',
          borderRadius:'var(--r-lg, 12px)',
          boxShadow:'0 24px 64px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.18)',
          overflow:'hidden',
          display:'flex', flexDirection:'column',
        }}>
        {/* Header — banda con color del nivel */}
        <div style={{
          padding:'12px 18px 12px 18px',
          borderBottom:'1px solid var(--line)',
          background:'var(--surface)',
          display:'flex', alignItems:'center', gap:14,
        }}>
          {/* Pill nivel */}
          <div style={{
            display:'inline-flex', alignItems:'center', gap:8,
            padding:'4px 10px',
            background:`${colorNivel}18`,
            border:`1px solid ${colorNivel}55`,
            borderRadius:'var(--r-pill)',
            flexShrink:0,
          }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:colorNivel }} />
            <span style={{
              fontSize:10, fontWeight:800, color:colorNivel,
              letterSpacing:'0.12em', textTransform:'uppercase',
            }}>{idLec}</span>
          </div>

          <div style={{ minWidth:0, flex:1 }}>
            {unidad && (
              <div style={{
                fontSize:10, fontWeight:700, letterSpacing:'0.14em',
                textTransform:'uppercase', color:'var(--ink-3)',
              }}>{unidad}</div>
            )}
            <div style={{
              fontFamily:'var(--f-serif)', fontSize:17, fontWeight:600,
              color:'var(--ink)', letterSpacing:'-0.015em', lineHeight:1.2,
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>
              {titulo || 'Material de la lección'}
            </div>
          </div>

          {/* Abrir en Drive */}
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank" rel="noopener noreferrer"
              style={{
                display:'inline-flex', alignItems:'center', gap:7,
                padding:'8px 14px',
                background:'var(--surface)',
                border:'1.5px solid var(--ink)',
                color:'var(--ink)',
                fontSize:12, fontWeight:700,
                borderRadius:'var(--r-md)',
                textDecoration:'none',
                letterSpacing:'0.02em',
                whiteSpace:'nowrap',
                flexShrink:0,
              }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <path d="M15 3h6v6M10 14L21 3"/>
              </svg>
              Abrir en Drive
            </a>
          )}

          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            style={{
              background:'none', border:'none', cursor:'pointer',
              padding:6, color:'var(--ink-2)', lineHeight:0,
              borderRadius:'var(--r-sm, 6px)',
              flexShrink:0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-deep)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Iframe Drive preview */}
        <div style={{ flex:1, minHeight:0, background:'#222', position:'relative' }}>
          {pdfId ? (
            <iframe
              src={embedUrl}
              title={`Material PDF — ${titulo || idLec}`}
              allow="autoplay"
              allowFullScreen
              style={{
                width:'100%', height:'100%', border:'none', display:'block',
                background:'#222',
              }}
            />
          ) : (
            <div style={{
              position:'absolute', inset:0,
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#FFFFFFAA', fontSize:13,
            }}>
              No hay PDF disponible para esta lección.
            </div>
          )}
        </div>

        {/* Footer aclaración Drive permisos */}
        <div style={{
          padding:'8px 18px',
          background:'var(--surface-2)',
          borderTop:'1px solid var(--line)',
          fontSize:10, color:'var(--ink-3)',
          letterSpacing:'0.04em', lineHeight:1.5,
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
          flexWrap:'wrap',
        }}>
          <span>
            {tipoPdf === 'estudiante'
              ? 'Visualizando el material del estudiante. Disponible mientras estés matriculado.'
              : tipoPdf === 'profe'
                ? 'Material del docente — uso interno. No compartir con estudiantes.'
                : 'Material de la lección.'}
          </span>
          <span style={{ fontFamily:'var(--f-mono)' }}>
            Embebido vía Google Drive · ESC para cerrar
          </span>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ n, l, c }) {
  return (
    <div>
      <div style={{
        fontFamily:'var(--f-serif)', fontSize:22, fontWeight:600,
        color:c, lineHeight:1, letterSpacing:'-0.02em',
      }}>{n}</div>
      <div style={{
        fontSize:9, color:'var(--ink-3)', marginTop:2, fontWeight:600,
        letterSpacing:'0.08em', textTransform:'uppercase',
      }}>{l}</div>
    </div>
  );
}

function skeletonLine(widthPct) {
  return {
    height: 11, width: `${widthPct}%`,
    background: 'linear-gradient(90deg, var(--bg-deep) 0%, var(--surface-2) 50%, var(--bg-deep) 100%)',
    backgroundSize: '200% 100%',
    animation: 'an-shimmer 1.4s linear infinite',
    borderRadius: 4,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Leyenda
// ─────────────────────────────────────────────────────────────────────────
function Leyenda({ nivel = 'B1' }) {
  const items = [
    { ...paletaCelda('CERRADA', 'CLASE', nivel), l:'Clase dada' },
    { ...paletaCelda('PROGRAMADA', 'CLASE', nivel), l:'Próxima' },
    { ...paletaCelda('PROGRAMADA', 'PROGRESS_CHECK', nivel), l:'Progress Check' },
    { ...paletaCelda('PROGRAMADA', 'EVAL_ORAL', nivel), l:'Examen Oral' },
    { ...paletaCelda('PROGRAMADA', 'EVAL_ESCRITO', nivel), l:'Examen Escrito' },
    { ...paletaCelda('HOY', 'CLASE', nivel), l:'Hoy' },
    { ...paletaCelda('FERIADO', 'CLASE', nivel), l:'Feriado' },
  ];
  return (
    <div style={{
      marginTop:14, paddingTop:14, borderTop:'1px solid var(--line)',
      display:'flex', flexWrap:'wrap', gap:14, fontSize:11, color:'var(--ink-2)',
    }}>
      {items.map(it => (
        <span key={it.l} style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{
            width:14, height:14, borderRadius:4,
            background:it.bg, border:`1.5px solid ${it.accent}`,
          }} />
          {it.l}
        </span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Skeleton mientras carga
// ─────────────────────────────────────────────────────────────────────────
function SkeletonMeses() {
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',
      gap:18,
    }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{
          border:'1px solid var(--line)', borderRadius:'var(--r-md)',
          background:'var(--surface)', padding:14,
        }}>
          <div style={{ ...skeletonLine(40), height:16, marginBottom:10 }} />
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:3,
          }}>
            {Array.from({ length: 35 }).map((_, j) => (
              <div key={j} style={{
                height:42, background:'var(--bg-deep)', borderRadius:6,
                opacity: 0.4 + 0.4 * Math.random(),
              }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Animación shimmer + fade + spin (inyectada una vez)
(function injectShimmer() {
  if (typeof document === 'undefined' || document.getElementById('an-shimmer-css')) return;
  const s = document.createElement('style');
  s.id = 'an-shimmer-css';
  s.textContent = `
    @keyframes an-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    @keyframes an-fade-in { from { opacity: 0 } to { opacity: 1 } }
    @keyframes an-spin    { to { transform: rotate(360deg) } }
  `;
  document.head.appendChild(s);
})();

// ────────────────────────────────────────────────────────────────────────
// Modal de Asignar Cobertura
// ────────────────────────────────────────────────────────────────────────
function ModalCobertura({ selLec, codGrupo, nivel, docenteTitular, adminNombre, onCerrar, onAsignada }) {
  const [docentes, setDocentes]   = React.useState([]);
  const [cargandoDoc, setCargandoDoc] = React.useState(true);
  const [docSel, setDocSel]       = React.useState('');
  const [motivo, setMotivo]       = React.useState('');
  const [enviando, setEnviando]   = React.useState(false);
  const [err, setErr]             = React.useState(null);

  // Cargar lista de docentes activos. getDocentesAtrasados devuelve docentes[].nombre
  React.useEffect(() => {
    let alive = true;
    setCargandoDoc(true); setErr(null);
    const fetcher = window.fetchDocentesAtrasados;
    Promise.resolve(fetcher ? fetcher() : { ok:false }).then(r => {
      if (!alive) return;
      let lista = [];
      if (r && r.ok && Array.isArray(r.docentes)) {
        lista = r.docentes
          .map(d => (d.nombre || '').trim())
          .filter(n => !!n && n.toUpperCase() !== (docenteTitular || '').toUpperCase());
      }
      // Fallback: lista local de docentes conocidos (mock dev)
      if (!lista.length) {
        lista = [
          'SULIVANY MEDINA FONSECA',
          'EMILY VEGA RAMÍREZ',
          'RACHELLE CRUZ MORA',
          'ANA SALAZAR JIMÉNEZ',
          'JOHN ÁLVAREZ GONZÁLEZ',
          'YENDRY AGUILAR ROJAS',
        ].filter(n => n.toUpperCase() !== (docenteTitular || '').toUpperCase().toUpperCase());
      }
      // Quitar duplicados
      lista = Array.from(new Set(lista));
      setDocentes(lista);
      setCargandoDoc(false);
    }).catch(() => {
      if (alive) { setDocentes([]); setCargandoDoc(false); }
    });
    return () => { alive = false; };
  }, [docenteTitular]);

  // Cerrar con ESC
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !enviando) onCerrar(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCerrar, enviando]);

  const handleAsignar = async () => {
    if (!docSel) { setErr('Seleccioná un docente.'); return; }
    setEnviando(true); setErr(null);
    // CALGRUPO_F53_20260617_CRONOGRAMA_DETALLE_ROUTER_FIX
    const riel = selLec.tipo === 'ICAN' ? 'ican' : 'curso';
    const payload = {
      cod_grupo: codGrupo,
      nivel,
      leccion: selLec.leccion,
      riel,
      docente_cobertura: docSel,
      motivo: motivo.trim(),
      registrado_por: adminNombre,
    };
    const fn = window.fetchAsignarCobertura;
    let res;
    try {
      res = fn ? await fn(payload) : { ok: false, error: 'fetchAsignarCobertura no disponible' };
    } catch (e) {
      res = { ok: false, error: 'Error de red: ' + e.message };
    }
    if (res && res.ok) {
      const idLec = idLeccion(nivel, selLec.leccion);
      onAsignada(idLec, res.docente_cobertura || docSel, res.docente_anterior || docenteTitular);
    } else {
      setErr((res && res.error) || 'No se pudo asignar la cobertura.');
      setEnviando(false);
    }
  };

  const idLec = idLeccion(nivel, selLec.leccion);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget && !enviando) onCerrar(); }}
      style={{
        position:'fixed', inset:0, zIndex:1100,
        background:'rgba(20, 16, 12, 0.55)',
        backdropFilter:'blur(3px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:18,
        animation:'an-fade-in .14s ease-out',
      }}>
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width:'100%', maxWidth:460,
          background:'var(--surface)',
          borderRadius:'var(--r-lg, 12px)',
          boxShadow:'0 24px 64px rgba(0,0,0,0.32), 0 4px 16px rgba(0,0,0,0.12)',
          overflow:'hidden',
          display:'flex', flexDirection:'column',
          maxHeight:'calc(100vh - 36px)',
        }}>
        {/* Header */}
        <div style={{
          padding:'18px 22px 14px',
          borderBottom:'1px solid var(--line)',
          display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:14,
        }}>
          <div>
            <div style={{
              fontSize:10, fontWeight:700, letterSpacing:'0.18em',
              textTransform:'uppercase', color:'var(--ink-3)',
            }}>
              Cobertura puntual
            </div>
            <div style={{
              fontFamily:'var(--f-serif)', fontSize: rol === 'teacher' ? 18 : 20, fontWeight:500,
              color:'var(--ink)', letterSpacing:'-0.02em',
              marginTop:4, lineHeight:1.15,
            }}>
              ¿Quién dará esta lección?
            </div>
          </div>
          <button
            type="button"
            onClick={() => !enviando && onCerrar()}
            aria-label="Cerrar"
            style={{
              background:'none', border:'none', cursor: enviando ? 'not-allowed' : 'pointer',
              padding:4, color:'var(--ink-3)', lineHeight:0,
              opacity: enviando ? 0.4 : 1,
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Cuerpo */}
        <div style={{ padding:'16px 22px 4px', overflowY:'auto' }}>
          {/* Contexto de la lección */}
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'10px 16px',
            padding:'12px 14px',
            background:'var(--surface-2)',
            border:'1px solid var(--line)',
            borderRadius:'var(--r-md)',
            marginBottom:16,
          }}>
            <ContextField label="Grupo" value={codGrupo} mono />
            <ContextField label="Nivel" value={`${nivel} · ${NIVEL_LABEL_CG[nivel] || ''}`} />
            <ContextField
              label="Lección"
              value={`${idLec} · #${String(selLec.leccion).padStart(2,'0')}`}
              mono
            />
            <ContextField label="Fecha" value={fmtLargo(selLec.fecha)} />
            <div style={{ gridColumn:'1 / -1' }}>
              <ContextField
                label="Docente titular"
                value={docenteTitular || '—'}
              />
            </div>
          </div>

          {/* Selector docente */}
          <label style={{ display:'block', marginBottom:14 }}>
            <div style={labelStyle}>Docente de cobertura *</div>
            <select
              value={docSel}
              onChange={e => { setDocSel(e.target.value); setErr(null); }}
              disabled={cargandoDoc || enviando}
              style={{ ...selectStyle, minWidth:0, width:'100%' }}>
              <option value="">
                {cargandoDoc ? 'Cargando docentes…' : 'Seleccionar docente…'}
              </option>
              {docentes.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>

          {/* Motivo */}
          <label style={{ display:'block', marginBottom:14 }}>
            <div style={labelStyle}>Motivo <span style={{ color:'var(--ink-3)', fontWeight:500 }}>(opcional)</span></div>
            <input
              type="text"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              disabled={enviando}
              placeholder="ej. Titular incapacitado"
              style={{
                width:'100%',
                padding:'10px 14px',
                border:'1.5px solid var(--line)',
                borderRadius:'var(--r-md)',
                background:'var(--surface)',
                fontSize:13, color:'var(--ink)',
                fontFamily:'inherit',
                outline:'none',
                boxSizing:'border-box',
              }}
            />
          </label>

          {err && (
            <div style={{
              padding:'10px 12px',
              background:'color-mix(in srgb, var(--danger, #B71C1C) 8%, white)',
              border:'1px solid color-mix(in srgb, var(--danger, #B71C1C) 28%, white)',
              borderRadius:'var(--r-sm)',
              fontSize:12, color:'var(--danger, #B71C1C)',
              marginBottom:12, fontWeight:600,
            }}>
              ⚠ {err}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding:'14px 22px 18px',
          borderTop:'1px solid var(--line)',
          display:'flex', justifyContent:'flex-end', gap:10,
        }}>
          <button
            type="button"
            onClick={() => !enviando && onCerrar()}
            disabled={enviando}
            style={{
              padding:'10px 16px',
              background:'transparent',
              border:'1.5px solid var(--line-2, var(--line))',
              color:'var(--ink-2)',
              fontSize:13, fontWeight:600,
              borderRadius:'var(--r-md)',
              cursor: enviando ? 'not-allowed' : 'pointer',
              fontFamily:'inherit',
            }}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleAsignar}
            disabled={enviando || !docSel || cargandoDoc}
            style={{
              padding:'10px 18px',
              background: (enviando || !docSel) ? '#9F8F7D' : 'var(--ink)',
              border:'none',
              color:'#FFFFFF',
              fontSize:13, fontWeight:700,
              borderRadius:'var(--r-md)',
              cursor: (enviando || !docSel) ? 'not-allowed' : 'pointer',
              letterSpacing:'0.02em',
              fontFamily:'inherit',
              display:'inline-flex', alignItems:'center', gap:8,
            }}>
            {enviando ? (
              <>
                <span style={{
                  width:12, height:12, borderRadius:'50%',
                  border:'2px solid rgba(255,255,255,0.4)',
                  borderTopColor:'#FFF',
                  animation:'an-spin .8s linear infinite',
                  display:'inline-block',
                }} />
                Asignando…
              </>
            ) : 'Asignar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Modal SUPERADMIN — Editar lección CERRADA
// Edita retro / PC / asistencia / notas. La lección permanece CERRADA.
// ─────────────────────────────────────────────────────────────────
const LECCIONES_CON_PC = [4, 8, 13, 16, 21, 24, 28, 30];

function ModalEditarCerrada({ selLec, codGrupo, nivel, superadminNombre, onCerrar, onGuardado }) {
  const leccionNum = selLec.leccion;
  const tipo       = selLec.tipo;
  const riel       = tipo === 'ICAN' ? 'ican' : 'curso';

  const tieneNotas = tipo === 'EVAL_ORAL' || tipo === 'EVAL_ESCRITO';
  const tienePC    = LECCIONES_CON_PC.includes(leccionNum) && riel === 'curso';

  const TABS = React.useMemo(() => {
    const t = [{ id: 'retro', label: 'Retroalimentación' }];
    if (tienePC)    t.push({ id: 'pc',    label: 'Progress Check' });
    t.push({ id: 'asist', label: 'Asistencia' });
    if (tieneNotas) t.push({ id: 'notas', label: 'Notas' });
    return t;
  }, [tienePC, tieneNotas]);

  const [tab, setTab]               = React.useState(TABS[0].id);
  const [cargando, setCargando]     = React.useState(true);
  const [errCarga, setErrCarga]     = React.useState('');
  const [estudiantes, setEst]       = React.useState([]); // [{cod, nombre}]
  const [form, setForm]             = React.useState({}); // { [cod]: {presente, retro, pc, nota} }
  const [initial, setInitial]       = React.useState({}); // snapshot para detectar dirty
  const [confirmar, setConfirmar]   = React.useState(false);
  const [enviando, setEnviando]     = React.useState(false);
  const [errEnvio, setErrEnvio]     = React.useState('');

  // Cargar estudiantes + intentar precargar valores actuales
  React.useEffect(() => {
    let vivo = true;
    setCargando(true); setErrCarga('');

    const cargar = async () => {
      // Paso 1: lista de estudiantes del nivel (cerrar)
      let lista = [];
      try {
        const r = await window.fetchEstudiantesParaCierre(codGrupo, nivel);
        if (!r?.ok) {
          if (vivo) { setErrCarga(r?.error || 'No se pudieron cargar los estudiantes.'); setCargando(false); }
          return;
        }
        lista = r.estudiantes || [];
      } catch (e) {
        if (vivo) { setErrCarga('Error de red: ' + e.message); setCargando(false); }
        return;
      }

      // Paso 2: precargar valores actuales (si el endpoint existe)
      let actual = {};
      try {
        const r = await window.fetchLeccionCerradaDetalle({
          cod_grupo: codGrupo, nivel, leccion: leccionNum, riel,
        });
        if (r?.ok && Array.isArray(r.estudiantes)) {
          for (const e of r.estudiantes) {
            const cod = e.cod_estudiante || e.cod || e.codigo;
            if (cod) actual[String(cod)] = e;
          }
        }
      } catch { /* opcional: si no existe, arrancamos en blanco */ }

      if (!vivo) return;
      const init = {};
      for (const e of lista) {
        const cod = String(e.code || e.cod || e.codigo);
        const a = actual[cod] || {};
        init[cod] = {
          presente: a.presente !== undefined ? !!a.presente : true,
          retro:    a.retro || a.retroalimentacion || '',
          pc:       a.pc || a.progress_check || '',
          nota:     a.nota !== undefined && a.nota !== null ? String(a.nota) : '',
        };
      }
      setEst(lista.map(e => ({
        cod: String(e.code || e.cod || e.codigo),
        nombre: e.name || e.nombre || '—',
      })));
      setForm(init);
      setInitial(JSON.parse(JSON.stringify(init)));
      setCargando(false);
    };

    cargar();
    return () => { vivo = false; };
  }, [codGrupo, nivel, leccionNum, riel]);

  // ESC + bloquear scroll
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !enviando) handleCerrar(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enviando]);

  const dirty = React.useMemo(() => {
    return JSON.stringify(form) !== JSON.stringify(initial);
  }, [form, initial]);

  const updateField = (cod, field, value) => {
    setForm(prev => ({ ...prev, [cod]: { ...prev[cod], [field]: value } }));
    setErrEnvio('');
  };

  const handleCerrar = () => {
    if (enviando) return;
    if (dirty && !window.confirm('Tenés cambios sin guardar. ¿Cerrar igual?')) return;
    onCerrar();
  };

  // Detectar qué grupos cambiaron
  const cambios = React.useMemo(() => {
    const cambioRetro = [];
    const cambioPC    = [];
    const cambioAsist = [];
    const cambioNota  = [];
    for (const e of estudiantes) {
      const a = form[e.cod] || {};
      const b = initial[e.cod] || {};
      if ((a.retro || '') !== (b.retro || '')) cambioRetro.push({ cod_estudiante: e.cod, comentario: a.retro || '' });
      if (tienePC && (a.pc || '') !== (b.pc || '')) cambioPC.push({ cod_estudiante: e.cod, comentario: a.pc || '' });
      if (!!a.presente !== !!b.presente) cambioAsist.push({ cod_estudiante: e.cod, presente: !!a.presente });
      if (tieneNotas && (a.nota || '') !== (b.nota || '')) cambioNota.push({ cod_estudiante: e.cod, nota: a.nota });
    }
    return { cambioRetro, cambioPC, cambioAsist, cambioNota };
  }, [form, initial, estudiantes, tienePC, tieneNotas]);

  const totalCambios =
    cambios.cambioRetro.length + cambios.cambioPC.length +
    cambios.cambioAsist.length + cambios.cambioNota.length;

  const handleGuardar = async () => {
    if (enviando || !totalCambios) return;
    setEnviando(true); setErrEnvio('');

    const calls = [];
    const resumen = [];

    if (cambios.cambioRetro.length) {
      calls.push(
        window.fetchEditarRetroPCCerrada({
          tipo: 'retro',
          cod_grupo: codGrupo,
          leccion_num: leccionNum,
          lista: cambios.cambioRetro,
          editado_por: superadminNombre,
        }).then(r => {
          if (!r?.ok) throw new Error(r?.error || 'Error guardando retro.');
          resumen.push(r.mensaje || `Retro: ${r.actualizados || 0}↻ ${r.agregados || 0}+`);
        })
      );
    }
    if (cambios.cambioPC.length) {
      calls.push(
        window.fetchEditarRetroPCCerrada({
          tipo: 'pc',
          cod_grupo: codGrupo,
          leccion_num: leccionNum,
          lista: cambios.cambioPC,
          editado_por: superadminNombre,
        }).then(r => {
          if (!r?.ok) throw new Error(r?.error || 'Error guardando PC.');
          resumen.push(r.mensaje || `PC: ${r.actualizados || 0}↻ ${r.agregados || 0}+`);
        })
      );
    }
    if (cambios.cambioAsist.length || cambios.cambioNota.length) {
      calls.push(
        window.fetchEditarAsistenciaNotaCerrada({
          cod_grupo: codGrupo,
          nivel,
          leccion: leccionNum,
          asistencias: cambios.cambioAsist,
          notas:       cambios.cambioNota,
          editado_por: superadminNombre,
        }).then(r => {
          if (!r?.ok) throw new Error(r?.error || 'Error guardando asistencia/notas.');
          resumen.push(r.mensaje ||
            `Asistencia: ${r.asistencia_editada || 0} · Notas: ${r.notas_editadas || 0}`);
        })
      );
    }

    try {
      await Promise.all(calls);
      onGuardado(`Lección actualizada · ${resumen.join(' · ')}`);
    } catch (e) {
      setErrEnvio(e.message || 'Error guardando cambios.');
      setEnviando(false);
      setConfirmar(false);
    }
  };

  const colorNivel = NIVEL_COLOR_CG[nivel] || 'var(--an-navy)';
  const idLec = idLeccion(nivel, leccionNum);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget && !enviando) handleCerrar(); }}
      style={{
        position:'fixed', inset:0, zIndex:1100,
        background:'rgba(20, 16, 12, 0.6)',
        backdropFilter:'blur(3px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'min(3vh, 24px) min(3vw, 18px)',
        animation:'an-fade-in .14s ease-out',
      }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Editar lección cerrada ${idLec}`}
        style={{
          width:'100%', maxWidth:760, maxHeight:'calc(100vh - 36px)',
          background:'var(--surface)',
          borderRadius:'var(--r-lg, 12px)',
          boxShadow:'0 24px 64px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.18)',
          overflow:'hidden',
          display:'flex', flexDirection:'column',
        }}>

        {/* Header */}
        <div style={{
          padding:'16px 22px 12px',
          borderBottom:'1px solid var(--line)',
          background:'#FFF8E1',
          display:'flex', alignItems:'flex-start', gap:14,
        }}>
          <div style={{
            width:36, height:36, borderRadius:8,
            background:'#9A6A00', color:'#FFF',
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              <path d="M11 15.5l1.5 1.5L16 13"/>
            </svg>
          </div>
          <div style={{ minWidth:0, flex:1 }}>
            <div style={{
              fontSize:10, fontWeight:800, letterSpacing:'0.18em',
              textTransform:'uppercase', color:'#9A6A00',
            }}>
              Poder superadmin · Lección cerrada
            </div>
            <div style={{
              fontFamily:'var(--f-serif)', fontSize:19, fontWeight:600,
              color:'var(--ink)', letterSpacing:'-0.015em',
              marginTop:2, lineHeight:1.2,
            }}>
              Editar {idLec}
              <span style={{
                marginLeft:8, padding:'2px 8px', borderRadius:'var(--r-pill)',
                background:colorNivel, color:'#FFF',
                fontSize:10, fontWeight:800, letterSpacing:'0.12em',
                textTransform:'uppercase', verticalAlign:'middle',
                fontFamily:'var(--f-sans, inherit)',
              }}>{nivel}</span>
            </div>
            <div style={{
              fontSize:11, color:'var(--ink-2)', marginTop:4,
              fontFamily:'var(--f-mono)', letterSpacing:'0.02em',
            }}>
              {codGrupo} · {fmtLargo(selLec.fecha)} · {TIPO_LABEL_LARGO[tipo] || tipo}
            </div>
          </div>
          <button
            type="button"
            onClick={() => !enviando && handleCerrar()}
            aria-label="Cerrar"
            style={{
              background:'none', border:'none', cursor: enviando ? 'not-allowed' : 'pointer',
              padding:4, color:'#9A6A00', lineHeight:0, opacity: enviando ? 0.4 : 1,
              flexShrink:0,
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display:'flex', gap:0,
          borderBottom:'1px solid var(--line)',
          padding:'0 22px',
          background:'var(--surface)',
        }}>
          {TABS.map(t => {
            const activo = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                disabled={enviando}
                style={{
                  padding:'12px 14px',
                  background:'transparent',
                  border:'none',
                  borderBottom: activo ? `2.5px solid ${colorNivel}` : '2.5px solid transparent',
                  color: activo ? 'var(--ink)' : 'var(--ink-3)',
                  fontSize:12, fontWeight: activo ? 700 : 600,
                  cursor: enviando ? 'not-allowed' : 'pointer',
                  fontFamily:'inherit',
                  letterSpacing:'0.02em',
                  marginBottom:-1,
                }}>
                {t.label}
              </button>
            );
          })}
          <div style={{ flex:1 }} />
          {totalCambios > 0 && (
            <div style={{
              alignSelf:'center',
              fontSize:10, fontWeight:700, letterSpacing:'0.12em',
              textTransform:'uppercase', color:'#9A6A00',
              padding:'4px 10px', background:'#FFF3CD',
              border:'1px solid #FFE082',
              borderRadius:'var(--r-pill)',
            }}>
              {totalCambios} cambio{totalCambios !== 1 ? 's' : ''} sin guardar
            </div>
          )}
        </div>

        {/* Cuerpo */}
        <div style={{
          flex:1, overflowY:'auto',
          padding:'16px 22px',
          background:'var(--bg, var(--surface))',
        }}>
          {cargando ? (
            <div style={{
              padding:'40px 16px', textAlign:'center',
              color:'var(--ink-3)', fontSize:13,
            }}>
              <div style={{
                width:24, height:24, margin:'0 auto 10px',
                borderRadius:'50%',
                border:'2.5px solid var(--line)', borderTopColor:'var(--ink)',
                animation:'an-spin .8s linear infinite',
              }} />
              Cargando estudiantes y datos de la lección…
            </div>
          ) : errCarga ? (
            <div style={{
              padding:'14px 16px',
              background:'color-mix(in srgb, var(--danger, #B71C1C) 8%, white)',
              border:'1px solid color-mix(in srgb, var(--danger, #B71C1C) 28%, white)',
              borderRadius:'var(--r-md)',
              fontSize:12, color:'var(--danger, #B71C1C)',
            }}>⚠ {errCarga}</div>
          ) : estudiantes.length === 0 ? (
            <div style={{
              padding:'30px 16px', textAlign:'center',
              color:'var(--ink-3)', fontSize:13, fontStyle:'italic',
            }}>
              No hay estudiantes activos (CA) en este nivel.
            </div>
          ) : (
            <ul style={{ listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:10 }}>
              {estudiantes.map((e, i) => (
                <FilaEditar
                  key={e.cod}
                  est={e}
                  idx={i}
                  tab={tab}
                  valores={form[e.cod] || {}}
                  initial={initial[e.cod] || {}}
                  onChange={(field, value) => updateField(e.cod, field, value)}
                  disabled={enviando}
                  colorNivel={colorNivel}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding:'12px 22px 14px',
          borderTop:'1px solid var(--line)',
          background:'var(--surface)',
          display:'flex', alignItems:'center', gap:10,
          flexWrap:'wrap',
        }}>
          <div style={{
            fontSize:10, color:'var(--ink-3)',
            letterSpacing:'0.04em', flex:1, minWidth:160,
          }}>
            Editado por <b style={{ color:'var(--ink-2)' }}>{superadminNombre || 'superadmin'}</b>.
            La lección permanece <b>CERRADA</b>.
          </div>

          {errEnvio && (
            <div style={{
              fontSize:11, color:'var(--danger, #B71C1C)', fontWeight:700,
              padding:'6px 10px',
              background:'color-mix(in srgb, var(--danger, #B71C1C) 8%, white)',
              border:'1px solid color-mix(in srgb, var(--danger, #B71C1C) 24%, white)',
              borderRadius:'var(--r-sm)',
            }}>⚠ {errEnvio}</div>
          )}

          <button
            type="button"
            onClick={() => !enviando && handleCerrar()}
            disabled={enviando}
            style={{
              padding:'10px 16px',
              background:'transparent',
              border:'1.5px solid var(--line-2, var(--line))',
              color:'var(--ink-2)',
              fontSize:13, fontWeight:600,
              borderRadius:'var(--r-md)',
              cursor: enviando ? 'not-allowed' : 'pointer',
              fontFamily:'inherit',
            }}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => setConfirmar(true)}
            disabled={enviando || !totalCambios}
            style={{
              padding:'10px 18px',
              background: (!totalCambios || enviando) ? '#C9BFB1' : '#9A6A00',
              border:'none',
              color:'#FFFFFF',
              fontSize:13, fontWeight:700,
              borderRadius:'var(--r-md)',
              cursor: (!totalCambios || enviando) ? 'not-allowed' : 'pointer',
              letterSpacing:'0.02em',
              fontFamily:'inherit',
              display:'inline-flex', alignItems:'center', gap:8,
            }}>
            {enviando ? 'Guardando…' : `Guardar (${totalCambios})`}
          </button>
        </div>

        {/* Sub-modal de confirmación */}
        {confirmar && (
          <div
            onClick={(e) => { if (e.target === e.currentTarget && !enviando) setConfirmar(false); }}
            style={{
              position:'absolute', inset:0,
              background:'rgba(20, 16, 12, 0.55)',
              display:'flex', alignItems:'center', justifyContent:'center',
              padding:20, animation:'an-fade-in .14s ease-out',
            }}>
            <div style={{
              width:'100%', maxWidth:420,
              background:'var(--surface)',
              borderRadius:'var(--r-lg, 12px)',
              boxShadow:'0 24px 64px rgba(0,0,0,0.32)',
              overflow:'hidden',
            }}>
              <div style={{
                padding:'18px 22px 12px',
                borderBottom:'1px solid var(--line)',
              }}>
                <div style={{
                  fontSize:10, fontWeight:800, letterSpacing:'0.18em',
                  textTransform:'uppercase', color:'#9A6A00', marginBottom:4,
                }}>Confirmá el cambio</div>
                <div style={{
                  fontFamily:'var(--f-serif)', fontSize:18, fontWeight:600,
                  color:'var(--ink)', letterSpacing:'-0.015em', lineHeight:1.25,
                }}>
                  Vas a modificar datos de una lección <span style={{ color:'#9A6A00' }}>CERRADA</span>.
                </div>
              </div>
              <div style={{ padding:'14px 22px', fontSize:13, color:'var(--ink-2)', lineHeight:1.5 }}>
                Esta acción queda registrada con tu nombre y la fecha.
                La lección permanece cerrada y los estudiantes verán los nuevos valores.
                <ul style={{
                  margin:'10px 0 0', paddingLeft:18,
                  fontSize:12, color:'var(--ink-2)',
                }}>
                  {cambios.cambioRetro.length > 0 && <li><b>{cambios.cambioRetro.length}</b> retroalimentación{cambios.cambioRetro.length !== 1 ? 'es' : ''}</li>}
                  {cambios.cambioPC.length    > 0 && <li><b>{cambios.cambioPC.length}</b> Progress Check</li>}
                  {cambios.cambioAsist.length > 0 && <li><b>{cambios.cambioAsist.length}</b> asistencia{cambios.cambioAsist.length !== 1 ? 's' : ''}</li>}
                  {cambios.cambioNota.length  > 0 && <li><b>{cambios.cambioNota.length}</b> nota{cambios.cambioNota.length !== 1 ? 's' : ''}</li>}
                </ul>
              </div>
              <div style={{
                padding:'12px 22px 18px',
                display:'flex', justifyContent:'flex-end', gap:10,
              }}>
                <button type="button"
                  onClick={() => !enviando && setConfirmar(false)}
                  disabled={enviando}
                  style={{
                    padding:'9px 14px', background:'transparent',
                    border:'1.5px solid var(--line)', color:'var(--ink-2)',
                    fontSize:13, fontWeight:600, borderRadius:'var(--r-md)',
                    cursor: enviando ? 'not-allowed' : 'pointer', fontFamily:'inherit',
                  }}>
                  Cancelar
                </button>
                <button type="button"
                  onClick={handleGuardar}
                  disabled={enviando}
                  style={{
                    padding:'9px 16px', background:'#9A6A00', border:'none',
                    color:'#FFF', fontSize:13, fontWeight:700, borderRadius:'var(--r-md)',
                    cursor: enviando ? 'not-allowed' : 'pointer', fontFamily:'inherit',
                    display:'inline-flex', alignItems:'center', gap:8,
                  }}>
                  {enviando ? (
                    <>
                      <span style={{
                        width:11, height:11, borderRadius:'50%',
                        border:'2px solid rgba(255,255,255,0.4)',
                        borderTopColor:'#FFF',
                        animation:'an-spin .8s linear infinite',
                        display:'inline-block',
                      }} />
                      Guardando…
                    </>
                  ) : 'Sí, modificar lección cerrada'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FilaEditar({ est, idx, tab, valores, initial, onChange, disabled, colorNivel }) {
  const cambiado = (campo) => (valores[campo] || '') !== (initial[campo] || '');
  const cambiadoBool = (campo) => !!valores[campo] !== !!initial[campo];

  return (
    <li style={{
      padding:'12px 14px',
      background:'var(--surface)',
      border:'1px solid var(--line)',
      borderRadius:'var(--r-md)',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
        <span style={{
          width:24, height:24, borderRadius:'50%',
          background:'var(--bg-deep)',
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          fontSize:11, fontWeight:700, color:'var(--ink-2)',
          flexShrink:0,
        }}>{idx + 1}</span>
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{
            fontSize:13, fontWeight:600, color:'var(--ink)',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>{est.nombre}</div>
          <div style={{
            fontSize:10, fontFamily:'var(--f-mono)', color:'var(--ink-3)',
            letterSpacing:'0.04em',
          }}>{est.cod}</div>
        </div>
      </div>

      {tab === 'retro' && (
        <textarea
          value={valores.retro || ''}
          onChange={(e) => onChange('retro', e.target.value)}
          disabled={disabled}
          placeholder="Retroalimentación para el estudiante…"
          rows={2}
          style={textAreaStyle(cambiado('retro'), colorNivel)}
        />
      )}

      {tab === 'pc' && (
        <textarea
          value={valores.pc || ''}
          onChange={(e) => onChange('pc', e.target.value)}
          disabled={disabled}
          placeholder="Comentario de Progress Check…"
          rows={2}
          style={textAreaStyle(cambiado('pc'), colorNivel)}
        />
      )}

      {tab === 'asist' && (
        <div style={{ display:'flex', gap:8 }}>
          <ToggleAsist
            label="Presente"
            activo={!!valores.presente}
            cambiado={cambiadoBool('presente') && !!valores.presente}
            onClick={() => !disabled && onChange('presente', true)}
            disabled={disabled}
            color="#1E4D2B"
          />
          <ToggleAsist
            label="Ausente"
            activo={!valores.presente}
            cambiado={cambiadoBool('presente') && !valores.presente}
            onClick={() => !disabled && onChange('presente', false)}
            disabled={disabled}
            color="#7A1F15"
          />
        </div>
      )}

      {tab === 'notas' && (
        <input
          type="text"
          inputMode="decimal"
          value={valores.nota || ''}
          onChange={(e) => onChange('nota', e.target.value)}
          disabled={disabled}
          placeholder="Nota (ej. 85)"
          style={{
            ...textAreaStyle(cambiado('nota'), colorNivel),
            fontFamily:'var(--f-mono)', fontSize:14, padding:'8px 12px',
          }}
        />
      )}
    </li>
  );
}

function textAreaStyle(cambiado, colorNivel) {
  return {
    width:'100%',
    padding:'8px 12px',
    border: cambiado ? `1.5px solid ${colorNivel}` : '1.5px solid var(--line)',
    background: cambiado ? `color-mix(in srgb, ${colorNivel} 6%, var(--surface))` : 'var(--surface)',
    borderRadius:'var(--r-sm, 8px)',
    fontSize:13, color:'var(--ink)',
    fontFamily:'inherit',
    outline:'none', resize:'vertical',
    boxSizing:'border-box',
    lineHeight:1.4,
  };
}

function ToggleAsist({ label, activo, cambiado, onClick, disabled, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding:'8px 14px',
        background: activo ? color : 'var(--surface)',
        border: cambiado ? `1.5px dashed ${color}` : `1.5px solid ${activo ? color : 'var(--line)'}`,
        color:    activo ? '#FFF'  : 'var(--ink-2)',
        fontSize:12, fontWeight:700,
        borderRadius:'var(--r-md)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        letterSpacing:'0.04em', textTransform:'uppercase',
        fontFamily:'inherit',
        flex:1,
      }}>
      {label}
    </button>
  );
}

function ContextField({ label, value, mono }) {
  return (
    <div style={{ minWidth:0 }}>
      <div style={{
        fontSize:9, fontWeight:700, letterSpacing:'0.12em',
        textTransform:'uppercase', color:'var(--ink-3)', marginBottom:2,
      }}>{label}</div>
      <div style={{
        fontSize:12, color:'var(--ink)', fontWeight:600,
        fontFamily: mono ? 'var(--f-mono)' : 'inherit',
        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
      }}>
        {value}
      </div>
    </div>
  );
}

Object.assign(window, { CronogramaGrupo });
