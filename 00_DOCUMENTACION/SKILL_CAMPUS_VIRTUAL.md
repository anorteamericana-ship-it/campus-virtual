# SKILL OPERATIVA — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

## Forma obligatoria de trabajo

- Responder en español directo para una persona que trabaja por copy/paste.
- Antes de modificar, indicar si afecta frontend, Apps Script o ambos y nombrar archivos exactos.
- Con acceso a GitHub, hacer los cambios directamente.
- Si Apps Script cambia, entregar un único `Code.gs` completo.
- Mantener `00_DOCUMENTACION` como fuente verdadera.
- Diferenciar guardado, respaldado, instalado y desplegado.
- No afirmar producción sin prueba real.

## Riesgo alto

Analizar antes de tocar pagos, certificados, `DATOS`, `ESTATUS`, `GRUPOS`, `INTENTOS_ACADEMICOS`, CONAPE o calendario. Nunca mover pagos entre niveles o intentos.

## Continuidad vigente

- Frontend: F98.4-Z6-CS21A59.
- Backend completo: F98.4-Z6-CS21A59.
- Base preservada: CS21A58 / CS21A56 / CS21A46.
- Producción no verificada.

## Recursos Didácticos

- Visor base: `src/teacher_cs21a_order_fix.jsx` CS21A58.
- Puente admin/permisos: `src/admin_resources_cs21a59.jsx`.
- Backend lector: `teacherBooksOpenImageBook`.
- Backend sincronizador admin: `adminBooksRefreshOpenBook`.
- Admin y docente deben compartir la misma vista de libros y audios.
- No mantener dos implementaciones visuales separadas.

## Permisos

- Docente: lectura de libros y audios.
- Admin/superadmin: lectura de libros y audios.
- Solo admin/superadmin ve y puede ejecutar `Actualizar desde Drive`.
- El backend debe validar el rol aunque el botón esté oculto.
- Estudiante no forma parte de este cambio.

## Actualizar desde Drive

- Actualiza exclusivamente el libro abierto.
- Nivel y tipo se resuelven desde la selección visible.
- Recorre solo la carpeta `pages` de ese libro.
- Ordena por el número actual del nombre WebP.
- Reconstruye solo ese `book.json`.
- No tocar los otros once libros.
- No copiar, mover, renombrar ni eliminar imágenes.
- No procesar ni modificar PDF.
- Detectar y rechazar nombres duplicados.
- Invalidar únicamente la caché del libro actualizado.

## Visor WebP

- Emparejar por posiciones de `pages[]`: `0+1`, `2+3`, `4+5`.
- No calcular la siguiente imagen sumando uno al nombre.
- Si falta un número, continuar por el orden del arreglo.
- Cargar solo dos hojas y precargar las dos siguientes.
- U01–U16 pertenece únicamente a SB y sigue en QA.
- El PDF oficial se usa solo para abrir o descargar.

## Audios

- B1: `1dTO0jU1cPvY69YWELAsTyd-qkQUnQbla`.
- B2: `1VZtIb7-4qP8YUM7tqGKVTZ2CsvxXqsqT`.
- I1: `1kjXwAfxhQTVZcXHNjYoJOtsllS5OC-7t`.
- I2: `1_PfLqToC_QSO7OtNJLv5uY3i3Ff-YaX6`.

## Regla para Code.gs

1. Leer el archivo canónico de Drive.
2. Verificar tamaño y hash.
3. Crear respaldo antes de modificar.
4. Trabajar sobre la versión vigente.
5. Reemplazar el mismo archivo conservando su ID.
6. Recalcular tamaño, líneas y SHA-256.
7. Entregar el archivo completo.
8. No afirmar despliegue sin prueba.

## Reglas preservadas

- Solo desembolso académico 01.
- 02/03+ no cierran el 01.
- No mover pagos entre niveles o intentos.
- No crear triggers nuevos de CONAPE.
