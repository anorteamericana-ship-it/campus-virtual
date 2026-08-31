# CS21A193 · SEC-002 · entrega privada de documentos CONAPE en Admin

Fecha de trabajo: 2026-08-31

## Base exacta

- PR base: #164 · `fix/admin-students-user-copy-cs21a192`
- SHA base: `30b5be3cb04cff8eacf8a644b4ab72af077e5d7a`
- `main` observado al iniciar este corte: `53df524d0a9eab867d3b307b3e633f366af92a63`

## Hallazgo

`src/admin_students.jsx` conserva dos familias de documentos administrativos sensibles:

- constancia PDF de traslado;
- carta integral CONAPE.

Las rutas existentes podían abrir directamente `PDF_TRASLADO_URL`, `CARTA_CONAPE_URL` o `pdf_url` devueltos por el backend. Además, el historial solicitaba explícitamente `include_base64:false`.

Una revisión puntual de permisos sobre dos cartas CONAPE reales accesibles en Drive mostró `shared=false` y permiso únicamente del propietario. Por tanto, **no se clasifica este hallazgo como exposición pública demostrada**.

El riesgo demostrado en frontend es de acoplamiento a una URL privada de Drive: un operador autenticado en el Campus puede no tener una sesión Google compatible con esa URL. La ruta deseada es que la sesión autenticada del Campus reciba el PDF y lo abra como Blob local.

## Evidencia backend disponible y límite

Un snapshot histórico de Apps Script contiene soporte para `include_base64` tanto en `generarCartaIntegralConape` como en `generarConstanciaTraslado`, incluyendo documentos ya existentes sin regenerarlos.

**Esto no prueba el deployment vigente.** El snapshot fresco completo de Apps Script continúa pendiente en Issue #111. Por eso este corte es candidate-only y requiere E2 admin contra QA antes de cualquier release.

## Cambio propuesto

Solo frontend:

1. Las tres rutas protegidas solicitan `include_base64:true`.
2. Se eliminan aperturas directas de `PDF_TRASLADO_URL`, `CARTA_CONAPE_URL` y `resp.pdf_url` en esas rutas.
3. La apertura usa únicamente `pdf_base64` + `pdf_mime` mediante Blob local.
4. Los campos URL permanecen como metadatos históricos/estado de existencia; no se cambian datos ni archivos.

## No cambia

- permisos ni ACL de Drive;
- creación, reemplazo o ubicación de documentos;
- endpoints ni nombres de operaciones;
- payloads de negocio salvo `include_base64:true`;
- estados académicos, pagos, CONAPE, reversión o entrega;
- Apps Script;
- `main` o producción.

## Gate de release

Antes de release se requiere E2 admin en QA que demuestre, como mínimo:

- abrir una constancia de traslado existente sin depender de sesión Google;
- generar/abrir una constancia nueva;
- abrir una carta CONAPE existente;
- regenerar y abrir una carta CONAPE;
- respuesta sin `pdf_base64` falla de forma segura y no cae a URL Drive;
- ningún ACL de Drive cambia durante la prueba.

Estado: **DRAFT / SOURCE CANDIDATE · E2 PENDIENTE · NO PROD · NO AUTO-MERGE**
