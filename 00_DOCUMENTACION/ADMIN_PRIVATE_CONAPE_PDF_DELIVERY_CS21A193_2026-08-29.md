# CS21A193 · Admin · entrega privada de constancias y cartas CONAPE

Fecha: 2026-08-29

## Hallazgo

`src/admin_students.jsx` todavía abría directamente URLs de Drive para dos documentos administrativos del expediente:

- constancia de traslado;
- carta integral CONAPE.

Además, las llamadas de generación/historial pedían explícitamente `include_base64:false`.

## Evidencia de Drive

Se revisaron dos cartas CONAPE reales encontradas en Drive. Ambas muestran metadata de permisos **owner-only**, sin permiso `anyone` ni otros lectores compartidos.

Por lo tanto, este corte **no clasifica esas cartas como públicas** y **no cambia ninguna ACL**.

El riesgo concreto es de transporte/acceso: abrir una URL privada de Drive desde el navegador puede depender de la sesión Google local del operador, aunque la persona ya esté autenticada en el Campus.

## Evidencia backend disponible

Un respaldo monolítico del backend fechado 2026-08-19 contiene soporte para:

- `generarConstanciaTraslado(... include_base64 ...)`;
- `generarCartaIntegralConape(... include_base64 ...)`;
- lectura base64 de documentos ya existentes;
- base64 de documentos recién generados;
- `pdf_mime: application/pdf`.

### Límite importante

Ese respaldo **no demuestra** que el Apps Script modular QA actualmente desplegado preserve exactamente ese contrato. El snapshot modular actual sigue pendiente en Issue #111.

Por eso CS21A193 queda como **SOURCE_CANDIDATE_E2_REQUIRED**.

## Cambio frontend

Para las rutas protegidas:

1. deja de abrir directamente `PDF_TRASLADO_URL`, `CARTA_CONAPE_URL` o `resp.pdf_url`;
2. solicita `include_base64:true` al backend autenticado;
3. valida antes de abrir:
   - contenido base64 presente;
   - MIME `application/pdf`;
   - límite de tamaño;
   - firma binaria `%PDF-`;
4. crea un Blob/ObjectURL temporal;
5. revoca el ObjectURL;
6. si el contrato privado no está disponible, falla cerrado con copy estable y **no recurre al enlace Drive**.

## No cambia

- generación documental en Apps Script;
- archivos existentes;
- Drive ACL;
- endpoints;
- payloads de negocio salvo `include_base64:true`;
- movimientos académicos;
- CONAPE;
- estados de entrega;
- producción.

## Gate de release

Antes de cualquier integración productiva se requiere E2 autenticado admin/superadmin en QA para:

1. abrir una constancia de traslado existente;
2. generar y abrir una constancia nueva;
3. abrir una carta CONAPE existente;
4. regenerar y abrir una carta CONAPE;
5. confirmar que no hubo ampliación de permisos Drive.

Si el Apps Script modular QA no entrega `pdf_base64`, este corte se mantiene bloqueado y se corrige el backend contra el snapshot exacto; **no se reintroduce el fallback de URL pública/privada directa**.
