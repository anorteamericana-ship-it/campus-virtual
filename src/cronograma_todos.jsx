/* global React */
// ─────────────────────────────────────────────────────────────────────────
// Vista "Todos los grupos" — solo admin / superadmin
// F98.4-Z6-AH · calendario superadmin: aperturas operativas B1 + selección por grupo
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
const TODOS_APERTURA_COL = '#F57C00';
const TODOS_NIVEL_BG = { B1:'#FFF4CE', B2:'#FFE2DE', I1:'#E1F0FA', I2:'#E3F3E0' };
const TODOS_APERTURA_BG = '#FFE0BF';
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
  APERTURA:'Apertura proyectada',
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

// CAL-GLOBAL-FIX-002:
// Normaliza cualquier etiqueta de nivel que venga del backend. Algunos endpoints
// devuelven B1/B2/I1/I2 y otros devuelven texto visible como "Básico II".
// Si se manda "BÁSICO II" a getFechasGrupo, el backend puede responder vacío;
// por eso convertimos siempre a la clave corta antes de ordenar o pedir fechas.
function todosNivelId(v) {
  const raw = todosText(v, 'B1');
  const up = raw
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().trim();
  if (['B1','BASICO I','BASICO 1','BASIC I','BASIC 1'].includes(up)) return 'B1';
  if (['B2','BASICO II','BASICO 2','BASIC II','BASIC 2'].includes(up)) return 'B2';
  if (['I1','INTERMEDIO I','INTERMEDIO 1','INTERMEDIATE I','INTERMEDIATE 1'].includes(up)) return 'I1';
  if (['I2','INTERMEDIO II','INTERMEDIO 2','INTERMEDIATE II','INTERMEDIATE 2'].includes(up)) return 'I2';
  return up || 'B1';
}

function todosNormDias(v) {
  return todosText(v)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/\s+/g, ' ').trim();
}

// Devuelve días JavaScript: 1=Lun ... 6=Sáb.
// Soporta códigos LM/KJ/LJ/SA y textos reales de GRUPOS como LUN/MIÉ y MAR/JUE.
function todosDiasApertura(grupo) {
  const raw = todosNormDias(grupo?.diasCode || grupo?.dias || '');
  const codeSeg = todosNormDias(String(grupo?.code || '').split('-')[1] || '').replace(/[0-9]/g, '');
  const v = `${raw} ${codeSeg}`;
  if (/\bSA\b|SAB/.test(v)) return [6];
  if (/\bLJ\b|LUN[^A-Z]*JUE|LUNES[^A-Z]*JUEVES|LUN[- A]JUE/.test(v)) return [1,2,3,4];
  if (/\bKJ\b|MAR[^A-Z]*JUE|MARTES[^A-Z]*JUEVES/.test(v)) return [2,4];
  if (/\bLM\b|LUN[^A-Z]*MIE|LUNES[^A-Z]*MIERCOLES/.test(v)) return [1,3];
  // Respaldo por código del grupo: LM18, KJ18, LM69, SA94, etc.
  if (codeSeg.startsWith('SA')) return [6];
  if (codeSeg.startsWith('LJ')) return [1,2,3,4];
  if (codeSeg.startsWith('KJ')) return [2,4];
  if (codeSeg.startsWith('LM')) return [1,3];
  return [];
}

function todosFechaApertura(grupo) {
  const directa = todosText(grupo?.aperturaFechaInicio || grupo?.fechaInicio || grupo?.fecha_inicio);
  if (directa) return tParseISO(directa);
  const primera = Array.isArray(grupo?.lecciones)
    ? grupo.lecciones.find(l => l && l.fecha && (grupo.esApertura || todosText(l.tipo).toUpperCase() === 'APERTURA'))
    : null;
  return primera?.fecha ? tParseISO(primera.fecha) : null;
}

// F98.4-Z6-AH: una apertura B1 se muestra en cada día de su horario desde
// la semana operativa actual hasta su fecha oficial de inicio. Así el Super
// Admin ve LUN/MIÉ o MAR/JUE en el calendario aun cuando el grupo no inició.
function todosCrearMarcadoresApertura(grupo) {
  if (!grupo?.esApertura) return [];
  const inicio = todosFechaApertura(grupo);
  const dias = todosDiasApertura(grupo);
  if (!inicio || !dias.length) return [];
  inicio.setHours(0,0,0,0);
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const desde = tMondayOf(hoy);
  if (inicio < desde) return [];
  const out = [];
  for (let d = new Date(desde); d <= inicio; d = tAddDays(d, 1)) {
    if (!dias.includes(d.getDay())) continue;
    out.push({
      leccion: 0,
      fecha: tIsoOf(d),
      tipo: 'APERTURA',
      estado: 'APERTURA',
      fecha_inicio: tIsoOf(inicio),
    });
  }
  return out;
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
  const nivelId = todosNivelId(g.nivelId || g.nivel || 'B1');
  const baseLecciones = Array.isArray(g.lecciones)
    ? g.lecciones.map(todosNormalizarLeccion).filter(Boolean)
    : [];
  // Compatible con backend AH y también con AG: si AG mandó un único
  // marcador en FECHA_INICIO, se usa como referencia y se expande aquí.
  const lecciones = g.esApertura ? todosCrearMarcadoresApertura({ ...g, lecciones:baseLecciones }) : baseLecciones;
  lecciones.sort((a,b) => String(a.fecha || '').localeCompare(String(b.fecha || '')) || ((a.leccion || 0) - (b.leccion || 0)));
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
async function todosPost(fn, payload = {}, timeoutMs = 20000) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const body = JSON.stringify({ fn, token, ...payload });
  const urls = [`${TODOS_SCRIPT_URL}?fn=${encodeURIComponent(fn)}`, TODOS_SCRIPT_URL];
  let lastError = null;
  for (let attempt = 0; attempt < urls.length; attempt += 1) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const res = await fetch(urls[attempt], {
        method:'POST', headers:{ 'Content-Type':'text/plain;charset=utf-8' }, body,
        cache:'no-store', redirect:'follow', signal:controller ? controller.signal : undefined,
      });
      const raw = await res.text();
      const text = String(raw || '').trim();
      if (!text) throw new Error(`El backend no devolvió contenido en ${fn}.`);
      if (/^<!doctype\s+html|^<html/i.test(text)) throw new Error('El backend devolvió HTML en lugar de JSON. Revisá la publicación vigente de Apps Script.');
      let data;
      try { data = JSON.parse(text); } catch (_) { throw new Error(`Respuesta inválida del backend en ${fn}.`); }
      if (!res.ok) throw new Error(data?.mensaje || data?.error || `HTTP ${res.status}`);
      return data;
    } catch (e) {
      lastError = e?.name === 'AbortError' ? new Error(`El backend tardó demasiado en responder (${fn}).`) : e;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  throw lastError || new Error(`No se pudo conectar con el backend en ${fn}.`);
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
  // Primera pintura y fuente única: getGruposActivos ya incluye las lecciones.
  const [gruposDetalle, setGruposDetalle] = React.useState(null);
  const safeGruposReales = React.useMemo(() => {
    const base = Array.isArray(gruposDetalle) ? gruposDetalle : (Array.isArray(gruposReales) ? gruposReales : []);
    return base.map(todosNormalizarGrupo).filter(Boolean);
  }, [gruposReales, gruposDetalle]);

  React.useEffect(() => {
    // F98.4-Z6-AN: getGruposActivos ya entrega las lecciones del nivel activo.
    // No se dispara una petición getFechasGrupo por cada grupo. Esto elimina
    // la ráfaga de llamadas que producía demora, cuotas y errores intermitentes.
    const base = (Array.isArray(gruposReales) ? gruposReales : [])
      .map(todosNormalizarGrupo)
      .filter(Boolean);
    setGruposDetalle(base);
  }, [gruposReales]);

  // ── HOOKS ARRIBA (sin returns condicionales antes) ────────────
  const [sub, setSub] = React.useState('semana'); // 'semana' | 'mes'
  const [weekStart, setWeekStart] = React.useState(() => tMondayOf(new Date()));
  const [monthCursor, setMonthCursor] = React.useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d;
  });
  const [detalle, setDetalle] = React.useState(null); // { grupo, leccion }
  const [selectedKey, setSelectedKey] = React.useState('');
  const [selectedGroupCode, setSelectedGroupCode] = React.useState('');
  const [expandedDay, setExpandedDay] = React.useState(null); // iso del día expandido en VistaMes

  // ── MORA (caché en backend) ───────────────────────────────────
  // moraMap: code → { ca, mora }. moraFecha: timestamp legible del caché.
  // Se carga después del Gantt para NO bloquear el render del calendario.
  const [moraMap,     setMoraMap]     = React.useState(null); // null = todavía no llegó
  const [moraFecha,   setMoraFecha]   = React.useState(null);
  const [moraLoading, setMoraLoading] = React.useState(false);
  const [moraUpdating, setMoraUpdating] = React.useState(false);
  const [moraError,   setMoraError]   = React.useState(null);
  const [moraUnsupported, setMoraUnsupported] = React.useState(false);

  const cargarMora = React.useCallback(() => {
    setMoraLoading(true); setMoraError(null); setMoraUnsupported(false);
    return fetch(`${TODOS_SCRIPT_URL}?fn=getMoraGrupos`)
      .then(r => r.json())
      .then(d => {
        if (d?.ok && d.grupos && typeof d.grupos === 'object') {
          const m = new Map();
          for (const code of Object.keys(d.grupos)) m.set(code, d.grupos[code]);
          setMoraMap(m);
          setMoraFecha(d.actualizado || null);
        } else {
          const err = d?.error || 'Sin caché de mora';
          if (/GET no reconocida|getMoraGrupos/i.test(err)) {
            // Este backend no trae endpoint de mora global. No debe verse como
            // error rojo ni bloquear el calendario.
            setMoraUnsupported(true);
            setMoraError(null);
          } else {
            setMoraError(err);
          }
          setMoraMap(null);
        }
      })
      .catch(e => {
        setMoraError('Error de red al leer mora');
        setMoraMap(null);
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
        <div style={{ display:'flex', gap:24, alignItems:'baseline', flexWrap:'wrap' }}>
          <StatPill n={stats.totalGrupos} l="grupos activos" />
          <StatPill n={stats.estudiantes} l="estudiantes" />
          <StatPill n={stats.aperturas}   l="aperturas"     color={TODOS_APERTURA_COL} />
        </div>

        {/* Mora: solo si el backend la soporta */}
        {!moraUnsupported && moraMap !== null && (
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
                fontSize:13, fontWeight:800, color:'var(--ink-2)',
                cursor: moraUpdating ? 'wait' : 'pointer',
                fontFamily:'inherit',
                letterSpacing:'0.02em',
                opacity: moraUpdating ? 0.65 : 1,
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
        )}

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
        <TodosVistaSemana
          weekStart={weekStart}
          setWeekStart={setWeekStart}
          gruposOrdenados={gruposOrdenados}
          byGrupoDate={byGrupoDate}
          moraMap={moraMap}
          selectedKey={selectedKey}
          selectedGroupCode={selectedGroupCode}
          onAbrir={(it) => {
            setSelectedKey(todosItemKey(it));
            setSelectedGroupCode(it?.grupo?.code || '');
            setDetalle(it);
          }}
        />
      ) : (
        <TodosVistaMes
          monthCursor={monthCursor}
          setMonthCursor={setMonthCursor}
          byDate={byDate}
          moraMap={moraMap}
          expandedDay={expandedDay}
          setExpandedDay={setExpandedDay}
          selectedKey={selectedKey}
          selectedGroupCode={selectedGroupCode}
          onAbrir={(it) => {
            setSelectedKey(todosItemKey(it));
            setSelectedGroupCode(it?.grupo?.code || '');
            setDetalle(it);
          }}
        />
      )}

      {detalle && (
        <DetalleModal
          item={detalle}
          moraMap={moraMap}
          onNavigate={onNavigate}
          onCerrar={() => {
            // La selección del grupo permanece visible, igual que en el calendario docente.
            setDetalle(null);
            setSelectedKey('');
          }} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// VISTA SEMANA — Gantt: filas = grupos, columnas = días
// ─────────────────────────────────────────────────────────────────
function TodosVistaSemana({ weekStart, setWeekStart, gruposOrdenados, byGrupoDate, moraMap, selectedKey, selectedGroupCode, onAbrir }) {
  // Siempre Lun-Sáb (6 columnas). Si algún grupo tiene clase domingo igual
  // se ve porque su celda existe — pero rara vez ocurre en la academia.
  const days = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < 6; i++) arr.push(tAddDays(weekStart, i));
    return arr;
  }, [weekStart]);

  const today = React.useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  // Ajustada para caber de lunes a sábado sin scroll horizontal en escritorio.
  const COL_LABEL = 'clamp(176px, 16vw, 220px)';

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
      <div>
        <div style={{
          display:'grid',
          gridTemplateColumns:`${COL_LABEL} repeat(6, minmax(0, 1fr))`,
          width:'100%', background:'var(--line)', gap:1,
          borderTop:'1px solid var(--line)',
        }}>
          {/* ── Header row ───────────────────────────────────────── */}
          <div style={{
            background:'var(--bg-deep)',
            padding:'10px 12px',
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
                  padding:'12px 12px 12px 14px',
                  borderLeft:`4px solid ${color}`,
                  display:'flex', alignItems:'center', gap:10, minWidth:0,
                  position:'sticky', left:0, zIndex:1,
                  opacity: 1,
                }}>
                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{
                      fontFamily:'var(--f-mono)', fontSize:13, fontWeight:800,
                      color:'var(--ink)', whiteSpace:'nowrap',
                      overflow:'hidden', textOverflow:'ellipsis',
                      letterSpacing:'0.01em',
                    }}>{g.code}</div>
                    <div style={{
                      fontSize:10.5, color:'var(--ink-3)', marginTop:3,
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
                      {g.estudiantes || 0} est
                    </span>
                    {selectedGroupCode === g.code && (
                      <span style={{
                        fontSize:7.5, fontWeight:900, color:'#FFF',
                        background:'var(--an-navy)', borderRadius:999,
                        padding:'2px 5px', letterSpacing:'0.04em',
                      }}>SELECCIONADO</span>
                    )}
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
                      padding:'7px 6px',
                      display:'flex', flexDirection:'column', gap:6,
                      minHeight:78,
                      justifyContent: list.length ? 'flex-start' : 'center',
                    }}>
                      {list.length ? list.map((lec, idx) => {
                        const item = { grupo:g, leccion:lec };
                        return (
                          <PillLeccion
                            key={idx}
                            item={item}
                            moraMap={moraMap}
                            selected={selectedGroupCode === g.code}
                            onClick={() => onAbrir(item)}
                            compact
                          />
                        );
                      }) : (
                        <div style={{
                          textAlign:'center', fontSize:11, fontWeight:700,
                          color:'var(--ink-3)', opacity:0.45,
                          letterSpacing:'0.04em',
                        }}>—</div>
                      )}
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
const MES_VISIBLE_PILLS = 4;

function TodosVistaMes({ monthCursor, setMonthCursor, byDate, moraMap, expandedDay, setExpandedDay, selectedKey, selectedGroupCode, onAbrir }) {
  const year  = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const today = React.useMemo(() => { const d=new Date(); d.setHours(0,0,0,0); return d; }, []);

  // Celdas (Lun-Sáb). Domingo se excluye porque la operación académica
  // de esta vista se trabaja de lunes a sábado.
  const celdas = React.useMemo(() => {
    const ultimo = new Date(year, month + 1, 0);
    const fechas = [];
    for (let dia = 1; dia <= ultimo.getDate(); dia++) {
      const fecha = new Date(year, month, dia);
      if (fecha.getDay() !== 0) fechas.push(fecha);
    }
    const primera = fechas[0] || new Date(year, month, 1);
    const dowPrim = (primera.getDay() + 6) % 7; // Lun=0 ... Sáb=5
    const total = Math.ceil((dowPrim + fechas.length) / 6) * 6;
    const out = [];
    for (let i = 0; i < total; i++) {
      const idx = i - dowPrim;
      const fecha = idx >= 0 && idx < fechas.length ? fechas[idx] : null;
      const iso = fecha ? tIsoOf(fecha) : null;
      out.push({ diaNum: fecha ? fecha.getDate() : null, dentro: !!fecha, fecha, iso });
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
          fontFamily:'var(--f-serif)', fontSize:24, fontWeight:500,
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
        display:'grid', gridTemplateColumns:'repeat(6, 1fr)',
        padding:'10px 10px', borderBottom:'1px solid var(--line)',
        background:'var(--surface-2)',
      }}>
        {TODOS_DIAS_LUN0.slice(0,6).map((d, i) => (
          <div key={i} style={{
            textAlign:'center', fontSize:10, fontWeight:800,
            letterSpacing:'0.14em',
            color: i >= 5 ? 'var(--ink-3)' : 'var(--ink-2)',
          }}>{d}</div>
        ))}
      </div>

      {/* Celdas */}
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(6, 1fr)',
        gap:1, background:'var(--line)',
      }}>
        {celdas.map((c, i) => {
          if (!c.dentro) {
            return <div key={i} style={{ background:'var(--bg-deep)', minHeight:148 }} />;
          }
          const list = byDate.get(c.iso) || [];
          const isToday = tSameDate(c.fecha, today);
          const visibles = list.slice(0, MES_VISIBLE_PILLS);
          const restantes = list.length - visibles.length;

          return (
            <div key={i} style={{
              background: isToday ? 'color-mix(in srgb, var(--an-granate) 4%, var(--surface))' : 'var(--surface)',
              padding:'9px 9px 10px',
              minHeight:148,
              display:'flex', flexDirection:'column', gap:6,
            }}>
              <div style={{
                display:'flex', justifyContent:'space-between', alignItems:'baseline',
                marginBottom:2,
              }}>
                <span style={{
                  fontFamily:'var(--f-mono)', fontSize:13, fontWeight:800,
                  color: isToday ? 'var(--an-granate)' : 'var(--ink-2)',
                }}>{c.diaNum}</span>
                {list.length > 0 && (
                  <span style={{
                    fontSize:10, fontWeight:800, color:'var(--ink-2)',
                    fontFamily:'var(--f-mono)',
                    padding:'2px 6px', borderRadius:'var(--r-pill)', background:'var(--bg-deep)',
                  }}>{list.length}</span>
                )}
              </div>
              {visibles.map((it, idx) => (
                <PillLeccion key={idx} item={it} compact
                  moraMap={moraMap}
                  selected={selectedGroupCode === it.grupo.code}
                  onClick={() => onAbrir(it)} />
              ))}
              {restantes > 0 && (
                <button
                  onClick={() => setExpandedDay(c.iso)}
                  style={{
                    padding:'5px 8px', background:'var(--surface)',
                    border:'1px dashed var(--line-2, var(--line))',
                    borderRadius:6, fontSize:11, fontWeight:800,
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
function todosShortCode(code) {
  const parts = String(code || '').split('-').filter(Boolean);
  if (parts.length >= 3) return `${parts[0]}-${parts[1]}-${parts[parts.length - 1]}`;
  return String(code || '—');
}

function todosItemKey(item) {
  if (!item || !item.grupo || !item.leccion) return '';
  return [item.grupo.code || '', item.leccion.fecha || '', item.leccion.tipo || '', item.leccion.leccion || 0].join('|');
}

function PillLeccion({ item, compact, moraMap, onClick, selected=false }) {
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

  // Fondo sólido pastel: evita que las clases cerradas (especialmente SA)
  // parezcan transparentes sobre la grilla.
  const bg     = esApertura ? TODOS_APERTURA_BG : (TODOS_NIVEL_BG[grupo.nivelId] || '#F7F3EE');
  const bgHoy  = `color-mix(in srgb, ${color} 24%, white)`;
  const bgSel  = `color-mix(in srgb, ${color} 34%, white)`;
  const border = `color-mix(in srgb, ${color} 58%, white)`;
  const horaLbl = TODOS_HORA_LABEL[grupo.turnoOrden] || '';
  const shortCode = todosShortCode(grupo.code);

  const moraInfo = moraMap && moraMap.get ? moraMap.get(grupo.code) : null;
  const ca = todosPickCa(grupo, moraInfo);
  const mr = todosPickMora(moraInfo);
  const mostrarMora = !esApertura && !!moraInfo;

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${grupo.code} · ${grupo.docente} · ${grupo.hora || ''}`}
      aria-pressed={selected}
      style={{
        display:'flex', flexDirection:'column', alignItems:'stretch', gap: compact ? 3 : 5,
        padding: compact ? '7px 8px' : '8px 10px',
        minHeight: compact ? 46 : 54,
        background: selected ? bgSel : (hoy ? bgHoy : bg),
        borderTop:    `1px solid ${border}`,
        borderRight:  `1px solid ${border}`,
        borderBottom: `1px solid ${border}`,
        borderLeft:   `4px solid ${color}`,
        borderRadius: 7,
        cursor:'pointer', textAlign:'left', fontFamily:'inherit',
        color:'var(--ink)',
        // F98.4-Z6-AH: ninguna lección se vuelve transparente.
        // El estado cerrado se distingue con ✓, no reduciendo legibilidad.
        opacity: 1,
        overflow:'hidden', minWidth:0, lineHeight:1.15,
        transition:'background .12s, transform .12s, box-shadow .12s',
        boxShadow: selected ? `0 0 0 2px ${color}77, 0 8px 16px rgba(0,0,0,0.08)` : (hoy ? `0 0 0 1px ${color}55` : 'none'),
      }}
      onMouseEnter={e => { e.currentTarget.style.background = selected ? bgSel : bgHoy; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = selected ? bgSel : (hoy ? bgHoy : bg); e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6, minWidth:0 }}>
        <span style={{
          minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          fontFamily:'var(--f-mono)', fontSize: compact ? 10.5 : 11.5,
          fontWeight:900, color:'var(--ink)', letterSpacing:'0.01em',
        }}>{shortCode}</span>
        <span style={{
          flexShrink:0, fontSize: compact ? 9 : 10, fontWeight:900,
          padding:'2px 6px', borderRadius:'var(--r-pill)',
          background:`color-mix(in srgb, ${color} 14%, white)`, color,
          fontFamily:'var(--f-mono)',
        }}>{esApertura ? 'B1' : (grupo.nivelId || '—')}</span>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
        {horaLbl && (
          <span style={{ fontFamily:'var(--f-mono)', fontSize: compact ? 9.5 : 10.5, fontWeight:900, color }}>
            {horaLbl}
          </span>
        )}
        {esApertura ? (
          <span style={{ fontSize: compact ? 9.5 : 10.5, fontWeight:900, color, letterSpacing:'0.08em', textTransform:'uppercase' }}>Apertura</span>
        ) : (
          <span style={{ fontFamily:'var(--f-mono)', fontSize: compact ? 10.5 : 11.5, fontWeight:900, color:'var(--ink)' }}>
            L{String(leccion.leccion || '—').padStart(2,'0')}
          </span>
        )}
        {esICAN && <PillBadge color={color} label="I CAN" />}
        {esEval && <PillBadge color={color} label={leccion.tipo === 'EVAL_ORAL' ? 'ORAL' : 'ESCR'} />}
        {esPC && !esEval && <PillBadge color={color} label="PC" />}
        {selected && <PillBadge color={'var(--an-navy)'} label={'SELECCIONADO'} />}
        {cerrada && <span style={{ marginLeft:selected ? 0 : 'auto', fontSize:11, color, fontWeight:900 }}>✓</span>}
      </div>

      {mostrarMora && (ca !== null || mr !== null) && (
        <div style={{
          display:'flex', alignItems:'center', gap:5, flexWrap:'wrap',
          fontFamily:'var(--f-mono)', fontSize: compact ? 9.5 : 10.5,
          fontWeight:800, color:'var(--ink-2)', whiteSpace:'nowrap', marginTop:1,
        }}>
          {ca !== null && <span style={{ color:'var(--ink-2)' }}>{ca} estudiantes</span>}
          {mr !== null ? (
            mr > 0
              ? <span style={{ color:'#C8302A', fontWeight:900 }}>{mr} mora</span>
              : <span style={{ color:'var(--ink-3)', opacity:0.75 }}>0 mora</span>
          ) : <span style={{ color:'var(--ink-3)', opacity:0.55 }}>mora …</span>}
        </div>
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
              fontFamily:'var(--f-serif)', fontSize:24, fontWeight:500,
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
