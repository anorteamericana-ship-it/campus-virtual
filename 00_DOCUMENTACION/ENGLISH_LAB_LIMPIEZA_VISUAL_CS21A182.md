# English LAB · auditoría y limpieza visual CS21A182

Fecha: 2026-08-06  
Rama: `fix/cs21a182-english-lab-visual-cleanup`  
Base: CS21A181 (`0a55111c15024ef432e0dc65828176c534e3c75d`)

## Objetivo

Reducir ruido visual, textos técnicos y demostraciones heredadas en English LAB sin cambiar juegos reales, endpoints, permisos, acceso financiero ni datos académicos.

## Hallazgos

### Docente · English LAB Live

- La vista de creación mostraba una alerta con el código interno `CS20H` y el estado diagnóstico del banco.
- El panel `Banco pedagógico` exponía cobertura, faltantes, alertas y fuentes; es información de QA, no una decisión diaria del docente.
- La explicación de que la actividad no afecta notas aparecía repetida en encabezados y tarjetas.
- La vista previa `Mensaje listo` duplicaba el código, el enlace y los botones de copiado.

### Docente · English LAB individual

La tercera pasada confirmó que la pestaña docente de `academia_play.jsx` no es operativa. Presenta:

- grupo fijo `B1-LM18-C3-0726`;
- sala fija `PLAY-4821`;
- cantidades de respuestas inventadas;
- nombres de estudiantes ficticios;
- botones de pausar, avanzar y finalizar sin conexión a una sala real.

La operación docente real ya existe en la ruta `english_lab_live`. Mantener ambas vistas confunde al docente y viola la regla de no presentar información inventada como funcional.

### Estudiante · English LAB Live

- El encabezado decía `Pantalla del estudiante`, texto que no ayuda a realizar la actividad.
- Los estados de espera y respuesta eran más largos de lo necesario.
- El mensaje de pregunta actualizada podía interpretarse como un bloqueo individual.

### Estudiante · catálogo individual

La segunda pasada encontró contenido que no debe formar parte de una experiencia estudiantil final:

- tarjeta para actualizar el banco curricular;
- métricas `Banco total`, cantidad esperada, estado local/sincronizado y guardado técnico;
- identificadores de unidad y resúmenes internos de importación;
- instrucciones para ir a `Admin → Banco curricular`;
- etiquetas `demo`, `banco` y nombres internos como `ACADEMIA_PLAY_BANK`;
- tarjetas `Próximamente` que ocupaban espacio sin permitir una acción;
- una tarjeta `Live Trivia` que abría una sala demo con código y participantes ficticios;
- dos visualizaciones distintas para los mismos logros iniciales.

### Administración

El panel administrativo sí consume endpoints reales, pero mezcla funciones útiles con lenguaje de implementación:

- nombres de hojas como `ACADEMIA_PLAY_BANK` y `ACADEMIA_PLAY_PROGRESS`;
- códigos `CS14`, `GAME_ID` y `template` en encabezados visibles;
- selector para cambiar a vistas demo de estudiante y docente.

Las funciones de importar, validar, actualizar, consultar progreso y abrir fichas se conservan. Solo se humanizan etiquetas y se fuerza la vista administrativa real.

## Implementación

Se agrega `src/english_lab_visual_cleanup_cs21a182.js` como capa aditiva cargada después de CS21A181.

La capa:

- actúa únicamente cuando detecta rutas o contenedores de English LAB;
- cubre creación docente, control de sala, ingreso, sala activa, prácticas individuales y vistas heredadas;
- reemplaza textos exactos por instrucciones breves orientadas a la acción;
- oculta el panel interno `Banco pedagógico` de la vista docente Live;
- oculta la vista previa redundante `Mensaje listo` sin retirar los botones de copiar;
- conserva código de sala, enlace, controles, participantes reales y salas recientes;
- retira de la vista estudiantil controles de banco, métricas de sincronización y resúmenes internos;
- cambia `Banco curricular` por `Juegos por unidad` y elimina nombres internos de carga;
- oculta tarjetas `Próximamente` y la entrada `Live Trivia` ficticia;
- sustituye la sala demo heredada por un acceso directo a English LAB Live;
- retira completamente la maqueta docente del módulo individual y ofrece el mismo acceso directo;
- fuerza a admin/superadmin a la vista administrativa real y oculta los tabs de demostración;
- humaniza el panel administrativo sin retirar importación, validación, métricas o fichas;
- conserva una sola línea principal de logros y elimina la estantería duplicada;
- reduce etiquetas secundarias de tarjetas y áreas;
- aplica ajustes móviles sin forzar ancho completo sobre fichas, palabras o tarjetas de juego;
- observa renders diferidos para limpiar vistas que aparecen después de una solicitud;
- expone `window.__ENGLISH_LAB_VISUAL_CLEANUP_CS21A182__.getLastAudit()` para evidencia QA.

## Fuera de alcance

- No modifica `src/english_lab_live.jsx` ni su motor CS21A180.
- No modifica `src/academia_play.jsx` ni el banco de juegos.
- No intercepta `fetch`.
- No modifica Apps Script.
- No altera permisos, pagos, notas, certificados ni estados académicos.
- No agrega juegos nuevos todavía.

## QA visual requerida

### Docente · Live real

1. Abrir English LAB Live.
2. Confirmar que no aparece `CS20H`, versión interna ni `Banco pedagógico`.
3. Confirmar que crear sala, copiar código, copiar mensaje y copiar enlace siguen visibles.
4. Confirmar que salas recientes siguen disponibles.
5. Abrir una sala y comprobar controles, lista de participantes y resultados.

### Docente · módulo individual

1. Abrir English LAB desde el menú docente.
2. Confirmar que no aparecen grupo, sala, estudiantes o resultados ficticios.
3. Confirmar que aparece una explicación breve y el botón `Abrir English LAB Live`.
4. Confirmar que el botón navega a `#english_lab_live`.

### Estudiante · Live

1. Entrar sin código y revisar la pantalla inicial.
2. Entrar a una sala activa.
3. Confirmar estados breves de espera, respuesta recibida y actualización.
4. Confirmar que cambiar sala y actualizar siguen funcionando.

### Estudiante · catálogo individual

1. Abrir English LAB.
2. Confirmar que no aparecen actualización del banco, conteos esperados, estados de sincronización ni instrucciones administrativas.
3. Confirmar que el mapa de progreso conserva nivel, unidades y avance.
4. Confirmar que `Juegos por unidad` permite filtrar y abrir actividades reales.
5. Confirmar que no aparecen tarjetas `Próximamente` ni `Live Trivia` demo.
6. Abrir un juego del banco y comprobar que no se muestra `ACADEMIA_PLAY_BANK`, `GAME_ID` o `CS14`.
7. Confirmar que la línea de logros permanece y que no aparece una segunda estantería duplicada.
8. Revisar acceso restringido con un perfil no habilitado.

### Administración

1. Abrir English LAB como admin o superadmin.
2. Confirmar que el panel abre directamente en Admin y no permite cambiar a maquetas de estudiante/docente.
3. Confirmar que importar, validar, actualizar y abrir fichas siguen funcionando.
4. Confirmar etiquetas `Banco de juegos`, `Importador`, `Tipos de juego` y `Seguimiento de práctica`.
5. Confirmar que los nombres técnicos de hojas no aparecen como encabezados visibles.

### Móvil

Repetir las vistas a 390 px de ancho. Los botones de acción pueden ocupar el ancho disponible, pero las fichas de palabras, tarjetas y controles del juego deben conservar su cuadrícula y no convertirse en bloques de ancho completo.

## Criterio de aceptación

CS21A182 se considera aprobado cuando:

- no se muestran códigos internos o diagnósticos del banco al docente;
- no se presenta ninguna sala, grupo o persona ficticia como experiencia funcional;
- el estudiante no ve controles administrativos ni métricas técnicas;
- el panel administrativo conserva todas sus funciones reales;
- no se pierde ningún control funcional;
- no aparecen cambios fuera de English LAB;
- CS21A181 mantiene indicador de carga y parejas editables;
- CS21A180 mantiene turnos y sincronización;
- QA autenticada completa pasa en docente, estudiante, administración y móvil.
