# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral/frontend:** F98.4-Z6-CS21A69  
**Backend canónico instalado:** F98.4-Z6-CS21A64  
**Backend candidato completo:** F98.4-Z6-CS21A67  
**Base preservada:** CS21A68 / CS21A67 / CS21A66 / CS21A65 / CS21A64 / CS21A63 / CS21A62 / CS21A61 / CS21A60  
**Producción:** no verificada  
**Corte:** 12-jul-2026

## Cambio vigente CS21A69 — selección única del menú lateral

Se corrige la marcación azul del menú para estudiante, docente, admin y superadmin.

### Causas encontradas

1. El menú docente usa una sola ruta interna `materiales` para varias subpantallas: Información General, Asistencia, Syllabus, Planeamiento, Cronograma del módulo, Cronograma general y Libros y Audios. La pantalla cambiaba, pero el Sidebar no se volvía a renderizar cuando solo cambiaba la subpantalla.
2. CS21A68 restauraba manualmente la clase `active` de `Libros y Audios`, incluso después de navegar a I CAN, Cronograma u otra pantalla.
3. Los botones insertados dinámicamente podían conservar una clase azul anterior después de que React actualizaba la ruta principal.

### Solución

Nuevo archivo:

- `src/sidebar_active_state_cs21a69.js`

Carga desde:

- `src/resources_panel_state_cs21a65.js`, cuyo contenido vigente es CS21A69.

Comportamiento:

- Solo puede existir un botón lateral con clase `active`.
- El botón seleccionado recibe también `aria-current="page"`.
- Los demás botones pierden tanto `active` como `aria-current`.
- El clic del usuario se conserva mientras React termina de actualizar la ruta.
- Si la navegación ocurre desde una tarjeta, desde atrás/adelante o de forma programática, se respeta la selección que devuelve la ruta real.
- El menú docente se vuelve a renderizar al cambiar `an:teacher-material-tab`.
- Al salir de `Recursos adicionales`, el modo vuelve a `books`, evitando que `Libros y Audios` o `Recursos adicionales` queden marcados junto con otra pantalla.

### Casos cubiertos

- I CAN Conversation Club no puede quedar marcado junto con Libros y Audios.
- Cronograma general queda azul cuando es la pantalla visible.
- Syllabus, Planeamiento y Cronograma del módulo actualizan correctamente el azul aunque compartan la ruta `materiales`.
- Recursos adicionales y Libros y Audios se excluyen mutuamente.
- Estudiante, docente, admin y superadmin usan el mismo control de exclusión.
- Menús ocultos o deshabilitados no pueden convertirse en selección activa.

## Cambio preservado CS21A68

Estructura lateral:

- Recursos Didácticos
  - Libros y Audios
  - Recursos adicionales

Permisos:

- Docente: únicamente Diccionario Word by Word.
- Estudiante: recursos oficiales de su nivel activo.
- Admin y superadmin: recursos completos del nivel seleccionado.

## Backend

No cambia respecto a CS21A67. No se requiere un nuevo `Code.gs` por CS21A69.

El candidato completo `Code_F98_4_Z6_CS21A67_COMPLETO.gs` continúa siendo necesario para el árbol de Recursos adicionales y para preservar la protección CS21A66 de English LAB Gratis.

## Prueba inmediata

1. Actualizar frontend y hacer `Ctrl + F5`.
2. Docente: abrir `Libros y Audios` y luego `I CAN Conversation Club`; solo I CAN debe quedar azul.
3. Docente: abrir `Cronograma general`; debe quedar azul aunque la ruta interna siga siendo `materiales`.
4. Docente: alternar Syllabus, Planeamiento, Cronograma del módulo, Cronograma general y Libros y Audios; exactamente uno debe quedar azul.
5. Docente: abrir Recursos adicionales y luego Calendario académico; Recursos adicionales debe perder el azul.
6. Estudiante: alternar Libros y Audios, Recursos adicionales, I CAN, Evaluaciones y Mi Campus.
7. Admin y superadmin: alternar Libros y Audios, Recursos adicionales, Panel Maestro, Consulta individual y Calendario académico.
8. En todos los casos, confirmar que nunca hay dos botones azules ni una pantalla visible sin su botón azul correspondiente.

## Reglas preservadas

- Nunca mover pagos entre niveles o intentos.
- No tocar pagos, certificados, CONAPE, calendario ni hojas académicas.
- No crear automatizaciones nuevas de CONAPE.
- No declarar producción verificada sin ejecutar las pruebas anteriores.
