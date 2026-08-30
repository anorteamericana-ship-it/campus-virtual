# CS21A197 · Aperturas Admin · errores seguros

Fecha: 2026-08-29
Base: PR #170 / `fix/admin-suspensiones-safe-actions-cs21a196`
Base exacta: `c15f21cb3829871a6ccc2ccb826a518f9a55ddf3`

## Hallazgo

`src/aperturas_admin_cs21a20.jsx` tiene persistencia real mediante `actualizarAperturaAdmin` y ya libera correctamente `saving` con `finally`. No hay falso guardado ni bloqueo asíncrono demostrado.

El defecto localizado está en la frontera de presentación: tanto la carga (`getAperturasAdmin`) como el guardado renderizan directamente `e.message`. `apPost()` puede originar mensajes técnicos como configuración de Apps Script, respuesta JSON inválida o detalles crudos del backend.

## Cambio

- agrega `apSafeUserError(raw, fallback, context)`;
- conserva mensajes humanos de negocio cuando son seguros;
- oculta códigos/HTTP/backend/Apps Script/endpoints/excepciones y deja el detalle en consola;
- carga y guardado usan copy estable y accionable.

## No cambia

- `apPost`;
- `getAperturasAdmin` / `actualizarAperturaAdmin`;
- token o payloads;
- fechas B1/B2/I1/I2;
- desplazamiento conjunto de fechas;
- precios;
- confirmación explícita;
- reglas que bloquean grupos iniciados/con actividad;
- recálculo de calendario;
- Apps Script, Drive o producción.

## Evidencia

E0 automático:
- guard CS21A197;
- regresión CS21A196;
- regresión CS21A195;
- `git diff --check`.

**DRAFT · SAFE UI BOUNDARY ONLY · APERTURA BUSINESS RULES UNCHANGED · NO PROD · NO AUTO-MERGE**
