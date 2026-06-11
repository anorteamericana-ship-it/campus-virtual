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

// FIX-ADMIN-CORE-POST-001: lecturas internas vía POST text/plain. Conserva
// `?fn=` en la URL (Apps Script enruta con e.parameter.fn) y envía el token en
// el BODY, nunca en la URL.
async function postAuditoria(fn, payload = {}) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const res = await fetch(`${SCRIPT_URL_AA}?fn=${encodeURIComponent(fn)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      fn,
      token,
      ...payload,
    }),
  });
  return await res.json();
}

// Paleta por nivel (consistente con el resto del campus).
const AA_NIVEL_COLOR = { B1: '#9A6A00', B2: '#8B1A10', I1: '#0D47A1', I2: '#1B5E20' };
const AA_NIVELES = ['B1', 'B2', 'I1', 'I2'];
const AA_ESTADOS = [['todas', 'Todas'], ['cerradas', 'Cerradas'], ['pendientes', 'Pendientes'], ['alertas', 'Con alertas']];
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
function AADetalleLeccion({ leccion, estudiantes, matriz, nivelColor, esSuperadmin, onEditar, onClose }) {
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

        {/* Pie: recordatorio solo lectura (+ edición superadmin) */}
        <div style={{
          padding: '10px 22px', borderTop: '1px solid var(--line)',
          background: 'var(--surface-2)', fontSize: 11, color: 'var(--ink-3)',
          letterSpacing: '0.03em',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <span>Vista de solo lectura · los datos no se pueden editar desde aquí.</span>
          {esSuperadmin && (
            <button
              className="btn btn-navy"
              style={{ padding: '8px 14px', fontSize: 12, flexShrink: 0 }}
              onClick={() => onEditar && onEditar(leccion)}
              title="Edición restringida a superadmin">
              Editar datos cerrados
            </button>
          )}
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
const aaH2Style = {
  fontFamily: 'var(--f-serif)', fontWeight: 500, fontSize: 20,
  letterSpacing: '-0.02em', color: 'var(--ink)', margin: 0,
};

// ── Riesgo académico: cálculo por estudiante (sin endpoints nuevos) ─────────
// Usa data.estudiantes + data.lecciones + data.matriz ya recibidos.
function aaNum(v) {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return isNaN(n) ? null : n;
}
// Notas numéricas de una celda de la matriz (evaluaciones[] o nota_total).
function aaNotasDeCelda(d) {
  const out = [];
  if (Array.isArray(d.evaluaciones)) {
    d.evaluaciones.forEach(ev => { const n = aaNum(ev && (ev.nota ?? ev.valor)); if (n != null) out.push(n); });
  }
  const nt = aaNum(d.nota_total);
  if (nt != null && !out.length) out.push(nt);
  return out;
}
function aaNivelRiesgo(pct, promedio) {
  // Alto: asistencia < 70% o promedio < 70
  if ((pct != null && pct < 70) || (promedio != null && promedio < 70)) return 'alto';
  // Bajo: asistencia >= 85% y sin notas bajas
  if (pct != null && pct >= 85 && !(promedio != null && promedio < 70)) return 'bajo';
  // Medio: 70%–85%, o con ausencias / notas insuficientes
  return 'medio';
}
function aaComputeRiesgo(estudiantes, lecciones, matriz) {
  return (estudiantes || []).map(e => {
    let conReg = 0, presentes = 0, ausentes = 0, retro = 0, pc = 0;
    const notas = [];
    (lecciones || []).forEach(l => {
      const fila = matriz && matriz[String(l.leccion)];
      const d = fila && fila[e.code];
      if (!d) return;
      if (d.presente === true) { presentes++; conReg++; }
      else if (d.presente === false) { ausentes++; conReg++; }
      if (d.retro) retro++;
      if (d.progress_check) pc++;
      aaNotasDeCelda(d).forEach(n => notas.push(n));
    });
    const totalAsis = presentes + ausentes;
    const pct = totalAsis ? (presentes / totalAsis * 100) : null;
    const promedio = notas.length ? (notas.reduce((a, b) => a + b, 0) / notas.length) : null;
    return {
      code: e.code, name: e.name, conReg, presentes, ausentes, pct,
      promedio, notas: notas.length, retro, pc, riesgo: aaNivelRiesgo(pct, promedio),
    };
  });
}
const AA_RIESGO_CHIP = {
  alto:  { label: 'Alto',  bg: '#FCE6E4', fg: 'var(--danger)' },
  medio: { label: 'Medio', bg: 'color-mix(in srgb, var(--an-gold) 22%, white)', fg: '#6B4A00' },
  bajo:  { label: 'Bajo',  bg: '#E2F1E5', fg: '#1B5E20' },
};

// ── Tabla de Riesgo académico (solo lectura) ───────────────────────────────
function AARiesgoTabla({ filas, onVerFicha }) {
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
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr>
              <th style={th}>Estudiante</th>
              <th style={th}>Asistencia</th>
              <th style={th}>Ausencias</th>
              <th style={th}>Promedio</th>
              <th style={th}>Retro</th>
              <th style={th}>PC</th>
              <th style={th}>Riesgo</th>
              <th style={{ ...th, textAlign: 'right' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filas.map(r => {
              const chip = AA_RIESGO_CHIP[r.riesgo] || AA_RIESGO_CHIP.medio;
              return (
                <tr key={r.code}>
                  <td style={td}>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.name}</div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--f-mono)', color: 'var(--ink-3)' }}>{r.code}</div>
                  </td>
                  <td style={td}>
                    {r.pct != null
                      ? <span><b>{Math.round(r.pct)}%</b> <span style={{ color: 'var(--ink-3)' }}>· {r.presentes}/{r.presentes + r.ausentes}</span></span>
                      : <span style={{ color: 'var(--ink-3)' }}>—</span>}
                  </td>
                  <td style={{ ...td, color: r.ausentes > 0 ? 'var(--danger)' : 'var(--ink-2)', fontWeight: r.ausentes > 0 ? 700 : 400 }}>
                    {r.ausentes}
                  </td>
                  <td style={td}>
                    {r.promedio != null
                      ? <b style={{ color: r.promedio < 70 ? 'var(--danger)' : 'var(--ink)' }}>{Math.round(r.promedio * 10) / 10}</b>
                      : <span style={{ color: 'var(--ink-3)' }}>—</span>}
                    {r.notas > 0 && <span style={{ color: 'var(--ink-3)', fontSize: 11 }}> · {r.notas} nota{r.notas !== 1 ? 's' : ''}</span>}
                  </td>
                  <td style={td}>{r.retro || <span style={{ color: 'var(--ink-3)' }}>0</span>}</td>
                  <td style={td}>{r.pc || <span style={{ color: 'var(--ink-3)' }}>0</span>}</td>
                  <td style={td}>
                    <AAChip bg={chip.bg} fg={chip.fg}>{chip.label}</AAChip>
                  </td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => onVerFicha && onVerFicha(r)}>
                      Ver ficha
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

// ── Ficha académica: construcción por estudiante (sin endpoints nuevos) ────
// Usa data.lecciones + data.matriz ya en memoria.
function aaBuildFicha(est, lecciones, matriz) {
  const timeline = [];
  const evaluaciones = [];
  const notasList = [];
  let presentes = 0, ausentes = 0, retroCount = 0, pcCount = 0;
  (lecciones || []).forEach(l => {
    const fila = matriz && matriz[String(l.leccion)];
    const d = fila && fila[est.code];
    if (!d) return;
    const retroTxt = (d.retro && String(d.retro).trim()) ? d.retro : '';
    const tieneEvals = Array.isArray(d.evaluaciones) && d.evaluaciones.length;
    const tieneNota = d.nota_total !== undefined && d.nota_total !== null && d.nota_total !== '';
    const tieneDato = (d.presente === true || d.presente === false)
      || !!retroTxt || !!d.progress_check || tieneEvals || tieneNota;
    if (!tieneDato) return;

    if (d.presente === true) presentes++;
    else if (d.presente === false) ausentes++;
    if (retroTxt) retroCount++;
    if (d.progress_check) pcCount++;

    const notas = aaNotasDeCelda(d);
    notas.forEach(n => notasList.push(n));

    if (tieneEvals) {
      d.evaluaciones.forEach(ev => evaluaciones.push({
        leccion: l.leccion,
        tipo: (ev && (ev.tipo || ev.label)) || AA_TIPO_LABEL[l.tipo] || 'Evaluación',
        nota: ev ? (ev.nota ?? ev.valor ?? null) : null,
        nota_total: aaNum(d.nota_total),
      }));
    } else if (aaNum(d.nota_total) != null) {
      evaluaciones.push({
        leccion: l.leccion,
        tipo: AA_TIPO_LABEL[l.tipo] || l.tipo || 'Nota',
        nota: aaNum(d.nota_total),
        nota_total: aaNum(d.nota_total),
      });
    }

    timeline.push({
      leccion: l.leccion, fecha: l.fecha, tipo: l.tipo, estado: l.estado,
      dia: l.dia, turno: l.turno, presente: d.presente,
      notas, evaluaciones: d.evaluaciones, nota_total: d.nota_total,
      retro: retroTxt, progress_check: d.progress_check, alertas: l.alertas || [],
    });
  });

  const totalAsis = presentes + ausentes;
  const pct = totalAsis ? (presentes / totalAsis * 100) : null;
  const promedio = notasList.length ? (notasList.reduce((a, b) => a + b, 0) / notasList.length) : null;
  const observaciones = timeline
    .filter(t => t.retro && String(t.retro).trim())
    .sort((a, b) => a.leccion - b.leccion);

  return {
    timeline, evaluaciones, notasList, observaciones,
    presentes, ausentes, pct, promedio, retroCount, pcCount,
    notas: notasList.length, riesgo: aaNivelRiesgo(pct, promedio),
  };
}

// Alertas derivadas del estudiante (solo lectura).
function aaAlertasEstudiante(f) {
  const out = [];
  if (f.pct != null && f.pct < 85) out.push({ label: 'Asistencia baja', detail: `${Math.round(f.pct)}% de asistencia` });
  if (f.promedio != null && f.promedio < 70) out.push({ label: 'Promedio bajo', detail: `Promedio ${Math.round(f.promedio * 10) / 10}` });
  if (f.ausentes >= 2) out.push({ label: 'Ausencias acumuladas', detail: `${f.ausentes} ausencias` });
  if ((f.presentes + f.ausentes) === 0 && f.notas === 0) out.push({ label: 'Sin datos suficientes', detail: 'No hay registros de asistencia ni notas' });
  const bajas = (f.notasList || []).filter(n => n < 70);
  if (bajas.length) out.push({ label: 'Notas menores a 70', detail: `${bajas.length} nota${bajas.length !== 1 ? 's' : ''} < 70` });
  return out;
}

// Mini-stat para el resumen de la ficha.
function AAMini({ label, valor, tone }) {
  const color = tone === 'alert' ? 'var(--danger)' : 'var(--an-navy)';
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm, 6px)', padding: '8px 10px' }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: 'var(--f-serif)', fontWeight: 700, fontSize: 20, lineHeight: 1, color }}>{valor}</div>
    </div>
  );
}

// ── Drawer Ficha académica (solo lectura) ──────────────────────────────────
function AAFichaEstudiante({ estudiante, lecciones, matriz, grupoMeta, nivel, nivelColor, onClose }) {
  const f = aaBuildFicha(estudiante, lecciones, matriz);
  const alertas = aaAlertasEstudiante(f);
  const chip = AA_RIESGO_CHIP[f.riesgo] || AA_RIESGO_CHIP.medio;
  const sinDatos = f.timeline.length === 0;

  const asisCelda = (presente) => {
    if (presente === true)  return { label: 'Presente',     bg: '#E2F1E5', fg: '#1B5E20' };
    if (presente === false) return { label: 'Ausente',      bg: '#FCE6E4', fg: 'var(--danger)' };
    return { label: 'Sin registro', bg: 'var(--bg-deep)', fg: 'var(--ink-3)' };
  };

  const grupoLbl = (grupoMeta && grupoMeta.cod_grupo) || '';
  const nivelLbl = (grupoMeta && grupoMeta.nivel) || nivel || '';
  const sub = [estudiante.name, estudiante.code, grupoLbl, nivelLbl].filter(Boolean).join(' · ');

  const secTitle = {
    fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase',
    color: 'var(--ink-3)', margin: '18px 0 8px',
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1120,
        background: 'rgba(20, 16, 12, 0.5)',
        display: 'flex', justifyContent: 'flex-end',
        animation: 'an-fade-in .14s ease-out',
      }}>
      <div style={{
        width: 'min(600px, 100%)', height: '100%',
        background: 'var(--surface)', boxShadow: '-20px 0 60px rgba(0,0,0,0.28)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ height: 5, background: nivelColor }} />
        <div style={{
          padding: '18px 22px 14px', borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <div style={{ ...aaLabelStyle, marginBottom: 4 }}>Ficha académica</div>
            <div style={{
              fontFamily: 'var(--f-serif)', fontSize: 21, fontWeight: 500,
              color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.15,
            }}>{estudiante.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{sub}</div>
            <div style={{ marginTop: 8 }}>
              <AAChip bg={chip.bg} fg={chip.fg}>Riesgo {chip.label}</AAChip>
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

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 22px 26px' }}>
          {sinDatos ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-3)' }}>
              <div style={{ fontSize: 30, marginBottom: 6 }}>—</div>
              <div style={{ fontWeight: 600, color: 'var(--ink-2)' }}>Sin datos del estudiante</div>
              <div style={{ fontSize: 13 }}>No hay registros académicos para {estudiante.name} en este grupo/nivel.</div>
            </div>
          ) : (
            <React.Fragment>
              {/* 1 · Resumen superior */}
              <div style={secTitle}>Resumen</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
                <AAMini label="Asistencia" valor={f.pct != null ? `${Math.round(f.pct)}%` : '—'} />
                <AAMini label="Presentes" valor={f.presentes} />
                <AAMini label="Ausentes" valor={f.ausentes} tone={f.ausentes > 0 ? 'alert' : null} />
                <AAMini label="Promedio" valor={f.promedio != null ? Math.round(f.promedio * 10) / 10 : '—'} tone={f.promedio != null && f.promedio < 70 ? 'alert' : null} />
                <AAMini label="Notas" valor={f.notas} />
                <AAMini label="Retro" valor={f.retroCount} />
                <AAMini label="Progress Check" valor={f.pcCount} />
              </div>

              {/* 5 · Alertas del estudiante */}
              <div style={secTitle}>Alertas del estudiante</div>
              {alertas.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {alertas.map((a, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                      background: '#FFF7E6', border: '1px solid color-mix(in srgb, var(--an-gold) 35%, white)',
                      borderRadius: 'var(--r-sm, 6px)',
                    }}>
                      <span style={{ fontSize: 13 }}>⚠</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{a.label}</span>
                      <span style={{ fontSize: 12, color: 'var(--ink-3)', marginLeft: 'auto' }}>{a.detail}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Sin alertas para este estudiante.</div>
              )}

              {/* 2 · Timeline de lecciones */}
              <div style={secTitle}>Timeline de lecciones</div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {f.timeline.map(t => {
                  const est = aaEstadoChip(t.estado);
                  const asis = asisCelda(t.presente);
                  const notaTxt = (t.evaluaciones && t.evaluaciones.length)
                    ? t.evaluaciones.map(ev => `${ev.tipo || 'Eval'}: ${ev.nota ?? ev.valor ?? '—'}`).join(' · ')
                    : (aaNum(t.nota_total) != null ? `Nota: ${aaNum(t.nota_total)}` : null);
                  return (
                    <li key={t.leccion} style={{
                      padding: '12px 14px', background: 'var(--surface)',
                      border: '1px solid var(--line)', borderRadius: 'var(--r-md)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--f-mono)', fontWeight: 700, color: 'var(--ink)' }}>
                          Lec {String(t.leccion).padStart(2, '0')}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{aaFmtFecha(t.fecha)}</span>
                        <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{AA_TIPO_LABEL[t.tipo] || t.tipo || 'Clase'}</span>
                        <AAChip bg={est.bg} fg={est.fg}>{est.label}</AAChip>
                        <span style={{ marginLeft: 'auto' }}><AAChip bg={asis.bg} fg={asis.fg}>{asis.label}</AAChip></span>
                      </div>
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8, fontSize: 12, color: 'var(--ink-2)' }}>
                        {notaTxt && <span><b style={{ color: 'var(--ink)' }}>{notaTxt}</b></span>}
                        {t.progress_check && <span>PC: <b style={{ color: 'var(--ink)' }}>{typeof t.progress_check === 'string' ? t.progress_check : 'Registrado'}</b></span>}
                        {(t.alertas || []).map(a => { const c = aaAlertaChip(a); return <AAChip key={a} bg={c.bg} fg={c.fg}>⚠ {c.label}</AAChip>; })}
                      </div>
                      {t.retro && (
                        <div style={{
                          marginTop: 8, padding: '8px 10px', background: 'var(--surface-2)',
                          borderLeft: '3px solid var(--an-granate)', borderRadius: '0 var(--r-sm, 6px) var(--r-sm, 6px) 0',
                          fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.45,
                        }}>{t.retro}</div>
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* 3 · Observaciones docentes */}
              <div style={secTitle}>Observaciones docentes</div>
              {f.observaciones.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {f.observaciones.map(o => (
                    <div key={o.leccion} style={{
                      padding: '10px 12px', background: 'var(--surface-2)',
                      borderLeft: '3px solid var(--an-granate)', borderRadius: '0 var(--r-sm, 6px) var(--r-sm, 6px) 0',
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--an-granate)', textTransform: 'uppercase', marginBottom: 3 }}>
                        Lec {String(o.leccion).padStart(2, '0')} · {aaFmtFecha(o.fecha)}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.45 }}>{o.retro}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Sin retroalimentaciones registradas.</div>
              )}

              {/* 4 · Evaluaciones */}
              <div style={secTitle}>Evaluaciones</div>
              {f.evaluaciones.length ? (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Lección', 'Tipo', 'Nota', 'Nota total'].map((h, i) => (
                          <th key={h} style={{
                            textAlign: i >= 2 ? 'right' : 'left', fontSize: 10, fontWeight: 700,
                            letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)',
                            padding: '9px 12px', borderBottom: '1.5px solid var(--line)',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {f.evaluaciones.map((ev, i) => (
                        <tr key={i}>
                          <td style={{ padding: '9px 12px', fontFamily: 'var(--f-mono)', fontWeight: 700, fontSize: 12, borderBottom: '1px solid var(--line)' }}>
                            {String(ev.leccion).padStart(2, '0')}
                          </td>
                          <td style={{ padding: '9px 12px', fontSize: 13, color: 'var(--ink-2)', borderBottom: '1px solid var(--line)' }}>{ev.tipo}</td>
                          <td style={{ padding: '9px 12px', fontSize: 13, textAlign: 'right', fontWeight: 700, color: (ev.nota != null && ev.nota < 70) ? 'var(--danger)' : 'var(--ink)', borderBottom: '1px solid var(--line)' }}>
                            {ev.nota != null ? ev.nota : '—'}
                          </td>
                          <td style={{ padding: '9px 12px', fontSize: 13, textAlign: 'right', color: 'var(--ink-2)', borderBottom: '1px solid var(--line)' }}>
                            {ev.nota_total != null ? ev.nota_total : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Sin evaluaciones registradas.</div>
              )}
            </React.Fragment>
          )}
        </div>

        <div style={{
          padding: '10px 22px', borderTop: '1px solid var(--line)',
          background: 'var(--surface-2)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.03em',
        }}>
          Vista de solo lectura · los datos no se pueden editar desde aquí.
        </div>
      </div>
    </div>
  );
}

// ── Exportación CSV (local, sin backend ni librerías) ──────────────────────
// Escapa un valor para CSV: envuelve en comillas si contiene separador,
// comillas o saltos de línea; duplica las comillas internas.
function aaCsvCell(v) {
  if (v === null || v === undefined) v = '';
  let s = String(v);
  if (/[";\n\r,]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function aaCsvRow(arr) { return arr.map(aaCsvCell).join(';'); }

// Construye el CSV completo (3 secciones) desde los datos ya en memoria.
function aaGenerarCSV(data) {
  const g = (data && data.grupo) || {};
  const grupo = g.cod_grupo || '';
  const nivel = g.nivel || '';
  const lecciones = (data && Array.isArray(data.lecciones)) ? data.lecciones : [];
  const estudiantes = (data && Array.isArray(data.estudiantes)) ? data.estudiantes : [];
  const matriz = (data && data.matriz) || {};
  const RLAB = { alto: 'Alto', medio: 'Medio', bajo: 'Bajo' };
  const pctTxt = v => (v != null && !isNaN(v)) ? Math.round(v) : '';
  const lines = [];

  // SECCIÓN 1 · Resumen de lecciones
  lines.push('RESUMEN DE LECCIONES');
  lines.push(aaCsvRow(['Grupo', 'Nivel', 'Lección', 'Fecha', 'Tipo', 'Estado', 'Asistencia %',
    'Presentes', 'Ausentes', 'Total', 'Notas registradas', 'Retroalimentaciones', 'Progress Checks', 'Alertas']));
  lecciones.forEach(l => {
    const a = l.asistencia || {};
    lines.push(aaCsvRow([
      grupo, nivel, l.leccion, l.fecha || '', AA_TIPO_LABEL[l.tipo] || l.tipo || '', l.estado || '',
      pctTxt(a.pct), a.presentes ?? '', a.ausentes ?? '', a.total ?? '',
      (l.notas && l.notas.total) || 0, (l.retro && l.retro.total) || 0, (l.progress_check && l.progress_check.total) || 0,
      (l.alertas || []).join(' | '),
    ]));
  });

  lines.push('');

  // SECCIÓN 2 · Riesgo académico
  lines.push('RIESGO ACADÉMICO');
  lines.push(aaCsvRow(['Grupo', 'Nivel', 'Código', 'Estudiante', 'Asistencia %', 'Presentes', 'Ausentes',
    'Promedio', 'Notas registradas', 'Retroalimentaciones', 'Progress Checks', 'Riesgo']));
  aaComputeRiesgo(estudiantes, lecciones, matriz).forEach(r => {
    lines.push(aaCsvRow([
      grupo, nivel, r.code, r.name, pctTxt(r.pct), r.presentes, r.ausentes,
      r.promedio != null ? Math.round(r.promedio * 10) / 10 : '', r.notas, r.retro, r.pc, RLAB[r.riesgo] || r.riesgo,
    ]));
  });

  lines.push('');

  // SECCIÓN 3 · Detalle estudiante-lección
  lines.push('DETALLE ESTUDIANTE-LECCIÓN');
  lines.push(aaCsvRow(['Grupo', 'Nivel', 'Código', 'Estudiante', 'Lección', 'Fecha', 'Tipo', 'Estado',
    'Asistencia', 'Nota total', 'Evaluaciones', 'Retroalimentación', 'Progress Check', 'Alertas']));
  estudiantes.forEach(e => {
    const f = aaBuildFicha(e, lecciones, matriz);
    f.timeline.forEach(t => {
      const asis = t.presente === true ? 'Presente' : t.presente === false ? 'Ausente' : 'Sin registro';
      const evalsTxt = (t.evaluaciones && t.evaluaciones.length)
        ? t.evaluaciones.map(ev => `${(ev && (ev.tipo || ev.label)) || 'Eval'}: ${ev ? (ev.nota ?? ev.valor ?? '') : ''}`).join(' | ')
        : '';
      lines.push(aaCsvRow([
        grupo, nivel, e.code, e.name, t.leccion, t.fecha || '', AA_TIPO_LABEL[t.tipo] || t.tipo || '', t.estado || '',
        asis, aaNum(t.nota_total) != null ? aaNum(t.nota_total) : '', evalsTxt,
        t.retro || '', t.progress_check ? (typeof t.progress_check === 'string' ? t.progress_check : 'Registrado') : '',
        (t.alertas || []).join(' | '),
      ]));
    });
  });

  return lines.join('\r\n');
}

// Dispara la descarga del CSV con BOM UTF-8 (para que Excel lea tildes/eñes).
function aaDescargarCSV(contenido, nombre) {
  const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Modal de edición controlada (SOLO superadmin) ──────────────────────────
// Reutiliza window.fetchEditarRetroPCCerrada / fetchEditarAsistenciaNotaCerrada
// de data.jsx con su forma de payload exacta. No edición optimista: la vista
// local sólo se refresca si el backend acepta.
function AAEditarLeccion({ leccion, estudiantes, matriz, codGrupo, nivel, superadminNombre, onClose, onGuardado }) {
  const fila = (matriz && matriz[String(leccion.leccion)]) || {};
  const leccionNum = leccion.leccion;

  // ¿La lección permite nota? Solo tipos evaluables (Oral/Escrito) o si ya hay
  // alguna nota/evaluación registrada en la matriz. PROGRESS_CHECK NO habilita
  // nota numérica por sí solo.
  const permiteNota = React.useMemo(() => {
    if (['EVAL_ORAL', 'EVAL_ESCRITO'].includes(leccion.tipo)) return true;
    return (estudiantes || []).some(e => {
      const d = fila[e.code] || {};
      return aaNum(d.nota_total) != null || (Array.isArray(d.evaluaciones) && d.evaluaciones.length);
    });
  }, [leccion.tipo, estudiantes, fila]);

  // Estado inicial inmutable (para detectar cambios reales).
  const initial = React.useMemo(() => {
    const m = {};
    (estudiantes || []).forEach(e => {
      const d = fila[e.code] || {};
      const notaInit = aaNum(d.nota_total) != null
        ? String(aaNum(d.nota_total))
        : (Array.isArray(d.evaluaciones) && d.evaluaciones.length && (d.evaluaciones[0].nota ?? d.evaluaciones[0].valor) != null
            ? String(d.evaluaciones[0].nota ?? d.evaluaciones[0].valor) : '');
      m[e.code] = {
        // asistencia: 'P' | 'A' | '' (sin registro)
        asis: d.presente === true ? 'P' : d.presente === false ? 'A' : '',
        retro: (d.retro && String(d.retro)) || '',
        pc: (d.progress_check && typeof d.progress_check === 'string') ? d.progress_check : '',
        nota: notaInit,
      };
    });
    return m;
  }, [estudiantes, fila]);

  const [form, setForm] = React.useState(() => JSON.parse(JSON.stringify(initial)));
  const [confirmar, setConfirmar] = React.useState(false);
  const [estado, setEstado] = React.useState('idle'); // idle | guardando | error
  const [errMsg, setErrMsg] = React.useState('');

  const setCampo = (code, campo, valor) => {
    setForm(prev => ({ ...prev, [code]: { ...(prev[code] || {}), [campo]: valor } }));
  };

  // Solo dígitos, 0–100, vacío permitido.
  const onNotaChange = (code, raw) => {
    const limpio = String(raw).replace(/[^\d]/g, '');
    if (limpio === '') { setCampo(code, 'nota', ''); return; }
    let n = parseInt(limpio, 10);
    if (isNaN(n)) return;
    if (n > 100) n = 100;
    setCampo(code, 'nota', String(n));
  };

  // Construcción de listas de cambios reales.
  const cambios = React.useMemo(() => {
    const cambioRetro = [], cambioPC = [], cambioAsist = [], cambioNota = [];
    (estudiantes || []).forEach(e => {
      const a = form[e.code] || {};
      const b = initial[e.code] || {};
      if ((a.retro || '') !== (b.retro || '')) cambioRetro.push({ cod_estudiante: e.code, comentario: a.retro || '' });
      if ((a.pc || '') !== (b.pc || '')) cambioPC.push({ cod_estudiante: e.code, comentario: a.pc || '' });
      // Asistencia: sólo enviamos cambios a Presente/Ausente (booleano). "Sin
      // registro" no tiene representación en el payload existente → no se envía.
      if ((a.asis || '') !== (b.asis || '') && (a.asis === 'P' || a.asis === 'A')) {
        cambioAsist.push({ cod_estudiante: e.code, presente: a.asis === 'P' });
      }
      if (permiteNota && (a.nota || '') !== (b.nota || '')) cambioNota.push({ cod_estudiante: e.code, nota: a.nota });
    });
    return { cambioRetro, cambioPC, cambioAsist, cambioNota };
  }, [form, initial, estudiantes, permiteNota]);

  const totalCambios = cambios.cambioRetro.length + cambios.cambioPC.length + cambios.cambioAsist.length + cambios.cambioNota.length;

  const handleGuardar = async () => {
    // Seguridad: re-verificamos rol antes de cualquier llamada.
    const ses = window.getSesion ? window.getSesion() : null;
    if (!ses || ses.rol !== 'superadmin') {
      setEstado('error'); setErrMsg('Acción restringida a superadmin.'); setConfirmar(false);
      return;
    }
    setEstado('guardando'); setErrMsg(''); setConfirmar(false);
    const calls = [];
    if (cambios.cambioRetro.length) {
      calls.push(window.fetchEditarRetroPCCerrada({
        tipo: 'retro', cod_grupo: codGrupo, leccion_num: leccionNum,
        lista: cambios.cambioRetro, editado_por: superadminNombre,
      }));
    }
    if (cambios.cambioPC.length) {
      calls.push(window.fetchEditarRetroPCCerrada({
        tipo: 'pc', cod_grupo: codGrupo, leccion_num: leccionNum,
        lista: cambios.cambioPC, editado_por: superadminNombre,
      }));
    }
    if (cambios.cambioAsist.length || cambios.cambioNota.length) {
      calls.push(window.fetchEditarAsistenciaNotaCerrada({
        cod_grupo: codGrupo, nivel, leccion: leccionNum,
        asistencias: cambios.cambioAsist, notas: cambios.cambioNota,
        editado_por: superadminNombre,
      }));
    }
    try {
      const resultados = await Promise.all(calls);
      const fallo = resultados.find(r => !r || !r.ok);
      if (fallo) {
        const e = fallo && fallo.error;
        setEstado('error');
        setErrMsg(
          e === 'sesion_requerida' ? 'Sesión requerida. Iniciá sesión nuevamente.'
          : e === 'no_autorizado' ? 'No autorizado: se requiere sesión de superadmin.'
          : (e || 'Error al guardar. No se modificó nada.'));
        return; // NO refrescamos la vista local si el backend rechazó.
      }
      // Éxito: cerrar y recargar la auditoría (sin edición optimista).
      onGuardado();
    } catch (_) {
      setEstado('error'); setErrMsg('Error de conexión. No se modificó nada.');
    }
  };

  const guardando = estado === 'guardando';
  // "Sin registro" es solo estado inicial/visual; no es seleccionable. El
  // selector editable ofrece únicamente Presente / Ausente.
  const asisOpts = [['P', 'Presente'], ['A', 'Ausente']];

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget && !guardando) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1140,
        background: 'rgba(20, 16, 12, 0.55)',
        display: 'flex', justifyContent: 'flex-end',
        animation: 'an-fade-in .14s ease-out',
      }}>
      <div style={{
        width: 'min(640px, 100%)', height: '100%',
        background: 'var(--surface)', boxShadow: '-20px 0 60px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ height: 5, background: '#9A6A00' }} />
        <div style={{
          padding: '16px 22px 12px', borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <div style={{ ...aaLabelStyle, marginBottom: 4, color: '#9A6A00' }}>Editar datos cerrados</div>
            <div style={{ fontFamily: 'var(--f-serif)', fontSize: 19, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              Lección {String(leccionNum).padStart(2, '0')} · {aaFmtFecha(leccion.fecha)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3 }}>
              {codGrupo} · {nivel} · {AA_TIPO_LABEL[leccion.tipo] || leccion.tipo || 'Clase'}
            </div>
          </div>
          <button onClick={() => !guardando && onClose()} title="Cerrar"
            style={{ background: 'none', border: 'none', cursor: guardando ? 'not-allowed' : 'pointer', padding: 4, color: 'var(--ink-3)', lineHeight: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Advertencia */}
        <div style={{
          margin: '12px 22px 0', padding: '10px 12px',
          background: '#FFF7E6', border: '1px solid color-mix(in srgb, var(--an-gold) 40%, white)',
          borderRadius: 'var(--r-sm, 6px)', fontSize: 12, color: '#6B4A00', lineHeight: 1.4,
        }}>
          ⚠ Edición restringida a superadmin. Solo debe usarse para correcciones justificadas.
          La lección permanece cerrada y el cambio queda registrado.
        </div>

        {/* Lista editable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 20px' }}>
          {!estudiantes || !estudiantes.length ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              No hay estudiantes para editar en esta lección.
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {estudiantes.map((e, i) => {
                const v = form[e.code] || {};
                return (
                  <li key={e.code} style={{ padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-deep)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', flexShrink: 0 }}>{i + 1}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{e.name}</div>
                        <div style={{ fontSize: 10, fontFamily: 'var(--f-mono)', color: 'var(--ink-3)' }}>{e.code}</div>
                      </div>
                    </div>

                    {/* Asistencia */}
                    <div style={{ marginBottom: 8 }}>
                      <div style={aaEditLabel}>Asistencia</div>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {asisOpts.map(([k, lbl]) => (
                          <button key={k} type="button" disabled={guardando}
                            onClick={() => setCampo(e.code, 'asis', k)}
                            style={{
                              flex: 1, padding: '6px 8px', fontSize: 12, fontWeight: 600, cursor: guardando ? 'not-allowed' : 'pointer',
                              border: '1.5px solid', borderRadius: 'var(--r-sm, 6px)', fontFamily: 'inherit',
                              background: v.asis === k ? (k === 'P' ? '#E2F1E5' : '#FCE6E4') : 'var(--surface)',
                              borderColor: v.asis === k ? (k === 'P' ? '#1B5E20' : 'var(--danger)') : 'var(--line)',
                              color: v.asis === k ? (k === 'P' ? '#1B5E20' : 'var(--danger)') : 'var(--ink-3)',
                            }}>{lbl}</button>
                        ))}
                        {/* "Sin registro" solo informativo cuando no hay dato aún (no seleccionable). */}
                        {v.asis === '' && (
                          <span style={{
                            flexShrink: 0, padding: '6px 10px', fontSize: 11, fontWeight: 600,
                            color: 'var(--ink-3)', background: 'var(--bg-deep)',
                            border: '1px dashed var(--line-2, var(--line))', borderRadius: 'var(--r-sm, 6px)',
                          }}>Sin registro</span>
                        )}
                      </div>
                    </div>

                    {/* Nota (si la lección permite) */}
                    {permiteNota && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={aaEditLabel}>Nota (0–100)</div>
                        <input
                          type="text" inputMode="numeric" value={v.nota} disabled={guardando}
                          onChange={ev => onNotaChange(e.code, ev.target.value)}
                          placeholder="—"
                          style={{ width: 120, padding: '7px 10px', border: '1.5px solid var(--line)', borderRadius: 'var(--r-sm, 6px)', fontFamily: 'var(--f-mono)', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                    )}

                    {/* Retroalimentación */}
                    <div style={{ marginBottom: 8 }}>
                      <div style={aaEditLabel}>Retroalimentación</div>
                      <textarea
                        value={v.retro} disabled={guardando} rows={2}
                        onChange={ev => setCampo(e.code, 'retro', ev.target.value)}
                        placeholder="Sin retroalimentación"
                        style={{ width: '100%', padding: '7px 10px', border: '1.5px solid var(--line)', borderRadius: 'var(--r-sm, 6px)', fontFamily: 'inherit', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* Progress Check */}
                    <div>
                      <div style={aaEditLabel}>Progress Check</div>
                      <textarea
                        value={v.pc} disabled={guardando} rows={2}
                        onChange={ev => setCampo(e.code, 'pc', ev.target.value)}
                        placeholder="Sin comentario de Progress Check"
                        style={{ width: '100%', padding: '7px 10px', border: '1.5px solid var(--line)', borderRadius: 'var(--r-sm, 6px)', fontFamily: 'inherit', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 22px 14px', borderTop: '1px solid var(--line)', background: 'var(--surface)',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', flex: 1, minWidth: 150 }}>
            {estado === 'guardando' ? 'Guardando…'
              : estado === 'error' ? <span style={{ color: 'var(--danger)', fontWeight: 700 }}>⚠ {errMsg}</span>
              : `${totalCambios} cambio${totalCambios !== 1 ? 's' : ''} pendiente${totalCambios !== 1 ? 's' : ''}`}
          </div>
          <button type="button" onClick={() => !guardando && onClose()} disabled={guardando}
            className="btn btn-ghost" style={{ padding: '9px 14px', fontSize: 13 }}>
            Cancelar
          </button>
          <button type="button" onClick={() => setConfirmar(true)} disabled={guardando || !totalCambios}
            className="btn btn-primary" style={{ padding: '9px 16px', fontSize: 13, opacity: (!totalCambios || guardando) ? 0.55 : 1 }}>
            Guardar cambios
          </button>
        </div>

        {/* Confirmación previa */}
        {confirmar && (
          <div
            onClick={(e) => { if (e.target === e.currentTarget && !guardando) setConfirmar(false); }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(20,16,12,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ width: '100%', maxWidth: 420, background: 'var(--surface)', borderRadius: 'var(--r-lg, 12px)', boxShadow: '0 24px 64px rgba(0,0,0,0.32)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px 12px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ fontFamily: 'var(--f-serif)', fontSize: 18, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3 }}>
                  Modificar lección cerrada
                </div>
              </div>
              <div style={{ padding: '14px 22px', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                Vas a modificar datos de una lección cerrada. Esta acción queda registrada. ¿Deseás continuar?
              </div>
              <div style={{ padding: '12px 22px 18px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setConfirmar(false)} className="btn btn-ghost" style={{ padding: '9px 14px', fontSize: 13 }}>
                  Cancelar
                </button>
                <button type="button" onClick={handleGuardar} className="btn btn-primary" style={{ padding: '9px 16px', fontSize: 13 }}>
                  Sí, continuar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
const aaEditLabel = { fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 4 };

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
  const [selEst, setSelEst] = React.useState(null);
  const [editLec, setEditLec] = React.useState(null);
  const [filtroEstado, setFiltroEstado] = React.useState('todas');
  const [busqueda, setBusqueda] = React.useState('');

  const cargarGrupos = React.useCallback(() => {
    setLoadingGrupos(true); setErrorGrupos(null);
    return postAuditoria('getGruposActivos')
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

  // Rol actual desde la sesión real (sin localStorage). Sólo superadmin edita.
  const sesion = React.useMemo(() => (window.getSesion ? window.getSesion() : null), []);
  const esSuperadmin = !!sesion && sesion.rol === 'superadmin';
  const superadminNombre = (sesion && sesion.nombre) || 'superadmin';

  const resumen = data && data.resumen ? data.resumen : null;
  const grupoMeta = data && data.grupo ? data.grupo : null;
  const nivelColor = AA_NIVEL_COLOR[(grupoMeta && grupoMeta.nivel) || nivel] || AA_NIVEL_COLOR.B1;

  // ── Derivados de filtros / búsqueda (defensivos ante respuestas incompletas) ──
  const q = busqueda.trim().toLowerCase();
  const matchEst = (e) => !q || (`${(e && e.name) || ''} ${(e && e.code) || ''}`.toLowerCase().includes(q));
  const leccionesAll = (data && Array.isArray(data.lecciones)) ? data.lecciones : [];
  const leccionesVisibles = leccionesAll.filter(l => {
    const est = (l.estado || '').toUpperCase();
    if (filtroEstado === 'cerradas')   return est === 'CERRADA';
    if (filtroEstado === 'pendientes') return est !== 'CERRADA';
    if (filtroEstado === 'alertas')    return (l.alertas || []).length > 0;
    return true;
  });
  const riesgo = data ? aaComputeRiesgo(data.estudiantes || [], leccionesAll, data.matriz || {}) : [];
  const riesgoVisible = riesgo.filter(matchEst);
  const estudiantesDrawer = (data && Array.isArray(data.estudiantes)) ? data.estudiantes.filter(matchEst) : [];

  // Exportación CSV local (solo cuando hay auditoría cargada). No toca backend.
  const exportarCSV = React.useCallback(() => {
    if (!data) return;
    const g = (data.grupo && data.grupo.cod_grupo) || codGrupo || 'grupo';
    const n = (data.grupo && data.grupo.nivel) || nivel || '';
    const hoy = new Date().toISOString().slice(0, 10);
    const nombre = `auditoria_academica_${g}_${n}_${hoy}.csv`;
    aaDescargarCSV(aaGenerarCSV(data), nombre);
  }, [data, codGrupo, nivel]);

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
            {data && (
              <button
                className="btn btn-navy"
                style={{ padding: '10px 18px', marginLeft: 'auto' }}
                onClick={exportarCSV}
                title="Descargar la auditoría cargada como CSV">
                Exportar CSV
              </button>
            )}
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

          {/* Toolbar: filtro de estado + buscador de estudiante */}
          <div className="card" style={{
            padding: '14px 16px', marginBottom: 16,
            display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap',
          }}>
            <div>
              <div style={aaLabelStyle}>Estado de lección</div>
              <div style={{ display: 'flex', gap: 4, background: 'var(--bg-deep)', padding: 4, borderRadius: 'var(--r-md)', flexWrap: 'wrap' }}>
                {AA_ESTADOS.map(([k, lbl]) => (
                  <button key={k} onClick={() => setFiltroEstado(k)} style={{
                    padding: '7px 14px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                    borderRadius: 'var(--r-sm, 6px)', fontFamily: 'inherit',
                    background: filtroEstado === k ? 'var(--surface)' : 'transparent',
                    color: filtroEstado === k ? 'var(--an-navy-ink)' : 'var(--ink-3)',
                    boxShadow: filtroEstado === k ? 'var(--sh-1)' : 'none',
                  }}>{lbl}</button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={aaLabelStyle}>Buscar estudiante</div>
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Nombre o código…"
                style={{
                  width: '100%', padding: '9px 12px', border: '1.5px solid var(--line)',
                  borderRadius: 'var(--r-md)', fontFamily: 'inherit', fontSize: 13,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            {busqueda && (
              <button className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: 12 }} onClick={() => setBusqueda('')}>
                Limpiar
              </button>
            )}
          </div>

          {/* Riesgo académico (respeta el buscador) */}
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <h2 style={aaH2Style}>Riesgo académico</h2>
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
              {riesgoVisible.length} de {riesgo.length} estudiantes{busqueda ? ' (filtrado)' : ''}
            </span>
          </div>
          <div style={{ marginBottom: 24 }}>
            {riesgoVisible.length ? (
              <AARiesgoTabla filas={riesgoVisible} onVerFicha={setSelEst} />
            ) : (
              <EmptyState
                icon="—"
                title={busqueda ? 'Sin coincidencias' : 'Sin estudiantes'}
                subtitle={busqueda ? 'Ningún estudiante coincide con la búsqueda.' : 'Este grupo no tiene estudiantes activos.'}
              />
            )}
          </div>

          {/* Tabla de lecciones (respeta el filtro de estado) */}
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <h2 style={aaH2Style}>Lecciones</h2>
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
              {leccionesVisibles.length} de {leccionesAll.length} lecciones · click en “Ver” para el detalle
            </span>
          </div>

          {leccionesVisibles.length ? (
            <AALeccionesTabla lecciones={leccionesVisibles} onVer={setSelLec} />
          ) : (
            <EmptyState
              icon="—"
              title="Sin lecciones"
              subtitle={filtroEstado === 'todas'
                ? 'Este grupo/nivel no tiene lecciones registradas.'
                : 'Ninguna lección coincide con el filtro seleccionado.'}
            />
          )}
        </React.Fragment>
      )}

      {/* Drawer de detalle */}
      {selLec && data && (
        <AADetalleLeccion
          leccion={selLec}
          estudiantes={estudiantesDrawer}
          matriz={data.matriz || {}}
          nivelColor={nivelColor}
          esSuperadmin={esSuperadmin}
          onEditar={(l) => setEditLec(l)}
          onClose={() => setSelLec(null)}
        />
      )}

      {/* Drawer ficha académica del estudiante */}
      {selEst && data && (
        <AAFichaEstudiante
          estudiante={selEst}
          lecciones={leccionesAll}
          matriz={data.matriz || {}}
          grupoMeta={grupoMeta}
          nivel={nivel}
          nivelColor={nivelColor}
          onClose={() => setSelEst(null)}
        />
      )}

      {/* Modal edición controlada (sólo superadmin) */}
      {editLec && data && esSuperadmin && (
        <AAEditarLeccion
          leccion={editLec}
          estudiantes={data.estudiantes || []}
          matriz={data.matriz || {}}
          codGrupo={(grupoMeta && grupoMeta.cod_grupo) || codGrupo}
          nivel={(grupoMeta && grupoMeta.nivel) || nivel}
          superadminNombre={superadminNombre}
          onClose={() => setEditLec(null)}
          onGuardado={() => { setEditLec(null); setSelLec(null); cargarAuditoria(); }}
        />
      )}
    </div>
  );
}

Object.assign(window, { AuditoriaAcademicaView });
