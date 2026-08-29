# CS21A188 · Copy visible del docente

Fecha: 2026-08-29
Base exacta: PR #159 / `80f1c2bfef693d6dbf81376d6aab5d14c113f4eb`

## Alcance

Después de sanear errores técnicos, quedaron tres textos visibles en `teacher_views.jsx` que no corresponden a una interfaz final limpia:

1. `Elije el grupo que deseas visualizar` — ortografía/registro inconsistente con el voseo usado por el Campus.
2. `No hay grupos En curso asignados.` — expone la etiqueta interna de estado con capitalización de sistema.
3. `Uniendo GRUPOS, ESTATUS, cronograma, asistencia y notas oficiales` — expone nombres internos de fuentes/estructuras.

## Cambio

- `Elegí el grupo que querés visualizar.`
- `No hay grupos activos asignados en este momento.`
- `Preparando estudiantes, cronograma, asistencia y notas oficiales`

## No cambia

Lógica, endpoints, sesión, grupos, filtros, datos, asistencia, notas, Apps Script, Drive ACL ni producción.

Estado esperado: `COPY ONLY · NO LOGIC CHANGE · NO PROD`.
