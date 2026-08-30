# CS21A196 · Suspensiones/Reprogramaciones Admin · acciones seguras

Fecha: 2026-08-29
Base: PR #169 / `fix/admin-master-safe-errors-cs21a195`
Base exacta: `d19c23db4b3b2f99fcdbbe6a50fd5e7b8e2138bb`

## Hallazgos

`src/panel_suspensiones.jsx` tenía dos problemas relacionados:

1. La carga de la cola y los resultados de aprobar/rechazar podían mostrar `r.error`, `res.error` y `e.message` directamente.
2. `handleAprobar` y `handleRechazar` esperaban `fetchResolverSolicitudSuspension` sin `try/catch/finally`. Si la promesa rechazaba por red/runtime, `resolviendo` podía quedar activo y el botón/modal permanecer bloqueado indefinidamente.

## Cambio

- agrega `psuSafeUserError` para conservar mensajes humanos de negocio y ocultar detalles técnicos;
- errores técnicos quedan en consola;
- aprobar/rechazar quedan envueltos en `try/catch/finally`;
- `setResolviendo(null)` se ejecuta siempre;
- ante fallo de red el modal permanece disponible para reintentar una vez liberado el estado busy;
- respuestas `ok:false` conservan el comportamiento previo de cerrar el modal y mostrar un error de negocio seguro.

## No cambia

- `fetchGetSolicitudesSuspension`;
- `fetchResolverSolicitudSuspension`;
- payloads, `accion`, `resuelto_por` ni nota de resolución;
- validaciones de choque/orden/duración;
- mutación de calendario del backend;
- filtrado de la cola;
- Apps Script, Drive o producción.

## Evidencia

E0 automático:
- guard CS21A196;
- regresión CS21A195;
- regresión CS21A194;
- `git diff --check`.

**DRAFT · ERROR/STATE HARDENING ONLY · CALENDAR RULES UNCHANGED · NO PROD · NO AUTO-MERGE**
