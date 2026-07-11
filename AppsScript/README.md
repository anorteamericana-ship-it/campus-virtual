# Apps Script — backend canónico

## Versión vigente

`F98.4-Z6-CS21A30`

El archivo productivo se llama `Code.gs` y debe reemplazarse completo en Apps Script. No concatenar manualmente parches sobre una versión desconocida.

## Estado del respaldo

El repositorio conserva el manifiesto, las reglas y la referencia verificable del backend en:

- `AppsScript/README.md`
- `00_DOCUMENTACION/MANIFIESTO_ACTUAL.json`

La copia exacta completa fue guardada en el Drive institucional porque el conector disponible de GitHub bloqueó por seguridad la carga de un archivo de código de 2,8 MB y también sus representaciones comprimidas. No se dejó un archivo parcial ni se presenta una copia incompleta como válida.

### Drive institucional

Carpeta: `CAMPUS_VIRTUAL_BACKEND_CANONICO`

- TXT completo: `1FpHFcCSjrM_MHp0CUHjzmPvFABCAUwWV`
- ZIP completo: `1rG_WuF3aAd4dESWi_s82N3QBL6OAOoEd`

## Integridad del TXT completo

- Nombre: `Code_F98_4_Z6_CS21A30_DEUDA_COMPLETA_CERTIFICADO_I2_COMPLETO.txt`
- Líneas: 49.838
- Tamaño: 2.853.627 bytes
- SHA-256: `007f26c35e5c42015c40a238fbc9523eacf7444a45323853427111f96adc83cc`
- Validación: `node --check` aprobada.

## Integridad del ZIP

- Nombre: `Code_F98_4_Z6_CS21A30_DEUDA_COMPLETA_CERTIFICADO_I2_COMPLETO.zip`
- Tamaño: 736.780 bytes
- SHA-256: `6e85af5073a40110a299bbe73a6be4617678bd1fa798ff4fd2b8a1a79e98d04b`

## Instalación

1. Abrir la copia TXT o descargar el ZIP desde Drive.
2. Confirmar el SHA-256 cuando se haga una restauración crítica.
3. Reemplazar por completo el contenido de `Code.gs` en Apps Script.
4. Guardar y crear una versión nueva.
5. Actualizar la implementación web.
6. Probar el endpoint y recargar el Campus con `Ctrl+F5`.

## Versión estable anterior

La referencia estable anterior queda en el historial Git, commit `767e7ba40fe4f66019d279ec5cb781d955bb56d8`. No se conserva una segunda copia activa del backend y ese corte anterior no se carga desde `campus.html`.

## Regla de almacenamiento

- Mantener una sola referencia canónica vigente.
- No guardar fragmentos incompletos.
- No crear una copia nueva por cada ajuste menor.
- El historial frontend queda en Git; el backend completo se identifica por versión y SHA-256.
