# F98.4-Z6-CS21A113 — Resumen Académico integral del estudiante

## Objetivo

Agregar al menú del estudiante una vista única, elegante y de solo lectura que consolide el expediente académico sin sustituir los módulos oficiales existentes.

La referencia funcional fue el registro académico presentado al INA: datos del curso, notas, asistencia de las 32 lecciones, Club I CAN, Progress Check y retroalimentación. El diseño del archivo de referencia no se replica; únicamente se conserva la idea de consolidación.

## Integración frontend

Archivos vigentes:

- `src/student_academic_summary_core_cs21a113.js`
- `src/student_academic_summary_dom_cs21a113.js`
- `src/student_academic_summary_runtime_cs21a113b.js`
- `styles/student_academic_summary_cs21a113.css`
- `campus.html`

El runtime agrega `Resumen Académico` después de `Mi Campus` para estudiantes con matrícula académica. No se muestra a usuarios de prematrícula.

La vista consume los endpoints protegidos `getPortalEstudianteCompleto` y `getMisNotasF921`. No crea ni modifica hojas, notas, asistencia, comentarios o pagos.

## Contenido

- Selector de B1, B2, I1 e I2.
- Datos del estudiante, grupo, docente y horario.
- Acumulado oficial del nivel.
- Componentes orales, escritos, Social Skill e I CAN cuando corresponde.
- Asistencia de las 32 lecciones.
- Asistencia de las 16 sesiones de Club I CAN.
- Ocho Progress Check en lecciones 04, 08, 13, 16, 21, 24, 28 y 30.
- Retroalimentación docente reciente.
- Accesos a las vistas detalladas originales.

## Reglas de cálculo

No se copian porcentajes del documento de referencia. La visual calcula cada porcentaje con el puntaje y máximo oficial del componente.

- Programa INA: 4 orales de 15, 2 escritos de 5, Social Skill de 10 e I CAN de 20.
- Programa SIN_INA: 4 orales de 15, 2 escritos de 15 y Social Skill de 10.

El estado y la nota final oficial del nivel tienen prioridad cuando ya existen en el expediente.

## Backend demo

El archivo completo CS21A113 añade una normalización exclusiva para alumnos demo: corrige máximos de escritos INA e incorpora I CAN por nivel. Los estudiantes reales permanecen intactos y no se escribe en hojas.
