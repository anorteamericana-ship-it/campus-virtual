# CS21A196 · Panel Maestro global · errores seguros

Fecha: 2026-08-29

## Hallazgo

La auditoría del frente Cobranza llevó a la fuente real `src/admin_master_dashboard.jsx`.

`MasterCobranza` consume exclusivamente `data.collections.rows`; no tiene un fallback financiero local ni datos demo. Sin embargo, el dashboard global sí propagaba errores técnicos de `masterAction()` y carga a superficies visibles:

- actualización manual CONAPE;
- sincronización CONAPE al cargar / cada 30 minutos;
- carga general de `getSuperAdminMasterDashboard`;
- seguimiento institucional;
- historial de publicación;
- smoke test de publicación;
- registro de versión estable;
- tooltip del chip `CONAPE pendiente`.

`masterAction()` conserva detalles como versión/request_id/detalle para diagnóstico. Ese detalle debe quedar interno, no en la interfaz.

## Cambio

Se agrega `masterSafeUserError(raw, fallback, context)` y se usa solo en fronteras UI/estado visible.

El helper mantiene mensajes humanos de negocio y oculta:

- Apps Script/backend/endpoints;
- HTTP/status;
- tokens/request IDs;
- JSON/HTML;
- excepciones/red;
- nombres de funciones técnicas.

Los detalles filtrados quedan en `console.warn`.

## Cobranza

No se cambia ningún cálculo de Cobranza:

- fuente: `data.collections.rows`;
- filtros;
- montos pendientes;
- pagos aplicados;
- aging;
- convenios/grupos;
- exportación.

## No cambia

- `masterPost` / `masterAction`;
- token en body POST;
- endpoints;
- refresco cada 30 minutos;
- CONAPE;
- smoke/release logic;
- datos financieros;
- Apps Script;
- Drive;
- producción.
