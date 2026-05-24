/* global window */

// ── Apps Script URL (compartida) ─────────────────────────────────────────
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';

// ── Fetch helpers para VISTA DOCENTE ─────────────────────────────────────
// Ambos endpoints aceptan tanto nombre como cédula en `cod_docente`.
// El nombre es el ID funcional en CALENDARIO_LECCIONES (Apps Script v4.21.5+).

async function fetchCalendarioDocente(nombreOrCedula) {
  if (!nombreOrCedula) return { ok: false, error: 'cod_docente vacío' };
  try {
    const url = `${APPS_SCRIPT_URL}?fn=getCalendarioDocente&cod_docente=${encodeURIComponent(nombreOrCedula)}`;
    const res = await fetch(url);
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'Error de conexión: ' + e.message };
  }
}

async function fetchTareasPendientesDocente(nombreOrCedula) {
  if (!nombreOrCedula) return { ok: false, error: 'cod_docente vacío' };
  try {
    const url = `${APPS_SCRIPT_URL}?fn=getTareasPendientesDocente&cod_docente=${encodeURIComponent(nombreOrCedula)}`;
    const res = await fetch(url);
    return await res.json();
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
    const url = `${APPS_SCRIPT_URL}?fn=getEstudiantesParaCierre`
              + `&cod_grupo=${encodeURIComponent(codGrupo)}`
              + `&nivel=${encodeURIComponent(nivel)}`;
    const res = await fetch(url);
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'Error de conexión: ' + e.message };
  }
}

// ── Supervisión: docentes con lecciones atrasadas (panel admin B1) ───────
// Endpoint pesado (~11 s).  El caller DEBE mostrar spinner.
async function fetchDocentesAtrasados() {
  try {
    const url = `${APPS_SCRIPT_URL}?fn=getDocentesAtrasados`;
    const res = await fetch(url);
    return await res.json();
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
      body: JSON.stringify({ fn: 'asignarCoberturaLeccion', ...payload }),
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
    let url = `${APPS_SCRIPT_URL}?fn=getMaterialLeccion`
            + `&nivel=${encodeURIComponent(nivel)}`
            + `&leccion=${encodeURIComponent(leccion)}`
            + `&riel=${encodeURIComponent(riel)}`
            + `&rol=${encodeURIComponent(rol)}`;
    if (rol === 'student') {
      if (codigo)    url += `&codigo=${encodeURIComponent(codigo)}`;
      if (cod_grupo) url += `&cod_grupo=${encodeURIComponent(cod_grupo)}`;
    }
    const res = await fetch(url);
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'Error de conexión: ' + e.message };
  }
}

// ── Edición SUPERADMIN de lección CERRADA (v4.22.5) ──────────────────────
// Poder restringido. Backend exige confirmacion_superadmin === 'LEONARDO_SI'.
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
    const url = `${APPS_SCRIPT_URL}?fn=getLeccionCerradaDetalle`
              + `&cod_grupo=${encodeURIComponent(cod_grupo)}`
              + `&nivel=${encodeURIComponent(nivel)}`
              + `&leccion=${encodeURIComponent(leccion)}`
              + `&riel=${encodeURIComponent(riel || 'curso')}`;
    const res = await fetch(url);
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'Error de conexión: ' + e.message };
  }
}

async function fetchEditarRetroPCCerrada(payload) {
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        fn: 'editarRetroPCCerrada',
        confirmacion_superadmin: 'LEONARDO_SI',
        ...payload,
      }),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'Error de conexión: ' + e.message };
  }
}

async function fetchEditarAsistenciaNotaCerrada(payload) {
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        fn: 'editarAsistenciaNotaCerrada',
        confirmacion_superadmin: 'LEONARDO_SI',
        ...payload,
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
      body: JSON.stringify({ fn: 'solicitarSuspension', ...payload }),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'Error de conexión: ' + e.message };
  }
}

async function fetchGetSolicitudesSuspension(estado = 'PENDIENTE') {
  try {
    const url = `${APPS_SCRIPT_URL}?fn=getSolicitudesSuspension`
              + `&estado=${encodeURIComponent(estado)}`;
    const res = await fetch(url);
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
      body: JSON.stringify({ fn: 'resolverSolicitudSuspension', ...payload }),
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
      body: JSON.stringify({ fn: 'cerrarLeccionCompleta', ...body }),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'Error de conexión: ' + e.message };
  }
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
function setSesion(u) {
  try {
    if (!u) sessionStorage.removeItem('an_usuario');
    else    sessionStorage.setItem('an_usuario', JSON.stringify(u));
  } catch (_) {}
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

Object.assign(window, {
  LEVELS, PRECIOS,
  nombreAmable,
  APPS_SCRIPT_URL,
  getSesion, setSesion,
  fetchCalendarioDocente, fetchTareasPendientesDocente,
  fetchEstudiantesParaCierre, postCerrarLeccionCompleta,
  fetchDocentesAtrasados,
  fetchAsignarCobertura,
  fetchMaterialLeccion,
  fetchLeccionCerradaDetalle,
  fetchEditarRetroPCCerrada,
  fetchEditarAsistenciaNotaCerrada,
  fetchSolicitarSuspension,
  fetchGetSolicitudesSuspension,
  fetchResolverSolicitudSuspension,
});
