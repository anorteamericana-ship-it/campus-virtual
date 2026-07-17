# Validación · F98.4-Z6-CS21A109

## Pruebas aprobadas

- Julio con tipo `B` resuelve periodo 4.
- Julio con tipo `C` resuelve periodo 2.
- Septiembre con tipo `B` resuelve periodo 5.
- Septiembre con tipo `C` resuelve periodo 3.
- 17187 resuelve `B2 · CA · 20264B`.
- Orden fecha de desembolso + código: aprobado.
- Orden grupo + fecha de desembolso + código: aprobado.
- Sintaxis JSX de datos, multiorden y panel: aprobada.
- `campus.html` no contiene etiquetas `text/babl` y carga multiorden antes de datos y panel.

## Fuentes verificadas para 17187

- `CONAPE_MOVIMIENTOS_LOG`: desembolso 1 del 01/07/2026 y sostenimiento del 02/07/2026.
- `6-historial`: Básico II, 2026 periodo 4 tipo B, estado CA.
- `7-morosidad`: 2026 periodo 4, estado NO.

## Archivo de prueba

`Test_CS21A109_period_sort.js`

La prueba es aislada y no escribe en Drive, pagos, expedientes ni CONAPE.

## Publicación

La validación de código no sustituye la confirmación del workflow de GitHub Pages ni la revisión visual del Campus publicado.
