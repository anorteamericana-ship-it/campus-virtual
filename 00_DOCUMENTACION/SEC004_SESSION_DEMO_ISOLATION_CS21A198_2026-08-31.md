# CS21A198 · SEC-004 · aislamiento de demo con sesión real

Fecha: 2026-08-31
Base exacta: PR #213 / `fix/lazy-loader-safe-user-errors-cs21a197` / `196c5376827a3c70273d7e0bf92ab95b882d9de9`

## Hallazgo

`src/data.jsx` mantenía un store demo local para Solicitudes de Pago y superficies relacionadas. El modo demo podía activarse por:

- `?demo=1`;
- `?preview`;
- `localStorage.an_solp_demo=1`.

Las fallas normales de red ya devolvían `ok:false` y no caían automáticamente a demo. Sin embargo, el flag persistente de `localStorage` podía permanecer en un navegador usado posteriormente con una sesión Campus real y convertir operaciones en respuestas locales de éxito sin tocar backend.

Superficies que comparten este gate:

- solicitudes/reportes de pago;
- cancelaciones;
- becas;
- calendario/matrículas.

## Política del corte

- Los previews explícitos por URL se conservan; son una herramienta visible de QA y el shell muestra el banner de modo demostración.
- Cuando existe una sesión Campus, `localStorage.an_solp_demo=1` no puede habilitar el store local.
- Sin sesión, el flag local puede seguir habilitando el preview heredado.
- Una falla de red real continúa devolviendo error y nunca se transforma en éxito demo.
- Las futuras cuentas demo autenticadas deben ser resueltas por la política server-side SEC-004, no por un flag local del navegador.

## No cambia

No se modifican endpoints, payloads, tokens, reglas de pagos, becas, cancelaciones, matrículas, Apps Script, ACL de Drive, `main` ni producción.

## Evidencia requerida

- guard `scripts/qa_sec004_session_demo_isolation_cs21a198.mjs`;
- regresión CS21A197;
- regresión CS21A196;
- regresión SEC-004 outer guard CS21A163;
- `git diff --check` contra la base apilada.

## Límite

Este corte no instala el guard SEC-004 en Apps Script ni demuestra una identidad demo server-side. Esa parte sigue bloqueada por la fuente modular QA actual y la validación E2 correspondiente.
