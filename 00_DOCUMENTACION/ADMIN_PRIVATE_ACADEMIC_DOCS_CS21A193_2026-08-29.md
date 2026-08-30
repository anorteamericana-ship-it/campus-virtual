# CS21A193 · Admin · documentos académicos private-first

Fecha: 2026-08-29
Base: PR #164 · `fix/admin-students-user-copy-cs21a192` · `30b5be3cb04cff8eacf8a644b4ab72af077e5d7a`

## Hallazgo

`src/admin_students.jsx` conserva URLs históricas para constancias de traslado y cartas CONAPE. Dos rutas de UI abrían directamente esas URLs Drive y los generadores solicitaban `include_base64:false`.

Esto no demostró una ACL pública. Al contrario, se verificaron dos cartas CONAPE reales en Drive y ambas estaban owner-only. El problema es dependencia de una sesión Google del navegador y no una entrega autenticada por el Campus.

## Evidencia backend disponible

Un snapshot histórico de `Code.gs` modificado el 2026-08-19 muestra que:

- `_blGenerarConstanciaCore_` devuelve `pdf_base64` para constancias nuevas y existentes cuando `include_base64=true`;
- `generarCartaIntegralConape` devuelve `pdf_base64` para cartas nuevas y existentes cuando `include_base64=true`.

Esta evidencia es histórica. **No prueba el runtime modular QA actual.** Issue #111 y el snapshot read-only CS21A178 siguen siendo gate.

## Cambio source

- agregar `abrirPdfPrivadoBackend(payload)` que acepta exclusivamente bytes base64 PDF y no tiene fallback URL;
- al abrir una constancia, pedir siempre `include_base64:true`, incluso si existe URL histórica;
- al abrir una carta CONAPE, pedir siempre `include_base64:true`, incluso si existe URL histórica;
- al regenerar una carta, pedir base64 y abrirla por Blob/ObjectURL;
- si el backend actual no entrega base64, fallar cerrado con copy estable y no abrir el enlace Drive.

## No cambia

- Drive ACL;
- archivos existentes;
- `PDF_TRASLADO_URL`, `CARTA_CONAPE_URL` ni sus file IDs como metadatos;
- Apps Script;
- endpoints, payloads de negocio, cambios de grupo, CONAPE o generación documental;
- producción.

## Gate de release

Este PR es **SOURCE CANDIDATE**. No debe consolidarse para release hasta demostrar E2 con admin autenticado contra Apps Script QA actual:

1. abrir constancia existente sin depender de sesión Google;
2. abrir carta CONAPE existente sin depender de sesión Google;
3. generar/regenerar y recibir PDF base64 válido;
4. negativa por rol/scope sigue fallando cerrada;
5. ninguna ACL se amplía.

**NO PROD · NO ACL CHANGE · CURRENT BACKEND E2 REQUIRED**
