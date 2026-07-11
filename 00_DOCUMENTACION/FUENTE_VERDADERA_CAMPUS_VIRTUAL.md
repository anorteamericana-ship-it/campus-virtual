# FUENTE VERDADERA — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

**Versión integral vigente:** F98.4-Z6-CS21A39  
**Backend canónico:** F98.4-Z6-CS21A34  
**Frontend activo:** línea F98.4-Z6-CS21A39  
**Corte:** 10-jul-2026  
**Repositorio:** `anorteamericana-ship-it/campus-virtual` · `main`

Los documentos sin sufijo de versión dentro de `00_DOCUMENTACION` son los únicos canónicos. El historial anterior permanece en Git.

## Backend canónico

CS21A34 continúa como único `Code.gs` completo. El TXT y ZIP se conservan en `CAMPUS_VIRTUAL_BACKEND_CANONICO`. CS21A39 no modifica Apps Script ni requiere un nuevo respaldo backend.

SHA-256 esperado del TXT completo CS21A34:

`c4b4b3c18091e9413c0722d2c5ae0748b5c756927f9bf2f934c8d6dbe6c0dd35`

Respaldado o guardado no significa desplegado. La producción solo se confirma con evidencia de la implementación correspondiente.

## Identidad legible en Seguimiento inmediato · CS21A39

CS21A39 preserva la tabla compacta de CS21A38 y refuerza únicamente la primera columna:

- El nombre del estudiante aumenta a 13.5 px, peso fuerte y color azul institucional.
- La línea que contiene cédula y código aumenta a 10.2 px, peso fuerte y fondo azul claro.
- La primera columna pasa a 31% del ancho total.
- Las otras cinco columnas se redistribuyen sin superar el 100%.
- En pantallas de hasta 1180 px se aplica una reducción moderada para conservar la vista completa.
- No reaparece el scroll horizontal.
- No cambia el orden, los datos, la clasificación CONAPE, el detalle ni el botón WA.

Archivos frontend del cambio:

- `styles/admin_master_conape_identity_cs21a39.css`
- `campus.html`

El componente base continúa en:

- `src/admin_master_conape_movements_cs21a25.jsx` — contenido CS21A38 preservado.

## Vista compacta preservada · CS21A38

Columnas visibles:

1. Estudiante.
2. Movimiento.
3. Periodo / nivel.
4. Campus.
5. Detectado.
6. WA.

Reglas:

- La columna `Desembolso` permanece eliminada.
- La tabla usa ancho `100%`, distribución fija y sin `min-width` forzado.
- El contenedor no ofrece scroll horizontal.
- El botón de seguimiento permanece compacto: `✎ Seguimiento` o `✓ Revisado`.
- El botón de WhatsApp permanece como `WA Pago` y conserva su columna propia.
- Los aplicados muestran `No enviar`.

## Texto WA preservado

El botón `WA Pago` prepara únicamente texto. La imagen se adjunta manualmente.

- Usa el nombre de pila.
- Consulta `getEstudiante` al pulsar para tomar el monto pendiente vigente del nivel.
- Identifica bimestre o cuatrimestre.
- I2 se presenta como último nivel.
- Si el monto no puede confirmarse, no inventa una cifra.
- Un movimiento marcado `Aplicado en sistema` no permite solicitar cobro.
- No envía automáticamente ni escribe en hojas financieras.

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
- Backend CS21A34 y frontend CS21A39 no están confirmados como publicados en producción.
