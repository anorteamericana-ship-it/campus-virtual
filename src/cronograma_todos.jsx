/* global React */
// ─────────────────────────────────────────────────────────────────────────
// Vista "Todos los grupos" — solo admin / superadmin
// Se monta dentro de CronogramaGrupo cuando codGrupo === '__TODOS__'.
//
// Switch SEMANA / MES. Las lecciones de TODOS los grupos activos se apilan
// en cada día con el orden:
//   1. hora ASC (turnoOrden 1 = 9am antes que 2 = 6pm)
//   2. apertura al final de su franja
//   3. nivel DESC (I2 > I1 > B2 > B1)
//   4. lección DESC (mayor primero)
//   5. estudiantes DESC
//
// Marca: navy / granate / crema / Poppins. Tarjetas blancas.
// ─────────────────────────────────────────────────────────────────────────

const TODOS_NIVEL_COLOR = { B1:'#E5A823', B2:'#E8372A', I1:'#2B7FC1', I2:'#4CAF50' };
const TODOS_NIVEL_LABEL = {
  B1:'Básico I', B2:'Básico II', I1:'Intermedio I', I2:'Intermedio II',
};
const TODOS_NIVEL_ORDEN  = { I2:4, I1:3, B2:2, B1:1 }; // mayor → primero
const TODOS_APERTURA_COL = '#9F8F7D';
const TODOS_HORA_LABEL   = { 1:'9a', 2:'6p' };
// Nota: la asignación de "tonos por código" del prompt anterior se descartó —
// ahora cada grupo se distingue por su FILA (Gantt), no por un tono propio.
// El color sigue indicando el NIVEL.

const TODOS_MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];
const TODOS_MESES_CORTO = [
  'ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic',
];
const TODOS_DIAS_LARGO  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const TODOS_DIAS_SHORT  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const TODOS_DIAS_LUN0   = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

function tParseISO(iso){ return iso ? new Date(iso+'T00:00:00') : null; }
function tIsoOf(d){
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function tMondayOf(date){
  const d = new Date(date); d.setHours(0,0,0,0);
  const dow = d.getDay(); // 0=Sun, 1=Mon..6=Sat
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d;
}
function tAddDays(d, n){
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function tSameDate(a,b){
  return a.getFullYear()===b.getFullYear() &&
         a.getMonth()===b.getMonth() &&
         a.getDate()===b.getDate();
}
function tFmtRangoSemana(monday){
  const end = tAddDays(monday, 5); // hasta sábado por defecto
  const m1 = TODOS_MESES_CORTO[monday.getMonth()];
  const m2 = TODOS_MESES_CORTO[end.getMonth()];
  if (monday.getMonth() === end.getMonth()) {
    return `Semana del ${monday.getDate()} al ${end.getDate()} de ${TODOS_MESES[monday.getMonth()]}`;
  }
  return `Semana del ${monday.getDate()} ${m1} al ${end.getDate()} ${m2}`;
}
function tFmtFechaLarga(iso){
  const d = tParseISO(iso); if (!d) return '—';
  return `${TODOS_DIAS_LARGO[d.getDay()]} ${d.getDate()} de ${TODOS_MESES[d.getMonth()]} ${d.getFullYear()}`;
}

// Etiqueta corta para el "+N más" expandido / detalle
const TODOS_TIPO_LBL = {
  CLASE:'Clase regular',
  PROGRESS_CHECK:'Progress Check',
  EVAL_ORAL:'Examen Oral',
  EVAL_ESCRITO:'Examen Escrito',
  ICAN:'Sesión I CAN',
};

// ─────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────
const TODOS_SCRIPT_URL = window.APPS_SCRIPT_URL;

// CAL-RESTORE-GLOBAL-001:
// La vista global NO debe depender ciegamente del resumen de getGruposActivos,
// porque ese resumen puede llegar incompleto o pisarse luego con cachés auxiliares.
// Para el panel "Todos los grupos" usamos el resumen solo como primera pintura y,
// después, refrescamos cada grupo con getFechasGrupo (misma fuente fina que la
// vista individual) para preservar estados CERRADA/HOY/PROGRAMADA reales.
function todosNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function todosText(v, fallback = '') {
  return (v === null || v === undefined) ? fallback : String(v).trim();
}
function todosPickCa(grupo, moraInfo) {
  const caGrupo = todosNum(grupo && grupo.estudiantes);
  const caMora  = todosNum(moraInfo && moraInfo.ca);
  // Si el grupo trae estudiantes reales (>0), no permitimos que un caché viejo
  // de mora lo pinte como 0st un segundo después.
  if (caGrupo !== null && caGrupo > 0) return caGrupo;
  if (caMora !== null) return caMora;
  return caGrupo;
}
function todosPickMora(moraInfo) {
  const mr = todosNum(moraInfo && moraInfo.mora);
  return mr === null ? null : mr;
}
function todosNormalizarLeccion(l) {
  if (!l || !l.fecha) return null;
  const estado = todosText(l.estado, 'CALCULADA').toUpperCase() || 'CALCULADA';
  return {
    ...l,
    leccion: todosNum(l.leccion) || 0,
    fecha: todosText(l.fecha),
    tipo: todosText(l.tipo || l.tipo_leccion || l.tipoLeccion, 'CLASE'),
    estado,
  };
}
function todosNormalizarGrupo(g) {
  if (!g || !g.code) return null;
  const nivelId = todosText(g.nivelId || g.nivel || 'B1').toUpperCase();
  const lecciones = Array.isArray(g.lecciones)
    ? g.lecciones.map(todosNormalizarLeccion).filter(Boolean)
    : [];
  lecciones.sort((a,b) => (a.leccion || 0) - (b.leccion || 0));
  return {
    ...g,
    code: todosText(g.code),
    nivelId,
    nivel: g.nivel || TODOS_NIVEL_LABEL[nivelId] || nivelId,
    lecciones,
    estudiantes: todosNum(g.estudiantes) ?? 0,
    turnoOrden: todosNum(g.turnoOrden) ?? 99,
  };
}
async function todosPost(fn, payload = {}) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const res = await fetch(`${TODOS_SCRIPT_URL}?fn=${encodeURIComponent(fn)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, token, ...payload }),
  });
  return await res.json();
}

// Formatea el campo `actualizado` del caché de mora (yyyy-mm-dd hh:mm) en
// la etiqueta corta "26-may 17:26" que usa el header.
function tFmtMoraActualizado(s) {
  if (!s) return null;
  // Acepta "2026-05-26 17:26" o ISO.
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(s);
  if (!m) return s;
  const [, , mm, dd, hh, mi] = m;
  const idx = parseInt(mm, 10) - 1;
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${parseInt(dd,10)}-${meses[idx] || mm} ${hh}:${mi}`;
}

function TodosLosGruposView({ gruposReales, onNavigate }) {
  // Primera pintura con getGruposActivos; luego se enriquece con getFechasGrupo
  // por grupo para que la vista global coincida con la vista individual.
  const [gruposDetalle, setGruposDetalle] = React.useState(null);
  const safeGruposReales = React.useMemo(() => {
    const base = Array.isArray(gruposDetalle) ? gruposDetalle : (Array.isArray(gruposReales) ? gruposReales : []);
    return base.map(todosNormalizarGrupo).filter(Boolean);
  }, [gruposReales, gruposDetalle]);

  React.useEffect(() => {
    let cancelado = false;
    const base = (Array.isArray(gruposReales) ? gruposReales : [])
      .map(todosNormalizarGrupo)
      .filter(Boolean);
    setGruposDetalle(base);

    // Refuerzo fino: traer lecciones reales con getFechasGrupo, por lotes para
    // no saturar Apps Script. Si un grupo falla, conserva el resumen inicial.
    const targets = base.filter(g => !g.esApertura && g.code && g.nivelId);
    if (!targets.length) return () => { cancelado = true; };

    (async () => {
      const out = base.map(g => ({ ...g, lecciones: [...(g.lecciones || [])] }));
      const idxByCode = new Map(out.map((g, i) => [g.code, i]));
      const BATCH = 4;
      for (let i = 0; i < targets.length; i += BATCH) {
        const batch = targets.slice(i, i + BATCH);
        const results = await Promise.allSettled(batch.map(g =>
          todosPost('getFechasGrupo', { cod_grupo: g.code, nivel: g.nivelId })
        ));
        if (cancelado) return;
        results.forEach((r, j) => {
          if (r.status !== 'fulfilled') return;
          const d = r.value;
          if (!d || !d.ok || !Array.isArray(d.lecciones)) return;
          const g = batch[j];
          const idx = idxByCode.get(g.code);
          if (idx === undefined) return;
          out[idx] = {
            ...out[idx],
            lecciones: d.lecciones.map(todosNormalizarLeccion).filter(Boolean),
          };
        });
        setGruposDetalle(out.map(g => ({ ...g, lecciones: [...(g.lecciones || [])] })));
      }
    })();

    return () => { cancelado = true; };
  }, [gruposReales]);

  // ── HOOKS ARRIBA (sin returns condicionales antes) ────────────
  const [sub, setSub] = React.useState('semana'); // 'semana' | 'mes'
  const [weekStart, setWeekStart] = React.useState(() => tMondayOf(new Date()));
  const [monthCursor, setMonthCursor] = React.useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d;
  });
  const [detalle, setDetalle] = React.useState(null); // { grupo, leccion }
  const [expandedDay, setExpandedDay] = React.useState(null); // iso del día expandido en VistaMes

  // ── MORA (caché en backend) ───────────────────────────────────
  // moraMap: code → { ca, mora }. moraFecha: timestamp legible del caché.
  // Se carga después del Gantt para NO bloquear el render del calendario.
  const [moraMap,     setMoraMap]     = React.useState(null); // null = todavía no llegó
  const [moraFecha,   setMoraFecha]   = React.useState(null);
  const [moraLoading, setMoraLoading] = React.useState(false);
  const [moraUpdating, setMoraUpdating] = React.useState(false);
  const [moraError,   setMoraError]   = React.useState(null);

  const cargarMora = React.useCallback(() => {
    setMoraLoading(true); setMoraError(null);
    return fetch(`${TODOS_SCRIPT_URL}?fn=getMoraGrupos`)
      .then(r => r.json())
      .then(d => {
        if (d?.ok && d.grupos && typeof d.grupos === 'object') {
          const m = new Map();
          for (const code of Object.keys(d.grupos)) m.set(code, d.grupos[code]);
          setMoraMap(m);
          setMoraFecha(d.actualizado || null);
        } else {
          setMoraError(d?.error || 'Sin caché de mora');
          setMoraMap(new Map());
        }
      })
      .catch(e => {
        setMoraError('Error de red al leer mora');
        setMoraMap(new Map());
      })
      .finally(() => setMoraLoading(false));
  }, []);

  React.useEffect(() => { cargarMora(); }, [cargarMora]);

  const actualizarMora = React.useCallback(async () => {
    if (moraUpdating) return;
    setMoraUpdating(true); setMoraError(null);
    try {
      const r = await fetch(TODOS_SCRIPT_URL, {
        method: 'POST',
        body: new URLSearchParams({ fn: 'actualizarMoraCache' }),
      });
      const d = await r.json();
      if (!d?.ok) throw new Error(d?.error || 'Falló actualización');
      await cargarMora();
    } catch (e) {
      setMoraError('No se pudo actualizar la mora, reintentá');
    } finally {
      setMoraUpdating(false);
    }
  }, [cargarMora, moraUpdating]);

  // Aplanado: { grupo, leccion } por cada lección
  const items = React.useMemo(() => {
    const out = [];
    for (const g of safeGruposReales) {
      if (!Array.isArray(g.lecciones)) continue;
      for (const l of g.lecciones) {
        if (!l || !l.fecha) continue;
        out.push({ grupo: g, leccion: l });
      }
    }
    return out;
  }, [safeGruposReales]);

  // ── DATOS PARA VISTA GANTT ──────────────────────────────────────
  // gruposOrdenados: filas, en el orden de presentación (vert.).
  // byGrupoDate: code → (iso → leccion[]) con lecciones ASC dentro del día.
  const gruposOrdenados = React.useMemo(() => {
    const arr = [...safeGruposReales];
    arr.sort((a, b) => {
      // 1. turnoOrden ASC (9am arriba, 6pm abajo)
      const ta = a.turnoOrden ?? 99;
      const tb = b.turnoOrden ?? 99;
      if (ta !== tb) return ta - tb;
      // 2. aperturas al final (globalmente)
      const ea = a.esApertura ? 1 : 0;
      const eb = b.esApertura ? 1 : 0;
      if (ea !== eb) return ea - eb;
      // 3. nivel DESC (I2 > I1 > B2 > B1)
      const na = TODOS_NIVEL_ORDEN[a.nivelId] || 0;
      const nb = TODOS_NIVEL_ORDEN[b.nivelId] || 0;
      if (na !== nb) return nb - na;
      // 4. leccionActual DESC (grupo más avanzado arriba)
      const la = a.leccionActual || 0;
      const lb = b.leccionActual || 0;
      if (la !== lb) return lb - la;
      // 5. estudiantes DESC
      const ea2 = a.estudiantes || 0;
      const eb2 = b.estudiantes || 0;
      if (ea2 !== eb2) return eb2 - ea2;
      // tiebreak determinístico
      return (a.code || '').localeCompare(b.code || '');
    });
    return arr;
  }, [safeGruposReales]);

  const byGrupoDate = React.useMemo(() => {
    // code → Map<iso, leccion[]>
    const out = new Map();
    for (const g of safeGruposReales) {
      const m = new Map();
      if (Array.isArray(g.lecciones)) {
        for (const l of g.lecciones) {
          if (!l?.fecha) continue;
          if (!m.has(l.fecha)) m.set(l.fecha, []);
          m.get(l.fecha).push(l);
        }
      }
      // Mismo grupo + mismo día: ASC por número de lección (5 antes que 6).
      for (const list of m.values()) {
        list.sort((a, b) => (a.leccion || 0) - (b.leccion || 0));
      }
      out.set(g.code, m);
    }
    return out;
  }, [safeGruposReales]);

  // ── DATOS PARA VISTA MES (apilado por día) ──────────────────────
  // Mantiene la lógica de bloques: cada grupo aporta sus lecciones del día
  // en orden natural; los grupos entre sí compiten por hora/nivel/lecMax.
  const byDate = React.useMemo(() => {
    const m = new Map();
    for (const it of items) {
      const k = it.leccion.fecha;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(it);
    }
    for (const [fecha, list] of m) {
      const porGrupo = new Map();
      for (const it of list) {
        const code = it.grupo.code;
        if (!porGrupo.has(code)) porGrupo.set(code, { grupo: it.grupo, lecciones: [] });
        porGrupo.get(code).lecciones.push(it.leccion);
      }
      for (const bloque of porGrupo.values()) {
        bloque.lecciones.sort((a, b) => (a.leccion || 0) - (b.leccion || 0));
        bloque.lecMax = Math.max(...bloque.lecciones.map(l => l.leccion || 0));
      }
      const bloques = Array.from(porGrupo.values());
      bloques.sort((A, B) => {
        const ga = A.grupo, gb = B.grupo;
        const ta = ga.turnoOrden ?? 99, tb = gb.turnoOrden ?? 99;
        if (ta !== tb) return ta - tb;
        const ea = ga.esApertura ? 1 : 0, eb = gb.esApertura ? 1 : 0;
        if (ea !== eb) return ea - eb;
        const na = TODOS_NIVEL_ORDEN[ga.nivelId] || 0;
        const nb = TODOS_NIVEL_ORDEN[gb.nivelId] || 0;
        if (na !== nb) return nb - na;
        if (A.lecMax !== B.lecMax) return B.lecMax - A.lecMax;
        return (gb.estudiantes || 0) - (ga.estudiantes || 0);
      });
      const flat = [];
      for (const b of bloques) {
        for (const l of b.lecciones) flat.push({ grupo: b.grupo, leccion: l });
      }
      m.set(fecha, flat);
    }
    return m;
  }, [items]);

  // Stats para header
  const stats = React.useMemo(() => {
    const totalGrupos = safeGruposReales.length;
    const aperturas = safeGruposReales.filter(g => g.esApertura).length;
    const estudiantes = safeGruposReales.reduce((s,g) => s + (g.estudiantes||0), 0);
    return { totalGrupos, aperturas, estudiantes };
  }, [safeGruposReales]);

  return (
    <div style={{ marginTop:14 }}>
      {/* Header con stats + switch + nav */}
      <div className="card" style={{
        padding:'14px 18px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        gap:14, flexWrap:'wrap', marginBottom:14,
      }}>
        {/* Stats */}
        <div style={{ display:'flex', gap:24, alignItems:'baseline' }}>
          <StatPill n={stats.totalGrupos} l="grupos activos" />
          <StatPill n={stats.estudiantes} l="estudiantes" />
          <StatPill n={stats.aperturas}   l="aperturas"     color={TODOS_APERTURA_COL} />
        </div>

        {/* Mora: estado + botón actualizar */}
        <div style={{
          display:'flex', alignItems:'center', gap:10, flexWrap:'wrap',
        }}>
          <div style={{
            display:'flex', flexDirection:'column', alignItems:'flex-end',
            lineHeight:1.25,
          }}>
            <span style={{
              fontSize:10, fontWeight:800, letterSpacing:'0.14em',
              textTransform:'uppercase',
              color: moraError ? 'var(--an-red, #C8302A)' : 'var(--ink-3)',
            }}>
              {moraError ? '⚠ ' + moraError : 'Mora'}
            </span>
            <span style={{
              fontSize:11, fontWeight:600,
              color: moraFecha ? 'var(--ink-2)' : 'var(--ink-3)',
              fontFamily: moraFecha ? 'var(--f-mono)' : 'inherit',
              fontStyle: moraFecha ? 'normal' : 'italic',
            }}>
              {moraFecha
                ? `actualizada ${tFmtMoraActualizado(moraFecha)}`
                : (moraLoading ? 'cargando…' : 'sin calcular — tocá Actualizar')}
            </span>
          </div>
          <button
            onClick={actualizarMora}
            disabled={moraUpdating}
            style={{
              padding:'7px 12px', display:'inline-flex', alignItems:'center', gap:6,
              border:'1.5px solid var(--line)',
              background: moraUpdating ? 'var(--bg-deep)' : 'var(--surface)',
              borderRadius:'var(--r-sm)',
              fontSize:12, fontWeight:700, color:'var(--ink-2)',
              cursor: moraUpdating ? 'wait' : 'pointer',
              fontFamily:'inherit',
              letterSpacing:'0.02em',
              opacity: moraUpdating ? 0.85 : 1,
            }}
            title="Recalcular mora de todos los grupos (tarda unos segundos)"
          >
            {moraUpdating ? (
              <React.Fragment>
                <span style={{
                  width:12, height:12, borderRadius:'50%',
                  border:'2px solid var(--line)', borderTopColor:'var(--an-navy)',
                  animation:'an-spin .8s linear infinite',
                  display:'inline-block',
                }} />
                Actualizando…
              </React.Fragment>
            ) : (
              <React.Fragment>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Actualizar mora
              </React.Fragment>
            )}
          </button>
        </div>

        {/* Switch Semana / Mes */}
        <div style={{
          display:'flex', padding:4, background:'var(--bg-deep)',
          borderRadius:'var(--r-md)', gap:2,
        }}>
          {[
            { id:'semana', label:'Semana' },
            { id:'mes',    label:'Mes' },
          ].map(opt => {
            const active = sub === opt.id;
            return (
              <button key={opt.id}
                onClick={() => setSub(opt.id)}
                style={{
                  padding:'7px 16px', borderRadius:'var(--r-sm)', border:'none',
                  background: active ? 'var(--surface)' : 'transparent',
                  boxShadow: active ? 'var(--sh-1)' : 'none',
                  cursor:'pointer', fontWeight:700, fontSize:12,
                  color: active ? 'var(--ink)' : 'var(--ink-3)',
                  letterSpacing:'0.04em', fontFamily:'inherit',
                  transition:'background .15s',
                }}>{opt.label}</button>
            );
          })}
        </div>
      </div>

      {sub === 'semana' ? (
        <VistaSemana
          weekStart={weekStart}
          setWeekStart={setWeekStart}
          gruposOrdenados={gruposOrdenados}
          byGrupoDate={byGrupoDate}
          moraMap={moraMap}
          onAbrir={setDetalle}
        />
      ) : (
        <VistaMes
          monthCursor={monthCursor}
          setMonthCursor={setMonthCursor}
          byDate={byDate}
          moraMap={moraMap}
          expandedDay={expandedDay}
          setExpandedDay={setExpandedDay}
          onAbrir={setDetalle}
        />
      )}

      {detalle && (
        <DetalleModal
          item={detalle}
          moraMap={moraMap}
          onNavigate={onNavigate}
          onCerrar={() => setDetalle(null)} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// VISTA SEMANA — Gantt: filas = grupos, columnas = días
// ─────────────────────────────────────────────────────────────────
function VistaSemana({ weekStart, setWeekStart, gruposOrdenados, byGrupoDate, moraMap, onAbrir }) {
  // Siempre Lun-Sáb (6 columnas). Si algún grupo tiene clase domingo igual
  // se ve porque su celda existe — pero rara vez ocurre en la academia.
  const days = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < 6; i++) arr.push(tAddDays(weekStart, i));
    return arr;
  }, [weekStart]);

  const today = React.useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  // Ancho mínimo de la grilla: 240px etiqueta + 6 × 140px = 1080. Si la pantalla
  // es más angosta, el contenedor hace scroll horizontal (mantiene la lectura).
  const COL_LABEL = 240;
  const COL_DAY_MIN = 140;
  const minWidth = COL_LABEL + 6 * COL_DAY_MIN;

  return (
    <div className="card" style={{ padding:0, overflow:'hidden' }}>
      {/* Nav semana */}
      <div style={{
        padding:'12px 18px',
        borderBottom:'1px solid var(--line)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        gap:14, flexWrap:'wrap',
      }}>
        <div style={{ display:'flex', gap:6 }}>
          <NavBtn onClick={() => setWeekStart(tAddDays(weekStart, -7))} ariaLabel="Semana anterior">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </NavBtn>
          <button
            onClick={() => setWeekStart(tMondayOf(new Date()))}
            style={{
              padding:'6px 14px', border:'1.5px solid var(--line)',
              background:'var(--surface)', borderRadius:'var(--r-sm)',
              fontSize:12, fontWeight:600, color:'var(--ink-2)',
              cursor:'pointer', fontFamily:'inherit',
            }}>Hoy</button>
          <NavBtn onClick={() => setWeekStart(tAddDays(weekStart, +7))} ariaLabel="Semana siguiente">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </NavBtn>
        </div>
        <div style={{
          fontFamily:'var(--f-sans)', fontSize:16, fontWeight:600,
          color:'var(--ink)', letterSpacing:'-0.01em',
        }}>
          {tFmtRangoSemana(weekStart)}
        </div>
        <div style={{ fontSize:11, color:'var(--ink-3)' }}>
          {gruposOrdenados.length} grupos · click en lección para detalle
        </div>
      </div>

      {/* Grilla Gantt */}
      <div style={{ overflowX:'auto' }}>
        <div style={{
          display:'grid',
          gridTemplateColumns:`${COL_LABEL}px repeat(6, minmax(${COL_DAY_MIN}px, 1fr))`,
          minWidth, background:'var(--line)', gap:1,
          borderTop:'1px solid var(--line)',
        }}>
          {/* ── Header row ───────────────────────────────────────── */}
          <div style={{
            background:'var(--bg-deep)',
            padding:'10px 14px',
            display:'flex', alignItems:'center',
            position:'sticky', left:0, zIndex:2,
          }}>
            <span style={{
              fontSize:10, fontWeight:800, letterSpacing:'0.16em',
              textTransform:'uppercase', color:'var(--ink-3)',
            }}>Grupo</span>
          </div>
          {days.map((d, i) => {
            const isToday = tSameDate(d, today);
            return (
              <div key={i} style={{
                background: isToday
                  ? 'color-mix(in srgb, var(--an-navy) 8%, var(--bg-deep))'
                  : 'var(--bg-deep)',
                padding:'10px 12px',
                display:'flex', alignItems:'baseline', justifyContent:'center', gap:8,
                borderBottom: isToday ? '2px solid var(--an-navy)' : 'none',
              }}>
                <span style={{
                  fontSize:10, fontWeight:800, letterSpacing:'0.14em',
                  textTransform:'uppercase',
                  color: isToday ? 'var(--an-navy)' : 'var(--ink-3)',
                }}>{TODOS_DIAS_LUN0[i]}</span>
                <span style={{
                  fontFamily:'var(--f-sans)',
                  fontSize:18, fontWeight:700,
                  color: isToday ? 'var(--an-navy)' : 'var(--ink)',
                  letterSpacing:'-0.02em', lineHeight:1,
                }}>{d.getDate()}</span>
              </div>
            );
          })}

          {/* ── Filas (un grupo por fila) ────────────────────────── */}
          {gruposOrdenados.length === 0 && (
            <div style={{
              gridColumn:'1 / -1',
              background:'var(--surface)', padding:'40px 18px',
              textAlign:'center', color:'var(--ink-3)', fontSize:13,
            }}>
              No hay grupos activos para mostrar.
            </div>
          )}
          {gruposOrdenados.map(g => {
            const color = g.esApertura
              ? TODOS_APERTURA_COL
              : (TODOS_NIVEL_COLOR[g.nivelId] || TODOS_APERTURA_COL);
            const cells = byGrupoDate.get(g.code) || new Map();
            const horaLbl = TODOS_HORA_LABEL[g.turnoOrden] || '';
            return (
              <React.Fragment key={g.code}>
                {/* Etiqueta del grupo */}
                <div style={{
                  background:'var(--surface)',
                  padding:'10px 12px 10px 14px',
                  borderLeft:`3px solid ${color}`,
                  display:'flex', alignItems:'center', gap:10, minWidth:0,
                  position:'sticky', left:0, zIndex:1,
                  opacity: g.esApertura ? 0.85 : 1,
                }}>
                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{
                      fontFamily:'var(--f-mono)', fontSize:12, fontWeight:700,
                      color:'var(--ink)', whiteSpace:'nowrap',
                      overflow:'hidden', textOverflow:'ellipsis',
                      letterSpacing:'0.01em',
                    }}>{g.code}</div>
                    <div style={{
                      fontSize:10, color:'var(--ink-3)', marginTop:2,
                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                    }}>{g.docente || '—'}</div>
                  </div>
                  <div style={{
                    display:'flex', flexDirection:'column', alignItems:'flex-end',
                    gap:3, flexShrink:0,
                  }}>
                    <span style={{
                      fontSize:9, fontWeight:800,
                      padding:'2px 6px', borderRadius:3,
                      background:`color-mix(in srgb, ${color} 14%, white)`,
                      color, letterSpacing:'0.08em',
                    }}>{g.esApertura ? 'APERT' : g.nivelId}</span>
                    <span style={{
                      fontSize:9, fontFamily:'var(--f-mono)',
                      color:'var(--ink-3)', fontWeight:700,
                    }}>
                      {horaLbl && <span style={{ marginRight:5 }}>{horaLbl}</span>}
                      {g.estudiantes || 0}e
                    </span>
                  </div>
                </div>

                {/* Celdas día por día */}
                {days.map((d, i) => {
                  const iso = tIsoOf(d);
                  const list = cells.get(iso) || [];
                  const isToday = tSameDate(d, today);
                  return (
                    <div key={i} style={{
                      background: isToday
                        ? 'color-mix(in srgb, var(--an-navy) 3%, var(--surface))'
                        : 'var(--surface)',
                      padding:'5px 5px',
                      display:'flex', flexDirection:'column', gap:3,
                      minHeight:54,
                    }}>
                      {list.map((lec, idx) => (
                        <PillLeccion
                          key={idx}
                          item={{ grupo:g, leccion:lec }}
                          moraMap={moraMap}
                          onClick={() => onAbrir({ grupo:g, leccion:lec })}
                          compact
                        />
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// VISTA MES
// ─────────────────────────────────────────────────────────────────
const MES_VISIBLE_PILLS = 3;

function VistaMes({ monthCursor, setMonthCursor, byDate, moraMap, expandedDay, setExpandedDay, onAbrir }) {
  const year  = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const today = React.useMemo(() => { const d=new Date(); d.setHours(0,0,0,0); return d; }, []);

  // Celdas (Lun-Dom)
  const celdas = React.useMemo(() => {
    const primero = new Date(year, month, 1);
    const ultimo  = new Date(year, month + 1, 0);
    const dowPrim = (primero.getDay() + 6) % 7; // Lun=0
    const total = Math.ceil((dowPrim + ultimo.getDate()) / 7) * 7;
    const out = [];
    for (let i = 0; i < total; i++) {
      const diaNum = i - dowPrim + 1;
      const dentro = diaNum >= 1 && diaNum <= ultimo.getDate();
      const fecha  = dentro ? new Date(year, month, diaNum) : null;
      const iso    = fecha ? tIsoOf(fecha) : null;
      out.push({ diaNum, dentro, fecha, iso });
    }
    return out;
  }, [year, month]);

  const navMes = (delta) => {
    const d = new Date(year, month + delta, 1);
    setMonthCursor(d);
  };

  return (
    <div className="card" style={{ padding:0, overflow:'hidden' }}>
      {/* Nav mes */}
      <div style={{
        padding:'12px 18px',
        borderBottom:'1px solid var(--line)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        gap:14, flexWrap:'wrap',
      }}>
        <div style={{ display:'flex', gap:6 }}>
          <NavBtn onClick={() => navMes(-1)} ariaLabel="Mes anterior">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </NavBtn>
          <button
            onClick={() => { const d=new Date(); d.setDate(1); d.setHours(0,0,0,0); setMonthCursor(d); }}
            style={{
              padding:'6px 14px', border:'1.5px solid var(--line)',
              background:'var(--surface)', borderRadius:'var(--r-sm)',
              fontSize:12, fontWeight:600, color:'var(--ink-2)',
              cursor:'pointer', fontFamily:'inherit',
            }}>Hoy</button>
          <NavBtn onClick={() => navMes(+1)} ariaLabel="Mes siguiente">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </NavBtn>
        </div>
        <div style={{
          fontFamily:'var(--f-sans)', fontSize:18, fontWeight:600,
          color:'var(--ink)', letterSpacing:'-0.02em',
        }}>
          {TODOS_MESES[month]} {year}
        </div>
        <div style={{ fontSize:11, color:'var(--ink-3)' }}>
          Click sobre una lección para ver detalle
        </div>
      </div>

      {/* DOW header */}
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(7, 1fr)',
        padding:'8px 8px', borderBottom:'1px solid var(--line)',
        background:'var(--surface-2)',
      }}>
        {TODOS_DIAS_LUN0.map((d, i) => (
          <div key={i} style={{
            textAlign:'center', fontSize:10, fontWeight:800,
            letterSpacing:'0.14em',
            color: i >= 5 ? 'var(--ink-3)' : 'var(--ink-2)',
          }}>{d}</div>
        ))}
      </div>

      {/* Celdas */}
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(7, 1fr)',
        gap:1, background:'var(--line)',
      }}>
        {celdas.map((c, i) => {
          if (!c.dentro) {
            return <div key={i} style={{ background:'var(--bg-deep)', minHeight:108 }} />;
          }
          const list = byDate.get(c.iso) || [];
          const isToday = tSameDate(c.fecha, today);
          const visibles = list.slice(0, MES_VISIBLE_PILLS);
          const restantes = list.length - visibles.length;

          return (
            <div key={i} style={{
              background: isToday ? 'color-mix(in srgb, var(--an-granate) 4%, var(--surface))' : 'var(--surface)',
              padding:'6px 6px 8px',
              minHeight:108,
              display:'flex', flexDirection:'column', gap:3,
            }}>
              <div style={{
                display:'flex', justifyContent:'space-between', alignItems:'baseline',
                marginBottom:2,
              }}>
                <span style={{
                  fontFamily:'var(--f-mono)', fontSize:11, fontWeight:700,
                  color: isToday ? 'var(--an-granate)' : 'var(--ink-2)',
                }}>{c.diaNum}</span>
                {list.length > 0 && (
                  <span style={{
                    fontSize:9, fontWeight:700, color:'var(--ink-3)',
                    fontFamily:'var(--f-mono)',
                  }}>{list.length}</span>
                )}
              </div>
              {visibles.map((it, idx) => (
                <PillLeccion key={idx} item={it} compact
                  moraMap={moraMap}
                  onClick={() => onAbrir(it)} />
              ))}
              {restantes > 0 && (
                <button
                  onClick={() => setExpandedDay(c.iso)}
                  style={{
                    padding:'3px 6px', background:'transparent',
                    border:'1px dashed var(--line-2, var(--line))',
                    borderRadius:4, fontSize:10, fontWeight:700,
                    color:'var(--ink-2)', cursor:'pointer', fontFamily:'inherit',
                    marginTop:1,
                  }}>
                  +{restantes} más
                </button>
              )}
            </div>
          );
        })}
      </div>

      {expandedDay && (
        <DiaExpandidoModal
          iso={expandedDay}
          items={byDate.get(expandedDay) || []}
          moraMap={moraMap}
          onCerrar={() => setExpandedDay(null)}
          onAbrir={(it) => { setExpandedDay(null); onAbrir(it); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PILL — una lección. Color por NIVEL (no por grupo); estilo soft.
// ─────────────────────────────────────────────────────────────────
function PillLeccion({ item, compact, moraMap, onClick }) {
  const { grupo, leccion } = item;
  const esApertura = !!grupo.esApertura;
  const esICAN     = leccion.tipo === 'ICAN';
  const esEval     = leccion.tipo === 'EVAL_ORAL' || leccion.tipo === 'EVAL_ESCRITO';
  const esPC       = leccion.tipo === 'PROGRESS_CHECK';
  const cerrada    = leccion.estado === 'CERRADA';
  const hoy        = leccion.estado === 'HOY';

  const color = esApertura
    ? TODOS_APERTURA_COL
    : (TODOS_NIVEL_COLOR[grupo.nivelId] || TODOS_APERTURA_COL);

  // Fondo MUY suave; el rail izquierdo del color es lo que pinta.
  const bg     = `color-mix(in srgb, ${color} 7%, white)`;
  const bgHoy  = `color-mix(in srgb, ${color} 14%, white)`;
  const border = `color-mix(in srgb, ${color} 28%, white)`;

  const horaLbl = TODOS_HORA_LABEL[grupo.turnoOrden] || '';

  // ── Mora del grupo ─────────────────────────────────────────────
  //   - moraMap null: aún no llegó → se muestra "…" como placeholder en mr
  //   - moraMap con el grupo: se muestra Nst · Nmr (ca puede ser 0; intencional)
  //   - moraMap sin el grupo: solo Nst desde grupo.estudiantes
  const moraInfo = moraMap && moraMap.get ? moraMap.get(grupo.code) : null;
  const ca = todosPickCa(grupo, moraInfo);
  const mr = todosPickMora(moraInfo);
  const mostrarMora = !esApertura;

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${grupo.code} · ${grupo.docente} · ${grupo.hora || ''}`}
      style={{
        display:'flex', alignItems:'center', gap: compact ? 5 : 7,
        padding: compact ? '3px 7px 3px 8px' : '5px 9px 5px 10px',
        background: hoy ? bgHoy : bg,
        borderTop:    `1px solid ${border}`,
        borderRight:  `1px solid ${border}`,
        borderBottom: `1px solid ${border}`,
        borderLeft:   `3px solid ${color}`,
        borderRadius: 4,
        cursor:'pointer', textAlign:'left', fontFamily:'inherit',
        color:'var(--ink)',
        opacity: cerrada ? 0.55 : (esApertura ? 0.85 : 1),
        overflow:'hidden', minWidth:0, lineHeight:1.2,
        transition:'background .12s, transform .12s',
        flexWrap:'wrap', rowGap:2,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = bgHoy; }}
      onMouseLeave={e => { e.currentTarget.style.background = hoy ? bgHoy : bg; }}
    >
      {horaLbl && (
        <span style={{
          fontFamily:'var(--f-mono)', fontSize: compact ? 10 : 11,
          fontWeight:800, color,
        }}>{horaLbl}</span>
      )}
      {esApertura ? (
        <span style={{
          fontSize: compact ? 9 : 10, fontWeight:800,
          color, letterSpacing:'0.08em', textTransform:'uppercase',
        }}>Apertura</span>
      ) : (
        <span style={{
          fontFamily:'var(--f-mono)', fontSize: compact ? 10 : 11,
          fontWeight:700, color:'var(--ink)',
        }}>
          L{String(leccion.leccion || '—').padStart(2,'0')}
        </span>
      )}
      {esICAN && <PillBadge color={color} label="I CAN" />}
      {esEval && <PillBadge color={color} label={leccion.tipo === 'EVAL_ORAL' ? 'ORAL' : 'ESCR'} />}
      {esPC && !esEval && <PillBadge color={color} label="PC" />}

      {/* CA · Mora */}
      {mostrarMora && (ca !== null || mr !== null) && (
        <span style={{
          marginLeft:4,
          fontFamily:'var(--f-mono)', fontSize: compact ? 9 : 10,
          fontWeight:700, color:'var(--ink-2)', whiteSpace:'nowrap',
          display:'inline-flex', alignItems:'center', gap:4,
        }}>
          <span style={{ opacity:0.55 }}>·</span>
          {ca !== null && (
            <span style={{ color:'var(--ink-2)' }}>{ca}st</span>
          )}
          {mr !== null ? (
            mr > 0 ? (
              <span style={{
                color: '#C8302A', // rojo de mora
                fontWeight:800,
              }}>{mr}mr</span>
            ) : (
              <span style={{ color:'var(--ink-3)', opacity:0.7 }}>0mr</span>
            )
          ) : (
            // moraMap aún null: placeholder
            <span style={{ color:'var(--ink-3)', opacity:0.5 }}>…</span>
          )}
        </span>
      )}

      {cerrada && (
        <span style={{
          marginLeft:'auto', fontSize:10, color, fontWeight:800,
        }}>✓</span>
      )}
    </button>
  );
}

function PillBadge({ color, label }) {
  return (
    <span style={{
      fontSize:8, fontWeight:800,
      padding:'1px 5px', borderRadius:3,
      background: color, color:'#FFFFFF',
      letterSpacing:'0.06em',
      whiteSpace:'nowrap',
    }}>{label}</span>
  );
}

// ─────────────────────────────────────────────────────────────────
// MODAL "+N más" — todas las lecciones de un día
// ─────────────────────────────────────────────────────────────────
function DiaExpandidoModal({ iso, items, moraMap, onCerrar, onAbrir }) {
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onCerrar]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
      style={{
        position:'fixed', inset:0, zIndex:1100,
        background:'rgba(20, 16, 12, 0.55)', backdropFilter:'blur(3px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:20,
      }}>
      <div style={{
        width:'100%', maxWidth:480,
        maxHeight:'calc(100vh - 48px)',
        background:'var(--surface)',
        borderRadius:'var(--r-lg, 12px)',
        boxShadow:'0 24px 64px rgba(0,0,0,0.4)',
        overflow:'hidden',
        display:'flex', flexDirection:'column',
      }}>
        <div style={{
          padding:'16px 22px 12px',
          borderBottom:'1px solid var(--line)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <div>
            <div style={{
              fontSize:10, fontWeight:800, letterSpacing:'0.16em',
              textTransform:'uppercase', color:'var(--ink-3)',
            }}>{items.length} lecciones</div>
            <div style={{
              fontFamily:'var(--f-sans)', fontSize:18, fontWeight:600,
              color:'var(--ink)', letterSpacing:'-0.015em',
            }}>
              {tFmtFechaLarga(iso)}
            </div>
          </div>
          <button onClick={onCerrar}
            style={{ background:'none', border:'none', cursor:'pointer',
                     padding:6, color:'var(--ink-3)', lineHeight:0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div style={{
          flex:1, overflowY:'auto', padding:'12px 18px 16px',
          display:'flex', flexDirection:'column', gap:6,
        }}>
          {items.map((it, i) => (
            <PillLeccion key={i} item={it}
              moraMap={moraMap}
              onClick={() => onAbrir(it)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MODAL DETALLE de una lección en Todos
// (no llama getLeccionDetalle — info viene del propio item)
// ─────────────────────────────────────────────────────────────────
function DetalleModal({ item, moraMap, onNavigate, onCerrar }) {
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onCerrar]);

  const { grupo, leccion } = item;
  const esApertura = !!grupo.esApertura;
  const tono = esApertura
    ? TODOS_APERTURA_COL
    : (TODOS_NIVEL_COLOR[grupo.nivelId] || TODOS_APERTURA_COL);
  const colorNivel = tono;

  // Mora del grupo (puede ser undefined si no está en el caché)
  const moraInfo = moraMap && moraMap.get ? moraMap.get(grupo.code) : null;
  const moraCa   = todosPickCa(grupo, moraInfo);
  const moraMr   = todosPickMora(moraInfo);

  const verEstudiantes = () => {
    if (!onNavigate) return;
    onNavigate('estudiantes', { grupo: grupo.code });
    onCerrar();
  };

  const estadoLabel =
    leccion.estado === 'CERRADA'    ? '✓ Clase dada' :
    leccion.estado === 'HOY'        ? '● Hoy' :
    leccion.estado === 'PROGRAMADA' ? '○ Programada' :
    leccion.estado === 'CALCULADA'  ? '○ Proyectada' :
    leccion.estado === 'FERIADO'    ? '🚫 Feriado' :
    leccion.estado || '—';

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
      style={{
        position:'fixed', inset:0, zIndex:1100,
        background:'rgba(20, 16, 12, 0.55)', backdropFilter:'blur(3px)',
        display:'flex', alignItems:'stretch', justifyContent:'flex-end',
      }}>
      <div style={{
        width:'100%', maxWidth:420, height:'100%',
        background:'var(--surface)',
        boxShadow:'-16px 0 48px rgba(0,0,0,0.32)',
        overflow:'hidden', display:'flex', flexDirection:'column',
        animation:'an-slide-in-right .18s ease-out',
      }}>
        <div style={{ height:5, background: colorNivel }} />
        <div style={{
          padding:'18px 22px 14px',
          borderBottom:'1px solid var(--line)',
          display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:14,
        }}>
          <div style={{ minWidth:0 }}>
            <div style={{
              fontSize:10, fontWeight:800, letterSpacing:'0.16em',
              textTransform:'uppercase', color:'var(--ink-3)', marginBottom:4,
            }}>
              {esApertura ? 'Apertura' : `Lección ${String(leccion.leccion || '—').padStart(2,'0')}`}
            </div>
            <div style={{
              fontFamily:'var(--f-sans)', fontSize:22, fontWeight:600,
              color:'var(--ink)', letterSpacing:'-0.02em', lineHeight:1.15,
            }}>
              {tFmtFechaLarga(leccion.fecha)}
            </div>
            <div style={{
              fontSize:12, color:'var(--ink-2)', marginTop:6,
              display:'flex', flexWrap:'wrap', gap:8, alignItems:'center',
            }}>
              <span style={{
                padding:'3px 9px', borderRadius:'var(--r-pill)',
                background:'color-mix(in srgb, ' + colorNivel + ' 12%, white)',
                color: colorNivel, fontWeight:800, fontSize:11,
                letterSpacing:'0.04em',
              }}>{estadoLabel}</span>
              {grupo.hora && (
                <span style={{ fontFamily:'var(--f-mono)', fontWeight:600 }}>
                  {grupo.hora}
                </span>
              )}
            </div>
          </div>
          <button onClick={onCerrar} aria-label="Cerrar"
            style={{ background:'none', border:'none', cursor:'pointer',
                     padding:6, color:'var(--ink-3)', lineHeight:0, flexShrink:0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div style={{
          flex:1, overflowY:'auto', padding:'16px 22px',
          display:'flex', flexDirection:'column', gap:14,
        }}>
          {/* Grupo card */}
          <div style={{
            padding:'14px 14px',
            background:'var(--bg-deep)',
            borderRadius:'var(--r-md)',
            border:'1px solid var(--line)',
          }}>
            <div style={{
              fontSize:10, fontWeight:700, letterSpacing:'0.14em',
              textTransform:'uppercase', color:'var(--ink-3)', marginBottom:6,
            }}>Grupo</div>
            <div style={{
              fontFamily:'var(--f-mono)', fontWeight:700, fontSize:15,
              color:'var(--ink)', letterSpacing:'0.02em',
              wordBreak:'break-all',
            }}>{grupo.code}</div>
            <div style={{
              fontSize:12, color:'var(--ink-2)', marginTop:8,
              display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 12px',
            }}>
              <Campo label="Docente" value={grupo.docente || '—'} />
              <Campo label="Nivel"   value={
                <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                  <span style={{ width:8, height:8, borderRadius:2, background: colorNivel }} />
                  {grupo.nivel || TODOS_NIVEL_LABEL[grupo.nivelId] || grupo.nivelId || '—'}
                </span>
              } mono={false} />
              <Campo label="Días"        value={grupo.dias || '—'} />
              <Campo label="Hora"        value={grupo.hora || '—'} mono />
              <Campo label="Programa"    value={grupo.programa || '—'} />
              <Campo label="Estudiantes"
                value={moraCa !== null && moraCa !== undefined ? moraCa : '—'}
                mono />
              <Campo label="Mora" value={
                moraMr === null || moraMr === undefined
                  ? <span style={{ color:'var(--ink-3)', fontStyle:'italic' }}>…</span>
                  : moraMr > 0
                    ? <span style={{ color:'#C8302A', fontWeight:800 }}>{moraMr}</span>
                    : <span style={{ color:'var(--ink-3)' }}>0</span>
              } mono />
            </div>
            {onNavigate && !esApertura && (
              <button
                onClick={verEstudiantes}
                style={{
                  marginTop:12, width:'100%',
                  padding:'9px 14px',
                  display:'inline-flex', alignItems:'center', justifyContent:'center', gap:7,
                  background:'var(--an-navy)', color:'#fff',
                  border:'none', borderRadius:'var(--r-sm)',
                  fontSize:12, fontWeight:700, letterSpacing:'0.04em',
                  cursor:'pointer', fontFamily:'inherit',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2.5"
                     strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Ver estudiantes de este grupo
              </button>
            )}
          </div>

          {/* Lección card */}
          <div style={{
            padding:'14px 14px',
            background:'var(--surface)',
            border:'1px solid var(--line)',
            borderRadius:'var(--r-md)',
          }}>
            <div style={{
              fontSize:10, fontWeight:700, letterSpacing:'0.14em',
              textTransform:'uppercase', color:'var(--ink-3)', marginBottom:6,
            }}>Lección</div>
            <div style={{
              fontFamily:'var(--f-sans)', fontSize:16, fontWeight:600,
              color:'var(--ink)', letterSpacing:'-0.01em',
            }}>
              {TODOS_TIPO_LBL[leccion.tipo] || leccion.tipo || '—'}
            </div>
            <div style={{
              fontSize:12, color:'var(--ink-2)', marginTop:8,
              display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 12px',
            }}>
              <Campo label="Número"  value={leccion.leccion ?? '—'} mono />
              <Campo label="Estado"  value={leccion.estado || '—'} />
              <Campo label="Fecha"   value={leccion.fecha} mono />
              {leccion.dia && <Campo label="Día" value={leccion.dia} />}
              {leccion.turno && <Campo label="Turno" value={leccion.turno} />}
            </div>
          </div>

          {esApertura && (
            <div style={{
              padding:'10px 12px',
              background:'color-mix(in srgb, #9F8F7D 8%, white)',
              border:'1px dashed #9F8F7D',
              borderRadius:'var(--r-sm)',
              fontSize:12, color:'#5C5147', lineHeight:1.5,
            }}>
              <b>Apertura</b>: este grupo todavía no tiene calendario completo
              generado. La fecha mostrada es proyectada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helpers UI
// ─────────────────────────────────────────────────────────────────
function StatPill({ n, l, color }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
      <span style={{
        fontFamily:'var(--f-sans)', fontSize:22, fontWeight:700,
        color: color || 'var(--ink)', letterSpacing:'-0.02em',
      }}>{n}</span>
      <span style={{ fontSize:11, color:'var(--ink-3)', fontWeight:600 }}>{l}</span>
    </div>
  );
}

function NavBtn({ onClick, ariaLabel, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        width:32, height:32, padding:0,
        border:'1.5px solid var(--line)',
        background:'var(--surface)', borderRadius:'var(--r-sm)',
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        color:'var(--ink-2)', cursor:'pointer',
      }}>
      {children}
    </button>
  );
}

function Campo({ label, value, mono }) {
  return (
    <div style={{ minWidth:0 }}>
      <div style={{
        fontSize:9, fontWeight:700, letterSpacing:'0.12em',
        textTransform:'uppercase', color:'var(--ink-3)',
      }}>{label}</div>
      <div style={{
        fontSize:13, fontWeight:600, color:'var(--ink)',
        fontFamily: mono ? 'var(--f-mono)' : 'inherit',
        marginTop:1,
        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
      }}>{value}</div>
    </div>
  );
}

// Animación slide-in (idempotente)
(function injectTodosKeyframes(){
  if (document.getElementById('an-todos-anim')) return;
  const el = document.createElement('style');
  el.id = 'an-todos-anim';
  el.textContent =
    '@keyframes an-slide-in-right{from{transform:translateX(20px);opacity:0}to{transform:translateX(0);opacity:1}}';
  document.head.appendChild(el);
})();

Object.assign(window, { TodosLosGruposView });


// Exponer para cronograma_grupo.jsx cuando los scripts se cargan con Babel en navegador.
window.TodosLosGruposView = TodosLosGruposView;
