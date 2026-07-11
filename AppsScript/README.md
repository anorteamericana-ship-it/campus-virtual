# Apps Script — backend completo de continuidad

## Versión canónica

`F98.4-Z6-CS21A46`

El archivo productivo es `Code.gs` y se reemplaza completo. El backend grande no se almacena en GitHub; su archivo canónico fue localizado y verificado en Google Drive.

## Ubicación canónica en Drive

- Carpeta maestra: `1XITxPmwGJRDqgplj0AjbhfbjzaoIvL-a`.
- Archivo canónico: `Code.gs`.
- Drive file ID: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Carpeta de respaldos: `00_BACKUPS_CODE_GS`, ID `1OHyjrubHJfeBOxx0kfYm0cWrM5xtyOZr`.
- Respaldo inicial: `Code_F98_4_Z6_CS21A46_COMPLETO_2026-07-11.gs`, ID `1sJJ9umm5tGoMGibIoQiIECGYFZ91ErCT`.
- Manifiesto Drive: `README_BACKEND_ACTUAL.txt`, ID `179pqbUFMPiOUN6Lo3YA_Ia51lKtqtP8u`.

## Integridad verificada

- Encabezado: `F98.4-Z6-CS21A46 · SEGUIMIENTO INMEDIATO: SOLO DESEMBOLSO ACADÉMICO 01`.
- Entrega declarada: `ENTREGA_F98_4_Z6_CS21A46_SOLO_DESEMBOLSO_ACADEMICO_01.zip`.
- Ruta interna: `AppsScript/Code.gs`.
- Tamaño exacto: `2,879,996` bytes.
- SHA-256: `6cd638901f75ff56c4bc5f100be0203de05f82aa01a8b1f838f2c95bc7433568`.
- Conteo físico: `50,122` saltos de línea y línea final vacía; algunos editores muestran `50,123` líneas.
- Producción: no verificada.

## Regla obligatoria para futuras modificaciones

1. Leer siempre el archivo canónico por su Drive file ID `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
2. Antes de modificar, crear una copia versionada dentro de `00_BACKUPS_CODE_GS`.
3. Trabajar sobre esa copia local/verificada, no sobre CS21A42 ni sobre archivos encontrados por nombre solamente.
4. Validar sintaxis, tamaño y SHA-256 del resultado.
5. Reemplazar los bytes del mismo archivo `Code.gs` canónico conservando su Drive file ID.
6. Actualizar `README_BACKEND_ACTUAL.txt` y toda la documentación canónica.
7. Entregar un único `Code.gs` completo cuando Apps Script cambie.
8. No afirmar despliegue hasta comprobar la publicación real en Apps Script.

## Frontend relacionado

F98.4-Z6-CS21A54 modifica únicamente el frontend docente de libros y `campus.html`.

- Elimina el panel lateral interno de niveles y la vista antigua de carpeta Drive en Libros/Biblioteca.
- Coloca nivel, SB/TB/WB, unidades y acciones en controles horizontales superiores.
- Extiende el visor PDF.js de dos páginas a todo el ancho disponible.
- Añade navegación, zoom y pantalla completa.
- Mantiene cada PDF en memoria al cambiar de unidad.
- No usa `/preview` como respaldo ni vuelve a la vista anterior.
- El error actual `Failed to fetch` requiere una ruta backend segura para servir el PDF a PDF.js; no debe ocultarse dejando el visor vacío.
- B1 usa `Interchange 5th intro-SB.pdf`, ID `1pnR7RoJGkZnx08TlfrEgxEqVRnlrCwea`.

## Pendiente backend inmediato

Agregar sobre el `Code.gs` canónico CS21A46 una ruta autorizada para que el visor docente reciba el PDF desde Drive sin bloqueo CORS, conserve el visor extendido de dos páginas y permita U01–U16 con salto automático. Antes de este cambio se debe crear un nuevo respaldo versionado.

La selección automática del SB/TB/WB vigente dentro de cada carpeta también requiere reglas inequívocas. Para cambiar un libro sin código, debe reemplazarse/versionarse el archivo canónico conservando su mismo ID; subir otro archivo crea un ID nuevo.

## Funciones preservadas

- Consulta individual fresca.
- Pago de certificado separado de emisión.
- Pagos con controles de integridad.
- Lectura directa de `7-morosidad`.
- Resumen desde `6-historial`.
- Solo desembolso académico `01` en Seguimiento inmediato.
- No mover pagos entre niveles o intentos.
- No crear automatizaciones nuevas de CONAPE.

Preparado, respaldado o guardado no significa desplegado.