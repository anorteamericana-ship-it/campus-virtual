# Apps Script — backend completo de continuidad

## Versión canónica

`F98.4-Z6-CS21A59`

Base preservada: `F98.4-Z6-CS21A58`, `F98.4-Z6-CS21A56` y `F98.4-Z6-CS21A46`.

El archivo productivo se reemplaza siempre completo. El backend grande se conserva en Drive y no se almacena dentro de GitHub.

## Ubicación canónica

- Carpeta de trabajo: `1XITxPmwGJRDqgplj0AjbhfbjzaoIvL-a`
- Archivo vigente `Code.gs`: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`
- Carpeta de respaldos: `1OHyjrubHJfeBOxx0kfYm0cWrM5xtyOZr`
- Manifiesto operativo: `README_BACKEND_ACTUAL.txt`

## Integridad CS21A59

- Tamaño: `2.906.208` bytes
- SHA-256: `a3a4b2423c274833deb2f2d4d30859a85e7b1676779b371c395d244f4ab6773d`
- Saltos de línea: `50.867`
- Sintaxis: validada mediante copia JavaScript y `node --check`.
- Producción: no verificada.

## Respaldos

- Previo CS21A58: `1yHzOKu0o1kx5SIxI2w2bqW-pxvsMx0Ls`
- Copia de cierre CS21A59: `1hT1VgtNcA3eRmw6-_HaWv0s95743PUq8`

## Cambio backend CS21A59

Nuevo endpoint:

`adminBooksRefreshOpenBook`

Comportamiento:

- Requiere rol `admin` o `superadmin`.
- Recibe nivel y tipo del libro abierto.
- Lee únicamente la carpeta `pages` de ese libro.
- Ordena los WebP por el número actual del nombre del archivo.
- Reconstruye únicamente el arreglo `pages[]` del `book.json` seleccionado.
- Asigna `displayIndex` consecutivo.
- Conserva en `sourcePage` el número detectado en el nombre.
- Invalida solo la caché del nivel/tipo actualizado.
- Devuelve el manifiesto actualizado para recargar el visor.
- Usa bloqueo para evitar escrituras simultáneas.
- Rechaza nombres WebP duplicados.

No hace lo siguiente:

- No copia imágenes.
- No mueve imágenes.
- No renombra imágenes.
- No elimina imágenes.
- No procesa ni modifica PDF.
- No toca los otros once libros.
- No modifica pagos, certificados, CONAPE, calendario ni hojas académicas.

## Endpoints preservados

- `teacherBooksOpenImageBook`
- `teacherBooksOpenPdf`
- `teacherBooksReadRange`

## Frontend relacionado

- `src/admin_resources_cs21a59.jsx`
- `campus.html`
- `src/teacher_cs21a_order_fix.jsx` continúa como visor base CS21A58.

El admin recibe Recursos Didácticos con Libros de texto y Audios. Solo el admin ve el botón de sincronización. El docente mantiene la misma vista sin ese control administrativo.

## Forma obligatoria de trabajo

1. Leer el archivo canónico anterior desde Drive.
2. Verificar tamaño y hash.
3. Crear respaldo antes de modificar.
4. Reemplazar el mismo archivo conservando su ID.
5. Recalcular tamaño, saltos de línea y SHA-256.
6. Entregar un único `Code.gs` completo.
7. No afirmar despliegue sin prueba real.

## Funciones preservadas

- Consulta individual fresca.
- Pago de certificado separado de emisión.
- Pagos con controles de integridad.
- Lectura directa de `7-morosidad`.
- Resumen desde `6-historial`.
- No mover pagos entre niveles o intentos.
- No crear automatizaciones nuevas de CONAPE.
