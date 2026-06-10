/* global React, PageHeader, LoadingState, ErrorState, EmptyState */
// ─────────────────────────────────────────────────────────────────────────
// AUDITORÍA ACADÉMICA (solo lectura) — auditoria_academica.jsx
// Vista admin/superadmin para supervisar, por grupo + nivel, el estado
// académico real: lecciones cerradas/pendientes, asistencia, notas,
// retroalimentación, progress checks y alertas.
//
// Reglas (ACADEMICO-001B):
//   • 100% SOLO LECTURA. Cero botones de edición. Cero POST salvo el fetch
//     de auditoría (fetchAuditoriaAcademicaGrupo).
//   • No toca Estudiantes, CONAPE, pagos, matrícula ni cierre de lecciones.
//   • No expone el token en consola ni en pantalla.
// ─────────────────────────────────────────────────────────────────────────

const SCRIPT_URL_AA = window.APPS_SCRIPT_URL;

// Paleta por nivel (consistente con el resto del campus).
const AA_NIVEL_COLOR = { B1: '#9A6A00', B2: '#8B1A10', I1: '#0D47A1', I2: '#1B5E20' };
const AA_NIVELES = ['B1', 'B2', 'I1', 'I2'];
const AA_NIVEL_LABEL = { B1: 'Básico I', B2: 'Básico II', I1: 'Intermedio I', I2: 'Intermedio II' };

const AA_TIPO_LABEL = {
  CLASE: 'Clase',
  PROGRESS_CHECK: 'Progress Check',
  EVAL_ORAL: 'Examen Oral',
  EVAL_ESCRITO: 'Examen Escrito',
  ICAN: 'I CAN',
};

const AA_MES_CORTO = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
function aaFmtFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  return `${String(d.getDate()).padStart(2,'0')} ${AA_MES_CORTO[d.getMonth()]} ${d.getFullYear()}`;
}

// Estado de lección → chip {label, bg, fg}
function aaEstadoChip(estado) {
  switch ((estado || '').toUpperCase()) {
    case 'CERRADA':    return { label: 'Cerrada',    bg: '#E2F1E5', fg: '#1B5E20' };
    case 'HOY':        return { label: 'Hoy',        bg: 'color-mix(in srgb, var(--an-navy) 12%, white)', fg: 'var(--an-navy-ink)' };
    case 'PROGRAMADA': return { label: 'Programada', bg: 'color-mix(in srgb, var(--an-gold) 20%, white)', fg: '#6B4A00' };
    case 'CALCULADA':  return { label: 'Proyectada', bg: 'var(--bg-deep)', fg: 'var(--ink-2)' };
    case 'PENDIENTE':  return { label: 'Pendiente',  bg: 'color-mix(in srgb, var(--an-gold) 20%, white)', fg: '#6B4A00' };
    case 'FERIADO':    return { label: 'Feriado',    bg: '#FCE6E4', fg: 'var(--danger)' };
    default:           return { label: estado || '—', bg: 'var(--bg-deep)', fg: 'var(--ink-3)' };
  }
}

// Alerta → chip {label, bg, fg}
const AA_ALERTA_LABEL = {
  cerrada_sin_asistencia:        { label: 'Sin asistencia',  bg: '#FCE6E4', fg: 'var(--danger)' },
  cerrada_sin_retroalimentacion: { label: 'Sin retro',       bg: 'color-mix(in srgb, var(--an-gold) 22%, white)', fg: '#6B4A00' },
  progress_check_faltante:       { label: 'PC faltante',     bg: 'color-mix(in srgb, var(--an-gold) 22%, white)', fg: '#6B4A00' },
};
function aaAlertaChip(code) {
  return AA_ALERTA_LABEL[code] || { label: String(code), bg: 'var(--bg-deep)', fg: 'var(--ink-2)' };
}

// ── Estilos compartidos ──────────────────────────────────────────────────
const aaLabelStyle = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
  color: 'var(--ink-3)', marginBottom: 6,
};
const aaSelectStyle = {
  padding: '10px 36px 10px 14px',
  border: '1.5px solid var(--line)', borderRadius: 'var(--r-md)',
  background: 'var(--surface)', fontFamily: 'var(--f-mono)', fontWeight: 600,
  fontSize: 13, color: 'var(--ink)', outline: 'none', cursor: 'pointer',
  minWidth: 240, appearance: 'none',
  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%238B8178\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E")',
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
};

// ── Chip genérico (inline) ─────────────────────────────────────────────────
function AAChip({ bg, fg, children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 9px', borderRadius: 'var(--r-pill, 999px)',
      fontSize: 11, fontWeight: 700, letterSpacing: '0.02em',
      background: bg, color: fg, whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

// ── Tarjeta de resumen ─────────────────────────────────────────────────────
function AAResumenCard({ label, valor, sub, tone }) {
  const color = tone === 'alert' ? 'var(--an-red, #C0392B)'
    : tone === 'ok' ? '#1B5E20'
    : 'var(--an-navy)';
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div style={aaLabelStyle}>{label}</div>
      <div style={{
        fontFamily: 'var(--f-serif)', fontWeight: 700, fontSize: 30,
        lineHeight: 1, letterSpacing: '-0.03em', color, margin: '2px 0 4px',
      }}>{valor}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{sub}</div>}
    </div>
  );
}

// ── Drawer de detalle de lección (solo lectura) ────────────────────────────
function AADetalleLeccion({ leccion, estudiantes, matriz, nivelColor, onClose }) {
  // Mapa estudiante → datos de la matriz para esta lección.
  const fila = (matriz && matriz[String(leccion.leccion)]) || {};
  const tipoLabel = AA_TIPO_LABEL[leccion.tipo] || leccion.tipo || 'Clase';
  const estado = aaEstadoChip(leccion.estado);

  const asistenciaCelda = (presente) => {
    if (presente === true)  return { label: 'Presente',     bg: '#E2F1E5', fg: '#1B5E20' };
    if (presente === false) return { label: 'Ausente',      bg: '#FCE6E4', fg: 'var(--danger)' };
    return { label: 'Sin registro', bg: 'var(--bg-deep)', fg: 'var(--ink-3)' };
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(20, 16, 12, 0.5)',
        display: 'flex', justifyContent: 'flex-end',
        animation: 'an-fade-in .14s ease-out',
      }}>
      <div style={{
        width: 'min(560px, 100%)', height: '100%',
        background: 'var(--surface)', boxShadow: '-20px 0 60px rgba(0,0,0,0.28)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Cabecera del drawer */}
        <div style={{ height: 5, background: nivelColor }} />
        <div style={{
          padding: '18px 22px 14px', borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <div style={{ ...aaLabelStyle, marginBottom: 4 }}>
              Lección {String(leccion.leccion).padStart(2,'0')} · {tipoLabel}
            </div>
            <div style={{
              fontFamily: 'var(--f-serif)', fontSize: 20, fontWeight: 500,
              color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.15,
            }}>{aaFmtFecha(leccion.fecha)}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
              {[leccion.dia, leccion.turno, leccion.docente].filter(Boolean).join(' · ') || '—'}
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <AAChip bg={estado.bg} fg={estado.fg}>{estado.label}</AAChip>
              {(leccion.alertas || []).map(a => {
                const c = aaAlertaChip(a);
                return <AAChip key={a} bg={c.bg} fg={c.fg}>⚠ {c.label}</AAChip>;
              })}
            </div>
          </div>
          <button onClick={onClose} title="Cerrar"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--ink-3)', lineHeight: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Lista de estudiantes — solo lectura */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 24px' }}>
          {!estudiantes || !estudiantes.length ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              No hay estudiantes activos en este grupo.
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {estudiantes.map((e, i) => {
                const d = fila[e.code] || {};
                const asis = asistenciaCelda(d.presente);
                const nota = (d.nota_total !== undefined && d.nota_total !== null && d.nota_total !== '')
                  ? d.nota_total
                  : null;
                const evals = Array.isArray(d.evaluaciones) ? d.evaluaciones : null;
                return (
                  <li key={e.code} style={{
                    padding: '12px 14px', background: 'var(--surface)',
                    border: '1px solid var(--line)', borderRadius: 'var(--r-md)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{
                        width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-deep)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', flexShrink: 0,
                      }}>{i + 1}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {e.name}
                        </div>
                        <div style={{ fontSize: 10, fontFamily: 'var(--f-mono)', color: 'var(--ink-3)', letterSpacing: '0.04em' }}>
                          {e.code}
                        </div>
                      </div>
                      <AAChip bg={asis.bg} fg={asis.fg}>{asis.label}</AAChip>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {/* Nota / evaluaciones */}
                      <div style={aaDetCell}>
                        <div style={aaDetCellLabel}>Nota</div>
                        <div style={aaDetCellValue}>
                          {evals && evals.length
                            ? evals.map((ev, k) => (
                                <span key={k} style={{ display: 'block', fontSize: 11 }}>
                                  {(ev.tipo || ev.label || 'Eval')}: <b>{ev.nota ?? ev.valor ?? '—'}</b>
                                </span>
                              ))
                            : (nota !== null ? <b>{nota}</b> : <span style={{ color: 'var(--ink-3)' }}>—</span>)}
                        </div>
                      </div>
                      {/* Progress check */}
                      <div style={aaDetCell}>
                        <div style={aaDetCellLabel}>Progress Check</div>
                        <div style={aaDetCellValue}>
                          {d.progress_check
                            ? (typeof d.progress_check === 'string'
                                ? <span style={{ fontSize: 11 }}>{d.progress_check}</span>
                                : <AAChip bg="#E2F1E5" fg="#1B5E20">Registrado</AAChip>)
                            : <span style={{ color: 'var(--ink-3)' }}>—</span>}
                        </div>
                      </div>
                      {/* Retro */}
                      <div style={aaDetCell}>
                        <div style={aaDetCellLabel}>Retroalimentación</div>
                        <div style={aaDetCellValue}>
                          {d.retro
                            ? <span style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.4 }}>
                                {typeof d.retro === 'string' ? d.retro : 'Registrada'}
                              </span>
                            : <span style={{ color: 'var(--ink-3)' }}>—</span>}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Pie: recordatorio solo lectura */}
        <div style={{
          padding: '10px 22px', borderTop: '1px solid var(--line)',
          background: 'var(--surface-2)', fontSize: 11, color: 'var(--ink-3)',
          letterSpacing: '0.03em',
        }}>
          Vista de solo lectura · los datos no se pueden editar desde aquí.
        </div>
      </div>
    </div>
  );
}

const aaDetCell = {
  background: 'var(--surface-2)', border: '1px solid var(--line)',
  borderRadius: 'var(--r-sm, 6px)', padding: '8px 10px', minHeight: 52,
};
const aaDetCellLabel = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--ink-3)', marginBottom: 4,
};
const aaDetCellValue = { fontSize: 13, color: 'var(--ink)', fontWeight: 600 };

// ── Tabla de lecciones ─────────────────────────────────────────────────────
function AALeccionesTabla({ lecciones, onVer }) {
  const th = {
    textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: 'var(--ink-3)', padding: '10px 12px',
    borderBottom: '1.5px solid var(--line)', whiteSpace: 'nowrap',
  };
  const td = {
    padding: '11px 12px', fontSize: 13, color: 'var(--ink)',
    borderBottom: '1px solid var(--line)', verticalAlign: 'middle',
  };
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 880 }}>
          <thead>
            <tr>
              <th style={th}>Lección</th>
              <th style={th}>Fecha</th>
              <th style={th}>Tipo</th>
              <th style={th}>Estado</th>
              <th style={th}>Asistencia</th>
              <th style={th}>Notas</th>
              <th style={th}>Retro</th>
              <th style={th}>Progress Check</th>
              <th style={th}>Alertas</th>
              <th style={{ ...th, textAlign: 'right' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {lecciones.map((l) => {
              const estado = aaEstadoChip(l.estado);
              const asis = l.asistencia || {};
              const alertas = l.alertas || [];
              return (
                <tr key={l.leccion}>
                  <td style={{ ...td, fontFamily: 'var(--f-mono)', fontWeight: 700 }}>
                    {String(l.leccion).padStart(2, '0')}
                  </td>
                  <td style={{ ...td, whiteSpace: 'nowrap', color: 'var(--ink-2)' }}>{aaFmtFecha(l.fecha)}</td>
                  <td style={{ ...td, color: 'var(--ink-2)' }}>{AA_TIPO_LABEL[l.tipo] || l.tipo || 'Clase'}</td>
                  <td style={td}><AAChip bg={estado.bg} fg={estado.fg}>{estado.label}</AAChip></td>
                  <td style={td}>
                    {asis.total
                      ? <span><b>{asis.presentes ?? 0}/{asis.total}</b>
                          {typeof asis.pct === 'number' && <span style={{ color: 'var(--ink-3)', marginLeft: 4 }}>· {Math.round(asis.pct)}%</span>}
                        </span>
                      : <span style={{ color: 'var(--ink-3)' }}>—</span>}
                  </td>
                  <td style={td}>{(l.notas && l.notas.total) || <span style={{ color: 'var(--ink-3)' }}>0</span>}</td>
                  <td style={td}>{(l.retro && l.retro.total) || <span style={{ color: 'var(--ink-3)' }}>0</span>}</td>
                  <td style={td}>{(l.progress_check && l.progress_check.total) || <span style={{ color: 'var(--ink-3)' }}>0</span>}</td>
                  <td style={td}>
                    {alertas.length
                      ? <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {alertas.map(a => { const c = aaAlertaChip(a); return <AAChip key={a} bg={c.bg} fg={c.fg}>{c.label}</AAChip>; })}
                        </div>
                      : <span style={{ color: 'var(--ink-3)' }}>—</span>}
                  </td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => onVer(l)}>
                      Ver
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────
function AuditoriaAcademicaView() {
  // Grupos activos (reusa getGruposActivos — mismo origen que el calendario).
  const [grupos, setGrupos] = React.useState([]);
  const [loadingGrupos, setLoadingGrupos] = React.useState(true);
  const [errorGrupos, setErrorGrupos] = React.useState(null);

  const [codGrupo, setCodGrupo] = React.useState('');
  const [nivel, setNivel] = React.useState('B1');

  // Resultado de la auditoría.
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const [selLec, setSelLec] = React.useState(null);

  const cargarGrupos = React.useCallback(() => {
    setLoadingGrupos(true); setErrorGrupos(null);
    return fetch(`${SCRIPT_URL_AA}?fn=getGruposActivos`)
      .then(r => r.json())
      .then(d => {
        if (d && d.ok && Array.isArray(d.grupos)) {
          setGrupos(d.grupos);
          if (d.grupos.length) {
            setCodGrupo(prev => prev || d.grupos[0].code);
            // Nivel por defecto = nivel activo del primer grupo si existe.
            const g0 = d.grupos[0];
            if (g0 && g0.nivelId && AA_NIVELES.includes(g0.nivelId)) setNivel(g0.nivelId);
          }
        } else {
          setErrorGrupos((d && d.error) || 'No se pudieron cargar los grupos activos.');
        }
      })
      .catch(e => setErrorGrupos('Error de red: ' + (e && e.message ? e.message : e)))
      .finally(() => setLoadingGrupos(false));
  }, []);

  React.useEffect(() => { cargarGrupos(); }, [cargarGrupos]);

  const cargarAuditoria = React.useCallback(async () => {
    if (!codGrupo || !nivel) return;
    setLoading(true); setError(null); setData(null); setSelLec(null);
    try {
      const res = await window.fetchAuditoriaAcademicaGrupo({ cod_grupo: codGrupo, nivel });
      if (res && res.ok) {
        setData(res);
      } else if (res && res.error === 'sesion_requerida') {
        setError('Sesión requerida. Iniciá sesión nuevamente.');
      } else if (res && res.error === 'no_autorizado') {
        setError('No autorizado: tu cuenta no tiene permiso para ver la auditoría académica.');
      } else {
        setError((res && res.error) || 'No se pudo cargar la auditoría académica.');
      }
    } catch (e) {
      setError('Error de conexión. Probá de nuevo en unos segundos.');
    } finally {
      setLoading(false);
    }
  }, [codGrupo, nivel]);

  const resumen = data && data.resumen ? data.resumen : null;
  const grupoMeta = data && data.grupo ? data.grupo : null;
  const nivelColor = AA_NIVEL_COLOR[(grupoMeta && grupoMeta.nivel) || nivel] || AA_NIVEL_COLOR.B1;

  return (
    <div data-screen-label="Auditoría Académica">
      <PageHeader
        kicker="Supervisión académica"
        title={<>Auditoría <em>Académica</em></>}
        sub="Supervisión por grupo, nivel y lección."
      />

      {/* ── FILTROS ─────────────────────────────────────────────────────── */}
      <div className="card" style={{
        padding: '16px 18px', marginBottom: 18,
        display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap',
      }}>
        {loadingGrupos ? (
          <div style={{ fontSize: 13, color: 'var(--ink-3)', padding: '6px 0' }}>Cargando grupos activos…</div>
        ) : errorGrupos ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>⚠ {errorGrupos}</span>
            <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={cargarGrupos}>Reintentar</button>
          </div>
        ) : (
          <>
            <div>
              <div style={aaLabelStyle}>Grupo</div>
              <select value={codGrupo} onChange={e => setCodGrupo(e.target.value)} style={aaSelectStyle}>
                {grupos.map(g => (
                  <option key={g.code} value={g.code}>{g.code}{g.docente ? ` · ${g.docente}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={aaLabelStyle}>Nivel</div>
              <select value={nivel} onChange={e => setNivel(e.target.value)} style={{ ...aaSelectStyle, minWidth: 160 }}>
                {AA_NIVELES.map(n => (
                  <option key={n} value={n}>{n} · {AA_NIVEL_LABEL[n]}</option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-primary"
              style={{ padding: '10px 20px' }}
              disabled={loading || !codGrupo}
              onClick={cargarAuditoria}>
              {loading ? 'Cargando…' : 'Cargar auditoría'}
            </button>
          </>
        )}
      </div>

      {/* ── CUERPO ──────────────────────────────────────────────────────── */}
      {loading ? (
        <LoadingState variant="spinner" title="Cargando auditoría académica…" />
      ) : error ? (
        <ErrorState message={error} onRetry={cargarAuditoria} />
      ) : !data ? (
        <EmptyState
          icon="📋"
          title="Seleccioná grupo y nivel"
          subtitle="Elegí un grupo y un nivel, y presioná “Cargar auditoría” para ver el estado académico."
        />
      ) : (
        <React.Fragment>
          {/* Meta del grupo */}
          {grupoMeta && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center',
              padding: '12px 16px', marginBottom: 16,
              background: 'var(--surface-2)', border: '1px solid var(--line)',
              borderRadius: 'var(--r-md)', fontSize: 12, color: 'var(--ink-2)',
            }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: nivelColor, flexShrink: 0 }} />
              <span><b style={{ fontFamily: 'var(--f-mono)', color: 'var(--ink)' }}>{grupoMeta.cod_grupo}</b></span>
              <span>Nivel <b style={{ color: 'var(--ink)' }}>{grupoMeta.nivel}</b></span>
              {grupoMeta.programa && <span>Programa <b style={{ color: 'var(--ink)' }}>{grupoMeta.programa}</b></span>}
              {grupoMeta.modalidad && <span>Modalidad <b style={{ color: 'var(--ink)' }}>{grupoMeta.modalidad}</b></span>}
              {grupoMeta.docente && <span>Docente <b style={{ color: 'var(--ink)' }}>{grupoMeta.docente}</b></span>}
              {grupoMeta.fecha_inicio && <span>Inicio <b style={{ color: 'var(--ink)' }}>{aaFmtFecha(grupoMeta.fecha_inicio)}</b></span>}
            </div>
          )}

          {/* Cards de resumen */}
          {resumen && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 14, marginBottom: 20,
            }}>
              <AAResumenCard label="Estudiantes activos" valor={resumen.estudiantes_activos ?? '—'} />
              <AAResumenCard
                label="Lecciones cerradas"
                valor={`${resumen.lecciones_cerradas ?? 0} / ${resumen.lecciones_total ?? 0}`}
                sub={`${resumen.lecciones_pendientes ?? 0} pendientes`}
                tone="ok"
              />
              <AAResumenCard
                label="Asistencia promedio"
                valor={resumen.asistencia_promedio_pct != null ? `${Math.round(resumen.asistencia_promedio_pct)}%` : '—'}
                sub={resumen.asistencias_registradas != null ? `${resumen.asistencias_registradas} registros` : null}
              />
              <AAResumenCard label="Notas registradas" valor={resumen.notas_registradas ?? 0} />
              <AAResumenCard label="Retroalimentaciones" valor={resumen.retroalimentaciones ?? 0} />
              <AAResumenCard label="Progress Checks" valor={resumen.progress_checks ?? 0} />
              <AAResumenCard
                label="Alertas"
                valor={resumen.alertas_total ?? 0}
                sub={resumen.estudiantes_en_riesgo != null ? `${resumen.estudiantes_en_riesgo} en riesgo` : null}
                tone={(resumen.alertas_total || 0) > 0 ? 'alert' : 'ok'}
              />
            </div>
          )}

          {/* Tabla de lecciones */}
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <h2 style={{
              fontFamily: 'var(--f-serif)', fontWeight: 500, fontSize: 20,
              letterSpacing: '-0.02em', color: 'var(--ink)', margin: 0,
            }}>Lecciones</h2>
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
              {(data.lecciones || []).length} lecciones · click en “Ver” para el detalle
            </span>
          </div>

          {(data.lecciones || []).length ? (
            <AALeccionesTabla lecciones={data.lecciones} onVer={setSelLec} />
          ) : (
            <EmptyState icon="—" title="Sin lecciones" subtitle="Este grupo/nivel no tiene lecciones registradas." />
          )}
        </React.Fragment>
      )}

      {/* Drawer de detalle */}
      {selLec && data && (
        <AADetalleLeccion
          leccion={selLec}
          estudiantes={data.estudiantes || []}
          matriz={data.matriz || {}}
          nivelColor={nivelColor}
          onClose={() => setSelLec(null)}
        />
      )}
    </div>
  );
}

Object.assign(window, { AuditoriaAcademicaView });
