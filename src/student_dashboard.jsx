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

// ─────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────
function StudentDashboard({ toast, onNavigate }) {
  const usr    = useUsuario();
  const go     = (t) => (onNavigate ? onNavigate(t) : null);
  // BUG C fix → si `codigo` (REC_M) viene vacío de la sesión, fallback a cédula.
  const codigo = usr?.codigo || usr?.cedula || '';
  const { data, loading, error, reload } = useEstudiante(codigo);

  // ── Derivar todo lo necesario para los hooks ANTES de cualquier return.
  const est        = data?.estudiante  || {};
  const niveles    = data?.niveles     || {};
  const grupo      = data?.grupo       || {};
  const pendientes = data?.pendientes  || {};

  const codGrupo     = grupo.CODIGO_GRUPO || est.GRUPO || usr?.grupo || usr?.grupoActivo || '';
  // Nivel activo real; si no hay, inferimos del código de grupo para PODER
  // consultar el cronograma (caso 1794). Para textos usamos solo el real.
  const nivelReal    = calcularNivelActivo(niveles, usr?.nivel_activo);
  const nivelParaCal = nivelReal || inferirNivelDesdeGrupo(codGrupo);
  const esConape     = est.CONVENIO === 'CONAPE';
  const cedula       = est.CEDULA || est.NUM_CEDULA || usr?.cedula || null;
  const programa     = grupo.PROGRAMA || usr?.programa || 'SIN_INA';
  const esINA        = programa === 'INA' || programa === 'CON_INA';

  // Hooks que dependen de los datos derivados — siempre se ejecutan.
  const asistencia    = useAsistencia(codigo);
  const retroData     = useRetroalimentacion(codigo);
  const lecciones     = useProximasLecciones(codGrupo, nivelParaCal);
  const conapeEstado  = useEstadoConape(esConape ? cedula : null);
  const evaluaciones  = useEvaluaciones(codigo);
  const icanData      = useICAN(codigo, esINA);

  // Sin sesión activa
  if (!usr) {
    return (
      <div data-screen-label="Estudiante · Dashboard">
        <DashHeader title="Dashboard" />
        <EmptyState
          icon="👤"
          title="No hay sesión activa"
          subtitle="Ingresá tu código de estudiante en el panel superior para cargar tu información."
        />
      </div>
    );
  }
  if (loading && !data) {
    return (
      <div data-screen-label="Estudiante · Dashboard">
        <DashHeader title="Cargando tu información…" />
        <SkeletonDashboard />
      </div>
    );
  }
  if (error && !data) {
    return (
      <div data-screen-label="Estudiante · Dashboard">
        <DashHeader title="Dashboard" />
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  // ── Datos derivados de presentación ─────────────────────────────────
  const nivelNombre  = NIVEL_NOMBRE[nivelReal] || '';
  const docente      = grupo.DOCENTE || '';
  const docenteCorto = docente ? docente.split(' ').slice(0,2).join(' ') : '';

  // Nombre COMPLETO (no solo el primer nombre).
  const nombreCompleto = nombreCompletoLegible(est.NOMBRE || usr.nombre || '') || '—';

  // Asistencia derivada (campo unificado)
  let asistPresentes = null, asistTotal = null, asistPct = null;
  if (asistencia && Array.isArray(asistencia.asistencia)) {
    asistTotal     = asistencia.asistencia.length;
    asistPresentes = asistencia.asistencia.filter(esPresente).length;
    asistPct       = asistTotal ? Math.round((asistPresentes / asistTotal) * 100) : null;
  }

  // Nota acumulada — del nivel activo
  const notaActiva = notaDeNivel(niveles, nivelReal);

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

  // Chips de niveles
  const nivelesChips = ['B1','B2','I1','I2']
    .map(n => ({ nivel: n, estatus: typeof niveles[n] === 'object' ? niveles[n]?.estatus : niveles[n] }))
    .filter(x => x.estatus);

  return (
    <div data-screen-label="Estudiante · Dashboard">
      {/* ── BLOQUE OBLIGATORIO · ANTES DE EMPEZAR (primer bloque — INA/CONAPE) ─ */}
      <AntesDeEmpezar codigo={codigo} onNavigate={go} />

      {/* ── SALUDO (nombre completo) ─────────────────────────────────── */}
      <div className="hero" style={{ marginBottom: 18 }}>
        <div className="watermark-a">A</div>
        <div className="hero-grid">
          <div>
            <div className="hero-kicker">
              {codGrupo ? `Grupo ${codGrupo}` : 'Tu campus'}
              {docenteCorto && ` · Prof. ${docenteCorto}`}
            </div>
            <h1 className="hero-h1">
              Buen día,<br/>
              <em>{nombreCompleto}</em>
            </h1>
            <div className="hero-sub">
              {nivelReal
                ? <>Estás cursando <strong>{nivelNombre}</strong> — {NIVEL_LIBRO[nivelReal]}.</>
                : <>Tu nivel activo aparecerá acá cuando tu matrícula esté procesada.</>}
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginTop:14 }}>
              {nivelesChips.length > 0 ? (
                nivelesChips.map(({ nivel, estatus }) => (
                  <NivelChip key={nivel} nivel={nivel} estatus={estatus} activo={nivel === nivelReal} />
                ))
              ) : (
                <span style={{ fontSize:12, color:'var(--ink-3)' }}>Sin niveles registrados aún.</span>
              )}
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'center' }}>
            <Ring pct={progresoPct} size={210}>
              <div className="ring-pct">{progresoPct}<sup>%</sup></div>
              <div className="ring-label">Módulo completado</div>
              <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:4, textAlign:'center', maxWidth:150 }}>
                {cronoPublicado
                  ? `${cerradas} de ${totalLecciones} lecciones`
                  : 'Cronograma no publicado aún'}
              </div>
            </Ring>
          </div>
        </div>
      </div>

      {/* ── RESUMEN ACADÉMICO (dinámico por nivel real) ──────────────── */}
      <ResumenAcademico nivelReal={nivelReal} programa={programa} />

      {/* ── KPIs ─────────────────────────────────────────────────────── */}
      <div className="grid-4" style={{ marginBottom: 18 }}>
        <Stat
          label="Asistencia"
          num={asistPct != null ? String(asistPct) : '—'}
          suffix={asistPct != null ? '%' : ''}
          sub={asistTotal != null ? `${asistPresentes} de ${asistTotal} clases` : 'Sin registros aún'}
          subTone={asistPct != null && asistPct >= 80 ? 'ok' : ''}
          pct={asistPct || 0}
          color="var(--ok)"
        />
        <Stat
          label="Nota acumulada"
          num={notaActiva != null ? String(notaActiva) : '—'}
          suffix={notaActiva != null ? '/100' : ''}
          sub={notaActiva != null ? `Nivel ${nivelReal || '—'}` : 'Sin evaluación final aún'}
          subTone={notaActiva != null && notaActiva >= 80 ? 'ok' : ''}
          pct={notaActiva || 0}
          color="var(--an-granate)"
        />
        <Stat
          label="Lecciones dadas"
          num={cronoPublicado ? String(cerradas) : '—'}
          suffix={cronoPublicado ? `/${totalLecciones}` : ''}
          sub={cronoPublicado ? `${progresoPct}% del módulo` : 'Cronograma no publicado'}
          subTone=""
          pct={progresoPct}
          color="var(--an-navy)"
        />
        {esINA ? (
          <ICANStat icanData={icanData} />
        ) : (
          <Stat
            label="Cuotas al día"
            num={pendientes.cuotas_pendientes != null
              ? String(Math.max(0, (pendientes.cuotas_total || 4) - pendientes.cuotas_pendientes))
              : '—'}
            suffix={pendientes.cuotas_total ? `/${pendientes.cuotas_total}` : ''}
            sub={pendientes.cuotas_pendientes === 0 ? 'Todo al día ✓'
              : pendientes.cuotas_pendientes
                ? `${pendientes.cuotas_pendientes} pendiente${pendientes.cuotas_pendientes>1?'s':''}`
                : 'Sin registros'}
            subTone={pendientes.cuotas_pendientes === 0 ? 'ok' : pendientes.cuotas_pendientes ? 'warn' : ''}
            pct={pendientes.cuotas_total ? ((pendientes.cuotas_total - (pendientes.cuotas_pendientes||0)) / pendientes.cuotas_total)*100 : 0}
            color="var(--an-gold)"
          />
        )}
      </div>

      {/* ── TARJETAS-MÓDULO (estado real por bloque) ─────────────────── */}
      <DashSection title="Tus módulos" hint="Cada bloque refleja su estado real" />
      <div className="grid-mods" style={{ marginBottom: 20 }}>
        <ModNotas niveles={niveles} nivelReal={nivelReal} notaActiva={notaActiva} evaluaciones={evaluaciones} onNavigate={go} />
        <ModTareas onNavigate={go} />
        <ModInfoCurso nivelReal={nivelReal} codGrupo={codGrupo} grupo={grupo} programa={programa} onNavigate={go} />
        <ModICAN esINA={esINA} icanData={icanData} onNavigate={go} />
        <ModMensajes onNavigate={go} />
        <ModEstadoCuenta pendientes={pendientes} esConape={esConape} conapeEstado={conapeEstado} onNavigate={go} />
        <ModCertificados niveles={niveles} onNavigate={go} />
        <ModRetro retroData={retroData} onNavigate={go} />
      </div>

      {/* ── CALENDARIO / PRÓXIMAS CLASES + EXAMEN ────────────────────── */}
      <DashSection title="Tu calendario" hint="Lecciones reales de tu grupo" />
      <div className="grid-2">
        <div className="card">
          <div className="card-h">
            <div className="card-title">Próximas clases</div>
            <button className="btn btn-ghost" onClick={() => go('cronograma_grupo')}>Ver calendario →</button>
          </div>
          {lecciones === null ? (
            <SkeletonList rows={4} />
          ) : !cronoPublicado ? (
            <div style={{ padding:'28px 16px', textAlign:'center', color:'var(--ink-3)', fontSize:13, lineHeight:1.55 }}>
              <div style={{ fontSize:26, opacity:0.4, marginBottom:6 }}>🗓️</div>
              El cronograma de tu grupo aún no está publicado.
              <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:4 }}>
                Cuando administración publique las fechas de {codGrupo || 'tu grupo'}, aparecerán acá.
              </div>
            </div>
          ) : proximas.length === 0 ? (
            <div style={{ padding:'24px 12px', textAlign:'center', color:'var(--ink-3)', fontSize:13 }}>
              ¡Felicidades! No tenés clases por venir en este módulo.
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column' }}>
              {proximas.map((l, i) => {
                const dias = diasEntreSD(l.fecha);
                const etiq = dias === 0 ? 'Hoy' : dias === 1 ? 'Mañana' : dias > 1 ? `En ${dias} días` : '—';
                const esExamen = l.tipo === 'EVAL_ORAL' || l.tipo === 'EVAL_ESCRITO';
                const esPC     = l.tipo === 'PROGRESS_CHECK';
                return (
                  <div key={i} style={{
                    display:'grid', gridTemplateColumns:'auto 1fr auto', gap:14,
                    alignItems:'center', padding:'12px 4px',
                    borderBottom: i < proximas.length-1 ? '1px solid var(--line)' : 'none',
                  }}>
                    <div style={{ width:50, textAlign:'center', padding:'6px 4px', borderRadius:'var(--r-sm)', background:'var(--bg-deep)' }}>
                      <div style={{ fontFamily:'var(--f-serif)', fontSize:18, fontWeight:600, lineHeight:1, color:'var(--ink)' }}>
                        {fmtFechaCorta(l.fecha).split(' ')[0]}
                      </div>
                      <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-3)', marginTop:2 }}>
                        {fmtFechaCorta(l.fecha).split(' ')[1]}
                      </div>
                    </div>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        <strong style={{ fontFamily:'var(--f-mono)', fontSize:13 }}>Lec {String(l.leccion).padStart(2,'0')}</strong>
                        {esExamen && <Chip tone="red">Examen</Chip>}
                        {esPC && <Chip tone="navy">Progress Check</Chip>}
                        {l.estado === 'HOY' && <Chip tone="gold" dot>Hoy</Chip>}
                      </div>
                      <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>
                        {l.dia}{l.turno ? ` · ${l.turno}` : ''} · {etiq}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {proximoExamen ? (
            <div className="card" style={{ background:'linear-gradient(135deg, #FCF6E5, #FBEEC9)', border:'1px solid var(--an-gold-soft)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'var(--an-gold)', color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon name="bolt" size={18} className="" />
                </div>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'#6B4A00' }}>
                    Próximo examen
                  </div>
                  <div style={{ fontFamily:'var(--f-serif)', fontSize:18, fontWeight:500, color:'var(--an-navy-ink)', marginTop:2 }}>
                    {proximoExamen.tipo === 'EVAL_ORAL' ? 'Examen Oral' : 'Examen Escrito'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize:12, color:'var(--ink-2)' }}>
                Lección {proximoExamen.leccion} · {fmtFechaCorta(proximoExamen.fecha)}{proximoExamen.turno ? ` · ${proximoExamen.turno}` : ''}
                {(() => { const d = diasEntreSD(proximoExamen.fecha); const t = d === 0 ? 'hoy' : d === 1 ? 'mañana' : `en ${d} días`; return <strong style={{ color:'#6B4A00' }}> · {t}</strong>; })()}
              </div>
            </div>
          ) : (
            <div className="card" style={{ opacity:0.75 }}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:6 }}>Próximo examen</div>
              <div style={{ fontSize:13, color:'var(--ink-3)' }}>
                {cronoPublicado ? 'Sin exámenes por venir en este módulo.' : 'Disponible cuando se publique el cronograma.'}
              </div>
            </div>
          )}

          {/* CONAPE — solo si está en convenio y hay estado real */}
          {esConape && conapeEstado && (
            <div style={{ background:'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)', borderRadius:12, padding:'16px 20px', color:'white', display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ fontSize:30 }}>🏛️</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, opacity:0.75, fontWeight:600, letterSpacing:1, textTransform:'uppercase' }}>Financiamiento CONAPE</div>
                <div style={{ fontSize:15, fontWeight:700, marginTop:2 }}>{conapeEstado.estadoTexto || '—'}</div>
                {conapeEstado.desembolsoTexto && <div style={{ fontSize:12, opacity:0.8, marginTop:4 }}>{conapeEstado.desembolsoTexto}</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STUDENT-CONTACT-ADMIN-002: bloque de ayuda general → contacto de
          ADMINISTRACIÓN dinámico. Solo muestra el botón si hay número real
          (hideWhenPending); nunca se inventa contacto. */}
      {typeof window.ContactoAdmin === 'function' && (
        <div className="card" style={{ marginTop:18, padding:'14px 18px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:220, fontSize:13, color:'var(--ink-2)' }}>
            <strong style={{ color:'var(--ink)' }}>¿Necesitás ayuda con tu campus?</strong>{' '}
            Soporte general y datos personales.
          </div>
          <window.ContactoAdmin est={est} tipo="administracion" hideWhenPending />
        </div>
      )}
    </div>
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
            Material obligatorio · Resolución 2519
          </div>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, color:'var(--an-navy-ink)', letterSpacing:'-0.02em', lineHeight:1.15 }}>
            Antes de empezar tu programa
          </div>
          <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2, lineHeight:1.4 }}>
            Revisá estos materiales en <strong>Información del Programa</strong> antes de tu primera lección. Ocultar solo afecta esta vista; no es registro oficial de lectura.
          </div>
        </div>
        <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={toggle}>
          {oculto ? 'Ver material' : 'Ocultar'}
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
  const programaLbl = programa === 'INA' || programa === 'CON_INA' ? 'INA · Resolución 2519' : 'Programa propio';

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
function ModTile({ icon, title, status, statusLabel, children, cta = 'Abrir', onClick }) {
  return (
    <div className="mod-tile" onClick={onClick} role="button" tabIndex={0}
         onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick && onClick(); } }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, minWidth:0 }}>
          <span style={{ width:30, height:30, borderRadius:8, background:'var(--bg-deep)', color:'var(--ink-2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Icon name={icon} size={16} className="" />
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
  const horario  = [grupo.DIAS_TEXT, grupo.HORA_TEXT].filter(Boolean).join(' · ');
  const modalidad = programa === 'INA' || programa === 'CON_INA' ? 'INA' : 'Programa propio';
  const hay = !!(codGrupo || docente || horario);
  return (
    <ModTile icon="doc" title="Información del curso" status={hay ? 'ok' : 'empty'}
             statusLabel={hay ? 'Disponible' : 'Sin registros'} cta="Ver programa" onClick={() => onNavigate('info_programa')}>
      {hay ? (
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          <div>{nivelReal ? (NIVEL_NOMBRE[nivelReal] || nivelReal) : 'Nivel actual'} · {modalidad}</div>
          {codGrupo && <div style={{ fontFamily:'var(--f-mono)', fontSize:11, color:'var(--ink-3)' }}>{codGrupo}</div>}
          {docente && <div style={{ color:'var(--ink-3)' }}>Prof. {docente}</div>}
          {horario && <div style={{ color:'var(--ink-3)' }}>{horario}</div>}
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
      <ModTile icon="ican" title="Club I CAN" status="empty" statusLabel="No aplica" cta="Más info" onClick={() => onNavigate('ican')}>
        <span style={{ color:'var(--ink-3)' }}>El Club I CAN está disponible para el programa INA.</span>
      </ModTile>
    );
  }
  const asistidas  = icanData?.asistidas;
  const requeridas = icanData?.requeridas;
  const hay = asistidas != null || requeridas != null;
  return (
    <ModTile icon="ican" title="Club I CAN" status={hay ? 'ok' : 'empty'}
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
    <ModTile icon="payments" title="Estado de cuenta" status={alDia ? 'ok' : 'pending'}
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
      {esConape && conapeEstado?.estadoTexto && (
        <div style={{ marginTop:6, fontSize:11, color:'var(--an-navy)', fontWeight:600 }}>CONAPE: {conapeEstado.estadoTexto}</div>
      )}
    </ModTile>
  );
}

function ModCertificados({ niveles, onNavigate }) {
  const ORDEN = ['B1','B2','I1','I2'];
  const est = (n) => typeof niveles?.[n] === 'object' ? niveles[n]?.estatus : niveles?.[n];
  const disponibles = ORDEN.filter(n => ['APR','CNV'].includes(est(n)));
  const hay = disponibles.length > 0;
  return (
    <ModTile icon="certificates" title="Certificaciones" status={hay ? 'ok' : 'empty'}
             statusLabel={hay ? 'Disponible' : 'Sin registros'} cta="Ver certificados" onClick={() => onNavigate('certificados')}>
      {hay ? (
        <div><strong style={{ color:'var(--ink)' }}>{disponibles.length}</strong> certificado{disponibles.length>1?'s':''} disponible{disponibles.length>1?'s':''} ({disponibles.join(', ')})</div>
      ) : (
        <span style={{ color:'var(--ink-3)' }}>Se desbloquean al aprobar o convalidar un nivel.</span>
      )}
    </ModTile>
  );
}

function ModRetro({ retroData, onNavigate }) {
  const items = Array.isArray(retroData?.retroalimentacion) ? retroData.retroalimentacion : [];
  const hay = items.length > 0;
  const ultimo = hay ? items[items.length - 1] : null;
  return (
    <ModTile icon="messages" title="Retroalimentación" status={hay ? 'ok' : 'empty'}
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
