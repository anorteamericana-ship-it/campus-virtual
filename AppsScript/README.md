# Apps Script — backend completo de continuidad

## Versión canónica

`F98.4-Z6-CS21A58`

Base preservada: `F98.4-Z6-CS21A56` y `F98.4-Z6-CS21A46`.

El archivo productivo se reemplaza siempre completo. El backend grande se conserva en Drive y no se almacena dentro de GitHub.

## Ubicación canónica

- Carpeta de trabajo: `1XITxPmwGJRDqgplj0AjbhfbjzaoIvL-a`
- Archivo vigente `Code.gs`: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`
- Carpeta de respaldos: `1OHyjrubHJfeBOxx0kfYm0cWrM5xtyOZr`
- Manifiesto operativo de Drive: `README_BACKEND_ACTUAL.txt`

## Integridad CS21A58

- Tamaño: `2.899.463` bytes
- SHA-256: `d3505496b8e953d4fd0849a7a5af102760a452caa43d41bc9a7055006897ca87`
- Saltos de línea: `50.623`
- Sintaxis: validada mediante copia JavaScript y `node --check`.
- Producción: no verificada.

## Respaldos

- Antes del cambio: `Code_F98_4_Z6_CS21A56_COMPLETO_ANTES_CS21A58_2026-07-12.gs`
- Drive ID: `15Yq5aAbxMwvKKZo6e4Vg7kgw7axv5yra`
- Copia de cierre: `Code_F98_4_Z6_CS21A58_IMAGE_BOOKS_COMPLETO_2026-07-12.gs`
- Drive ID: `1FDjvFP3_suvo_1k2Y8xa_59kyJ_yg9yb`

## Cambio backend CS21A58

- Añade `teacherBooksOpenImageBook`.
- Lee el `book.json` correspondiente al nivel y tipo.
- Recorre la carpeta `pages` y asocia cada nombre con su ID real de Drive.
- Devuelve las páginas en el orden exacto de `pages[]`.
- No supone numeración consecutiva.
- Devuelve URL principal y URL alternativa por imagen.
- Devuelve Abrir/Descargar usando el PDF oficial de la carpeta académica.
- Usa caché temporal del manifiesto; `force=true` la invalida.
- Docente/admin puede abrir SB, TB y WB.
- Estudiante puede abrir SB y WB; TB queda bloqueado.
- Conserva `teacherBooksOpenPdf` y `teacherBooksReadRange` por compatibilidad.
- Es un cambio de solo lectura.
- No modifica pagos, certificados, CONAPE, calendario, DATOS, ESTATUS, GRUPOS ni INTENTOS_ACADEMICOS.

## Drive de imágenes

- Carpeta raíz: `1nw_kPwqWDWdnP-5M3E9B57Q0nmyUCdDK`
- Catálogo general: `1UTeCZQpLoEsdJkm3_kQRqni19uuZBTuO`
- Total: `2.051` páginas WebP
- B1: `492`; B2: `528`; I1: `514`; I2: `517`
- B1 SB/TB/WB ya tienen el mismo esquema de manifiesto que los demás niveles.

## Frontend relacionado

F98.4-Z6-CS21A58 modifica:

- `src/teacher_cs21a_order_fix.jsx`
- `campus.html`

El frontend ya no carga PDF.js. Renderiza dos imágenes, precarga las dos siguientes, empareja por orden del arreglo y conserva zoom, navegación, pantalla completa, actualización y descarga del PDF oficial.

## Forma obligatoria de trabajo

1. Leer el archivo canónico anterior desde Drive.
2. Verificar tamaño y hash.
3. Crear respaldo antes de modificar backend.
4. Reemplazar los bytes del mismo archivo canónico conservando su ID.
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
