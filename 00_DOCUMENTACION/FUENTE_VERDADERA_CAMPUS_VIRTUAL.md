# FUENTE VERDADERA — F98.4-Z6-CS21A58

Estado canónico: frontend CS21A58 guardado en GitHub; backend completo CS21A58 guardado en el archivo canónico de Drive; producción no verificada.

## Componentes vigentes

- `src/teacher_cs21a_order_fix.jsx`
- `campus.html`
- `Code.gs` completo CS21A58 de Drive
- Drive `LIBROS EN IMAGENES`: `1nw_kPwqWDWdnP-5M3E9B57Q0nmyUCdDK`
- Catálogo general: `1UTeCZQpLoEsdJkm3_kQRqni19uuZBTuO`

## Cambio CS21A58 — visor WebP por orden de manifiesto

- Sustituye el renderizado PDF.js por páginas WebP.
- `campus.html` deja de cargar PDF.js.
- El visor carga únicamente las dos hojas visibles y precarga las dos siguientes.
- Los pliegos se forman por posición de `pages[]`: `0+1`, `2+3`, `4+5`, etc.
- No se supone que los nombres de archivo sean consecutivos.
- Todo libro inicia mostrando las primeras dos entradas del arreglo.
- U01 brilla hasta que el docente seleccione una unidad.
- U01–U16 aparece solamente en Student Book.
- El mapa de unidades es provisional por nivel y debe verificarse visualmente.
- El botón Descargar PDF continúa usando el PDF oficial de la carpeta académica original.
- `Actualizar desde Drive` invalida el manifiesto en caché.

## Backend

- Endpoint nuevo: `teacherBooksOpenImageBook`.
- Lee `book.json`, recorre la carpeta `pages` y devuelve los IDs/URLs de las imágenes.
- Docente/admin: SB, TB y WB.
- Estudiante: SB y WB; TB bloqueado.
- Los endpoints PDF anteriores se conservan, pero el frontend CS21A58 ya no los usa.
- Cambio de solo lectura.

## Drive corregido

- Total real: `2.051` páginas WebP.
- B1: `492`; B2: `528`; I1: `514`; I2: `517`.
- Los tres `book.json` de B1 ya incluyen `levelCode: B1` y el mismo esquema de los demás niveles.
- La carpeta raíz está compartida como cualquier persona con el enlace, lector.
- Los PDF duplicados fueron retirados por el usuario.

## Integridad backend

- Archivo canónico: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Tamaño: `2.899.463` bytes.
- SHA-256: `d3505496b8e953d4fd0849a7a5af102760a452caa43d41bc9a7055006897ca87`.
- Respaldo previo CS21A56: `15Yq5aAbxMwvKKZo6e4Vg7kgw7axv5yra`.
- Copia de cierre CS21A58: `1FDjvFP3_suvo_1k2Y8xa_59kyJ_yg9yb`.

## Reglas preservadas

- Solo desembolso académico `01` en Seguimiento inmediato.
- `02/03+` no cierran el `01`.
- Resumen vertical desde `6-historial`.
- Nunca mover pagos entre niveles o intentos.
- Guardado no significa desplegado.
