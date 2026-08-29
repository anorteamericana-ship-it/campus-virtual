# CS21A161 · SEC-002 · Comprobante de pago privado

Fecha: 2026-08-29

## Base

- Stack: PR #132 / `security/sec002-student-certificate-private-cs21a160`
- `main` de referencia: `53df524d0a9eab867d3b307b3e633f366af92a63`
- Alcance: **frontend/source only**.

## Problema

La cola administrativa de solicitudes de pago todavía consumía `url_comprobante` como destino directo:

- PDFs se abrían con `window.open(url, ...)`;
- imágenes se renderizaban con `src={sol.url_comprobante}`;
- el modal incluía un enlace directo al mismo URL.

## Cambio

### `src/data.jsx`

- añade `descargarComprobantePagoPrivado(id)`;
- POST autenticado al endpoint privado;
- allowlist: JPG, PNG, PDF;
- máximo 5 MB;
- verifica tamaño anunciado;
- verifica SHA-256 cuando Web Crypto está disponible;
- devuelve `Blob` local;
- mantiene un fallback demo explícito solo para data URLs locales del modo demo.

### `src/solicitudes_pago.jsx`

- deja de navegar/renderizar `url_comprobante`;
- usa `tiene_comprobante` como indicador real de disponibilidad;
- llama `descargarComprobantePagoPrivado`;
- PDFs se abren con `ObjectURL` temporal;
- imágenes usan un `ObjectURL` local dentro del modal;
- la descarga de copia utiliza ese mismo `ObjectURL`;
- todos los ObjectURL se revocan.

## Backend canónico observado

El `Code.gs` canónico fue revisado directamente y actualmente no contiene `descargarComprobantePagoPrivado`.

Por ello este corte **NO declara runtime operativo**. El delta backend histórico de PR #110 incluye:

- endpoint admin/superadmin privado;
- lookup por solicitud y file_id;
- validación de que el archivo pertenezca a `SOLICITUDES_PAGO` y al ID solicitado;
- MIME JPG/PNG/PDF;
- 5 MB;
- rate limit;
- SHA-256;
- `getSolicitudesPago` deja de devolver `url_comprobante` y expone solo `tiene_comprobante`.

Ese delta debe portarse de forma mínima al Apps Script QA acumulado actual. No instalar el `Code.gs` histórico completo.

## ACL

Sin cambios en este corte. Orden seguro:

1. endpoint privado + shape `tiene_comprobante` en Apps Script QA;
2. E2 admin/superadmin positiva;
3. E2 negativa por rol;
4. verificar PDF/JPG/PNG e integridad;
5. retirar ACL pública solo en QA;
6. repetir E2;
7. producción en release separado y autorizado.

## QA estática

- `scripts/qa_sec002_payment_receipt_cs21a161.mjs`
- `.github/workflows/qa-sec002-payment-receipt-cs21a161.yml`

El guard falla si vuelve cualquier navegación o render directo a `url_comprobante`.

## Estado

**SOURCE MIGRATED · STATIC QA · BACKEND QA ENDPOINT PENDING · ACL UNCHANGED · NO PROD**
