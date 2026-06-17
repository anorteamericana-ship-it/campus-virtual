/* global React */

// CALGRUPO_F35_20260617_DOCENTE_OPERATIVO_REAL
// Panel docente operativo: usa endpoints reales ya existentes para calendario,
// pendientes, roster CA y registro de notas manuales oficiales. No usa datos demo.

const DOCOP_COMPONENTES = [
  { id: 'ORAL_1', label: 'Oral 1', max: 15 },
  { id: 'ORAL_2', label: 'Oral 2', max: 15 },
  { id: 'ORAL_3', label: 'Oral 3', max: 15 },
  { id: 'ORAL_4', label: 'Oral 4', max: 15 },
  { id: 'SOCIAL_SKILL', label: 'Social Skill', max: 10 },
];

function docOpSesion() {
  try {
    const u = typeof window.getSesion === 'function' ? window.getSesion() : null;
    return u || {};
  } catch (_) {
    return {};
  }
}

async function docOpPost(fn, payload = {}) {
  const url = window.APPS_SCRIPT_URL || '';
  const token = typeof window.getSessionToken === 'function' ? window.getSessionToken() : '';
  if (!url) return { ok: false, error: 'APPS_SCRIPT_URL no disponible' };
  try {
    const res = await fetch(`${url}?fn=${encodeURIComponent(fn)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn, token, ...payload }),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'Error de conexión: ' + (e?.message || e) };
  }
}

function docOpTodayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function docOpDateLabel(iso) {
  if (!iso) return '—';
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return String(iso);
  const dt = new Date(y, m - 1, d);
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${dias[dt.getDay()]} ${String(d).padStart(2, '0')} ${meses[m - 1]}`;
}

function docOpDays(iso) {
  if (!iso) return 9999;
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return 9999;
  const a = new Date(); a.setHours(0, 0, 0, 0);
  const b = new Date(y, m - 1, d); b.setHours(0, 0, 0, 0);
  return Math.round((b - a) / 86400000);
}

function docOpNivelLabel(n) {
  return ({ B1: 'Básico I', B2: 'Básico II', I1: 'Intermedio I', I2: 'Intermedio II' })[String(n || '').toUpperCase()] || (n || '—');
}

function docOpGroupKey(item) {
  return `${item?.cod_grupo || item?.grupo || ''}__${String(item?.nivel || '').toUpperCase()}`;
}

function docOpBtnStyle(active, tone) {
  const bg = active ? (tone || 'var(--an-granate, #7A1E2C)') : 'white';
  return {
    border: active ? '1px solid transparent' : '1px solid var(--line, #e5e0d8)',
    background: bg,
    color: active ? 'white' : 'var(--ink-2, #4A413A)',
    borderRadius: 999,
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 800,
    fontFamily: 'inherit',
    boxShadow: active ? '0 9px 20px rgba(0,0,0,.10)' : 'none',
  };
}

function DocOpStat({ label, value, hint, tone }) {
  return (
    <div style={{
      background: 'white', border: '1px solid var(--line, #e5e0d8)', borderRadius: 16,
      padding: '14px 15px', minHeight: 92, boxShadow: '0 10px 26px rgba(0,0,0,.045)',
      borderTop: `4px solid ${tone || 'var(--an-gold, #D6A94A)'}`,
    }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.14em', fontWeight: 900, color: 'var(--ink-3, #6B7280)' }}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 28, lineHeight: 1, fontWeight: 900, color: 'var(--an-navy-ink, #001E47)' }}>{value}</div>
      {hint && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-3, #6B7280)' }}>{hint}</div>}
    </div>
  );
}

function DocOpLeccionCard({ lec, active, onSelect, onNavigate }) {
  const days = docOpDays(lec.fecha);
  const isExam = [9, 17, 18, 25, 31, 32].includes(Number(lec.leccion));
  const isToday = days === 0;
  const overdue = days < 0;
  return (
    <div style={{
      background: active ? 'color-mix(in srgb, var(--an-gold, #D6A94A) 12%, white)' : 'white',
      border: active ? '1px solid color-mix(in srgb, var(--an-gold, #D6A94A) 45%, white)' : '1px solid var(--line, #e5e0d8)',
      borderRadius: 14,
      padding: 13,
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 10,
      alignItems: 'center',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <strong style={{ fontFamily: 'var(--f-mono, monospace)', color: 'var(--an-navy-ink, #001E47)' }}>{lec.cod_grupo}</strong>
          <span style={{ fontSize: 11, fontWeight: 900, padding: '3px 8px', borderRadius: 999, background: '#f3efe7', color: '#4A413A' }}>{lec.nivel}</span>
          {isExam && <span style={{ fontSize: 10.5, fontWeight: 900, padding: '3px 8px', borderRadius: 999, background: '#fdecec', color: '#8B1A10' }}>evaluación</span>}
          {isToday && <span style={{ fontSize: 10.5, fontWeight: 900, padding: '3px 8px', borderRadius: 999, background: '#e8f1fd', color: '#0D47A1' }}>hoy</span>}
          {overdue && <span style={{ fontSize: 10.5, fontWeight: 900, padding: '3px 8px', borderRadius: 999, background: '#fff1da', color: '#8B4B00' }}>pendiente</span>}
        </div>
        <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-2, #4A413A)' }}>
          Lección <b>{lec.leccion || '—'}</b> · {lec.tipo || 'curso'} · {docOpDateLabel(lec.fecha)} · {lec.turno || ''}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button type="button" onClick={() => onSelect && onSelect(lec)} style={docOpBtnStyle(active)}>Operar</button>
        {onNavigate && <button type="button" onClick={() => onNavigate('mi_panel_docente')} style={docOpBtnStyle(false)}>Cerrar clase</button>}
      </div>
    </div>
  );
}

function DocenteOperativoView({ onNavigate } = {}) {
  const ses = React.useMemo(() => docOpSesion(), []);
  const idDocente = ses.cedula || ses.nombre || ses.usuario || '';
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [cal, setCal] = React.useState(null);
  const [pend, setPend] = React.useState(null);
  const [grupo, setGrupo] = React.useState(() => ses.grupoActivo || ses.grupo || (ses.grupos && ses.grupos[0]) || '');
  const [nivel, setNivel] = React.useState('');
  const [roster, setRoster] = React.useState([]);
  const [asistencia, setAsistencia] = React.useState({});
  const [loadingRoster, setLoadingRoster] = React.useState(false);
  const [rosterErr, setRosterErr] = React.useState('');
  const [drafts, setDrafts] = React.useState({});
  const [resumenes, setResumenes] = React.useState({});
  const [busyCode, setBusyCode] = React.useState('');
  const [toast, setToast] = React.useState('');

  const recargar = React.useCallback(async () => {
    setLoading(true); setError('');
    const [rCal, rPend] = await Promise.all([
      docOpPost('getCalendarioDocente', { cod_docente: idDocente }),
      docOpPost('getTareasPendientesDocente', { cod_docente: idDocente }),
    ]);
    if (!rCal?.ok) {
      setError(rCal?.error || 'No se pudo cargar calendario docente.');
    }
    setCal(rCal?.ok ? rCal : null);
    setPend(rPend?.ok ? rPend : null);
    setLoading(false);
  }, [idDocente]);

  React.useEffect(() => { recargar(); }, [recargar]);

  const programadas = React.useMemo(() => (cal?.programadas || []).filter(Boolean), [cal]);
  const cerradas = React.useMemo(() => cal?.cerradas || [], [cal]);
  const todayIso = docOpTodayIso();
  const hoy = React.useMemo(() => programadas.filter(x => x.fecha === todayIso), [programadas, todayIso]);
  const atrasadas = React.useMemo(() => programadas.filter(x => docOpDays(x.fecha) < 0).slice(0, 8), [programadas]);
  const proximas = React.useMemo(() => programadas.filter(x => docOpDays(x.fecha) >= 0).slice(0, 10), [programadas]);
  const examenes = React.useMemo(() => programadas.filter(x => [9, 17, 18, 25, 31, 32].includes(Number(x.leccion))).slice(0, 8), [programadas]);

  const grupos = React.useMemo(() => {
    const map = new Map();
    [...programadas, ...cerradas].forEach(item => {
      const g = item.cod_grupo || item.grupo;
      const n = String(item.nivel || '').toUpperCase();
      if (!g || !n) return;
      const k = `${g}__${n}`;
      if (!map.has(k)) map.set(k, { grupo: g, nivel: n, programadas: 0, cerradas: 0, prox: null });
      const row = map.get(k);
      if ((item.estado || '').toUpperCase() === 'CERRADA' || (item.estado || '').toUpperCase() === 'CALCULADA') row.cerradas += 1;
      else row.programadas += 1;
      if (!row.prox && docOpDays(item.fecha) >= 0) row.prox = item.fecha;
    });
    return Array.from(map.values()).sort((a, b) => (a.prox || '9999').localeCompare(b.prox || '9999'));
  }, [programadas, cerradas]);

  React.useEffect(() => {
    if (!cal) return;
    if (!grupo || !nivel) {
      const base = hoy[0] || proximas[0] || programadas[0] || grupos[0];
      if (base) {
        setGrupo(base.cod_grupo || base.grupo || grupo);
        setNivel(String(base.nivel || nivel || '').toUpperCase());
      }
    }
  }, [cal, grupo, nivel, hoy, proximas, programadas, grupos]);

  const cargarRoster = React.useCallback(async (g = grupo, n = nivel) => {
    if (!g || !n) { setRosterErr('Seleccioná grupo y nivel.'); return; }
    setLoadingRoster(true); setRosterErr('');
    const [r, a] = await Promise.all([
      docOpPost('getEstudiantesParaCierre', { cod_grupo: g, nivel: n }),
      docOpPost('getAsistenciaGrupoCompleta', { cod_grupo: g }),
    ]);
    if (!r?.ok) {
      setRoster([]); setRosterErr(r?.error || 'No se pudo cargar estudiantes CA.');
    } else {
      setRoster(r.estudiantes || []);
      setRosterErr('');
    }
    if (a?.ok) setAsistencia(a.asistencia || {});
    setLoadingRoster(false);
  }, [grupo, nivel]);

  React.useEffect(() => {
    if (grupo && nivel) cargarRoster(grupo, nivel);
  }, [grupo, nivel, cargarRoster]);

  const seleccionarLeccion = (lec) => {
    const g = lec.cod_grupo || lec.grupo || '';
    const n = String(lec.nivel || '').toUpperCase();
    if (g) setGrupo(g);
    if (n) setNivel(n);
    try {
      if (typeof window.setGrupoActivoDocente === 'function' && g) window.setGrupoActivoDocente(g);
    } catch (_) {}
  };

  const setDraft = (code, patch) => {
    setDrafts(prev => ({
      ...prev,
      [code]: { tipo: 'ORAL_1', nota: '', comentario: '', ...(prev[code] || {}), ...patch },
    }));
  };

  const cargarResumen = async (est) => {
    if (!est?.code) return;
    setBusyCode(est.code);
    const r = await docOpPost('getResumenNotasOficialesEstudiante', {
      codigo: est.code,
      cod_estudiante: est.code,
      grupo,
      nivel,
    });
    if (r?.ok) setResumenes(prev => ({ ...prev, [est.code]: r }));
    else setToast(r?.error || 'No se pudo leer resumen de notas.');
    setBusyCode('');
  };

  const registrarNota = async (est) => {
    const d = drafts[est.code] || { tipo: 'ORAL_1', nota: '', comentario: '' };
    const nota = Number(d.nota);
    if (Number.isNaN(nota) || nota < 0 || nota > 100) {
      setToast('La nota debe estar entre 0 y 100.');
      return;
    }
    setBusyCode(est.code);
    const r = await docOpPost('registrarNotaComponenteOficial', {
      codigo: est.code,
      cod_estudiante: est.code,
      nombre: est.name,
      grupo,
      cod_grupo: grupo,
      nivel,
      componente: d.tipo,
      tipo_eval: d.tipo,
      nota_100: nota,
      comentario: d.comentario || `Registrado desde Panel Docente F35 por ${ses.nombre || 'docente'}`,
      registrado_por: ses.nombre || ses.cedula || 'docente',
    });
    if (r?.ok) {
      setToast(`${est.name || est.code}: ${r.tipo_eval} guardado (${r.puntos}/${r.max_puntos}).`);
      setDraft(est.code, { nota: '', comentario: '' });
      if (r.resumen?.ok) setResumenes(prev => ({ ...prev, [est.code]: r.resumen }));
      else await cargarResumen(est);
    } else {
      setToast(r?.error || 'No se pudo registrar la nota.');
    }
    setBusyCode('');
  };

  const activoKey = `${grupo}__${nivel}`;

  if (!idDocente) {
    return (
      <section data-screen-label="Docente · Panel operativo" style={{ padding: 24, fontFamily: 'var(--f-sans, system-ui)' }}>
        <div style={{ maxWidth: 720, margin: '64px auto', background: 'white', border: '1px solid var(--line)', borderRadius: 18, padding: 24 }}>
          <h2 style={{ margin: 0, color: 'var(--an-navy-ink)' }}>No hay sesión docente activa</h2>
          <p style={{ color: 'var(--ink-3)' }}>Entrá con un usuario docente o usá modo prueba desde superadmin.</p>
        </div>
      </section>
    );
  }

  return (
    <section data-screen-label="Docente · Panel operativo" style={{ padding: 18, fontFamily: 'var(--f-sans, system-ui)', color: 'var(--ink-1, #2D2520)' }}>
      <div style={{
        background: 'linear-gradient(135deg, var(--an-navy-ink, #001E47), #173B68)',
        color: 'white', borderRadius: 22, padding: '22px 24px', marginBottom: 18,
        boxShadow: '0 18px 45px rgba(0,30,71,.18)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 18,
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 900, opacity: .78 }}>F35 · Docente operativo real</div>
          <h1 style={{ margin: '7px 0 4px', fontSize: 30, lineHeight: 1.05, fontFamily: 'var(--f-serif, Georgia, serif)', fontWeight: 500 }}>Panel docente operativo</h1>
          <div style={{ fontSize: 13, opacity: .82 }}>Clases, estudiantes CA, orales, Social Skill, exámenes próximos y cierre de lección en una sola vista.</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 13, opacity: .9 }}>
          <b>{ses.nombre || 'Docente'}</b><br />{ses.cedula || '—'}
          <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button type="button" onClick={recargar} style={{ ...docOpBtnStyle(false), background: 'rgba(255,255,255,.12)', color: 'white', borderColor: 'rgba(255,255,255,.28)' }}>{loading ? 'Cargando…' : 'Actualizar'}</button>
            {onNavigate && <button type="button" onClick={() => onNavigate('examenes')} style={{ ...docOpBtnStyle(false), background: 'rgba(255,255,255,.12)', color: 'white', borderColor: 'rgba(255,255,255,.28)' }}>Exámenes</button>}
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ marginBottom: 12, background: '#FFF8DC', border: '1px solid #E5A823', color: '#7A4C00', borderRadius: 12, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span>{toast}</span><button type="button" onClick={() => setToast('')} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontWeight: 900 }}>×</button>
        </div>
      )}

      {error && <div style={{ marginBottom: 12, background: '#FDECEA', border: '1px solid #E8372A', color: '#8B1A10', borderRadius: 12, padding: 12 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
        <DocOpStat label="Clases hoy" value={loading ? '…' : hoy.length} hint="según cronograma" tone="#2B7FC1" />
        <DocOpStat label="Pendientes" value={loading ? '…' : (pend?.totales?.total_pendientes ?? atrasadas.length)} hint="cierre / retro / PC" tone="#E8372A" />
        <DocOpStat label="Exámenes próximos" value={loading ? '…' : examenes.length} hint="lecc. 9,17,18,25,31,32" tone="#D6A94A" />
        <DocOpStat label="Grupos activos" value={loading ? '…' : grupos.length} hint="grupo + nivel" tone="#4CAF50" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 0.95fr) minmax(520px, 1.55fr)', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 18, padding: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900, color: 'var(--ink-3)' }}>Grupos / niveles</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--an-navy-ink)' }}>Seleccionar operación</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {grupos.map(g => {
                const key = `${g.grupo}__${g.nivel}`;
                return <button key={key} type="button" style={docOpBtnStyle(key === activoKey)} onClick={() => { setGrupo(g.grupo); setNivel(g.nivel); }}>{g.grupo} · {g.nivel}</button>;
              })}
              {!grupos.length && !loading && <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>No hay grupos asignados en calendario.</div>}
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 18, padding: 15 }}>
            <div style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900, color: 'var(--ink-3)', marginBottom: 8 }}>Revisar primero</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {(atrasadas.length ? atrasadas : hoy.length ? hoy : proximas).slice(0, 6).map(lec => (
                <DocOpLeccionCard key={`${docOpGroupKey(lec)}_${lec.leccion}_${lec.fecha}_${lec.riel}`} lec={lec} active={docOpGroupKey(lec) === activoKey} onSelect={seleccionarLeccion} onNavigate={onNavigate} />
              ))}
              {!loading && !programadas.length && <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>No hay clases programadas visibles para este docente.</div>}
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 18, padding: 15 }}>
            <div style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900, color: 'var(--ink-3)', marginBottom: 8 }}>Evaluaciones próximas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {examenes.slice(0, 5).map(lec => (
                <DocOpLeccionCard key={`ex_${docOpGroupKey(lec)}_${lec.leccion}_${lec.fecha}_${lec.riel}`} lec={lec} active={docOpGroupKey(lec) === activoKey} onSelect={seleccionarLeccion} />
              ))}
              {!examenes.length && <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Sin evaluaciones próximas en calendario visible.</div>}
            </div>
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 14px 34px rgba(0,0,0,.045)' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)', background: 'linear-gradient(180deg, #fff, #faf8f3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900, color: 'var(--an-granate)' }}>Grupo activo</div>
                <div style={{ marginTop: 4, fontSize: 23, fontWeight: 900, color: 'var(--an-navy-ink)' }}>{grupo || '—'} · {docOpNivelLabel(nivel)}</div>
                <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--ink-3)' }}>Estudiantes CA para registrar orales y Social Skill sin salir del panel.</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => cargarRoster()} disabled={loadingRoster} style={docOpBtnStyle(true)}>{loadingRoster ? 'Cargando…' : 'Actualizar estudiantes'}</button>
                {onNavigate && <button type="button" onClick={() => onNavigate('mi_panel_docente')} style={docOpBtnStyle(false)}>Cierre de lección</button>}
              </div>
            </div>
          </div>

          {rosterErr && <div style={{ margin: 14, padding: 12, borderRadius: 12, background: '#FDECEA', color: '#8B1A10', border: '1px solid #E8372A' }}>{rosterErr}</div>}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 920 }}>
              <thead>
                <tr style={{ background: '#f8f5ef' }}>
                  {['Estudiante', 'Asistencia', 'Resumen notas', 'Registrar componente', 'Acciones'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--ink-3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roster.map(est => {
                  const d = drafts[est.code] || { tipo: 'ORAL_1', nota: '', comentario: '' };
                  const res = resumenes[est.code];
                  const as = asistencia[est.code] || asistencia[String(est.code)] || null;
                  return (
                    <tr key={est.code} style={{ borderTop: '1px solid var(--line)' }}>
                      <td style={{ padding: 12, verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 900, color: 'var(--an-navy-ink)' }}>{est.name || est.nombre || 'Sin nombre'}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--f-mono, monospace)' }}>{est.code}</div>
                        {est.convenio && <div style={{ fontSize: 11, marginTop: 5, display: 'inline-flex', padding: '3px 8px', background: '#f3efe7', borderRadius: 999 }}>{est.convenio}</div>}
                      </td>
                      <td style={{ padding: 12, verticalAlign: 'top' }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: as && Number(as.pct || as.porcentaje) < 70 ? '#8B1A10' : 'var(--an-navy-ink)' }}>{as ? `${Math.round(Number(as.pct || as.porcentaje || 0))}%` : '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>si backend envía asistencia</div>
                      </td>
                      <td style={{ padding: 12, verticalAlign: 'top' }}>
                        {res ? (
                          <div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: Number(res.nota_total) >= 70 ? '#1B5E20' : '#8B1A10' }}>{Number(res.nota_total || 0).toFixed(1)}</div>
                            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Faltan: {(res.faltantes || []).join(', ') || 'ninguno'}</div>
                          </div>
                        ) : <button type="button" onClick={() => cargarResumen(est)} disabled={busyCode === est.code} style={docOpBtnStyle(false)}>{busyCode === est.code ? 'Leyendo…' : 'Ver notas'}</button>}
                      </td>
                      <td style={{ padding: 12, verticalAlign: 'top' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '150px 88px', gap: 7 }}>
                          <select value={d.tipo} onChange={e => setDraft(est.code, { tipo: e.target.value })} style={{ padding: '8px 9px', borderRadius: 10, border: '1px solid var(--line)', fontFamily: 'inherit' }}>
                            {DOCOP_COMPONENTES.map(c => <option key={c.id} value={c.id}>{c.label} · {c.max}pts</option>)}
                          </select>
                          <input value={d.nota} onChange={e => setDraft(est.code, { nota: e.target.value })} placeholder="0-100" inputMode="decimal" style={{ padding: '8px 9px', borderRadius: 10, border: '1px solid var(--line)', fontFamily: 'var(--f-mono, monospace)' }} />
                        </div>
                        <input value={d.comentario || ''} onChange={e => setDraft(est.code, { comentario: e.target.value })} placeholder="Comentario opcional" style={{ marginTop: 7, width: '100%', padding: '8px 9px', borderRadius: 10, border: '1px solid var(--line)', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </td>
                      <td style={{ padding: 12, verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                          <button type="button" onClick={() => registrarNota(est)} disabled={busyCode === est.code} style={docOpBtnStyle(true)}>{busyCode === est.code ? 'Guardando…' : 'Guardar nota'}</button>
                          <button type="button" onClick={() => cargarResumen(est)} disabled={busyCode === est.code} style={docOpBtnStyle(false)}>Actualizar</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!roster.length && !loadingRoster && (
                  <tr><td colSpan="5" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)' }}>No hay estudiantes CA cargados para {grupo || 'grupo'} · {nivel || 'nivel'}.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

window.DocenteOperativoView = DocenteOperativoView;
