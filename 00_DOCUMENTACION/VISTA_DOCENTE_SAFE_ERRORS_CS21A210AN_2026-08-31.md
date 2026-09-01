# CS21A210AN · Vista docente · errores seguros en carga

Fecha: 2026-08-31

## Base
- PR #244 / `fix/ventas-calendario-safe-errors-cs21a210al`
- base exacta: `55b629035ae76a448746cb9df72f66db3cdd7987`
- preimagen `src/vista_docente.jsx`: `63c80d004caba982156f5f7ed53c53d1490e7cf7`

## Ownership y hallazgo
`src/app.jsx` carga `src/vista_docente.jsx` tanto en `teacher_views` como en `vista_docente`. CS21A210AM V3 midió **66 hallazgos / 16 archivos** y reportó dos `setError(e.message...)` en el componente raíz `VistaDocente`.

Ambos errores eran visibles porque, cuando no existe calendario cargado, `error` se entrega a `<ErrorState message={error} onRetry={refetch} />`.

## Corrección
Se agrega `vistaDocenteSafeUserError(raw, fallback, context)`:
- detalle original únicamente en `console.warn`;
- carga inicial y refetch muestran `No pudimos cargar tus pendientes. Intentá nuevamente.`;
- ningún `e.message` llega directamente a `setError`.

## Contrato congelado
AN no cambia:
- `leerSesionDocente()`;
- identidad nombre/cédula;
- `fetchCalendarioDocente(idDocente)`;
- `fetchTareasPendientesDocente(idDocente)`;
- wiring `ErrorState` + `refetch`;
- cierre de sesión/redirección;
- modales de cierre de lección y Progress Check;
- asistencia, notas, retroalimentación, históricos ni pendientes;
- endpoints/backend.

El guard revierte exclusivamente helper + dos catches y exige reconstruir exactamente la preimagen `63c80d004caba982156f5f7ed53c53d1490e7cf7`.

## Evidencia
Bootstrap `33455997615`: **SUCCESS completo**:
- preimagen exacta PASS;
- patch exacto PASS;
- parser JSX PASS;
- guard AN/reconstrucción exacta PASS;
- regresión AL PASS;
- regresión AJ PASS;
- diff hygiene PASS;
- scope funcional exacto `src/vista_docente.jsx` PASS.

Source temporal validado: `92c909687d3dddcbcad6065159d7a0fd6e43652a`.
Blob funcional validado: `ec415d0ba2c1b52c56732cc6d09a11e026cbfbd4`.

## Límites
- E0: sí.
- E1 source/QA: sí una vez que punta final y PR estén verdes.
- E2 autenticado/runtime: no demostrado.
- `BACKEND CURRENT SNAPSHOT UNVERIFIED`: vigente.
- Apps Script, Drive ACL, main y PROD: no tocados.

**DRAFT · SOURCE/QA ONLY · TEACHER ACADEMIC LOGIC FROZEN · NO BACKEND WRITE · NO PROD · NO AUTO-MERGE**
