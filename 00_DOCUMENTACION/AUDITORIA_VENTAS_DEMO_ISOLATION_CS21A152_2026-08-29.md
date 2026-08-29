# CS21A152 · Aislamiento DEMO/QA en Ventas

Fecha: 2026-08-29 · Costa Rica

Base exacta: `main` `53df524d0a9eab867d3b307b3e633f366af92a63`
Rama: `feature/ventas-demo-isolation-cs21a152`

## Objetivo

Evitar que datos o caminos QA se mezclen con la operación real del panel de Ventas sin tocar Apps Script, ACL, pagos ni producción.

## Cambios

1. `src/ventas_runtime_guard_cs21a152.js`
   - envuelve `getGruposVentas` y convierte fallas/respuestas inválidas en una lista vacía con error; nunca usa `DEMO_GRUPOS` como sustituto de datos reales;
   - bloquea tipos de documento terminados en `_TEST` en el runtime real;
   - bloquea `preview_test` en subida y notificación de matrícula firmada.
2. `ventas.html`
   - carga el guard inmediatamente después de `ventas_data.jsx` y antes del drawer.
3. QA automática dedicada.

## Deuda conocida que NO se oculta

- `src/ventas_drawer.jsx` aún contiene `previewMatriculaCR` y copy visual de modo prueba ligado a una identidad concreta. CS21A152 neutraliza su capacidad operativa, pero el retiro visual requiere edición quirúrgica posterior del drawer.
- `DEMO_DASHBOARD`, `DEMO_PROSPECTOS`, `DEMO_GRUPOS` y `ASESORES_V` siguen definidos en `ventas_data.jsx`; su extracción física a fixtures QA queda pendiente.
- `?preview=` sigue existiendo y debe revisarse junto con `VentasGate` antes de retirarlo o convertirlo en una superficie QA separada.
- REL-002 / PR #113 sigue siendo dueño de token + `scopeAsesor`; este corte no duplica ese arreglo.

## Evidencia / gates

- `scripts/qa_ventas_demo_isolation_cs21a152.mjs`
- `.github/workflows/qa-ventas-demo-isolation-cs21a152.yml`
- No Apps Script.
- No main.
- No deploy.
- No borrados.

## Estado

`SOURCE ISOLATION · NO PROD · VISUAL QA BLOCK REMOVAL PENDING · E2/E3 PENDING`
