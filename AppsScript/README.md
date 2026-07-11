# Apps Script — backend completo de continuidad

## Versión canónica

`F98.4-Z6-CS21A55`

Base preservada: `F98.4-Z6-CS21A46`.

El archivo productivo se reemplaza siempre completo. El backend grande se conserva en Drive y no se almacena dentro de GitHub.

## Ubicación canónica

- Carpeta de trabajo: `1XITxPmwGJRDqgplj0AjbhfbjzaoIvL-a`
- Archivo vigente `Code.gs`: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`
- Carpeta de respaldos: `1OHyjrubHJfeBOxx0kfYm0cWrM5xtyOZr`
- Manifiesto operativo de Drive: `README_BACKEND_ACTUAL.txt`

## Integridad CS21A55

- Tamaño: `2,889,170` bytes
- SHA-256: `127d9bbe403fa3a91073081d8a11a2a633d32e0c5931784d393126ee2cd321df`
- Saltos de línea: `50,293`
- Sintaxis: validada mediante copia JavaScript y `node --check`.
- Producción: no verificada.

## Respaldo previo

Antes de actualizar el archivo canónico se creó una copia completa de CS21A46 denominada:

`Code_F98_4_Z6_CS21A46_PRE_CS21A55_COMPLETO.gs`

## Cambio CS21A55

- Añade `teacherBooksOpenPdf`.
- Añade `teacherBooksReadRange`.
- Resuelve SB, TB y WB dentro de las carpetas docentes oficiales.
- Excluye archivos marcados como ORIGINAL, COPIA, COPY, BACKUP, RESPALDO, OLD o ANTIGUO.
- Entrega el primer bloque del PDF y rangos posteriores para `PDFDataRangeTransport`.
- Elimina la dependencia de lectura directa del navegador contra Google Drive y corrige el error CORS `Failed to fetch`.
- Es un cambio de solo lectura.
- No modifica pagos, certificados, CONAPE, calendario, DATOS, ESTATUS, GRUPOS ni INTENTOS_ACADEMICOS.

## Frontend relacionado

F98.4-Z6-CS21A55 modifica:

- `src/teacher_cs21a_order_fix.jsx`
- `campus.html`

El visor mantiene dos páginas, ancho completo, navegación, zoom, pantalla completa y U01–U16 únicamente para Student Book.

## Forma obligatoria de trabajo

1. Leer el archivo canónico anterior desde Drive.
2. Verificar su tamaño y hash.
3. Crear una copia versionada en la carpeta de respaldos.
4. Modificar el archivo completo.
5. Reemplazar los bytes del mismo archivo canónico, conservando su ID.
6. Recalcular tamaño y SHA-256.
7. Entregar un único `Code.gs` completo.
8. No afirmar despliegue sin prueba real.

## Funciones preservadas

- Consulta individual fresca.
- Pago de certificado separado de emisión.
- Pagos con controles de integridad.
- Lectura directa de `7-morosidad`.
- Resumen desde `6-historial`.
- No mover pagos entre niveles o intentos.
- No crear automatizaciones nuevas de CONAPE.
