# Apps Script — backend completo de continuidad

## Versión objetivo

`F98.4-Z6-CS21A46`

El archivo productivo es `Code.gs` y se reemplaza completo. El backend grande no se almacena en GitHub; este README registra su identidad.

## Integridad declarada

- Entrega: `ENTREGA_F98_4_Z6_CS21A46_SOLO_DESEMBOLSO_ACADEMICO_01.zip`
- Ruta interna: `AppsScript/Code.gs`
- Tamaño: 2,879,996 bytes
- SHA-256: `6cd638901f75ff56c4bc5f100be0203de05f82aa01a8b1f838f2c95bc7433568`
- Producción: no verificada

## Frontend relacionado

F98.4-Z6-CS21A53 modifica únicamente el frontend docente de libros y `campus.html`.

- Consolida Libros de texto y Biblioteca digital bajo un solo componente.
- Usa PDF.js para mostrar dos páginas enfrentadas.
- Conserva cada PDF en memoria al navegar por unidades.
- Retira el observador global del parche anterior.
- Cambia Básico I al archivo actual `Interchange 5th intro-SB.pdf`, ID `1pnR7RoJGkZnx08TlfrEgxEqVRnlrCwea`.
- Mantiene Drive `/preview` como respaldo cuando la lectura directa no es posible.
- No modifica Apps Script.
- No modifica pagos, certificados, CONAPE, calendario ni hojas académicas.
- El backend objetivo continúa siendo CS21A46.

## Pendiente backend

La selección automática del archivo SB/TB/WB vigente dentro de cada carpeta Drive requeriría un endpoint backend con reglas inequívocas. No se agregó porque el Code.gs completo CS21A46 no está disponible en GitHub para una modificación segura.

Mientras tanto, para cambiar un libro sin modificar el frontend debe reemplazarse o versionarse el archivo canónico conservando el mismo ID. Subir otro archivo separado crea un ID nuevo.

## Funciones preservadas

- Consulta individual fresca.
- Pago de certificado separado de emisión.
- Pagos con controles de integridad.
- Lectura directa de `7-morosidad`.
- Resumen desde `6-historial`.
- No mover pagos entre niveles o intentos.
- No crear automatizaciones nuevas de CONAPE.

Preparado o respaldado no significa desplegado.
