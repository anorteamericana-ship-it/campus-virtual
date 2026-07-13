# F98.4-Z6-CS21A80 — Calendario académico auditado

CS21A80 corrige el inventario persistente del Calendario académico.

## Fallos corregidos

- Cronograma completo ya no oculta grupos completados por no tener una clase en la semana visible.
- Los horarios se leen como texto visible de GRUPOS para evitar el desfase histórico de horas ancladas en 1899.
- GRUPOS define el inventario y el nivel operativo; CALENDARIO_LECCIONES no puede promover ni eliminar grupos.
- Se deduplican estudiantes CA y eventos exactos.
- Si existen varios ciclos 1–32 para el mismo grupo y nivel, se conserva visualmente el ciclo alineado con FECHA_INICIO oficial, sin borrar filas.
- getFechasGrupo queda en modo de solo lectura y deja de normalizar horas escribiendo durante la consulta.
- El frontend reinicia su caché, deduplica códigos y muestra el código completo de cohorte.

## Resultado esperado

La fuente actual contiene 12 códigos únicos y Cronograma completo debe mostrar los 12 aunque no tengan actividad esa semana.

## Archivos

- `campus.html`
- `src/calendar_integrity_cs21a80.js`
- Backend completo: `Code_F98_4_Z6_CS21A80_CALENDARIO_AUDITADO.gs`

## Validación

Se validó sintaxis, selección de los 12 grupos, horarios 09:00–16:00 y 18:00–21:00, deduplicación y el ciclo duplicado del grupo 0425 en I2.

La implementación pública de Apps Script debe publicarse como nueva versión antes de verificar producción.
