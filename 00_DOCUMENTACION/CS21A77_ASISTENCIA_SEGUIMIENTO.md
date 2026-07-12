# CS21A77 — Centro de seguimiento académico docente

## Alcance

La opción **Gestión Académica → Asistencia** deja de mostrar la visual operativa anterior y se convierte en un panel de seguimiento de solo lectura para docentes.

## Fuente de datos

Reutiliza la misma fuente real de **Mis grupos → Estudiantes · asistencia y notas**:

- grupos actuales del docente;
- roster del grupo;
- lecciones e I CAN ordenados por fecha;
- asistencia consolidada y detalle por actividad;
- comentarios por estudiante y actividad;
- componentes de nota y promedio acumulado.

No crea una segunda base ni recalcula notas oficiales.

## Visual

- selector de grupo;
- indicadores de estudiantes, asistencia, notas y avance;
- gráfico circular y distribución de asistencia;
- señales visuales informativas de seguimiento;
- buscador por nombre, código o cédula;
- ficha individual del estudiante;
- barra azul para navegar por todo, solo lecciones o solo I CAN;
- detalle de presencia/ausencia y comentario por actividad;
- historial de comentarios del curso.

## Aislamiento

El puente envuelve `CronogramaGrupo` únicamente cuando el rol es `teacher` o `docente`. Admin y demás rutas conservan el componente original.

## Archivos

- `campus.html`
- `src/att77_helpers.js`
- `src/att77_widgets.jsx`
- `src/att77_data.jsx`
- `src/att77_view_top.jsx`
- `src/att77_view_detail.jsx`
- `src/att77_view_shell.jsx`
- `src/att77_bridge.js`

## Backend

No modifica `Code.gs`. No escribe asistencia, notas, comentarios, sesiones, pagos, certificados, CONAPE, DATOS ni ESTATUS.

## Estado

- GitHub `main`: implementado.
- Publicación del hosting: pendiente de verificación visual.
- Prueba obligatoria: docente con uno o varios grupos, búsqueda individual, cambio de grupo y navegación TODO/LECCIONES/I CAN.
