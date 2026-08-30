# CS21A193 · SEC-002 · documentos académicos administrativos privados

Fecha: 2026-08-30 (Costa Rica)

## Base

- PR base: #164 · CS21A192.
- Base exacta: `30b5be3cb04cff8eacf8a644b4ab72af077e5d7a`.
- `main` permanece fuera de alcance.

## Hallazgo

`src/admin_students.jsx` conserva dos familias de documentos personales/administrativos:

1. constancias PDF de traslado académico;
2. cartas integrales CONAPE asociadas al expediente individual.

El frontend podía abrir directamente `PDF_TRASLADO_URL`, `CARTA_CONAPE_URL` o `resp.pdf_url` mediante `window.open(...)`. Esto no demuestra ACL pública, pero acopla la lectura a un enlace Drive y a la sesión Google del navegador.

## Evidencia Drive

Se inspeccionaron metadatos de dos cartas integrales CONAPE reales encontradas en Drive. Ambas aparecen privadas, con permiso `owner` únicamente y sin `anyone`/`domain`/otros lectores. Por tanto CS21A193 **no** se plantea como retiro de ACL pública.

## Evidencia backend histórica

La fuente Apps Script histórica disponible en Drive demuestra que:

- `generarCartaIntegralConape(body)` acepta `include_base64` y, para carta existente, devuelve `pdf_base64` leyendo el archivo privado;
- `_blGenerarConstanciaCore_(...)` devuelve igualmente `pdf_base64` para constancia existente cuando `includeBase64=true`;
- una generación nueva también puede devolver bytes del PDF.

Esta evidencia permite preparar el frontend sin inventar un endpoint nuevo. La fuente modular Apps Script QA actual sigue pendiente de snapshot canónico de Issue #111, por lo que el corte requiere E2 admin antes de release.

## Cambio propuesto

Solo frontend:

- solicitar `include_base64:true` al abrir/generar constancia de traslado;
- solicitar `include_base64:true` al abrir/generar/regenerar carta CONAPE;
- decodificar exclusivamente `pdf_base64` para estas rutas;
- validar MIME `application/pdf`, firma `%PDF-` y un límite razonable de tamaño;
- abrir mediante `Blob` + `URL.createObjectURL` y revocar el ObjectURL;
- no usar la URL Drive como fallback en estas rutas privadas.

Las columnas/URLs históricas permanecen intactas como metadatos y para compatibilidad; lo que cambia es la ruta de lectura del frontend.

## No cambia

- Apps Script;
- endpoints;
- payloads de negocio salvo `include_base64:true`;
- datos académicos;
- estado CONAPE;
- generación/regeneración semántica;
- Drive ACL;
- archivos existentes;
- producción.

## Gate

`qa_sec002_admin_private_academic_docs_cs21a193.mjs` exige:

- entrega base64/Blob/ObjectURL;
- MIME y firma PDF validados;
- ausencia de `window.open` directo de las URLs persistidas en las tres rutas cubiertas;
- endpoints y metadatos existentes preservados;
- frontera de errores seguros CS21A191 preservada.

## Evidencia automática

Bootstrap GitHub Actions `33342343424`: **SUCCESS completo**.

- ancestry exacta desde `30b5be3cb04cff8eacf8a644b4ab72af077e5d7a`;
- 8 preimágenes exactas aplicadas;
- guard CS21A193 PASS;
- regresión CS21A192 PASS;
- regresión CS21A191 PASS;
- `git diff --check` PASS;
- patcher y workflow bootstrap autoeliminados;
- head funcional resultante antes de este update documental: `68d0c45a7428bfbd291f0a650d5f9b33d7b1a2c7`.

Diff funcional contra #164: únicamente `src/admin_students.jsx` (+27/-9).

## Límite

CS21A193 es evidencia E0/E1 de source. No equivale a E2 autenticado ni prueba que el Apps Script QA modular actual exponga exactamente el mismo comportamiento histórico. **No merge / no PROD** hasta E2 admin sobre la fuente runtime vigente.
