# FUENTE VERDADERA — F98.4-Z6-CS21A63

Estado canónico: frontend CS21A63 guardado en GitHub `main`; backend completo CS21A60 preservado en el archivo canónico de Drive; producción no verificada.

## Cambio CS21A63 — audios compactos dentro de Libros de texto

Se recupera el flujo oficial de audios que ya existía en `src/syllabus_views.jsx` y se integra dentro del visor actual sin rediseñar ni mover sus controles principales.

Flujo reutilizado:

- Catálogo por nivel mediante `getBibliotecaNivelEstudiante`.
- Lista agrupada en `catalogo.audios_unidades`.
- Filtro real por nombre del archivo: `Unit 01` a `Unit 16`.
- Solo se muestran pistas `.mp3` correspondientes a la unidad seleccionada.
- La pista elegida se solicita mediante `getAudioPistaEstudiante`.
- El backend entrega un Blob base64 temporal; no se exponen llaves ni rutas internas.
- Al cambiar de nivel, libro o unidad se detiene y libera la pista anterior.

Montaje visual:

- Archivo nuevo: `src/book_inline_audio_cs21a63.js`.
- Se monta únicamente en la franja superior de `Libros de texto`, al lado derecho de B1/B2/I1/I2.
- No elimina ni cambia SB/TB/WB, U01–U16, calibración, botones PDF, navegación, zoom, pantalla completa ni efecto de hojas.
- El bloque contiene una etiqueta compacta `♪ nivel · libro · unidad`, un combo pequeño y un reproductor pequeño.
- En pantallas estrechas puede bajar dentro de la misma franja para evitar superposiciones.
- El catálogo se almacena temporalmente por nivel para no repetir consultas innecesarias.
- Se aplica a superadmin, admin y docente porque esos perfiles ya están autorizados por los endpoints preservados.
- No se retira todavía la entrada separada `Audios`; queda preservada para evitar regresiones.

Este cambio es exclusivamente frontend. No requiere modificar ni volver a copiar `Code.gs`.

## Cambio preservado CS21A62 — efecto de paso de hoja

El visor compartido de libros incorpora una animación de hoja física al navegar.

- `Siguiente`: gira la hoja derecha hacia la izquierda.
- `Anterior`: gira la hoja izquierda hacia la derecha.
- U01–U16: aplica el giro según la dirección del salto.
- Duración aproximada: 680 ms.
- Incluye perspectiva 3D, sombra dinámica, cara posterior tenue y pulso del lomo.
- Respeta `prefers-reduced-motion`.

Archivo: `src/book_page_turn_cs21a62.js`.

## Hotfix preservado CS21A61 — arranque estable de Recursos Didácticos

- Carga explícitamente `src/syllabus_views.jsx?v=F98.4Z6G` mediante `window.anLazyCampus`.
- Espera a que CS21A59 y CS21A60 terminen de encadenar `MaterialesView`.
- Muestra `Preparando biblioteca…` durante la carga.
- Si la dependencia falla, muestra el motivo real y permite `Reintentar`.

Archivo: `src/admin_resources_runtime_cs21a61.jsx`.

## Cambio preservado CS21A60 — inicios U01–U16 persistentes

- Cada libro conserva su propio arreglo `unitStarts` dentro de su `book.json`.
- La configuración es independiente por nivel y tipo: B1/B2/I1/I2 × SB/TB/WB.
- Solo `superadmin` puede modificar un inicio.
- Se guarda la hoja derecha visible del pliego.
- Docentes, administradores y estudiantes reciben el mapa actualizado en la siguiente carga.
- SB conserva temporalmente el mapa anterior como fallback.
- TB y WB quedan sin inicio inventado hasta que el superadmin los configure.

## Accesos

- Superadmin: SB/TB/WB, actualización desde Drive, calibración U01–U16 y audio compacto.
- Admin: SB/TB/WB, actualización desde Drive y audio compacto; sin calibración.
- Docente: SB/TB/WB y audio compacto.
- Estudiante: SB/WB del nivel activo; el audio compacto CS21A63 no se monta en su franja porque no utiliza el selector de cuatro niveles.

## Frontend vigente

- `src/teacher_cs21a_order_fix.jsx`: base visual preservada CS21A58.
- `src/admin_resources_cs21a59.jsx`: panel administrativo preservado.
- `src/admin_resources_superadmin_cs21a60.jsx`: acceso real de superadmin.
- `src/book_unit_starts_cs21a60.jsx`: visor compartido y calibración U01–U16.
- `src/admin_resources_runtime_cs21a61.jsx`: carga diferida estable.
- `src/book_page_turn_cs21a62.js`: animación de paso de hoja.
- `src/book_inline_audio_cs21a63.js`: audio compacto sincronizado.
- `campus.html`: carga CS21A63 después de CS21A62.

## Backend canónico preservado

- Versión: F98.4-Z6-CS21A60.
- Archivo Drive: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Tamaño: `2.915.832` bytes.
- Saltos de línea: `51.143`.
- SHA-256: `1ae938995f99407e2914f406346edcf7e64d2517c6dd0869db14b14730947a56`.
- Endpoints de audio preservados: `getBibliotecaNivelEstudiante` y `getAudioPistaEstudiante`.

## Reglas preservadas

- No mover pagos entre niveles o intentos.
- No modificar pagos, certificados, CONAPE, calendario ni hojas académicas.
- No crear triggers nuevos de CONAPE.
- Guardado no significa desplegado ni probado en producción.
