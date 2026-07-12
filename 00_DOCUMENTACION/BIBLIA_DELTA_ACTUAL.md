# BIBLIA DELTA ACTUAL — F98.4-Z6-CS21A59

## Estado

- Frontend guardado en `main`: CS21A59.
- Backend completo canónico: CS21A59.
- Base preservada: CS21A58 / CS21A56 / CS21A46.
- Producción no verificada.

## Admin — Recursos Didácticos

El menú administrativo incorpora:

- `Libros de texto`.
- `Audios`.

La vista es la misma que usa el docente. No se crea un segundo visor independiente.

## Permisos

- Docente: consulta libros y audios.
- Admin/superadmin: consulta libros y audios.
- Solo admin/superadmin puede ejecutar `Actualizar desde Drive`.
- El docente no debe ver ese botón.
- El endpoint vuelve a verificar el rol; ocultar el botón no es la única protección.

## Alcance de Actualizar desde Drive

Endpoint: `adminBooksRefreshOpenBook`.

- Actualiza solo el nivel y tipo abiertos.
- Ejemplo: si está abierto `B1 · SB`, no toca B1/TB, B1/WB ni los otros niveles.
- Lee únicamente la carpeta `pages` de ese libro.
- Ordena por el número actual del nombre WebP.
- Reconstruye `pages[]` con `displayIndex` consecutivo.
- Mantiene `sourcePage` según el nombre actual.
- Rechaza nombres duplicados.
- Invalida solo la caché de ese libro.
- No crea copias de imágenes.
- No mueve, renombra ni elimina archivos.
- No procesa ni modifica PDF.

## Visor

- Sigue usando WebP por orden del manifiesto.
- Forma pliegos por posiciones `0+1`, `2+3`, `4+5`.
- Si falta un número, continúa con la siguiente entrada.
- U01–U16 sigue siendo provisional y exclusivo de SB.
- El PDF oficial queda para abrir y descargar.

## Audios oficiales

- B1: `1dTO0jU1cPvY69YWELAsTyd-qkQUnQbla`.
- B2: `1VZtIb7-4qP8YUM7tqGKVTZ2CsvxXqsqT`.
- I1: `1kjXwAfxhQTVZcXHNjYoJOtsllS5OC-7t`.
- I2: `1_PfLqToC_QSO7OtNJLv5uY3i3Ff-YaX6`.

## Integridad

- Backend: `2.906.208` bytes.
- SHA-256: `a3a4b2423c274833deb2f2d4d30859a85e7b1676779b371c395d244f4ab6773d`.
- Saltos de línea: `50.867`.
- Cambio limitado al módulo de Recursos Didácticos.
- No modifica pagos, certificados, CONAPE, calendario ni hojas académicas.

## Reglas preservadas

- Solo desembolso académico 01.
- 02/03+ no cierran el 01.
- Nunca mover pagos entre niveles o intentos.
- Guardar archivos no equivale a desplegar producción.
