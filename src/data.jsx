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

Object.assign(window, {
  LEVELS, PRECIOS,
  APPS_SCRIPT_URL,
  fetchCalendarioDocente, fetchTareasPendientesDocente,
  fetchEstudiantesParaCierre, postCerrarLeccionCompleta,
  fetchDocentesAtrasados,
});
