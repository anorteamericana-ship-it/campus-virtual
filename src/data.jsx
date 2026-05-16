/* global window */
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

Object.assign(window, { LEVELS, PRECIOS });
