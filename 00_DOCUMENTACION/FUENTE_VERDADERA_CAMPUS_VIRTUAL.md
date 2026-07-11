# FUENTE VERDADERA — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

**Versión integral vigente:** F98.4-Z6-CS21A40  
**Backend canónico:** F98.4-Z6-CS21A34  
**Frontend activo:** línea F98.4-Z6-CS21A40  
**Corte:** 10-jul-2026  
**Repositorio:** `anorteamericana-ship-it/campus-virtual` · `main`

Los documentos sin sufijo de versión dentro de `00_DOCUMENTACION` son los únicos canónicos. El historial anterior permanece en Git.

## Backend canónico

CS21A34 continúa como único `Code.gs` completo. CS21A40 no modifica Apps Script ni requiere un nuevo respaldo backend.

SHA-256 esperado del TXT completo CS21A34:

`c4b4b3c18091e9413c0722d2c5ae0748b5c756927f9bf2f934c8d6dbe6c0dd35`

Respaldado o guardado no significa desplegado. La producción solo se confirma con evidencia de la implementación correspondiente.

## Mensaje WhatsApp elegante y seguro · CS21A40

El botón `WA Pago` de **Seguimiento inmediato** conserva el flujo de texto únicamente, pero corrige el mensaje:

- El emoticono se genera con `String.fromCodePoint(0x1F389)` para evitar el carácter roto `�`.
- Se usa el emoticono de celebración `🎉`.
- WhatsApp utiliza un solo asterisco para negrita: `*texto*`. No se usa `**texto**`.
- Se resaltan de forma elegante el saludo, la confirmación del desembolso, la solicitud de prontitud, el estado al día y el monto.
- El nombre continúa siendo el nombre de pila detectado desde el nombre institucional.
- El monto continúa consultándose con `getEstudiante`; si no se confirma, no se inventa.
- I2 continúa identificado como último nivel.
- La imagen continúa adjuntándose manualmente.
- Un movimiento `Aplicado en sistema` continúa mostrando `No enviar`.
- No se envía automáticamente y no se escribe en hojas.

Formato base vigente:

> *¡Buenas noticias, [Nombre]! 🎉*
>
> CONAPE nos ha informado que el *desembolso ya fue acreditado en su cuenta.*
>
> Le solicitamos realizar el pago a la Academia *a la mayor brevedad posible*, para mantener su expediente *al día* y evitar atrasos en el desembolso del rubro de sostenimiento.
>
> *Monto correspondiente a [nivel] ([bimestre/cuatrimestre]): ₡[monto].*

Archivos frontend del cambio:

- `src/admin_master_conape_movements_cs21a25.jsx` — contenido activo CS21A40.
- `campus.html` — carga CS21A40.

## Identidad y vista compacta preservadas

CS21A39 y CS21A38 continúan vigentes:

- Nombre del estudiante grande y código/cédula destacados.
- Tabla completa sin scroll horizontal.
- Columna `Desembolso` eliminada.
- Columnas: Estudiante, Movimiento, Periodo/nivel, Campus, Detectado y WA.
- Botones compactos `✎ Seguimiento`, `✓ Revisado` y `WA Pago`.

## Aplicar pago dentro de Consulta individual · CS21A36 preservado

Consulta individual mantiene una búsqueda de comprobante por intento vigente, revalidación antes de aplicar, distribución por rubros, cargos especiales con `CARGO_ID`, intentos históricos de solo lectura y actualización dentro de la misma ficha.

El frontend usa `getEstudiante`, `getComprobantes` y `aplicarPago`. Apps Script conserva la autoridad sobre grupo, intento, deuda, saldo, reglas, recibos, escrituras, rollback, idempotencia y sincronización CONAPE. Nunca se mueve un pago entre niveles o intentos.

## Fuente oficial de `7-morosidad`

- Spreadsheet ID: `1Q9QTNc2009M6PqbNW2_WjYBOlqCMhiBjrenun88L5yg`
- Archivo: `7-morosidad`
- Pestaña: `Hoja 1`

La clasificación usa cédula + año + periodo cuatrimestral: `NO` significa aplicado; `SI`, pendiente; sin fila exacta, revisión.

## Estado preservado

- Cobranza y cartera abre primero.
- Pendientes CONAPE recientes arriba y aplicados abajo.
- `DATOS.COMENTARIO_ADMIN` determina `✎ Seguimiento` / `✓ Revisado`.
- CONAPE continúa manual y sin triggers automáticos.
- Backend CS21A34 y frontend CS21A40 no están confirmados como publicados en producción.
