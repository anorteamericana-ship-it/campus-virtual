# Traspaso técnico · Campus Virtual · CS21A126

Fecha de corte: 2026-07-18
Repositorio: `anorteamericana-ship-it/campus-virtual`
Rama productiva: `main`

## Estado confirmado en GitHub

La base funcional más reciente antes de este documento es:

- `74f141e051cbcb3cf1144fadb9569609ad09f7d9` — limita el workflow de Club I CAN a archivos relevantes y cancela ejecuciones obsoletas.
- `ae3aba7228c033ab28bcd356765ad92d053decb7` — amplía la validación automática de los recursos estudiantiles CS21A126.
- `9fa4155602950df22e4fb3ab124f520ae65690e2` — publica Calendario académico limpio, Tareas separadas y libros visuales.

El PR histórico #1 fue cerrado porque su corrección de seguridad ya estaba incorporada en `main`.

## Cambios funcionales actuales

### Menú del estudiante

- `Calendario académico` debe mostrar únicamente el cronograma del grupo.
- Las pestañas heredadas `Materiales` y `Tareas` fueron retiradas del Calendario.
- `Tareas` aparece como opción independiente justo debajo de `Evaluaciones`.
- La pantalla de Tareas es todavía un placeholder honesto: no debe mostrar tareas ficticias hasta implementar publicación, entrega, revisión y retroalimentación.

Archivos principales:

- `src/student_calendar_cleanup_cs21a126.js`
- `src/student_tasks_menu_cs21a126.js`
- `styles/student_tasks_menu_cs21a126.css`
- `src/student_menu_academic_guard_cs21a120.js`
- `campus.html`

### Recursos Didácticos · Libros y Audios

- Usa el mismo visor visual de páginas/imágenes del docente.
- El estudiante solo puede acceder a `SB` y `WB`; nunca al `TB`.
- Mantiene botones para abrir y descargar los PDF completos.
- Los audios se muestran debajo, organizados por unidad.
- El selector de niveles respeta acceso acumulativo.

Archivos principales:

- `src/book_unit_starts_cs21a60.jsx`
- `src/student_books_proxy_cs21a126.jsx`
- `src/student_content_access_cs21a125.jsx`
- `styles/student_books_audios_cs21a126.css`
- `styles/student_content_access_cs21a125.css`

### Regla académica acumulativa

Estados que habilitan contenido: `CA`, `APR`, `CNV`.

- B1 habilitado → B1.
- B2 habilitado → B1 + B2.
- I1 habilitado → B1 + B2 + I1.
- I2 habilitado → B1 + B2 + I1 + I2.

No se habilitan niveles futuros. La regla aplica a Planeamiento, Plan de Estudio, Libros y Audios, Recursos adicionales y filtros de English LAB.

### Apps Script

GitHub contiene principalmente frontend y documentación. El backend canónico sigue siendo `Code.gs` en Google Drive / Apps Script.

No asumir que una función de backend está publicada solo porque existe el frontend. Antes de modificar flujos sensibles hay que comprobar la implementación activa de Apps Script.

Puntos pendientes de verificación:

- Endpoints completos de Club I CAN.
- Backend CS21A123 del importador bancario contra toda `BDBANCARIO`.
- Estado exacto de publicación de cualquier `Code.gs` preparado fuera de GitHub.

## Falla histórica de GitHub Actions

Correo recibido:

`PR run failed: Validate CS21A122 Club I CAN - Validate CS21A122 (9d54307)`

Causa confirmada:

- El commit histórico `9d54307e0fc1fc76dee31c3d6f9c85ce90062863` contenía una versión minificada inválida de `src/ican_participation_cs21a122.js`.
- El inicio decía `if(!R)return,h=...`, lo que hacía fallar `node --check`.
- La versión actual usa una salida válida: `if(!ReactRef)return;` y luego declara `h` en otra sentencia.
- Una validación posterior del workflow terminó correctamente.

El workflow fue ajustado para:

- ejecutarse en PR solamente cuando cambian archivos de Club I CAN;
- dejar de activarse por documentos temporales de QA;
- cancelar ejecuciones anteriores de la misma rama;
- conservar revisión de sintaxis y presencia de activos.

Archivo:

- `.github/workflows/validate-cs21a122.yml`

## Prioridades para el siguiente chat

1. Abrir el Campus como estudiante y revisar visualmente `Recursos Didácticos → Libros y Audios` en escritorio y móvil.
2. Confirmar que SB y WB abren como libro visual, descargan correctamente y nunca muestran TB.
3. Confirmar audios por unidad y acceso acumulativo entre B1, B2, I1 e I2.
4. Revisar que Calendario académico no muestre Materiales ni Tareas.
5. Revisar que Tareas esté exactamente debajo de Evaluaciones.
6. Después continuar con ajustes visuales finos o diseñar el flujo real de Tareas.
7. La limpieza general del repositorio debe hacerse con inventario de dependencias; no borrar módulos por parecer antiguos.

## Reglas de trabajo

- Revisar primero el estado actual de `main` y los últimos commits.
- No afirmar que Apps Script quedó desplegado sin comprobarlo.
- No borrar archivos sin demostrar que no son cargados desde `campus.html`, `anLazyCampus`, imports, workflows o referencias en `window`.
- Hacer cambios pequeños, identificables y validados.
- Mantener las reglas académicas y financieras existentes.
