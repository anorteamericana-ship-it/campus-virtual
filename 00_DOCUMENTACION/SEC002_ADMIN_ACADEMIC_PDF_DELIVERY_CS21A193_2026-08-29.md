# CS21A193 · SEC-002 · Entrega privada de PDFs académicos en Admin

Fecha: 2026-08-29
Base exacta: PR #164 · `30b5be3cb04cff8eacf8a644b4ab72af077e5d7a`
Estado: **SOURCE/QA CANDIDATE · NO PROD · E2 ADMIN PENDIENTE**

## Hallazgo

`src/admin_students.jsx` tenía dos familias de documentos académicos personales que podían abrirse mediante URL directa de Drive:

- constancia PDF de traslado;
- carta integral CONAPE.

El historial podía abrir `PDF_TRASLADO_URL` / `CARTA_CONAPE_URL` directamente. Además, al generar o regenerar se pedía `include_base64:false`, por lo que el frontend prefería `pdf_url`.

## Evidencia de Drive

Se revisaron metadatos de dos cartas integrales CONAPE reales de julio de 2026. Ambas estaban `shared:false`, con permiso únicamente del propietario y sin `anyone/reader`.

Por tanto, este corte **no corrige una ACL pública demostrada** y no debe describirse como tal. El problema confirmado es de entrega/autenticación del documento: un admin del Campus no debería depender de que su navegador tenga una sesión Google capaz de abrir la URL privada de Drive.

No se cambió ningún permiso de Drive.

## Compatibilidad backend conocida

En el backend acumulado histórico disponible como evidencia read-only:

- `generarCartaIntegralConape(body)` acepta `include_base64` y, para un archivo existente, devuelve `pdf_base64` leyendo `CARTA_CONAPE_FILE_ID`;
- `generarConstanciaTraslado(body)` pasa `include_base64` al core;
- `_blGenerarConstanciaCore_` también devuelve `pdf_base64` para una constancia ya existente sin regenerarla.

Esto demuestra compatibilidad histórica de source, pero **no reemplaza el snapshot modular fresco de Apps Script QA** solicitado en Issue #111.

## Cambio frontend

CS21A193:

1. agrega un helper estricto para PDF privado con:
   - base64 obligatorio;
   - MIME `application/pdf`;
   - firma `%PDF-`;
   - límite de 12 MiB;
   - `Blob` + `ObjectURL`;
   - revocación del ObjectURL;
   - cero fallback a URL;
2. hace que las constancias de traslado soliciten `include_base64:true` incluso si ya existe una URL histórica;
3. hace que las cartas CONAPE del historial soliciten `include_base64:true` incluso si ya existen;
4. hace que la regeneración de carta CONAPE solicite y abra el base64 privado;
5. conserva `PDF_TRASLADO_URL` y `CARTA_CONAPE_URL` únicamente como metadata/estado histórico, no como mecanismo de apertura en estas rutas.

## Evidencia automática

Bootstrap `33290530735`: **SUCCESS completo**.

Head producido por el bootstrap: `750035c159072b78d5cfa67565f17a9f3f282952`.

Pasaron antes del push:

- ancestry exacta contra #164;
- parche por preimágenes exactas;
- guard CS21A193;
- regresión CS21A192;
- regresión CS21A191;
- `git diff --check`;
- autoeliminación del patcher y workflow bootstrap.

El diff contra #164 quedó en cinco archivos totales; el único archivo funcional es `src/admin_students.jsx` (+37/-9).

## No cambia

- Apps Script;
- Drive ACL;
- archivos existentes;
- IDs/URLs históricos almacenados;
- endpoints ni nombres de operaciones;
- payloads académicos salvo `include_base64:true` en las lecturas/generaciones objetivo;
- cambios de grupo;
- CONAPE;
- certificados;
- pagos;
- producción.

## Gate de release

Antes de release se requiere **E2 Admin** contra el Apps Script QA vigente para demostrar:

- constancia existente abre desde bytes autenticados;
- constancia recién generada abre desde bytes autenticados;
- carta CONAPE existente abre desde bytes autenticados;
- carta regenerada abre desde bytes autenticados;
- un navegador sin sesión Google de Drive no necesita acceso directo a la URL para visualizar el PDF;
- no se modificó la ACL del archivo.

Hasta entonces: **SOURCE COMPATIBLE / RUNTIME NO PROBADO**.
