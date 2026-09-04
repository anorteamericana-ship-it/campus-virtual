# CS21A210H · Cambio de estatus Admin · errores seguros sobre punta vigente

Fecha: 2026-08-31 · Costa Rica

## Base exacta

- Base: PR #224 / `fix/shared-error-state-console-only-cs21a210f`
- SHA base: `ff862ce99db561c1711f929ceae99ddc0d9b6f64`
- `src/admin_students_status_fresh_cs21a42.jsx` base blob: `7796905d49a9e894638e630ab609bd7b1d520183`
- `src/admin_students_status_missing_next_cs21a29.jsx` base blob: `ec583437f5212a4f7871a756cbf2e0d975ec9dcc`
- Rama: `fix/admin-status-safe-errors-cs21a210h`

## Hallazgo

El barrido CS21A210G confirmó fugas directas de excepciones en los overrides efectivos de `ModalEstatus`:

- verificación del siguiente nivel publicaba `e.message`;
- guardado publicaba `e.message`;
- la recarga fresca concatenaba `e.message` al copy visible;
- la capa de reversión financiera convertía la excepción cruda a `{ error, mensaje }`, que luego podía mostrarse en el modal.

Además, la UI mostraba el nombre interno `ESTATUS` durante guardado, creación del siguiente nivel y confirmación de reversión.

## Corrección

### `admin_students_status_fresh_cs21a42.jsx`

- frontera `statusSafeUserError()` para errores técnicos;
- detalle técnico únicamente en `console.warn`;
- verificación, guardado y recarga fresca usan fallbacks estables;
- `postRev()` deja de propagar la excepción cruda y devuelve únicamente copy sanitizado;
- copy visible `Guardando en ESTATUS…` → `Guardando cambio académico…`;
- copy de reversión deja de nombrar `ESTATUS`.

### `admin_students_status_missing_next_cs21a29.jsx`

- frontera `status29SafeUserError()`;
- verificación y guardado dejan de publicar `e.message`;
- la creación del siguiente nivel habla de `expediente académico`, no de la estructura interna.

## No cambia

- endpoints;
- payloads;
- token;
- reglas CA/APR/REP/CNV/RI/RJ/PE;
- promoción al siguiente nivel;
- sincronización CONAPE;
- reversión financiera;
- Apps Script;
- Drive/ACL;
- `main`;
- producción.

## QA

El guard `qa_admin_status_safe_errors_cs21a210h.mjs` exige:

- helpers seguros presentes;
- cero sinks directos `e.message` en los puntos corregidos;
- reversión financiera sanitizada antes de llegar a UI;
- copy interno `ESTATUS` retirado de esas superficies;
- endpoints y token preservados;
- scope final exacto de cinco rutas cuando se ejecuta con `--exact-scope`.

El bootstrap se usa únicamente para aplicar las preimágenes exactas y validar el candidato. Después de Actions verde, la rama debe reconstruirse como un único commit directo sobre #224, retirando los artefactos bootstrap antes de abrir PR.

## Evidencia

- E0: source exacto + guard.
- E1: pendiente de bootstrap/Actions y checks del PR.
- E2 autenticado/runtime: NO demostrado.

## Fronteras

- NO PROD
- NO AUTO-MERGE
- NO Apps Script write/push/deploy
- NO Drive ACL changes
- NO material deletions
- NO cambio de `main`
