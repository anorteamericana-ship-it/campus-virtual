# CS21A195 · Panel Maestro Super Admin · errores seguros

Fecha: 2026-08-29
Base: PR #168 / `fix/admin-supervision-safe-errors-cs21a194`
Base exacta: `ee1e0a831ccc8f72a434f2208391e576705b9f79`

## Hallazgo

`src/admin_master_dashboard.jsx` propagaba mensajes técnicos hacia la UI en varias rutas:
- actualización manual CONAPE;
- sincronización automática CONAPE;
- carga general del Panel Maestro;
- seguimiento institucional;
- historial/control de publicación;
- registro de versión estable;
- tooltip del chip de sincronización CONAPE.

Las fuentes incluían `e.message`, errores backend y metadatos ensamblados por `masterAction` (`version`, `request_id`, `detalle`).

## Cambio

Se agrega `masterSafeUserError(raw, fallback, context)` en la frontera de presentación. Conserva mensajes humanos de negocio cuando son seguros y sustituye códigos/HTTP/backend/Apps Script/endpoints/excepciones/metadatos técnicos por copy estable. El detalle original queda en consola para diagnóstico.

## No cambia

- `masterPost` ni `masterAction`;
- endpoints, token o payloads;
- sincronización CONAPE;
- cálculo/KPIs/filtros/exportación;
- seguimiento institucional;
- smoke test y registro de versión estable;
- Apps Script, Drive o producción.

## Deliberadamente fuera de alcance

El copy técnico intencional del control de publicación (`frontend/backend`, request ID, smoke test, versiones) no se modifica en este corte. Se evaluará por separado como copy/observabilidad para superadmin.

## Evidencia

E0 automático:
- guard CS21A195;
- regresión CS21A194;
- regresión CS21A193;
- `git diff --check`.

**DRAFT · SAFE UI BOUNDARY ONLY · MASTER ACTIONS UNCHANGED · NO PROD · NO AUTO-MERGE**
