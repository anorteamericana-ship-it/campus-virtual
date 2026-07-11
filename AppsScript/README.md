# Apps Script — backend canónico

## Versión vigente

`F98.4-Z6-CS21A43`

El archivo productivo es `Code.gs` y se reemplaza completo.

## Cambio CS21A43

- Lee directamente el archivo externo oficial `6-historial`.
- Crea un índice por cédula con nivel, materia, año, periodo, tipo, estatus y nota.
- Adjunta `historySummary` a los movimientos del Panel Maestro.
- No escribe ni reconstruye `6-historial`.
- Conserva todas las filas e intentos.
- Usa caché `MASTER_DASH_CS21A43_V1`.

Fuente:

- ID `13rd_tMKkTS6CLqSJt1PWS7GNmLxAVrsqRAO395tynZI`
- Pestaña `Hoja 1`

## Integridad

- Archivo: `Code_F98_4_Z6_CS21A43_SEGUIMIENTO_HISTORIAL_COMPLETO.gs`
- Tamaño: 2,877,888 bytes
- SHA-256: `8eefafd6f8054033273c4a4451e85a55ce66735ccfeb6b141f820c290471fcca`
- Sintaxis: `node --check` aprobada.

## Reglas preservadas

- `7-morosidad` continúa como autoridad de aplicado/pendiente.
- La ruta académica no aplica pagos.
- No se mueven pagos entre niveles o intentos.
- No existen triggers nuevos para CONAPE.
- Producción no confirmada.
