# CS21A183 · documentos privados del estudiante · errores seguros

Fecha: 2026-08-29  
Estado: **SOURCE/QA ONLY · INTEGRIDAD PRESERVADA · NO PROD**

## Base

- PR #154 / `fix/solicitudes-pago-safe-errors-cs21a182`
- base exacta al crear este corte: `7a5a2bdb85a86350edc430921c7c34643ba62727`
- `main` observado: `53df524d0a9eab867d3b307b3e633f366af92a63`

## Hallazgo

La migración privada CS21A160/162 ya evita enlaces públicos, pero todavía existían rutas donde errores internos podían llegar textualmente al estudiante.

### Certificados

- `getMisCertificadosEstado`: `r.error`/`e.message` podían convertirse en el `ErrorState` visible;
- `descargarMiCertificadoPrivado`: `r.mensaje/r.error` podía convertirse en `certError` visible.

### Matrícula firmada

El helper privado utiliza correctamente códigos internos para controles de sesión, configuración, MIME, base64, tamaño, firma PDF e integridad. El problema era que el componente convertía `r.error` y después `e.message` directamente en texto visible.

## Cambio

Solo dos archivos funcionales:

- `src/student_modules.jsx`: helper `_smSafeUserErrorF984` para estado/descarga de certificado;
- `src/student_experience.jsx`: helper `studentSafeUserErrorF984` para la matrícula firmada.

Los helpers:
- conservan mensajes naturales de negocio;
- reconocen códigos y diagnósticos técnicos;
- registran el detalle en `console.warn`;
- muestran un fallback estable al estudiante.

## Invariantes

No se modifican:
- rutas privadas;
- token de sesión;
- MIME permitido;
- límites de tamaño;
- firma `%PDF-`;
- SHA-256;
- Blob/ObjectURL;
- disponibilidad del documento;
- Apps Script;
- Drive ACL;
- PROD.

Los códigos internos siguen existiendo dentro del helper de descarga para que la lógica pueda fallar cerrada; únicamente dejan de mostrarse crudos en UI.

## Límite

Esto es higiene de UX/diagnóstico. Los endpoints privados y sus E2 siguen sujetos al snapshot y portado de Issue #111.
