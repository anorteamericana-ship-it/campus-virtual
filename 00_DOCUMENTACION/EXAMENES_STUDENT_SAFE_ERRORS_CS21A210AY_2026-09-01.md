# CS21A210AY · Exámenes · frontera estudiante con errores seguros

## Base congelada
- PR #250 / `fix/inscripcion-public-safe-errors-cs21a210ax`
- SHA `ed458ff9715338cb2fcd75f9896f2753d8d019b9`
- `src/examenes_bundle.jsx` preimagen `c56642aa4906ab443f54b4aedb5d5d83c417d88a`
- `src/examenes_modes.jsx` preimagen `75ec9cf1be92fee52a45a220ebc7a1aa08e4ccc1`

## Ownership
`modulos/examenes.html` descarga y ejecuta directamente `src/examenes_bundle.jsx`. El bundle declara que fue generado, entre otros sources, desde `src/examenes_modes.jsx`; AY mantiene ambas representaciones sincronizadas. `examenes_modes.jsx` es build source, no entrypoint runtime directo.

## Hallazgo E0
`StudentMode` tenía seis fronteras donde `r.mensaje` / `r.error` arbitrarios podían llegar a `saveMsg` y luego a UI: autoguardado diferido, guardado fallido, envío fallido, heartbeat fallido, intento no enviable e inicio fallido.

## Corrección
`examStudentSafeUserError` conserva el detalle únicamente en consola y devuelve copy estable por contexto, aplicado exactamente a las seis fronteras en build source y bundle runtime.

## Contrato congelado
AY no modifica endpoints, payloads, `attemptId`, respuestas, autosave, temporizador, heartbeat, `can_submit`, auto-submit, preguntas faltantes, scoring, revisión docente/admin ni backend.

## Evidencia
Bootstrap sintético debe demostrar reconstrucción exacta, parse JSX, V3 y regresiones AX/AT/AS. E2 autenticado/runtime: NO.
`BACKEND CURRENT SNAPSHOT UNVERIFIED` continúa vigente. No main, PROD, Apps Script, Drive ACL, merge ni borrado de ramas.
