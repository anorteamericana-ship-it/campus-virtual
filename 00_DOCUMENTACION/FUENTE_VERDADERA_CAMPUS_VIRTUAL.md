# FUENTE VERDADERA — F98.4-Z6-CS21A69

Estado: frontend CS21A69 guardado en GitHub `main`; backend instalado continúa en CS21A64; backend completo candidato continúa en CS21A67; producción no verificada.

## Cambio vigente — estado activo único del menú

El menú lateral de estudiante, docente, admin y superadmin usa un controlador común para que solo exista una selección azul.

Archivo nuevo:

- `src/sidebar_active_state_cs21a69.js`

Carga canónica:

- `src/resources_panel_state_cs21a65.js` conserva su ruta histórica, pero su contenido vigente es CS21A69 y carga el controlador antes del router principal.

### Problemas corregidos

- I CAN Conversation Club y Libros y Audios ya no pueden quedar activos simultáneamente.
- Cronograma general se marca al abrirse, aunque comparta la ruta interna `materiales` con otras pantallas docentes.
- Syllabus, Planeamiento, Cronograma del módulo y Libros y Audios actualizan la selección al cambiar solo la subpantalla.
- Recursos adicionales pierde la selección al navegar a otra opción.
- Una clase `active` agregada por un módulo dinámico no puede permanecer junto con la selección real de React.

### Regla

- Un solo botón lateral puede tener `active`.
- Ese mismo botón recibe `aria-current="page"`.
- El clic reciente se conserva mientras termina la navegación.
- Si la navegación ocurre desde una tarjeta, atrás/adelante o código interno, la ruta real vuelve a definir el botón activo.
- Botones ocultos, bloqueados o deshabilitados no pueden convertirse en selección.

## Cambio preservado CS21A68

Estructura lateral:

- Recursos Didácticos
  - Libros y Audios
  - Recursos adicionales

Permisos:

- Docente: solo Diccionario Word by Word.
- Estudiante: recursos oficiales de su nivel.
- Admin y superadmin: recursos completos del nivel seleccionado.

## Backend

CS21A69 es únicamente frontend. No requiere otro `Code.gs`.

El candidato `Code_F98_4_Z6_CS21A67_COMPLETO.gs` sigue siendo el backend completo vigente para Recursos adicionales y la autorización de English LAB Gratis.

## Archivos frontend vigentes relacionados

- `src/sidebar_active_state_cs21a69.js`
- `src/resources_panel_state_cs21a65.js` con contenido CS21A69
- `src/additional_resources_panel_cs21a68.jsx`
- `src/resources_panel_cs21a65.jsx`
- `src/lazy_loader.jsx` CS21A67
- `src/book_inline_audio_cs21a63.js`
- `src/book_unit_starts_cs21a60.jsx`
- `src/book_unit_propagation_cs21a64.js`
- `src/book_page_turn_cs21a62.js`

## Reglas preservadas

- No mover pagos entre niveles o intentos.
- No modificar pagos, certificados, CONAPE, calendario ni hojas académicas.
- No crear triggers nuevos de CONAPE.
- Guardado en GitHub no significa desplegado ni probado en producción.
