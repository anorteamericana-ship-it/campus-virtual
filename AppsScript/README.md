# Apps Script — backend canónico

## Versión vigente

`F98.4-Z6-CS21A33`

El archivo productivo se llama `Code.gs` y debe reemplazarse completo en Apps Script. No concatenar parches sobre una versión desconocida.

## Cambio principal

Seguimiento inmediato CONAPE clasifica **Aplicado en sistema** usando `7-morosidad`:

- meses 01–04 → periodo 1;
- meses 05–08 → periodo 2;
- meses 09–12 → periodo 3;
- misma cédula + año + periodo con `ESTADO NO` → aplicado;
- `ESTADO SI` o sin fila exacta → pendiente.

`PAGOS`, `OTROS PAGOS` y `PAGOS_CAMPUS` quedan como evidencia complementaria. `BDBANCARIO` está excluida.

## Respaldo canónico en Drive

Carpeta: `CAMPUS_VIRTUAL_BACKEND_CANONICO`

- TXT ID: `1FpHFcCSjrM_MHp0CUHjzmPvFABCAUwWV`
- ZIP ID: `1rG_WuF3aAd4dESWi_s82N3QBL6OAOoEd`

### TXT

- Nombre: `Code_F98_4_Z6_CS21A33_SEGUIMIENTO_CONAPE_7_MOROSIDAD_COMPLETO.txt`
- Líneas: 49.935
- Tamaño: 2.866.369 bytes
- SHA-256: `65e82291e2609120437a5fbfcdc0ea95793bdb0b41403362d99d0f65c5b69aa3`
- Validación: `node --check` aprobada.

### ZIP

- Nombre: `Code_F98_4_Z6_CS21A33_SEGUIMIENTO_CONAPE_7_MOROSIDAD_COMPLETO.zip`
- Tamaño: 739.779 bytes
- SHA-256: `3c5bdf8793baf4231106c599f42aa76650434211981bddced83ab9e2f0e36c75`

## Instalación

1. Abrir el TXT o descargar el ZIP desde Drive.
2. Reemplazar completamente `Code.gs`.
3. Guardar y crear versión nueva.
4. Actualizar la implementación web.
5. Recargar el Campus con `Ctrl+F5`.
6. Validar el caso `119760781 / 09-2026 / periodo 3 / NO`.

## Estado

Respaldado y documentado no significa desplegado. La producción no está confirmada hasta actualizar Apps Script y verificar el endpoint autenticado.
