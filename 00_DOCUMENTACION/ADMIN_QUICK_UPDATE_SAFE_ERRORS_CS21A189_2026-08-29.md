# CS21A189 · Admin/Superadmin · Poner al día · errores seguros

Fecha: 2026-08-29
Base exacta: PR #160 / `d2d20c0344ef9fa02cc6fa3337847f33c24893a7`

## Hallazgo

El flujo `Poner al día` usa `N.post()` como transporte y `useQuickUpdate()` como estado. El transporte conserva diagnósticos internos útiles, pero seis rutas convertían `e.message` directamente en `s.error`, que `ErrorBox` renderiza al operador:

- cambio de estatus legacy;
- actualización académica;
- búsqueda de comprobante;
- aplicación de pago;
- sincronización CONAPE;
- recarga final de la ficha después de reintentos.

Además, `PaymentView` mostraba directamente `s.academic?.mensaje` recibido del backend.

## Cambio

Se agrega `quickUpdateSafeUserError()` al namespace `ANQuickUpdate99` y se reutiliza en las fronteras UI.

Fallbacks estables:
- estatus: `No se pudo guardar el cambio de estatus. Intentá de nuevo.`;
- académico: `No se pudo actualizar el expediente académico. Intentá de nuevo.`;
- comprobante: `No se pudo consultar el comprobante. Intentá de nuevo.`;
- pago: `No se pudo aplicar el pago. Intentá de nuevo.`;
- CONAPE: `No se pudo actualizar CONAPE. Intentá de nuevo.`;
- recarga final: conserva el mensaje operacional existente si el detalle recibido es técnico.

Mensajes locales de negocio, como comprobante inexistente/sin saldo o validaciones de monto, siguen visibles.

El mensaje académico de éxito también pasa por la frontera segura antes de renderizarse.

## No cambia

- Apps Script;
- endpoints/payloads/tokens;
- request_id/idempotencia;
- transición académica;
- cálculo de deuda;
- selección/aplicación de rubros;
- comprobantes;
- sincronización CONAPE;
- reintentos de lectura fresca;
- Drive ACL;
- main/PROD.

Estado esperado: `SAFE COPY ONLY · BUSINESS LOGIC UNCHANGED · NO PROD`.
