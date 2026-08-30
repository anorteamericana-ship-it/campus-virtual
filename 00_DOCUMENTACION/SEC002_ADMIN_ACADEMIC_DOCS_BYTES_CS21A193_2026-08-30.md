# CS21A193 · SEC-002 · Documentos académicos admin · transición byte-first

Fecha: 2026-08-30

## Hallazgo demostrado

`src/admin_students.jsx` todavía abría constancias de traslado y cartas integrales CONAPE mediante URL Drive directa cuando ya existían. Para documentos nuevos/regenerados, la superficie pedía explícitamente `include_base64:false`.

Eso no equivale a demostrar ACL pública. De hecho, dos cartas CONAPE reales muestreadas en Drive durante esta auditoría mostraron permisos **owner-only** y sin permiso `anyone`/domain.

El riesgo real es de entrega: un administrador autenticado en el Campus puede depender innecesariamente de la sesión Google del navegador para abrir un documento privado.

## Evidencia de contrato backend

El snapshot monolítico histórico disponible en Drive muestra que:

- `generarConstanciaTraslado` acepta `include_base64` tanto para PDF existente como recién generado;
- `generarCartaIntegralConape` acepta `include_base64` tanto para PDF existente como recién generado/regenerado;
- ambos mantienen `pdf_url` y `file_id` además de `pdf_base64`.

Esta evidencia **no sustituye** el snapshot modular QA fresco pendiente en Issue #111.

## Cambio de CS21A193

La superficie admin cambia a transición compatible:

1. solicita `include_base64:true`;
2. usa `abrirPdfBackend`, que prioriza `pdf_base64 -> Blob -> ObjectURL`;
3. solo conserva la URL privada existente como fallback temporal si el runtime no devuelve bytes.

Se elimina el short-circuit que abría directamente `PDF_TRASLADO_URL` / `CARTA_CONAPE_URL` antes de consultar al backend.

## Lo que NO se declara resuelto

SEC-002 **no queda cerrado** para estas dos clases en este corte.

El fallback URL permanece deliberadamente hasta contar con:

- snapshot modular Apps Script QA fresco;
- E2 admin autenticado sobre constancia existente;
- E2 admin autenticado sobre carta CONAPE existente;
- E2 sobre generación/regeneración;
- evidencia de que la entrega base64 funciona en runtime actual;
- retiro posterior del fallback URL en un corte separado.

## No cambia

- Apps Script;
- Drive ACL;
- documentos existentes;
- reglas académicas;
- movimientos de grupo;
- CONAPE;
- payloads de negocio salvo el flag de entrega `include_base64`;
- producción.

Estado: **TRANSICIÓN SOURCE · NO PROD · NO AUTO-MERGE · RUNTIME E2 PENDIENTE**.
