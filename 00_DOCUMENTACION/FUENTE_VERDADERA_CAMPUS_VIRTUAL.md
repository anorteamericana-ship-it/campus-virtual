# FUENTE VERDADERA — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

**Versión integral vigente:** F98.4-Z6-CS21A34  
**Backend canónico:** F98.4-Z6-CS21A34  
**Frontend activo:** línea F98.4-Z6-CS21A33  
**Corte:** 10-jul-2026  
**Repositorio:** `anorteamericana-ship-it/campus-virtual` · `main`

Los documentos sin sufijo de versión dentro de `00_DOCUMENTACION` son los únicos canónicos. El historial anterior permanece en Git.

## Backend canónico

CS21A34 debe instalarse siempre como `Code.gs` completo. El TXT y ZIP completos se conservan en la carpeta institucional `CAMPUS_VIRTUAL_BACKEND_CANONICO`; GitHub conserva las referencias, reglas y hashes, no una copia parcial.

SHA-256 esperado del TXT completo:

`c4b4b3c18091e9413c0722d2c5ae0748b5c756927f9bf2f934c8d6dbe6c0dd35`

Respaldado no significa desplegado. La producción requiere reemplazar todo `Code.gs`, guardar, crear versión y actualizar la implementación web.

## Fuente oficial de `7-morosidad`

Seguimiento inmediato debe leer directamente el archivo externo oficial de CONAPE:

- Spreadsheet ID: `1Q9QTNc2009M6PqbNW2_WjYBOlqCMhiBjrenun88L5yg`
- Archivo: `7-morosidad`
- Pestaña: `Hoja 1`
- Encabezados: `codigo_sede`, `estudiante_id`, `ano`, `periodo`, `estado`

No debe tomar la decisión desde una pestaña local o copia espejo llamada `7-morosidad`.

## Regla de Seguimiento inmediato

- Meses 01–04 → periodo 1.
- Meses 05–08 → periodo 2.
- Meses 09–12 → periodo 3.
- Llave: **cédula + año CONAPE + periodo cuatrimestral**.
- Estado `NO` → **Aplicado en sistema**.
- Estado `SI` → pendiente.
- Sin fila exacta → pendiente para revisión.
- Ante filas duplicadas conflictivas, `SI` prevalece de forma conservadora.
- `PAGOS`, `OTROS PAGOS` y `PAGOS_CAMPUS` son evidencia complementaria.
- `BDBANCARIO` queda excluida.
- No se escribe en la hoja externa ni se mueven pagos.

## Caso patrón verificado en vivo

En `Hoja 1`, la cédula `119760781` aparece en:

- fila 149: año 2026, periodo 2, estado `NO`;
- fila 297: año 2026, periodo 3, estado `NO`.

Para el movimiento CONAPE `09/2026` se consulta específicamente periodo 3, fila 297. Resultado: **Aplicado en sistema**.

## Estado preservado

- Frontend visual CS21A33 permanece activo sin cambios.
- Cobranza y cartera abre primero.
- Pendientes recientes arriba y aplicados abajo.
- Detalle y Consulta permanecen activos.
- CONAPE continúa manual y sin triggers automáticos.
