# CS21A193 · SEC-002 · documentos académicos admin por entrega privada

Fecha: 2026-08-30 · Costa Rica

## Base

- PR base: #164 · `fix/admin-students-user-copy-cs21a192`
- SHA base exacta: `30b5be3cb04cff8eacf8a644b4ab72af077e5d7a`
- `main` observado antes del corte: `53df524d0a9eab867d3b307b3e633f366af92a63`

## Hallazgo

`src/admin_students.jsx` todavía abría constancias de traslado y cartas CONAPE mediante URLs Drive almacenadas en el historial (`PDF_TRASLADO_URL`, `CARTA_CONAPE_URL`) o mediante `resp.pdf_url` después de generar/regenerar.

Eso obliga al navegador del operador a depender de permisos/sesión Google externos a la sesión del Campus.

## Evidencia Drive

Se revisaron dos cartas CONAPE reales existentes en Drive y ambas estaban privadas, con permiso únicamente del propietario; no se observó permiso `anyone` ni compartición adicional. Por tanto este corte **no cambia ACL** y no declara una fuga pública para esa clase documental.

## Evidencia backend histórica

El snapshot monolítico accesible en Drive demuestra que:

- `generarCartaIntegralConape(body)` interpreta `include_base64` y, para un archivo ya existente, puede responder `pdf_base64` leyendo su `file_id` privado;
- `generarConstanciaTraslado(body)` delega en `_blGenerarConstanciaCore_`, que también devuelve `pdf_base64` tanto para archivo existente como recién generado cuando `include_base64=true`.

Esto justifica el contrato frontend, pero **no sustituye** la verificación del Apps Script QA modular vigente de Issue #111.

## Cambio propuesto

Solo frontend en `src/admin_students.jsx`:

1. `abrirPdfBackend` recibe una opción `allowUrl`; por defecto conserva el comportamiento existente para otras superficies.
2. Para constancias/cartas CONAPE se usa `allowUrl:false`.
3. Se eliminan aperturas directas de `e.pdf_traslado_url`, `existingUrl` y `resp.pdf_url` en las rutas objetivo.
4. Se solicita `include_base64:true` para:
   - constancia desde la tabla académica;
   - abrir documento desde historial;
   - regenerar carta CONAPE.
5. Si no llegan bytes privados, la operación falla cerrada con copy estable; no se amplían permisos Drive.

## Evidencia automática

Bootstrap run `33352452760`: **SUCCESS completo**.

- base ancestry exacta: PASS;
- patch exacto: PASS;
- guard CS21A193: PASS;
- regresión CS21A192: PASS;
- regresión CS21A191: PASS;
- `git diff --check`: PASS;
- patcher y workflow bootstrap autoeliminados antes del push final.

Head funcional resultante del bootstrap: `0f40fb3e92c76e01f4f1a8dbfb39b966770f1db4`.

## No cambia

- Apps Script;
- Drive ACL;
- archivos existentes;
- endpoints;
- payloads de negocio salvo `include_base64:true` en funciones que históricamente lo soportan;
- reglas CONAPE;
- estado académico;
- pagos;
- certificados;
- producción.

## Gate de release

Este corte es **source/E1**, no E2. Antes de release requiere prueba autenticada admin/superadmin en QA contra el Apps Script modular vigente:

- abrir constancia existente;
- generar/abrir constancia nueva;
- abrir carta CONAPE existente;
- regenerar y abrir carta CONAPE;
- confirmar que no se requiere sesión Google adicional;
- confirmar que no se cambió ACL Drive.

**NO PROD · NO AUTO-MERGE · E2 REQUIRED**
