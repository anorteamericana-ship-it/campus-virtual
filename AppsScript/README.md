# Apps Script — backend completo de continuidad

## Versión canónica

`F98.4-Z6-CS21A60`

Base preservada: `F98.4-Z6-CS21A59`, `F98.4-Z6-CS21A58`, `F98.4-Z6-CS21A56` y `F98.4-Z6-CS21A46`.

El archivo productivo se reemplaza siempre completo. El backend grande se conserva en Drive y no se almacena dentro de GitHub.

## Ubicación canónica

- Carpeta de trabajo: `1XITxPmwGJRDqgplj0AjbhfbjzaoIvL-a`.
- Archivo vigente `Code.gs`: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Carpeta de respaldos: `1OHyjrubHJfeBOxx0kfYm0cWrM5xtyOZr`.

## Integridad CS21A60

- Tamaño: `2.915.832` bytes.
- SHA-256: `1ae938995f99407e2914f406346edcf7e64d2517c6dd0869db14b14730947a56`.
- Saltos de línea: `51.143`.
- Sintaxis: validada mediante copia JavaScript y `node --check`.
- Producción: no verificada.

## Respaldos

- Previo CS21A59: `1kekb73zQj4Wy9KdhgaiiannLJhBH6tmy`.
- Copia de cierre CS21A60: `1bTuQcVrHkdWUV3HqFBWLddLfRiayB33U`.

## Cambio backend CS21A60

Endpoint nuevo:

`superadminBooksSetUnitStart`

Comportamiento:

- Requiere rol exacto `superadmin`.
- Recibe nivel, tipo de libro, unidad y página fuente visible.
- Actualiza únicamente una posición de `unitStarts` en el `book.json` abierto.
- Verifica que la página exista dentro de `pages[]`.
- Rechaza páginas duplicadas entre unidades.
- Rechaza un orden incoherente con las unidades anterior y siguiente.
- Guarda fecha, usuario, rol e historial del cambio.
- Conserva como máximo 100 entradas de historial.
- Invalida únicamente la caché del libro actualizado.
- Devuelve el manifiesto actualizado para recargar el visor.
- Usa bloqueo para evitar escrituras simultáneas.

No hace lo siguiente:

- No copia imágenes.
- No mueve imágenes.
- No renombra imágenes.
- No elimina imágenes.
- No procesa ni modifica PDF.
- No toca otros libros.
- No modifica pagos, certificados, CONAPE, calendario ni hojas académicas.

## Regla de página guardada

El frontend envía la hoja derecha del pliego visible.

Ejemplo:

- Pliego visible: 7–8.
- Valor guardado para U01: 8.
- En la próxima carga, el visor busca la hoja 8 y reconstruye el mismo pliego 7–8.

## Endpoints preservados

- `teacherBooksOpenImageBook`.
- `adminBooksRefreshOpenBook`.
- `teacherBooksOpenPdf`.
- `teacherBooksReadRange`.

`adminBooksRefreshOpenBook` reconstruye únicamente `pages[]` y preserva `unitStarts` y `unitStartHistory`.

## Frontend relacionado

- `src/admin_resources_superadmin_cs21a60.jsx`.
- `src/book_unit_starts_cs21a60.jsx`.
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
