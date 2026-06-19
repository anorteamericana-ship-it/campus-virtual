/* global window */

// ── Apps Script URL (compartida) ─────────────────────────────────────────
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';

// ── Fetch helpers para VISTA DOCENTE ─────────────────────────────────────
// Ambos endpoints aceptan tanto nombre como cédula en `cod_docente`.
// El nombre es el ID funcional en CALENDARIO_LECCIONES (Apps Script v4.21.5+).

// FIX-ADMIN-CORE-POST-001: lecturas internas (admin/docente) vía POST text/plain.
// Conserva `?fn=` en la URL (Apps Script enruta con e.parameter.fn) y envía el
// token en el BODY, nunca en la URL.
async function postCampusData(fn, payload = {}) {
  const res = await fetch(`${APPS_SCRIPT_URL}?fn=${encodeURIComponent(fn)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      fn,
      token: getSessionToken(),
      ...payload,
    }),
  });
  return await res.json();
}

async function fetchCalendarioDocente(nombreOrCedula) {
  if (!nombreOrCedula) return { ok: false, error: 'cod_docente vacío' };
  try {
    return await postCampusData('getCalendarioDocente', { cod_docente: nombreOrCedula });
  } catch (e) {
    return { ok: false, error: 'Error de conexión: ' + e.message };
  }
}

async function fetchTareasPendientesDocente(nombreOrCedula) {
  if (!nombreOrCedula) return { ok: false, error: 'cod_docente vacío' };
  try {
    return await postCampusData('getTareasPendientesDocente', { cod_docente: nombreOrCedula });
  } catch (e) {
    return { ok: false, error: 'Error de conexión: ' + e.message };
  }
}

// ── Estudiantes para cerrar una lección (sólo CA del nivel) ──────────────
// SIEMPRE usar este endpoint para el cierre (no getGrupoEstudiantes):
// filtra los matriculados con ESTATUS=CA en ese nivel específico.
async function fetchEstudiantesParaCierre(codGrupo, nivel) {
  if (!codGrupo || !nivel) return { ok: false, error: 'cod_grupo / nivel vacío' };
  try {
    return await postCampusData('getEstudiantesParaCierre', { cod_grupo: codGrupo, nivel });
  } catch (e) {
    return { ok: false, error: 'Error de conexión: ' + e.message };
  }
}

// ── Supervisión: docentes con lecciones atrasadas (panel admin B1) ───────
// Endpoint pesado (~11 s).  El caller DEBE mostrar spinner.
async function fetchDocentesAtrasados() {
  try {
    return await postCampusData('getDocentesAtrasados');
  } catch (e) {
    return { ok: false, error: 'Error de conexión: ' + e.message };
  }
}

// ── POST asignarCoberturaLeccion ─────────────────────────────────────────
// Reasigna UNA lección puntual a un docente de cobertura.
// Igual que postCerrarLeccionCompleta: text/plain para esquivar el preflight
// CORS — Apps Script lee el body en e.postData.contents.
async function fetchAsignarCobertura(payload) {
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn: 'asignarCoberturaLeccion', token: getSessionToken(), ...payload }),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'Error de conexión: ' + e.message };
  }
}

// ── Material PDF de una lección (v4.22.4) ────────────────────────────────
// El backend decide qué PDF servir y si hay acceso, según el rol y el
// estado del estudiante. NUNCA devuelve `pdf_id` cuando `acceso: false`.
//
// Parámetros:
//   nivel:    'B1' | 'B2' | 'I1' | 'I2'
//   leccion:  1..32
//   riel:     'curso' (TEORICA/PRACTICA, ORAL, ESCRITO, PC) | 'ican'
//   rol:      'teacher' | 'student' | 'admin' | 'superadmin'
//   codigo, cod_grupo:  SOLO para estudiante (verifica su estatus real)
//
// Respuesta acceso=true  → { ok, acceso:true,  pdf_id, pdf_url, titulo, unidad, tipo_pdf }
// Respuesta acceso=false → { ok, acceso:false, motivo, estado, titulo }
async function fetchMaterialLeccion({ nivel, leccion, riel, rol, codigo, cod_grupo } = {}) {
  if (!nivel || !leccion || !riel || !rol) {
    return { ok: false, error: 'parámetros incompletos' };
  }
  try {
    const payload = { nivel, leccion, riel, rol };
    if (rol === 'student') {
      if (codigo)    payload.codigo = codigo;
      if (cod_grupo) payload.cod_grupo = cod_grupo;
    }
    return await postCampusData('getMaterialLeccion', payload);
  } catch (e) {
    return { ok: false, error: 'Error de conexión: ' + e.message };
  }
}

// ── Edición SUPERADMIN de lección CERRADA (v4.38.2) ──────────────────────
// Poder restringido. Backend exige un token de sesión válido de superadmin
// (enviado en el body como `token`). Sin token, no se llama al backend.
// La lección permanece CERRADA tras editar (no se reabre, no se recalcula).

// (Lectura) Detalle de lección cerrada para precargar el modal de edición:
// devuelve { ok, estudiantes:[{cod, nombre, presente, retro, pc, nota}] }.
// Si el backend aún no expone esta función, el modal degradará a
// fetchEstudiantesParaCierre y arrancará con campos en blanco.
async function fetchLeccionCerradaDetalle({ cod_grupo, nivel, leccion, riel } = {}) {
  if (!cod_grupo || !nivel || !leccion) {
    return { ok: false, error: 'parámetros incompletos' };
  }
  try {
    return await postCampusData('getLeccionCerradaDetalle', {
      cod_grupo, nivel, leccion, riel: riel || 'curso',
    });
  } catch (e) {
    return { ok: false, error: 'Error de conexión: ' + e.message };
  }
}

async function fetchEditarRetroPCCerrada(payload) {
  const token = getSessionToken();
  if (!token) return { ok: false, error: 'sesion_requerida' };
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        fn: 'editarRetroPCCerrada',
        token,
        ...payload,
      }),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'Error de conexión: ' + e.message };
  }
}

async function fetchEditarAsistenciaNotaCerrada(payload) {
  const token = getSessionToken();
  if (!token) return { ok: false, error: 'sesion_requerida' };
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        fn: 'editarAsistenciaNotaCerrada',
        token,
        ...payload,
      }),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'Error de conexión: ' + e.message };
  }
}

// ── Auditoría Académica (solo lectura) ────────────────────────────────
// Supervisión admin/superadmin por grupo + nivel. Requiere token de sesión
// (el backend valida autorización). NO modifica datos: es de pura lectura.
async function fetchAuditoriaAcademicaGrupo({ cod_grupo, nivel } = {}) {
  const token = getSessionToken();
  if (!token) return { ok: false, error: 'sesion_requerida' };
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        fn: 'getAuditoriaAcademicaGrupo',
        token,
        cod_grupo,
        nivel,
      }),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'Error de conexión: ' + e.message };
  }
}

// ── Suspensiones de lecciones (v4.23.x) ──────────────────────────────────
// Flujo de 2 pasos: docente solicita → admin/superadmin aprueba o rechaza.
// Suspender NO elimina lecciones: empuja el calendario una fecha hábil.
// Las 32 lecciones SE DAN siempre.

async function fetchSolicitarSuspension(payload) {
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn: 'solicitarSuspension', token: getSessionToken(), ...payload }),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'Error de conexión: ' + e.message };
  }
}

async function fetchGetSolicitudesSuspension(estado = 'PENDIENTE') {
  try {
    // FIX-ROUTING-POST-APPS-SCRIPT-001: POST text/plain conservando ?fn= en la URL
    // (el backend enruta por e.parameter.fn). NO es GET y el token NO va en la URL:
    // token y `estado` viajan en el body. Mismo shape de respuesta.
    const res = await fetch(`${APPS_SCRIPT_URL}?fn=getSolicitudesSuspension`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn: 'getSolicitudesSuspension', token: getSessionToken(), estado }),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'Error de conexión: ' + e.message };
  }
}

async function fetchResolverSolicitudSuspension(payload) {
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn: 'resolverSolicitudSuspension', token: getSessionToken(), ...payload }),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'Error de conexión: ' + e.message };
  }
}

// ── POST cerrarLeccionCompleta ───────────────────────────────────────────
// Enviamos como text/plain para evitar el preflight CORS que rompe Apps
// Script (doPost recibe el JSON en e.postData.contents igual).
async function postCerrarLeccionCompleta(body) {
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn: 'cerrarLeccionCompleta', token: getSessionToken(), ...body }),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'Error de conexión: ' + e.message };
  }
}

// ── Solicitudes de pago — Fase 3.5 ───────────────────────────────────────
// El vendedor reporta que un cliente envió un comprobante; el admin lo ve en
// la cola "Solicitudes", verifica el dinero en BDBANCARIO y marca aplicada.
// La imagen es EVIDENCIA, no automatización: nada se aplica solo.
//
// Backend real (Apps Script v4.35.0): reportarPago / getSolicitudesPago /
// marcarSolicitudAplicada / rechazarSolicitudPago. Si la red falla (p. ej.
// en el preview sin sesión) caemos a un store demo en localStorage para que
// el ciclo vendedor→admin sea probable end-to-end en el navegador.
const SOLP_KEY = 'an_solicitudes_pago';

function _solpRead() {
  try { return JSON.parse(localStorage.getItem(SOLP_KEY) || 'null') || _solpSeed(); }
  catch (_) { return []; }
}
function _solpWrite(arr) {
  try { localStorage.setItem(SOLP_KEY, JSON.stringify(arr)); } catch (_) {}
  return arr;
}
function _solpUid() { return 'sp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// Comprobante de muestra (SVG data-URI) — autosuficiente, no depende de
// ventas_data.jsx (que no se carga en el campus admin).
function _solpDemoComprobante(ref) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="680" viewBox="0 0 520 680">
    <rect width="520" height="680" fill="#EEF1F6"/>
    <rect x="34" y="40" width="452" height="600" rx="18" fill="#fff" stroke="#CFD6E2" stroke-width="2"/>
    <circle cx="260" cy="120" r="34" fill="#1E4D2B"/>
    <path d="M244 120l11 11 22-23" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="260" y="190" font-family="monospace" font-size="20" fill="#1E4D2B" text-anchor="middle" font-weight="bold">SINPE MÓVIL · EXITOSO</text>
    <text x="260" y="232" font-family="sans-serif" font-size="15" fill="#6B7280" text-anchor="middle">Transferencia recibida</text>
    <text x="260" y="300" font-family="sans-serif" font-size="40" fill="#0F172A" text-anchor="middle" font-weight="bold">₡20.000</text>
    <line x1="70" y1="350" x2="450" y2="350" stroke="#E3E8F0" stroke-width="2"/>
    <text x="80" y="392" font-family="sans-serif" font-size="14" fill="#9AA3B2">Comprobante</text>
    <text x="440" y="392" font-family="monospace" font-size="16" fill="#0F172A" text-anchor="end" font-weight="bold">${ref}</text>
    <text x="80" y="436" font-family="sans-serif" font-size="14" fill="#9AA3B2">Fecha</text>
    <text x="440" y="436" font-family="sans-serif" font-size="14" fill="#0F172A" text-anchor="end">06 jun 2026 · 09:14</text>
    <text x="80" y="480" font-family="sans-serif" font-size="14" fill="#9AA3B2">Destino</text>
    <text x="440" y="480" font-family="sans-serif" font-size="14" fill="#0F172A" text-anchor="end">Academia Norteamericana</text>
    <text x="260" y="600" font-family="monospace" font-size="12" fill="#B6BDC9" text-anchor="middle">comprobante de muestra · demo</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// Semilla: una solicitud pendiente de ejemplo (Deborah, del caso de prueba del
// director) para que la cola del admin no esté vacía la primera vez. Solo se
// escribe si la clave nunca existió.
function _solpSeed() {
  if (localStorage.getItem(SOLP_KEY) !== null) return [];
  const seed = [{
    id: _solpUid(),
    timestamp: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
    usuario_reporta: '120180999', nombre_reporta: 'Asesora Demo 1', origen: 'VENDEDOR',
    estudiante_cedula: '120180140', estudiante_codigo: '17193', estudiante_nombre: 'RODRIGUEZ PALACIOS DEBORA',
    tipo_pago: 'MATRICULA', nivel: 'B1',
    numero_comprobante: '74974001', monto_reportado: 20000,
    url_comprobante: _solpDemoComprobante('74974001'),
    foto_mime: 'image/svg+xml',
    notas_reporta: 'Cliente confirmó el SINPE hoy en la mañana.',
    estado: 'PENDIENTE', admin_nombre: '', motivo_rechazo: '', fecha_resolucion: '',
  }];
  _solpWrite(seed);
  return seed;
}

// Detecta duplicado: mismo número de comprobante + misma cédula ya registrados.
function _solpReportarDemo(body) {
  const arr = _solpRead();
  const dup = arr.find(s =>
    String(s.numero_comprobante).trim() === String(body.numero_comprobante).trim() &&
    String(s.estudiante_cedula).replace(/\D/g, '') === String(body.estudiante_cedula).replace(/\D/g, ''));
  const url = body.foto_base64 ? `data:${body.foto_mime || 'image/jpeg'};base64,${body.foto_base64}` : '';
  const reg = {
    id: _solpUid(),
    timestamp: new Date().toISOString(),
    usuario_reporta: body.usuario_reporta || '', nombre_reporta: body.nombre_reporta || '',
    origen: body.origen || 'VENDEDOR',
    estudiante_cedula: body.estudiante_cedula || '', estudiante_codigo: body.estudiante_codigo || '',
    estudiante_nombre: body.estudiante_nombre || '',
    tipo_pago: body.tipo_pago || 'OTRO', nivel: body.nivel || '',
    numero_comprobante: String(body.numero_comprobante || '').trim(),
    monto_reportado: Number(body.monto_reportado) || 0,
    url_comprobante: url, foto_mime: body.foto_mime || '',
    notas_reporta: body.notas_reporta || '',
    estado: dup ? 'DUPLICADO' : 'PENDIENTE', admin_nombre: '', motivo_rechazo: '', fecha_resolucion: '',
  };
  _solpWrite([reg, ...arr]);
  return {
    ok: true, id: reg.id, estado: reg.estado, url_comprobante: url,
    mensaje: dup
      ? 'Este comprobante ya fue aplicado antes. La solicitud quedó como duplicada.'
      : 'Solicitud enviada al admin. Te avisará cuando aplique el pago.',
  };
}

function _solpListarDemo({ estado, asesor, fecha_desde, fecha_hasta } = {}) {
  let arr = _solpRead();
  const pendientes = arr.filter(s => s.estado === 'PENDIENTE').length;
  if (estado && estado !== 'TODOS') arr = arr.filter(s => s.estado === estado);
  if (asesor) arr = arr.filter(s => s.nombre_reporta === asesor);
  if (fecha_desde) arr = arr.filter(s => (s.timestamp || '') >= fecha_desde);
  if (fecha_hasta) arr = arr.filter(s => (s.timestamp || '') <= fecha_hasta + 'T23:59:59');
  arr = arr.slice().sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  return { ok: true, solicitudes: arr, pendientes, total: arr.length };
}

function _solpResolverDemo(id, patch) {
  const arr = _solpRead();
  const idx = arr.findIndex(s => s.id === id);
  if (idx < 0) return { ok: false, error: 'Solicitud no encontrada.' };
  arr[idx] = { ...arr[idx], ...patch, fecha_resolucion: new Date().toISOString() };
  _solpWrite(arr);
  return { ok: true, solicitud: arr[idx] };
}

// Helper genérico: intenta el endpoint real; si falla o responde algo que no
// es JSON conforme, cae al callback demo. Así el deploy real funciona y el
// preview sin backend sigue siendo demostrable. Una vez que detectamos que el
// backend no responde (timeout/red), marcamos la sesión como "sin backend" y
// las llamadas siguientes van directo al store demo (preview ágil).
let _solpBackendDown = false;
// Modo demo forzado: en el preview (sin sesión real) no queremos tocar ni
// contaminar el backend en producción. Se activa con ?demo=1 o ?preview=… en
// la URL, o con localStorage an_solp_demo=1. En producción (sin flag) se usan
// los endpoints reales del Apps Script v4.35.0.
const _solpDemoForced = (() => {
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('demo') === '1' || q.get('preview')) return true;
    return localStorage.getItem('an_solp_demo') === '1';
  } catch (_) { return false; }
})();
async function _solpFetch(realCall, demoCall) {
  if (_solpDemoForced || _solpBackendDown) return demoCall();
  try {
    const d = await realCall();
    if (d && typeof d === 'object' && (d.ok === true || d.ok === false)) return d;
    throw new Error('respuesta no conforme');
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.name === 'TypeError')) _solpBackendDown = true;
    return demoCall();
  }
}

// POST al Apps Script con timeout: si el backend no responde a tiempo (p. ej.
// en el preview sin red), abortamos para caer rápido al store demo.
async function _solpPost(fn, payload, ms = 3500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    // FIX-ROUTING-POST-APPS-SCRIPT-001: el Apps Script enruta por e.parameter.fn,
    // así que el ?fn= DEBE conservarse en la URL (sin él → "Función POST no
    // reconocida"). Sigue siendo POST text/plain; token y datos viajan en el body.
    const res = await fetch(`${APPS_SCRIPT_URL}?fn=${encodeURIComponent(fn)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn, token: getSessionToken(), ...payload }),
      signal: ctrl.signal,
    });
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function reportarPago(body) {
  return _solpFetch(() => _solpPost('reportarPago', body), () => _solpReportarDemo(body));
}

async function getSolicitudesPago(filtros = {}) {
  return _solpFetch(() => _solpPost('getSolicitudesPago', filtros), () => _solpListarDemo(filtros));
}

async function marcarSolicitudAplicada({ id, admin_nombre }) {
  return _solpFetch(() => _solpPost('marcarSolicitudAplicada', { id, admin_nombre }),
    () => _solpResolverDemo(id, { estado: 'APLICADO', admin_nombre }));
}

async function rechazarSolicitudPago({ id, admin_nombre, motivo }) {
  return _solpFetch(() => _solpPost('rechazarSolicitudPago', { id, admin_nombre, motivo }),
    () => _solpResolverDemo(id, { estado: 'RECHAZADO', admin_nombre, motivo_rechazo: motivo || '' }));
}

// ── Cancelación de prospectos con auditoría — Fase 3.6 ──────────────────────
// Cancelar NO elimina: marca el prospecto con motivo + quién + cuándo. El
// vendedor lo deja de ver (getDashboardVentas filtra CANCELADO); el admin lo
// sigue viendo con badge rojo. En demo guardamos el corte en localStorage para
// que el admin lo refleje sin tocar el backend real.
const CANCEL_KEY = 'an_cancelados_demo';
function _cancRead() { try { return JSON.parse(localStorage.getItem(CANCEL_KEY) || '{}') || {}; } catch (_) { return {}; } }
function _cancWrite(o) { try { localStorage.setItem(CANCEL_KEY, JSON.stringify(o)); } catch (_) {} return o; }
function _cedDig(v) { return String(v == null ? '' : v).replace(/\D/g, ''); }
function _cancelarDemo({ cedula, cancelado_por, motivo }) {
  const o = _cancRead();
  o[_cedDig(cedula)] = {
    cancelado_por: cancelado_por || '',
    cancelado_fecha: new Date().toISOString().slice(0, 10),
    cancelado_motivo: motivo || '',
  };
  _cancWrite(o);
  return { ok: true, etapa_anterior: 'LEAD', cancelado_por: cancelado_por || '', cancelado_fecha: o[_cedDig(cedula)].cancelado_fecha };
}
async function cancelarProspecto(body) {
  return _solpFetch(() => _solpPost('cancelarProspecto', body), () => _cancelarDemo(body));
}
function getCanceladosDemo() { return _cancRead(); }

// ── Gestión de becas — Fase 3.8 ────────────────────────────────────────────
// Becas dinámicas (CONFIG_BECAS, backend v4.37.0). El admin las crea/edita
// desde el campus, con % por rubro, cupo, vigencia y visibilidad pública.
// Regla del sistema: una beca NUNCA se combina (ni con CONAPE ni con otra).
// En modo demo, todo el CRUD vive en localStorage — nunca toca la hoja real.
const BECAS_KEY = 'an_becas_demo';
function _becaSlug(nombre) {
  return String(nombre || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'BECA_' + Date.now().toString(36).toUpperCase();
}
function _becaHoy() { return new Date().toISOString().slice(0, 10); }
function _becaVigente(b) {
  const hoy = _becaHoy();
  if (b.fecha_inicio && hoy < b.fecha_inicio) return false;
  if (b.fecha_fin && hoy > b.fecha_fin) return false;
  return true;
}
function _becaNorm(b) {
  const cupoTotal = Number(b.cupo_total) || 0;
  const cupoUsado = Number(b.cupo_usado) || 0;
  return {
    ...b,
    activa: !!b.activa,
    visible_inscripcion: !!b.visible_inscripcion,
    vigente: _becaVigente(b),
    cupo_total: cupoTotal,
    cupo_usado: cupoUsado,
    cupo_disponible: cupoTotal ? Math.max(0, cupoTotal - cupoUsado) : 0,
    pct_matricula: Number(b.pct_matricula) || 0,
    pct_cuota: Number(b.pct_cuota) || 0,
    pct_certificado: Number(b.pct_certificado) || 0,
    pct_titulo: Number(b.pct_titulo) || 0,
    compatible_ina: b.compatible_ina !== false,
    compatible_sin_ina: b.compatible_sin_ina !== false,
  };
}
function _becasSeed() {
  return [
    { id: 'IMPACTA', nombre: 'Beca Impacta', descripcion: 'Descuento del 25% en matrícula y cuotas para la comunidad Impacta.',
      activa: true, visible_inscripcion: true, cupo_total: 100, cupo_usado: 12,
      pct_matricula: 25, pct_cuota: 25, pct_certificado: 0, pct_titulo: 0,
      compatible_ina: true, compatible_sin_ina: true, fecha_inicio: '', fecha_fin: '',
      creado_por: 'SISTEMA', notas: 'Beca histórica. Auto-corregida a 25% en v4.37.0.', f_creada: '2026-01-15 09:00:00' },
    { id: 'MUJER', nombre: 'Beca Mujer', descripcion: 'Descuento del 50% en matrícula y cuotas para mujeres.',
      activa: true, visible_inscripcion: true, cupo_total: 100, cupo_usado: 28,
      pct_matricula: 50, pct_cuota: 50, pct_certificado: 0, pct_titulo: 0,
      compatible_ina: true, compatible_sin_ina: true, fecha_inicio: '', fecha_fin: '',
      creado_por: 'SISTEMA', notas: '', f_creada: '2026-01-15 09:00:00' },
    { id: 'CONVENIO_MICROFINANZAS', nombre: 'Convenio MicroFinanzas', descripcion: '20% en matrícula y cuotas para empleados del convenio.',
      activa: true, visible_inscripcion: false, cupo_total: 50, cupo_usado: 3,
      pct_matricula: 20, pct_cuota: 20, pct_certificado: 0, pct_titulo: 0,
      compatible_ina: true, compatible_sin_ina: false, fecha_inicio: '2026-06-01', fecha_fin: '2026-12-31',
      creado_por: 'Administrador Demo', notas: 'Acordado internamente. Asignación manual.', f_creada: '2026-06-01 11:20:00' },
    { id: 'VERANO_2025', nombre: 'Promo Verano 2025', descripcion: 'Promoción de temporada — matrícula gratis.',
      activa: false, visible_inscripcion: false, cupo_total: 30, cupo_usado: 30,
      pct_matricula: 100, pct_cuota: 0, pct_certificado: 0, pct_titulo: 0,
      compatible_ina: true, compatible_sin_ina: true, fecha_inicio: '2025-12-01', fecha_fin: '2026-02-28',
      creado_por: 'Administrador Demo', notas: 'Campaña cerrada. Cupo agotado.', f_creada: '2025-11-20 10:00:00' },
  ];
}
function _becasRead() {
  try {
    const raw = localStorage.getItem(BECAS_KEY);
    if (raw === null) { const seed = _becasSeed(); localStorage.setItem(BECAS_KEY, JSON.stringify(seed)); return seed; }
    return JSON.parse(raw) || [];
  } catch (_) { return _becasSeed(); }
}
function _becasWrite(arr) { try { localStorage.setItem(BECAS_KEY, JSON.stringify(arr)); } catch (_) {} return arr; }

function _getBecasDemo(filtros = {}) {
  let arr = _becasRead().map(_becaNorm);
  if (filtros.solo_activas) arr = arr.filter(b => b.activa);
  if (filtros.solo_visibles) arr = arr.filter(b => b.visible_inscripcion && b.activa && b.vigente);
  if (filtros.programa) {
    const ina = /^ina$/i.test(filtros.programa);
    arr = arr.filter(b => ina ? b.compatible_ina : b.compatible_sin_ina);
  }
  return { ok: true, becas: arr };
}
function _crearBecaDemo(body) {
  const arr = _becasRead();
  let id = _becaSlug(body.nombre);
  if (arr.some(b => b.id === id)) id = id + '_' + Date.now().toString(36).toUpperCase().slice(-3);
  const reg = {
    id, nombre: body.nombre || 'Beca', descripcion: body.descripcion || '',
    activa: true, visible_inscripcion: body.visible_inscripcion !== false,
    cupo_total: Number(body.cupo_total) || 0, cupo_usado: 0,
    pct_matricula: Number(body.pct_matricula) || 0, pct_cuota: Number(body.pct_cuota) || 0,
    pct_certificado: Number(body.pct_certificado) || 0, pct_titulo: Number(body.pct_titulo) || 0,
    compatible_ina: body.compatible_ina !== false, compatible_sin_ina: !!body.compatible_sin_ina,
    fecha_inicio: body.fecha_inicio || '', fecha_fin: body.fecha_fin || '',
    creado_por: body.creado_por || 'admin', notas: body.notas || '',
    f_creada: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };
  _becasWrite([...arr, reg]);
  return { ok: true, id, beca: _becaNorm(reg) };
}
function _editarBecaDemo(body) {
  const arr = _becasRead();
  const i = arr.findIndex(b => b.id === body.id);
  if (i < 0) return { ok: false, error: 'Beca no encontrada.' };
  const { id, ...patch } = body;
  arr[i] = { ...arr[i], ...patch };
  _becasWrite(arr);
  return { ok: true, beca: _becaNorm(arr[i]) };
}
function _toggleBecaDemo(id, field, value) {
  const arr = _becasRead();
  const i = arr.findIndex(b => b.id === id);
  if (i < 0) return { ok: false, error: 'Beca no encontrada.' };
  arr[i] = { ...arr[i], [field]: !!value };
  _becasWrite(arr);
  return { ok: true, beca: _becaNorm(arr[i]) };
}

async function getBecas(filtros = {}) {
  return _solpFetch(() => _solpPost('getBecas', filtros), () => _getBecasDemo(filtros));
}
async function crearBeca(body) {
  return _solpFetch(() => _solpPost('crearBeca', body), () => _crearBecaDemo(body));
}
async function editarBeca(body) {
  return _solpFetch(() => _solpPost('editarBeca', body), () => _editarBecaDemo(body));
}
async function cambiarBecaActivo({ id, activo }) {
  return _solpFetch(() => _solpPost('cambiarBecaActivo', { id, activo }), () => _toggleBecaDemo(id, 'activa', activo));
}
async function cambiarBecaVisibilidad({ id, visible }) {
  return _solpFetch(() => _solpPost('cambiarBecaVisibilidad', { id, visible }), () => _toggleBecaDemo(id, 'visible_inscripcion', visible));
}

// ── Calendario de matrículas por día — Fase 3.7 ─────────────────────────────
// Cuántas matrículas (pago B1 aplicado) hizo cada vendedor cada día de la
// semana. Vendedor ve solo su fila; admin ve a todos + tendencia de 8 semanas.
// En demo (?demo/?preview) usamos mock determinista; en producción pegamos al
// endpoint real y, si falla, propagamos el error (sin fallback silencioso).
const CAL_DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const CAL_ASESORES = ['ASESORA DEMO 1', 'ASESOR DEMO 2'];
const CAL_LUNES_ACTUAL = '2026-06-01';   // lunes de la "semana actual" en demo
function _calFmt(dt) { return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`; }
function _calParse(iso) { const [y, m, d] = String(iso).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); }
function _calMonday(iso) {
  const dt = _calParse(iso || CAL_LUNES_ACTUAL);
  const dow = (dt.getDay() + 6) % 7;       // 0 = lunes
  dt.setDate(dt.getDate() - dow);
  return _calFmt(dt);
}
function _calAdd(iso, n) { const dt = _calParse(iso); dt.setDate(dt.getDate() + n); return _calFmt(dt); }
function _calWeekIdx(lunes) {
  return Math.round((_calParse(lunes) - _calParse(CAL_LUNES_ACTUAL)) / (7 * 86400000));
}
function _calHash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function _calPorDia(lunes, asesor) {
  const wi = _calWeekIdx(lunes);
  // Semana actual: coherente con el caso de Deborah (pagó viernes 5-jun).
  if (wi === 0 && /ASESORA DEMO 1/i.test(asesor)) return { L: 0, M: 0, X: 0, J: 0, V: 1, S: 0, D: 0 };
  const out = {};
  CAL_DIAS.forEach(d => {
    const h = _calHash(`${lunes}|${asesor}|${d}`);
    let v = (h % 100) < 38 ? 0 : (h % 5);           // ~38% días en cero
    if ((d === 'S' || d === 'D') && (h % 100) < 72) v = 0;  // fines de semana más livianos
    out[d] = v;
  });
  return out;
}
function _calMock(body = {}) {
  const lunes = _calMonday(body.semana_inicio || CAL_LUNES_ACTUAL);
  const filtro = body.asesor_filtro ? String(body.asesor_filtro) : '';
  let lista = CAL_ASESORES;
  if (filtro) {
    const match = CAL_ASESORES.find(a => a.toLowerCase() === filtro.toLowerCase());
    lista = [match || filtro.toUpperCase()];
  }
  const datos_por_asesor = lista.map(a => {
    const pd = _calPorDia(lunes, a);
    return { asesor: a, por_dia: pd, total: CAL_DIAS.reduce((s, d) => s + pd[d], 0) };
  });
  const total_dia = {};
  CAL_DIAS.forEach(d => { total_dia[d] = datos_por_asesor.reduce((s, x) => s + x.por_dia[d], 0); });
  const total_semana = CAL_DIAS.reduce((s, d) => s + total_dia[d], 0);
  const out = {
    ok: true, semana_inicio: lunes, semana_fin: _calAdd(lunes, 6),
    es_semana_actual: lunes === CAL_LUNES_ACTUAL, dias_orden: CAL_DIAS.slice(),
    datos_por_asesor, total_dia, total_semana,
  };
  if (body.con_tendencia) {
    const tend = [];
    for (let i = 7; i >= 0; i--) {
      const wl = _calAdd(lunes, -7 * i);
      const tpa = {}; let ts = 0;
      CAL_ASESORES.forEach(a => { const pd = _calPorDia(wl, a); const t = CAL_DIAS.reduce((s, d) => s + pd[d], 0); tpa[a] = t; ts += t; });
      tend.push({ semana_inicio: wl, total_por_asesor: tpa, total_semana: ts });
    }
    out.tendencia_8s = tend;
  }
  return out;
}
async function getCalendarioMatriculas(body = {}) {
  if (_solpDemoForced) return _calMock(body);
  // Producción: pegamos al endpoint real. Si falla, el error sube al caller
  // (que muestra "reintentar"); NO caemos a mock en silencio.
  // FIX-ROUTING-POST-APPS-SCRIPT-001: POST text/plain conservando ?fn= en la URL
  // (el backend enruta por e.parameter.fn). Sigue siendo POST (no GET) y el token
  // NO va en la URL: token y datos viajan en el body. Mismo shape de respuesta.
  const res = await fetch(`${APPS_SCRIPT_URL}?fn=getCalendarioMatriculas`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn: 'getCalendarioMatriculas', token: getSessionToken(), ...body }),
  });
  return await res.json();
}

// ── Sesión: fuente única de verdad ──────────────────────────────────────
// TODO el frontend lee la sesión únicamente con getSesion(). No hay
// claves sueltas (sessionStorage.nombre, sessionStorage.cedula, etc.).
// Devuelve el objeto parseado de sessionStorage.an_usuario o null si no
// hay sesión / el JSON está corrupto / falta rol.
function getSesion() {
  try {
    const raw = sessionStorage.getItem('an_usuario');
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (!u || typeof u !== 'object' || !u.rol) return null;
    return u;
  } catch (_) {
    return null;
  }
}

// Reemplaza la sesión activa (la usa el "Modo prueba" del superadmin
// para transformarse en otra identidad, y también para restaurar la
// sesión original al salir de modo prueba).
//
// SEC-003A: el objeto de sesión ahora puede incluir `token` y `expira`
// (devueltos por iniciarSesion). No hay tratamiento especial: se guardan
// como cualquier otro campo dentro de an_usuario en sessionStorage. NUNCA
// en localStorage ni en cookies.
function setSesion(u) {
  try {
    if (!u) sessionStorage.removeItem('an_usuario');
    else    sessionStorage.setItem('an_usuario', JSON.stringify(u));
  } catch (_) {}
}

// ── SEC-003A: token de sesión ────────────────────────────────────────────
// Devuelve el token de la sesión actual (string) o '' si no hay sesión /
// token. El token vive dentro de an_usuario (sessionStorage), nunca suelto
// ni en localStorage.
function getSessionToken() {
  const u = getSesion();
  return (u && typeof u.token === 'string') ? u.token : '';
}

// ── DOCENTE-002-A: grupo activo del docente ──────────────────────────────
// Separa "grupos asignados" (an_usuario.grupos, lista completa) del "grupo
// activo" elegido para trabajar (an_usuario.grupoActivo). Las pantallas
// operativas docentes (Asistencia, Calificar, Materiales, Calendario) deben
// usar ESTE helper en vez de grupos[0].
//   1) si existe sesion.grupoActivo → lo devuelve.
//   2) si no → primer grupo asignado (fallback seguro, compat sesiones viejas).
//   3) si no hay grupos → ''.
function normalizarGrupoDocenteValor(v) {
  if (!v) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'object') {
    return String(
      v.code || v.cod_grupo || v.codigo_grupo || v.grupo || v.codigo || v.id || ''
    ).trim();
  }
  return String(v || '').trim();
}

function getGrupoActivoDocente() {
  const u = getSesion();
  if (!u) return '';
  const activo = normalizarGrupoDocenteValor(u.grupoActivo);
  if (activo) return activo;
  if (Array.isArray(u.grupos) && u.grupos.length) {
    const primero = normalizarGrupoDocenteValor(u.grupos[0]);
    if (primero) return primero;
  }
  return normalizarGrupoDocenteValor(u.grupo);
}

// Cambia el grupo activo conservando TODOS los demás datos de la sesión
// (grupos asignados incluidos). Sincroniza `grupo` con el activo por
// compatibilidad y avisa a la app con 'an:session-changed' para que las
// vistas que dependen de la sesión se refresquen. NO toca el backend.
function setGrupoActivoDocente(codGrupo) {
  const u = getSesion();
  const limpio = normalizarGrupoDocenteValor(codGrupo);
  if (!u || !limpio) return;
  setSesion({ ...u, grupoActivo: limpio, grupo: limpio });
  try { window.dispatchEvent(new Event('an:session-changed')); } catch (_) {}
}

// Valida la sesión contra el backend (Apps Script v4.38.0, fn=validarSesion).
// NO redirige automáticamente todavía: solo devuelve la respuesta del backend
// para que el caller decida. Sin token → { ok:false, error:'sesion_requerida' }.
async function validarSesionServidor() {
  const token = getSessionToken();
  if (!token) return { ok: false, error: 'sesion_requerida' };
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn: 'validarSesion', token }),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'Error de conexión: ' + e.message };
  }
}

// Cierra la sesión en el backend (fn=cerrarSesion) y SIEMPRE limpia la
// sesión local al final, aunque la red falle. No lanza errores que puedan
// bloquear el logout.
async function cerrarSesionServidor() {
  const token = getSessionToken();
  try {
    if (token) {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ fn: 'cerrarSesion', token }),
      });
    }
  } catch (_) {
    // Ignoramos cualquier fallo de red: el logout local debe completarse.
  } finally {
    setSesion(null);
  }
  return { ok: true };
}

// ── Data: estructura del programa (NO datos personales) ──────────────────
// Regla absoluta: cero datos inventados de estudiantes en producción.
// Aquí solo viven constantes ESTRUCTURALES (niveles del programa, colores).
// Todo dato de persona, nota, pago, asistencia, mensaje, etc.
// debe venir del Apps Script (window.useEstudiante / fetch directo).

const LEVELS = [
  { id: 'b1', code: 'B1', name: 'Básico I',     book: 'Interchange Intro', color: '#E5A823' },
  { id: 'b2', code: 'B2', name: 'Básico II',    book: 'Interchange 1',     color: '#E8372A' },
  { id: 'i1', code: 'I1', name: 'Intermedio I', book: 'Interchange 2',     color: '#2B7FC1' },
  { id: 'i2', code: 'I2', name: 'Intermedio II',book: 'Interchange 3',     color: '#4CAF50' },
];

// Estructura de precios — antes había montos hardcodeados (50000/85000/18000)
// que no corresponden a la realidad. Ahora los precios vienen del servidor
// (getGrupoInfo / getGruposDisponibles → precio_cuota, precio_matricula,
// precio_certificado, precio_titulo desde la hoja GRUPOS).
//
// Mantenemos el export como `null` para que cualquier acceso accidental
// (PRECIOS.matricula) tire un error obvio en consola en vez de mostrar
// un monto inventado al usuario.
const PRECIOS = null;

// ── nombreAmable(nombreCompleto) ──────────────────────────────────────────
// Regla ÚNICA para mostrar el nombre del usuario en los 3 paneles.
// Los nombres vienen del backend en formato APELLIDO APELLIDO NOMBRE[ ...]
// (ej. "ALVAREZ GONZALEZ JOHN PAUL"). Devolvemos el primer nombre de pila
// capitalizado (ej. "John"). Para nombres de 1–2 tokens caemos al primero
// (típico cuando alguien se registró como "Emily" o "John Doe").
function nombreAmable(nombreCompleto) {
  if (!nombreCompleto || typeof nombreCompleto !== 'string') return '';
  const tokens = nombreCompleto.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return '';
  const pick = tokens[2] || tokens[0];
  return pick.charAt(0).toUpperCase() + pick.slice(1).toLowerCase();
}

// ── STUDENT-CONTACT-ADMIN-002: contactos DINÁMICOS por área desde el backend.
// getContactoCampus(est, usr, tipo) resuelve el contacto del ÁREA pedida
// (academico / cobros / administracion / ventas) leyendo
// getEstudiante.contactos_campus o los alias contacto_<area>. NUNCA usa el
// teléfono propio del estudiante y NUNCA inventa un número. Rechaza placeholders
// (números de relleno, dígitos repetidos, secuencias…). Si no llega un número
// real → { disponible:false } y la UI muestra el estado honesto.
const _AN_MSG_CONTACTO = {
  academico:      'Necesito ayuda con una consulta académica de mi campus virtual.',
  cobros:         'Necesito ayuda con mi estado de cuenta del campus virtual.',
  administracion: 'Necesito ayuda con una consulta administrativa del campus virtual.',
  ventas:         'Necesito ayuda con una consulta comercial o de matrícula.',
};
const _AN_TEL_PLACEHOLDERS = new Set([
  '00000000', '000000000', '12345678', '50612345678',
]);
function _anNormalizarTel(raw) {
  if (raw == null) return '';
  let d = String(raw).replace(/[^\d]/g, '');
  if (d.startsWith('00')) d = d.slice(2); // prefijo internacional 00
  return d;
}
function _anEsPlaceholderTel(d) {
  if (!d) return true;
  if (_AN_TEL_PLACEHOLDERS.has(d)) return true;
  if (/^(\d)\1+$/.test(d)) return true;                 // todos los dígitos iguales
  const local = d.replace(/^506/, '');
  // Rechaza la familia de placeholders 8888-xxxx de relleno y 1234-5678.
  if (local === ('8888' + '1234') || local === '12345678') return true;
  if (/^8888(.)\1\1\1?$/.test(local)) return true;       // 8888 + repetidos
  return false;
}
function getContactoCampus(est, usr, tipo) {
  tipo = tipo || 'administracion';
  est = (est && typeof est === 'object') ? est : {};
  usr = (usr && typeof usr === 'object') ? usr : {};
  // contactos_campus puede venir en est o en la sesión (usr).
  const cc = Object.assign({}, (usr.contactos_campus || {}), (est.contactos_campus || {}));
  // Resolución por área: objeto contactos_campus.<area> → alias contacto_<area>.
  let raw = null;
  if (tipo === 'cobros') {
    raw = cc.cobros || est.contacto_cobros || usr.contacto_cobros || null;
  } else if (tipo === 'academico') {
    raw = cc.academico || est.contacto_academico || usr.contacto_academico || null;
  } else if (tipo === 'ventas') {
    raw = cc.ventas || est.contacto_ventas || usr.contacto_ventas
       || cc.supervisor_ventas || est.contacto_supervisor_ventas || usr.contacto_supervisor_ventas || null;
  } else { // administracion (default)
    raw = cc.administracion || est.contacto_administracion || usr.contacto_administracion
       || est.contacto_admin || usr.contacto_admin || null;
  }
  // El contacto puede ser objeto {nombre,telefono,whatsapp} o un string (teléfono).
  let nombre = '', telRaw = '';
  if (raw && typeof raw === 'object') {
    nombre = String(raw.nombre || raw.admin_nombre || raw.responsable || '').trim();
    telRaw = String(raw.whatsapp || raw.telefono || raw.tel || raw.celular || '').trim();
  } else if (typeof raw === 'string') {
    telRaw = raw.trim();
  }
  const d = _anNormalizarTel(telRaw);
  let valido = !!d && !_anEsPlaceholderTel(d);
  // NUNCA usar el teléfono propio del estudiante como contacto.
  const telEst = _anNormalizarTel(est.WHATSAPP || est.whatsapp || est.TELEFONO || est.telefono);
  if (valido && telEst) {
    const a = d.replace(/^506/, ''), b = telEst.replace(/^506/, '');
    if (a && a === b) valido = false;
  }
  const whatsappTel = valido ? (d.length === 8 ? '506' + d : d) : '';
  let whatsappUrl = '';
  if (valido && whatsappTel) {
    const primer = nombreAmable(est.NOMBRE || est.nombre || usr.nombre || '');
    const intro = primer
      ? `Hola, soy ${primer}, estudiante de Academia Norteamericana.`
      : 'Hola, soy estudiante de Academia Norteamericana.';
    const cuerpo = _AN_MSG_CONTACTO[tipo] || _AN_MSG_CONTACTO.administracion;
    whatsappUrl = `https://wa.me/${whatsappTel}?text=${encodeURIComponent(intro + ' ' + cuerpo)}`;
  }
  return { disponible: valido, tipo, nombre: nombre || '', telefono: valido ? telRaw : '', whatsappTel, whatsappUrl };
}

// Compat STUDENT-CONTACT-ADMIN-001: alias hacia el área de administración.
function getContactoAdministracion(est, usr) {
  return getContactoCampus(est, usr, 'administracion');
}

Object.assign(window, {
  LEVELS, PRECIOS,
  nombreAmable,
  getContactoCampus, getContactoAdministracion,
  APPS_SCRIPT_URL,
  getSesion, setSesion,
  getSessionToken, validarSesionServidor, cerrarSesionServidor,
  getGrupoActivoDocente, setGrupoActivoDocente,
  fetchCalendarioDocente, fetchTareasPendientesDocente,
  fetchEstudiantesParaCierre, postCerrarLeccionCompleta,
  fetchDocentesAtrasados,
  fetchAsignarCobertura,
  fetchMaterialLeccion,
  fetchLeccionCerradaDetalle,
  fetchEditarRetroPCCerrada,
  fetchEditarAsistenciaNotaCerrada,
  fetchAuditoriaAcademicaGrupo,
  fetchSolicitarSuspension,
  fetchGetSolicitudesSuspension,
  fetchResolverSolicitudSuspension,
  reportarPago, getSolicitudesPago, marcarSolicitudAplicada, rechazarSolicitudPago,
  cancelarProspecto, getCanceladosDemo,
  getCalendarioMatriculas,
  getBecas, crearBeca, editarBeca, cambiarBecaActivo, cambiarBecaVisibilidad,
});
