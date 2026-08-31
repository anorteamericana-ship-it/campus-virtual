# CS21A193 · Admin CONAPE · transición a entrega privada de PDF

Fecha: 2026-08-31
Base exacta: `fix/admin-students-user-copy-cs21a192` @ `30b5be3cb04cff8eacf8a644b4ab72af077e5d7a`

## Hallazgo

`src/admin_students.jsx` abre constancias de traslado y cartas CONAPE desde URLs Drive históricas (`PDF_TRASLADO_URL`, `CARTA_CONAPE_URL`, `pdf_url`). En dos cartas CONAPE reales revisadas en Drive, los permisos observados son privados/owner-only; por tanto no se clasifica este corte como corrección de una ACL pública.

El riesgo real es de entrega/acceso: un admin autenticado en Campus puede depender de una sesión Google separada para abrir una URL privada de Drive.

## Evidencia backend histórica

El `Code.gs` histórico disponible en Drive implementa `include_base64` tanto en `generarCartaIntegralConape` como en `generarConstanciaTraslado`. Para documentos existentes, ambas rutas pueden leer el PDF almacenado y devolver `pdf_base64` sin regenerarlo.

El snapshot modular QA vigente sigue pendiente en Issue #111. Por eso este corte NO asume que el deployment actual esté demostrado por E2.

## Cambio de transición

- solicitar `include_base64:true` en las rutas admin de constancia/carta;
- abrir primero el Blob recibido desde la sesión del Campus;
- retirar aperturas directas de las URLs almacenadas en la fila antes de consultar backend;
- conservar URL únicamente como fallback temporal si el deployment no devuelve bytes;
- registrar ese fallback en consola para que sea observable.

## No cambia

- Apps Script;
- Drive ACL;
- archivos existentes;
- generación/regeneración documental;
- cambios académicos;
- CONAPE;
- endpoints ni payloads salvo `include_base64:true`;
- producción.

## Estado de seguridad

`TRANSITION_E2_PENDING`.

Este corte reduce dependencia de Drive URL, pero **NO cierra SEC-002**. Para retirar el fallback URL se requiere:

1. snapshot modular QA vigente;
2. confirmar contrato real de `include_base64`;
3. E2 admin positivo para documento existente y recién generado;
4. prueba negativa de rol/sesión;
5. recién entonces eliminar fallback URL.

**DRAFT · NO PROD · NO ACL CHANGE · NO AUTO-MERGE**
