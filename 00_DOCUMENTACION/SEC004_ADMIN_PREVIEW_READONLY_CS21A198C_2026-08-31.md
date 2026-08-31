# CS21A198C · SEC-004 · Admin preview solo lectura

Fecha: 2026-08-31
Base exacta: PR #217 / `fix/sec004-matriculas-preview-readonly-cs21a198b` / `357c85f6ca466570291c3c588d84a3a595313390`

## Hallazgo

`src/admin_views.jsx` ya evitaba cargar `getAdminDashboard` real durante `?demo=1` / `?preview`, pero dos acciones mutantes seguían conectadas al backend:

1. `Sincronizar CONAPE` → `postCampus('sincronizarCONAPE')`.
2. `ABRIR GRUPO` → POST `crearGrupo`.

Por tanto, una pantalla marcada como demostración podía ejecutar escrituras administrativas reales.

## Política del corte

- Se centraliza la detección de preview en `adminPreviewMode()`.
- `Sincronizar CONAPE` queda deshabilitado en preview y su handler falla cerrado antes del POST.
- `ABRIR GRUPO` queda deshabilitado en preview y `confirmar()` falla cerrado antes del POST.
- Fuera de preview, ambas operaciones conservan sus endpoints y payloads actuales.
- No se cambia la lectura del panel ni el comportamiento de producción.

## No cambia

No se modifican Apps Script, reglas de grupos, sincronización CONAPE real, becas, roles, tokens, ACL de Drive, `main` ni producción.

## Evidencia requerida

- guard CS21A198C;
- regresión CS21A198B;
- regresión CS21A198;
- diff hygiene contra #217.

## Límite

Este corte endurece únicamente dos mutaciones demostradas de `admin_views.jsx`. La política SEC-004 server-side sigue pendiente de Issue #111 + E2.
