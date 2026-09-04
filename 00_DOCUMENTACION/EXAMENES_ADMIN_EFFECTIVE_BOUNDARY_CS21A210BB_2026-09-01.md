# CS21A210BB · Exámenes · auditoría frontera admin efectiva

Base exacta: PR #253 / `eb397cff1a72c98c39c28479ee973e2e038e999e`.

## Resultado E0

`AdminMode` monta explícitamente `ActivationBackendPanel` y `BackendOperationsPanel`. Ambas superficies conservan una proyección backend→UI cruda por representación:

1. `ActivationBackendPanel`: `r.mensaje || r.error || r.errores.join(...)` llega a `setErr`;
2. `BackendOperationsPanel`: `r.mensaje || r.error` llega a `setErr`.

Como `src/examenes_bundle.jsx` es el runtime efectivo y `src/examenes_modes.jsx` es su build source, existen cuatro representaciones sincronizadas del problema (2 sinks × 2 archivos), pero solo dos fronteras lógicas.

`TeacherBackendReviewPanel` existe en source pero no aparece montado como JSX. Por tanto, no se debe modificar solo para reducir findings del scanner.

## Alcance

Auditoría solamente. No cambia source funcional. Congela los blobs BA:

- `src/examenes_modes.jsx`: `9d86826c3c3d0ac12e4a915d461e9fcc42be3705`
- `src/examenes_bundle.jsx`: `4ee147afe2c06c3318d075b478a47497994a93dc`

## Siguiente corte permitido

Corregir exclusivamente la presentación de error de `ActivationBackendPanel` y `BackendOperationsPanel`, manteniendo sincronizados bundle + build source y preservando endpoints, payloads, permisos y operaciones administrativas.

E0 sí. E1 sujeto a Actions. E2 NO. `BACKEND CURRENT SNAPSHOT UNVERIFIED` vigente. No main, PROD, Apps Script, Drive ACL, merge ni borrado de ramas.
