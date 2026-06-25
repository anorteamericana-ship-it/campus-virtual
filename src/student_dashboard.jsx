/* global React, Icon, Ring, Stat, Chip, AnimatedBar, LEVELS, SYLLABUS_BY_LEVEL, PRIORITY_BLOCK,
   useUsuario, useEstudiante, EmptyState, ErrorState, nombreAmable */

// URL del Apps Script: fuente única en data.jsx → window.APPS_SCRIPT_URL
const SCRIPT_URL_SD = window.APPS_SCRIPT_URL;

// FIX-ADMIN-CORE-POST-001: lectura sensible vía POST text/plain (token en body).
async function postStudentDash(fn, payload = {}) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const res = await fetch(`${SCRIPT_URL_SD}?fn=${encodeURIComponent(fn)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, token, ...payload }),
  });
  return await res.json();
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

// Calcula nivel_activo a partir del objeto niveles devuelto por getEstudiante
function calcularNivelActivo(niveles, fallback) {
  if (!niveles) return fallback || '';
  const ORDEN = ['B1','B2','I1','I2'];
  const est = (n) => typeof niveles[n] === 'object' ? niveles[n]?.estatus : niveles[n];
  return ORDEN.find(n => est(n) === 'CA')
    || [...ORDEN].reverse().find(n => ['APR','CNV'].includes(est(n)))
    || fallback
    || '';
}

// STUDENT-DASHBOARD-002: infiere el nivel (B1/B2/I1/I2) desde el CÓDIGO del grupo
// cuando `niveles` aún no trae un estatus utilizable (p.ej. matrícula aplicada
// pero nivel sin marcar CA todavía). NO inventa datos: solo deriva el parámetro
// `nivel` para poder consultar getFechasGrupo. Caso estudiante 1794.
function inferirNivelDesdeGrupo(codGrupo) {
  const s = String(codGrupo || '').toUpperCase();
  if (s.includes('B1')) return 'B1';
  if (s.includes('B2')) return 'B2';
  if (s.includes('I1')) return 'I1';
  if (s.includes('I2')) return 'I2';
  return '';
}

// STUDENT-DASHBOARD-002: lectura UNIFICADA de "presente". El backend
// (getAsistenciaEstudiante) puede devolver `presente` (bool/'TRUE') o
// `estado:'P'`. Antes el KPI usaba `estado==='P'` y las insignias `presente`,
// dando resultados distintos. Una sola fuente de verdad:
function esPresente(a) {
  if (!a) return false;
  if (a.presente === true || a.presente === 1) return true;
  const e = String(a.estado || a.status || '').toUpperCase();
  const p = String(a.presente || '').toUpperCase();
  return e === 'P' || e === 'PRESENTE' || p === 'TRUE' || p === 'SI' || p === 'P';
}

// Nombre COMPLETO legible: los nombres llegan en MAYÚSCULAS desde el backend
// (ej. "RODRIGUEZ PALACIOS DEBORA"). Capitalizamos cada palabra sin reordenar
// ni inventar. Si no hay nombre, devolvemos ''.
function nombreCompletoLegible(nombre) {
  if (!nombre || typeof nombre !== 'string') return '';
  return nombre.trim().split(/\s+/).filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// Lectura defensiva de la nota de un nivel
function notaDeNivel(niveles, nivel) {
  if (!niveles || !nivel) return null;
  const v = niveles[nivel];
  if (typeof v === 'object' && v) return v.nota ?? v.NOTA ?? null;
  return null;
}

// F95.0 — un nivel seleccionado controla objetivo, cronograma, asistencia y nota.
function estatusDeNivelSD(niveles, nivel) {
  const v = niveles && niveles[nivel];
  return String((typeof v === 'object' && v ? (v.estatus ?? v.ESTATUS) : v) || 'PE').toUpperCase();
}
function grupoDeNivelSD(niveles, nivel, fallback) {
  const v = niveles && niveles[nivel];
  if (v && typeof v === 'object') {
    return v.grupo || v.GRUPO || v.cod_grupo || v.COD_GRUPO || v.codigo_grupo || v.CODIGO_GRUPO || fallback || '';
  }
  return fallback || '';
}
function sufijoGrupoSD(codGrupo) {
  const parts = String(codGrupo || '').trim().split('-').filter(Boolean);
  return parts.length ? parts[parts.length - 1] : '';
}
function horarioGrupoCompletoSD(grupo, codGrupo) {
  const dias = String(grupo?.DIAS_TEXT || grupo?.DIAS || grupo?.HORARIO_DIAS || grupo?.dias_text || '').trim();
  const hora = String(grupo?.HORA_TEXT || grupo?.HORA || grupo?.HORARIO || grupo?.hora_text || '').trim();
  const sufijo = sufijoGrupoSD(codGrupo);
  let base = '';
  if (dias || hora) {
    if (dias && hora) {
      const nd = dias.toLowerCase().replace(/\s+/g, ' ');
      const nh = hora.toLowerCase().replace(/\s+/g, ' ');
      base = nd.includes(nh) ? dias : `${dias} de ${hora}`;
    } else {
      base = dias || hora;
    }
  } else {
    const raw = String(codGrupo || '').trim().toUpperCase();
    const m = raw.match(/-(LM|KJ|LJ|L4|SA|SAB|L|K|M|J|V|D)(\d{2})-/) || raw.match(/-(LM|KJ|LJ|L4|SA|SAB|L|K|M|J|V|D)(\d{2})/);
    const day = ({LM:'Lunes y miércoles',KJ:'Martes y jueves',LJ:'Lunes y jueves',L4:'Lunes a jueves',SA:'Sábados',SAB:'Sábados',L:'Lunes',K:'Martes',M:'Miércoles',J:'Jueves',V:'Viernes',D:'Domingos'})[m?.[1]] || '';
    const hours = ({'69':'6pm a 9pm','94':'9am a 4pm','96':'9am a 12pm'})[m?.[2]] || '';
    base = `${day}${hours ? ' de ' + hours : ''}`.trim();
  }
  if (!base && !sufijo) return '';
  return `${base || 'Grupo'}${sufijo ? ' - ' + sufijo : ''}`;
}

function studentGrupoCodeInfo(codGrupo) {
  const raw = String(codGrupo || '').trim().toUpperCase();
  const m = raw.match(/-(LM|KJ|LJ|L4|SA|SAB|L|K|M|J|V|D)(\d{2})-/)
    || raw.match(/-(LM|KJ|LJ|L4|SA|SAB|L|K|M|J|V|D)(\d{2})/)
    || raw.match(/^(?:[A-Z0-9]+-)?(LM|KJ|LJ|L4|SA|SAB|L|K|M|J|V|D)(\d{2})-/);
  return { dayCode: m?.[1] || '', hourCode: m?.[2] || '' };
}
function studentDiaCompletoSD(code) {
  return ({
    LM:'Lunes y miércoles', KJ:'Martes y jueves', LJ:'Lunes a jueves', L4:'Lunes a jueves',
    SA:'Sábado', SAB:'Sábado', L:'Lunes', K:'Martes', M:'Miércoles', J:'Jueves', V:'Viernes', D:'Domingo'
  })[String(code || '').toUpperCase()] || '';
}
function studentHoraCompletaSD(code) {
  return ({
    '18':'6pm a 9pm', '69':'6pm a 9pm', '94':'9am a 4pm', '96':'9am a 12pm', '09':'9am a 12pm'
  })[String(code || '').toUpperCase()] || '';
}
function normalizarDiasTextoSD(raw, fallbackCode) {
  const txt = String(raw || '').trim();
  if (!txt) return studentDiaCompletoSD(fallbackCode);
  const up = txt.toUpperCase();
  const simple = { LM:'Lunes y miércoles', KJ:'Martes y jueves', LJ:'Lunes a jueves', L4:'Lunes a jueves', SA:'Sábado', SAB:'Sábado' };
  if (simple[up]) return simple[up];
  return txt
    .replace(/\bLUN\/?MIE\b/i, 'Lunes y miércoles')
    .replace(/\bMAR\/?JUE\b/i, 'Martes y jueves')
    .replace(/\bLUN\/?JUE\b/i, 'Lunes a jueves')
    .replace(/\bSAB(?:ADO)?S?\b/i, 'Sábado');
}
function inferirModalidadProgramaSD(est, grupo, codGrupo) {
  const raw = String(grupo?.MODALIDAD || est?.MODALIDAD || est?.modalidad || '').toUpperCase().trim();
  if (raw.includes('SUPER')) return 'SUPER INTENSIVO';
  if (raw.includes('INTENS')) return 'INTENSIVO';
  const info = studentGrupoCodeInfo(codGrupo);
  return (info.dayCode === 'L4' || info.dayCode === 'LJ') ? 'SUPER INTENSIVO' : 'INTENSIVO';
}
function buildProgramaFichaSD(est, grupo, codGrupo, horarioTexto) {
  const info = studentGrupoCodeInfo(codGrupo);
  const modalidad = inferirModalidadProgramaSD(est, grupo, codGrupo);
  const dias = normalizarDiasTextoSD(grupo?.DIAS_TEXT || grupo?.DIAS || grupo?.HORARIO_DIAS || grupo?.dias_text || '', info.dayCode);
  const hora = String(grupo?.HORA_TEXT || grupo?.HORA || grupo?.HORARIO || grupo?.hora_text || '').trim() || studentHoraCompletaSD(info.hourCode);
  let horario = [dias, hora].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  if (!horario) {
    horario = String(horarioTexto || '').replace(/\s*-\s*\d{4}\s*$/, '').trim();
  }
  const horasSemanales = modalidad === 'SUPER INTENSIVO' ? '12 HORAS X SEMANA' : '6 HORAS X SEMANA';
  return {
    horario: horario || 'Pendiente',
    horasSemanales,
    modalidad,
    programaNombre: 'INGLES CONVERSACIONAL',
  };
}
function registrosAsistenciaNivelSD(asistencia, nivel, codGrupo) {
  const all = Array.isArray(asistencia?.asistencia) ? asistencia.asistencia : [];
  if (!all.length) return all;
  const n = String(nivel || '').toUpperCase();
  const g = String(codGrupo || '').toUpperCase();
  const hasNivel = all.some(a => String(a?.nivel || a?.NIVEL || '').trim());
  const hasGrupo = all.some(a => String(a?.cod_grupo || a?.COD_GRUPO || a?.grupo || a?.GRUPO || '').trim());
  const filtered = all.filter(a => {
    const an = String(a?.nivel || a?.NIVEL || '').toUpperCase();
    const ag = String(a?.cod_grupo || a?.COD_GRUPO || a?.grupo || a?.GRUPO || '').toUpperCase();
    return (!hasNivel || !n || an === n) && (!hasGrupo || !g || ag === g);
  });
  return filtered.length || hasNivel || hasGrupo ? filtered : all;
}

function useRetroalimentacion(codigo) {
  const [data, setData] = React.useState(null);
  React.useEffect(() => {
    if (!codigo) return;
    let cancelled = false;
    postStudentDash('getRetroalimentacionEstudiante', { codigo })
      .then(d => { if (!cancelled && d?.ok) setData(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [codigo]);
  return data;
}

// Asistencia: llamada directa al endpoint
function useAsistencia(codigo) {
  const [data, setData] = React.useState(null);
  React.useEffect(() => {
    if (!codigo) return;
    let cancelled = false;
    postStudentDash('getAsistenciaEstudiante', { codigo })
      .then(d => { if (!cancelled && d?.ok) setData(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [codigo]);
  return data;
}

// Evaluaciones reales (getEvaluacionesEstudiante) — para la tarjeta "Mis notas".
function useEvaluaciones(codigo) {
  const [data, setData] = React.useState(null); // null=cargando · []=sin datos
  React.useEffect(() => {
    if (!codigo) { setData([]); return; }
    let cancelled = false;
    postStudentDash('getEvaluacionesEstudiante', { codigo })
      .then(d => {
        if (cancelled) return;
        setData(d?.ok && Array.isArray(d.evaluaciones) ? d.evaluaciones : []);
      })
      .catch(() => { if (!cancelled) setData([]); });
    return () => { cancelled = true; };
  }, [codigo]);
  return data;
}

// Club I CAN (getICANEstudiante) — compartido por la tarjeta-módulo y el KPI.
function useICAN(codigo, enabled = true) {
  const [data, setData] = React.useState(null);
  React.useEffect(() => {
    if (!codigo || !enabled) return;
    let cancelled = false;
    postStudentDash('getICANEstudiante', { codigo })
      .then(d => { if (!cancelled && d?.ok) setData(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [codigo, enabled]);
  return data;
}

// Próximas lecciones: usa getFechasGrupo del nivel activo.
// STUDENT-DASHBOARD-002 (caso 1794): si falta codGrupo o nivel, devolvemos []
// (vacío honesto) en lugar de dejar el estado en `null` para siempre (que
// mostraba un skeleton infinito). Así distinguimos "cargando" de "sin publicar".
function useProximasLecciones(codGrupo, nivel) {
  const [lecciones, setLecciones] = React.useState(null);
  React.useEffect(() => {
    if (!codGrupo || !nivel) { setLecciones([]); return; }
    let cancelled = false;
    setLecciones(null);
    postStudentDash('getFechasGrupo', { cod_grupo: codGrupo, nivel })
      .then(d => {
        if (cancelled) return;
        if (d?.ok && Array.isArray(d.lecciones)) setLecciones(d.lecciones);
        else setLecciones([]);
      })
      .catch(() => { if (!cancelled) setLecciones([]); });
    return () => { cancelled = true; };
  }, [codGrupo, nivel]);
  return lecciones; // null = cargando · [] = sin datos/sin publicar · [...] = ok
}

const NIVEL_NOMBRE = { B1:'Básico I', B2:'Básico II', I1:'Intermedio I', I2:'Intermedio II' };
const NIVEL_LIBRO  = { B1:'Interchange Intro', B2:'Interchange 1', I1:'Interchange 2', I2:'Interchange 3' };
const NIVEL_COLOR  = { B1:'#E5A823', B2:'#E8372A', I1:'#2B7FC1', I2:'#4CAF50' };

const MES_CORTO_SD = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
function fmtFechaCorta(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return '—';
  return `${String(d.getDate()).padStart(2,'0')} ${MES_CORTO_SD[d.getMonth()]}`;
}
function diasEntreSD(iso) {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return null;
  const h = new Date(); h.setHours(0,0,0,0);
  return Math.round((d - h) / 86400000);
}

// ─────────────────────────────────────────────────────────────────────────
// CONAPE (endpoint real)
// ─────────────────────────────────────────────────────────────────────────
function useEstadoConape(cedula) {
  const [estado, setEstado] = React.useState(null);
  React.useEffect(() => {
    if (!cedula) return;
    postStudentDash('getEstadoConape', { cedula })
      .then(d => { if (d?.ok) setEstado(d); })
      .catch(() => {});
  }, [cedula]);
  return estado;
}

function ConapeBannerDashboardF984({ estado }) {
  if (!estado || !estado.ok) return null;
  const principal = String(estado.estadoTexto || '').trim();
  const detalle = String(estado.desembolsoTexto || '').trim();
  if (!principal && !detalle) return null;
  return (
    <section className="card" aria-label="Financiamiento CONAPE" style={{
      marginBottom:18, padding:'14px 18px', border:'1px solid color-mix(in srgb,#1565C0 28%,white)',
      background:'linear-gradient(135deg,color-mix(in srgb,#1565C0 10%,white),#fff)',
      display:'flex', alignItems:'center', gap:14, flexWrap:'wrap'
    }}>
      <div style={{ width:42, height:42, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', background:'#1565C0', color:'#fff', fontSize:21 }}>🏛️</div>
      <div style={{ flex:1, minWidth:230 }}>
        <div style={{ fontSize:10, fontWeight:900, letterSpacing:'.13em', textTransform:'uppercase', color:'#0D47A1' }}>Financiamiento CONAPE</div>
        <div style={{ marginTop:3, fontSize:14.5, fontWeight:850, color:'var(--an-navy-ink)' }}>{principal || 'Estado disponible'}</div>
        {detalle && <div style={{ marginTop:2, fontSize:12, color:'var(--ink-3)' }}>{detalle}</div>}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────
function StudentDashboard({ toast, onNavigate }) {
  const usr    = useUsuario();
  const go     = (t, opts = {}) => (onNavigate ? onNavigate(t, opts) : null);
  // BUG C fix → si `codigo` (REC_M) viene vacío de la sesión, fallback a cédula.
  const codigo = usr?.codigo || usr?.cedula || '';
  const { data, loading, error, reload } = useEstudiante(codigo);

  // ── Derivar todo lo necesario para los hooks ANTES de cualquier return.
  const est        = data?.estudiante  || {};
  const niveles    = data?.niveles     || {};
  const grupo      = data?.grupo       || {};
  const pendientes = data?.pendientes  || {};
  const contactosEstudiante = data?.contactos_estudiante || {};

  const codGrupo     = grupo.CODIGO_GRUPO || est.GRUPO || usr?.grupo || usr?.grupoActivo || '';
  // Nivel académico real y nivel que el estudiante está consultando en la ruta.
  const nivelReal    = calcularNivelActivo(niveles, usr?.nivel_activo);
  const nivelInicial = nivelReal || inferirNivelDesdeGrupo(codGrupo) || 'B1';
  const [nivelVista, setNivelVista] = React.useState('');
  const [mostrarPanelDatos, setMostrarPanelDatos] = React.useState(false);
  React.useEffect(() => {
    setNivelVista(nivelInicial);
  }, [nivelReal, codGrupo]);
  const nivelSeleccionado = nivelVista || nivelInicial;
  const codGrupoSeleccionado = grupoDeNivelSD(niveles, nivelSeleccionado, codGrupo);
  const esConape     = String(est.CONVENIO || est.convenio || '').trim().toUpperCase() === 'CONAPE';
  const cedula       = est.CEDULA || est.NUM_CEDULA || usr?.cedula || null;
  const programa     = String(grupo.PROGRAMA || grupo.programa || usr?.programa || usr?.PROGRAMA || 'SIN_INA').trim().toUpperCase().replace(/[\s-]+/g, '_');
  const esINA        = programa === 'INA' || programa === 'CON_INA';

  // Hooks que dependen de los datos derivados — siempre se ejecutan.
  const asistencia    = useAsistencia(codigo);
  const retroData     = useRetroalimentacion(codigo);
  const lecciones     = useProximasLecciones(codGrupoSeleccionado, nivelSeleccionado);
  const conapeEstado  = useEstadoConape(esConape ? cedula : null);
  const evaluaciones  = useEvaluaciones(codigo);
  const icanData      = useICAN(codigo, esINA);

  // Sin sesión activa
  if (!usr) {
    return (
      <div data-screen-label="Estudiante · Mi Campus">
        <DashHeader title="Mi Campus" />
        <EmptyState
          icon="👤"
          title="No hay sesión activa"
          subtitle="Iniciá sesión nuevamente para cargar tu información académica."
        />
      </div>
    );
  }
  if (loading && !data) {
    return (
      <div data-screen-label="Estudiante · Mi Campus">
        <DashHeader title="Cargando tu información…" />
        <SkeletonDashboard />
      </div>
    );
  }
  if (error && !data) {
    return (
      <div data-screen-label="Estudiante · Mi Campus">
        <DashHeader title="Mi Campus" />
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  // ── Datos derivados de presentación ─────────────────────────────────
  const nivelNombre  = NIVEL_NOMBRE[nivelSeleccionado] || '';
  const docente      = grupo.DOCENTE || '';
  const docenteCorto = docente ? docente.split(' ').slice(0,2).join(' ') : '';
  const horarioCurso = horarioGrupoCompletoSD(grupo, codGrupo);

  // Nombre COMPLETO (no solo el primer nombre).
  const nombreCompleto = nombreCompletoLegible(est.NOMBRE || usr.nombre || '') || '—';

  // Asistencia y nota del nivel elegido en Ruta académica.
  let asistPresentes = null, asistTotal = null, asistPct = null;
  const asistenciaVista = registrosAsistenciaNivelSD(asistencia, nivelSeleccionado, codGrupoSeleccionado);
  if (Array.isArray(asistenciaVista)) {
    asistTotal     = asistenciaVista.length;
    asistPresentes = asistenciaVista.filter(esPresente).length;
    asistPct       = asistTotal ? Math.round((asistPresentes / asistTotal) * 100) : null;
  }

  const notaActiva = notaDeNivel(niveles, nivelSeleccionado);

  // Progreso del módulo / próximos exámenes
  let cerradas = 0, totalLecciones = 0, progresoPct = 0;
  let proximas = [];
  let proximoExamen = null;
  if (Array.isArray(lecciones) && lecciones.length) {
    const seen = new Set();
    const unicas = lecciones.filter(l => seen.has(l.leccion) ? false : (seen.add(l.leccion), true));
    totalLecciones = unicas.length;
    cerradas = unicas.filter(l => l.estado === 'CERRADA').length;
    progresoPct = totalLecciones ? Math.round((cerradas / totalLecciones) * 100) : 0;
    proximas = lecciones.filter(l => l.estado === 'CALCULADA' || l.estado === 'HOY').slice(0, 4);
    proximoExamen = lecciones.find(l =>
      (l.estado === 'CALCULADA' || l.estado === 'HOY') &&
      (l.tipo === 'EVAL_ORAL' || l.tipo === 'EVAL_ESCRITO'));
  }
  const cronoPublicado = Array.isArray(lecciones) && lecciones.length > 0;

  // La ruta siempre muestra los cuatro niveles; los pendientes no desaparecen.
  const nivelesRuta = ['B1','B2','I1','I2'].map(n => {
    const raw = niveles && niveles[n];
    return {
      nivel:n,
      estatus:estatusDeNivelSD(niveles,n),
      nota:notaDeNivel(niveles,n),
      registro: raw && typeof raw === 'object' ? (raw.reg_certificados || raw.cert_num || '') : '',
      grupo: grupoDeNivelSD(niveles,n,codGrupo),
    };
  });

  // STUDENT-ACCESS-CALENDAR-001: el Dashboard se adapta al estado de acceso.
  // Derivado de los datos de getEstudiante (sin fetch extra). Solo cambia la
  // experiencia cuando el estado es DETERMINADO; si no, muestra el dashboard
  // completo de siempre (sin sobre-bloquear).
  const acc = (typeof window.deriveStudentAccess === 'function')
    ? window.deriveStudentAccess(data, { nivel: nivelReal }) : null;
  const accDet = !!(acc && acc.determinado);
  if (accDet && acc.flags.accountOnly) {
    return <DashboardBloqueoMora est={est} nombreCompleto={nombreCompleto} acc={acc}
                                 codGrupo={codGrupo} pendientes={pendientes} onNavigate={go} />;
  }
  if (accDet && !acc.flags.canCalendar && !acc.flags.accountOnly) {
    return <DashboardPreinscrito est={est} nombreCompleto={nombreCompleto} acc={acc}
                                 esConape={esConape} conapeEstado={conapeEstado}
                                 pendientes={pendientes} codGrupo={codGrupo} onNavigate={go} />;
  }
  const matriculaPagadaBanner = accDet && acc.flags.canCalendar && !acc.flags.canMateriales;

  return (
    <div data-screen-label="Estudiante · Mi Campus">
      <div style={{ marginBottom:18, display:'flex', justifyContent:'center' }}>
        <div className="card" style={{ width:'100%', padding:'18px 22px', display:'flex', justifyContent:'center', alignItems:'center', background:'linear-gradient(135deg,#fff 0%, color-mix(in srgb, var(--an-navy) 3%, white) 100%)' }}>
          <img src="assets/logo_circular.jpg" alt="Academia Norteamericana" style={{ width:'min(100%, 560px)', height:'auto', display:'block', objectFit:'contain' }} />
        </div>
      </div>

      {/* 1. Material obligatorio: requisito de orientación y consulta permanente. */}
      <AntesDeEmpezar codigo={codigo} onNavigate={go} />

      {/* 2. Saludo principal. El encabezado usa horario real + consecutivo corto. */}
      <div className="hero" style={{ marginBottom:18 }}>
        <div className="watermark-a">A</div>
        <div className="hero-grid">
          <div>
            <div className="hero-kicker">
              {docenteCorto ? `TEACHER ${String(docenteCorto).toUpperCase()}` : (docente ? `TEACHER ${String(docente).toUpperCase()}` : 'BIENVENIDO')}
            </div>
            <h1 className="hero-h1">Bienvenido,<br/><em>{nombreCompleto}</em></h1>
            <div className="hero-sub" style={{ fontSize:18, lineHeight:1.45, fontWeight:700, maxWidth:620 }}>
              {nivelReal
                ? nivelSeleccionado === nivelReal
                  ? <>Estás cursando <strong>{nivelNombre}</strong> — {NIVEL_LIBRO[nivelSeleccionado]}.</>
                  : <>Estás consultando <strong>{nivelNombre}</strong>. Tu nivel activo es {NIVEL_NOMBRE[nivelReal]}.</>
                : <>Tu nivel activo aparecerá cuando tu matrícula esté procesada.</>}
            </div>

          </div>
          <div style={{ display:'flex', justifyContent:'center' }}>
            <Ring pct={progresoPct} size={210}>
              <div className="ring-pct">{progresoPct}<sup>%</sup></div>
              <div className="ring-label">Módulo completado</div>
              <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:4, textAlign:'center', maxWidth:150 }}>
                {cronoPublicado ? `${cerradas} de ${totalLecciones} lecciones` : 'Cronograma no publicado aún'}
              </div>
            </Ring>
          </div>
        </div>
      </div>

      <DatosAcademicosInicio est={est} grupo={grupo} nombreCompleto={nombreCompleto} codigo={codigo} cedula={cedula}
        codGrupo={codGrupo} nivelReal={nivelReal} docente={docente} horario={horarioCurso}
        programa={programa} contactos={contactosEstudiante} onNavigate={go}
        expanded={mostrarPanelDatos} onReload={reload} />

      {/* 3. CONAPE: una sola aparición, únicamente con convenio y respuesta real. */}
      {esConape && conapeEstado && <ConapeBannerDashboardF984 estado={conapeEstado} />}

      {/* 4. Accesos rápidos. */}
      <AccesosRapidosDashboard onNavigate={go} />

      {/* 5. Ruta académica interactiva. */}
      <RutaAcademicaDashboard
        niveles={nivelesRuta}
        nivelActivo={nivelReal}
        nivelSeleccionado={nivelSeleccionado}
        onSelect={setNivelVista}
      />

      {/* 6. Objetivo general y libro del nivel seleccionado. */}
      <ResumenAcademico nivelReal={nivelSeleccionado} programa={programa} />

      {/* 7–9. Asistencia, nota acumulada y progreso académico del nivel elegido. */}
      <div className="grid-3" style={{ marginBottom:18 }}>
        <Stat label="Asistencia" num={asistPct != null ? String(asistPct) : '—'} suffix={asistPct != null ? '%' : ''}
          sub={asistTotal != null ? `${asistPresentes} de ${asistTotal} clases` : 'Sin registros aún'}
          subTone={asistPct != null && asistPct >= 70 ? 'ok' : ''} pct={asistPct || 0} color="var(--ok)" />
        <Stat label="Nota acumulada" num={notaActiva != null ? String(notaActiva) : '—'} suffix={notaActiva != null ? '/100' : ''}
          sub={notaActiva != null ? `Nivel ${nivelSeleccionado || '—'}` : 'Sin evaluación final aún'}
          subTone={notaActiva != null && notaActiva >= 70 ? 'ok' : ''} pct={notaActiva || 0} color="var(--an-granate)" />
        <Stat label="Progreso académico" num={cronoPublicado ? String(cerradas) : '—'} suffix={cronoPublicado ? `/${totalLecciones}` : ''}
          sub={cronoPublicado ? `${progresoPct}% del nivel` : 'Cronograma no publicado'} pct={progresoPct} color="var(--an-navy)" />
      </div>

      {/* 10–11. Próxima clase y próximo examen. */}
      <ProximaAccionCampus proximaClase={proximas[0]} proximoExamen={proximoExamen}
        cronoPublicado={cronoPublicado} onNavigate={go} />

      {/* 12. Tus módulos. Solo módulos operativos o con datos honestos. */}
      <DashSection title="Tu expediente" />
      <div className="grid-mods" style={{ marginBottom:20 }}>
        <ModInfoCurso nivelReal={nivelSeleccionado} codGrupo={codGrupoSeleccionado} grupo={grupo} programa={programa} onNavigate={go} />
        <ModEstadoCuenta pendientes={pendientes} esConape={esConape} conapeEstado={conapeEstado} onNavigate={go} />
        <ModCertificados niveles={niveles} onNavigate={go} />
        <ModRetro retroData={retroData} onNavigate={go} />
        {esINA && <ModICAN esINA={esINA} icanData={icanData} onNavigate={go} />}
      </div>

      {/* 13. Elementos adicionales útiles: bloqueo parcial, verificación y ayuda. */}
      {matriculaPagadaBanner && (
        <div style={{ marginBottom:18, padding:'14px 18px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', background:'color-mix(in srgb, var(--an-gold) 12%, white)', border:'1px solid color-mix(in srgb, var(--an-gold) 35%, white)', borderRadius:'var(--r-lg)', color:'#6B4A00' }}>
          <span style={{ fontSize:22 }}>🗓️</span>
          <div style={{ flex:1, minWidth:220, fontSize:13, lineHeight:1.5 }}><strong style={{ color:'var(--an-navy-ink)' }}>Tu cronograma ya está disponible.</strong>{' '}El material se habilitará cuando se registre la primera cuota del nivel.</div>
          <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={() => go('cronograma_grupo')}>Ver cronograma →</button>
        </div>
      )}

      <OrientacionInicialCampus codigo={codigo} nombreCompleto={nombreCompleto} codGrupo={codGrupo}
        nivelReal={nivelReal} docente={docente} horario={horarioCurso} onNavigate={go} />
      <SoportePruebaViva nombreCompleto={nombreCompleto} codGrupo={horarioCurso || sufijoGrupoSD(codGrupo)} />
    </div>
  );
}

function AccInfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display:'flex', justifyContent:'space-between', gap:12, padding:'8px 0', borderBottom:'1px solid var(--line)' }}>
      <span style={{ fontSize:12, color:'var(--ink-3)' }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:600, color:'var(--ink)', textAlign:'right' }}>{value}</span>
    </div>
  );
}
function AccDatosPersonales({ est, nombreCompleto, codGrupo }) {
  const cedula  = est.CEDULA || est.NUM_CEDULA || est.cedula || '';
  const codigo  = est.CODIGO || est.REC_M || est.rec_m || '';
  const correo  = est.CORREO || est.EMAIL || est.correo || est.email || '';
  const programa = est.PROGRAMA || '';
  return (
    <div className="card" style={{ padding:'16px 18px' }}>
      <Kicker>Datos personales</Kicker>
      <div style={{ marginTop:8 }}>
        <AccInfoRow label="Nombre" value={nombreCompleto !== '—' ? nombreCompleto : ''} />
        <AccInfoRow label="Cédula" value={cedula} />
        <AccInfoRow label="Código" value={codigo} />
        <AccInfoRow label="Grupo" value={codGrupo} />
        <AccInfoRow label="Correo" value={correo} />
        <AccInfoRow label="Programa" value={programa === 'INA' || programa === 'CON_INA' ? 'Programa INA' : programa ? 'Programa propio' : ''} />
      </div>
      {!cedula && !codigo && !codGrupo && (
        <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:6 }}>Tus datos aparecerán cuando administración complete tu registro.</div>
      )}
    </div>
  );
}

function DashboardPreinscrito({ est, nombreCompleto, acc, esConape, conapeEstado, pendientes, codGrupo, onNavigate }) {
  return (
    <div data-screen-label="Estudiante · Dashboard (preinscrito)">
      <DashHeader title={<>Hola,&nbsp;<em style={{ fontStyle:'italic' }}>{nombreCompleto}</em></>} />

      <div style={{
        marginBottom:18, borderRadius:'var(--r-lg)', overflow:'hidden',
        border:'2px solid var(--an-granate)',
        background:'linear-gradient(135deg, color-mix(in srgb, var(--an-granate) 6%, white) 0%, #FBF8F2 100%)',
        padding:'18px 22px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap',
      }}>
        <div style={{ width:46, height:46, borderRadius:'50%', background:'var(--an-granate)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:22 }}>⏳</div>
        <div style={{ flex:1, minWidth:240 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--an-granate)' }}>{acc.label}</div>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:21, fontWeight:500, color:'var(--an-navy-ink)', letterSpacing:'-0.02em', lineHeight:1.2, marginTop:2 }}>
            Tu acceso académico está en preparación
          </div>
          <div style={{ fontSize:13, color:'var(--ink-2)', marginTop:4, lineHeight:1.5 }}>{acc.mensaje}</div>
        </div>
      </div>

      <DashSection title="Tu inscripción" hint="Mientras se registra tu matrícula del nivel" />
      <div className="grid-mods" style={{ marginBottom:18 }}>
        <AccDatosPersonales est={est} nombreCompleto={nombreCompleto} codGrupo={codGrupo} />

        <div className="card" style={{ padding:'16px 18px' }}>
          <Kicker>Estado de inscripción</Kicker>
          <div style={{ marginTop:10, display:'inline-flex', alignItems:'center', gap:8, padding:'5px 12px', borderRadius:'var(--r-pill)', background:'color-mix(in srgb, var(--an-granate) 10%, white)', color:'var(--an-granate)', fontSize:12, fontWeight:700 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--an-granate)' }} />
            {acc.label}
          </div>
          <div style={{ fontSize:12.5, color:'var(--ink-2)', marginTop:10, lineHeight:1.5 }}>
            El cronograma académico, la biblioteca y el material se habilitan cuando se registra la matrícula del nivel.
          </div>
        </div>

        <ModEstadoCuenta pendientes={pendientes} esConape={esConape} conapeEstado={conapeEstado} onNavigate={onNavigate} />

        {esConape && conapeEstado && (
          <div className="card" style={{ padding:'16px 18px', background:'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)', color:'white' }}>
            <div style={{ fontSize:10, opacity:0.8, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase' }}>Financiamiento CONAPE</div>
            <div style={{ fontSize:16, fontWeight:700, marginTop:4 }}>{conapeEstado.estadoTexto || '—'}</div>
            {conapeEstado.desembolsoTexto && <div style={{ fontSize:12, opacity:0.85, marginTop:4 }}>{conapeEstado.desembolsoTexto}</div>}
          </div>
        )}
      </div>

      {typeof window.ContactoAdmin === 'function' && (
        <div className="card" style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:220, fontSize:13, color:'var(--ink-2)' }}>
            <strong style={{ color:'var(--ink)' }}>¿Dudas con tu matrícula?</strong> Contactá a administración.
          </div>
          <window.ContactoAdmin est={est} tipo="administracion" hideWhenPending />
        </div>
      )}
    </div>
  );
}

function DashboardBloqueoMora({ est, nombreCompleto, acc, codGrupo, pendientes, onNavigate }) {
  return (
    <div data-screen-label="Estudiante · Dashboard (acceso limitado)">
      <DashHeader title={<>Hola,&nbsp;<em style={{ fontStyle:'italic' }}>{nombreCompleto}</em></>} />

      <div style={{
        marginBottom:18, borderRadius:'var(--r-lg)', overflow:'hidden',
        border:'2px solid #B71C1C',
        background:'linear-gradient(135deg, #FDECEA 0%, #FBF6F4 100%)',
        padding:'20px 24px',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          <div style={{ width:48, height:48, borderRadius:'50%', background:'#B71C1C', color:'white', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div style={{ flex:1, minWidth:240 }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', color:'#B71C1C' }}>{acc.label}</div>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, color:'var(--an-navy-ink)', letterSpacing:'-0.02em', lineHeight:1.2, marginTop:2 }}>
              Tu acceso académico está temporalmente limitado
            </div>
            <div style={{ fontSize:13.5, color:'var(--ink-2)', marginTop:6, lineHeight:1.55 }}>{acc.mensaje}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, marginTop:16, flexWrap:'wrap' }}>
          <button className="btn btn-primary" style={{ background:'#B71C1C', borderColor:'#B71C1C' }} onClick={() => onNavigate('pagos')}>
            Ver estado de cuenta
          </button>
          {typeof window.ContactoAdmin === 'function' && (
            <window.ContactoAdmin est={est} tipo="cobros" hideWhenPending />
          )}
        </div>
      </div>

      <div className="grid-mods" style={{ marginBottom:18 }}>
        <ModEstadoCuenta pendientes={pendientes} esConape={false} conapeEstado={null} onNavigate={onNavigate} />
        <AccDatosPersonales est={est} nombreCompleto={nombreCompleto} codGrupo={codGrupo} />
      </div>

      <div className="card" style={{ padding:'14px 18px', fontSize:12.5, color:'var(--ink-3)', lineHeight:1.55, borderStyle:'dashed' }}>
        El cronograma, la biblioteca, el material, las notas y los exámenes se reactivan automáticamente cuando cancelás al menos una cuota o regularizás tu estado con cobros.
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────
// F96.5 — Datos a la mano + cumplimiento INA en Mi Campus
// ─────────────────────────────────────────────────────────────────────────

function DatosAcademicosInicio({ est, grupo, nombreCompleto, codigo, cedula, codGrupo, nivelReal, docente, horario, programa, contactos, onNavigate, expanded, onReload }) {
  const correoBase = est.CORREO || est.EMAIL || est.Email || est.correo || est.email || '';
  const telefonoBase = est.TEL1 || est.Tel1 || est.TELEFONO1 || est.TELEFONO_1 || est.TELEFONO || est.tel1 || '';
  const fotoInicial = est.FOTO_PERFIL_URL || est.foto_perfil_url || est.FOTO_URL || '';
  const programaFicha = React.useMemo(() => buildProgramaFichaSD(est, grupo, codGrupo, horario), [est, grupo, codGrupo, horario]);

  const contactosIniciales = React.useMemo(() => ({
    correo_principal: contactos?.correo_principal || correoBase || '',
    telefono_principal: contactos?.telefono_principal || telefonoBase || '',
    correos_adicionales: Array.isArray(contactos?.correos_adicionales) ? contactos.correos_adicionales : [],
    telefonos_adicionales: Array.isArray(contactos?.telefonos_adicionales) ? contactos.telefonos_adicionales : [],
  }), [contactos, correoBase, telefonoBase]);

  const [tab, setTab] = React.useState(null);
  const [editando, setEditando] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const [mensaje, setMensaje] = React.useState(null);
  const [mensajeFoto, setMensajeFoto] = React.useState(null);
  const [subiendoFoto, setSubiendoFoto] = React.useState(false);
  const [contactosVista, setContactosVista] = React.useState(contactosIniciales);
  const [fotoUrl, setFotoUrl] = React.useState(fotoInicial);
  const [form, setForm] = React.useState({
    correo_adicional:'', telefono_adicional:'',
    correo_como_principal:false, telefono_como_principal:false,
  });

  React.useEffect(() => { setContactosVista(contactosIniciales); }, [contactosIniciales]);
  React.useEffect(() => { setFotoUrl(fotoInicial); }, [fotoInicial]);

  const grupoLabel = codGrupo || 'Pendiente';
  const initials = (nombreCompleto || 'EE').split(/\s+/).filter(Boolean).slice(0,2).map(w => (w[0]||'')).join('').toUpperCase() || 'EE';

  const programaRows = [
    ['Código', codigo || est.REC_M || est.CODIGO || 'Pendiente'],
    ['Grupo', grupoLabel],
    ['Horario', programaFicha.horario, programaFicha.horasSemanales],
    ['Nivel', nivelReal ? (NIVEL_NOMBRE[nivelReal] || nivelReal) : 'Pendiente'],
    ['Teacher', docente || 'Pendiente'],
    ['Programa', programaFicha.modalidad, programaFicha.programaNombre],
  ];

  const resetEdicion = () => {
    setEditando(false);
    setMensaje(null);
    setForm({ correo_adicional:'', telefono_adicional:'', correo_como_principal:false, telefono_como_principal:false });
  };

  const handleGuardar = async () => {
    const correoNuevo = String(form.correo_adicional || '').trim();
    const telefonoNuevo = String(form.telefono_adicional || '').trim();
    if (!correoNuevo && !telefonoNuevo) {
      setMensaje({ tipo:'err', texto:'Ingresá un correo electrónico adicional, un teléfono adicional o ambos.' });
      return;
    }
    setGuardando(true);
    setMensaje(null);
    try {
      const res = await postStudentDash('actualizarDatosPersonalesEstudiante', {
        codigo,
        correo_adicional: correoNuevo,
        telefono_adicional: telefonoNuevo,
        correo_como_principal: !!form.correo_como_principal,
        telefono_como_principal: !!form.telefono_como_principal,
      });
      if (res?.ok) {
        if (res.contactos) setContactosVista(res.contactos);
        setEditando(false);
        setForm({ correo_adicional:'', telefono_adicional:'', correo_como_principal:false, telefono_como_principal:false });
        setMensaje({ tipo:'ok', texto: res.mensaje || 'Información de contacto actualizada correctamente.' });
        if (onReload) setTimeout(() => onReload(), 350);
      } else {
        setMensaje({ tipo:'err', texto: res?.mensaje || res?.error || 'No se pudieron actualizar los datos.' });
      }
    } catch (err) {
      setMensaje({ tipo:'err', texto: err?.message || 'No se pudieron actualizar los datos.' });
    } finally {
      setGuardando(false);
    }
  };

  const fileToPayload = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.indexOf(',') >= 0 ? result.split(',').pop() : result;
      resolve({ base64, mime:file.type || 'image/jpeg', nombre:file.name || 'foto_perfil.jpg' });
    };
    reader.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
    reader.readAsDataURL(file);
  });

  const handleFotoSeleccionada = async (e) => {
    const file = e.target?.files && e.target.files[0];
    if (!file) return;
    e.target.value = '';
    if (!String(file.type || '').startsWith('image/')) {
      setMensajeFoto({ tipo:'err', texto:'Seleccioná una imagen JPG o PNG.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMensajeFoto({ tipo:'err', texto:'La imagen supera el máximo permitido de 5 MB.' });
      return;
    }
    setSubiendoFoto(true);
    setMensajeFoto(null);
    try {
      const payload = await fileToPayload(file);
      const res = await postStudentDash('uploadFotoPerfilEstudiante', {
        codigo,
        archivo_base64: payload.base64,
        archivo_mime: payload.mime,
        archivo_nombre: payload.nombre,
      });
      if (res?.ok) {
        setFotoUrl(res.foto_url || fotoUrl || '');
        setMensajeFoto({ tipo:'ok', texto: res?.mensaje || 'Fotografía actualizada correctamente.' });
        if (onReload) setTimeout(() => onReload(), 350);
      } else {
        setMensajeFoto({ tipo:'err', texto: res?.mensaje || res?.error || 'No se pudo actualizar la fotografía.' });
      }
    } catch (err) {
      setMensajeFoto({ tipo:'err', texto: err?.message || 'No se pudo actualizar la fotografía.' });
    } finally {
      setSubiendoFoto(false);
    }
  };

  const infoRowStyle = { display:'flex', justifyContent:'space-between', gap:12, fontSize:12.5, padding:'8px 0', borderBottom:'1px solid var(--line)' };
  const itemStyle = { border:'1px solid var(--line)', borderRadius:16, padding:'14px 15px', background:'#fff', minHeight:94 };
  const labelStyle = { fontSize:10, fontWeight:900, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--ink-3)' };
  const valueStyle = { marginTop:7, fontSize:13.5, fontWeight:800, color:'var(--ink)', lineHeight:1.42, wordBreak:'break-word' };
  const subValueStyle = { marginTop:6, fontSize:11.5, fontWeight:700, color:'var(--ink-3)' };
  const panelGridStyle = { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12 };
  const inputStyle = { width:'100%', marginTop:7, border:'1px solid var(--line)', borderRadius:12, padding:'10px 11px', fontSize:13, fontWeight:600, color:'var(--ink)', outline:'none', background:'#fff' };
  const checkStyle = { display:'flex', alignItems:'flex-start', gap:8, marginTop:9, fontSize:11.5, lineHeight:1.4, color:'var(--ink-2)', cursor:'pointer' };

  const adicionales = (items, emptyText) => {
    const list = Array.from(new Set((items || []).filter(Boolean)));
    if (!list.length) return <div style={{ marginTop:7, fontSize:11.5, color:'var(--ink-3)' }}>{emptyText}</div>;
    return (
      <div style={{ marginTop:8, display:'flex', gap:6, flexWrap:'wrap' }}>
        {list.map(v => <span key={v} style={{ padding:'5px 8px', borderRadius:999, background:'color-mix(in srgb, var(--an-navy) 7%, white)', color:'var(--an-navy)', fontSize:10.5, fontWeight:750 }}>{v}</span>)}
      </div>
    );
  };

  return (
    <section id="panel-actualizar-datos" style={{ marginBottom:18 }} aria-label="Ficha del estudiante">
      <div style={{ display:'grid', gridTemplateColumns:'minmax(300px,420px) minmax(0,1fr)', gap:18, alignItems:'start' }}>
        <aside className="card" style={{ padding:'20px 24px' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ position:'relative', width:126, height:126, margin:'0 auto 14px' }}>
              <div style={{
                width:'100%', height:'100%', borderRadius:'50%', overflow:'hidden',
                background: fotoUrl ? '#f2f2f2' : 'linear-gradient(135deg, #1B2B6B, #D92D2A)',
                color:'#fff', fontFamily:'var(--f-serif)', fontSize:42, fontWeight:700,
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'var(--sh-2)', border:'4px solid white'
              }}>
                {fotoUrl ? <img src={fotoUrl} alt="Foto del estudiante" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : initials}
              </div>
              <label style={{
                position:'absolute', left:'50%', bottom:-8, transform:'translateX(-50%)',
                padding:'6px 10px', borderRadius:999, background:'#fff', border:'1px solid var(--line)',
                fontSize:10.5, fontWeight:900, color:'var(--an-navy)', cursor:'pointer', boxShadow:'var(--sh-1)'
              }}>
                {subiendoFoto ? 'Subiendo…' : (fotoUrl ? 'Cambiar foto' : 'Cargar foto')}
                <input type="file" accept="image/*" style={{ display:'none' }} onChange={handleFotoSeleccionada} disabled={subiendoFoto} />
              </label>
            </div>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:600, lineHeight:1.15, color:'var(--an-navy-ink)', marginTop:18 }}>
              {nombreCompleto || 'Estudiante'}
            </div>
            <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:4, fontFamily:'var(--f-mono)' }}>Estudiante</div>
            <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap', marginTop:14 }}>
              <Chip tone="granate">Estudiante activo</Chip>
              {grupoLabel && <Chip tone="navy">{grupoLabel}</Chip>}
            </div>
          </div>

          {mensajeFoto && (
            <div style={{ marginTop:16, padding:'10px 12px', borderRadius:12, border:`1px solid ${mensajeFoto.tipo==='ok' ? 'color-mix(in srgb, var(--ok) 35%, white)' : 'color-mix(in srgb, var(--danger) 35%, white)'}`, background:mensajeFoto.tipo==='ok' ? 'color-mix(in srgb, var(--ok) 8%, white)' : 'color-mix(in srgb, var(--danger) 8%, white)', color:mensajeFoto.tipo==='ok' ? '#25683B' : '#9C2F2F', fontSize:12, lineHeight:1.45 }}>
              {mensajeFoto.texto}
            </div>
          )}

          <div style={{ marginTop:22, textAlign:'left', borderTop:'1px solid var(--line)', paddingTop:16 }}>
            {[
              ['Correo', contactosVista.correo_principal || '—'],
              ['Teléfono', contactosVista.telefono_principal || '—'],
              ['Cédula', cedula || '—'],
            ].map(([k, v], i, arr) => (
              <div key={i} style={{ ...infoRowStyle, borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none' }}>
                <span style={{ color:'var(--ink-3)', fontWeight:700 }}>{k}</span>
                <span style={{ color:'var(--ink)', fontWeight:700, textAlign:'right', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis' }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:18 }}>
            <button type="button" className="btn btn-primary" style={{ justifyContent:'center', padding:'11px 12px', fontSize:12.5 }} onClick={() => { setTab(tab === 'personal' ? null : 'personal'); setEditando(false); setMensaje(null); }}>
              ACTUALIZAR DATOS
            </button>
            <button type="button" className="btn btn-ghost" style={{ justifyContent:'center', padding:'11px 12px', fontSize:12.5 }} onClick={() => { setTab(tab === 'programa' ? null : 'programa'); setEditando(false); setMensaje(null); }}>
              DATOS DEL PROGRAMA
            </button>
          </div>
        </aside>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {!tab && (
            <section className="card" style={{ padding:'20px 22px' }}>
              <div style={{ fontSize:10.5, fontWeight:900, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--an-navy)' }}>Mi Campus · ficha del estudiante</div>
              <div style={{ marginTop:6, fontFamily:'var(--f-serif)', fontSize:22, fontWeight:600, color:'var(--an-navy-ink)' }}>Información personal y académica</div>
              <div style={{ marginTop:8, fontSize:13, color:'var(--ink-3)', lineHeight:1.6 }}>
                Usá <strong>Actualizar datos</strong> para gestionar tu correo, teléfono y fotografía. Usá <strong>Datos del programa</strong> para revisar la información académica de solo lectura.
              </div>
            </section>
          )}

          {tab === 'personal' && (
            <section className="card" style={{ padding:'18px 20px' }} aria-label="Datos personales">
              <div style={{ display:'flex', justifyContent:'space-between', gap:12, flexWrap:'wrap', alignItems:'center', marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:10.5, fontWeight:900, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--an-navy)' }}>Datos personales</div>
                  <div style={{ fontSize:12.5, color:'var(--ink-3)', marginTop:4 }}>Solo podés actualizar correo electrónico, teléfono y fotografía. Los datos oficiales permanecen protegidos.</div>
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                  {!editando ? (
                    <button className="btn btn-primary" type="button" style={{ fontSize:12 }} onClick={() => { setEditando(true); setMensaje(null); }}>Editar contacto</button>
                  ) : (
                    <>
                      <button className="btn btn-primary" type="button" style={{ fontSize:12 }} onClick={handleGuardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button>
                      <button className="btn btn-ghost" type="button" style={{ fontSize:12 }} onClick={resetEdicion} disabled={guardando}>Cancelar</button>
                    </>
                  )}
                </div>
              </div>

              <div style={panelGridStyle}>
                <div style={itemStyle}>
                  <div style={labelStyle}>Nombre completo</div>
                  <div style={valueStyle}>{nombreCompleto || 'Pendiente'}</div>

                </div>
                <div style={itemStyle}>
                  <div style={labelStyle}>Cédula</div>
                  <div style={valueStyle}>{cedula || 'Pendiente'}</div>

                </div>
                <div style={itemStyle}>
                  <div style={labelStyle}>Correo electrónico actual</div>
                  <div style={{ ...valueStyle, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', wordBreak:'normal', fontSize:12.25 }}>{contactosVista.correo_principal || 'Pendiente'}</div>
                  {adicionales(contactosVista.correos_adicionales, 'No hay correos adicionales registrados.')}
                  {editando && (
                    <div style={{ marginTop:12, paddingTop:12, borderTop:'1px dashed var(--line)' }}>
                      <label style={labelStyle} htmlFor="correo-adicional-estudiante">Correo electrónico adicional</label>
                      <input id="correo-adicional-estudiante" type="email" value={form.correo_adicional} onChange={e => setForm(prev => ({ ...prev, correo_adicional:e.target.value, correo_como_principal:e.target.value ? prev.correo_como_principal : false }))} placeholder="nuevo@correo.com" style={inputStyle} />
                      <label style={{ ...checkStyle, opacity:form.correo_adicional ? 1 : .55 }}>
                        <input type="checkbox" checked={!!form.correo_como_principal} disabled={!form.correo_adicional} onChange={e => setForm(prev => ({ ...prev, correo_como_principal:e.target.checked }))} />
                        <span><strong>Elegir como correo principal.</strong> El correo actual se conserva como adicional; no se elimina.</span>
                      </label>
                    </div>
                  )}
                </div>
                <div style={itemStyle}>
                  <div style={labelStyle}>Teléfono actual</div>
                  <div style={valueStyle}>{contactosVista.telefono_principal || 'Pendiente'}</div>
                  {adicionales(contactosVista.telefonos_adicionales, 'No hay teléfonos adicionales registrados.')}
                  {editando && (
                    <div style={{ marginTop:12, paddingTop:12, borderTop:'1px dashed var(--line)' }}>
                      <label style={labelStyle} htmlFor="telefono-adicional-estudiante">Teléfono adicional</label>
                      <input id="telefono-adicional-estudiante" type="tel" value={form.telefono_adicional} onChange={e => setForm(prev => ({ ...prev, telefono_adicional:e.target.value, telefono_como_principal:e.target.value ? prev.telefono_como_principal : false }))} placeholder="8888-8888" style={inputStyle} />
                      <label style={{ ...checkStyle, opacity:form.telefono_adicional ? 1 : .55 }}>
                        <input type="checkbox" checked={!!form.telefono_como_principal} disabled={!form.telefono_adicional} onChange={e => setForm(prev => ({ ...prev, telefono_como_principal:e.target.checked }))} />
                        <span><strong>Elegir como teléfono principal.</strong> El teléfono actual se conserva como adicional; no se elimina.</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {mensaje && (
                <div style={{ marginTop:14, padding:'12px 14px', borderRadius:14, border:`1px solid ${mensaje.tipo==='ok' ? 'color-mix(in srgb, var(--ok) 35%, white)' : 'color-mix(in srgb, var(--danger) 35%, white)'}`, background:mensaje.tipo==='ok' ? 'color-mix(in srgb, var(--ok) 8%, white)' : 'color-mix(in srgb, var(--danger) 8%, white)', color:mensaje.tipo==='ok' ? '#25683B' : '#9C2F2F', fontSize:12.5, lineHeight:1.5 }}>
                  {mensaje.texto}
                </div>
              )}
            </section>
          )}

          {tab === 'programa' && (
            <section className="card" style={{ padding:'18px 20px' }} aria-label="Datos del programa">
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:10.5, fontWeight:900, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--an-navy)' }}>Datos del programa</div>

              </div>
              <div style={panelGridStyle}>
                {programaRows.map(([label, value, sub]) => (
                  <div key={label} style={itemStyle}>
                    <div style={labelStyle}>{label}</div>
                    <div style={valueStyle}>{value}</div>
                    {sub ? <div style={subValueStyle}>{sub}</div> : null}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}

function OrientacionInicialCampus({ codigo, nombreCompleto, codGrupo, nivelReal, docente, horario, onNavigate }) {
  const KEY = 'an_orientacion_inicial_v2_' + (codigo || 'anon');
  const [cerrado, setCerrado] = React.useState(() => {
    try { return localStorage.getItem(KEY) === '1'; } catch (_) { return false; }
  });
  if (cerrado) return null;
  const confirmar = () => {
    setCerrado(true);
    try { localStorage.setItem(KEY, '1'); } catch (_) {}
  };
  const datoStyle = { padding:'10px 12px', border:'1px solid var(--line)', borderRadius:12, background:'#fff' };
  const labelStyle = { fontSize:9.5, fontWeight:900, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--ink-3)' };
  const valueStyle = { marginTop:3, fontSize:12.5, fontWeight:850, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' };
  return (
    <section className="card" style={{ padding:0, marginBottom:18, overflow:'hidden', border:'2px solid color-mix(in srgb, var(--an-gold) 55%, white)' }} aria-label="Orientación inicial del campus">
      <div style={{ padding:'16px 20px', background:'linear-gradient(135deg, color-mix(in srgb, var(--an-gold) 16%, white), #fff)', borderBottom:'1px solid var(--line)' }}>
        <div style={{ fontSize:10.5, fontWeight:900, letterSpacing:'.14em', textTransform:'uppercase', color:'#7A4E00' }}>Primer ingreso · orientación obligatoria</div>
        <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:600, color:'var(--an-navy-ink)', marginTop:2 }}>Antes de avanzar, verificá tus datos</div>
        <div style={{ fontSize:12.5, color:'var(--ink-3)', lineHeight:1.5, marginTop:4 }}>
          El Campus inicia en <strong>Mi Campus</strong> para que tengás a mano tu información académica, horario, grupo y material de lectura obligatorio solicitado para el programa. Esta guía aparece en el primer ingreso de este equipo y queda disponible desde el material del programa.
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10, padding:16, background:'color-mix(in srgb, var(--bg-deep) 30%, white)' }}>
        <div style={datoStyle}><div style={labelStyle}>Estudiante</div><div style={valueStyle}>{nombreCompleto || 'Pendiente'}</div></div>
        <div style={datoStyle}><div style={labelStyle}>Grupo y horario</div><div style={valueStyle}>{horario || (sufijoGrupoSD(codGrupo) ? 'Grupo ' + sufijoGrupoSD(codGrupo) : 'Pendiente')}</div></div>
        <div style={datoStyle}><div style={labelStyle}>Nivel</div><div style={valueStyle}>{nivelReal ? (NIVEL_NOMBRE[nivelReal] || nivelReal) : 'Pendiente'}</div></div>
        <div style={datoStyle}><div style={labelStyle}>Teacher</div><div style={valueStyle}>{docente || 'Pendiente'}</div></div>
        <div style={datoStyle}><div style={labelStyle}>Horario</div><div style={valueStyle}>{horario || 'Pendiente'}</div></div>
      </div>
      <div style={{ padding:'14px 16px', display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', background:'#fff' }}>
        <div style={{ fontSize:12, color:'var(--ink-3)', lineHeight:1.45, maxWidth:620 }}>
          <strong style={{ color:'var(--ink)' }}>Checklist inicial:</strong> verificá tus datos, abrí el material obligatorio y guardá esta información. Si algo no coincide con tu grupo real, reportalo antes de hacer exámenes o registrar asistencia.
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button className="btn btn-ghost" type="button" onClick={() => onNavigate && onNavigate('info_programa')}>Ver material obligatorio</button>
          <button className="btn btn-primary" type="button" onClick={confirmar}>Mis datos están a la mano</button>
        </div>
      </div>
    </section>
  );
}


function ProximaAccionCampus({ proximaClase, proximoExamen, cronoPublicado, onNavigate }) {
  const claseLabel = proximaClase
    ? `Lección ${String(proximaClase.leccion || proximaClase.LECCION || '').padStart(2,'0')}${proximaClase.fecha ? ' · ' + fmtFechaCorta(proximaClase.fecha) : ''}`
    : (cronoPublicado ? 'Sin clases pendientes' : 'Cronograma pendiente');
  const examenLabel = proximoExamen
    ? `Lección ${String(proximoExamen.leccion || proximoExamen.LECCION || '').padStart(2,'0')} · ${(proximoExamen.tipo || '').replace('EVAL_','')}`
    : 'Se mostrará cuando corresponda';
  const card = (title, value, hint, icon, action, view) => (
    <div style={{ padding:16, border:'1px solid var(--line)', borderRadius:16, background:'#fff', display:'flex', gap:12, alignItems:'center' }}>
      <div style={{ width:42, height:42, borderRadius:14, background:'color-mix(in srgb, var(--an-navy) 8%, white)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:21 }}>{icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:10, fontWeight:900, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--ink-3)' }}>{title}</div>
        <div style={{ fontSize:14.5, fontWeight:900, color:'var(--ink)', marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{value}</div>
        <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>{hint}</div>
      </div>
      <button className="btn btn-ghost" type="button" style={{ fontSize:12 }} onClick={() => onNavigate && onNavigate(view)}>{action}</button>
    </div>
  );
  return (
    <section className="card" style={{ padding:0, marginBottom:18, overflow:'hidden' }} aria-label="Qué sigue en el campus">
      <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--line)', display:'flex', justifyContent:'space-between', gap:12, flexWrap:'wrap', alignItems:'center' }}>
        <div>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:20, fontWeight:600, color:'var(--an-navy-ink)' }}>Resumen de próximos eventos</div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:12, padding:16 }}>
        {card('Próxima clase', claseLabel, cronoPublicado ? 'Confirmá fecha y lección.' : 'Aparecerá cuando administración publique el calendario.', '🗓️', 'Abrir', 'cronograma_grupo')}
        {card('Próximo examen', examenLabel, proximoExamen ? 'La disponibilidad depende de la sesión docente.' : 'No hay examen activo por ahora.', '📝', 'Ver', 'examenes')}
      </div>
    </section>
  );
}




function SoportePruebaViva({ nombreCompleto, codGrupo }) {
  const waUrl = 'https://wa.me/50689528787?text=' + encodeURIComponent('Hola, necesito soporte técnico con el Campus Virtual. Mi nombre es ' + (nombreCompleto || 'estudiante') + (codGrupo ? ' y mi grupo es ' + codGrupo + '.' : '.'));
  return (
    <section className="card" style={{ padding:'14px 18px', marginBottom:18, border:'1px solid color-mix(in srgb, var(--an-navy) 16%, white)', background:'linear-gradient(135deg, color-mix(in srgb, var(--an-navy) 5%, white), #fff)' }} aria-label="Soporte técnico">
      <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ width:38, height:38, borderRadius:12, background:'color-mix(in srgb, var(--an-navy) 12%, white)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🛠️</div>
        <div style={{ flex:1, minWidth:240 }}>
          <div style={{ fontSize:12, fontWeight:900, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--an-navy)' }}>Soporte técnico</div>
          <div style={{ fontSize:12.5, color:'var(--ink-2)', marginTop:3, lineHeight:1.5 }}>
            Si tenés problemas de acceso, carga, exámenes o visualización, escribí directamente al soporte técnico por WhatsApp.
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <button className="btn btn-primary" type="button" style={{ fontSize:12.5 }} onClick={() => window.open(waUrl, '_blank', 'noopener')}>WhatsApp 89528787</button>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// F95.0 — Ruta académica interactiva y accesos rápidos fusionados en Mi Campus
// ─────────────────────────────────────────────────────────────────────────
function RutaAcademicaDashboard({ niveles, nivelActivo, nivelSeleccionado, onSelect }) {
  const STATUS = { CA:'Cursando', APR:'Aprobado', CNV:'Convalidado', PE:'Pendiente', RPB:'Reprobado', REP:'Reprobado' };
  return (
    <section className="card" style={{ padding:0, marginBottom:18, overflow:'hidden' }} aria-label="Ruta académica">
      <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--line)' }}>
        <div style={{ fontFamily:'var(--f-serif)', fontSize:20, fontWeight:600, color:'var(--an-navy-ink)' }}>Ruta académica</div>
        <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:2 }}>Tocá un nivel para consultar su objetivo, nota, asistencia y calendario.</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12, padding:16 }}>
        {(niveles || []).map(item => {
          const n=item.nivel, est=String(item.estatus||'PE').toUpperCase();
          const selected=n===nivelSeleccionado, active=n===nivelActivo;
          const color=NIVEL_COLOR[n] || 'var(--an-navy)';
          const pct=['APR','CNV'].includes(est)?100:est==='CA'?55:['RPB','REP'].includes(est)?100:8;
          return (
            <button key={n} type="button" onClick={()=>onSelect && onSelect(n)} aria-pressed={selected}
              style={{ appearance:'none', textAlign:'left', cursor:'pointer', fontFamily:'inherit', border:`2px solid ${selected?color:'var(--line)'}`, borderRadius:16, padding:14, background:selected?`color-mix(in srgb, ${color} 8%, white)`:'#fff', boxShadow:selected?'0 10px 24px rgba(0,30,71,.08)':'none', transition:'transform .16s ease,border-color .16s ease', minWidth:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                <strong style={{ color, fontSize:17, fontFamily:'var(--f-mono)' }}>{n}</strong>
                <span style={{ fontSize:9.5, fontWeight:900, color:['APR','CNV'].includes(est)?'var(--ok)':est==='CA'?'var(--an-navy)':est==='RPB'||est==='REP'?'var(--danger)':'var(--ink-3)', textTransform:'uppercase' }}>{active?'ACTUAL · ':''}{STATUS[est]||est}</span>
              </div>
              <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:5 }}>{NIVEL_NOMBRE[n]}</div>
              <div style={{ height:7, borderRadius:999, background:'var(--line)', overflow:'hidden', marginTop:12 }}><div style={{ width:`${pct}%`, height:'100%', background:color }} /></div>
              <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:9 }}>Nota: <strong>{item.nota != null ? item.nota : '—'}</strong></div>
              <div style={{ fontSize:10.5, color:'var(--ink-3)', marginTop:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {item.registro ? `Certificado: ${item.registro}` : (['APR','CNV'].includes(est) ? 'Certificado: sin registro oficial' : 'Certificado: no aplica aún')}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AccesosRapidosDashboard({ onNavigate }) {
  const items = [
    ['cronograma_grupo','Cronograma','🗓️','Mi curso'],
    ['materiales','Materiales','📚','Mi curso'],
    ['examenes','Evaluaciones','📝','Próximas y activas'],
    ['notas','Resultados','📊','Notas y retroalimentación'],
  ];
  return (
    <section className="card" style={{ padding:0, marginBottom:18, overflow:'hidden' }} aria-label="Accesos rápidos">
      <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--line)' }}>
        <div style={{ fontFamily:'var(--f-serif)', fontSize:20, fontWeight:600, color:'var(--an-navy-ink)' }}>Entradas principales</div>

      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(165px,1fr))', gap:12, padding:16 }}>
        {items.map(([view,label,icon,hint])=><button key={view} type="button" onClick={()=>onNavigate && onNavigate(view)} style={{ minHeight:86, border:'1.5px solid var(--an-granate)', background:'linear-gradient(135deg, color-mix(in srgb, var(--an-granate) 7%, white), #fff)', borderRadius:16, padding:'13px 12px', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:11, textAlign:'left' }}><span aria-hidden="true" style={{ fontSize:25 }}>{icon}</span><span style={{ display:'flex', flexDirection:'column', gap:2 }}><span style={{ fontSize:13, fontWeight:900, color:'var(--ink)' }}>{label}</span><span style={{ fontSize:10.5, color:'var(--ink-3)', fontWeight:700 }}>{hint}</span></span></button>)}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Bloque obligatorio — Antes de empezar tu programa (5 recuadros, colapsable)
// ─────────────────────────────────────────────────────────────────────────
function AntesDeEmpezar({ codigo, onNavigate }) {
  const KEY = 'an_antes_oculto_' + (codigo || 'anon');
  const [oculto, setOculto] = React.useState(() => {
    try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
  });
  // NOTA: localStorage solo recuerda si el estudiante colapsó el bloque en ESTE
  // navegador. NO es un registro oficial de lectura (eso requeriría un endpoint
  // de backend). Por eso el bloque/título siempre queda visible.
  const toggle = () => {
    const next = !oculto;
    setOculto(next);
    try { localStorage.setItem(KEY, next ? '1' : '0'); } catch {}
  };
  const items = (typeof PRIORITY_BLOCK !== 'undefined' && Array.isArray(PRIORITY_BLOCK.items))
    ? PRIORITY_BLOCK.items : [];

  return (
    <div style={{
      marginBottom: 18, borderRadius: 'var(--r-lg)', overflow: 'hidden',
      border: '2px solid var(--an-granate)',
      background: 'linear-gradient(135deg, color-mix(in srgb, var(--an-granate) 6%, white) 0%, #FBF8F2 100%)',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px', flexWrap:'wrap' }}>
        <div style={{ width:44, height:44, borderRadius:'50%', background:'var(--an-granate)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:20 }}>📋</div>
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--an-granate)' }}>
            Material obligatorio
          </div>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, color:'var(--an-navy-ink)', letterSpacing:'-0.02em', lineHeight:1.15 }}>
            Antes de empezar tu programa
          </div>

        </div>
        <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={toggle}>
          {oculto ? 'Ver material' : 'Marcar revisado en este equipo'}
        </button>
      </div>

      {!oculto && (
        <div className="grid-5" style={{ padding:'0 18px 18px' }}>
          {items.map(item => (
            <button key={item.id} className="before-card" onClick={() => onNavigate('info_programa')}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{
                  width:30, height:30, borderRadius:8, flexShrink:0,
                  background: item.type==='video' ? 'color-mix(in srgb, var(--an-navy) 12%, white)' : 'color-mix(in srgb, var(--an-granate) 12%, white)',
                  color: item.type==='video' ? 'var(--an-navy)' : 'var(--an-granate)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {item.type === 'video'
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
                </span>
                <span style={{ fontFamily:'var(--f-mono)', fontSize:10, color:'var(--ink-3)' }}>{item.code}</span>
              </div>
              <div style={{ fontWeight:600, fontSize:13, color:'var(--ink)', lineHeight:1.3 }}>{item.title}</div>
              <div style={{ fontSize:11, color:'var(--ink-3)', lineHeight:1.4 }}>{item.desc}</div>
              <div style={{ marginTop:'auto', fontSize:9.5, fontWeight:700, letterSpacing:'0.06em', color: item.required ? 'var(--an-granate)' : 'var(--ink-3)' }}>
                {item.required ? 'REQUERIDO' : 'RECOMENDADO'} · ~{item.minutes} min
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Resumen académico — Objetivo / Libro / Duración / Plataforma (dinámico)
// ─────────────────────────────────────────────────────────────────────────
function ResumenAcademico({ nivelReal, programa }) {
  const sylKey = nivelReal ? nivelReal.toLowerCase() : '';
  const syl = (typeof SYLLABUS_BY_LEVEL !== 'undefined' && sylKey) ? (SYLLABUS_BY_LEVEL[sylKey] || {}) : {};
  // Fallbacks NEUTROS — nunca quemar Básico I / Interchange Intro.
  const objetivo  = syl.objective || 'El objetivo de tu nivel aparecerá cuando tu matrícula esté procesada.';
  const libro     = nivelReal ? (NIVEL_LIBRO[nivelReal] || syl.book || 'Libro del curso') : 'Libro del curso';
  const cefr      = syl.cefr || '';
  const duracion  = syl.totalHours ? `${syl.totalHours} h` : '—';
  const plataforma= syl.platform || 'Zoom';
  const nivelLbl  = nivelReal ? (NIVEL_NOMBRE[nivelReal] || 'Nivel actual') : 'Nivel actual';
  const programaLbl = programa === 'INA' || programa === 'CON_INA' ? 'Programa INA' : 'Programa propio';

  return (
    <div className="card" style={{ padding:'18px 22px', marginBottom:18 }}>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:20, alignItems:'start' }}>
        <div>
          <Kicker>Objetivo general · {nivelLbl}</Kicker>
          <div style={{ fontSize:12.5, color:'var(--ink-2)', marginTop:5, lineHeight:1.5 }}>{objetivo}</div>
        </div>
        <div>
          <Kicker>Libro</Kicker>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:16, fontWeight:500, color:'var(--an-navy-ink)', marginTop:4, lineHeight:1.2 }}>{libro}</div>
          {cefr && <div style={{ fontSize:11, color:'var(--ink-3)' }}>Nivel {cefr} · MCER</div>}
        </div>
        <div>
          <Kicker>Duración</Kicker>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:16, fontWeight:500, color:'var(--an-navy-ink)', marginTop:4 }}>{duracion}</div>
          <div style={{ fontSize:11, color:'var(--ink-3)' }}>{programaLbl}</div>
        </div>
        <div>
          <Kicker>Plataforma</Kicker>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:16, fontWeight:500, color:'var(--an-navy-ink)', marginTop:4 }}>{plataforma}</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Tarjetas-módulo (estado real honesto)
// ─────────────────────────────────────────────────────────────────────────
const MOD_STATUS = {
  ok:      { cls:'status-ok',      label:'Disponible' },
  empty:   { cls:'status-empty',   label:'Sin registros' },
  soon:    { cls:'status-soon',    label:'Próximamente' },
  pending: { cls:'status-pending', label:'Pendiente de publicar' },
  admin:   { cls:'status-admin',   label:'Requiere administración' },
};
function StatusPill({ kind, label }) {
  const s = MOD_STATUS[kind] || MOD_STATUS.empty;
  return <span className={`status-pill ${s.cls}`}><i />{label || s.label}</span>;
}
function ModTile({ icon, emoji, title, status, statusLabel, children, cta = 'Abrir', onClick }) {
  return (
    <div className="mod-tile" onClick={onClick} role="button" tabIndex={0}
         onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick && onClick(); } }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, minWidth:0 }}>
          <span style={{ width:30, height:30, borderRadius:8, background:'var(--bg-deep)', color:'var(--ink-2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:18 }}>
            {emoji ? <span aria-hidden="true">{emoji}</span> : <Icon name={icon} size={16} className="" />}
          </span>
          <span style={{ fontWeight:600, fontSize:14, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</span>
        </div>
        <StatusPill kind={status} label={statusLabel} />
      </div>
      <div style={{ fontSize:12.5, color:'var(--ink-2)', lineHeight:1.5 }}>{children}</div>
      <div className="mod-tile-foot">{cta} →</div>
    </div>
  );
}

function ModNotas({ niveles, nivelReal, notaActiva, evaluaciones, onNavigate }) {
  const evs = Array.isArray(evaluaciones) ? evaluaciones : [];
  const conNota = evs.filter(e => e.nota != null);
  const ultima = conNota.length ? conNota[conNota.length - 1] : null;
  const hay = notaActiva != null || conNota.length > 0;
  return (
    <ModTile icon="grades" title="Mis notas" status={hay ? 'ok' : 'empty'}
             statusLabel={hay ? 'Disponible' : 'Sin registros'} cta="Ver notas" onClick={() => onNavigate('notas')}>
      {hay ? (
        <>
          {notaActiva != null && (
            <div><strong style={{ color:'var(--ink)' }}>{notaActiva}/100</strong> · nota acumulada {nivelReal ? `(${nivelReal})` : ''}</div>
          )}
          {ultima
            ? <div style={{ marginTop:2 }}>Última: {ultima.titulo || ultima.tipo || 'evaluación'} {ultima.nota != null ? `· ${ultima.nota}${ultima.max ? '/'+ultima.max : ''}` : ''}</div>
            : <div style={{ marginTop:2, color:'var(--ink-3)' }}>{conNota.length} evaluación{conNota.length===1?'':'es'} registrada{conNota.length===1?'':'s'}.</div>}
        </>
      ) : (
        <span style={{ color:'var(--ink-3)' }}>Aún no tenés evaluaciones registradas.</span>
      )}
    </ModTile>
  );
}

function ModTareas({ onNavigate }) {
  return (
    <ModTile icon="homework" title="Tareas" status="soon" cta="Abrir" onClick={() => onNavigate('tareas')}>
      <span style={{ color:'var(--ink-3)' }}>Aún no hay tareas asignadas. Este módulo se habilitará pronto.</span>
    </ModTile>
  );
}

function ModInfoCurso({ nivelReal, codGrupo, grupo, programa, onNavigate }) {
  const docente  = grupo.DOCENTE || '';
  const horario  = horarioGrupoCompletoSD(grupo, codGrupo);
  const modalidad = programa === 'INA' || programa === 'CON_INA' ? 'INA' : 'Programa propio';
  const hay = !!(codGrupo || docente || horario);
  return (
    <ModTile icon="doc" emoji="📚" title="Mi curso" status={hay ? 'ok' : 'empty'}
             statusLabel={hay ? 'Disponible' : 'Sin registros'} cta="Abrir Mi curso" onClick={() => onNavigate('mi_curso')}>
      {hay ? (
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          <div>{nivelReal ? (NIVEL_NOMBRE[nivelReal] || nivelReal) : 'Nivel actual'} · {modalidad}</div>
          {horario && <div style={{ color:'var(--ink-3)' }}>{horario}</div>}
          {docente && <div style={{ color:'var(--ink-3)' }}>Prof. {docente}</div>}
        </div>
      ) : (
        <span style={{ color:'var(--ink-3)' }}>Los datos de tu grupo aparecerán cuando se asigne.</span>
      )}
    </ModTile>
  );
}

function ModICAN({ esINA, icanData, onNavigate }) {
  if (!esINA) {
    return (
      <ModTile icon="ican" emoji="🎤" title="Club I CAN" status="empty" statusLabel="No aplica" cta="Más info" onClick={() => onNavigate('ican')}>
        <span style={{ color:'var(--ink-3)' }}>El Club I CAN está disponible para el programa INA.</span>
      </ModTile>
    );
  }
  const asistidas  = icanData?.asistidas;
  const requeridas = icanData?.requeridas;
  const hay = asistidas != null || requeridas != null;
  return (
    <ModTile icon="ican" emoji="🎤" title="Club I CAN" status={hay ? 'ok' : 'empty'}
             statusLabel={hay ? 'Disponible' : 'Sin registros'} cta="Ver Club I CAN" onClick={() => onNavigate('ican')}>
      {hay ? (
        <div><strong style={{ color:'var(--ink)' }}>{asistidas ?? '—'}{requeridas ? `/${requeridas}` : ''}</strong> sesiones asistidas · asistencia flexible</div>
      ) : (
        <span style={{ color:'var(--ink-3)' }}>Aún no hay registros de Club I CAN para tu usuario.</span>
      )}
    </ModTile>
  );
}

function ModMensajes({ onNavigate }) {
  return (
    <ModTile icon="messages" title="Mensajes" status="soon" cta="Abrir" onClick={() => onNavigate('mensajes')}>
      <span style={{ color:'var(--ink-3)' }}>No hay mensajes por el momento. Módulo de mensajería pendiente.</span>
    </ModTile>
  );
}

function ModEstadoCuenta({ pendientes, esConape, conapeEstado, onNavigate }) {
  const matPend  = (pendientes?.matricula   || 0) > 0;
  const certPend = (pendientes?.certificado || 0) > 0;
  const cuotaMonto = pendientes?.cuotas_pendiente || 0;
  const cuotaMens  = pendientes?.cuota_mensual    || 0;
  const cuotasPend = cuotaMens > 0 ? Math.round(cuotaMonto / cuotaMens) : (cuotaMonto > 0 ? 1 : 0);
  const total = (matPend ? 1 : 0) + cuotasPend + (certPend ? 1 : 0);
  const alDia = total === 0;
  const fmt = n => '₡' + Number(n||0).toLocaleString('es-CR');
  return (
    <ModTile icon="payments" emoji="💳" title="Pagos y estado de cuenta" status={alDia ? 'ok' : 'pending'}
             statusLabel={alDia ? 'Al día' : `${total} pendiente${total>1?'s':''}`} cta="Ver detalle" onClick={() => onNavigate('pagos')}>
      {alDia ? (
        <div style={{ color:'var(--ok)', fontWeight:600 }}>✓ No tenés conceptos pendientes.</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          {matPend && <div>Matrícula — {fmt(pendientes.matricula)}</div>}
          {cuotasPend > 0 && <div>{cuotasPend} cuota{cuotasPend>1?'s':''} — {fmt(cuotaMonto)}</div>}
          {certPend && <div>Certificado — {fmt(pendientes.certificado)}</div>}
        </div>
      )}
    </ModTile>
  );
}

function ModCertificados({ niveles, onNavigate }) {
  const ORDEN = ['B1','B2','I1','I2'];
  const rows = ORDEN.map(n => ({ n, raw: niveles?.[n] || {}, estatus: estatusDeNivelSD(niveles,n) }));
  const registrados = rows.filter(x => typeof x.raw === 'object' && (x.raw.reg_certificados || x.raw.cert_num));
  const elegibles = rows.filter(x => ['APR','CNV'].includes(x.estatus) && !registrados.includes(x));
  const status = registrados.length ? 'ok' : elegibles.length ? 'pending' : 'empty';
  const label = registrados.length ? `${registrados.length} registrado${registrados.length>1?'s':''}` : elegibles.length ? 'Revisar emisión' : 'Sin registros';
  return (
    <ModTile icon="certificates" emoji="📄" title="Certificados" status={status} statusLabel={label} cta="Consultar estado" onClick={() => onNavigate('certificados')}>
      {registrados.length > 0
        ? <div>Hay <strong>{registrados.length}</strong> número{registrados.length>1?'s':''} oficial{registrados.length>1?'es':''} registrado{registrados.length>1?'s':''}. La pantalla de certificados verificará si existe PDF y enlace.</div>
        : elegibles.length > 0
          ? <div>{elegibles.map(x=>x.n).join(', ')} aprobado/convalidado. La elegibilidad y disponibilidad se verifican por separado.</div>
          : <span style={{ color:'var(--ink-3)' }}>Aún no hay niveles aprobados o convalidados con registro oficial.</span>}
    </ModTile>
  );
}

function ModInsignias({ onNavigate }) {
  return (
    <ModTile icon="certificates" title="Insignias y retos" status="soon" statusLabel="En diseño" cta="Ver próximamente" onClick={() => onNavigate('dashboard')}>
      <span style={{ color:'var(--ink-3)' }}>Aquí aparecerán los logros de retos, juegos de inglés y competencias entre estudiantes o grupos. No se muestran premios ficticios antes de definir las reglas.</span>
    </ModTile>
  );
}

function ModRetro({ retroData, onNavigate }) {
  const items = Array.isArray(retroData?.retroalimentacion) ? retroData.retroalimentacion : [];
  const hay = items.length > 0;
  const ultimo = hay ? items[items.length - 1] : null;
  return (
    <ModTile icon="messages" emoji="💬" title="Retroalimentación" status={hay ? 'ok' : 'empty'}
             statusLabel={hay ? 'Disponible' : 'Sin registros'} cta="Ver notas" onClick={() => onNavigate('notas')}>
      {hay ? (
        <div>
          <div style={{ color:'var(--ink-3)', fontSize:11, marginBottom:2 }}>{retroData.total || items.length} comentario{(retroData.total||items.length)>1?'s':''} de tu profe</div>
          <div style={{ display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>“{ultimo.comentario}”</div>
        </div>
      ) : (
        <span style={{ color:'var(--ink-3)' }}>Aún no hay retroalimentación registrada.</span>
      )}
    </ModTile>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Pequeños subcomponentes
// ─────────────────────────────────────────────────────────────────────────
function Kicker({ children }) {
  return <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3)' }}>{children}</div>;
}
function DashSection({ title, hint }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:12, margin:'4px 2px 12px' }}>
      <h2 style={{ fontFamily:'var(--f-serif)', fontSize:20, fontWeight:500, letterSpacing:'-0.02em', margin:0, color:'var(--an-navy-ink)' }}>{title}</h2>
      {hint && <span style={{ fontSize:11, color:'var(--ink-3)' }}>{hint}</span>}
    </div>
  );
}

function ICANStat({ icanData }) {
  const asistidas = icanData?.asistidas;
  const requeridas = icanData?.requeridas;
  return (
    <Stat
      label="I CAN asistidas"
      num={asistidas != null ? String(asistidas) : '—'}
      suffix={requeridas ? `/${requeridas}` : ''}
      sub={asistidas != null ? 'Club de conversación' : 'Sin registros aún'}
      subTone={asistidas != null && requeridas && asistidas >= requeridas * 0.8 ? 'ok' : ''}
      pct={asistidas && requeridas ? (asistidas/requeridas)*100 : 0}
      color="var(--an-gold)"
    />
  );
}

function NivelChip({ nivel, estatus, activo }) {
  const c = NIVEL_COLOR[nivel] || 'var(--ink-3)';
  const ESTATUS_LABEL = { CA:'Cursando', APR:'Aprobado', CNV:'Convalidado', PE:'Pendiente', RPB:'Reprobado' };
  const label = ESTATUS_LABEL[estatus] || estatus;
  const bg = activo ? c : 'transparent';
  const fg = activo ? 'white' : c;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:'var(--r-pill)', background:bg, border:`1.5px solid ${c}`, color:fg, fontSize:11, fontWeight:700, letterSpacing:'0.04em' }}>
      <strong style={{ fontFamily:'var(--f-mono)' }}>{nivel}</strong>
      <span style={{ opacity: activo ? 1 : 0.85 }}>· {label}</span>
    </span>
  );
}

function DashHeader({ title }) {
  return (
    <div style={{ marginBottom:24 }}>
      <h1 style={{ fontFamily:'var(--f-serif)', fontSize:40, fontWeight:400, letterSpacing:'-0.035em', lineHeight:1.05, margin:0, color:'var(--an-navy-ink)' }}>{title}</h1>
    </div>
  );
}

function SkeletonDashboard() {
  const ln = { background:'var(--bg-deep)', borderRadius:6, height:14 };
  return (
    <div>
      <div className="hero" style={{ minHeight:240 }}>
        <div className="hero-grid">
          <div>
            <div style={{ ...ln, width:120, height:10, marginBottom:14 }} />
            <div style={{ ...ln, width:280, height:48, marginBottom:14 }} />
            <div style={{ ...ln, width:240 }} />
          </div>
          <div style={{ display:'flex', justifyContent:'center' }}>
            <div style={{ width:210, height:210, borderRadius:'50%', background:'var(--bg-deep)' }} />
          </div>
        </div>
      </div>
      <div className="grid-4" style={{ marginTop:20 }}>
        {[0,1,2,3].map(i => (
          <div key={i} className="card" style={{ height:90 }}>
            <div style={{ ...ln, width:80, height:9, marginBottom:10 }} />
            <div style={{ ...ln, width:60, height:24 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonList({ rows = 3 }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 4px', borderBottom: i < rows-1 ? '1px solid var(--line)' : 'none' }}>
          <div style={{ width:50, height:46, borderRadius:6, background:'var(--bg-deep)' }} />
          <div style={{ flex:1 }}>
            <div style={{ background:'var(--bg-deep)', height:12, width:'60%', borderRadius:4, marginBottom:6 }} />
            <div style={{ background:'var(--bg-deep)', height:10, width:'40%', borderRadius:4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { StudentDashboard });
