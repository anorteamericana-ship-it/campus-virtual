# CS21A159 · SEC-002 · Entrega privada en Ventas

Fecha: 2026-08-29

## Base

- Stack frontend: PR #130 / `feature/ventas-separate-call-whatsapp-cs21a158`
- `main` de referencia: `53df524d0a9eab867d3b307b3e633f366af92a63`
- Alcance de este corte: **frontend/source only**.

## Qué migra

### Documentos adicionales de Ventas (`docs_extra`)

- El DTO conserva `file_id`, MIME, tamaño y fecha.
- La subida usa el helper autenticado `postVentasData`.
- La apertura deja de usar `doc.url` y llama `descargarDocumentoExtraPrivado`.
- La respuesta privada se valida por tamaño y SHA-256 cuando el navegador dispone de Web Crypto.
- El archivo se expone al navegador como `Blob` + `ObjectURL` temporal y se revoca después.
- Filas legacy sin `file_id` fallan cerradas como `privado pendiente`; no vuelven a abrir el URL público.

### Matrícula firmada

- El drawer deja de depender de `signedDoc.url`.
- `Ver firmado` usa `descargarMatriculaFirmadaPrivada` por `file_id`.
- WhatsApp ya no comparte un enlace público de Drive; informa que el documento está disponible dentro del Campus y puede enviarse adjunto por correo.
- Se elimina de la capa de datos el parámetro/payload `preview_test` residual.
- Se valida PDF, tamaño y SHA-256 antes de crear el `Blob` local.

## Backend canónico observado

El `Code.gs` canónico de Drive fue revisado en este corte. A la fecha no contiene:

- `descargarDocumentoExtraPrivado`
- `descargarMatriculaFirmadaPrivada`

Por lo tanto este PR **NO declara runtime operativo**. Los deltas backend históricos de PR #110 sirven como especificación, pero deben portarse sobre el proyecto Apps Script QA acumulado actual siguiendo Issue #111. No instalar `Code.gs` histórico completo.

## Regla de ACL

No retirar todavía `ANYONE_WITH_LINK` de documentos existentes ni nuevos por este corte. El orden obligatorio sigue siendo:

1. instalar endpoint privado mínimo en Apps Script QA acumulado;
2. ejecutar QA positiva y negativa por rol/ownership;
3. comprobar consumidor frontend privado end-to-end;
4. retirar ACL únicamente en copia/entorno QA controlado;
5. volver a comprobar end-to-end;
6. cualquier producción requiere release separado y autorización explícita.

## QA estática

Guard permanente:

- `scripts/qa_sec002_ventas_private_delivery_cs21a159.mjs`
- `.github/workflows/qa-sec002-ventas-private-delivery-cs21a159.yml`

Protege contra regresiones a:

- `signedDoc.url`;
- `href={doc.url}`;
- data URLs en nuevos `docs_extra`;
- `preview_test`;
- WhatsApp con enlace público de matrícula firmada.

## Estado

**SOURCE MIGRATED · STATIC QA · BACKEND QA ENDPOINTS PENDING · ACL UNCHANGED · NO PROD**
