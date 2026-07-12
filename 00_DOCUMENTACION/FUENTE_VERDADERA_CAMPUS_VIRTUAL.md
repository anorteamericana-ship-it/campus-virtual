# FUENTE VERDADERA — F98.4-Z6-CS21A72

Estado: frontend CS21A71 guardado en GitHub `main`; backend canónico actualizado a CS21A72 en Drive; publicación de Apps Script y prueba de producción no verificadas.

## CS21A72 — Accesos estudiante de la máscara de Keylor

El backend canónico incorpora tres perfiles de estudiante vinculados al grupo demo `0626`:

- Mariana Solano Vargas — código `AN0626-01`.
- Sebastián Calderón Mora — código `AN0626-02`.
- Valeria Jiménez Arias — código `AN0626-03`.

Los alias y la contraseña compartida se conservan únicamente dentro del backend canónico y no se documentan en GitHub por tratarse de un repositorio público.

### Fuente de datos

Estos perfiles no existen en las hojas reales. Sus datos se generan desde las funciones de la máscara docente Keylor:

- roster demo;
- grupo `0626`;
- nivel activo `I1`;
- historial B1/B2 aprobado e I1 en curso;
- asistencia y ausencias demo;
- evaluaciones y retroalimentación demo;
- Club I CAN demo.

### Seguridad y aislamiento

- Sesión con rol `student` y código propio.
- Propiedad del expediente validada por código.
- Respuestas marcadas `demo:true` y `read_only:true`.
- Sin filas nuevas en `USUARIOS`, `DATOS` ni `ESTATUS`.
- Edición de datos personales bloqueada.
- Cambio de foto bloqueado.
- Reporte de pagos bloqueado.
- Sin modificaciones en pagos, certificados, CONAPE, calendario o expedientes reales.

### Backend canónico

- Versión: F98.4-Z6-CS21A72.
- ID Drive: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Nombre: `Code.gs`.
- Tamaño: `2.949.066` bytes.
- SHA-256: `99474bf03419c615e3ec070d3ba8117bfd4afecf9c9c9e1185309ac9cbf6bf2e`.

El archivo pasó validación de sintaxis JavaScript. Guardarlo en Drive no actualiza por sí solo el despliegue web de Apps Script.

## Frontend vigente CS21A71

No hubo cambios de frontend para CS21A72. `src/login.jsx` ya usa el endpoint POST `iniciarSesion` y conserva el usuario introducido como identidad de sesión.

### Prematrícula activa

La prematrícula sin código utiliza su Sidebar original desde el primer render. El normalizador académico de Recursos Didácticos queda fuera de esta sesión, evitando la aparición temporal de:

- Recursos Didácticos.
- Libros y Audios.
- Recursos adicionales.
- Rutas académicas no habilitadas.

Archivo responsable:

- `src/prematricula_english_lab_ui_cs21a71.js`.

El archivo se carga desde `src/resources_panel_state_cs21a65.js` antes de `app.jsx`.

### English LAB Gratis

El contenido vigente de `src/english_lab_free_access_cs21a66.js` corresponde a CS21A71.

- No existe verificación por `focus`.
- No se revisa nuevamente al tocar o navegar.
- La decisión se conserva 30 minutos para la misma identidad.
- La autorización incluida en sesión se usa inmediatamente.
- Durante la única revisión inicial, el botón permanece visible pero bloqueado.
- Una falla temporal de red no tapa English LAB cuando el acceso ya estaba autorizado.
- La ruta directa sigue protegida cuando la prematrícula no está autorizada.

`src/prospect_free_student.jsx` usa la misma decisión global que la opción lateral y la compuerta. El estado comercial no sustituye `INICIO_GRATUITO_AUTORIZADO`.

### Visual de English LAB

Para una prematrícula sin código se ocultan únicamente:

- Mapa de progreso.
- Banco curricular.
- Áreas cognitivas demo.

Se mantienen el encabezado, bienvenida, resumen rápido, juegos gratis, logros, medallas, catálogo demo y el resto de funciones existentes.

Cuando la sesión tiene código de estudiante:

- el código prevalece sobre marcas antiguas de prematrícula;
- deja de tratarse como usuario gratis;
- el catálogo cambia al nivel académico correspondiente;
- se muestran Mapa de progreso, Banco curricular y Áreas cognitivas.

## Archivos frontend vigentes

- `src/prematricula_english_lab_ui_cs21a71.js`.
- `src/english_lab_free_access_cs21a66.js` — contenido CS21A71.
- `src/prospect_free_student.jsx`.
- `src/resources_panel_state_cs21a65.js` — cargador CS21A71.

No se modificaron `campus.html`, `src/academia_play.jsx` ni `src/login.jsx`.

## Preservado

- CS21A70: Panel Maestro CONAPE.
- CS21A69: selección lateral única.
- CS21A68: Recursos adicionales independiente.
- CS21A67: árbol de recursos y carga estable.
- Libros, audios, PDF, zoom, efecto de hojas y calibración U01–U16.
- Pagos, certificados, calendario, `DATOS`, `ESTATUS` y fuentes externas CONAPE sin cambios.

Guardado en GitHub o Drive no significa desplegado ni probado en producción.
