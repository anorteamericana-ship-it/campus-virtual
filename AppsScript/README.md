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

F98.4-Z6-CS21A54 modifica únicamente el frontend docente de libros y `campus.html`.

- Elimina el panel lateral interno de niveles y la vista antigua de carpeta Drive en Libros/Biblioteca.
- Coloca nivel, SB/TB/WB, unidades y acciones en controles horizontales superiores.
- Extiende el visor PDF.js de dos páginas a todo el ancho disponible.
- Añade navegación, zoom y pantalla completa.
- Mantiene cada PDF en memoria al cambiar de unidad.
- No usa `/preview` como respaldo ni vuelve a la vista anterior.
- Si PDF.js falla, muestra un error controlado con accesos externos.
- B1 usa `Interchange 5th intro-SB.pdf`, ID `1pnR7RoJGkZnx08TlfrEgxEqVRnlrCwea`.
- No modifica Apps Script, pagos, certificados, CONAPE, calendario ni hojas académicas.
- El backend objetivo continúa siendo CS21A46.

## Pendiente backend

La selección automática del SB/TB/WB vigente dentro de cada carpeta requiere un endpoint backend con reglas inequívocas. No se agregó porque el Code.gs completo CS21A46 no está disponible en GitHub para modificarlo con seguridad.

Para cambiar un libro sin modificar frontend debe reemplazarse/versionarse el archivo canónico conservando el mismo ID. Subir otro archivo crea un ID nuevo.

## Funciones preservadas

- Consulta individual fresca.
- Pago de certificado separado de emisión.
- Pagos con controles de integridad.
- Lectura directa de `7-morosidad`.
- Resumen desde `6-historial`.
- No mover pagos entre niveles o intentos.
- No crear automatizaciones nuevas de CONAPE.

Preparado o respaldado no significa desplegado.
