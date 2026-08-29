# CS21A194 · Admin certificado · contrato de entrega privada

Fecha: 2026-08-29
Base exacta: PR #165 / `42fac0979795a4e241a566ac20be178584057e48`

## Hallazgo

La ficha individual admin/superadmin todavía consume certificados mediante:
- `buscarCertificadoExistente` → `data.url` → `window.open`;
- `generarCertificado` / regeneración → `data.url` → `window.open`.

Este consumidor no quedó cubierto por PR #132, que migra únicamente la tarjeta del estudiante a `descargarMiCertificadoPrivado`.

## Evidencia Drive

Se verificaron tres certificados reales B1. Los tres muestran:
- `shared=true`;
- permission `type=anyone`, `role=reader`;
- `allowFileDiscovery=false`;
- owner Academia.

Por lo tanto el riesgo público por enlace está demostrado para esta muestra 3/3.

## Evidencia backend

El `Code.gs` observado (modificado 2026-08-19) contiene 0 coincidencias para `descargarMiCertificadoPrivado`, consistente con el bloqueo ya documentado en PR #132.

No se encontró un endpoint privado admin de certificado probado en el runtime actual. No se inventa uno en este corte.

## Contrato objetivo

La entrega final debe:
- requerir sesión autenticada;
- permitir estudiante solo sobre su propio expediente;
- permitir admin/superadmin por rol y alcance;
- denegar visitante y estudiante sobre expediente ajeno;
- devolver PDF acotado y validar MIME/firma/integridad;
- abrir Blob/ObjectURL temporal;
- eliminar navegación directa a URL Drive.

El nombre final del endpoint se resuelve desde snapshot QA fresco de Issue #111. Idealmente se reutiliza un contrato común de certificado privado en vez de duplicar lógica por rol.

## ACL

**No se modifica en este corte.** El orden seguro sigue siendo:
1. portar endpoint privado al backend QA acumulado actual;
2. E2 admin/superadmin/estudiante propio + negativas;
3. validar PDF e integridad;
4. retirar `anyone` únicamente en QA;
5. repetir E2;
6. producción solo mediante release separado y autorizado.

## Estado

`P1 SEC-002 DOCUMENTADO · ADMIN CONSUMER ADDED · PRIVATE BACKEND PENDING · ACL UNCHANGED · NO PROD`.
