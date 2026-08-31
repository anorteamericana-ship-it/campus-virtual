# CS21A198B · SEC-004 · Matrículas preview realmente solo lectura

Fecha: 2026-08-31
Base exacta: PR #216 / `fix/sec004-real-session-demo-isolation-cs21a198` / `3dbee801de4e6e28bbe14ce7bf2a8e5c9422a0e8`

## Hallazgo

`src/matriculas.jsx` define `MAT_DEMO` mediante `?demo=1` / `?preview` y sustituye la lista real de prospectos por `DEMO_PROSPECTOS_MAT`.

Sin embargo, el modo preview no era una frontera completa:
- el wizard todavía consultaba `getGruposDisponibles` real;
- `confirmar()` podía llamar `actualizarEstatus` real;
- la tabla podía abrir modales operativos de ficha, prospecto, proforma, CONAPE y generación de matrícula usando identificadores provenientes de la lista demo.

Esto mezclaba una UI marcada como demostración con backend real.

## Política del corte

Cuando `MAT_DEMO=true`:
- se conserva la lista/indicadores demo;
- el wizard no consulta grupos reales;
- confirmar matrícula falla cerrado antes de cualquier POST;
- los botones operativos permanecen visibles para mostrar la UX, pero la acción informa que el preview es solo lectura;
- ningún modal operativo se monta, incluso si quedara un estado residual;
- no se envían identificadores demo a ficha/proforma/CONAPE/generación de matrícula reales.

Fuera de preview, endpoints y componentes operativos permanecen exactamente disponibles.

## No cambia

No se modifican Apps Script, endpoints, payloads, roles, grupos, reglas académicas, pagos, CONAPE, proformas, ACL de Drive, `main` ni producción.

## Evidencia requerida

- guard CS21A198B;
- regresión CS21A198;
- regresión CS21A197;
- diff hygiene contra #216.

## Límite

Este corte endurece exclusivamente la superficie `matriculas.jsx`. SEC-004 server-side continúa pendiente de Issue #111 + E2 de identidad demo.
