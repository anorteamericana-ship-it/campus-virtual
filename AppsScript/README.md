# Apps Script — backend canónico

## Versión vigente

`F98.4-Z6-CS21A30`

El archivo productivo se llama `Code.gs` y debe reemplazarse completo en Apps Script. No concatenar manualmente parches sobre una versión desconocida.

## Copia exacta almacenada en Git

Por el tamaño del backend, la copia exacta se conserva comprimida en XZ y codificada como Base85 en 18 partes de texto:

`AppsScript/archivo_canonico/Code.gs.xz.b85.part01` a `part18`.

Para reconstruir el archivo legible completo:

```bash
python AppsScript/RECONSTRUIR_CODE_GS.py
```

El proceso crea `AppsScript/Code.gs` y falla si el SHA-256 no coincide.

## Integridad

- Líneas: 49.838
- Tamaño: 2.853.627 bytes
- SHA-256: `007f26c35e5c42015c40a238fbc9523eacf7444a45323853427111f96adc83cc`
- Validación: `node --check` aprobada.

## Instalación

1. Reconstruir `AppsScript/Code.gs`.
2. Confirmar el SHA-256.
3. Reemplazar por completo el contenido de `Code.gs` en Apps Script.
4. Guardar y crear una versión nueva.
5. Actualizar la implementación web.
6. Probar el endpoint y recargar el Campus con `Ctrl+F5`.

## Versión estable anterior

La referencia estable anterior queda en el historial Git, commit `767e7ba40fe4f66019d279ec5cb781d955bb56d8`. No se guarda una segunda copia activa del backend y ese corte anterior no se carga desde `campus.html`.

## Regla de almacenamiento

Este directorio mantiene una sola copia canónica vigente. No guardar una copia nueva por cada ajuste menor. El historial anterior está en Git.
