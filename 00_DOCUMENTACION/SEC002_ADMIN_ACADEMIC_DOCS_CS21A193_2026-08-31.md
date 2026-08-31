# CS21A193 · Admin · entrega privada de PDFs académicos

Fecha: 2026-08-31

## Base

- PR #164 / `fix/admin-students-user-copy-cs21a192`
- base exacta: `30b5be3cb04cff8eacf8a644b4ab72af077e5d7a`
- `main` observado al iniciar: `53df524d0a9eab867d3b307b3e633f366af92a63`

## Hallazgo

`src/admin_students.jsx` tenía dos clases de PDF académico sensibles que podían abrirse por URL Drive directa:

1. constancia de traslado académico;
2. carta integral CONAPE.

El historial conservaba `PDF_TRASLADO_URL` / `CARTA_CONAPE_URL`, la tabla podía ejecutar `window.open(e.pdf_traslado_url)`, y las llamadas de generación pedían explícitamente `include_base64:false`.

## Evidencia Drive

Se inspeccionaron metadatos ACL de dos cartas integrales CONAPE reales. Ambas aparecieron `shared:false` y únicamente con permiso `user/owner`; no se observó `anyone`.

Esto significa que **no se clasifica este corte como una fuga pública demostrada**. El problema es de entrega: una URL Drive privada puede depender de la sesión Google del navegador y no constituye por sí sola una entrega autenticada por la sesión del Campus.

## Evidencia backend disponible

El snapshot monolítico preservado contiene soporte explícito para:

- `generarConstanciaTraslado(... include_base64 ...)`;
- `generarCartaIntegralConape(... include_base64 ...)`;
- documentos ya existentes y documentos recién generados.

Ese soporte es evidencia de diseño/implementación histórica, **no evidencia E2 del runtime modular QA vigente**. Issue #111 continúa siendo el gate para runtime.

## Cambio source propuesto

- solicitar `include_base64:true` en las rutas de constancia/carta;
- no abrir `PDF_TRASLADO_URL`, `CARTA_CONAPE_URL` ni `resp.pdf_url` directamente;
- endurecer `abrirPdfBackend` para aceptar únicamente base64 PDF válido;
- validar MIME cuando esté presente;
- validar firma `%PDF`;
- limitar a 15 MiB decodificados;
- crear Blob/ObjectURL local y revocarlo;
- si faltan bytes o son inválidos, fallar cerrado con copy estable, sin fallback a URL.

## No cambia

- Apps Script;
- Drive ACL;
- archivos almacenados;
- generación/regeneración de cartas;
- cálculos financieros;
- cambios de grupo;
- sincronización CONAPE;
- endpoints o payloads salvo `include_base64:true`;
- `main` o producción.

## Gate antes de release

CS21A193 queda `SOURCE_READY_RUNTIME_UNVERIFIED` hasta completar E2 QA autenticado:

1. abrir constancia existente;
2. abrir carta CONAPE existente;
3. regenerar y abrir carta CONAPE;
4. validar rol/scope negativo;
5. confirmar que no se amplió ninguna ACL.

**NO PROD · NO AUTO-MERGE · RUNTIME QA PENDING**
