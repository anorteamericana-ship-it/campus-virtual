# FUENTE VERDADERA — F98.4-Z6-CS21A59

Estado canónico: frontend CS21A59 guardado en GitHub; backend completo CS21A59 guardado en el archivo canónico de Drive; producción no verificada.

## Componentes vigentes

- `src/teacher_cs21a_order_fix.jsx` CS21A58: visor WebP compartido del docente.
- `src/admin_resources_cs21a59.jsx`: Recursos Didácticos del admin y separación de permisos.
- `campus.html`: carga CS21A59.
- `Code.gs` completo CS21A59 en Drive.
- Drive `LIBROS EN IMAGENES`: `1nw_kPwqWDWdnP-5M3E9B57Q0nmyUCdDK`.

## Cambio CS21A59 — Recursos Didácticos del admin

- El menú administrativo incorpora `Recursos Didácticos`.
- Contiene `Libros de texto` y `Audios`.
- La vista reutiliza la misma presentación visual del docente.
- El docente ya no ve `Actualizar desde Drive`.
- Admin y superadmin sí ven `Actualizar desde Drive`.
- El botón opera exclusivamente sobre el nivel y tipo de libro abiertos.
- No actualiza los otros once libros.
- No copia, mueve, renombra ni elimina imágenes.
- No procesa ni modifica PDF.

## Sincronización del libro abierto

Endpoint: `adminBooksRefreshOpenBook`.

- Recorre la carpeta `pages` del libro abierto.
- Ordena los WebP por el número actual del nombre del archivo.
- Reconstruye únicamente el arreglo `pages[]` de ese `book.json`.
- `displayIndex` vuelve a quedar consecutivo.
- `sourcePage` conserva el número detectado en el nombre.
- Invalida solo la caché del nivel/tipo actualizado.
- Rechaza nombres WebP duplicados.
- Requiere rol `admin` o `superadmin`.

## Audios

Carpetas oficiales:

- B1: `1dTO0jU1cPvY69YWELAsTyd-qkQUnQbla`.
- B2: `1VZtIb7-4qP8YUM7tqGKVTZ2CsvxXqsqT`.
- I1: `1kjXwAfxhQTVZcXHNjYoJOtsllS5OC-7t`.
- I2: `1_PfLqToC_QSO7OtNJLv5uY3i3Ff-YaX6`.

## Integridad backend

- Archivo canónico: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Tamaño: `2.906.208` bytes.
- SHA-256: `a3a4b2423c274833deb2f2d4d30859a85e7b1676779b371c395d244f4ab6773d`.
- Saltos de línea: `50.867`.
- Respaldo previo CS21A58: `1yHzOKu0o1kx5SIxI2w2bqW-pxvsMx0Ls`.
- Copia de cierre CS21A59: `1hT1VgtNcA3eRmw6-_HaWv0s95743PUq8`.

## Reglas preservadas

- Solo desembolso académico `01` en Seguimiento inmediato.
- `02/03+` no cierran el `01`.
- Nunca mover pagos entre niveles o intentos.
- No modificar pagos, certificados, CONAPE, calendario ni hojas académicas para este cambio.
- Guardado no significa desplegado.
