# CS21A210A · Admin safe errors sobre punta vigente

Fecha: 2026-08-31 · Costa Rica

## Fuente y base exacta

- Repositorio: `anorteamericana-ship-it/campus-virtual`
- Base: PR #218 · `fix/sec004-admin-preview-readonly-cs21a198c`
- SHA base exacto: `bf06348723aa7b4bf78a634541f26e5601e95fb4`
- Rama candidata: `integration/admin-safe-errors-current-tip-cs21a210a`
- `main` observado al iniciar: `53df524d0a9eab867d3b307b3e633f366af92a63`

## Hallazgo

La punta #218 conserva la línea más nueva de SEC-002/SEC-004, pero cinco superficies Admin permanecían iguales a la base #164 y no incluían correcciones de errores visibles ya validadas en PR #190.

No se integra #190 completo porque contiene una variante anterior de Panel Maestro/SEC-002 que no debe desplazar la línea vigente #209→#218.

## Delta importado, únicamente cinco fuentes

Los siguientes archivos se importan exactamente desde blobs ya validados en #190:

- `src/admin_master_dashboard.jsx` → `76e629e4cff51912f3a0678d05ac570fa7722dc5`
- `src/admin_students_inline_payment_cs21a36.jsx` → `ee54e75659cf0ee84f1f87eccca2c022671dd66d`
- `src/aperturas_admin_cs21a20.jsx` → `6e98a354920f8c3cbe974d7a51864f0ea729a702`
- `src/panel_admin_supervision.jsx` → `c382fcf5b82f26129a8f0eb25a0b05cb82616b77`
- `src/panel_suspensiones.jsx` → `fa966e15b490a70b32205e3ed94a614b2478823f`

Objetivo: mantener el detalle técnico en consola y ofrecer copy estable al operador, sin cambiar las acciones reales de pagos, aperturas, supervisión, suspensiones ni sincronización administrativa.

## Guard

`qa_admin_safe_errors_current_tip_cs21a210a.mjs` verifica:

- semántica de safe-error en las cinco superficies;
- persistencia de las acciones reales relevantes;
- ausencia de mutaciones ACL en los cinco archivos;
- para esta rama, coincidencia exacta con los blobs validados de #190;
- delta limitado a los cinco sources + guard + workflow + este checkpoint;
- cero borrados y cero fuente Apps Script.

El workflow además regresa:

- CS21A191/192 Admin Students;
- CS21A193/194 SEC-002 Admin privado;
- CS21A198/198B/198C SEC-004 preview/session isolation;
- `git diff --check` contra el SHA exacto #218.

## Evidencia y límites

Estado inicial del candidato: **E0 SOURCE PREPARED** hasta que GitHub Actions complete el bootstrap de rama. Si los guards terminan verdes, asciende a **E1 SOURCE/QA GREEN**.

Este corte NO demuestra:

- E2 Admin autenticado;
- compatibilidad del Apps Script QA modular vigente con contratos privados pendientes;
- SEC-004 server-side;
- producción.

Issue #111 continúa como gate de backend/snapshot/E2.

## Fronteras

- NO PROD
- NO AUTO-MERGE
- NO Apps Script write/push/deploy
- NO Drive ACL changes
- NO material deletions
- NO cambio de `main`
