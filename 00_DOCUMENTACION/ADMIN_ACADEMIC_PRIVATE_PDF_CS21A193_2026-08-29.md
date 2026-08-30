# CS21A193 · Admin · entrega privada de constancias y cartas CONAPE

Fecha: 2026-08-29
Estado: DRAFT / source candidate / NO PROD
Base: PR #164 · `fix/admin-students-user-copy-cs21a192` · `30b5be3cb04cff8eacf8a644b4ab72af077e5d7a`

## Hallazgo
`src/admin_students.jsx` conserva dos familias de documentos académicos personales que pueden abrirse mediante URL directa de Drive:

1. constancia PDF de traslado;
2. carta integral CONAPE.

El historial también guarda `PDF_TRASLADO_URL` / `CARTA_CONAPE_URL` y el frontend los utiliza para decidir si el documento ya existe.

## Evidencia Drive, solo lectura
Se verificaron metadatos de dos cartas CONAPE reales existentes. Ambas estaban privadas y con permiso owner-only; no se encontró `anyone` ni otro permiso compartido en esas muestras.

Por tanto este corte NO clasifica esas cartas como públicamente expuestas. El problema demostrado es dependencia del enlace Drive / sesión Google del navegador.

No se cambió ningún permiso de Drive.

## Evidencia backend disponible
Un snapshot histórico legible del backend muestra que:

- `generarCartaIntegralConape(body)` interpreta `include_base64` y, cuando existe `CARTA_CONAPE_FILE_ID`, puede leer el PDF y retornar `pdf_base64` + `pdf_mime` sin regenerarlo;
- `generarConstanciaTraslado(body)` pasa `include_base64` a `_blGenerarConstanciaCore_`;
- `_blGenerarConstanciaCore_` también puede retornar `pdf_base64` para una constancia ya existente sin regenerarla.

Esta evidencia NO sustituye un snapshot QA modular actual ni demuestra que el deployment QA vigente tenga exactamente el mismo contrato. Por eso el frontend se diseña fail-closed y el release queda condicionado a E2 admin autenticado.

## Cambio propuesto
- eliminar aperturas directas de `pdf_traslado_url`, `PDF_TRASLADO_URL` y `CARTA_CONAPE_URL` en las rutas cubiertas;
- pedir `include_base64:true` al backend;
- abrir únicamente un Blob local generado desde `pdf_base64`;
- validar MIME `application/pdf` y firma `%PDF-` antes de abrir;
- revocar el ObjectURL;
- si el backend no entrega bytes privados, mostrar error estable y NO caer al enlace Drive.

La regeneración de carta continúa ocurriendo únicamente cuando el operador elige explícitamente “Recalcular carta”. Abrir un documento existente no debe regenerarlo.

## Fuera de alcance
- Apps Script runtime / deployment;
- ACL de Drive;
- formulario CONAPE editable;
- certificados u otros PDFs admin;
- cambios académicos, pagos, mora, estatus o sincronización CONAPE;
- URLs almacenadas históricamente en hojas/base.

## Gate de release
Antes de cualquier consolidación a producción se requiere E2 admin autenticado contra QA real para, como mínimo:

1. abrir una constancia existente sin sesión Google dependiente;
2. generar/abrir una constancia nueva;
3. abrir una carta CONAPE existente;
4. regenerar una carta y abrir el PDF resultante;
5. confirmar que el archivo Drive permanece privado;
6. confirmar que ausencia/invalidación de `pdf_base64` falla cerrado sin abrir URL Drive.

**NO MERGE / NO PROD mientras este E2 no exista.**
