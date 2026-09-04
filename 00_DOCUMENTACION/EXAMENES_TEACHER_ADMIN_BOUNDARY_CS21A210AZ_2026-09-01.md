# CS21A210AZ · Exámenes · auditoría de frontera docente/admin

## Base congelada
- PR #251 / `fix/examenes-student-safe-errors-cs21a210ay`
- SHA `328afb1b98b29be31cd536b2d60e8dffcf7b6a1b`
- `src/examenes_bundle.jsx` blob `76e4017b73de426530fca6ed09ae6bf76c195cbf`
- `src/examenes_modes.jsx` blob `e9009020f4d081f000205b52028d8907f4b3c8d4`

## Ownership efectivo
`modulos/examenes.html` ejecuta `src/examenes_bundle.jsx`; el bundle declara `src/examenes_modes.jsx` como build source. Cualquier corrección futura de lógica compartida debe mantener ambas representaciones sincronizadas.

## Hallazgo E0
La revisión posterior a AY separa dos fronteras que no deben mezclarse:

### Docente · revisión escrita efectiva
`TeacherWrittenBackendReviewF940` y `TeacherWrittenLiveInbox` tienen **7 sinks backend→UI por archivo** (14 representaciones contando bundle + build source):
1. `examGetAttempt` al abrir una entrega;
2. `examCreateReviewDraft`;
3. `examGetReview` al hidratar la revisión;
4. `examCloseReview`;
5. `examPushReviewToNotas` después del cierre;
6. reintento directo de `examPushReviewToNotas`;
7. `examReviewInbox` en la bandeja del docente.

En todos esos casos `mensaje/error` puede llegar a `setErr`, y `err` se renderiza en `.tch-review-error`, `.rev-live-err` o `.ex-errmsg`. Es una fuga visible efectiva, no solo un finding textual.

### Admin · operaciones de exámenes
`ActivationBackendPanel` y `BackendOperationsPanel` poseen su propio `setResult(...)` que también proyecta `r.mensaje/r.error` a UI. Esa superficie tiene endpoints y permisos distintos y queda **fuera** del siguiente corte funcional para evitar un PR demasiado ancho.

## Recomendación atómica
El siguiente corte funcional debe tratar únicamente los 7 sinks de la frontera docente y mantener sincronizados `examenes_modes.jsx` + `examenes_bundle.jsx`. El detalle crudo debe quedar en consola y la UI recibir copy contextual estable. No tocar todavía `ActivationBackendPanel`/`BackendOperationsPanel`.

## Contrato congelado
Esta auditoría no modifica source funcional. No cambia endpoints, payloads, scoring, revisión, cierre, envío a Mis Notas, permisos, backend, Apps Script, `main`, PROD ni Drive ACL.

E0: confirmado. E1: este guard solo demuestra ownership/preimagen y presencia exacta de la frontera; no demuestra runtime autenticado. E2: NO.
`BACKEND CURRENT SNAPSHOT UNVERIFIED` continúa vigente.
