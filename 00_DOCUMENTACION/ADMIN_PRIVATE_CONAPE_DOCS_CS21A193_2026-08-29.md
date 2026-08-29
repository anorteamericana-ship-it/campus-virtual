# CS21A193 · Admin Estudiantes · entrega privada de constancias y cartas CONAPE

Fecha: 2026-08-29
Base: PR #164 / `fix/admin-students-user-copy-cs21a192`
Base exacta: `30b5be3cb04cff8eacf8a644b4ab72af077e5d7a`

## Hallazgo

`src/admin_students.jsx` abría directamente URLs de Drive para constancias de traslado y cartas CONAPE cuando ya existían. Además, al generar/leer estos documentos solicitaba `include_base64:false`, por lo que la apertura podía depender de la sesión Google del navegador aunque el operador ya estuviera autenticado en el Campus.

Una comprobación de permisos sobre dos cartas CONAPE reales localizadas en Drive mostró `shared=false` y únicamente permiso `owner`. Por tanto, este corte no corrige una ACL pública demostrada: endurece la entrega privada y evita depender de acceso directo a Drive.

## Contrato backend verificado

El backend histórico ya soporta `include_base64` en:
- `generarConstanciaTraslado`;
- `generarCartaIntegralConape`.

Para documentos existentes también puede leer el PDF privado y devolver `pdf_base64` + `pdf_mime`; no requiere regenerar ni cambiar permisos.

## Cambio frontend

- `abrirPdfBackend` gana `allowUrlFallback=true` para conservar compatibilidad de consumidores existentes.
- Las tres rutas objetivo pasan `allowUrlFallback=false`.
- Constancia desde fila de estudiante: siempre consulta `generarConstanciaTraslado` con `include_base64:true`.
- Historial de cambios: traslado/carta siempre consulta su endpoint con `include_base64:true`.
- Regeneración de carta CONAPE solicita `include_base64:true` y abre los bytes autenticados.
- Se eliminan los `window.open()` directos de Drive en estas rutas.

## No cambia

- ACL o permisos de Drive;
- archivos existentes;
- carpetas de expediente;
- endpoints o nombres de funciones;
- reglas de traslado, CONAPE, pagos, mora o estados académicos;
- generación documental del backend;
- Apps Script desplegado;
- producción.

## Evidencia exigida

E0 automático:
- guard CS21A193;
- regresión CS21A192;
- regresión CS21A191;
- `git diff --check`.

E2 pendiente para release:
- admin/superadmin autenticado abre una constancia existente privada;
- admin/superadmin autenticado abre una carta CONAPE existente privada;
- regeneración de carta devuelve y abre PDF sin requerir sesión Google directa;
- fallo de bytes no deriva a URL Drive.

**DRAFT · PRIVATE DELIVERY HARDENING · DRIVE ACL UNCHANGED · NO PROD · NO AUTO-MERGE**
