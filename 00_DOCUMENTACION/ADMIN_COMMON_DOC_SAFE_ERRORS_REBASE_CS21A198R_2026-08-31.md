# CS21A198R · Admin documentos comunes · error seguro rebasado

Base: PR #207 / `428590a06b3a0244d76703160f84f92085645d51`.

Rescata únicamente el delta de PR #201 para `generarDocumentoComun` dentro de la línea SEC-002 canónica actual.

## Cambio

Cuando `generarDocumento` responde `ok:false`, `data.error/data.mensaje` deja de llegar crudo a la UI y pasa por `adminStudentsSafeUserError(...)` con fallback estable.

## Deliberadamente sin cambio

- endpoint `generarDocumento`;
- payload y token;
- lógica de elegibilidad;
- respuesta exitosa `{ url:data.url, nombre:data.nombre }`;
- apertura/entrega URL de Documento de Inscripción y Carta No Deuda;
- certificado privado CS21A197R;
- constancias/cartas privadas CS21A193;
- Apps Script, Drive ACL, PROD y main.

La entrega privada de documentos comunes sigue **PENDING/BACKEND-GATED** y no se declara resuelta en este corte.
