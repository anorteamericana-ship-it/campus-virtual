# CS21A182 · Solicitudes de Pago · errores seguros

Fecha: 2026-08-29  
Estado: **SOURCE/QA ONLY · SIN CAMBIO DE LÓGICA DE PAGOS · NO PROD**

## Base

- PR #153 / `integration/sec002-private-student-admin-chain-cs21a181`
- base exacta al crear este corte: `9e5c1c6b2c42908ce7d8864a04dc44f94bd89608`
- `main` observado: `53df524d0a9eab867d3b307b3e633f366af92a63`

## Hallazgo

Después de integrar el comprobante privado, `SolicitudesPagoView` seguía enviando detalles técnicos del backend/red directamente a la UI administrativa:

- carga: `r.error`;
- red: `Error de red: ${e.message}`;
- aplicar: `res.error`;
- rechazar: `res.error`;
- descarga privada: `r.mensaje/r.error` → `Error` → `e.message` visible.

Esto no rompe la operación, pero expone detalles de implementación que no ayudan al personal y pueden filtrar códigos internos.

## Cambio

Únicamente `src/solicitudes_pago.jsx`:

- helper `spSafeUserError(raw, fallback, context)`;
- mensajes naturales de negocio pueden mantenerse;
- códigos técnicos, errores de red, backend/endpoints, token/sesión, HTML/JSON, MIME/base64/hash/integridad y similares se registran en `console.warn` y la UI usa un fallback estable;
- carga, aplicar, rechazar y apertura del comprobante usan el helper.

## Invariantes

Este corte no cambia:

- filtros;
- estados de solicitud;
- aplicación/rechazo de pagos;
- prefill de `Aplicar Pago`;
- endpoint privado de comprobante;
- Blob/ObjectURL;
- ACL;
- Apps Script;
- datos;
- producción.

## QA

Guard dedicado:
- exige helper y cinco rutas seguras;
- prohíbe las propagaciones crudas conocidas;
- regresa CS21A161 y CS21A181;
- `git diff --check` contra la base real del PR, excluyendo documentación histórica.

## Límite

Esto mejora la experiencia y reduce exposición de diagnóstico. **No cierra SEC-002 runtime**: el endpoint privado debe existir y validarse en Apps Script QA antes de retirar ACL o considerar release.
