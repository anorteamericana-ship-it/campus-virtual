# FUENTE VERDADERA — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

**Versión integral vigente:** F98.4-Z6-CS21A41  
**Backend canónico:** F98.4-Z6-CS21A34  
**Frontend activo:** línea F98.4-Z6-CS21A41  
**Corte:** 10-jul-2026  
**Repositorio:** `anorteamericana-ship-it/campus-virtual` · `main`

Los documentos sin sufijo de versión dentro de `00_DOCUMENTACION` son los únicos canónicos. El historial anterior permanece en Git.

## Backend canónico

CS21A34 continúa como único `Code.gs` completo. CS21A41 no modifica Apps Script ni requiere un nuevo respaldo backend.

SHA-256 esperado del TXT completo CS21A34:

`c4b4b3c18091e9413c0722d2c5ae0748b5c756927f9bf2f934c8d6dbe6c0dd35`

Respaldado o guardado no significa desplegado. La producción solo se confirma con evidencia de la implementación correspondiente.

## Código del estudiante primero · CS21A41

En **Seguimiento inmediato**, la primera columna presenta ahora el código como primer elemento de cada estudiante:

- El código aparece antes del nombre.
- Tamaño de referencia en escritorio: 19 px, peso fuerte y fondo azul institucional.
- Se muestra dentro de un campo de texto de solo lectura.
- Al hacer clic, el código completo queda seleccionado para copiar con `Ctrl + C` y pegar donde corresponda.
- Debajo aparecen el nombre, la cédula y el botón `Seguimiento` / `Revisado`.
- La primera columna conserva 31% del ancho total.
- No reaparece el scroll horizontal y la columna `WA` permanece visible.
- El cambio no modifica código de estudiante, identidad, pagos, CONAPE, morosidad ni comentarios.

Archivos frontend:

- `src/admin_master_conape_consulta_cs21a28.js` — contenido activo CS21A41; conserva el acceso a Consulta individual e incorpora la presentación del código.
- `styles/admin_master_conape_identity_cs21a39.css` — contenido visual activo CS21A41.
- `campus.html` — fuerza la carga CS21A41 de ambos recursos.
- `src/admin_master_conape_movements_cs21a25.jsx` — contenido funcional CS21A40 preservado.

## Mensaje WhatsApp preservado · CS21A40

El botón `WA Pago` continúa preparando únicamente texto:

- Emoticono seguro generado con `String.fromCodePoint(0x1F389)`.
- Negrita real de WhatsApp con un solo asterisco: `*texto*`.
- Nombre de pila, bimestre/cuatrimestre y monto pendiente confirmado.
- I2 identificado como último nivel.
- Sin monto confirmable, no se inventa una cifra.
- La imagen se adjunta manualmente.
- Un movimiento aplicado muestra `No enviar`.

## Vista compacta preservada

- Tabla completa sin scroll horizontal.
- Columna `Desembolso` eliminada.
- Columnas: Estudiante, Movimiento, Periodo/nivel, Campus, Detectado y WA.
- Botones compactos `Seguimiento`, `Revisado` y `WA Pago`.

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
- `DATOS.COMENTARIO_ADMIN` determina `Seguimiento` / `Revisado`.
- CONAPE continúa manual y sin triggers automáticos.
- Backend CS21A34 y frontend CS21A41 no están confirmados como publicados en producción.
