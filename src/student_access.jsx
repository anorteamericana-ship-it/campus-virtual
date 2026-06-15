/* global React */
// ═══════════════════════════════════════════════════════════════════════════
// STUDENT-ACCESS-CALENDAR-001 — Central de ACCESO del estudiante (FRONTEND)
// ═══════════════════════════════════════════════════════════════════════════
// Deriva `access_status` y `access_level` a partir de los datos que YA
// devuelve el backend (getEstudiante: estudiante / niveles / pendientes /
// grupo). REGLAS DE ORO:
//
//   • NO inventa pagos, cuotas, fechas ni morosidad.
//   • Si el backend YA manda un estado central (est.access_status /
//     est.access_level) lo CONSUME tal cual (source = 'backend').
//   • Si NO lo manda, lo DERIVA de las señales disponibles y reporta en
//     `missing[]` exactamente qué falta para que la decisión sea precisa.
//   • Cuando faltan señales, NO sobre-bloquea: degrada a un nivel honesto
//     y marca `determinado:false`, conservando el comportamiento actual
//     (el backend sigue siendo la última línea de defensa: getMaterialLeccion
//     devuelve acceso:false si corresponde).
//
// El objetivo es habilitar la UX de bloqueo/desbloqueo SIN romper a los
// estudiantes que hoy funcionan, y dejar documentado el trabajo de backend.
// ═══════════════════════════════════════════════════════════════════════════

const ACCESS_STATUS = {
  PREINSCRITO:        'PREINSCRITO',
  MATRICULA_PENDIENTE:'MATRICULA_PENDIENTE',
  MATRICULA_PAGADA:   'MATRICULA_PAGADA',
  CUOTA_1_PAGADA:     'CUOTA_1_PAGADA',
  ACTIVO:             'ACTIVO',
  MORA_CRITICA:       'MORA_CRITICA',
  COMPLETADO:         'COMPLETADO',
  BLOQUEADO:          'BLOQUEADO',
};

const ACCESS_LEVEL = {
  NONE:          'NONE',           // sin acceso
  BASIC_STATUS:  'BASIC_STATUS',   // datos personales + estado inscripción + CONAPE + cuenta
  CALENDAR_ONLY: 'CALENDAR_ONLY',  // + cronograma SOLO fechas (sin material/zoom)
  FULL_LEVEL:    'FULL_LEVEL',     // acceso completo del nivel
  ACCOUNT_ONLY:  'ACCOUNT_ONLY',   // SOLO estado de cuenta + cobros (mora crítica)
};

// Mensajes recomendados por estado (los consume la UI).
const ACCESS_MENSAJES = {
  [ACCESS_STATUS.PREINSCRITO]:
    'Tu acceso académico se activará cuando se registre la matrícula del nivel.',
  [ACCESS_STATUS.MATRICULA_PENDIENTE]:
    'Tu acceso académico se activará cuando se registre la matrícula del nivel.',
  [ACCESS_STATUS.MATRICULA_PAGADA]:
    'Tu cronograma ya está disponible. El material del curso se habilitará cuando se registre la primera cuota.',
  [ACCESS_STATUS.MORA_CRITICA]:
    'Tu acceso académico se encuentra temporalmente limitado por cuotas pendientes. Para reactivar el campus, cancelá al menos una cuota o contactá a cobros.',
  [ACCESS_STATUS.BLOQUEADO]:
    'Tu acceso al campus está limitado. Contactá a la administración.',
};

const ACCESS_LABEL = {
  [ACCESS_STATUS.PREINSCRITO]:        'Inscrito / en espera',
  [ACCESS_STATUS.MATRICULA_PENDIENTE]:'Matrícula pendiente',
  [ACCESS_STATUS.MATRICULA_PAGADA]:   'Matrícula pagada',
  [ACCESS_STATUS.CUOTA_1_PAGADA]:     'Primera cuota pagada',
  [ACCESS_STATUS.ACTIVO]:             'Activo',
  [ACCESS_STATUS.MORA_CRITICA]:       'Acceso limitado · mora',
  [ACCESS_STATUS.COMPLETADO]:         'Nivel completado',
  [ACCESS_STATUS.BLOQUEADO]:          'Bloqueado',
};

// Banderas booleanas derivadas del access_level — fuente única para la UI.
function flagsForLevel(level) {
  const calendar = level === ACCESS_LEVEL.CALENDAR_ONLY || level === ACCESS_LEVEL.FULL_LEVEL;
  const full     = level === ACCESS_LEVEL.FULL_LEVEL;
  return {
    accountOnly:     level === ACCESS_LEVEL.ACCOUNT_ONLY,
    none:            level === ACCESS_LEVEL.NONE,
    // BASIC_STATUS y superiores siempre pueden ver datos básicos / cuenta.
    canDatosBasicos: level !== ACCESS_LEVEL.NONE,
    canEstadoCuenta: true,
    canCalendar:     calendar,           // ver fechas del cronograma
    canMateriales:   full,               // PDFs / material por lección
    canBiblioteca:   full,               // biblioteca del curso
    canZoom:         full,               // botón Zoom
    canNotas:        full,
    canExamenes:     full,
    canICAN:         full,
    canCertificados: full,
    canDetalleAcademico: calendar,       // tema/objetivo en el detalle de lección
  };
}

function _num(v) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const _ORDEN_NIVEL = ['B1', 'B2', 'I1', 'I2'];

function _estatusDe(niveles, n) {
  const v = niveles ? niveles[n] : null;
  if (v && typeof v === 'object') return String(v.estatus || v.ESTATUS || '').toUpperCase();
  return String(v || '').toUpperCase();
}

// ── deriveStudentAccess(data, opts) ───────────────────────────────────────
// data = respuesta de getEstudiante: { estudiante, niveles, grupo, pendientes }
// opts.nivel = nivel de interés (B1/B2/I1/I2). Si se omite, se usa el activo.
// Devuelve:
//   { status, level, label, mensaje, flags, source, determinado, missing, notes, nivel }
function deriveStudentAccess(data, opts) {
  opts = opts || {};
  const est     = (data && data.estudiante) || {};
  const niveles = (data && data.niveles)     || {};
  const pend    = (data && data.pendientes)  || {};

  const missing = [];
  const notes   = [];

  const wrap = (status, level, determinado) => ({
    status, level,
    label:   ACCESS_LABEL[status] || status,
    mensaje: ACCESS_MENSAJES[status] || '',
    flags:   flagsForLevel(level),
    source:  determinado === 'backend' ? 'backend' : 'derivado',
    determinado: determinado === 'backend' ? true : !!determinado,
    missing, notes,
    nivel: opts.nivel || '',
  });

  // ── 1) ¿El backend ya provee un estado central? Consumirlo. ───────────────
  const bStatus = String(
    est.access_status || est.ACCESS_STATUS || (data && data.access_status) || ''
  ).toUpperCase();
  const bLevel = String(
    est.access_level || est.ACCESS_LEVEL || (data && data.access_level) || ''
  ).toUpperCase();
  if (ACCESS_STATUS[bStatus] && ACCESS_LEVEL[bLevel]) {
    notes.push('Estado de acceso provisto directamente por el backend.');
    return wrap(bStatus, bLevel, 'backend');
  }

  // ── 2) Derivación best-effort desde señales existentes. ───────────────────
  // Estado académico por nivel (CA = cursando, APR/CNV = aprobado/convalidado).
  const nivelActivo = opts.nivel
    || _ORDEN_NIVEL.find(n => _estatusDe(niveles, n) === 'CA')
    || [..._ORDEN_NIVEL].reverse().find(n => ['APR', 'CNV'].includes(_estatusDe(niveles, n)))
    || '';
  const hayCursando = _ORDEN_NIVEL.some(n => _estatusDe(niveles, n) === 'CA');
  const algunRegistrado = _ORDEN_NIVEL.some(n => _estatusDe(niveles, n));
  const todosCompletados = algunRegistrado && !hayCursando
    && _ORDEN_NIVEL.every(n => {
      const e = _estatusDe(niveles, n);
      return !e || ['APR', 'CNV', 'RPB'].includes(e);
    });
  opts.nivel = opts.nivel || nivelActivo;

  // Señales de pago — AGREGADAS (no por nivel). Esto es una limitación del
  // backend actual: `pendientes` no viene desglosado por nivel.
  const matriculaMonto = _num(pend.matricula);
  const cuotasTotal    = _num(pend.cuotas_total);
  const cuotasPend     = _num(pend.cuotas_pendientes);

  const matriculaPagada = (matriculaMonto != null) ? (matriculaMonto <= 0) : null;
  const cuota1Pagada    = (cuotasTotal != null && cuotasPend != null)
    ? (cuotasPend < cuotasTotal) : null;

  // Mora crítica: SOLO desde un campo EXPLÍCITO del backend. NUNCA se infiere
  // de "cuotas pendientes" (pendiente ≠ vencida): inventaríamos un estado.
  const moraCritica = (() => {
    const candFlags = [est.MORA_CRITICA, est.mora_critica, pend.mora_critica, est.MOROSIDAD, est.morosidad];
    for (const c of candFlags) {
      if (c === true) return true;
      if (typeof c === 'string' && /^(s[ií]|true|critic)/i.test(c.trim())) return true;
    }
    const candNum = [_num(pend.cuotas_vencidas), _num(est.cuotas_vencidas), _num(pend.meses_vencidos), _num(est.meses_vencidos)];
    for (const n of candNum) if (n != null && n >= 2) return true;
    // ¿Hay algún campo de vencidas/mora? Si no existe ninguno → desconocido.
    const existeCampoMora = candFlags.some(c => c !== undefined)
      || candNum.some((_, i) => [pend.cuotas_vencidas, est.cuotas_vencidas, pend.meses_vencidos, est.meses_vencidos][i] !== undefined);
    return existeCampoMora ? false : null;
  })();

  // ── Reporte honesto de lo que falta del backend ───────────────────────────
  missing.push('access_status / access_level POR NIVEL (no provistos por el backend).');
  missing.push('Estado de matrícula POR NIVEL — `pendientes.matricula` es un agregado (₡), no distingue B1/B2/I1/I2.');
  missing.push('Estado de PRIMERA CUOTA POR NIVEL — `pendientes.cuotas_*` es agregado, no por nivel.');
  if (moraCritica == null) {
    missing.push('Mora crítica explícita (cuotas/meses VENCIDOS). No se infiere de cuotas pendientes.');
  }

  // ── Mapeo a estado/level ──────────────────────────────────────────────────
  // (orden de prioridad: mora → preinscrito → completado → activo/matrícula)
  if (moraCritica === true) {
    notes.push('Mora crítica detectada por campo explícito del backend.');
    return wrap(ACCESS_STATUS.MORA_CRITICA, ACCESS_LEVEL.ACCOUNT_ONLY, true);
  }

  // Sin nivel activo + matrícula claramente pendiente → preinscrito / en espera.
  if (!hayCursando && matriculaPagada === false) {
    notes.push('Sin nivel en curso y matrícula con saldo pendiente → preinscrito/en espera.');
    return wrap(ACCESS_STATUS.MATRICULA_PENDIENTE, ACCESS_LEVEL.BASIC_STATUS, true);
  }

  if (todosCompletados) {
    notes.push('Todos los niveles registrados están aprobados/convalidados.');
    return wrap(ACCESS_STATUS.COMPLETADO, ACCESS_LEVEL.FULL_LEVEL, true);
  }

  if (matriculaPagada === true) {
    if (cuota1Pagada === true) {
      notes.push('Matrícula pagada + al menos una cuota cubierta → acceso completo.');
      return wrap(ACCESS_STATUS.ACTIVO, ACCESS_LEVEL.FULL_LEVEL, true);
    }
    if (cuota1Pagada === false) {
      notes.push('Matrícula pagada pero sin cuotas cubiertas → solo cronograma (fechas).');
      return wrap(ACCESS_STATUS.MATRICULA_PAGADA, ACCESS_LEVEL.CALENDAR_ONLY, true);
    }
    // Matrícula pagada pero estado de cuotas desconocido → no sub-bloqueamos.
    notes.push('Matrícula pagada; estado de cuotas desconocido → acceso completo (indeterminado).');
    return wrap(ACCESS_STATUS.ACTIVO, ACCESS_LEVEL.FULL_LEVEL, false);
  }

  // Sin señales claras de pago. Si hay nivel en curso, lo tratamos como activo
  // (comportamiento actual, sin sobre-bloquear); si no, como matrícula pendiente.
  if (hayCursando) {
    notes.push('Nivel en curso sin señales de pago utilizables → acceso completo (indeterminado).');
    return wrap(ACCESS_STATUS.ACTIVO, ACCESS_LEVEL.FULL_LEVEL, false);
  }
  notes.push('Sin nivel en curso ni señales de pago utilizables → matrícula pendiente (indeterminado).');
  return wrap(ACCESS_STATUS.MATRICULA_PENDIENTE, ACCESS_LEVEL.BASIC_STATUS, false);
}

// ── Caché de getEstudiante por código (evita N llamadas en una sesión) ─────
// Misma forma de POST seguro que el resto del frontend (token en el body).
const _accessCache = {};
async function _postAccess(fn, payload) {
  const url   = window.APPS_SCRIPT_URL;
  const token = (typeof window.getSessionToken === 'function') ? window.getSessionToken() : '';
  const res = await fetch(`${url}?fn=${encodeURIComponent(fn)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, token, ...(payload || {}) }),
  });
  return await res.json();
}
function fetchAccessData(codigo) {
  if (!codigo) return Promise.resolve(null);
  if (_accessCache[codigo]) return _accessCache[codigo];
  const p = _postAccess('getEstudiante', { codigo })
    .then(d => (d && d.ok) ? d : null)
    .catch(() => null);
  _accessCache[codigo] = p;
  return p;
}
function clearAccessCache() { for (const k in _accessCache) delete _accessCache[k]; }

// ── Hook React: useStudentAccess(codigo, nivel) ────────────────────────────
// Devuelve { loading, data, access }. `access` es el objeto de deriveStudentAccess
// (o null si no hay datos). Reutilizable por Cronograma, Biblioteca y Dashboard.
function useStudentAccess(codigo, nivel) {
  const [state, setState] = React.useState({ loading: !!codigo, data: null, access: null });
  React.useEffect(() => {
    let alive = true;
    if (!codigo) { setState({ loading: false, data: null, access: null }); return; }
    setState(s => ({ ...s, loading: true }));
    fetchAccessData(codigo).then(d => {
      if (!alive) return;
      setState({
        loading: false,
        data: d,
        access: d ? deriveStudentAccess(d, { nivel }) : null,
      });
    });
    return () => { alive = false; };
  }, [codigo, nivel]);
  return state;
}

Object.assign(window, {
  ACCESS_STATUS, ACCESS_LEVEL, ACCESS_MENSAJES, ACCESS_LABEL,
  flagsForLevel, deriveStudentAccess,
  fetchAccessData, clearAccessCache, useStudentAccess,
});
