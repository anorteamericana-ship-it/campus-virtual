# CS21A193 · Admin · constancias/carta CONAPE por entrega privada

Fecha: 2026-08-29
Base exacta: PR #164 / `30b5be3cb04cff8eacf8a644b4ab72af077e5d7a`

## Evidencia

`admin_students.jsx` conserva documentos académicos sensibles de traslado/CONAPE mediante campos históricos `PDF_TRASLADO_URL` y `CARTA_CONAPE_URL` y podía abrir esas URL directamente desde Drive.

Se verificaron dos cartas CONAPE reales en Drive. Ambas están privadas (`shared=false`) y su única permission es el owner de la Academia. Por tanto **no se clasifica este hallazgo como enlace público**.

El problema es de frontera de acceso: un admin autenticado en el Campus no debería depender de que su navegador tenga además permiso Google directo sobre el archivo.

El backend histórico auditado ya soporta entrega autenticada en base64:
- `generarCartaIntegralConape`: `include_base64=true` devuelve `pdf_base64` incluso para archivo existente;
- `generarConstanciaTraslado`: el core devuelve `pdf_base64` para constancia existente y recién creada cuando `include_base64=true`.

## Cambio objetivo

En las rutas admin de constancia de traslado y carta integral CONAPE:
- pedir `include_base64:true`;
- abrir un Blob/ObjectURL local a partir de la respuesta autenticada;
- no usar `PDF_TRASLADO_URL`, `CARTA_CONAPE_URL` ni `resp.pdf_url` como mecanismo de apertura;
- mantener los campos URL únicamente como metadata histórica/estado si el backend los devuelve.

## Fail closed

Si el backend efectivo no devuelve `pdf_base64`, la UI muestra un mensaje operativo y **no cae a Drive URL directa**.

## No cambia

No se modifica Drive, ACL, archivo histórico, generación PDF, contenido de cartas, estado CONAPE, cambios de grupo, endpoints, token, payloads salvo `include_base64:true`, Apps Script ni producción.

## Gate de release

Este corte es source/QA. Antes de release requiere E2 admin autenticado sobre:
1. constancia existente;
2. constancia recién generada;
3. carta CONAPE existente;
4. carta regenerada;
5. navegador sin sesión Google directa al Drive.

Estado: `PRIVATE DELIVERY FRONTEND · ACL UNCHANGED · E2 REQUIRED · NO PROD`.
