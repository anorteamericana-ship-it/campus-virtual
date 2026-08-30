# CS21A194 · Supervisión de docentes · errores seguros

Fecha: 2026-08-29
Base: PR #167 / `security/admin-private-conape-doc-delivery-cs21a193`
Base exacta: `e4cb929501395809deebd2679765cfbe9b99078f`

## Hallazgo

`src/panel_admin_supervision.jsx` mostraba directamente al operador:
- `res.error` cuando `fetchDocentesAtrasados()` respondía `ok:false`;
- `e.message` cuando la carga fallaba por red/runtime.

La pantalla entrega ese texto a `ErrorState`, por lo que códigos o detalles técnicos del backend podían quedar visibles a admin/superadmin.

## Cambio

Solo se modifica la frontera de presentación del error:
- detalle de respuesta no válida → `console.warn`;
- excepción de red/runtime → `console.error`;
- UI → `No pudimos cargar la supervisión de docentes. Intentá de nuevo.`

## No cambia

- `fetchDocentesAtrasados`;
- endpoint, token o payload;
- conteo y orden de docentes;
- clasificación de atrasos;
- `ModalCierreLeccion`;
- cierre de lecciones;
- botón Actualizar/reintento;
- Apps Script, Drive o producción.

## Evidencia

E0 automático:
- guard CS21A194;
- regresión CS21A193;
- regresión CS21A192;
- `git diff --check`.

**DRAFT · SAFE UI BOUNDARY ONLY · NO PROD · NO AUTO-MERGE**
