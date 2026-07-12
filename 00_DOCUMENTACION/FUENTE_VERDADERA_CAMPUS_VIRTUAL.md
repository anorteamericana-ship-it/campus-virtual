# FUENTE VERDADERA — F98.4-Z6-CS21A65

Estado canónico: frontend CS21A65 guardado en GitHub `main`; backend canónico CS21A64 preservado en Drive; producción no verificada.

## Cambio CS21A65 — Recursos Didácticos unificados

Se corrige la multiplicación de secciones `Recursos Didácticos` causada por los envoltorios sucesivos CS21A59/CS21A60. El nuevo archivo `src/resources_panel_cs21a65.jsx` elimina la cadena repetida y monta una única sección por rol.

### Menú

- Admin y superadmin: una sola sección `Recursos Didácticos` con `Libros y Audios`.
- Docente: conserva un solo acceso `Libros y Audios`; se ocultan `Biblioteca digital` y la entrada separada `Audios`.
- Estudiante: `Mi curso` pasa a llamarse `Libros y Audios` y se ubica bajo una sección propia `Recursos Didácticos`.
- Las rutas antiguas `audios` y `biblioteca` se normalizan hacia `libros`.
- El estudiante abre directamente la pestaña Materiales; no se mezcla el cronograma ni la biblioteca antigua debajo del visor unificado.

### Permisos visuales

- Superadmin: SB/TB/WB, audio, recursos adicionales, calibración U01–U16 y `Actualizar desde Drive`.
- Admin: SB/TB/WB, audio y recursos adicionales; sin botones de edición o actualización.
- Docente: SB/TB/WB y audio; sin botones de edición o actualización; en recursos adicionales solo ve el Diccionario.
- Estudiante: SB/WB del nivel activo, audio y recursos adicionales del nivel; sin TB ni controles administrativos.

La sesión real se consulta antes que el alias interno `role=admin`, evitando ocultar los controles al superadmin verdadero.

## Audios y recursos adicionales

`src/book_inline_audio_cs21a63.js` conserva su ruta histórica pero su contenido vigente es CS21A65.

- Usa los endpoints preservados `getBibliotecaNivelEstudiante` y `getAudioPistaEstudiante`.
- Se monta también en el visor del estudiante aunque no existan botones B1/B2/I1/I2.
- El nivel del estudiante se obtiene de su sesión o grupo activo.
- Agrega un combo compacto `Recursos adicionales` usando `catalogo.recursos`.
- El estudiante recibe los recursos oficiales de su nivel.
- El docente filtra únicamente archivos identificados como Diccionario / Word by Word Dictionary.
- Al cambiar nivel, libro o unidad se detiene el audio y se libera el Blob anterior.

Limpieza de nombres:

- Antes: `IC5_L0_Unit 01 Pg 002 Ex 01 Conversation Pt A.mp3`.
- Visible: `Unit 01 Ex 01 Conversation Pt A.mp3`.

No se renombra ningún archivo en Drive; solo cambia la etiqueta mostrada en el combo.

## Archivos frontend vigentes

- `src/admin_resources_cs21a59.jsx` — base preservada.
- `src/admin_resources_superadmin_cs21a60.jsx` — base preservada.
- `src/book_unit_starts_cs21a60.jsx` — visor y permisos base preservados.
- `src/admin_resources_runtime_cs21a61.jsx` — carga diferida estable.
- `src/book_page_turn_cs21a62.js` — efecto de paso de hoja.
- `src/book_inline_audio_cs21a63.js` — audio y recursos adicionales CS21A65.
- `src/book_unit_propagation_cs21a64.js` — propagación opcional UXX–U16.
- `src/resources_panel_cs21a65.jsx` — menú, rutas y limpieza por rol.
- `campus.html` — carga CS21A65 después de CS21A64.

## Backend canónico preservado

- Versión instalada/canónica: F98.4-Z6-CS21A64.
- Archivo Drive: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Tamaño: `2.923.949` bytes.
- SHA-256: `d5217ceb90a4716c9161284a81c242a238649ed034bb97a36657716c6593feda`.
- Respaldo adicional previo a CS21A65: `1AzAJIIsJvyU_CiHPbYEs3PwKMBF8_xxt`.

Existe un candidato completo CS21A65 que restringe `adminBooksRefreshOpenBook` al rol exacto `superadmin`; no se considera instalado ni desplegado hasta reemplazar el proyecto Apps Script y crear una nueva implementación.

## Reglas preservadas

- No mover pagos entre niveles o intentos.
- No modificar pagos, certificados, CONAPE, calendario ni hojas académicas.
- No crear triggers nuevos de CONAPE.
- Guardado en GitHub no significa desplegado ni probado en producción.
