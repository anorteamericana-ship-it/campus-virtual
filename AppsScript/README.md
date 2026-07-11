# Apps Script — backend canónico

## Versión vigente

`F98.4-Z6-CS21A34`

El archivo productivo se llama `Code.gs` y debe reemplazarse completo.

## Corrección CS21A34

Seguimiento inmediato ya no toma la decisión desde una pestaña local llamada `7-morosidad`. Abre directamente el archivo externo oficial:

- ID: `1Q9QTNc2009M6PqbNW2_WjYBOlqCMhiBjrenun88L5yg`
- Nombre: `7-morosidad`
- Pestaña: `Hoja 1`

El motor valida el ID y los encabezados antes de clasificar.

Regla: misma cédula + año + periodo cuatrimestral; `NO`=aplicado, `SI`=pendiente, sin fila=pendiente. `BDBANCARIO` está excluida.

## Respaldo canónico en Drive

Carpeta: `CAMPUS_VIRTUAL_BACKEND_CANONICO`

- TXT ID: `1FpHFcCSjrM_MHp0CUHjzmPvFABCAUwWV`
- ZIP ID: `1rG_WuF3aAd4dESWi_s82N3QBL6OAOoEd`

### TXT

- Nombre: `Code_F98_4_Z6_CS21A34_SEGUIMIENTO_CONAPE_FUENTE_OFICIAL_COMPLETO.txt`
- Líneas: 49.939
- Tamaño: 2.867.080 bytes
- SHA-256: `c4b4b3c18091e9413c0722d2c5ae0748b5c756927f9bf2f934c8d6dbe6c0dd35`
- Validación: `node --check` aprobada.

### ZIP

- Nombre: `Code_F98_4_Z6_CS21A34_SEGUIMIENTO_CONAPE_FUENTE_OFICIAL_COMPLETO.zip`
- Tamaño: 740.516 bytes
- SHA-256: `1cb825af1d52adeaa48540cdf4720189d5b6cc3da8d0a5095bc505afeaa8257b`

## Caso de control

En la hoja externa, cédula `119760781`, fila 297: año 2026, periodo 3, estado `NO`. Movimiento `09/2026` debe quedar aplicado.

## Instalación

1. Abrir el TXT o ZIP.
2. Reemplazar completamente `Code.gs`.
3. Guardar y crear versión.
4. Actualizar la implementación web.
5. Recargar con `Ctrl+F5`.
6. Validar el caso de control.

Respaldado no significa desplegado.
