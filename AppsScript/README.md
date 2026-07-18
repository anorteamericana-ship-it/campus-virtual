# Apps Script — backend completo de continuidad

## Estado canónico observado · CS21A131

El archivo canónico continúa fuera de GitHub y se conserva en Google Drive.

- Carpeta de trabajo: `1XITxPmwGJRDqgplj0AjbhfbjzaoIvL-a`.
- Archivo vigente `Code.gs`: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Carpeta de respaldos: `1OHyjrubHJfeBOxx0kfYm0cWrM5xtyOZr`.
- Encabezado observado el 18-jul-2026: `F98.4-Z6-CS21A79`.
- Última modificación informada por Drive: `2026-07-13T20:10:59.490Z`.
- Tamaño descargado: `2.969.236` bytes.
- SHA-256: `f6aa22cbd42c47990a5d72c5cf8d6e5af6bc72ebca356c23aa1058968088e487`.
- Líneas: `52.495`.
- Producción/despliegue de esta revisión: **no verificado**.

El archivo productivo se reemplaza siempre completo. No debe reconstruirse desde fragmentos ni sustituirse sin respaldo, verificación de hash y prueba en una implementación separada.

El contrato observado de endpoints críticos se registra en:

- `00_DOCUMENTACION/BACKEND_OBSERVADO_CS21A131.json`.
- `00_DOCUMENTACION/MATRIZ_ENTREGA_ROLES_CS21A131.md`.

## Diferencia respecto de la documentación anterior

La identificación `F98.4-Z6-CS21A64` y sus huellas corresponden a un cierre histórico, no al archivo vigente observado en Drive.

### Integridad histórica CS21A64

- Tamaño: `2.923.949` bytes.
- SHA-256: `d5217ceb90a4716c9161284a81c242a238649ed034bb97a36657716c6593feda`.
- Saltos de línea documentados: `51.362`.
- Copia previa: `1-AbtbfF3tH04eOl33w7mD2k_L7hPhCG1`.
- Copia de cierre: `1GOKIBd7Z6zabkj8ElQHIIbTQ_Y9wa4DL`.

## Funcionalidad de libros preservada desde CS21A64

### `superadminBooksSetUnitStart`

Modo individual:

- recibe nivel, tipo de libro, unidad y página fuente visible;
- actualiza únicamente la unidad seleccionada;
- se usa cuando `propagate_following` no existe o es falso.

Modo de propagación:

- requiere `propagate_following=true`;
- requiere `clicks_between_units` como entero mayor o igual a 1;
- cada clic representa dos posiciones del arreglo real de páginas;
- recalcula desde la unidad seleccionada hasta U16;
- conserva intactas las unidades anteriores;
- valida la secuencia completa antes de escribir;
- rechaza páginas inexistentes, duplicadas, fuera de orden o fuera del libro;
- si una validación falla, no escribe;
- realiza una sola escritura de `book.json` bajo bloqueo;
- registra cada unidad modificada en `unitStartHistory`;
- conserva como máximo 100 entradas de historial;
- invalida únicamente la caché del libro actualizado.

La página guardada es la hoja derecha del pliego visible. Ejemplo: pliego 7–8 → valor 8.

Endpoints de libros preservados y observados:

- `teacherBooksOpenImageBook`.
- `adminBooksRefreshOpenBook`.
- `teacherBooksOpenPdf`.
- `teacherBooksReadRange`.
- `getBibliotecaNivelEstudiante`.
- `getAudioPistaEstudiante`.

`adminBooksRefreshOpenBook` reconstruye únicamente `pages[]` y preserva `unitStarts` y `unitStartHistory`.

Frontend relacionado:

- `src/admin_resources_superadmin_cs21a60.jsx`.
- `src/book_unit_starts_cs21a60.jsx`.
- `src/admin_resources_runtime_cs21a61.jsx`.
- `src/book_page_turn_cs21a62.js`.
- `src/book_inline_audio_cs21a63.js`.
- `src/book_unit_propagation_cs21a64.js`.
- `campus.html`.

## Forma obligatoria de trabajo

1. Leer el archivo canónico actual desde Drive.
2. Verificar tamaño y hash antes de modificar.
3. Crear respaldo previo.
4. Construir la matriz `menú → endpoint → helper → hoja/Drive`.
5. No borrar wrappers o helpers por nombre/antigüedad sin demostrar que son inalcanzables.
6. Preparar y validar un candidato completo en una implementación separada.
7. Probar los tres roles con sesiones reales.
8. Reemplazar el mismo archivo conservando su ID solo después de aprobar QA.
9. Recalcular tamaño, líneas y SHA-256.
10. Crear copia de cierre.
11. Entregar un único `Code.gs` completo.
12. No afirmar despliegue sin prueba real.

## Reglas que deben preservarse

- Consulta individual fresca.
- Pago de certificado separado de emisión.
- Pagos con controles de integridad.
- Lectura directa de `7-morosidad`.
- Resumen desde `6-historial`.
- No mover pagos entre niveles o intentos.
- No crear automatizaciones nuevas de CONAPE.
- Autorización de rol validada en backend para toda escritura.
