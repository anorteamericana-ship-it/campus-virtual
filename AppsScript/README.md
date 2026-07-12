# Apps Script — backend completo de continuidad

## Versión canónica

`F98.4-Z6-CS21A64`

Base preservada: `F98.4-Z6-CS21A60`, `F98.4-Z6-CS21A59`, `F98.4-Z6-CS21A58`, `F98.4-Z6-CS21A56` y `F98.4-Z6-CS21A46`.

El archivo productivo se reemplaza siempre completo. El backend grande se conserva en Drive y no se almacena dentro de GitHub.

## Ubicación canónica

- Carpeta de trabajo: `1XITxPmwGJRDqgplj0AjbhfbjzaoIvL-a`.
- Archivo vigente `Code.gs`: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Carpeta de respaldos: `1OHyjrubHJfeBOxx0kfYm0cWrM5xtyOZr`.

## Integridad CS21A64

- Tamaño: `2.923.949` bytes.
- SHA-256: `d5217ceb90a4716c9161284a81c242a238649ed034bb97a36657716c6593feda`.
- Saltos de línea: `51.362`.
- Sintaxis: validada mediante copia JavaScript y `node --check`.
- Lógica de secuencia: validada con U01=27; 4 clics → U02=35/U03=43; 3 clics → U02=33/U03=39.
- Producción: no verificada.

## Respaldos CS21A64

- Copia previa a CS21A64: `1-AbtbfF3tH04eOl33w7mD2k_L7hPhCG1`.
- Copia de cierre CS21A64: `1GOKIBd7Z6zabkj8ElQHIIbTQ_Y9wa4DL`.

## Endpoint preservado y ampliado

`superadminBooksSetUnitStart`

Modo individual preservado:

- Recibe nivel, tipo de libro, unidad y página fuente visible.
- Actualiza únicamente la unidad seleccionada.
- Se usa cuando `propagate_following` no existe o es falso.

Modo de propagación CS21A64:

- Requiere `propagate_following=true`.
- Requiere `clicks_between_units` como entero mayor o igual a 1.
- Cada clic representa dos posiciones del arreglo real de páginas.
- Recalcula desde la unidad seleccionada hasta U16.
- Conserva intactas las unidades anteriores.
- Valida toda la secuencia antes de escribir.
- Rechaza páginas inexistentes, duplicadas, fuera de orden o fuera del libro.
- Si alguna validación falla, no escribe ningún cambio.
- Realiza una sola escritura de `book.json` bajo bloqueo.
- Registra cada unidad modificada en `unitStartHistory`.
- Conserva como máximo 100 entradas de historial.
- Invalida únicamente la caché del libro actualizado.

## Regla de página guardada

El frontend envía la hoja derecha del pliego visible.

Ejemplo individual:

- Pliego visible: 7–8.
- Valor guardado: 8.

Ejemplo propagado:

- U01 inicia en hoja 27.
- 4 clics de Siguiente: U02=35, U03=43.
- 3 clics de Siguiente: U02=33, U03=39.

## Endpoints preservados

- `teacherBooksOpenImageBook`.
- `adminBooksRefreshOpenBook`.
- `teacherBooksOpenPdf`.
- `teacherBooksReadRange`.
- `getBibliotecaNivelEstudiante`.
- `getAudioPistaEstudiante`.

`adminBooksRefreshOpenBook` reconstruye únicamente `pages[]` y preserva `unitStarts` y `unitStartHistory`.

## Frontend relacionado

- `src/admin_resources_superadmin_cs21a60.jsx`.
- `src/book_unit_starts_cs21a60.jsx`.
- `src/admin_resources_runtime_cs21a61.jsx`.
- `src/book_page_turn_cs21a62.js`.
- `src/book_inline_audio_cs21a63.js`.
- `src/book_unit_propagation_cs21a64.js`.
- `campus.html`.

## Forma obligatoria de trabajo

1. Leer el archivo canónico anterior desde Drive.
2. Verificar tamaño y hash.
3. Crear respaldo antes de modificar.
4. Reemplazar el mismo archivo conservando su ID.
5. Recalcular tamaño, saltos de línea y SHA-256.
6. Crear copia de cierre.
7. Entregar un único `Code.gs` completo.
8. No afirmar despliegue sin prueba real.

## Reglas preservadas

- Consulta individual fresca.
- Pago de certificado separado de emisión.
- Pagos con controles de integridad.
- Lectura directa de `7-morosidad`.
- Resumen desde `6-historial`.
- No mover pagos entre niveles o intentos.
- No crear automatizaciones nuevas de CONAPE.
