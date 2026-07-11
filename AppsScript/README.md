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

F98.4-Z6-CS21A52 modifica únicamente el visor docente de libros y `campus.html`.

- Restaura el visor embebido de Google Drive.
- Elimina del visor la dirección que provocaba descargas.
- Conserva U01–U16 y el cálculo de páginas de Apollo G3.
- La apertura exacta de página requiere prueba real en navegador.
- Apps Script no cambió.
- El backend objetivo continúa siendo CS21A46.

## Funciones preservadas

- Consulta individual fresca.
- Pago de certificado separado de emisión.
- Pagos con controles de integridad.
- Lectura directa de `7-morosidad`.
- Resumen desde `6-historial`.
- No mover pagos entre niveles o intentos.
- No crear automatizaciones nuevas de CONAPE.

Preparado o respaldado no significa desplegado.