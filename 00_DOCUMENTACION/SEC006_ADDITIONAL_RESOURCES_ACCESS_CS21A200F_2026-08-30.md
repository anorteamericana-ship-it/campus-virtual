# CS21A200F · SEC-006 · Recursos adicionales por enlace público

Fecha: 2026-08-30  
Base: PR #194 · `fix/additional-resources-safe-errors-cs21a200e` @ `3ab7b7ddaaad50eb9d7b1ceec089d94bf25b7dbe`

## Superficie efectiva

`src/additional_resources_panel_cs21a68.jsx` usa `getBibliotecaNivelEstudiante` y presenta un catálogo condicionado por rol:

- estudiante: recursos adicionales del nivel;
- docente: únicamente el Diccionario Word by Word;
- admin/superadmin: selector de nivel y catálogo desde la misma superficie;
- no existe audiencia anónima en esta UI.

Los recursos se abren mediante `preview_url`, `url` o `stream_url` con `window.open()`.

## Evidencia Drive

Se localizaron las cuatro carpetas raíz reales de `RECURSOS ADICIONALES`, una por nivel, y se leyó su metadata de permisos sin modificarla.

Resultado:

- carpetas raíz revisadas: **4**;
- carpetas con `type=anyone`, `role=reader`: **4/4**;
- `allowFileDiscovery=false` en las cuatro;
- archivo representativo revisado: **Diccionario Word by Word**;
- archivo representativo con `anyone/reader`: **1/1**.

Los IDs Drive y las identidades individuales presentes en la metadata **no se publican en este contrato/documentación**. No son necesarios para demostrar el hallazgo y publicarlos aumentaría exposición.

## Clasificación

`SEC-006 · P1_ACCESS_CONTROL`

Este hallazgo no es SEC-002/PII: los objetos revisados son material instruccional. El riesgo es que una capa del Campus presenta el contenido de forma consciente del rol, mientras los objetos Drive muestreados permiten lectura a cualquier persona que obtenga el enlace.

No se concluye aquí que todo material didáctico del Drive deba ser privado. El alcance probado es únicamente la familia `Recursos adicionales` observada.

## Qué NO hace este corte

- no modifica `src/`;
- no cambia ACL;
- no toca Apps Script;
- no mueve, elimina o renombra archivos;
- no cambia el catálogo;
- no cambia roles;
- no cambia producción;
- no afirma que SEC-006 esté resuelto.

## Orden seguro

1. Confirmar la política canónica de acceso para recursos por estudiante/docente/admin/superadmin.
2. Obtener el snapshot modular Apps Script QA fresco de Issue #111 antes de cambiar retrieval.
3. Diseñar entrega autenticada por rol o un grant controlado que no dependa de `anyone/reader`.
4. E2 QA: roles autorizados permitidos; rol no autorizado/anónimo denegado.
5. Inventariar los descendientes Drive exactos afectados.
6. Solo entonces retirar ACL pública en QA.
7. Repetir E2 después de ACL.
8. Producción únicamente con autorización de release separada.

Gate:

`BLOCK_UNTIL_ROLE_BOUND_DELIVERY_AND_ACL_E2`

## Dictamen

**P1 demostrado en acceso por enlace; mitigación runtime pendiente.** Este corte preserva la evidencia y evita que se declare arreglado sin delivery autenticado + E2 + migración ACL segura.
