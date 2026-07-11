# FUENTE VERDADERA — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

**Versión integral vigente:** F98.4-Z6-CS21A38  
**Backend canónico:** F98.4-Z6-CS21A34  
**Frontend activo:** línea F98.4-Z6-CS21A38  
**Corte:** 10-jul-2026  
**Repositorio:** `anorteamericana-ship-it/campus-virtual` · `main`

Los documentos sin sufijo de versión dentro de `00_DOCUMENTACION` son los únicos canónicos. El historial anterior permanece en Git.

## Backend canónico

CS21A34 continúa como único `Code.gs` completo. El TXT y ZIP se conservan en `CAMPUS_VIRTUAL_BACKEND_CANONICO`. CS21A38 no modifica Apps Script y no requiere un nuevo respaldo backend.

SHA-256 esperado del TXT completo CS21A34:

`c4b4b3c18091e9413c0722d2c5ae0748b5c756927f9bf2f934c8d6dbe6c0dd35`

Respaldado o guardado no significa desplegado. La producción solo se confirma con evidencia de la implementación correspondiente.

## Vista compacta de Seguimiento inmediato · CS21A38

La tabla principal debe caber completa dentro del panel de escritorio sin desplazamiento horizontal.

Columnas visibles:

1. Estudiante.
2. Movimiento.
3. Periodo / nivel.
4. Campus.
5. Detectado.
6. WA.

Reglas visuales:

- Se elimina por completo la columna `Desembolso`.
- La tabla usa ancho `100%`, distribución fija y sin `min-width` forzado.
- El contenedor no ofrece scroll horizontal.
- Nombre, grupo y metadatos largos usan elipsis y conservan el texto completo en `title`.
- La fecha detectada se presenta compacta; el detalle completo queda en el tooltip.
- El antiguo botón grande de seguimiento se convierte en una píldora pequeña: `✎ Seguimiento` o `✓ Revisado`.
- El botón de WhatsApp se reduce a `WA Pago` y tiene una columna propia para permanecer visible.
- Los aplicados muestran `No enviar` en lugar de una acción de cobro.
- La cabecera, KPIs y bloque de aplicados también se compactan.

Archivos frontend:

- `src/admin_master_conape_movements_cs21a25.jsx` — contenido activo CS21A38.
- `campus.html` — carga CS21A38.

## Texto WA de desembolso · CS21A37 preservado

El botón `WA Pago` prepara únicamente el texto. La imagen se adjunta manualmente.

Texto base obligatorio:

> ¡Buenas noticias [Nombre]! 🥳
>
> CONAPE nos ha informado que el desembolso ya fue acreditado en su cuenta.
>
> Le solicitamos realizar el pago a la Academia a la mayor brevedad posible, para mantener su expediente al día y evitar atrasos en el desembolso del rubro de sostenimiento.

Reglas dinámicas:

- Usa el nombre de pila detectado desde el nombre institucional.
- Consulta `getEstudiante` al pulsar el botón para tomar el monto pendiente vigente del nivel.
- B1, B2 e I1 agregan nivel, bimestre/cuatrimestre y monto.
- I2 se identifica como último nivel e incorpora los rubros pendientes permitidos.
- Si el monto no puede confirmarse, conserva el texto base sin inventar una cifra.
- Un movimiento marcado `Aplicado en sistema` no permite solicitar cobro.
- No envía automáticamente, no adjunta imágenes y no escribe en hojas financieras.

## Aplicar pago dentro de Consulta individual · CS21A36 preservado

Consulta individual mantiene una búsqueda de comprobante por intento vigente, revalidación antes de aplicar, distribución por rubros, cargos especiales con `CARGO_ID`, intentos históricos de solo lectura y actualización dentro de la misma ficha.

El frontend usa `getEstudiante`, `getComprobantes` y `aplicarPago`. Apps Script conserva la autoridad sobre grupo, intento, deuda, saldo, reglas, recibos, escrituras, rollback, idempotencia y sincronización CONAPE. Nunca se mueve un pago entre niveles o intentos.

## Fuente oficial de `7-morosidad`

- Spreadsheet ID: `1Q9QTNc2009M6PqbNW2_WjYBOlqCMhiBjrenun88L5yg`
- Archivo: `7-morosidad`
- Pestaña: `Hoja 1`

La clasificación usa cédula + año + periodo cuatrimestral: `NO` significa aplicado; `SI`, pendiente; sin fila exacta, revisión. Una copia local no decide la clasificación.

## Estado preservado

- Cobranza y cartera abre primero.
- Pendientes CONAPE recientes arriba y aplicados abajo.
- `DATOS.COMENTARIO_ADMIN` continúa determinando `✎ Seguimiento` / `✓ Revisado`.
- CONAPE continúa manual y sin triggers automáticos.
- Backend CS21A34 y frontend CS21A38 no están confirmados como publicados en producción.
