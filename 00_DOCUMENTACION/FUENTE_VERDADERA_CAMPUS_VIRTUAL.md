# FUENTE VERDADERA — F98.4-Z6-CS21A71

Estado: frontend CS21A71 guardado en GitHub `main`; backend canónico continúa en CS21A70; publicación de Apps Script y prueba de producción no verificadas.

## Prematrícula activa

La prematrícula sin código utiliza su Sidebar original desde el primer render. El normalizador académico de Recursos Didácticos queda fuera de esta sesión, por lo que ya no puede insertar y retirar temporalmente:

- Recursos Didácticos.
- Libros y Audios.
- Recursos adicionales.
- Otras rutas académicas no habilitadas.

Archivo responsable:

- `src/prematricula_english_lab_ui_cs21a71.js`.

El archivo se carga desde `src/resources_panel_state_cs21a65.js` antes de `app.jsx`.

## English LAB Gratis

El contenido vigente de `src/english_lab_free_access_cs21a66.js` corresponde a CS21A71.

Reglas:

- No existe verificación por `focus`.
- No se revisa nuevamente al tocar o navegar por la pantalla.
- La decisión se conserva 30 minutos en `sessionStorage` para la misma identidad.
- Si la sesión ya incluye la autorización, English LAB aparece inmediatamente.
- Durante la única revisión inicial, el botón permanece visible pero bloqueado para evitar un cambio brusco del menú.
- Una autorización confirmada no se pierde por una falla temporal de conexión.
- La ruta directa sigue protegida cuando la prematrícula no está autorizada.

`src/prospect_free_student.jsx` usa la misma decisión global que la opción lateral y la compuerta. El estado comercial de la solicitud no sustituye `INICIO_GRATUITO_AUTORIZADO`.

## Visual de English LAB

### Prematrícula sin código

Se ocultan únicamente:

- Mapa de progreso.
- Banco curricular.
- Áreas cognitivas demo.

Se mantiene:

- Encabezado y bienvenida.
- Resumen rápido.
- Juegos gratis.
- Línea de logros y medallas.
- Catálogo demo.
- El resto de funciones existentes.

La ocultación se aplica antes del primer pintado para que los paneles restringidos no parpadeen.

### Estudiante con código real

La existencia del código tiene prioridad sobre marcas antiguas de prospecto o prematrícula.

- Deja de tratarse como usuario gratis.
- El título cambia a `Catálogo Básico I` o al nivel académico oficial.
- El catálogo se coloca antes de los paneles de seguimiento.
- Debajo se muestran Mapa de progreso, Banco curricular y Áreas cognitivas del nivel.

## Archivos frontend vigentes CS21A71

- `src/prematricula_english_lab_ui_cs21a71.js` — nuevo.
- `src/english_lab_free_access_cs21a66.js` — contenido CS21A71.
- `src/prospect_free_student.jsx` — acceso sincronizado.
- `src/resources_panel_state_cs21a65.js` — cargador CS21A71.

No se modificaron:

- `campus.html`.
- `src/academia_play.jsx`.
- `Code.gs`.

## Backend canónico preservado

- Versión: F98.4-Z6-CS21A70.
- ID Drive: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Tamaño: `2.938.302` bytes.
- SHA-256: `278cd64101c99abc6ecfc0e30ea4f6560fd3555c8c923756f7947d2e0ad26c28`.

El backend ya incluye `freeUserEnglishLabAccess`, los metadatos de autorización en sesión y `freeUserMiPerfil.acceso_english_lab`.

## Preservado

- CS21A70: Panel Maestro CONAPE.
- CS21A69: selección lateral única.
- CS21A68: Recursos adicionales independiente.
- CS21A67: árbol de recursos y carga estable.
- Libros, audios, PDF, zoom, efecto de hojas y calibración U01–U16.
- Pagos, certificados, calendario, DATOS, ESTATUS y fuentes externas CONAPE sin cambios.

Guardado en GitHub no significa desplegado ni probado en producción.
