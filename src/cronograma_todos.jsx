/* global React */
// F98.4-Z6-CM · QA integral + apertura directa y conciliación ESTATUS/INTENTOS.
// ─────────────────────────────────────────────────────────────────────────
// Vista "Todos los grupos" — solo admin / superadmin
// F98.4-Z6-AP · calendario superadmin + mora por POST autenticado
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

function todosCategoriaGrupo(g) {
  const raw = todosText(g?.estadoCategoria || g?.estadoGrupo || g?.comentario).toUpperCase();
  if (g?.esApertura || raw === 'PROYECTADO') return 'PROYECTADO';
  if (raw === 'COMPLETADO' || raw === 'CERRADO') return 'COMPLETADO';
  return 'ACTIVO';
}

function todosFechaReferenciaGrupo(g) {
  return todosText(g?.fechaUltimaLeccion || g?.fechaInicioNivel || g?.aperturaFechaInicio);
}

function todosModalidadGrupo(g) {
  const directa = todosText(g?.modalidad);
  if (directa) return directa;
  const tipo = todosText(g?.tipoPeriodo).toUpperCase();
  if (tipo === 'B') return 'Bimestre';
  if (tipo === 'C') return 'Cuatrimestre';
  const code = todosText(g?.code).toUpperCase();
  return /-B\d-/.test(code) ? 'Bimestre' : (/-C\d-/.test(code) ? 'Cuatrimestre' : '');
}

function TodosLosGruposView({ gruposReales, onNavigate, grupoInicial, seguimientoInicial }) {
  const [gruposDetalle, setGruposDetalle] = React.useState(null);
  const [alcance, setAlcance] = React.useState('completo'); // completo | activos | completados
  const [sub, setSub] = React.useState('semana');
  const [weekStart, setWeekStart] = React.useState(() => tMondayOf(new Date()));
  const [monthCursor, setMonthCursor] = React.useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d;
  });
  const [detalle, setDetalle] = React.useState(null);
  const [selectedKey, setSelectedKey] = React.useState('');
  const [selectedGroupCode, setSelectedGroupCode] = React.useState('');
  const [expandedDay, setExpandedDay] = React.useState(null);
  const [seguimientoGrupo, setSeguimientoGrupo] = React.useState(null);
  const seguimientoInicialRef = React.useRef('');

  const gruposBase = React.useMemo(() => {
    const base = Array.isArray(gruposDetalle) ? gruposDetalle : (Array.isArray(gruposReales) ? gruposReales : []);
    return base.map(todosNormalizarGrupo).filter(Boolean);
  }, [gruposReales, gruposDetalle]);

  // CM: al navegar desde Panel Maestro se abre directamente el seguimiento
  // del grupo/nivel solicitado, sin desviar al panel general de estudiantes.
  React.useEffect(() => {
    const init = seguimientoInicial || (grupoInicial ? { grupo:grupoInicial } : null);
    const code = todosText(init?.grupo || grupoInicial);
    const level = todosNivelId(init?.nivel || '');
    if (!code || !seguimientoInicial || !gruposBase.length) return;
    const key = `${code}|${level || 'AUTO'}|${todosText(init?.codigo)}`;
    if (seguimientoInicialRef.current === key) return;
    const match = gruposBase.find(g => g.code === code && (!level || g.nivelId === level))
      || gruposBase.find(g => g.code === code);
    if (!match) return;
    seguimientoInicialRef.current = key;
    setAlcance(todosCategoriaGrupo(match) === 'COMPLETADO' ? 'completados' : 'activos');
    setSelectedGroupCode(match.code);
    setSeguimientoGrupo({ ...match, codigoInicial:todosText(init?.codigo) });
  }, [seguimientoInicial, grupoInicial, gruposBase]);

  React.useEffect(() => {
    if (!seguimientoInicial) seguimientoInicialRef.current = '';
  }, [seguimientoInicial]);

  React.useEffect(() => {
    const base = (Array.isArray(gruposReales) ? gruposReales : [])
      .map(todosNormalizarGrupo)
      .filter(Boolean);
    setGruposDetalle(base);
  }, [gruposReales]);

  const conteos = React.useMemo(() => {
    const activos = gruposBase.filter(g => todosCategoriaGrupo(g) === 'ACTIVO').length;
    const completados = gruposBase.filter(g => todosCategoriaGrupo(g) === 'COMPLETADO').length;
    const proyectados = gruposBase.filter(g => todosCategoriaGrupo(g) === 'PROYECTADO').length;
    return { total:gruposBase.length, activos, completados, proyectados };
  }, [gruposBase]);

  const safeGruposReales = React.useMemo(() => gruposBase.filter(g => {
    const cat = todosCategoriaGrupo(g);
    if (alcance === 'activos') return cat === 'ACTIVO';
    if (alcance === 'completados') return cat === 'COMPLETADO';
    return true;
  }), [gruposBase, alcance]);

  React.useEffect(() => {
    setDetalle(null);
    setSelectedKey('');
    setSelectedGroupCode('');
    setExpandedDay(null);
    if (alcance === 'completados') {
      const fechas = gruposBase.map(todosFechaReferenciaGrupo).filter(Boolean).sort();
      const ultima = fechas[fechas.length - 1];
      const d = tParseISO(ultima);
      if (d) {
        setWeekStart(tMondayOf(d));
        const m = new Date(d); m.setDate(1); setMonthCursor(m);
      }
    } else {
      const hoy = new Date(); hoy.setHours(0,0,0,0);
      setWeekStart(tMondayOf(hoy));
      const m = new Date(hoy); m.setDate(1); setMonthCursor(m);
    }
  }, [alcance]); // eslint-disable-line

  const [moraMap, setMoraMap] = React.useState(null);
  const [moraFecha, setMoraFecha] = React.useState(null);
  const [moraLoading, setMoraLoading] = React.useState(false);
  const [moraUpdating, setMoraUpdating] = React.useState(false);
  const [moraError, setMoraError] = React.useState(null);
  const [moraUnsupported, setMoraUnsupported] = React.useState(false);

  const cargarMora = React.useCallback(async () => {
    setMoraLoading(true); setMoraError(null); setMoraUnsupported(false);
    try {
      const d = await todosPost('getMoraGrupos', {}, 25000);
      if (d?.ok && d.grupos && typeof d.grupos === 'object') {
        const m = new Map();
        for (const code of Object.keys(d.grupos)) m.set(code, d.grupos[code]);
        setMoraMap(m);
        setMoraFecha(d.actualizado || null);
      } else {
        setMoraMap(null);
        setMoraError(d?.error || 'Sin caché de mora');
      }
    } catch (e) {
      setMoraMap(null);
      setMoraError(e?.message || 'Error de red al leer mora');
    } finally {
      setMoraLoading(false);
    }
  }, []);

  React.useEffect(() => { cargarMora(); }, [cargarMora]);

  const actualizarMora = React.useCallback(async () => {
    if (moraUpdating) return;
    setMoraUpdating(true); setMoraError(null);
    try {
      const d = await todosPost('actualizarMoraCache', {}, 120000);
      if (!d?.ok) throw new Error(d?.error || 'Falló actualización');
      await cargarMora();
    } catch (e) {
      setMoraError(e?.message || 'No se pudo actualizar la mora, reintentá');
    } finally {
      setMoraUpdating(false);
    }
  }, [cargarMora, moraUpdating]);

  const items = React.useMemo(() => {
    const out = [];
    for (const g of safeGruposReales) {
      if (!Array.isArray(g.lecciones)) continue;
      for (const l of g.lecciones) {
        if (!l || !l.fecha) continue;
        out.push({ grupo:g, leccion:l });
      }
    }
    return out;
  }, [safeGruposReales]);

  const gruposOrdenados = React.useMemo(() => {
    const arr = [...safeGruposReales];
    arr.sort((a,b) => {
      const ca = todosCategoriaGrupo(a), cb = todosCategoriaGrupo(b);
      const rank = { ACTIVO:1, PROYECTADO:2, COMPLETADO:3 };
      if ((rank[ca] || 9) !== (rank[cb] || 9)) return (rank[ca] || 9) - (rank[cb] || 9);
      if (ca === 'COMPLETADO' && cb === 'COMPLETADO') {
        const fa = todosFechaReferenciaGrupo(a), fb = todosFechaReferenciaGrupo(b);
        if (fa !== fb) return fb.localeCompare(fa);
      }
      const ta = a.turnoOrden ?? 99, tb = b.turnoOrden ?? 99;
      if (ta !== tb) return ta - tb;
      const na = TODOS_NIVEL_ORDEN[a.nivelId] || 0, nb = TODOS_NIVEL_ORDEN[b.nivelId] || 0;
      if (na !== nb) return nb - na;
      const la = a.leccionActual || 0, lb = b.leccionActual || 0;
      if (la !== lb) return lb - la;
      const ea = a.estudiantes || 0, eb = b.estudiantes || 0;
      if (ea !== eb) return eb - ea;
      return (a.code || '').localeCompare(b.code || '');
    });
    return arr;
  }, [safeGruposReales]);

  const byGrupoDate = React.useMemo(() => {
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
      for (const list of m.values()) list.sort((a,b) => (a.leccion || 0) - (b.leccion || 0));
      out.set(g.code, m);
    }
    return out;
  }, [safeGruposReales]);

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
        if (!porGrupo.has(code)) porGrupo.set(code, { grupo:it.grupo, lecciones:[] });
        porGrupo.get(code).lecciones.push(it.leccion);
      }
      for (const bloque of porGrupo.values()) {
        bloque.lecciones.sort((a,b) => (a.leccion || 0) - (b.leccion || 0));
        bloque.lecMax = Math.max(...bloque.lecciones.map(l => l.leccion || 0));
      }
      const bloques = Array.from(porGrupo.values());
      bloques.sort((A,B) => {
        const ga=A.grupo, gb=B.grupo;
        const ca=todosCategoriaGrupo(ga), cb=todosCategoriaGrupo(gb);
        const rank={ACTIVO:1,PROYECTADO:2,COMPLETADO:3};
        if ((rank[ca]||9)!==(rank[cb]||9)) return (rank[ca]||9)-(rank[cb]||9);
        const ta=ga.turnoOrden??99, tb=gb.turnoOrden??99;
        if (ta!==tb) return ta-tb;
        const na=TODOS_NIVEL_ORDEN[ga.nivelId]||0, nb=TODOS_NIVEL_ORDEN[gb.nivelId]||0;
        if (na!==nb) return nb-na;
        return B.lecMax-A.lecMax;
      });
      const flat=[];
      for (const b of bloques) for (const l of b.lecciones) flat.push({grupo:b.grupo, leccion:l});
      m.set(fecha, flat);
    }
    return m;
  }, [items]);

  const stats = React.useMemo(() => {
    const estudiantes = safeGruposReales
      .filter(g => todosCategoriaGrupo(g) !== 'COMPLETADO')
      .reduce((s,g) => s + (g.estudiantes || 0), 0);
    return { totalGrupos:safeGruposReales.length, estudiantes };
  }, [safeGruposReales]);

  const alcanceLabel = alcance === 'activos' ? 'grupos activos' : alcance === 'completados' ? 'grupos completados' : 'cronograma completo';

  return (
    <div style={{ marginTop:14 }}>
      <div className="card" style={{ padding:'14px 18px', marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div style={{ display:'flex', padding:4, background:'var(--bg-deep)', borderRadius:'var(--r-md)', gap:3, flexWrap:'wrap' }}>
            {[
              { id:'completo', label:'Cronograma completo', n:conteos.total },
              { id:'activos', label:'Grupos activos', n:conteos.activos },
              { id:'completados', label:'Grupos completados', n:conteos.completados },
            ].map(opt => {
              const active = alcance === opt.id;
              return <button key={opt.id} onClick={() => setAlcance(opt.id)} style={{
                padding:'8px 13px', borderRadius:'var(--r-sm)', border:'none',
                background:active ? 'var(--surface)' : 'transparent',
                boxShadow:active ? 'var(--sh-1)' : 'none', cursor:'pointer',
                fontWeight:800, fontSize:12, color:active ? 'var(--ink)' : 'var(--ink-3)',
                fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:7,
              }}>{opt.label}<span style={{fontFamily:'var(--f-mono)',fontSize:10,padding:'2px 6px',borderRadius:999,background:active?'var(--an-navy)':'var(--surface-2)',color:active?'#fff':'var(--ink-3)'}}>{opt.n}</span></button>;
            })}
          </div>
          <div style={{ display:'flex', padding:4, background:'var(--bg-deep)', borderRadius:'var(--r-md)', gap:2 }}>
            {[{id:'semana',label:'Semana'},{id:'mes',label:'Mes'}].map(opt => {
              const active=sub===opt.id;
              return <button key={opt.id} onClick={() => setSub(opt.id)} style={{
                padding:'7px 16px',borderRadius:'var(--r-sm)',border:'none',
                background:active?'var(--surface)':'transparent',boxShadow:active?'var(--sh-1)':'none',
                cursor:'pointer',fontWeight:700,fontSize:12,color:active?'var(--ink)':'var(--ink-3)',fontFamily:'inherit',
              }}>{opt.label}</button>;
            })}
          </div>
        </div>

        <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:14, flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:22, alignItems:'baseline', flexWrap:'wrap' }}>
            <StatPill n={stats.totalGrupos} l={alcanceLabel} />
            {alcance !== 'completados' && <StatPill n={stats.estudiantes} l="estudiantes activos" />}
            {alcance === 'completo' && conteos.proyectados > 0 && <StatPill n={conteos.proyectados} l="aperturas" color={TODOS_APERTURA_COL} />}
          </div>

          {alcance !== 'completados' && !moraUnsupported && moraMap !== null && (
            <div style={{ display:'flex', alignItems:'center', gap:9, flexWrap:'wrap' }}>
              <span style={{fontSize:10,fontWeight:700,color:moraError?'#C8302A':'var(--ink-3)'}}>
                {moraError ? `⚠ ${moraError}` : (moraFecha ? `Mora actualizada ${tFmtMoraActualizado(moraFecha)}` : (moraLoading ? 'Cargando mora…' : 'Mora sin calcular'))}
              </span>
              <button onClick={actualizarMora} disabled={moraUpdating} style={{
                padding:'6px 10px',border:'1px solid var(--line)',background:'var(--surface)',borderRadius:'var(--r-sm)',
                fontSize:11,fontWeight:800,color:'var(--ink-2)',cursor:moraUpdating?'wait':'pointer',fontFamily:'inherit',opacity:moraUpdating ? .65 : 1,
              }}>{moraUpdating?'Actualizando…':'Actualizar mora'}</button>
            </div>
          )}
        </div>
      </div>

      {sub === 'semana' ? (
        <TodosVistaSemana
          weekStart={weekStart}
          setWeekStart={setWeekStart}
          gruposOrdenados={gruposOrdenados}
          byGrupoDate={byGrupoDate}
          moraMap={moraMap}
          alcance={alcance}
          vacioLabel={alcanceLabel}
          selectedKey={selectedKey}
          selectedGroupCode={selectedGroupCode}
          onAbrir={(it) => { setSelectedKey(todosItemKey(it)); setSelectedGroupCode(it?.grupo?.code || ''); setDetalle(it); }}
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
          onAbrir={(it) => { setSelectedKey(todosItemKey(it)); setSelectedGroupCode(it?.grupo?.code || ''); setDetalle(it); }}
        />
      )}

      {detalle && (
        <DetalleModal
          item={detalle}
          moraMap={moraMap}
          onNavigate={onNavigate}
          onSeguimiento={(grupo) => {
            setSeguimientoGrupo(grupo);
            setDetalle(null);
            setSelectedKey('');
          }}
          onCerrar={() => { setDetalle(null); setSelectedKey(''); }}
        />
      )}

      {seguimientoGrupo && (
        <SeguimientoRosterModal
          grupo={seguimientoGrupo}
          onCerrar={() => setSeguimientoGrupo(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────
// VISTA SEMANA — Gantt: filas = grupos, columnas = días
// ─────────────────────────────────────────────────────────────────
function TodosVistaSemana({ weekStart, setWeekStart, gruposOrdenados, byGrupoDate, moraMap, alcance, vacioLabel, selectedKey, selectedGroupCode, onAbrir }) {
  // Siempre Lun-Sáb (6 columnas). Si algún grupo tiene clase domingo igual
  // se ve porque su celda existe — pero rara vez ocurre en la academia.
  const days = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < 6; i++) arr.push(tAddDays(weekStart, i));
    return arr;
  }, [weekStart]);

  const today = React.useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  const gruposVisibles = React.useMemo(() => {
    const fechas = new Set(days.map(tIsoOf));
    return gruposOrdenados.filter(g => {
      const cat = todosCategoriaGrupo(g);
      if (alcance === 'completados') return true;
      if (cat === 'ACTIVO' || cat === 'PROYECTADO') return true;
      const cells = byGrupoDate.get(g.code);
      if (!cells) return false;
      for (const iso of fechas) if ((cells.get(iso) || []).length) return true;
      return false;
    });
  }, [days, gruposOrdenados, byGrupoDate, alcance]);

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
          {gruposVisibles.length} grupos en esta semana
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
          {gruposVisibles.length === 0 && (
            <div style={{
              gridColumn:'1 / -1',
              background:'var(--surface)', padding:'40px 18px',
              textAlign:'center', color:'var(--ink-3)', fontSize:13,
            }}>
              No hay {vacioLabel || 'grupos'} para mostrar en esta vista.
            </div>
          )}
          {gruposVisibles.map(g => {
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
                    <div style={{ display:'flex', alignItems:'center', gap:7, minWidth:0 }}>
                      <span style={{
                        fontFamily:'var(--f-mono)', fontSize:12.5, fontWeight:800,
                        color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden',
                        textOverflow:'ellipsis', letterSpacing:'0.01em',
                      }}>{todosShortCode(g.code)}</span>
                      <span style={{
                        fontSize:8.5, fontWeight:900, padding:'2px 6px', borderRadius:999,
                        background:`color-mix(in srgb, ${color} 14%, white)`, color, letterSpacing:'.06em', flexShrink:0,
                      }}>{g.nivelId}</span>
                    </div>
                    <div style={{ fontSize:10.5, color:'var(--ink-2)', marginTop:4, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {g.dias || 'Horario no indicado'}{g.hora ? ` · ${g.hora}` : ''}
                    </div>
                    <div style={{ fontSize:9.5, color:'var(--ink-3)', marginTop:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {todosModalidadGrupo(g) || 'Modalidad no indicada'} · {g.docente || 'Docente por definir'}
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                    <span style={{
                      fontSize:7.5,fontWeight:900,padding:'2px 6px',borderRadius:999,
                      background:todosCategoriaGrupo(g)==='COMPLETADO'?'#ECE8E2':todosCategoriaGrupo(g)==='PROYECTADO'?TODOS_APERTURA_BG:'#E7F3EC',
                      color:todosCategoriaGrupo(g)==='COMPLETADO'?'#5E554C':todosCategoriaGrupo(g)==='PROYECTADO'?TODOS_APERTURA_COL:'#24633E',letterSpacing:'.05em',
                    }}>{todosCategoriaGrupo(g)==='COMPLETADO'?'CERRADO':todosCategoriaGrupo(g)==='PROYECTADO'?'APERTURA':'ACTIVO'}</span>
                    {todosCategoriaGrupo(g)==='COMPLETADO' ? (
                      <span style={{fontSize:8.5,fontFamily:'var(--f-mono)',color:'var(--ink-3)',fontWeight:700}}>{g.fechaUltimaLeccion || 'sin fecha'}</span>
                    ) : (
                      <span style={{fontSize:9,fontFamily:'var(--f-mono)',color:'var(--ink-3)',fontWeight:700}}>{g.estudiantes || 0} est</span>
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
function DetalleModal({ item, moraMap, onNavigate, onSeguimiento, onCerrar }) {
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
  const categoria = todosCategoriaGrupo(grupo);
  const esApertura = categoria === 'PROYECTADO';
  const esCompletado = categoria === 'COMPLETADO';
  const colorNivel = esApertura ? TODOS_APERTURA_COL : (TODOS_NIVEL_COLOR[grupo.nivelId] || TODOS_APERTURA_COL);
  const moraInfo = moraMap && moraMap.get ? moraMap.get(grupo.code) : null;
  const moraCa = todosPickCa(grupo, moraInfo);
  const moraMr = todosPickMora(moraInfo);

  const verEstudiantes = () => {
    if (!onNavigate) return;
    onNavigate('estudiantes', { grupo:grupo.code });
    onCerrar();
  };

  const verSeguimiento = () => {
    if (!onSeguimiento) return;
    onSeguimiento(grupo);
  };

  const estadoLabel =
    leccion.estado === 'CERRADA' ? 'Clase dada' :
    leccion.estado === 'HOY' ? 'Hoy' :
    leccion.estado === 'PROGRAMADA' ? 'Programada' :
    leccion.estado === 'CALCULADA' ? 'Proyectada' :
    leccion.estado === 'FERIADO' ? 'Feriado' :
    leccion.estado || 'Sin estado';

  const categoriaLabel = esCompletado ? 'Grupo cerrado' : esApertura ? 'Apertura proyectada' : 'Grupo activo';

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }} style={{
      position:'fixed',inset:0,zIndex:1100,background:'rgba(20,16,12,.55)',backdropFilter:'blur(3px)',
      display:'flex',alignItems:'stretch',justifyContent:'flex-end',
    }}>
      <div style={{
        width:'100%',maxWidth:390,height:'100%',background:'var(--surface)',boxShadow:'-16px 0 48px rgba(0,0,0,.32)',
        overflow:'hidden',display:'flex',flexDirection:'column',animation:'an-slide-in-right .18s ease-out',
      }}>
        <div style={{height:5,background:colorNivel}} />
        <div style={{padding:'18px 20px 15px',borderBottom:'1px solid var(--line)',display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:14}}>
          <div style={{minWidth:0}}>
            <div style={{fontSize:10,fontWeight:900,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:5}}>{categoriaLabel}</div>
            <div style={{fontFamily:'var(--f-sans)',fontSize:21,fontWeight:700,color:'var(--ink)',letterSpacing:'-.02em',lineHeight:1.15}}>{tFmtFechaLarga(leccion.fecha)}</div>
            <div style={{display:'flex',gap:7,alignItems:'center',flexWrap:'wrap',marginTop:8}}>
              <span style={{padding:'3px 8px',borderRadius:999,background:`color-mix(in srgb, ${colorNivel} 13%, white)`,color:colorNivel,fontSize:10,fontWeight:900}}>{grupo.nivelId} · {grupo.nivel || TODOS_NIVEL_LABEL[grupo.nivelId]}</span>
              <span style={{fontSize:11,fontWeight:800,color:'var(--ink-2)'}}>{estadoLabel}</span>
            </div>
          </div>
          <button onClick={onCerrar} aria-label="Cerrar" style={{background:'none',border:'none',cursor:'pointer',padding:6,color:'var(--ink-3)',lineHeight:0,flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
          <div style={{padding:'14px',background:'var(--bg-deep)',borderRadius:'var(--r-md)',border:'1px solid var(--line)'}}>
            <div style={{fontFamily:'var(--f-mono)',fontWeight:800,fontSize:14,color:'var(--ink)',wordBreak:'break-word'}}>{grupo.code}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px 12px',marginTop:12}}>
              <Campo label="Horario" value={`${grupo.dias || '—'}${grupo.hora ? ` · ${grupo.hora}` : ''}`} />
              <Campo label="Modalidad" value={todosModalidadGrupo(grupo) || '—'} />
              <Campo label="Docente" value={grupo.docente || '—'} />
              <Campo label={esCompletado ? 'Último nivel' : 'Estado'} value={esCompletado ? (grupo.nivel || grupo.nivelId) : categoriaLabel} />
              {esCompletado && <Campo label="Cierre" value={grupo.fechaUltimaLeccion || '—'} mono />}
              {!esCompletado && <Campo label="Estudiantes" value={moraCa !== null && moraCa !== undefined ? moraCa : (grupo.estudiantes || 0)} mono />}
              {!esCompletado && <Campo label="Mora" value={moraMr === null || moraMr === undefined ? '—' : moraMr} mono />}
              {grupo.periodoInicio && <Campo label="Periodo" value={`${grupo.periodoInicio}${grupo.anioInicio ? ` ${grupo.anioInicio}` : ''}`} />}
            </div>
            {!esApertura && (
              <div style={{display:'grid',gridTemplateColumns:onNavigate?'1fr 1fr':'1fr',gap:8,marginTop:12}}>
                {onNavigate && (
                  <button onClick={verEstudiantes} style={{
                    padding:'9px 12px',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:7,
                    background:'var(--surface)',color:'var(--an-navy)',border:'1.5px solid var(--an-navy)',borderRadius:'var(--r-sm)',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:'inherit',
                  }}>Consulta individual</button>
                )}
                <button onClick={verSeguimiento} style={{
                  padding:'9px 12px',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:7,
                  background:'var(--an-navy)',color:'#fff',border:'1.5px solid var(--an-navy)',borderRadius:'var(--r-sm)',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:'inherit',
                }}>Seguimiento del grupo</button>
              </div>
            )}
          </div>

          <div style={{padding:'14px',background:'var(--surface)',border:'1px solid var(--line)',borderRadius:'var(--r-md)'}}>
            <div style={{fontSize:10,fontWeight:800,letterSpacing:'.13em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:6}}>Lección</div>
            <div style={{fontFamily:'var(--f-sans)',fontSize:16,fontWeight:700,color:'var(--ink)'}}>{TODOS_TIPO_LBL[leccion.tipo] || leccion.tipo || 'Clase regular'}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px 12px',marginTop:11}}>
              <Campo label="Número" value={leccion.leccion || '—'} mono />
              <Campo label="Estado" value={estadoLabel} />
            </div>
          </div>

          {esApertura && grupo.aperturaFechaInicio && (
            <div style={{padding:'10px 12px',background:TODOS_APERTURA_BG,border:`1px solid color-mix(in srgb, ${TODOS_APERTURA_COL} 35%, white)`,borderRadius:'var(--r-sm)',fontSize:12,color:'#6F4300'}}>
              Inicio previsto: <strong>{grupo.aperturaFechaInicio}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────
// SEGUIMIENTO DE GRUPO · FASE 1
// Roster conciliado. Todavía no calcula riesgo de deserción: primero valida
// que ninguna persona falte y que cada vínculo tenga una fuente explicable.
// ─────────────────────────────────────────────────────────────────
const CF_CLASS_LABEL = {
  CURSANDO:'Cursando',
  PROYECTADO:'Proyectado',
  HISTORICO:'Histórico',
  TRASLADO_PENDIENTE:'Traslado pendiente',
  LEGACY_DATOS:'Solo en DATOS',
  OPERATIVO_HUERFANO:'Registro huérfano',
};
const CF_SOURCE_LABEL = {
  ESTATUS_EXACTO:'ESTATUS',
  INTENTO_EXACTO:'Intento',
  DATOS_GRUPO:'DATOS',
  ASISTENCIA:'Asistencia',
  ASISTENCIA_FUTURA:'Asistencia futura excluida',
  NOTAS:'Notas',
  SEGUIMIENTO:'Seguimiento',
  TRASLADO_ENTRADA:'Traslado entrada',
  TRASLADO_SALIDA:'Traslado salida',
};
function cfIssueColor(severity) {
  if (severity === 'CRITICO') return { bg:'#FDE7E5', fg:'#9B1C16', bd:'#F4B9B4' };
  if (severity === 'ALERTA') return { bg:'#FFF3D6', fg:'#7B4B00', bd:'#E9CF93' };
  return { bg:'#EAF2F8', fg:'#274E68', bd:'#C7DAE7' };
}
function cfClassColor(name) {
  if (name === 'CURSANDO') return { bg:'#E7F3EC', fg:'#24633E' };
  if (name === 'PROYECTADO') return { bg:'#F3EEDB', fg:'#67591F' };
  if (name === 'HISTORICO') return { bg:'#ECE8E2', fg:'#5E554C' };
  if (name === 'TRASLADO_PENDIENTE') return { bg:'#E8EFFB', fg:'#294F86' };
  if (name === 'LEGACY_DATOS') return { bg:'#FFF3D6', fg:'#7B4B00' };
  return { bg:'#FDE7E5', fg:'#9B1C16' };
}
function cfStatusLabel(v) {
  const map = { CA:'Cursando', APR:'Aprobado', REP:'Reprobado', CNV:'Convalidado', PE:'Proyectado', RI:'Retiro', RJ:'Rechazado', TRASLADADO:'Trasladado' };
  return map[v] || v || 'Sin estatus';
}

const CH_PRIORITY_LABEL = {
  ATENCION_INMEDIATA:'Atención inmediata',
  VIGILAR:'Vigilar',
  SIN_EVIDENCIA:'Sin evidencia suficiente',
  ESTABLE:'Estable con evidencia',
  PRIORIDAD:'Prioridad de rescate',
};
function chPriorityColor(name) {
  if (name === 'ATENCION_INMEDIATA') return { bg:'#FDE7E5', fg:'#9B1C16', bd:'#F4B9B4' };
  if (name === 'VIGILAR' || name === 'PRIORIDAD') return { bg:'#FFF3D6', fg:'#7B4B00', bd:'#E9CF93' };
  if (name === 'ESTABLE') return { bg:'#E7F3EC', fg:'#24633E', bd:'#BFDCCB' };
  return { bg:'#EAF2F8', fg:'#274E68', bd:'#C7DAE7' };
}
function chPct(v) {
  return v === null || v === undefined ? '—' : `${v}%`;
}
function chSignalText(signal) {
  return signal?.message || signal?.code || 'Señal sin detalle';
}
function SeguimientoAlertasPanel({ data, error }) {
  const [filter, setFilter] = React.useState('todos');
  if (error) {
    return <div style={{marginBottom:14,padding:'11px 13px',border:'1px solid #E9CF93',background:'#FFF3D6',borderRadius:'var(--r-md)',color:'#7B4B00',fontSize:11.5,fontWeight:700}}>
      La Fase 2 no pudo calcularse: {error}. El roster conciliado de Fase 1 permanece disponible abajo.
    </div>;
  }
  if (!data) return null;
  const r=data.resumen||{};
  const c=data.cobertura||{};
  const alerts=Array.isArray(data.alertas_estudiantes)?data.alertas_estudiantes:[];
  const groupAlerts=Array.isArray(data.alertas_grupo)?data.alertas_grupo:[];
  const rescue=Array.isArray(data.rescate)?data.rescate:[];
  const visibles=alerts.filter((x)=>filter==='todos'||x.prioridad===filter);
  const counts={
    ATENCION_INMEDIATA:r.atencion_inmediata||0,
    VIGILAR:r.vigilar||0,
    SIN_EVIDENCIA:r.sin_evidencia||0,
    ESTABLE:r.estables||0,
  };
  return (
    <section style={{marginBottom:18}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:12,flexWrap:'wrap',marginBottom:9}}>
        <div>
          <div style={{fontSize:10,fontWeight:900,letterSpacing:'.13em',textTransform:'uppercase',color:'var(--an-burgundy)'}}>Fase 2 · Alertas con evidencia</div>
          <div style={{fontSize:11,color:'var(--ink-3)',marginTop:3}}>Riesgo individual, faltantes operativos y rescate se muestran por separado. Este panel no escribe en las hojas.</div>
        </div>
        <div style={{fontSize:10,color:'var(--ink-3)'}}>Corte {c.fecha_corte||'—'} · {data.cache?.hit?'caché':'lectura renovada'}</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:9}}>
        {[
          ['Atención inmediata',r.atencion_inmediata||0,'Señal crítica comprobada','#9B1C16'],
          ['Vigilar',r.vigilar||0,'Señal preventiva','#7B4B00'],
          ['Sin evidencia',r.sin_evidencia||0,'No acusar riesgo','#274E68'],
          ['Estables',r.estables||0,'Con evidencia académica','#24633E'],
          ['Rescate',r.rescate||0,`${r.rescate_inmediato||0} prioritarios`,'var(--an-burgundy)'],
          ['Alertas del grupo',r.alertas_grupo||0,`${r.alertas_grupo_criticas||0} críticas`,'var(--ink)'],
        ].map(([label,value,sub,color])=><div key={label} style={{padding:'11px 12px',border:'1px solid var(--line)',borderRadius:'var(--r-md)',background:'var(--bg-deep)'}}>
          <div style={{fontSize:9,fontWeight:900,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--ink-3)'}}>{label}</div>
          <div style={{fontFamily:'var(--f-sans)',fontSize:24,fontWeight:760,color,marginTop:2}}>{value}</div>
          <div style={{fontSize:9.5,color:'var(--ink-3)'}}>{sub}</div>
        </div>)}
      </div>

      <div style={{marginTop:9,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:9}}>
        <div style={{padding:'10px 12px',border:'1px solid var(--line)',borderRadius:'var(--r-sm)',background:'var(--surface)'}}>
          <div style={{fontSize:9,fontWeight:900,textTransform:'uppercase',letterSpacing:'.1em',color:'var(--ink-3)'}}>Asistencia del grupo</div>
          <div style={{fontSize:12,fontWeight:800,color:'var(--ink)',marginTop:4}}>{c.lecciones_con_asistencia||0} de {c.lecciones_ocurridas||0} lecciones · {chPct(c.cobertura_asistencia_pct)}</div>
          <div style={{fontSize:10,color:'var(--ink-3)',marginTop:2}}>Se excluyeron {c.registros_asistencia_futuros||0} registros futuros.</div>
        </div>
        <div style={{padding:'10px 12px',border:'1px solid var(--line)',borderRadius:'var(--r-sm)',background:'var(--surface)'}}>
          <div style={{fontSize:9,fontWeight:900,textTransform:'uppercase',letterSpacing:'.1em',color:'var(--ink-3)'}}>Notas esperadas</div>
          <div style={{fontSize:12,fontWeight:800,color:'var(--ink)',marginTop:4}}>{c.notas_registradas||0} de {c.notas_esperadas||0} componentes · {chPct(c.cobertura_notas_pct)}</div>
          <div style={{fontSize:10,color:'var(--ink-3)',marginTop:2}}>Avance calendario: lección {c.ultima_leccion_ocurrida||0}.</div>
        </div>
        <div style={{padding:'10px 12px',border:'1px solid var(--line)',borderRadius:'var(--r-sm)',background:'var(--surface)'}}>
          <div style={{fontSize:9,fontWeight:900,textTransform:'uppercase',letterSpacing:'.1em',color:'var(--ink-3)'}}>Regla de seguridad</div>
          <div style={{fontSize:10.5,fontWeight:700,color:'var(--ink-2)',marginTop:4,lineHeight:1.4}}>La asistencia individual solo se evalúa con cobertura suficiente. Falta de datos no equivale a ausencia.</div>
        </div>
      </div>

      {groupAlerts.length>0&&<div style={{marginTop:9,display:'grid',gap:6}}>
        {groupAlerts.map((it,idx)=>{const col=cfIssueColor(it.severity);return <div key={`${it.code}-${idx}`} style={{padding:'8px 10px',border:`1px solid ${col.bd}`,background:col.bg,borderRadius:'var(--r-sm)',color:col.fg,fontSize:10.8,fontWeight:750}}>
          <span style={{fontSize:9,letterSpacing:'.08em',textTransform:'uppercase',marginRight:7}}>{it.severity}</span>{it.message}
        </div>;})}
      </div>}

      <div style={{marginTop:12,display:'flex',gap:5,flexWrap:'wrap'}}>
        {[
          ['todos','Todos',alerts.length],
          ['ATENCION_INMEDIATA','Atención inmediata',counts.ATENCION_INMEDIATA],
          ['VIGILAR','Vigilar',counts.VIGILAR],
          ['SIN_EVIDENCIA','Sin evidencia',counts.SIN_EVIDENCIA],
          ['ESTABLE','Estables',counts.ESTABLE],
        ].map(([id,label,n])=>{const active=filter===id;return <button key={id} onClick={()=>setFilter(id)} style={{padding:'6px 9px',borderRadius:999,border:active?'1px solid var(--an-burgundy)':'1px solid var(--line)',background:active?'var(--an-burgundy)':'var(--surface)',color:active?'#fff':'var(--ink-2)',fontSize:10.5,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>{label} · {n}</button>;})}
      </div>

      <div style={{marginTop:8,border:'1px solid var(--line)',borderRadius:'var(--r-md)',overflow:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:980,fontSize:11}}>
          <thead><tr style={{background:'var(--bg-deep)',textAlign:'left'}}>
            {['Estudiante','Prioridad','Evidencia disponible','Señales','Acción sugerida'].map(h=><th key={h} style={{padding:'9px 10px',fontSize:8.8,fontWeight:900,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--ink-3)',borderBottom:'1px solid var(--line)'}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {visibles.map((e)=>{const pc=chPriorityColor(e.prioridad);const signals=Array.isArray(e.signals)?e.signals:[];return <tr key={e.codigo} style={{borderBottom:'1px solid var(--line)',verticalAlign:'top'}}>
              <td style={{padding:'10px'}}><div style={{fontWeight:800,color:'var(--ink)'}}>{e.nombre||'(sin nombre)'}</div><div style={{fontFamily:'var(--f-mono)',fontSize:9.5,color:'var(--ink-3)',marginTop:2}}>{e.codigo}{e.cedula?` · ${e.cedula}`:''}</div><div style={{fontSize:9.5,color:'var(--ink-3)',marginTop:2}}>{e.telefono||e.telefono_2||e.correo||'Sin contacto'}{e.convenio?` · ${e.convenio}`:''}</div></td>
              <td style={{padding:'10px'}}><span style={{display:'inline-flex',padding:'3px 7px',borderRadius:999,background:pc.bg,color:pc.fg,border:`1px solid ${pc.bd}`,fontSize:9.2,fontWeight:900}}>{CH_PRIORITY_LABEL[e.prioridad]||e.prioridad}</span></td>
              <td style={{padding:'10px',minWidth:190}}>
                <div style={{fontSize:10,fontWeight:750,color:e.asistencia?.evaluable?'var(--ink-2)':'var(--ink-3)'}}>Asistencia: {e.asistencia?.evaluable?`${chPct(e.asistencia?.pct)} · ${e.asistencia?.marcadas||0} marcas`:'no evaluable'}</div>
                <div style={{fontSize:10,color:'var(--ink-3)',marginTop:3}}>Notas: {e.notas?.total||0}{e.notas?.promedio!==null&&e.notas?.promedio!==undefined?` · promedio ${e.notas.promedio}`:''}</div>
                {e.mora&&<div style={{fontSize:9.5,color:e.mora.estado==='SI'?'#9B1C16':'var(--ink-3)',marginTop:3}}>Mora: {e.mora.estado||'—'} · {e.mora.anio||''}/{e.mora.periodo||''}</div>}
                {e.conape&&<div style={{fontSize:9.5,color:'var(--ink-3)',marginTop:2}}>CONAPE: {e.conape.estado||'sin estado'}{e.conape.desembolso?` · desembolso ${e.conape.desembolso}`:''}</div>}
              </td>
              <td style={{padding:'10px',maxWidth:310}}>{signals.length===0?<span style={{fontSize:10,color:e.prioridad==='SIN_EVIDENCIA'?'#274E68':'#24633E',fontWeight:800}}>{e.prioridad==='SIN_EVIDENCIA'?'No hay evidencia académica suficiente':'Sin señal negativa detectada'}</span>:<div style={{display:'grid',gap:4}}>{signals.map((it,idx)=>{const col=cfIssueColor(it.severity);return <div key={`${it.code}-${idx}`} title={it.code} style={{padding:'4px 6px',border:`1px solid ${col.bd}`,background:col.bg,borderRadius:6,color:col.fg,fontSize:9.4,fontWeight:700}}>{chSignalText(it)}</div>;})}</div>}</td>
              <td style={{padding:'10px',fontSize:10.2,fontWeight:700,color:'var(--ink-2)',lineHeight:1.4,minWidth:210}}>{e.accion}</td>
            </tr>;})}
            {visibles.length===0&&<tr><td colSpan="5" style={{padding:28,textAlign:'center',color:'var(--ink-3)'}}>No hay estudiantes en este filtro.</td></tr>}
          </tbody>
        </table>
      </div>

      {rescue.length>0&&<div style={{marginTop:12,padding:'12px',border:'1px solid var(--line)',borderRadius:'var(--r-md)',background:'var(--bg-deep)'}}>
        <div style={{fontSize:10,fontWeight:900,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--an-burgundy)'}}>Cola de rescate · {rescue.length}</div>
        <div style={{fontSize:10,color:'var(--ink-3)',marginTop:3}}>Continuidad, repetición o reingreso pendiente. Ningún caso crea CA ni promueve automáticamente.</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))',gap:7,marginTop:8}}>
          {rescue.map((e)=>{const pc=chPriorityColor(e.prioridad);return <div key={`${e.codigo}-${e.tipo}`} style={{padding:'9px 10px',background:'var(--surface)',border:'1px solid var(--line)',borderRadius:'var(--r-sm)'}}>
            <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'flex-start'}}><div><div style={{fontWeight:800,color:'var(--ink)',fontSize:11}}>{e.nombre||e.codigo}</div><div style={{fontFamily:'var(--f-mono)',fontSize:9.3,color:'var(--ink-3)',marginTop:2}}>{e.codigo} · {e.nivel_origen} → {e.nivel_objetivo}</div></div><span style={{padding:'2px 6px',borderRadius:999,background:pc.bg,color:pc.fg,border:`1px solid ${pc.bd}`,fontSize:8.5,fontWeight:900}}>{CH_PRIORITY_LABEL[e.prioridad]||e.prioridad}</span></div>
            <div style={{fontSize:9.8,color:'var(--ink-2)',marginTop:6,lineHeight:1.35}}>{e.accion}</div>
          </div>;})}
        </div>
      </div>}
    </section>
  );
}


const CI_CATEGORY_LABEL = {
  ASISTENCIA:'Asistencia', RENDIMIENTO:'Rendimiento', EVALUACIONES:'Evaluaciones', MORA:'Mora',
  CONAPE:'CONAPE', CONTINUIDAD:'Continuidad', REINGRESO:'Reingreso', CAMBIO_GRUPO:'Cambio de grupo',
  DATOS_CONTACTO:'Datos de contacto', ADMINISTRATIVO:'Administrativo', GENERAL:'General',
};
const CI_CHANNEL_LABEL = {
  WHATSAPP:'WhatsApp', LLAMADA:'Llamada', CORREO:'Correo', REUNION:'Reunión',
  INTERNO:'Registro interno', SIN_CONTACTO:'Sin contacto disponible',
};
const CI_RESULT_LABEL = {
  CONTACTADO:'Contactado', SIN_RESPUESTA:'Sin respuesta', COMPROMISO:'Compromiso acordado',
  REPROGRAMAR:'Reprogramar contacto', RESUELTO:'Situación resuelta', ESCALAR:'Escalar a otra área',
  NUMERO_INVALIDO:'Número inválido', INFORMACION_ENVIADA:'Información enviada',
  PENDIENTE_VALIDACION:'Pendiente de validación',
};
const CI_STATE_LABEL = {
  ABIERTO:'Abierto', EN_SEGUIMIENTO:'En seguimiento', ESPERANDO_ESTUDIANTE:'Esperando estudiante',
  ESPERANDO_INSTITUCION:'Esperando institución', RESUELTO:'Resuelto',
  CERRADO_SIN_RESPUESTA:'Cerrado sin respuesta', REGISTRO:'Registro general',
};
const CI_CLOSED_STATES = ['RESUELTO','CERRADO_SIN_RESPUESTA'];

function ciDatePlus(days=1) {
  const d=new Date();
  d.setHours(12,0,0,0);
  d.setDate(d.getDate()+days);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function ciWhatsappHref(phone) {
  let digits=String(phone||'').replace(/\D/g,'');
  if (digits.length===8) digits=`506${digits}`;
  return digits.length>=11?`https://wa.me/${digits}`:'';
}
function ciCategoryFromTarget(target) {
  const codes=(target?.signals||[]).map(x=>String(x?.code||'').toUpperCase()).join(' ');
  const type=String(target?.tipo||target?.tipo_origen||'').toUpperCase();
  if (/ASIST/.test(codes)) return 'ASISTENCIA';
  if (/NOTA|RENDIMIENTO/.test(codes)) return 'RENDIMIENTO';
  if (/EVALUACION/.test(codes)) return 'EVALUACIONES';
  if (/MORA/.test(codes)) return 'MORA';
  if (/CONAPE|DEPOSITO|DESEMBOLSO/.test(codes)) return 'CONAPE';
  if (/CONTINUIDAD/.test(type)) return 'CONTINUIDAD';
  if (/REINGRESO|REPETICION/.test(type)) return 'REINGRESO';
  if (/CAMBIO|TRASLADO/.test(type)) return 'CAMBIO_GRUPO';
  if (/CONTACTO|TELEFONO|CORREO/.test(codes)) return 'DATOS_CONTACTO';
  return 'GENERAL';
}
function ciPriorityColor(priority, currentCase) {
  if (currentCase?.vencido) return {bg:'#FDE7E5',fg:'#9B1C16',bd:'#F4B9B4'};
  if (currentCase?.vence_hoy) return {bg:'#FFF3D6',fg:'#7B4B00',bd:'#E9CF93'};
  return chPriorityColor(priority||'SIN_EVIDENCIA');
}
function ciReason(target) {
  const signals=Array.isArray(target?.signals)?target.signals:[];
  if (signals.length) return signals.slice(0,3).map(chSignalText).join(' · ');
  return target?.accion||target?.motivo_alerta||target?.tipo||'Seguimiento operativo del grupo';
}

function SeguimientoAccionModal({ grupo, target, seguimiento, onCerrar, onGuardado }) {
  const studentInfo=seguimiento?.por_estudiante?.[target?.codigo]||null;
  const currentCase=studentInfo?.caso_actual||null;
  const currentOpen=!!currentCase?.abierto;
  const [form,setForm]=React.useState(()=>({
    categoria:currentCase?.categoria||ciCategoryFromTarget(target),
    canal:(target?.telefono||target?.telefono_2)?'WHATSAPP':'SIN_CONTACTO',
    resultado:'CONTACTADO',
    estado_caso:currentOpen?(currentCase.estado||'EN_SEGUIMIENTO'):'EN_SEGUIMIENTO',
    nota:'',
    proxima_accion:currentOpen&&currentCase?.proxima_accion?currentCase.proxima_accion:(target?.accion||'Contactar nuevamente y confirmar la situación.'),
    fecha_proxima:currentOpen&&currentCase?.fecha_proxima?currentCase.fecha_proxima:ciDatePlus(1),
    responsable:currentCase?.responsable||'',
  }));
  const [saving,setSaving]=React.useState(false);
  const [error,setError]=React.useState('');
  const isClosed=CI_CLOSED_STATES.includes(form.estado_caso);
  const history=Array.isArray(studentInfo?.historial_reciente)?studentInfo.historial_reciente:[];
  const phone=target?.telefono||target?.telefono_2||'';
  const wa=ciWhatsappHref(phone);
  const update=(key,value)=>setForm(prev=>({...prev,[key]:value}));
  const submit=async()=>{
    setError('');
    if(!form.nota.trim()){setError('Documentá el resultado del contacto.');return;}
    if(!isClosed&&!form.proxima_accion.trim()){setError('Indicá la próxima acción.');return;}
    if(!isClosed&&!form.fecha_proxima){setError('Seleccioná la próxima fecha de seguimiento.');return;}
    setSaving(true);
    try{
      const payload={
        codigo:target.codigo,cedula:target.cedula,nombre:target.nombre,telefono:phone,
        cod_grupo:grupo.code,nivel:grupo.nivelId||grupo.nivel,
        caso_id:currentOpen?currentCase?.caso_id:'',intento_id:target?.intento_id||target?.intento_actual?.id||'',
        categoria:form.categoria,canal:form.canal,resultado:form.resultado,estado_caso:form.estado_caso,
        nota:form.nota,proxima_accion:isClosed?'':form.proxima_accion,fecha_proxima:isClosed?'':form.fecha_proxima,
        responsable:form.responsable,prioridad_origen:target?.prioridad||'',motivo_alerta:ciReason(target),
      };
      const resp=await todosPost('registrarSeguimientoOperativo',payload,40000);
      if(!resp?.ok) throw new Error(resp?.mensaje||resp?.error||'No se pudo guardar el seguimiento.');
      onGuardado(resp);
      onCerrar();
    }catch(e){setError(e?.message||'No se pudo guardar el seguimiento.');}
    finally{setSaving(false);}
  };
  const fieldStyle={width:'100%',padding:'9px 10px',border:'1px solid var(--line)',borderRadius:'var(--r-sm)',background:'var(--surface)',color:'var(--ink)',fontFamily:'inherit',fontSize:11.5,boxSizing:'border-box'};
  const labelStyle={display:'block',fontSize:9,fontWeight:900,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:4};
  return <div onClick={e=>{if(e.target===e.currentTarget&&!saving)onCerrar();}} style={{position:'fixed',inset:0,zIndex:1320,background:'rgba(18,14,11,.72)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
    <div style={{width:'min(860px,100%)',maxHeight:'94vh',overflow:'auto',background:'var(--surface)',borderRadius:'var(--r-lg)',boxShadow:'0 28px 80px rgba(0,0,0,.4)'}}>
      <div style={{padding:'15px 18px',borderBottom:'1px solid var(--line)',display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start'}}>
        <div><div style={{fontSize:9.5,fontWeight:900,letterSpacing:'.13em',textTransform:'uppercase',color:'var(--an-burgundy)'}}>Fase 3 · Registrar acción</div><div style={{fontSize:19,fontWeight:800,color:'var(--ink)',marginTop:3}}>{target?.nombre||target?.codigo}</div><div style={{fontFamily:'var(--f-mono)',fontSize:10,color:'var(--ink-3)',marginTop:2}}>{target?.codigo} · {grupo.code} · {grupo.nivel||grupo.nivelId}</div></div>
        <button onClick={onCerrar} disabled={saving} style={{width:34,height:34,border:'none',background:'var(--bg-deep)',borderRadius:'50%',cursor:'pointer',fontSize:19,color:'var(--ink-2)'}}>×</button>
      </div>
      <div style={{padding:'16px 18px'}}>
        <div style={{padding:'10px 12px',border:'1px solid var(--line)',background:'var(--bg-deep)',borderRadius:'var(--r-sm)',fontSize:10.5,color:'var(--ink-2)',lineHeight:1.45}}><strong>Origen:</strong> {ciReason(target)}{currentOpen&&<><br/><strong>Caso abierto:</strong> {currentCase.caso_id} · {CI_STATE_LABEL[currentCase.estado]||currentCase.estado}</>}</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:10,marginTop:12}}>
          <label><span style={labelStyle}>Categoría</span><select value={form.categoria} onChange={e=>update('categoria',e.target.value)} style={fieldStyle}>{Object.entries(CI_CATEGORY_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
          <label><span style={labelStyle}>Canal</span><select value={form.canal} onChange={e=>update('canal',e.target.value)} style={fieldStyle}>{Object.entries(CI_CHANNEL_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
          <label><span style={labelStyle}>Resultado</span><select value={form.resultado} onChange={e=>update('resultado',e.target.value)} style={fieldStyle}>{Object.entries(CI_RESULT_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
          <label><span style={labelStyle}>Estado del caso</span><select value={form.estado_caso} onChange={e=>update('estado_caso',e.target.value)} style={fieldStyle}>{Object.entries(CI_STATE_LABEL).filter(([v])=>v!=='REGISTRO').map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
        </div>
        <label style={{display:'block',marginTop:10}}><span style={labelStyle}>Resultado documentado</span><textarea value={form.nota} onChange={e=>update('nota',e.target.value)} rows={4} maxLength={1200} placeholder="Qué ocurrió, qué indicó el estudiante y qué se acordó." style={{...fieldStyle,resize:'vertical',lineHeight:1.45}}/></label>
        {!isClosed&&<div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:10,marginTop:10}}>
          <label><span style={labelStyle}>Próxima acción</span><input value={form.proxima_accion} onChange={e=>update('proxima_accion',e.target.value)} maxLength={400} style={fieldStyle}/></label>
          <label><span style={labelStyle}>Próxima fecha</span><input type="date" min={ciDatePlus(0)} value={form.fecha_proxima} onChange={e=>update('fecha_proxima',e.target.value)} style={fieldStyle}/></label>
        </div>}
        <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:10,alignItems:'end',marginTop:10}}>
          <label><span style={labelStyle}>Responsable asignado</span><input value={form.responsable} onChange={e=>update('responsable',e.target.value)} maxLength={120} placeholder="Vacío = usuario que registra" style={fieldStyle}/></label>
          {wa?<a href={wa} target="_blank" rel="noreferrer" style={{padding:'9px 12px',borderRadius:'var(--r-sm)',background:'#E7F3EC',border:'1px solid #BFDCCB',color:'#24633E',fontSize:11,fontWeight:900,textDecoration:'none',whiteSpace:'nowrap'}}>Abrir WhatsApp</a>:<div style={{padding:'9px 10px',fontSize:10,color:'#9B1C16'}}>Sin WhatsApp válido</div>}
        </div>
        {error&&<div style={{marginTop:10,padding:'9px 11px',border:'1px solid #F4B9B4',background:'#FDE7E5',borderRadius:'var(--r-sm)',color:'#9B1C16',fontSize:10.5,fontWeight:800}}>{error}</div>}
        {history.length>0&&<details style={{marginTop:12,padding:'9px 11px',border:'1px solid var(--line)',borderRadius:'var(--r-sm)',background:'var(--bg-deep)'}}><summary style={{cursor:'pointer',fontSize:10.5,fontWeight:900,color:'var(--ink-2)'}}>Historial reciente · {history.length}</summary><div style={{display:'grid',gap:6,marginTop:8}}>{history.map(ev=><div key={ev.id} style={{padding:'7px 8px',background:'var(--surface)',border:'1px solid var(--line)',borderRadius:7}}><div style={{fontSize:9,fontWeight:900,color:'var(--ink-3)'}}>{ev.fecha||'—'} · {CI_RESULT_LABEL[ev.resultado]||ev.resultado||ev.evento_tipo} · {ev.registrado_por||'Administración'}</div><div style={{fontSize:10.5,color:'var(--ink-2)',marginTop:3}}>{ev.nota||'Sin detalle'}</div></div>)}</div></details>}
        <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:14}}><button onClick={onCerrar} disabled={saving} style={{padding:'9px 13px',border:'1px solid var(--line)',background:'var(--surface)',borderRadius:'var(--r-sm)',fontFamily:'inherit',fontWeight:800,cursor:'pointer'}}>Cancelar</button><button onClick={submit} disabled={saving} style={{padding:'9px 14px',border:'1px solid var(--an-burgundy)',background:'var(--an-burgundy)',color:'#fff',borderRadius:'var(--r-sm)',fontFamily:'inherit',fontWeight:900,cursor:'pointer',opacity:saving?.65:1}}>{saving?'Guardando…':'Guardar en bitácora'}</button></div>
      </div>
    </div>
  </div>;
}

const CJ_ACTION_LABEL={
  NIVEL_ACTUAL:'Nivel actualmente cursando',
  REPETICION_NUEVO_INTENTO:'Repetición con nuevo intento',
  REACTIVACION:'Reactivación académica',
  CONTINUIDAD_PENDIENTE:'Continuidad pendiente',
  HUECO_ACADEMICO:'Hueco académico por revisar',
  PROGRAMA_COMPLETADO:'Programa completado',
  SIN_DIAGNOSTICO:'Revisión manual',
};
function cjMoney(v){const n=Number(v);return Number.isFinite(n)&&n>0?`₡${Math.round(n).toLocaleString('es-CR')}`:'—';}
function cjActionColor(type){
  if(type==='REPETICION_NUEVO_INTENTO'||type==='HUECO_ACADEMICO')return{bg:'#FDE7E5',fg:'#9B1C16',bd:'#F4B9B4'};
  if(type==='REACTIVACION'||type==='CONTINUIDAD_PENDIENTE')return{bg:'#FFF3D6',fg:'#7B4B00',bd:'#E9CF93'};
  if(type==='PROGRAMA_COMPLETADO')return{bg:'#E7F3EC',fg:'#24633E',bd:'#BFDCCB'};
  return{bg:'#E8F0F6',fg:'#274E68',bd:'#BDD0DF'};
}

function SeguimientoTrayectoriaModal({ grupo, target, onCerrar, onNavigate, onRegistrar }) {
  const [data,setData]=React.useState(null);
  const [loading,setLoading]=React.useState(true);
  const [error,setError]=React.useState('');
  const [destino,setDestino]=React.useState('');
  const [simulation,setSimulation]=React.useState(null);
  const [simulating,setSimulating]=React.useState(false);
  const load=React.useCallback(async(force=false)=>{
    setLoading(true);setError('');setSimulation(null);
    try{
      const resp=await todosPost('getSeguimientoTrayectoriaEstudiante',{codigo:target?.codigo,cod_grupo:grupo.code,nivel:grupo.nivelId||grupo.nivel,force},50000);
      if(!resp?.ok)throw new Error(resp?.mensaje||resp?.error||'No se pudo reconstruir la trayectoria.');
      setData(resp);
      const first=(resp.candidatos||[]).find(x=>x.seleccionable);
      setDestino(first?.grupo||'');
      setSimulation(resp.simulacion_recomendada||null);
    }catch(e){setError(e?.message||'No se pudo reconstruir la trayectoria.');}
    finally{setLoading(false);}
  },[grupo,target]);
  React.useEffect(()=>{load(false);},[load]);
  React.useEffect(()=>{const key=e=>{if(e.key==='Escape')onCerrar();};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[onCerrar]);
  const simulate=async()=>{
    if(!destino)return;
    setSimulating(true);setError('');
    try{
      const resp=await todosPost('simularSeguimientoRescate',{codigo:target?.codigo,cod_grupo:grupo.code,nivel:grupo.nivelId||grupo.nivel,grupo_destino:destino},50000);
      if(!resp?.ok)throw new Error(resp?.mensaje||resp?.error||'No se pudo simular el rescate.');
      setSimulation(resp.simulacion);
    }catch(e){setError(e?.message||'No se pudo simular el rescate.');}
    finally{setSimulating(false);}
  };
  const openIndividual=()=>{
    const code=data?.estudiante?.codigo||target?.codigo||'';
    try{sessionStorage.setItem('an_buscar_codigo',code);}catch(_){ }
    try{navigator.clipboard?.writeText(code);}catch(_){ }
    onCerrar();
    onNavigate?.('buscador');
  };
  const diag=data?.diagnostico||{};
  const dc=cjActionColor(diag.tipo);
  const candidates=(data?.candidatos||[]).filter(x=>x.seleccionable);
  const allCandidates=data?.candidatos||[];
  const levels=data?.niveles||[];
  const issues=data?.alertas_integridad||[];
  return <div onClick={e=>{if(e.target===e.currentTarget)onCerrar();}} style={{position:'fixed',inset:0,zIndex:1360,background:'rgba(18,14,11,.78)',backdropFilter:'blur(5px)',display:'flex',alignItems:'center',justifyContent:'center',padding:14}}>
    <div style={{width:'min(1120px,100%)',maxHeight:'96vh',overflow:'hidden',display:'flex',flexDirection:'column',background:'var(--surface)',borderRadius:'var(--r-lg)',boxShadow:'0 30px 90px rgba(0,0,0,.45)'}}>
      <div style={{padding:'15px 19px',borderBottom:'1px solid var(--line)',display:'flex',justifyContent:'space-between',gap:14,alignItems:'flex-start'}}>
        <div><div style={{fontSize:9.5,fontWeight:900,letterSpacing:'.13em',textTransform:'uppercase',color:'var(--an-burgundy)'}}>Fase 4 · Trayectoria y rescate histórico</div><div style={{fontSize:21,fontWeight:800,color:'var(--ink)',marginTop:3}}>{data?.estudiante?.nombre||target?.nombre||target?.codigo}</div><div style={{fontFamily:'var(--f-mono)',fontSize:10,color:'var(--ink-3)',marginTop:2}}>{target?.codigo} · consulta desde {grupo.code} · {grupo.nivel||grupo.nivelId}</div></div>
        <div style={{display:'flex',gap:7}}><button onClick={()=>load(true)} disabled={loading} style={{padding:'8px 11px',border:'1px solid var(--line)',background:'var(--surface)',borderRadius:'var(--r-sm)',fontSize:10.5,fontWeight:850,cursor:'pointer',fontFamily:'inherit'}}>Reconstruir</button><button onClick={onCerrar} style={{width:34,height:34,border:'none',background:'var(--bg-deep)',borderRadius:'50%',cursor:'pointer',fontSize:19,color:'var(--ink-2)'}}>×</button></div>
      </div>
      <div style={{padding:'16px 19px 20px',overflowY:'auto'}}>
        {loading&&<div style={{padding:48,textAlign:'center',color:'var(--ink-3)',fontWeight:750}}>Reconstruyendo niveles, intentos, traslados y grupos compatibles…</div>}
        {!loading&&error&&<div style={{padding:'11px 13px',border:'1px solid #F4B9B4',background:'#FDE7E5',borderRadius:'var(--r-md)',color:'#9B1C16',fontSize:11,fontWeight:800}}>{error}</div>}
        {!loading&&data&&<>
          <div style={{display:'grid',gridTemplateColumns:'minmax(260px,1.2fr) minmax(240px,.8fr)',gap:10}}>
            <div style={{padding:'13px 14px',border:`1px solid ${dc.bd}`,background:dc.bg,borderRadius:'var(--r-md)'}}><div style={{fontSize:9,fontWeight:900,letterSpacing:'.11em',textTransform:'uppercase',color:dc.fg}}>Diagnóstico operativo</div><div style={{fontSize:18,fontWeight:850,color:dc.fg,marginTop:3}}>{CJ_ACTION_LABEL[diag.tipo]||diag.label||diag.tipo}</div><div style={{fontSize:10.8,color:dc.fg,marginTop:5,lineHeight:1.45}}>{diag.motivo}</div>{diag.nivel_objetivo&&<div style={{fontFamily:'var(--f-mono)',fontSize:10,color:dc.fg,marginTop:7}}>Nivel objetivo: {diag.nivel_objetivo_nombre} · origen: {diag.grupo_origen||'sin grupo'}</div>}</div>
            <div style={{padding:'13px 14px',border:'1px solid var(--line)',background:'var(--bg-deep)',borderRadius:'var(--r-md)'}}><div style={{fontSize:9,fontWeight:900,letterSpacing:'.11em',textTransform:'uppercase',color:'var(--ink-3)'}}>Contexto CONAPE</div><div style={{fontSize:12,fontWeight:800,color:'var(--ink)',marginTop:4}}>{data.conape?.aplica?(data.conape?.vinculado?'Vinculado':'Sin vínculo actual'):'No aplica'}</div><div style={{fontSize:10,color:'var(--ink-3)',marginTop:4,lineHeight:1.45}}>Última consulta: {data.conape?.ultimo_sync||'sin registro'}{data.conape?.ultimo_desembolso?` · desembolso ${data.conape.ultimo_desembolso}`:''}<br/>{data.conape?.novedad||data.conape?.regla}</div>{data.conape?.cambio_pendiente&&<div style={{marginTop:6,fontSize:9.8,fontWeight:900,color:'#7B4B00'}}>Cambio pendiente de aprobación CONAPE · {data.conape.cambio_id}</div>}</div>
          </div>
          {issues.length>0&&<div style={{display:'grid',gap:6,marginTop:10}}>{issues.map((it,idx)=>{const c=cfIssueColor(it.severity);return <div key={`${it.code}-${idx}`} style={{padding:'8px 10px',border:`1px solid ${c.bd}`,background:c.bg,borderRadius:'var(--r-sm)',color:c.fg,fontSize:10.5,fontWeight:750}}>{it.message}</div>;})}</div>}
          <div style={{marginTop:14}}><div style={{fontSize:9.5,fontWeight:900,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--ink-3)'}}>Trayectoria por nivel</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(215px,1fr))',gap:9,marginTop:7}}>{levels.map(level=>{
            const lc=cjActionColor(level.cursando?'NIVEL_ACTUAL':level.aprobado?'PROGRAMA_COMPLETADO':(level.ultimo_resultado?.estatus==='REP'?'REPETICION_NUEVO_INTENTO':'CONTINUIDAD_PENDIENTE'));
            return <div key={level.nivel} style={{padding:'11px 12px',border:'1px solid var(--line)',borderRadius:'var(--r-md)',background:'var(--surface)'}}><div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center'}}><div style={{fontSize:13,fontWeight:900,color:'var(--ink)'}}>{level.nivel_nombre}</div><span style={{padding:'3px 7px',borderRadius:999,background:lc.bg,color:lc.fg,border:`1px solid ${lc.bd}`,fontSize:8.8,fontWeight:900}}>{level.estado_resumen_label}</span></div><div style={{display:'grid',gap:6,marginTop:8}}>{(level.intentos||[]).map(a=><div key={a.intento_id} style={{padding:'7px 8px',background:'var(--bg-deep)',borderRadius:7,border:'1px solid var(--line)'}}><div style={{fontSize:10,fontWeight:850,color:'var(--ink-2)'}}>{a.etiqueta} · {a.estatus_label}</div><div style={{fontFamily:'var(--f-mono)',fontSize:8.9,color:'var(--ink-3)',marginTop:2}}>{a.grupo||'Sin grupo'} · {a.periodo_corto||a.fecha_inicio||'sin periodo'}</div><div style={{fontSize:9.3,color:'var(--ink-3)',marginTop:2}}>{a.nota!==null&&a.nota!==undefined?`Nota ${a.nota}`:'Sin nota'}{a.certificado?` · Cert. ${a.certificado}`:''}</div></div>)}{!(level.intentos||[]).length&&(level.proyecciones||[]).map((p,i)=><div key={`${p.grupo}-${i}`} style={{padding:'7px 8px',background:'#F3F0EB',borderRadius:7,fontSize:9.5,color:'var(--ink-3)'}}>Proyectado · {p.grupo}<br/>{p.periodo_corto||p.fecha_inicio_texto}</div>)}{!(level.intentos||[]).length&&!(level.proyecciones||[]).length&&<div style={{fontSize:9.5,color:'var(--ink-3)'}}>Sin registro académico.</div>}</div></div>;
          })}</div></div>
          {diag.requiere_movimiento&&<div style={{marginTop:15,padding:'12px 13px',border:'1px solid var(--line)',borderRadius:'var(--r-md)',background:'var(--bg-deep)'}}><div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'flex-end',flexWrap:'wrap'}}><div><div style={{fontSize:9.5,fontWeight:900,letterSpacing:'.11em',textTransform:'uppercase',color:'var(--an-burgundy)'}}>Preparación de rescate</div><div style={{fontSize:10.5,color:'var(--ink-3)',marginTop:3}}>{candidates.length} grupos seleccionables de {allCandidates.length} revisados. Ninguno se aplica desde este panel.</div></div><div style={{display:'flex',gap:7,alignItems:'center',flexWrap:'wrap'}}><select value={destino} onChange={e=>{setDestino(e.target.value);setSimulation(null);}} style={{minWidth:300,padding:'8px 9px',border:'1px solid var(--line)',borderRadius:'var(--r-sm)',background:'var(--surface)',fontSize:10.5,fontFamily:'inherit'}}><option value="">Seleccione grupo destino</option>{candidates.map(c=><option key={c.grupo} value={c.grupo}>{c.nivel_nombre} · {c.tipo_periodo_nombre} · {c.periodo_corto} · {c.fecha_inicio_texto} · {c.grupo}</option>)}</select><button onClick={simulate} disabled={!destino||simulating} style={{padding:'8px 11px',border:'1px solid var(--an-burgundy)',background:'var(--an-burgundy)',color:'#fff',borderRadius:'var(--r-sm)',fontSize:10.5,fontWeight:900,cursor:'pointer',fontFamily:'inherit',opacity:(!destino||simulating)?.55:1}}>{simulating?'Simulando…':'Simular plan'}</button></div></div>
            {destino&&(()=>{const c=candidates.find(x=>x.grupo===destino);return c?<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:7,marginTop:9}}>{[['Periodo',`${c.tipo_periodo_nombre} · ${c.periodo_corto}`],['Inicio',c.fecha_inicio_texto||c.fecha_inicio],['Horario',`${c.dias||'—'} · ${c.hora_inicio||'—'}–${c.hora_fin||'—'}`],['Docente',c.docente||'Por definir'],['Cupo',`${c.cupo} disponibles`],['Cuota',cjMoney(c.precios?.cuota)]].map(([k,v])=><div key={k} style={{padding:'8px 9px',background:'var(--surface)',border:'1px solid var(--line)',borderRadius:7}}><div style={{fontSize:8.5,fontWeight:900,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--ink-3)'}}>{k}</div><div style={{fontSize:10.5,fontWeight:750,color:'var(--ink-2)',marginTop:2}}>{v}</div></div>)}</div>:null;})()}
            {simulation&&<div style={{marginTop:10,padding:'10px 11px',background:'var(--surface)',border:'1px solid #BFDCCB',borderRadius:'var(--r-sm)'}}><div style={{fontSize:9,fontWeight:900,letterSpacing:'.1em',textTransform:'uppercase',color:'#24633E'}}>Simulación sin escritura</div><div style={{fontSize:11,fontWeight:800,color:'var(--ink)',marginTop:4}}>{simulation.antes?.grupo||'Sin origen'} → {simulation.despues?.grupo}</div><div style={{fontSize:10,color:'var(--ink-3)',marginTop:3}}>Nuevo intento: {simulation.despues?.nuevo_intento?'Sí':'No'} · cuotas previstas: {simulation.financiero?.cantidad_cuotas||'—'} · publicación CONAPE automática: No</div><div style={{display:'flex',gap:5,flexWrap:'wrap',marginTop:7}}>{(simulation.despues?.plan||[]).map(p=><span key={p.nivel} style={{padding:'3px 7px',borderRadius:999,background:'var(--bg-deep)',border:'1px solid var(--line)',fontSize:9.2,fontWeight:800,color:'var(--ink-2)'}}>{p.nivel_nombre} · {p.estatus} · {p.periodo_corto}</span>)}</div>{(simulation.warnings||[]).map((w,i)=><div key={i} style={{fontSize:9.5,color:'#7B4B00',marginTop:5}}>• {w}</div>)}</div>}
          </div>}
          <details style={{marginTop:13,padding:'9px 11px',border:'1px solid var(--line)',borderRadius:'var(--r-sm)',background:'var(--surface)'}}><summary style={{cursor:'pointer',fontSize:10.5,fontWeight:900,color:'var(--ink-2)'}}>Movimientos e historia reciente · {(data.timeline||[]).length}</summary><div style={{display:'grid',gap:6,marginTop:8}}>{(data.timeline||[]).slice(0,30).map((ev,i)=><div key={`${ev.tipo}-${ev.fecha}-${i}`} style={{padding:'7px 8px',borderLeft:'3px solid var(--an-navy)',background:'var(--bg-deep)',borderRadius:7}}><div style={{fontSize:9,fontWeight:900,color:'var(--ink-3)'}}>{ev.fecha||'Sin fecha'} · {ev.nivel||'General'} · {ev.tipo}</div><div style={{fontSize:10.5,fontWeight:750,color:'var(--ink-2)',marginTop:2}}>{ev.titulo}</div><div style={{fontSize:9.5,color:'var(--ink-3)',marginTop:2}}>{ev.detalle}</div></div>)}</div></details>
          <div style={{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap',marginTop:14,paddingTop:12,borderTop:'1px solid var(--line)'}}><div style={{fontSize:9.8,color:'var(--ink-3)',maxWidth:620,lineHeight:1.45}}>Este panel prepara la decisión. El movimiento real debe revisarse y confirmarse desde Consulta individual; nunca se ejecuta desde Seguimiento.</div><div style={{display:'flex',gap:7,flexWrap:'wrap'}}><button onClick={()=>onRegistrar?.({...target,nivel_objetivo:diag.nivel_objetivo,accion:diag.motivo,tipo_origen:diag.tipo,prioridad:diag.prioridad})} style={{padding:'9px 12px',border:'1px solid var(--line)',background:'var(--surface)',borderRadius:'var(--r-sm)',fontFamily:'inherit',fontSize:10.5,fontWeight:850,cursor:'pointer'}}>Registrar acción</button><button onClick={openIndividual} style={{padding:'9px 12px',border:'1px solid var(--an-burgundy)',background:'var(--an-burgundy)',color:'#fff',borderRadius:'var(--r-sm)',fontFamily:'inherit',fontSize:10.5,fontWeight:900,cursor:'pointer'}}>Copiar código e ir a Consulta individual</button></div></div>
        </>}
      </div>
    </div>
  </div>;
}

function SeguimientoHumanoPanel({ data, error, students, alertsData, onRegistrar, onTrayectoria }) {
  const [filter,setFilter]=React.useState('todos');
  if(error) return <div style={{marginBottom:14,padding:'10px 12px',border:'1px solid #E9CF93',background:'#FFF3D6',borderRadius:'var(--r-md)',color:'#7B4B00',fontSize:10.5,fontWeight:800}}>La bitácora operativa no pudo cargarse: {error}</div>;
  if(!data) return null;
  const r=data.resumen||{}, by=data.por_estudiante||{};
  const rosterMap=Object.fromEntries((students||[]).map(x=>[String(x.codigo),x]));
  const candidates=[];
  const candidateKeys=new Set();
  (alertsData?.alertas_estudiantes||[]).forEach(a=>{const key=`${a.codigo}|NIVEL_ACTUAL`;candidateKeys.add(key);candidates.push({...a,tipo_origen:'NIVEL_ACTUAL',accion:a.accion||'Contactar y documentar la situación.',intento_actual:rosterMap[String(a.codigo)]?.intento_actual});});
  (students||[]).filter(x=>x.clasificacion==='CURSANDO').forEach(a=>{const key=`${a.codigo}|NIVEL_ACTUAL`;if(candidateKeys.has(key))return;candidateKeys.add(key);candidates.push({...a,tipo_origen:'NIVEL_ACTUAL',prioridad:'SIN_EVIDENCIA',signals:[],accion:'Registrar seguimiento y confirmar la situación actual.'});});
  (alertsData?.rescate||[]).forEach(a=>{const key=`${a.codigo}|${a.tipo||'RESCATE'}`;if(candidateKeys.has(key))return;candidateKeys.add(key);candidates.push({...a,tipo_origen:a.tipo||'RESCATE',signals:[],intento_actual:rosterMap[String(a.codigo)]?.intento_actual});});
  (data.casos||[]).forEach(c=>{const hasStudent=[...candidateKeys].some(k=>k.startsWith(`${c.codigo}|`));if(hasStudent)return;candidateKeys.add(`${c.codigo}|CASO_EXISTENTE`);candidates.push({codigo:c.codigo,nombre:c.nombre,cedula:c.cedula,telefono:c.telefono,tipo_origen:'CASO_EXISTENTE',prioridad:c.prioridad||'SIN_EVIDENCIA',signals:[],accion:c.proxima_accion||'Revisar el caso registrado.'});});
  const priorityRank={ATENCION_INMEDIATA:1,PRIORIDAD:2,VIGILAR:3,SIN_EVIDENCIA:4,ESTABLE:5};
  const rows=candidates.map(item=>{const person=rosterMap[String(item.codigo)]||{};const info=by[String(item.codigo)]||{};return {...person,...item,tracking:info,currentCase:info.caso_actual||null};}).sort((a,b)=>{
    const ac=a.currentCase,bc=b.currentCase;
    if(!!ac?.vencido!==!!bc?.vencido)return ac?.vencido?-1:1;
    if(!!ac?.vence_hoy!==!!bc?.vence_hoy)return ac?.vence_hoy?-1:1;
    return (priorityRank[a.prioridad]||9)-(priorityRank[b.prioridad]||9)||String(a.nombre).localeCompare(String(b.nombre),'es');
  });
  const visibles=rows.filter(x=>{
    const c=x.currentCase;
    if(filter==='todos')return true;
    if(filter==='pendientes')return !!c?.abierto;
    if(filter==='vencidos')return !!c?.vencido||!!c?.vence_hoy;
    if(filter==='sin_seguimiento')return x.tipo_origen==='NIVEL_ACTUAL'&&!x.tracking?.ultimo_evento;
    if(filter==='rescate')return x.tipo_origen!=='NIVEL_ACTUAL';
    return true;
  });
  return <section style={{marginBottom:18}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:12,flexWrap:'wrap',marginBottom:9}}><div><div style={{fontSize:10,fontWeight:900,letterSpacing:'.13em',textTransform:'uppercase',color:'var(--an-burgundy)'}}>Fase 3 · Seguimiento humano</div><div style={{fontSize:10.5,color:'var(--ink-3)',marginTop:3}}>Contacto, resultado, responsable y próxima fecha. Cada acción agrega historia; no altera el expediente académico.</div></div><div style={{fontSize:10,color:'var(--ink-3)'}}>{data.cache?.hit?'Caché':'Lectura renovada'} · {data.version}</div></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:9}}>{[
      ['Casos abiertos',r.casos_abiertos||0,'Trabajo pendiente','#7B4B00'],['Vencidos',r.vencidos||0,'Requieren acción hoy','#9B1C16'],['Vencen hoy',r.vencen_hoy||0,'Seguimiento programado','#7B4B00'],['Sin seguimiento',r.estudiantes_sin_seguimiento||0,'CA sin bitácora','#274E68'],['Resueltos',r.resueltos||0,'Historia conservada','#24633E'],['Registros generales',r.registros_legacy||0,'Bitácora anterior','var(--ink-2)']
    ].map(([label,value,sub,color])=><div key={label} style={{padding:'11px 12px',border:'1px solid var(--line)',borderRadius:'var(--r-md)',background:'var(--bg-deep)'}}><div style={{fontSize:9,fontWeight:900,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--ink-3)'}}>{label}</div><div style={{fontSize:24,fontWeight:780,color,marginTop:2}}>{value}</div><div style={{fontSize:9.5,color:'var(--ink-3)'}}>{sub}</div></div>)}</div>
    <div style={{marginTop:11,display:'flex',gap:5,flexWrap:'wrap'}}>{[['pendientes','Pendientes',r.casos_abiertos||0],['vencidos','Vencidos / hoy',(r.vencidos||0)+(r.vencen_hoy||0)],['sin_seguimiento','Sin seguimiento',r.estudiantes_sin_seguimiento||0],['rescate','Rescate',(alertsData?.rescate||[]).length],['todos','Todos',rows.length]].map(([id,label,n])=>{const active=filter===id;return <button key={id} onClick={()=>setFilter(id)} style={{padding:'6px 9px',borderRadius:999,border:active?'1px solid var(--an-burgundy)':'1px solid var(--line)',background:active?'var(--an-burgundy)':'var(--surface)',color:active?'#fff':'var(--ink-2)',fontSize:10.5,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>{label} · {n}</button>;})}</div>
    <div style={{marginTop:8,border:'1px solid var(--line)',borderRadius:'var(--r-md)',overflow:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:1040,fontSize:11}}><thead><tr style={{background:'var(--bg-deep)',textAlign:'left'}}>{['Estudiante','Origen','Caso actual','Próxima acción','Responsable',''].map(h=><th key={h} style={{padding:'9px 10px',fontSize:8.8,fontWeight:900,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--ink-3)',borderBottom:'1px solid var(--line)'}}>{h}</th>)}</tr></thead><tbody>{visibles.map((x,idx)=>{const c=x.currentCase;const pc=ciPriorityColor(x.prioridad,c);return <tr key={`${x.codigo}-${x.tipo_origen}-${idx}`} style={{borderBottom:'1px solid var(--line)',verticalAlign:'top'}}><td style={{padding:'10px'}}><div style={{fontWeight:850,color:'var(--ink)'}}>{x.nombre||x.codigo}</div><div style={{fontFamily:'var(--f-mono)',fontSize:9.5,color:'var(--ink-3)',marginTop:2}}>{x.codigo}</div><div style={{fontSize:9.5,color:'var(--ink-3)',marginTop:2}}>{x.telefono||x.telefono_2||x.correo||'Sin contacto'}</div></td><td style={{padding:'10px'}}><span style={{display:'inline-flex',padding:'3px 7px',borderRadius:999,background:pc.bg,color:pc.fg,border:`1px solid ${pc.bd}`,fontSize:9,fontWeight:900}}>{x.tipo_origen==='NIVEL_ACTUAL'?(CH_PRIORITY_LABEL[x.prioridad]||x.prioridad):(x.tipo_origen==='CASO_EXISTENTE'?'Caso existente':'Rescate')}</span><div style={{fontSize:9.5,color:'var(--ink-3)',marginTop:5,maxWidth:220}}>{x.accion||ciReason(x)}</div></td><td style={{padding:'10px'}}>{c?<><div style={{fontWeight:800,color:c.vencido?'#9B1C16':'var(--ink-2)'}}>{CI_STATE_LABEL[c.estado]||c.estado}</div><div style={{fontSize:9.5,color:'var(--ink-3)',marginTop:3}}>{c.ultimo_resultado?CI_RESULT_LABEL[c.ultimo_resultado]||c.ultimo_resultado:'Sin resultado'} · {c.ultima_fecha||'—'}</div></>:<span style={{fontWeight:800,color:'#274E68'}}>Sin caso abierto</span>}</td><td style={{padding:'10px'}}>{c?.abierto?<><div style={{fontWeight:750,color:c.vencido?'#9B1C16':'var(--ink-2)'}}>{c.proxima_accion||'Sin acción'}</div><div style={{fontFamily:'var(--f-mono)',fontSize:9.5,color:c.vencido?'#9B1C16':c.vence_hoy?'#7B4B00':'var(--ink-3)',marginTop:3}}>{c.fecha_proxima||'Sin fecha'}{c.vencido?' · VENCIDO':c.vence_hoy?' · HOY':''}</div></>:<span style={{color:'var(--ink-3)'}}>—</span>}</td><td style={{padding:'10px',fontSize:10.5,color:'var(--ink-2)'}}>{c?.responsable||'Sin asignar'}</td><td style={{padding:'10px',textAlign:'right'}}><div style={{display:'grid',gap:5,justifyItems:'end'}}><button onClick={()=>onTrayectoria(x)} style={{padding:'6px 9px',border:'1px solid var(--an-navy)',background:'var(--surface)',color:'var(--an-navy)',borderRadius:'var(--r-sm)',fontSize:9.5,fontWeight:900,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>Ver trayectoria</button><button onClick={()=>onRegistrar(x)} style={{padding:'7px 10px',border:'1px solid var(--an-burgundy)',background:c?.abierto?'var(--surface)':'var(--an-burgundy)',color:c?.abierto?'var(--an-burgundy)':'#fff',borderRadius:'var(--r-sm)',fontSize:10,fontWeight:900,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>{c?.abierto?'Actualizar caso':'Registrar seguimiento'}</button></div></td></tr>;})}{visibles.length===0&&<tr><td colSpan="6" style={{padding:28,textAlign:'center',color:'var(--ink-3)'}}>No hay casos en este filtro.</td></tr>}</tbody></table></div>
  </section>;
}

const CK_STATE_LABEL={
  VINCULADO:'Vinculado con desembolso',
  APROBADO_SIN_DESEMBOLSO:'Aprobado sin desembolso',
  SIN_VINCULAR:'Registro sin vincular',
  SIN_REGISTRO:'No aparece en consulta',
};
function ckPriorityColor(name){
  if(name==='ALTA')return{bg:'#FDE7E5',fg:'#9B1C16',bd:'#F4B9B4'};
  if(name==='MEDIA')return{bg:'#FFF3D6',fg:'#7B4B00',bd:'#E9CF93'};
  return{bg:'#E7F3EC',fg:'#24633E',bd:'#BFDCCB'};
}
function ckSyncLabel(sync){
  if(!sync?.ultimo_sync)return'Sin consulta registrada';
  const age=sync.horas_desde_sync;
  return `${sync.ultimo_sync}${age===null||age===undefined?'':` · hace ${age} h`}`;
}
function SeguimientoConapePanel({data,error,onActualizar,updating,onRegistrar}){
  const [copied,setCopied]=React.useState('');
  if(error)return <section style={{marginBottom:18,padding:'12px 13px',border:'1px solid #E9CF93',background:'#FFF3D6',borderRadius:'var(--r-md)',color:'#7B4B00',fontSize:11,fontWeight:750}}>La Fase 5 no pudo cargar CONAPE: {error}. Las fases académicas continúan disponibles.</section>;
  if(!data)return null;
  const r=data.resumen||{},sync=data.sincronizacion||{},rows=Array.isArray(data.estudiantes)?data.estudiantes:[],unlinked=data.movimientos_sin_vincular||{};
  const copyMessage=async(x)=>{if(!x?.mensaje_sugerido)return;try{await navigator.clipboard.writeText(x.mensaje_sugerido);setCopied(x.codigo);setTimeout(()=>setCopied(''),1800);}catch(_){window.prompt('Copie el mensaje:',x.mensaje_sugerido);}};
  return <section style={{marginBottom:18}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:12,flexWrap:'wrap',marginBottom:9}}>
      <div><div style={{fontSize:10,fontWeight:900,letterSpacing:'.13em',textTransform:'uppercase',color:'var(--an-burgundy)'}}>Fase 5 · CONAPE y depósitos</div><div style={{fontSize:10.5,color:'var(--ink-3)',marginTop:3}}>Consulta manual, desembolsos, mora oficial y conciliación. No es tiempo real y no envía mensajes automáticamente.</div></div>
      <button onClick={onActualizar} disabled={updating} style={{padding:'8px 11px',border:'1px solid var(--an-navy)',background:updating?'var(--bg-deep)':'var(--an-navy)',color:updating?'var(--ink-3)':'#fff',borderRadius:'var(--r-sm)',fontFamily:'inherit',fontSize:10.5,fontWeight:900,cursor:updating?'default':'pointer'}}>{updating?'Consultando CONAPE…':'Actualizar CONAPE ahora'}</button>
    </div>
    <div style={{padding:'10px 12px',border:`1px solid ${sync.muy_desactualizado?'#F4B9B4':sync.desactualizado?'#E9CF93':'#BFDCCB'}`,background:sync.muy_desactualizado?'#FDE7E5':sync.desactualizado?'#FFF3D6':'#E7F3EC',borderRadius:'var(--r-md)',display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
      <div><div style={{fontSize:9,fontWeight:900,letterSpacing:'.1em',textTransform:'uppercase',color:sync.muy_desactualizado?'#9B1C16':sync.desactualizado?'#7B4B00':'#24633E'}}>Última consulta manual</div><div style={{fontSize:12,fontWeight:850,color:'var(--ink)',marginTop:3}}>{ckSyncLabel(sync)}</div><div style={{fontSize:9.8,color:'var(--ink-3)',marginTop:2}}>No se crean ni administran triggers. La actualización ocurre únicamente al pulsar el botón.</div></div>
      {data.auditoria&&<div style={{textAlign:'right'}}><div style={{fontSize:9,fontWeight:900,textTransform:'uppercase',letterSpacing:'.1em',color:'var(--ink-3)'}}>Última auditoría</div><div style={{fontSize:11,fontWeight:800,color:'var(--ink-2)',marginTop:3}}>{data.auditoria.estado} · {data.auditoria.archivos_ok}/7 archivos</div><div style={{fontSize:9.5,color:'var(--ink-3)'}}>{data.auditoria.criticos} críticos · {data.auditoria.advertencias} advertencias</div></div>}
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:9,marginTop:9}}>{[
      ['Beneficiarios',r.beneficiarios||0,'CONAPE en este seguimiento','#274E68'],['Vinculados',r.vinculados||0,'Identidad conciliada','#24633E'],['Atención alta',r.atencion_alta||0,'Revisión prioritaria','#9B1C16'],['Movimiento periodo actual',r.con_movimiento_reciente||0,'CONAPE mes vigente','#7B4B00'],['Mora oficial',r.mora_oficial||0,'Según 7-morosidad','#9B1C16'],['Planes pendientes',r.planes_pendientes||0,'Documentación en proceso','var(--an-burgundy)']
    ].map(([label,value,sub,color])=><div key={label} style={{padding:'11px 12px',border:'1px solid var(--line)',borderRadius:'var(--r-md)',background:'var(--bg-deep)'}}><div style={{fontSize:8.8,fontWeight:900,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--ink-3)'}}>{label}</div><div style={{fontSize:23,fontWeight:760,color,marginTop:2}}>{value}</div><div style={{fontSize:9.4,color:'var(--ink-3)'}}>{sub}</div></div>)}</div>
    {rows.length>0?<div style={{marginTop:9,border:'1px solid var(--line)',borderRadius:'var(--r-md)',overflow:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:1120,fontSize:10.8}}><thead><tr style={{background:'var(--bg-deep)',textAlign:'left'}}>{['Estudiante','Estado CONAPE','Desembolso','Mora','Pendientes','Acción sugerida',''].map(h=><th key={h} style={{padding:'9px 10px',fontSize:8.6,fontWeight:900,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--ink-3)',borderBottom:'1px solid var(--line)'}}>{h}</th>)}</tr></thead><tbody>{rows.map(x=>{const pc=ckPriorityColor(x.prioridad);return <tr key={x.codigo} style={{borderBottom:'1px solid var(--line)',verticalAlign:'top'}}><td style={{padding:'10px'}}><div style={{fontWeight:850,color:'var(--ink)'}}>{x.nombre||x.codigo}</div><div style={{fontFamily:'var(--f-mono)',fontSize:9.3,color:'var(--ink-3)',marginTop:2}}>{x.codigo}{x.cedula?` · ${x.cedula}`:''}</div><div style={{fontSize:9.3,color:'var(--ink-3)',marginTop:2}}>{x.telefono||x.correo||'Sin contacto'} · {x.clasificacion||'seguimiento'}</div></td><td style={{padding:'10px'}}><div style={{fontWeight:800,color:x.estado_externo==='VINCULADO'?'#24633E':x.estado_externo==='APROBADO_SIN_DESEMBOLSO'?'#7B4B00':'#9B1C16'}}>{CK_STATE_LABEL[x.estado_externo]||x.estado_externo_label}</div><div style={{fontSize:9.3,color:'var(--ink-3)',marginTop:3}}>Última fila: {x.ultimo_sync||'sin registro'}</div>{x.grupo_reportado&&<div style={{fontFamily:'var(--f-mono)',fontSize:9,color:'var(--ink-3)',marginTop:2}}>Grupo reportado: {x.grupo_reportado}</div>}</td><td style={{padding:'10px'}}><div style={{fontWeight:800,color:'var(--ink-2)'}}>{x.desembolso?`Desembolso ${x.desembolso}`:'Sin desembolso'}</div><div style={{fontSize:9.4,color:'var(--ink-3)',marginTop:3}}>{x.periodo_mes&&x.periodo_anio?`${x.periodo_mes}/${x.periodo_anio}`:'Periodo no informado'}</div>{x.ultimo_movimiento&&<div style={{fontSize:9.3,color:'#7B4B00',marginTop:4}}>{x.ultimo_movimiento.tipo_label} · {x.ultimo_movimiento.detectado_en}</div>}</td><td style={{padding:'10px'}}>{x.mora?<><div style={{fontWeight:850,color:x.mora.estado==='SI'?'#9B1C16':'#24633E'}}>{x.mora.estado==='SI'?'MORA SI':'MORA NO'}</div><div style={{fontSize:9.3,color:'var(--ink-3)',marginTop:3}}>{x.mora.anio}/{x.mora.periodo}{x.mora.corresponde_periodo_actual?' · periodo actual':' · último disponible'}</div></>:<span style={{color:'var(--ink-3)'}}>Sin registro</span>}</td><td style={{padding:'10px'}}>{x.pago_sync_pendiente&&<><div style={{fontSize:9.4,fontWeight:800,color:'#9B1C16'}}>Pago local con sync pendiente</div>{x.pago_sync_pendiente.error&&<div title={x.pago_sync_pendiente.error} style={{fontSize:8.9,color:'#9B1C16',marginTop:3,maxWidth:190,lineHeight:1.3}}>Bloqueo: {x.pago_sync_pendiente.error}</div>}</>}{x.plan_cambio?.pendiente&&<div style={{fontSize:9.4,fontWeight:800,color:'#7B4B00',marginTop:3}}>Plan: {x.plan_cambio.estado}</div>}{!x.pago_sync_pendiente&&!x.plan_cambio?.pendiente&&<span style={{color:'var(--ink-3)'}}>—</span>}</td><td style={{padding:'10px',maxWidth:270}}><span style={{display:'inline-flex',padding:'3px 7px',borderRadius:999,background:pc.bg,color:pc.fg,border:`1px solid ${pc.bd}`,fontSize:8.8,fontWeight:900}}>{x.prioridad}</span><div style={{fontSize:9.6,color:'var(--ink-2)',lineHeight:1.4,marginTop:5}}>{x.accion}</div></td><td style={{padding:'10px',textAlign:'right'}}><div style={{display:'grid',gap:5,justifyItems:'end'}}>{x.mensaje_sugerido&&<button onClick={()=>copyMessage(x)} style={{padding:'6px 8px',border:'1px solid var(--line)',background:'var(--surface)',borderRadius:'var(--r-sm)',fontFamily:'inherit',fontSize:9.2,fontWeight:850,cursor:'pointer',whiteSpace:'nowrap'}}>{copied===x.codigo?'Mensaje copiado':'Copiar mensaje'}</button>}<button onClick={()=>onRegistrar?.({...x,tipo_origen:'CONAPE',prioridad:x.prioridad==='ALTA'?'ATENCION_INMEDIATA':'PRIORIDAD',accion:x.accion,motivo_alerta:x.accion_codigo})} style={{padding:'6px 8px',border:'1px solid var(--an-burgundy)',background:'var(--surface)',color:'var(--an-burgundy)',borderRadius:'var(--r-sm)',fontFamily:'inherit',fontSize:9.2,fontWeight:900,cursor:'pointer',whiteSpace:'nowrap'}}>Registrar acción</button></div></td></tr>})}</tbody></table></div>:<div style={{marginTop:9,padding:'14px',border:'1px solid var(--line)',background:'var(--bg-deep)',borderRadius:'var(--r-md)',fontSize:10.5,color:'var(--ink-3)'}}>No hay estudiantes CONAPE en el roster o la cola de rescate de este grupo.</div>}
    <div style={{marginTop:9,padding:'10px 12px',border:'1px solid var(--line)',background:'var(--surface)',borderRadius:'var(--r-sm)',fontSize:10,color:'var(--ink-3)',lineHeight:1.45}}><strong style={{color:'var(--ink-2)'}}>Contexto institucional separado:</strong> existen {unlinked.total||0} movimientos CONAPE sin vínculo Campus en toda la institución. No se atribuyen a este grupo. {(unlinked.recientes||[]).length>0&&<span> Los más recientes se conservan para conciliación administrativa desde el Panel Maestro.</span>}</div>
  </section>;
}

function SeguimientoRosterModal({ grupo, onCerrar, onNavigate }) {
  const [data, setData] = React.useState(null);
  const [alerts, setAlerts] = React.useState(null);
  const [cases, setCases] = React.useState(null);
  const [casesError, setCasesError] = React.useState('');
  const [conape, setConape] = React.useState(null);
  const [conapeError, setConapeError] = React.useState('');
  const [conapeUpdating, setConapeUpdating] = React.useState(false);
  const [actionTarget, setActionTarget] = React.useState(null);
  const [trajectoryTarget, setTrajectoryTarget] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState('');
  const [alertsError, setAlertsError] = React.useState('');
  const [filter, setFilter] = React.useState('todos');

  const cargar = React.useCallback(async (force = false) => {
    if (!grupo?.code) return;
    force ? setRefreshing(true) : setLoading(true);
    setError('');
    setAlertsError('');
    setCasesError('');
    setConapeError('');
    try {
      const payload={cod_grupo:grupo.code,nivel:grupo.nivelId||grupo.nivel,force};
      // Se carga primero el roster. El endpoint de alertas reutiliza esa caché
      // corta y evita volver a recorrer en paralelo todas las fuentes académicas.
      const rosterResp=await todosPost('getSeguimientoGrupoRoster',payload,50000);
      if(!rosterResp?.ok) throw new Error(rosterResp?.mensaje||rosterResp?.error||'No se pudo conciliar el roster.');
      setData(rosterResp);
      const [alertsResult,casesResult]=await Promise.allSettled([
        todosPost('getSeguimientoGrupoAlertas',payload,50000),
        todosPost('getSeguimientoGrupoCasos',payload,30000),
      ]);
      if(alertsResult.status==='fulfilled'&&alertsResult.value?.ok){
        setAlerts(alertsResult.value);
      }else{
        setAlerts(null);
        const reason=alertsResult.status==='rejected'?alertsResult.reason:alertsResult.value;
        setAlertsError(reason?.message||reason?.mensaje||reason?.error||'No se pudieron calcular las alertas.');
      }
      if(casesResult.status==='fulfilled'&&casesResult.value?.ok){
        setCases(casesResult.value);
      }else{
        setCases(null);
        const reason=casesResult.status==='rejected'?casesResult.reason:casesResult.value;
        setCasesError(reason?.message||reason?.mensaje||reason?.error||'No se pudo cargar la bitácora operativa.');
      }
      // CONAPE se solicita después de alertas para reutilizar sus cachés y evitar
      // dos consolidaciones académicas simultáneas del mismo grupo.
      try{
        const conapeResult=await todosPost('getSeguimientoGrupoConape',payload,50000);
        if(!conapeResult?.ok)throw new Error(conapeResult?.mensaje||conapeResult?.error||'No se pudo cargar el contexto CONAPE.');
        setConape(conapeResult);
      }catch(conapeErr){
        setConape(null);
        setConapeError(conapeErr?.message||'No se pudo cargar el contexto CONAPE.');
      }
    } catch (e) {
      setError(e?.message || 'No se pudo cargar el seguimiento del grupo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [grupo]);

  const actualizarConape = React.useCallback(async () => {
    if (!grupo?.code || conapeUpdating) return;
    const ok=window.confirm('Esta acción consultará el servicio externo CONAPE y actualizará la copia local. No crea triggers ni aplica pagos. ¿Continuar?');
    if(!ok)return;
    setConapeUpdating(true);setConapeError('');
    try{
      const resp=await todosPost('actualizarSeguimientoGrupoConapeAhora',{cod_grupo:grupo.code,nivel:grupo.nivelId||grupo.nivel},120000);
      if(!resp?.ok)throw new Error(resp?.mensaje||resp?.error||'No se pudo actualizar CONAPE.');
      if(resp.seguimiento?.ok)setConape(resp.seguimiento);
      await cargar(true);
    }catch(e){setConapeError(e?.message||'No se pudo actualizar CONAPE.');}
    finally{setConapeUpdating(false);}
  },[grupo,conapeUpdating,cargar]);

  React.useEffect(() => { cargar(false); }, [cargar]);
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [onCerrar]);

  const estudiantes = Array.isArray(data?.estudiantes) ? data.estudiantes : [];
  const visibles = estudiantes.filter((e) => {
    if (filter === 'todos') return true;
    if (filter === 'cursando') return e.clasificacion === 'CURSANDO';
    if (filter === 'proyectados') return e.clasificacion === 'PROYECTADO';
    if (filter === 'historicos') return e.clasificacion === 'HISTORICO';
    if (filter === 'inconsistencias') return Array.isArray(e.issues) && e.issues.some((it) => it.severity === 'CRITICO' || it.severity === 'ALERTA');
    if (filter === 'huerfanos') return ['LEGACY_DATOS','OPERATIVO_HUERFANO','TRASLADO_PENDIENTE'].includes(e.clasificacion);
    return true;
  });
  const r = data?.resumen || {};
  const groupIssues = Array.isArray(data?.inconsistencias_grupo) ? data.inconsistencias_grupo : [];

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }} style={{
      position:'fixed',inset:0,zIndex:1200,background:'rgba(20,16,12,.62)',backdropFilter:'blur(4px)',
      display:'flex',alignItems:'center',justifyContent:'center',padding:18,
    }}>
      <div style={{
        width:'min(1180px, 100%)',height:'min(860px, 96vh)',background:'var(--surface)',borderRadius:'var(--r-lg)',
        boxShadow:'0 28px 80px rgba(0,0,0,.36)',overflow:'hidden',display:'flex',flexDirection:'column',
      }}>
        <div style={{padding:'16px 20px',borderBottom:'1px solid var(--line)',display:'flex',justifyContent:'space-between',gap:16,alignItems:'flex-start'}}>
          <div style={{minWidth:0}}>
            <div style={{fontSize:10,fontWeight:900,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--ink-3)'}}>Seguimiento del grupo · Fase 5</div>
            <div style={{fontFamily:'var(--f-sans)',fontSize:22,fontWeight:750,color:'var(--ink)',marginTop:4,letterSpacing:'-.02em'}}>
              {grupo.code} · {grupo.nivel || TODOS_NIVEL_LABEL[grupo.nivelId] || grupo.nivelId}
            </div>
            <div style={{fontSize:12,color:'var(--ink-3)',marginTop:4}}>Alertas, bitácora, trayectoria y CONAPE manual sobre el roster conciliado.</div>
          </div>
          <div style={{display:'flex',gap:8,flexShrink:0}}>
            <button onClick={() => cargar(true)} disabled={refreshing || loading} style={{
              padding:'8px 12px',border:'1.5px solid var(--line)',background:'var(--surface)',borderRadius:'var(--r-sm)',
              fontSize:11,fontWeight:800,color:'var(--ink-2)',cursor:'pointer',fontFamily:'inherit',opacity:(refreshing || loading) ? .6 : 1,
            }}>{refreshing?'Actualizando…':'Actualizar seguimiento'}</button>
            <button onClick={onCerrar} aria-label="Cerrar" style={{width:34,height:34,border:'none',background:'var(--bg-deep)',borderRadius:'50%',cursor:'pointer',color:'var(--ink-2)',fontSize:19}}>×</button>
          </div>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'16px 20px 22px'}}>
          {loading && <div style={{padding:'52px 16px',textAlign:'center',color:'var(--ink-3)',fontWeight:700}}>Conciliando roster, alertas, bitácora y CONAPE…</div>}
          {!loading && error && (
            <div style={{padding:18,border:'1px solid #F4B9B4',background:'#FDE7E5',borderRadius:'var(--r-md)',color:'#9B1C16',fontWeight:700}}>{error}</div>
          )}
          {!loading && !error && data && (
            <>
              <SeguimientoConapePanel data={conape} error={conapeError} onActualizar={actualizarConape} updating={conapeUpdating} onRegistrar={setActionTarget} />
              <SeguimientoHumanoPanel data={cases} error={casesError} students={estudiantes} alertsData={alerts} onRegistrar={setActionTarget} onTrayectoria={setTrajectoryTarget} />
              <SeguimientoAlertasPanel data={alerts} error={alertsError} />
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:10,flexWrap:'wrap',marginBottom:9,paddingTop:3,borderTop:'1px solid var(--line)'}}>
                <div><div style={{fontSize:10,fontWeight:900,letterSpacing:'.13em',textTransform:'uppercase',color:'var(--ink-3)',marginTop:14}}>Base conciliada · Fase 1</div><div style={{fontSize:10.5,color:'var(--ink-3)',marginTop:3}}>La lista completa se conserva para auditar por qué cada persona aparece en el grupo.</div></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10}}>
                {[
                  ['Lista completa',r.lista_completa ?? 0,'Ninguna fuente se oculta'],
                  ['Cursando',r.cursando ?? 0,'CA conciliados'],
                  ['Proyectados',r.proyectados ?? 0,'PE separados del historial'],
                  ['Históricos',r.historicos ?? 0,'Trayectoria conservada'],
                  ['Por reconciliar',(r.traslado_pendiente||0)+(r.solo_datos_heredado||0)+(r.registros_operativos_huerfanos||0),'Sin vínculo académico limpio'],
                  ['Con alertas',r.personas_con_inconsistencias ?? 0,`${r.incidencias_criticas||0} incidencias críticas`],
                ].map(([label,value,sub]) => (
                  <div key={label} style={{padding:'12px 13px',border:'1px solid var(--line)',borderRadius:'var(--r-md)',background:'var(--bg-deep)'}}>
                    <div style={{fontSize:9,fontWeight:900,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--ink-3)'}}>{label}</div>
                    <div style={{fontFamily:'var(--f-sans)',fontSize:25,fontWeight:750,color:'var(--ink)',marginTop:2}}>{value}</div>
                    <div style={{fontSize:10,color:'var(--ink-3)',marginTop:1}}>{sub}</div>
                  </div>
                ))}
              </div>

              {groupIssues.length > 0 && (
                <div style={{marginTop:12,display:'grid',gap:7}}>
                  {groupIssues.map((it,idx) => { const c=cfIssueColor(it.severity); return (
                    <div key={`${it.code}-${idx}`} style={{padding:'9px 11px',border:`1px solid ${c.bd}`,background:c.bg,borderRadius:'var(--r-sm)',color:c.fg,fontSize:11.5,fontWeight:700}}>
                      {it.message}
                    </div>
                  ); })}
                </div>
              )}

              <div style={{marginTop:14,display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                  {[
                    ['todos','Lista completa',r.lista_completa||0],
                    ['cursando','Cursando',r.cursando||0],
                    ['proyectados','Proyectados',r.proyectados||0],
                    ['historicos','Históricos',r.historicos||0],
                    ['inconsistencias','Inconsistencias',r.personas_con_inconsistencias||0],
                    ['huerfanos','Por reconciliar',(r.traslado_pendiente||0)+(r.solo_datos_heredado||0)+(r.registros_operativos_huerfanos||0)],
                  ].map(([id,label,n]) => {
                    const active=filter===id;
                    return <button key={id} onClick={() => setFilter(id)} style={{padding:'7px 10px',borderRadius:999,border:active?'1px solid var(--an-navy)':'1px solid var(--line)',background:active?'var(--an-navy)':'var(--surface)',color:active?'#fff':'var(--ink-2)',fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>{label} · {n}</button>;
                  })}
                </div>
                <div style={{fontSize:10.5,color:'var(--ink-3)'}}>Mostrando {visibles.length} de {estudiantes.length} · caché {data.cache?.hit?'utilizada':'renovada'}</div>
              </div>

              <div style={{marginTop:10,border:'1px solid var(--line)',borderRadius:'var(--r-md)',overflow:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',minWidth:980,fontSize:11.5}}>
                  <thead>
                    <tr style={{background:'var(--bg-deep)',textAlign:'left'}}>
                      {['Estudiante','Clasificación','Estado e intento','Fuentes encontradas','Última actividad','Inconsistencias'].map(h => (
                        <th key={h} style={{padding:'10px 11px',fontSize:9,fontWeight:900,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--ink-3)',borderBottom:'1px solid var(--line)'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibles.map((e) => {
                      const cc=cfClassColor(e.clasificacion);
                      const issues=Array.isArray(e.issues)?e.issues:[];
                      const sourceKeys=Array.isArray(e.motivos_inclusion)?e.motivos_inclusion:[];
                      const lastActivity=[e.asistencia?.ultima_fecha,e.notas?.ultima_fecha,e.seguimiento?.fecha].filter(Boolean).sort().slice(-1)[0]||'Sin actividad';
                      return (
                        <tr key={e.codigo} style={{borderBottom:'1px solid var(--line)',verticalAlign:'top'}}>
                          <td style={{padding:'11px'}}>
                            <div style={{fontWeight:800,color:'var(--ink)'}}>{e.nombre || '(sin nombre)'}</div>
                            <div style={{fontFamily:'var(--f-mono)',fontSize:10,color:'var(--ink-3)',marginTop:2}}>{e.codigo}{e.cedula?` · ${e.cedula}`:''}</div>
                            <div style={{fontSize:10,color:'var(--ink-3)',marginTop:2}}>{e.telefono || 'Sin teléfono'}{e.convenio?` · ${e.convenio}`:''}</div>
                          </td>
                          <td style={{padding:'11px'}}>
                            <span style={{display:'inline-flex',padding:'3px 7px',borderRadius:999,background:cc.bg,color:cc.fg,fontSize:9.5,fontWeight:900}}>{CF_CLASS_LABEL[e.clasificacion]||e.clasificacion}</span>
                          </td>
                          <td style={{padding:'11px'}}>
                            <div style={{fontWeight:800,color:'var(--ink)'}}>{cfStatusLabel(e.estatus_actual)}</div>
                            <div style={{fontSize:10,color:'var(--ink-3)',marginTop:2}}>{e.intento_actual?.numero?`Intento ${e.intento_actual.numero}`:'Intento no identificado'}{e.nota_actual!==null&&e.nota_actual!==undefined?` · nota ${e.nota_actual}`:''}</div>
                          </td>
                          <td style={{padding:'11px'}}>
                            <div style={{display:'flex',gap:4,flexWrap:'wrap',maxWidth:250}}>
                              {sourceKeys.map(k => <span key={k} style={{padding:'2px 6px',borderRadius:999,background:'var(--bg-deep)',border:'1px solid var(--line)',fontSize:9.5,fontWeight:700,color:'var(--ink-2)'}}>{CF_SOURCE_LABEL[k]||k}</span>)}
                            </div>
                          </td>
                          <td style={{padding:'11px'}}>
                            <div style={{fontFamily:'var(--f-mono)',fontSize:10.5,fontWeight:700,color:'var(--ink-2)'}}>{lastActivity}</div>
                            {e.asistencia && <div style={{fontSize:10,color:'var(--ink-3)',marginTop:3}}>Asistencia: {e.asistencia.pct ?? '—'}% · {e.asistencia.lecciones||0} lecciones ocurridas</div>}
                            {e.asistencia_futura && <div style={{fontSize:10,color:'#7B4B00',marginTop:2}}>Excluidos: {e.asistencia_futura.total_registros||0} registros futuros</div>}
                            {e.seguimiento && <div style={{fontSize:10,color:'var(--ink-3)',marginTop:2}}>Seguimiento: {e.seguimiento.tipo||'General'}</div>}
                          </td>
                          <td style={{padding:'11px',maxWidth:330}}>
                            {issues.length===0 ? <span style={{color:'#24633E',fontWeight:800,fontSize:10.5}}>Sin inconsistencias detectadas</span> : (
                              <div style={{display:'grid',gap:5}}>
                                {issues.map((it,idx) => {const c=cfIssueColor(it.severity);return <div key={`${it.code}-${idx}`} title={it.code} style={{padding:'5px 7px',borderRadius:7,background:c.bg,color:c.fg,border:`1px solid ${c.bd}`,fontSize:9.8,fontWeight:700,lineHeight:1.3}}>{it.message}</div>;})}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {visibles.length===0 && <tr><td colSpan="6" style={{padding:34,textAlign:'center',color:'var(--ink-3)'}}>No hay estudiantes para este filtro.</td></tr>}
                  </tbody>
                </table>
              </div>

              <div style={{marginTop:10,padding:'10px 12px',borderRadius:'var(--r-sm)',background:'var(--bg-deep)',fontSize:10.5,color:'var(--ink-3)',lineHeight:1.5}}>
                <strong style={{color:'var(--ink-2)'}}>Criterio:</strong> cursando requiere ESTATUS CA o un intento activo CA del mismo grupo y nivel. PE se muestra como proyectado; un traslado de salida se conserva como historial. La asistencia futura se excluye de porcentajes y última actividad.
              </div>
            </>
          )}
        </div>
      </div>
      {trajectoryTarget&&<SeguimientoTrayectoriaModal grupo={grupo} target={trajectoryTarget} onCerrar={()=>setTrajectoryTarget(null)} onNavigate={onNavigate} onRegistrar={(x)=>{setTrajectoryTarget(null);setActionTarget(x);}} />}
      {actionTarget&&<SeguimientoAccionModal grupo={grupo} target={actionTarget} seguimiento={cases} onCerrar={()=>setActionTarget(null)} onGuardado={(resp)=>setCases(resp)} />}
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
