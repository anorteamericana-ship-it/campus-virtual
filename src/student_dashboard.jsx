/* global React, Icon, Ring, Stat, Chip, AnimatedBar, LEVELS,
   useUsuario, useEstudiante, EmptyState, ErrorState */

// URL del Apps Script: fuente única en data.jsx → window.APPS_SCRIPT_URL
const SCRIPT_URL_SD = window.APPS_SCRIPT_URL;

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

// Calcula nivel_activo a partir del objeto niveles devuelto por getEstudiante
// Acepta dos formas:
//   { B1: 'APR', B2: 'CA', I1: 'PE' }
//   { B1: { estatus:'APR', nota:88 }, ... }
function calcularNivelActivo(niveles, fallback) {
  if (!niveles) return fallback || '';
  const ORDEN = ['B1','B2','I1','I2'];
  const est = (n) => typeof niveles[n] === 'object' ? niveles[n]?.estatus : niveles[n];
  return ORDEN.find(n => est(n) === 'CA')
    || [...ORDEN].reverse().find(n => ['APR','CNV'].includes(est(n)))
    || fallback
    || '';
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
    fetch(`${SCRIPT_URL_SD}?fn=getRetroalimentacionEstudiante&codigo=${encodeURIComponent(codigo)}&token=${encodeURIComponent(window.getSessionToken ? window.getSessionToken() : '')}`)
      .then(r => r.json())
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
    fetch(`${SCRIPT_URL_SD}?fn=getAsistenciaEstudiante&codigo=${encodeURIComponent(codigo)}&token=${encodeURIComponent(window.getSessionToken ? window.getSessionToken() : '')}`)
      .then(r => r.json())
      .then(d => { if (!cancelled && d?.ok) setData(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [codigo]);
  return data;
}

// Próximas lecciones: usa getFechasGrupo del nivel activo
function useProximasLecciones(codGrupo, nivel) {
  const [lecciones, setLecciones] = React.useState(null);
  React.useEffect(() => {
    if (!codGrupo || !nivel) return;
    let cancelled = false;
    fetch(`${SCRIPT_URL_SD}?fn=getFechasGrupo&cod_grupo=${encodeURIComponent(codGrupo)}&nivel=${encodeURIComponent(nivel)}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        if (d?.ok && Array.isArray(d.lecciones)) setLecciones(d.lecciones);
        else setLecciones([]);
      })
      .catch(() => { if (!cancelled) setLecciones([]); });
    return () => { cancelled = true; };
  }, [codGrupo, nivel]);
  return lecciones; // null = cargando · [] = sin datos · [...] = ok
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
// CONAPE (sin cambios — endpoint real)
// ─────────────────────────────────────────────────────────────────────────
function useEstadoConape(cedula) {
  const [estado, setEstado] = React.useState(null);
  React.useEffect(() => {
    if (!cedula) return;
    fetch(`${SCRIPT_URL_SD}?fn=getEstadoConape&cedula=${encodeURIComponent(cedula)}&token=${encodeURIComponent(window.getSessionToken ? window.getSessionToken() : '')}`)
      .then(r => r.json())
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
  // BUG C fix → si `codigo` (REC_M) viene vacío de la sesión, hacemos
  // fallback a la cédula. getEstudiante en Apps Script ahora resuelve
  // por REC_M o por cédula indistintamente.
  const codigo = usr?.codigo || usr?.cedula || '';
  const { data, loading, error, reload } = useEstudiante(codigo);

  // ── Derivar todo lo necesario para los hooks ANTES de cualquier return.
  //    Las Rules of Hooks exigen que useAsistencia/useProximasLecciones/
  //    useEstadoConape se llamen en cada render aunque no haya data todavía.
  const est        = data?.estudiante  || {};
  const niveles    = data?.niveles     || {};
  const grupo      = data?.grupo       || {};
  const pendientes = data?.pendientes  || {};

  const nivelActivo  = calcularNivelActivo(niveles, usr?.nivel_activo);
  const codGrupo     = grupo.CODIGO_GRUPO || est.GRUPO || usr?.grupo || '';
  const esConape     = est.CONVENIO === 'CONAPE';
  const cedula       = est.CEDULA || est.NUM_CEDULA || usr?.cedula || null;

  // Hooks que dependen de los datos derivados — siempre se ejecutan.
  const asistencia    = useAsistencia(codigo);
  const retroData     = useRetroalimentacion(codigo);
  const lecciones     = useProximasLecciones(codGrupo, nivelActivo);
  const conapeEstado  = useEstadoConape(esConape ? cedula : null);

  // Sin sesión activa
  if (!usr) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <EmptyState
          icon="👤"
          title="No hay sesión activa"
          subtitle="Ingresá tu código de estudiante en el panel superior para cargar tu información."
        />
      </div>
    );
  }

  // Loading
  if (loading && !data) {
    return (
      <div>
        <PageHeader title="Cargando tu información…" />
        <SkeletonDashboard />
      </div>
    );
  }

  // Error
  if (error && !data) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  // ── Datos derivados de presentación (post-guards) ───────────────────
  const programa     = grupo.PROGRAMA || usr.programa || 'SIN_INA';
  const nivelNombre  = NIVEL_NOMBRE[nivelActivo] || '—';
  const nivelLibro   = NIVEL_LIBRO[nivelActivo]  || '—';
  const nivelColor   = NIVEL_COLOR[nivelActivo]  || 'var(--an-granate)';
  const docente      = grupo.DOCENTE || '';
  const docenteCorto = docente ? docente.split(' ').slice(0,2).join(' ') : '—';

  // Nombre amable (regla única en data.jsx: 1er nombre de pila, capitalizado)
  const nombreCompleto = est.NOMBRE || usr.nombre || '';
  const nombreCorto = nombreAmable(nombreCompleto);

  // Asistencia derivada
  let asistPresentes = null, asistTotal = null, asistPct = null;
  if (asistencia && Array.isArray(asistencia.asistencia)) {
    asistTotal     = asistencia.asistencia.length;
    asistPresentes = asistencia.asistencia.filter(a => a.estado === 'P').length;
    asistPct       = asistTotal ? Math.round((asistPresentes / asistTotal) * 100) : null;
  }

  // Nota acumulada — del nivel activo
  const notaActiva = notaDeNivel(niveles, nivelActivo);

  // Progreso del módulo / próximos exámenes
  let cerradas = 0, totalLecciones = 0, progresoPct = 0;
  let proximas = [];
  let proximoExamen = null;
  if (Array.isArray(lecciones) && lecciones.length) {
    // contar lecciones únicas para %
    const seen = new Set();
    const unicas = lecciones.filter(l => seen.has(l.leccion) ? false : (seen.add(l.leccion), true));
    totalLecciones = unicas.length;
    cerradas = unicas.filter(l => l.estado === 'CERRADA').length;
    progresoPct = totalLecciones ? Math.round((cerradas / totalLecciones) * 100) : 0;

    proximas = lecciones
      .filter(l => l.estado === 'CALCULADA' || l.estado === 'HOY')
      .slice(0, 4);

    proximoExamen = lecciones.find(l =>
      (l.estado === 'CALCULADA' || l.estado === 'HOY') &&
      (l.tipo === 'EVAL_ORAL' || l.tipo === 'EVAL_ESCRITO')
    );
  }

  // Lista de niveles con datos para chips
  const nivelesChips = ['B1','B2','I1','I2']
    .map(n => ({ nivel: n, estatus: typeof niveles[n] === 'object' ? niveles[n]?.estatus : niveles[n] }))
    .filter(x => x.estatus); // solo los que tienen estatus

  return (
    <div>
      {/* SECCIÓN 1 — Información del programa */}
      <div className="card" style={{
        marginBottom:16, display:'flex', gap:20, alignItems:'flex-start',
        padding:'20px 24px', flexWrap:'wrap',
      }}>
        <div style={{
          width:56, height:56, borderRadius:12, flexShrink:0,
          background:'var(--an-granate)', display:'flex', alignItems:'center',
          justifyContent:'center', color:'white', fontSize:18, fontWeight:700,
          letterSpacing:'0.04em',
        }}>AN</div>
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.08em',
                        textTransform:'uppercase', color:'var(--ink-3)', marginBottom:4 }}>
            Inglés Conversacional Online
          </div>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:18, fontWeight:500,
                        color:'var(--ink)', marginBottom:8, letterSpacing:'-0.015em' }}>
            {nivelNombre} · {programa === 'INA' || programa === 'CON_INA' ? 'INA' : 'Programa propio'}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 16px',
                        fontSize:12, color:'var(--ink-2)' }}>
            {docente             && <span>👤 {docente}</span>}
            {grupo.DIAS_TEXT     && <span>📅 {grupo.DIAS_TEXT}</span>}
            {grupo.HORA_TEXT     && <span>🕐 {grupo.HORA_TEXT}</span>}
            {codGrupo            && <span style={{ fontFamily:'var(--f-mono)', fontSize:11 }}>
              {codGrupo}
            </span>}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexShrink:0, flexWrap:'wrap' }}>
          <a href="https://drive.google.com/drive/folders/1Bm9pK4OvWE944X29bm8S3UWUlWP_G5jO"
             target="_blank" rel="noopener"
             className="btn btn-ghost"
             style={{ fontSize:12, padding:'8px 14px', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6 }}>
            <span>📹</span> Video intro
          </a>
          <a href="https://drive.google.com/drive/folders/1Bm9pK4OvWE944X29bm8S3UWUlWP_G5jO"
             target="_blank" rel="noopener"
             className="btn btn-ghost"
             style={{ fontSize:12, padding:'8px 14px', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6 }}>
            <span>📄</span> Manual
          </a>
        </div>
      </div>

      {/* HERO */}
      <div className="hero">
        <div className="watermark-a">A</div>
        <div className="hero-grid">
          <div>
            <div className="hero-kicker">
              {codGrupo ? `Grupo ${codGrupo}` : 'Tu campus'}
              {docente && ` · Prof. ${docenteCorto}`}
            </div>
            <h1 className="hero-h1">
              Buen día,<br/>
              <em>{nombreCorto || '—'}</em>
            </h1>
            <div className="hero-sub">
              {nivelActivo
                ? <>Estás cursando <strong>{nivelNombre}</strong> — {nivelLibro}.</>
                : <>Tu nivel activo aparecerá acá cuando tu matrícula esté procesada.</>}
            </div>

            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginTop:14 }}>
              {nivelesChips.length > 0 ? (
                nivelesChips.map(({ nivel, estatus }) => (
                  <NivelChip key={nivel}
                             nivel={nivel}
                             estatus={estatus}
                             activo={nivel === nivelActivo} />
                ))
              ) : (
                <span style={{ fontSize:12, color:'var(--ink-3)' }}>Sin niveles registrados aún.</span>
              )}
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'center' }}>
            <Ring pct={progresoPct} size={220}>
              <div className="ring-pct">{progresoPct}<sup>%</sup></div>
              <div className="ring-label">Módulo completado</div>
              <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:4 }}>
                {totalLecciones
                  ? `${cerradas} de ${totalLecciones} lecciones`
                  : 'Sin lecciones registradas'}
              </div>
            </Ring>
          </div>
        </div>
      </div>

      {/* CONAPE banner — solo si está en convenio */}
      {esConape && conapeEstado && (
        <div style={{
          background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
          borderRadius: 12, padding: '16px 20px', color: 'white',
          display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16,
        }}>
          <div style={{ fontSize: 32 }}>🏛️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
              Financiamiento CONAPE
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
              {conapeEstado.estadoTexto || '—'}
            </div>
            {conapeEstado.desembolsoTexto && (
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                {conapeEstado.desembolsoTexto}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sílabus obligatorio INA — solo si no se ha visto */}
      {programa === 'INA' && (() => {
        const visto = (() => { try { return localStorage.getItem('an_sil_visto_' + codigo) === '1'; } catch { return false; } })();
        if (visto) return null;
        return (
          <div style={{ marginBottom:16, padding:'16px 20px', background:'linear-gradient(135deg, color-mix(in srgb, var(--an-granate) 8%, white), white)', border:'2px solid var(--an-granate)', borderRadius:'var(--r-lg)', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <div style={{ width:44, height:44, borderRadius:'50%', background:'var(--an-granate)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:20 }}>📋</div>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontWeight:700, fontSize:14, color:'var(--an-granate-ink)' }}>Material obligatorio INA — antes de empezar</div>
              <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:2 }}>Reglamento estudiantil, netiqueta y video de bienvenida. Requerido por Resolución 2519.</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={() => { try { localStorage.setItem('an_sil_visto_' + codigo, '1'); } catch {} window.location.reload(); }}>Ya lo revisé</button>
              <button className="btn btn-primary" style={{ fontSize:12, background:'var(--an-granate)', borderColor:'var(--an-granate)' }} onClick={() => onNavigate('info_programa')}>Revisar ahora →</button>
            </div>
          </div>
        );
      })()}

      {/* KPI stats — todos con datos reales o "—" */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <Stat
          label="Asistencia"
          num={asistPct != null ? String(asistPct) : '—'}
          suffix={asistPct != null ? '%' : ''}
          sub={asistTotal != null ? `${asistPresentes} de ${asistTotal} clases` : 'Sin datos'}
          subTone={asistPct != null && asistPct >= 80 ? 'ok' : ''}
          pct={asistPct || 0}
          color="var(--ok)"
        />
        <Stat
          label="Nota acumulada"
          num={notaActiva != null ? String(notaActiva) : '—'}
          suffix={notaActiva != null ? '/100' : ''}
          sub={notaActiva != null ? `Nivel ${nivelActivo || '—'}` : 'Sin evaluaciones aún'}
          subTone={notaActiva != null && notaActiva >= 80 ? 'ok' : ''}
          pct={notaActiva || 0}
          color="var(--an-granate)"
        />
        <Stat
          label="Lecciones dadas"
          num={totalLecciones ? String(cerradas) : '—'}
          suffix={totalLecciones ? `/${totalLecciones}` : ''}
          sub={totalLecciones ? `${progresoPct}% del módulo` : 'Sin calendario aún'}
          subTone=""
          pct={progresoPct}
          color="var(--an-navy)"
        />
        {programa === 'INA' ? (
          <ICANStatCard codigo={codigo} />
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
                : 'Sin datos'}
            subTone={pendientes.cuotas_pendientes === 0 ? 'ok' : pendientes.cuotas_pendientes ? 'warn' : ''}
            pct={pendientes.cuotas_total ? ((pendientes.cuotas_total - (pendientes.cuotas_pendientes||0)) / pendientes.cuotas_total)*100 : 0}
            color="var(--an-gold)"
          />
        )}
      </div>

      {/* Insignias calculadas desde datos reales */}
      {(() => {
        const asistPct2 = asistencia?.asistencia?.length > 0
          ? Math.round(asistencia.asistencia.filter(a => a.presente).length / asistencia.asistencia.length * 100)
          : 0;
        const leccCerr2 = lecciones?.filter(l => l.estado === 'CERRADA')?.length || 0;
        const badges = [
          { emoji:'🎓', label:'Primera clase',   ok: asistencia?.asistencia?.length > 0 },
          { emoji:'⏰', label:'Siempre puntual',  ok: asistPct2 >= 85 && asistencia?.asistencia?.length > 0 },
          { emoji:'📝', label:'Primer examen',    ok: Object.values(niveles).some(n => (typeof n==='object'?n.nota:0) > 0) },
          { emoji:'🏃', label:'Mitad del camino', ok: leccCerr2 >= 16 },
          { emoji:'🏆', label:'Nivel completo',   ok: Object.values(niveles).some(n => (typeof n==='object'?n.estatus:n)==='APR') },
          { emoji:'💳', label:'Al día',           ok: (pendientes?.matricula||0)===0 && (pendientes?.cuotas_pendiente||0)===0 },
        ];
        const desbloqueadas = badges.filter(b => b.ok).length;
        return (
          <div className="card" style={{ marginBottom:16 }}>
            <div className="card-h">
              <div className="card-title">Insignias</div>
              <span style={{ fontSize:12, color:'var(--ink-3)' }}>{desbloqueadas} desbloqueada{desbloqueadas!==1?'s':''}</span>
            </div>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              {badges.map((b,i) => (
                <div key={i} title={b.label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, opacity: b.ok ? 1 : 0.3, filter: b.ok ? 'none' : 'grayscale(1)' }}>
                  <div style={{ fontSize:28 }}>{b.emoji}</div>
                  <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color: b.ok ? 'var(--ink)' : 'var(--ink-3)', textAlign:'center', maxWidth:56 }}>{b.label}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Próximas clases + próximo examen */}
      <div className="grid-2">
        {/* Timeline */}
        <div className="card">
          <div className="card-h">
            <div className="card-title">Próximas clases</div>
            <button className="btn btn-ghost" onClick={() => onNavigate('cronograma_grupo')}>
              Ver calendario →
            </button>
          </div>
          {lecciones === null ? (
            <SkeletonList rows={4} />
          ) : proximas.length === 0 ? (
            <div style={{ padding:'24px 12px', textAlign:'center', color:'var(--ink-3)', fontSize:13 }}>
              {totalLecciones ? '¡Felicidades! No tienes clases por venir en este módulo.' : 'Aún no hay calendario publicado para tu grupo.'}
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
                    <div style={{
                      width:50, textAlign:'center',
                      padding:'6px 4px', borderRadius:'var(--r-sm)',
                      background:'var(--bg-deep)',
                    }}>
                      <div style={{ fontFamily:'var(--f-serif)', fontSize:18, fontWeight:600, lineHeight:1, color:'var(--ink)' }}>
                        {fmtFechaCorta(l.fecha).split(' ')[0]}
                      </div>
                      <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-3)', marginTop:2 }}>
                        {fmtFechaCorta(l.fecha).split(' ')[1]}
                      </div>
                    </div>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        <strong style={{ fontFamily:'var(--f-mono)', fontSize:13 }}>
                          Lec {String(l.leccion).padStart(2,'0')}
                        </strong>
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
          {/* Próximo examen */}
          {proximoExamen ? (
            <div className="card" style={{ background:'linear-gradient(135deg, #FCF6E5, #FBEEC9)', border:'1px solid var(--an-gold-soft)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'var(--an-gold)', color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon name="bolt" size={18} className="" />
                </div>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'#6B4A00' }}>
                    Próximo examen · {(() => {
                      const d = diasEntreSD(proximoExamen.fecha);
                      return d === 0 ? 'hoy' : d === 1 ? 'mañana' : `en ${d} días`;
                    })()}
                  </div>
                  <div style={{ fontFamily:'var(--f-serif)', fontSize:18, fontWeight:500, color:'var(--an-navy-ink)' }}>
                    {proximoExamen.tipo === 'EVAL_ORAL' ? 'Examen Oral' : 'Examen Escrito'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize:12, color:'var(--ink-2)' }}>
                Lección {proximoExamen.leccion} · {fmtFechaCorta(proximoExamen.fecha)}
                {proximoExamen.turno ? ` · ${proximoExamen.turno}` : ''}
              </div>
            </div>
          ) : (
            <div className="card" style={{ opacity:0.7 }}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:6 }}>
                Próximo examen
              </div>
              <div style={{ fontSize:13, color:'var(--ink-3)' }}>
                {totalLecciones ? 'Sin exámenes por venir en este módulo.' : 'Disponible cuando se publique el calendario.'}
              </div>
            </div>
          )}

          {/* Estado de pendientes */}
          <PendientesCard pendientes={pendientes} onNavigate={onNavigate} />
        </div>
      </div>

      {/* Retroalimentación reciente del profe */}
      {retroData?.retroalimentacion?.length > 0 && (() => {
        const items = retroData.retroalimentacion.slice(-3).reverse();
        return (
          <div className="card" style={{ marginTop:16 }}>
            <div className="card-h">
              <div className="card-title">Retroalimentación de tu profe</div>
              <span style={{ fontSize:11, color:'var(--ink-3)' }}>{retroData.total} comentario{retroData.total!==1?'s':''}</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {items.map((r, i) => (
                <div key={i} style={{ padding:'12px 4px', borderBottom: i < items.length-1 ? '1px solid var(--line)' : 'none', display:'grid', gridTemplateColumns:'auto 1fr', gap:12, alignItems:'flex-start' }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background: r.tipo==='progress_check' ? 'color-mix(in srgb, var(--an-gold) 15%, white)' : 'color-mix(in srgb, var(--an-navy) 8%, white)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                    {r.tipo === 'progress_check' ? '📊' : '💬'}
                  </div>
                  <div>
                    <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                      <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-3)' }}>
                        {r.tipo === 'progress_check' ? 'Progress Check' : 'Lección'} {r.leccion_num}
                      </span>
                      {r.fecha && <span style={{ fontSize:10, color:'var(--ink-3)' }}>{r.fecha}</span>}
                    </div>
                    <div style={{ fontSize:13, color:'var(--ink)', lineHeight:1.5 }}>{r.comentario}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Subcomponentes
// ─────────────────────────────────────────────────────────────────────────
function NivelChip({ nivel, estatus, activo }) {
  const c = NIVEL_COLOR[nivel] || 'var(--ink-3)';
  const ESTATUS_LABEL = {
    CA:  'Cursando',
    APR: 'Aprobado',
    CNV: 'Convalidado',
    PE:  'Pendiente',
    RPB: 'Reprobado',
  };
  const label = ESTATUS_LABEL[estatus] || estatus;
  const bg = activo ? c : 'transparent';
  const fg = activo ? 'white' : c;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding:'4px 10px', borderRadius:'var(--r-pill)',
      background: bg,
      border: `1.5px solid ${c}`,
      color: fg, fontSize:11, fontWeight:700,
      letterSpacing:'0.04em',
    }}>
      <strong style={{ fontFamily:'var(--f-mono)' }}>{nivel}</strong>
      <span style={{ opacity: activo ? 1 : 0.85 }}>· {label}</span>
    </span>
  );
}

function PendientesCard({ pendientes, onNavigate }) {
  // v4.15: leer campos reales del GS
  const matPend  = (pendientes?.matricula   || 0) > 0;
  const certPend = (pendientes?.certificado || 0) > 0;
  const cuotaMonto = pendientes?.cuotas_pendiente || 0;
  const cuotaMens  = pendientes?.cuota_mensual    || 0;
  const nCuotas    = pendientes?.n_cuotas_periodo || 4;
  const cuotasPend = cuotaMens > 0 ? Math.round(cuotaMonto / cuotaMens) : (cuotaMonto > 0 ? 1 : 0);
  const total = (matPend ? 1 : 0) + cuotasPend + (certPend ? 1 : 0);
  const alDia = total === 0;
  const fmt = n => '₡' + Number(n||0).toLocaleString('es-CR');
  return (
    <div className="card">
      <div className="card-h">
        <div className="card-title" style={{ fontSize:16 }}>Estado de cuenta</div>
        {alDia ? <Chip tone="green" dot>Al día</Chip> : <Chip tone="gold">{total} pendiente{total>1?'s':''}</Chip>}
      </div>
      {alDia ? (
        <div style={{ padding:'14px 12px', textAlign:'center', background:'color-mix(in srgb, var(--ok) 8%, white)', borderRadius:'var(--r-md)', color:'var(--ok)', fontSize:13, fontWeight:600 }}>✓ Todo al día.</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:12, color:'var(--ink-2)' }}>
          {matPend && <div>• Matrícula pendiente — {fmt(pendientes.matricula)}</div>}
          {cuotasPend > 0 && <div>• {cuotasPend} cuota{cuotasPend>1?'s':''} — {fmt(cuotaMonto)}</div>}
          {certPend && <div>• Certificado — {fmt(pendientes.certificado)}</div>}
        </div>
      )}
      <button className="btn btn-ghost" style={{ width:'100%', marginTop:10 }} onClick={() => onNavigate('pagos')}>Ver detalle →</button>
    </div>
  );
}

// I CAN stat — solo se renderiza para programa INA
function ICANStatCard({ codigo }) {
  const [data, setData] = React.useState(null);
  React.useEffect(() => {
    if (!codigo) return;
    fetch(`${SCRIPT_URL_SD}?fn=getICANEstudiante&codigo=${encodeURIComponent(codigo)}&token=${encodeURIComponent(window.getSessionToken ? window.getSessionToken() : '')}`)
      .then(r => r.json())
      .then(d => { if (d?.ok) setData(d); })
      .catch(() => {});
  }, [codigo]);
  const asistidas = data?.asistidas;
  const requeridas = data?.requeridas;
  return (
    <Stat
      label="I CAN asistidas"
      num={asistidas != null ? String(asistidas) : '—'}
      suffix={requeridas ? `/${requeridas}` : ''}
      sub={asistidas != null ? 'Club de conversación' : 'Sin datos aún'}
      subTone={asistidas != null && requeridas && asistidas >= requeridas * 0.8 ? 'ok' : ''}
      pct={asistidas && requeridas ? (asistidas/requeridas)*100 : 0}
      color="var(--an-gold)"
    />
  );
}

// (PageHeaderSD eliminado — usa <PageHeader/> de student_modules.jsx.)

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
            <div style={{ width:220, height:220, borderRadius:'50%', background:'var(--bg-deep)' }} />
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
        <div key={i} style={{
          display:'flex', alignItems:'center', gap:12,
          padding:'10px 4px', borderBottom: i < rows-1 ? '1px solid var(--line)' : 'none',
        }}>
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
