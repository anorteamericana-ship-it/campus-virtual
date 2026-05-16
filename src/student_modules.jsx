/* global React, Icon, Ring, Chip, Stat, AnimatedBar, LEVELS, PRECIOS,
   useUsuario, useEstudiante, EmptyState, ErrorState */
// ──────────────────────────────────────────────────────────────────────────
// student_modules.jsx — vistas del estudiante (sin datos inventados)
// Cada módulo lee del Apps Script o muestra un estado vacío honesto.
// ──────────────────────────────────────────────────────────────────────────

const SCRIPT_URL_SM = 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';

const NIVEL_NOMBRE_SM = { B1:'Básico I', B2:'Básico II', I1:'Intermedio I', I2:'Intermedio II' };
const NIVEL_LIBRO_SM  = { B1:'Interchange Intro', B2:'Interchange 1', I1:'Interchange 2', I2:'Interchange 3' };
const NIVEL_COLOR_SM  = { B1:'#E5A823', B2:'#E8372A', I1:'#2B7FC1', I2:'#4CAF50' };

const ESTATUS_LABEL_SM = {
  CA:  'Cursando',
  APR: 'Aprobado',
  CNV: 'Convalidado',
  PE:  'Pendiente',
  RPB: 'Reprobado',
};

function calcularNivelActivoSM(niveles, fallback) {
  if (!niveles) return fallback || '';
  const ORDEN = ['B1','B2','I1','I2'];
  const est = (n) => typeof niveles[n] === 'object' ? niveles[n]?.estatus : niveles[n];
  return ORDEN.find(n => est(n) === 'CA')
    || [...ORDEN].reverse().find(n => ['APR','CNV'].includes(est(n)))
    || fallback || '';
}
function estatusDe(niveles, nivel) {
  const v = niveles?.[nivel];
  return (typeof v === 'object' ? v?.estatus : v) || '';
}
function notaDeNivelSM(niveles, nivel) {
  const v = niveles?.[nivel];
  return typeof v === 'object' ? (v?.nota ?? v?.NOTA ?? null) : null;
}

// ──────────────────────────────────────────────────────────────────────────
// Shared PageHeader (re-exported para otros módulos)
// ──────────────────────────────────────────────────────────────────────────
function PageHeader({ kicker, title, sub, right }) {
  return (
    <div style={{ marginBottom:24, display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
      <div>
        {kicker && <div className="hero-kicker" style={{ marginBottom:8 }}>{kicker}</div>}
        <h1 style={{ fontFamily:'var(--f-serif)', fontSize:40, fontWeight:400, letterSpacing:'-0.035em', lineHeight:1.05, margin:0, color:'var(--an-navy-ink)' }}>
          {title}
        </h1>
        {sub && <div style={{ fontSize:13, color:'var(--ink-2)', marginTop:6, maxWidth:640 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// Pequeño guard: si no hay sesión, mostrar bloque uniforme.
function GuardSesion({ children, usr }) {
  if (!usr) {
    return (
      <EmptyState
        icon="👤"
        title="No hay sesión activa"
        subtitle="Ingresá tu código de estudiante en el panel superior para cargar esta vista."
      />
    );
  }
  return children;
}

// Hook compartido: getEstudiante por sesión actual
function useEstudianteDeSesion() {
  const usr = useUsuario();
  const codigo = usr?.codigo || '';
  const r = useEstudiante(codigo);
  return { usr, ...r };
}

// ──────────────────────────────────────────────────────────────────────────
// estaDesbloqueada / LeccionLocked — preservadas para compatibilidad
// (cronograma_grupo y otros consumidores siguen importándolas)
// ──────────────────────────────────────────────────────────────────────────
function estaDesbloqueada(/* leccionNum, acceso */) {
  // En esta versión el control de acceso vive en cronograma_grupo (por nivel
  // académico CA/APR/CNV). Esta función queda como no-op desbloqueada para
  // no romper consumidores externos.
  return true;
}
function LeccionLocked() {
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:32, gap:8, color:'var(--ink-3)', textAlign:'center',
    }}>
      <span style={{ fontSize:28 }}>🔒</span>
      <div style={{ fontWeight:600, fontSize:14 }}>Lección bloqueada</div>
      <div style={{ fontSize:12 }}>Completá el nivel anterior para acceder.</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// NotasView — evaluaciones reales (getEvaluacionesEstudiante)
// ──────────────────────────────────────────────────────────────────────────
function NotasView() {
  const { usr, data, loading, error, reload } = useEstudianteDeSesion();
  const codigo = usr?.codigo || '';

  const [evaluaciones, setEvaluaciones] = React.useState(null); // null=cargando, []=vacío
  const [evalErr, setEvalErr] = React.useState('');
  React.useEffect(() => {
    if (!codigo) return;
    let cancelled = false;
    setEvalErr('');
    fetch(`${SCRIPT_URL_SM}?fn=getEvaluacionesEstudiante&codigo=${encodeURIComponent(codigo)}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        if (d?.ok && Array.isArray(d.evaluaciones)) setEvaluaciones(d.evaluaciones);
        else { setEvaluaciones([]); }
      })
      .catch(() => { if (!cancelled) { setEvaluaciones([]); setEvalErr('Sin conexión'); } });
    return () => { cancelled = true; };
  }, [codigo]);

  return (
    <div>
      <PageHeader
        kicker="Mi rendimiento"
        title={<>Mis <em>Notas</em></>}
        sub="Historial de evaluaciones registradas por tu docente"
      />
      <GuardSesion usr={usr}>
        {loading && !data ? (
          <SkeletonTable />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <NotasContenido
            data={data}
            evaluaciones={evaluaciones}
            evalErr={evalErr}
          />
        )}
      </GuardSesion>
    </div>
  );
}

function NotasContenido({ data, evaluaciones, evalErr }) {
  const niveles     = data?.niveles || {};
  const nivelActivo = calcularNivelActivoSM(niveles);
  const notaActiva  = notaDeNivelSM(niveles, nivelActivo);

  const evs = Array.isArray(evaluaciones) ? evaluaciones : [];
  const completed = evs.filter(e => e.nota != null);
  const avg = completed.length
    ? (completed.reduce((a, e) => a + Number(e.nota || 0), 0) / completed.length).toFixed(1)
    : null;

  const gradeLetter = (pct) => {
    if (pct == null) return '—';
    if (pct >= 95) return 'A+';
    if (pct >= 90) return 'A';
    if (pct >= 85) return 'A-';
    if (pct >= 80) return 'B+';
    if (pct >= 75) return 'B';
    if (pct >= 70) return 'B-';
    if (pct >= 65) return 'C';
    return 'D';
  };
  const gradeColor = (g) => {
    if (!g || g === '—') return 'var(--ink-3)';
    if (g.startsWith('A')) return 'var(--ok)';
    if (g.startsWith('B')) return 'var(--an-navy)';
    if (g.startsWith('C')) return 'var(--warn)';
    return 'var(--danger)';
  };

  const [filter, setFilter] = React.useState('all');

  // Niveles del estudiante con nota
  const nivelesConNota = Object.keys(niveles).filter(n => notaDeNivelSM(niveles, n) != null);

  return (
    <>
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <Stat
          label="Nivel activo"
          num={nivelActivo || '—'}
          sub={nivelActivo ? NIVEL_NOMBRE_SM[nivelActivo] : 'Sin nivel activo'}
          subTone=""
          pct={0}
          color={NIVEL_COLOR_SM[nivelActivo] || 'var(--an-granate)'}
        />
        <Stat
          label="Nota del nivel"
          num={notaActiva != null ? String(notaActiva) : '—'}
          suffix={notaActiva != null ? '/100' : ''}
          sub={notaActiva != null ? gradeLetter(notaActiva) : 'Sin evaluación final'}
          subTone={notaActiva != null && notaActiva >= 70 ? 'ok' : ''}
          pct={notaActiva || 0}
          color="var(--an-granate)"
        />
        <Stat
          label="Evaluaciones"
          num={evaluaciones === null ? '…' : String(evs.length)}
          sub={evs.length === 0 ? 'Sin evaluaciones registradas' : `${completed.length} con nota`}
          subTone=""
          pct={evs.length ? (completed.length / evs.length) * 100 : 0}
          color="var(--an-navy)"
        />
        <Stat
          label="Promedio de evaluaciones"
          num={avg != null ? String(avg) : '—'}
          suffix={avg != null ? '%' : ''}
          sub={completed.length ? `${completed.length} con nota` : 'Sin datos aún'}
          subTone={avg != null && Number(avg) >= 70 ? 'ok' : ''}
          pct={avg != null ? Number(avg) : 0}
          color="var(--an-gold)"
        />
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[['all','Todo'],['oral','Orales'],['esc','Escritos'],['prog','Progress Check']]
          .map(([k, l]) => (
            <button key={k} className={`tab ${filter===k?'active':''}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
      </div>

      {/* Tabla */}
      <div className="card" style={{ padding: 0, overflow:'hidden' }}>
        <table className="table-soft">
          <thead>
            <tr>
              <th>Lec.</th>
              <th>Evaluación</th>
              <th>Fecha</th>
              <th style={{ textAlign:'right' }}>Puntaje</th>
              <th style={{ textAlign:'right' }}>%</th>
              <th style={{ textAlign:'center' }}>Nota</th>
            </tr>
          </thead>
          <tbody>
            {evaluaciones === null ? (
              <tr><td colSpan={6} style={{ padding:24, textAlign:'center', color:'var(--ink-3)' }}>Cargando…</td></tr>
            ) : evs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding:'32px 16px', textAlign:'center', color:'var(--ink-3)' }}>
                  {evalErr
                    ? '— No se pudieron cargar las evaluaciones —'
                    : 'Aún no tenés evaluaciones registradas. Aparecerán acá cuando tu docente las califique.'}
                </td>
              </tr>
            ) : (
              evs
                .filter(e => filter === 'all' || (e.tipo || '').toLowerCase().startsWith(filter))
                .map((e, i) => {
                  const pct = e.nota != null && e.max ? Math.round((Number(e.nota) / Number(e.max)) * 100) : (e.pct ?? null);
                  const grade = gradeLetter(pct);
                  return (
                    <tr key={i} style={{ opacity: e.nota == null ? 0.55 : 1 }}>
                      <td style={{ fontFamily:'var(--f-mono)', color:'var(--ink-3)' }}>
                        L{String(e.leccion ?? '—').padStart(2,'0')}
                      </td>
                      <td>
                        <div style={{ fontWeight:600 }}>{e.titulo || e.tipo || '—'}</div>
                        {e.unidad && <div style={{ fontSize:11, color:'var(--ink-3)' }}>{e.unidad}</div>}
                      </td>
                      <td style={{ fontSize:12, color:'var(--ink-2)' }}>{e.fecha || '—'}</td>
                      <td style={{ textAlign:'right', fontFamily:'var(--f-mono)' }}>
                        {e.nota != null ? `${e.nota}${e.max ? '/' + e.max : ''}` : 'Pendiente'}
                      </td>
                      <td style={{ textAlign:'right', fontWeight:600 }}>
                        {pct != null ? `${pct}%` : '—'}
                      </td>
                      <td style={{ textAlign:'center' }}>
                        <span style={{
                          display:'inline-flex', alignItems:'center', justifyContent:'center',
                          width:36, height:36, borderRadius:10,
                          background: pct != null ? `color-mix(in srgb, ${gradeColor(grade)} 14%, white)` : 'var(--bg-deep)',
                          color: gradeColor(grade),
                          fontFamily:'var(--f-serif)', fontSize:16, fontWeight:600,
                        }}>{grade}</span>
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>

      {/* Historial de niveles cursados */}
      {nivelesConNota.length > 0 && (
        <div style={{ marginTop:24 }}>
          <div className="card-h" style={{ padding:'0 4px' }}>
            <div className="card-title">Notas finales por nivel</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:10 }}>
            {nivelesConNota.map(n => {
              const nota = notaDeNivelSM(niveles, n);
              const estatus = estatusDe(niveles, n);
              const c = NIVEL_COLOR_SM[n];
              return (
                <div key={n} className="card" style={{ padding:14, borderTop:`3px solid ${c}` }}>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3)' }}>
                    {NIVEL_NOMBRE_SM[n]}
                  </div>
                  <div style={{ fontFamily:'var(--f-serif)', fontSize:28, fontWeight:600, color:'var(--ink)', marginTop:2, lineHeight:1 }}>
                    {nota}
                    <span style={{ fontSize:14, color:'var(--ink-3)' }}>/100</span>
                  </div>
                  <div style={{ marginTop:6 }}>
                    <Chip tone={estatus==='APR' ? 'green' : estatus==='CA' ? 'gold' : 'navy'} dot>
                      {ESTATUS_LABEL_SM[estatus] || estatus}
                    </Chip>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// TareasView — pendiente backend
// ──────────────────────────────────────────────────────────────────────────
function TareasView() {
  const usr = useUsuario();
  return (
    <div>
      <PageHeader
        kicker="Trabajo independiente"
        title={<>Mis <em>Tareas</em></>}
        sub="Self-study semanal · conecta tu progreso entre clases"
      />
      <GuardSesion usr={usr}>
        <EmptyState
          icon="📚"
          title="Tareas próximamente disponibles"
          subtitle="Estamos terminando de conectar este módulo con el sistema académico. Pronto podrás ver tus asignaciones y entregas acá."
        />
      </GuardSesion>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// MaterialesView (versión simple — la versión completa vive en syllabus_views.jsx)
// app.jsx usa la de syllabus_views; esta queda como fallback honesto.
// ──────────────────────────────────────────────────────────────────────────
function MaterialesViewLegacy() {
  const usr = useUsuario();
  return (
    <div>
      <PageHeader
        kicker="Recursos del curso"
        title={<>Materiales de <em>clase</em></>}
        sub="PDFs y recursos disponibles del nivel activo"
      />
      <GuardSesion usr={usr}>
        <EmptyState
          icon="📖"
          title="Materiales próximamente disponibles"
          subtitle="El acceso a los PDFs de cada lección está siendo conectado al cronograma del grupo. Mientras tanto podés verlos desde el calendario de lecciones."
        />
      </GuardSesion>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// MensajesView — pendiente backend
// ──────────────────────────────────────────────────────────────────────────
function MensajesView() {
  const usr = useUsuario();
  return (
    <div>
      <PageHeader
        kicker="Comunicación"
        title={<>Mis <em>Mensajes</em></>}
        sub="Canal directo con tu docente y administración"
      />
      <GuardSesion usr={usr}>
        <EmptyState
          icon="💬"
          title="Mensajes próximamente disponibles"
          subtitle="Estamos terminando de conectar este módulo. Mientras tanto, podés contactar a tu docente o a administración por los canales habituales."
        />
      </GuardSesion>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// PagosView — pendientes reales del Apps Script
// ──────────────────────────────────────────────────────────────────────────
function PagosView() {
  const { usr, data, loading, error, reload } = useEstudianteDeSesion();
  return (
    <div>
      <PageHeader
        kicker="Estado financiero"
        title={<>Estado de <em>cuenta</em></>}
        sub="Matrícula, cuotas y certificado · información en tiempo real"
      />
      <GuardSesion usr={usr}>
        {loading && !data ? (
          <SkeletonTable />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <PagosContenido data={data} />
        )}
      </GuardSesion>
    </div>
  );
}

function PagosContenido({ data }) {
  const pendientes  = data?.pendientes  || {};
  const niveles     = data?.niveles     || {};
  const pagos       = data?.pagos       || [];
  const otrosPagos  = data?.otrosPagos  || [];
  const grupo       = data?.grupo       || {};

  const nivelActivo = calcularNivelActivoSM(niveles);
  const nivelColor  = NIVEL_COLOR_SM[nivelActivo] || 'var(--an-granate)';

  const totalPendientes =
      (pendientes.matricula_pendiente ? 1 : 0)
    + (pendientes.cuotas_pendientes || 0)
    + (pendientes.certificado_pendiente ? 1 : 0);

  const alDia = totalPendientes === 0;

  const fmt = (n) => n != null ? '₡' + Number(n).toLocaleString('es-CR') : '—';

  const todosPagos = [...pagos, ...otrosPagos];

  return (
    <>
      {/* HERO */}
      <div className="card" style={{
        padding:'22px 28px', marginBottom:16,
        background: alDia
          ? 'linear-gradient(135deg, #FBF8F2 0%, #FFFFFF 50%, color-mix(in srgb, var(--ok) 8%, white) 100%)'
          : 'linear-gradient(135deg, #FBF8F2 0%, #FFFFFF 50%, color-mix(in srgb, var(--an-gold) 10%, white) 100%)',
      }}>
        <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:24, alignItems:'center' }}>
          <div style={{
            width:60, height:60, borderRadius:'50%',
            background: alDia ? 'var(--ok)' : 'var(--an-gold)',
            display:'flex', alignItems:'center', justifyContent:'center', color:'white',
            boxShadow:`0 8px 20px -6px ${alDia ? 'rgba(46,125,50,0.4)' : 'rgba(229,168,35,0.4)'}`,
          }}>
            {alDia
              ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
              : <span style={{ fontFamily:'var(--f-serif)', fontSize:28, fontWeight:600, lineHeight:1 }}>{totalPendientes}</span>}
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-3)' }}>
              Tu estado global
            </div>
            <div style={{
              fontFamily:'var(--f-serif)', fontWeight:500,
              fontSize:38, lineHeight:1.05, letterSpacing:'-0.035em',
              color: alDia ? 'var(--ok)' : 'var(--an-granate-ink)',
              marginTop:3,
            }}>
              {alDia ? 'Al día ✓' : (totalPendientes === 1 ? '1 concepto por cubrir' : `${totalPendientes} conceptos por cubrir`)}
            </div>
            <div style={{ fontSize:13, color:'var(--ink-2)', marginTop:4 }}>
              {nivelActivo ? <>Cursando <strong style={{ color:'var(--ink)' }}>{NIVEL_NOMBRE_SM[nivelActivo]}</strong></> : 'Sin nivel activo'}
              {grupo.CODIGO_GRUPO && <> · Grupo {grupo.CODIGO_GRUPO}</>}
            </div>
          </div>
        </div>
      </div>

      {/* Desglose de pendientes */}
      <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:16 }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--line)' }}>
          <div className="card-title">Por cubrir</div>
        </div>
        {totalPendientes === 0 ? (
          <div style={{ padding:'32px 20px', textAlign:'center', color:'var(--ok)' }}>
            ✓ No tenés conceptos pendientes en este momento.
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column' }}>
            {pendientes.matricula_pendiente && (
              <FilaConcepto
                label="Matrícula"
                sub={nivelActivo ? NIVEL_NOMBRE_SM[nivelActivo] : '—'}
                monto={fmt(pendientes.matricula_monto)}
                fecha={pendientes.matricula_vence || ''}
                color={nivelColor}
                accent="warn"
              />
            )}
            {pendientes.cuotas_pendientes > 0 && (
              <FilaConcepto
                label={`${pendientes.cuotas_pendientes} cuota${pendientes.cuotas_pendientes>1?'s':''} mensual${pendientes.cuotas_pendientes>1?'es':''}`}
                sub={nivelActivo ? `Mensualidades de ${NIVEL_NOMBRE_SM[nivelActivo]}` : 'Mensualidades'}
                monto={fmt(pendientes.cuota_mensual != null ? pendientes.cuota_mensual * pendientes.cuotas_pendientes : null)}
                fecha={pendientes.cuota_vence || ''}
                color={nivelColor}
                accent="warn"
              />
            )}
            {pendientes.certificado_pendiente && (
              <FilaConcepto
                label="Certificado del nivel"
                sub={nivelActivo ? NIVEL_NOMBRE_SM[nivelActivo] : '—'}
                monto={fmt(pendientes.certificado_monto)}
                fecha=""
                color={nivelColor}
                accent="neutral"
              />
            )}
          </div>
        )}
      </div>

      {/* Historial de pagos */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
          <div className="card-title">Historial de pagos</div>
          {todosPagos.length > 0 && <span style={{ fontSize:11, color:'var(--ink-3)' }}>{todosPagos.length} movimientos</span>}
        </div>
        {todosPagos.length === 0 ? (
          <div style={{ padding:'28px 20px', textAlign:'center', color:'var(--ink-3)', fontSize:13 }}>
            Sin pagos registrados aún.
          </div>
        ) : (
          <table className="table-soft">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Comprobante</th>
                <th style={{ textAlign:'right' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {todosPagos.map((p, i) => (
                <tr key={i}>
                  <td style={{ fontSize:12, color:'var(--ink-2)' }}>{p.fecha || p.FECHA || '—'}</td>
                  <td>
                    <div style={{ fontWeight:600 }}>{p.concepto || p.CONCEPTO || p.descripcion || '—'}</div>
                    {(p.grupo || p.GRUPO) && <div style={{ fontSize:11, color:'var(--ink-3)' }}>{p.grupo || p.GRUPO}</div>}
                  </td>
                  <td style={{ fontSize:12, fontFamily:'var(--f-mono)', color:'var(--ink-2)' }}>{p.comprobante || p.COMPROBANTE || p.id || '—'}</td>
                  <td style={{ textAlign:'right', fontFamily:'var(--f-mono)', fontWeight:600 }}>{fmt(p.monto ?? p.MONTO)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{
        marginTop:20, padding:'14px 18px',
        border:'1px solid var(--line)', borderRadius:'var(--r-md)',
        background:'var(--surface)', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap',
        fontSize:13, color:'var(--ink-2)',
      }}>
        <div style={{ flex:1, minWidth:240 }}>
          <strong style={{ color:'var(--ink)' }}>¿Alguna dificultad este mes?</strong>{' '}
          Podemos acomodar fechas — escribinos a administración.
        </div>
        <a className="btn btn-ghost" href="https://wa.me/50688881234" target="_blank" rel="noopener" style={{ fontSize:12 }}>
          Hablar con Administración
        </a>
      </div>
    </>
  );
}

function FilaConcepto({ label, sub, monto, fecha, color, accent }) {
  const accentColor = accent === 'warn' ? 'var(--warn)' : 'var(--ink-3)';
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'auto 1fr auto auto', gap:14, alignItems:'center',
      padding:'14px 20px', borderBottom:'1px solid var(--line)',
    }}>
      <span style={{
        width:10, height:10, borderRadius:'50%',
        background: color, border:`2px solid ${color}`,
        boxShadow:`0 0 0 3px color-mix(in srgb, ${color} 20%, transparent)`,
      }} />
      <div>
        <div style={{ fontWeight:600, fontSize:14 }}>{label}</div>
        <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>
          {sub}{fecha ? ` · vence ${fecha}` : ''}
        </div>
      </div>
      <div style={{ fontFamily:'var(--f-mono)', fontSize:14, fontWeight:700, color:'var(--ink)' }}>
        {monto}
      </div>
      <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', color: accentColor, textTransform:'uppercase' }}>
        Pendiente
      </span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// CertificadosView — derivados del objeto niveles
// ──────────────────────────────────────────────────────────────────────────
function CertificadosView() {
  const { usr, data, loading, error, reload } = useEstudianteDeSesion();
  return (
    <div>
      <PageHeader
        kicker="Documentos oficiales"
        title={<>Mis <em>Certificados</em></>}
        sub="Disponibles cuando un nivel queda aprobado o convalidado"
      />
      <GuardSesion usr={usr}>
        {loading && !data ? (
          <SkeletonGrid />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <CertificadosContenido data={data} />
        )}
      </GuardSesion>
    </div>
  );
}

function CertificadosContenido({ data }) {
  const niveles = data?.niveles || {};
  const ORDEN = ['B1','B2','I1','I2'];
  const disponibles = ORDEN
    .filter(n => ['APR','CNV'].includes(estatusDe(niveles, n)))
    .map(n => ({ nivel:n, estatus: estatusDe(niveles, n), nota: notaDeNivelSM(niveles, n) }));
  const porDesbloquear = ORDEN.filter(n => !disponibles.find(d => d.nivel === n));

  if (disponibles.length === 0) {
    return (
      <>
        <EmptyState
          icon="🎖️"
          title="Aún no tenés certificados disponibles"
          subtitle="Tu primer certificado se desbloqueará al aprobar tu primer nivel. Seguí adelante."
        />
        <div style={{ marginTop:24 }}>
          <div className="card-h" style={{ padding:'0 4px' }}>
            <div className="card-title">Por desbloquear</div>
          </div>
          <PorDesbloquearGrid niveles={porDesbloquear} estatusNiveles={niveles} />
        </div>
      </>
    );
  }

  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:16, marginBottom:24 }}>
        {disponibles.map(d => (
          <div key={d.nivel} className="card" style={{
            padding:24, background:'linear-gradient(135deg, #FFFFFF 0%, #FBF8F2 100%)',
            position:'relative', overflow:'hidden', minHeight:200,
            borderTop:`4px solid ${NIVEL_COLOR_SM[d.nivel]}`,
          }}>
            <div style={{
              position:'absolute', right:-40, bottom:-40, width:180, height:180,
              background: NIVEL_COLOR_SM[d.nivel], opacity:0.06, borderRadius:'50%',
            }} />
            <div style={{ display:'flex', alignItems:'flex-start', gap:16, position:'relative' }}>
              <div style={{
                width:56, height:56, borderRadius:'50%',
                background: NIVEL_COLOR_SM[d.nivel],
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'white', flexShrink:0, boxShadow:'var(--sh-1)',
              }}>
                <Icon name="certificates" size={26} className="" />
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:NIVEL_COLOR_SM[d.nivel] }}>
                  {d.estatus === 'CNV' ? 'Nivel convalidado' : 'Nivel aprobado'}
                </div>
                <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, lineHeight:1.2, margin:'6px 0', color:'var(--an-navy-ink)' }}>
                  Certificado · {NIVEL_NOMBRE_SM[d.nivel]}
                </div>
                <div style={{ fontSize:12, color:'var(--ink-2)' }}>
                  {NIVEL_LIBRO_SM[d.nivel]}{d.nota != null ? ` · Nota final: ${d.nota}/100` : ''}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:20, position:'relative' }}>
              <button className="btn btn-primary">
                <Icon name="download" size={14} className="" /> Descargar PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      {porDesbloquear.length > 0 && (
        <div>
          <div className="card-h" style={{ padding:'0 4px' }}>
            <div className="card-title">Por desbloquear</div>
          </div>
          <PorDesbloquearGrid niveles={porDesbloquear} estatusNiveles={niveles} />
        </div>
      )}
    </>
  );
}

function PorDesbloquearGrid({ niveles, estatusNiveles }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:12 }}>
      {niveles.map(n => {
        const estatus = estatusDe(estatusNiveles, n);
        const enCurso = estatus === 'CA';
        return (
          <div key={n} className="card" style={{
            textAlign:'center', padding:20,
            opacity: enCurso ? 1 : 0.55,
            borderTop:`3px solid ${NIVEL_COLOR_SM[n]}`,
          }}>
            <div style={{
              width:54, height:54, margin:'0 auto 10px',
              borderRadius:'50%', background: enCurso ? NIVEL_COLOR_SM[n] : 'var(--bg-deep)',
              color: enCurso ? 'white' : 'var(--ink-3)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'var(--f-mono)', fontWeight:700,
            }}>
              {enCurso ? '●' : '🔒'}
            </div>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:16, fontWeight:500 }}>{NIVEL_NOMBRE_SM[n]}</div>
            <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>
              {enCurso ? 'En curso · al aprobar' : (estatus ? ESTATUS_LABEL_SM[estatus] : 'Bloqueado')}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// PerfilView — datos reales del estudiante
// ──────────────────────────────────────────────────────────────────────────
function PerfilView({ onNavigate } = {}) {
  const { usr, data, loading, error, reload } = useEstudianteDeSesion();
  return (
    <div>
      <PageHeader
        kicker="Mi cuenta"
        title={<>Mi <em>Perfil</em></>}
        sub="Información personal y académica"
      />
      <GuardSesion usr={usr}>
        {loading && !data ? (
          <SkeletonGrid />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <PerfilContenido usr={usr} data={data} onNavigate={onNavigate} />
        )}
      </GuardSesion>
    </div>
  );
}

function PerfilContenido({ usr, data, onNavigate }) {
  const est     = data?.estudiante || {};
  const grupo   = data?.grupo      || {};
  const niveles = data?.niveles    || {};

  const nivelActivo = calcularNivelActivoSM(niveles, usr?.nivel_activo);
  const nombre   = est.NOMBRE || usr?.nombre || '—';
  const initials = nombre !== '—'
    ? nombre.split(' ').slice(0,2).map(w => w[0] || '').join('').toUpperCase()
    : '—';
  const correo   = est.CORREO || est.EMAIL || '—';
  const telefono = est.TELEFONO || est.WHATSAPP || '—';
  const cedula   = est.CEDULA || est.NUM_CEDULA || usr?.cedula || '—';
  const codigo   = est.CODIGO || est.REC_M || usr?.codigo || '—';
  const docente  = grupo.DOCENTE || '—';
  const horario  = grupo.HORARIO || grupo.DIAS || '—';

  const ORDEN = ['B1','B2','I1','I2'];

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:20 }}>
      {/* Identity */}
      <div className="card" style={{ textAlign:'center' }}>
        <div style={{
          width:120, height:120, borderRadius:'50%',
          background:'linear-gradient(135deg, var(--an-granate), var(--an-red))',
          color:'white', fontFamily:'var(--f-serif)', fontSize:44, fontWeight:500,
          display:'flex', alignItems:'center', justifyContent:'center',
          margin:'0 auto 14px', boxShadow:'var(--sh-2)', border:'4px solid white',
        }}>{initials}</div>
        <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, lineHeight:1.15, color:'var(--an-navy-ink)' }}>
          {nombre}
        </div>
        <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:4, fontFamily:'var(--f-mono)' }}>
          Código {codigo}
        </div>

        <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap', marginTop:14 }}>
          <Chip tone="granate">Estudiante activo</Chip>
          {grupo.CODIGO_GRUPO && <Chip tone="navy">{grupo.CODIGO_GRUPO}</Chip>}
        </div>

        <div style={{ marginTop:22, textAlign:'left', borderTop:'1px solid var(--line)', paddingTop:16 }}>
          {[
            ['Correo', correo],
            ['Teléfono', telefono],
            ['Cédula', cedula],
            ['Nivel actual', nivelActivo ? NIVEL_NOMBRE_SM[nivelActivo] : '—'],
            ['Libro', nivelActivo ? NIVEL_LIBRO_SM[nivelActivo] : '—'],
            ['Docente', docente],
            ['Horario', horario],
          ].map(([k, v], i, arr) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'7px 0', borderBottom: i < arr.length-1 ? '1px solid var(--line)' : 'none' }}>
              <span style={{ color:'var(--ink-3)', fontWeight:600 }}>{k}</span>
              <span style={{ color:'var(--ink)', fontWeight:500, textAlign:'right', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Camino */}
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        <div className="card">
          <div className="card-h">
            <div className="card-title">Mi camino</div>
            {nivelActivo && <Chip tone="granate" dot>En {NIVEL_NOMBRE_SM[nivelActivo]}</Chip>}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10 }}>
            {ORDEN.map((n, i) => {
              const estatus = estatusDe(niveles, n);
              const esActivo = n === nivelActivo;
              const aprobado = estatus === 'APR' || estatus === 'CNV';
              const c = NIVEL_COLOR_SM[n];
              return (
                <div key={n} style={{
                  padding:'14px 12px', borderRadius:'var(--r-md)',
                  background: esActivo
                    ? `color-mix(in srgb, ${c} 10%, white)`
                    : aprobado
                      ? 'color-mix(in srgb, var(--ok) 8%, white)'
                      : 'var(--surface-2)',
                  border: esActivo ? `2px solid ${c}` : '1px solid var(--line)',
                }}>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color: esActivo ? c : 'var(--ink-3)' }}>
                    {n}
                  </div>
                  <div style={{ fontFamily:'var(--f-serif)', fontSize:16, fontWeight:500, marginTop:3, color:'var(--ink)' }}>
                    {NIVEL_NOMBRE_SM[n]}
                  </div>
                  <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>
                    {NIVEL_LIBRO_SM[n]}
                  </div>
                  <div style={{ marginTop:8, fontSize:11, fontWeight:700, color: esActivo ? c : aprobado ? 'var(--ok)' : 'var(--ink-3)' }}>
                    {esActivo ? '● Cursando' : aprobado ? '✓ ' + ESTATUS_LABEL_SM[estatus] : (ESTATUS_LABEL_SM[estatus] || 'Pendiente')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div className="card-title">Configuración</div>
          </div>
          <div style={{ padding:'12px 0', fontSize:12, color:'var(--ink-3)' }}>
            Las preferencias de notificaciones y datos de contacto se editan desde recepción por el momento.
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// ExamenOralView — embed externo (sin datos personales aquí)
// ──────────────────────────────────────────────────────────────────────────
function ExamenOralView() {
  return (
    <div>
      <PageHeader
        kicker="Evaluación"
        title={<>Examen <em>Oral</em></>}
        sub="Banco de preguntas y estructura del test"
        right={<a href="modulos/examen_oral.html" target="_blank" className="btn btn-ghost">Abrir en pestaña nueva →</a>}
      />
      <div className="card" style={{ padding:0, overflow:'hidden', height:'calc(100vh - 220px)', minHeight:620 }}>
        <iframe src="modulos/examen_oral.html" style={{ width:'100%', height:'100%', border:0 }} title="Examen Oral" />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Skeletons
// ──────────────────────────────────────────────────────────────────────────
function SkeletonTable() {
  const ln = { background:'var(--bg-deep)', borderRadius:6 };
  return (
    <div>
      <div className="grid-4" style={{ marginBottom:24 }}>
        {[0,1,2,3].map(i => (
          <div key={i} className="card" style={{ height:90 }}>
            <div style={{ ...ln, width:80, height:9, marginBottom:10 }} />
            <div style={{ ...ln, width:60, height:24 }} />
          </div>
        ))}
      </div>
      <div className="card" style={{ height:240 }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ display:'flex', gap:14, padding:'12px 0', borderBottom: i<4 ? '1px solid var(--line)' : 'none' }}>
            <div style={{ ...ln, width:48, height:14 }} />
            <div style={{ ...ln, flex:1, height:14 }} />
            <div style={{ ...ln, width:60, height:14 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12 }}>
      {[0,1,2,3].map(i => (
        <div key={i} className="card" style={{ height:160 }}>
          <div style={{ background:'var(--bg-deep)', height:18, width:'60%', borderRadius:4, marginBottom:8 }} />
          <div style={{ background:'var(--bg-deep)', height:14, width:'80%', borderRadius:4 }} />
        </div>
      ))}
    </div>
  );
}

Object.assign(window, {
  PageHeader,
  NotasView, TareasView, MensajesView, PagosView,
  CertificadosView, PerfilView, ExamenOralView,
  estaDesbloqueada, LeccionLocked,
  MaterialesViewLegacy,
});
