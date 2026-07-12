# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral/frontend:** F98.4-Z6-CS21A71  
**Backend fuente canónica en Drive:** F98.4-Z6-CS21A70  
**Backend Apps Script publicado:** no verificado  
**Base preservada:** CS21A70 / CS21A69 / CS21A68 / CS21A67 / CS21A66 / CS21A65  
**Producción:** no verificada  
**Corte:** 12-jul-2026

## Cambio vigente CS21A71 — Prematrícula activa y English LAB

### Menú lateral estable

La prematrícula ya no pasa por el normalizador académico de Recursos Didácticos.

Antes, CS21A65 modificaba temporalmente el menú estudiantil, renombraba `Mi curso` como `Libros y Audios`, insertaba `Recursos Didácticos` y luego otros controles retiraban esas opciones. Esa competencia producía el parpadeo.

CS21A71 envuelve el Sidebar antes de montar `App` y, cuando la sesión corresponde a una prematrícula sin código, renderiza directamente el menú original de prematrícula.

Resultado esperado:

- El panel izquierdo aparece una sola vez.
- No aparecen temporalmente Libros y Audios, Recursos adicionales ni módulos académicos.
- English LAB mantiene una posición estable.
- Los botones bloqueados de la prematrícula permanecen sin cambios.

Archivo nuevo:

- `src/prematricula_english_lab_ui_cs21a71.js`

Carga desde:

- `src/resources_panel_state_cs21a65.js`, cuyo contenido vigente es CS21A71.

### Verificación de English LAB

`src/english_lab_free_access_cs21a66.js` conserva su ruta histórica, pero su contenido vigente es CS21A71.

Cambios:

- Se elimina completamente la revalidación asociada al evento `focus`.
- No se vuelve a verificar al tocar la pantalla, navegar o regresar a la ventana.
- El resultado se conserva 30 minutos dentro de la misma sesión.
- Los campos de autorización incluidos en la sesión se usan inmediatamente.
- Durante una única comprobación inicial, el botón permanece visible pero bloqueado; no desaparece y reaparece.
- Una falla temporal de red no tapa English LAB cuando el acceso ya estaba autorizado.
- Solo `an:session-changed` o una nueva solicitud de prematrícula pueden iniciar otra revisión legítima.

### Sincronización con Prematrícula activa

`src/prospect_free_student.jsx` usa la misma decisión de acceso que el menú y la compuerta.

- `freeUserMiPerfil.acceso_english_lab` alimenta el control global.
- El botón `Entrar a English LAB` y la opción lateral aparecen con la misma autorización.
- El estado comercial `CONVERTIDA` no reemplaza la autorización real.

### Visual de English LAB

Para una prematrícula sin código se ocultan únicamente:

- Mapa de progreso.
- Banco curricular.
- Áreas cognitivas demo.

Se conserva el resto del contenido y el título `Catálogo demo`.

La ocultación se instala antes del primer pintado mediante el atributo `data-an-student-kind="prematricula"`, evitando que esos paneles aparezcan brevemente.

Cuando la sesión ya tiene un código real de estudiante:

- El código tiene prioridad sobre cualquier marca antigua de prematrícula.
- La sesión local deja de tratarse como usuario gratis.
- El catálogo cambia a `Catálogo Básico I`, `Catálogo Básico II`, `Catálogo Intermedio I` o `Catálogo Intermedio II`, según el nivel oficial.
- El catálogo aparece primero.
- Debajo aparecen Mapa de progreso, Banco curricular y Áreas cognitivas del nivel.

## Backend

CS21A71 es únicamente frontend. No modifica `Code.gs`.

El backend canónico continúa en CS21A70:

- Archivo de Drive: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Tamaño: `2.938.302` bytes.
- SHA-256: `278cd64101c99abc6ecfc0e30ea4f6560fd3555c8c923756f7947d2e0ad26c28`.

Se preserva la autorización real mediante `PROSPECTOS.INICIO_GRATUITO_AUTORIZADO` y el endpoint `freeUserEnglishLabAccess` ya incluido en el backend.

## Archivos frontend CS21A71

- Nuevo: `src/prematricula_english_lab_ui_cs21a71.js`.
- Modificado: `src/english_lab_free_access_cs21a66.js`.
- Modificado: `src/prospect_free_student.jsx`.
- Modificado: `src/resources_panel_state_cs21a65.js`.

No se modificó `campus.html`, `academia_play.jsx` ni `Code.gs`.

## Prueba inmediata

### Prematrícula autorizada

1. Cerrar sesión.
2. Hacer `Ctrl + F5`.
3. Entrar con una prematrícula que tenga `INICIO_GRATUITO_AUTORIZADO = SI`.
4. Confirmar que el menú aparece estable y no muestra Recursos Didácticos temporalmente.
5. Confirmar que English LAB aparece sin tener que usar primero el botón central.
6. Navegar y tocar repetidamente la pantalla: no debe reaparecer `Verificando acceso`.
7. Entrar a English LAB y confirmar que no aparecen Mapa de progreso, Banco curricular ni Áreas cognitivas demo.
8. Confirmar que `Catálogo demo` y el resto de la experiencia siguen visibles.

### Prematrícula no autorizada

1. Entrar con una prematrícula sin autorización.
2. English LAB puede mostrarse bloqueado únicamente durante la primera comprobación.
3. Tras confirmar que no está autorizada, el acceso desaparece.
4. Una ruta manual debe mostrar el mensaje de aprobación pendiente.

### Estudiante matriculado

1. Matricular a la persona y asignarle código real.
2. Cerrar sesión y volver a entrar.
3. Confirmar que ya recibe el panel estudiantil real.
4. Abrir English LAB.
5. Confirmar `Catálogo Básico I` o el nivel oficial correspondiente.
6. Confirmar que debajo aparecen Mapa de progreso, Banco curricular y Áreas cognitivas.

## Cambios preservados

- CS21A70: Panel Maestro CONAPE buscable y contexto de desembolsos 01/02/03.
- CS21A69: selección azul única del menú lateral.
- CS21A68: Recursos adicionales como panel independiente.
- CS21A67: árbol de Recursos adicionales y carga sin biblioteca anterior.
- Libros y Audios, audios, PDF, zoom, paso de hoja y U01–U16.

## Reglas preservadas

- Nunca mover pagos entre niveles o intentos.
- No modificar pagos, certificados, CONAPE, calendario, DATOS ni ESTATUS.
- No crear automatizaciones ni triggers nuevos de CONAPE.
- No declarar producción verificada sin realizar la prueba anterior.
