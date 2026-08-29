# CS21A186 · Sesión docente y asistencia · errores seguros

Fecha: 2026-08-29
Base exacta: PR #157 / `d89797cd9c7613098896b62cd2ccd31cd028b7ee`

## Hallazgo

La superficie de asistencia docente carga de forma lazy `teacher_views.jsx` mediante `att77_bridge.js`.

`postTeacher()` conserva correctamente detalles de diagnóstico internos como respuesta inválida, error backend o HTTP. El problema estaba después:

- `useTeacherSession()` guardaba directamente `e?.message || String(e)` en `errorGroups`;
- `useTeacherSession()` guardaba directamente `e?.message || String(e)` en `errorPanel`;
- `att77_bridge.js` guardaba directamente `e.message || String(e)` en el error visible;
- el bridge podía mostrar `No se publicó la fuente docente.`;
- el caso sin grupos usaba el fallback visible `APOLLO.GRUPOS`.

`att77_view_shell.jsx` renderiza `d.error`, por lo que esos textos podían llegar a la interfaz del docente.

## Cambio

Se agregan sanitizadores de frontera UI:

- `teacherSessionSafeUserError` en `teacher_views.jsx`;
- `att77SafeUserError` en `att77_bridge.js`.

Fallbacks visibles:
- grupos: `No pudimos cargar tus grupos. Intentá de nuevo.`;
- panel: `No pudimos cargar la información del grupo. Intentá de nuevo.`;
- sin grupos: `No hay grupos activos asignados en este momento.`;
- bridge: `No pudimos preparar el seguimiento académico. Intentá de nuevo.`.

Los detalles técnicos se conservan en consola y dentro de la capa de transporte para diagnóstico.

## No cambia

- Apps Script;
- endpoints;
- token/payload;
- selección de grupo;
- roster;
- asistencia;
- notas;
- cierre/inicio de clase;
- lazy-loading;
- Drive ACL;
- SEC-005.

## QA

El guard exige que desaparezcan las conversiones crudas a UI y que los diagnósticos internos de `postTeacher`/loader sigan presentes.

Estado esperado: `SAFE COPY ONLY · NO BUSINESS LOGIC CHANGE · NO PROD`.
