# ENGLISH LAB 2.0 · Estado canónico

Único archivo de continuidad del proyecto. Se actualiza; no se crean copias ni versiones con sufijo.
Reglas generales: `AGENTS.md`. Roles: `skills/english-lab-director`, `english-lab-learning-designer`, `english-lab-game-engineer`.

## 1. Línea base

| Dato | Valor |
|---|---|
| Fecha | 2026-11-11 |
| Frontend | `anorteamericana-ship-it/campus-virtual` · `main` `120775d303e58b482b324c29286be06d91ca2fcc` |
| Backend leído | `anorteamericana-ship-it/campus_backend` · `273d4c4` · `prod/43_Academia_Play.js`, `prod/44_English_LAB_Live_Base.js` |
| Rama de trabajo | `feat/english-lab-2-fase-abc` |
| Fase actual | A terminada (E0) · B propuesta · C prototipo jugable (E1) |
| Estado | Desarrollo. Nada publicado ni fusionado. |

Límite de evidencia: el backend se leyó en el repo, no en el despliegue. `config/apps-script-production.json` declara la versión 494 con acceso funcional sin verificar. Todo hallazgo de backend es E0 sobre código guardado.

## 2. Fase A · Diagnóstico

### Resumen ejecutivo

El laboratorio actual no es un prototipo vacío: tiene guardado en backend, un banco de contenido con importador y validación, y tres motores que funcionan. Sus problemas son de diseño de juego y de datos, no de infraestructura: el estudiante elige el nivel a mano, las opciones nunca se barajan, la mayoría del avance solo se registra al llegar a 100 %, y todas las actividades son la misma interacción de reconocer. Recomendación: **conservar backend, banco y esquema; sustituir la experiencia del estudiante**; no reconstruir Live ahora.

### A. Persistencia del progreso — CONFIRMADO (E0)

- Dos capas. Local: `localStorage` `an_academia_play_state_<clave>` (`src/academia_play.jsx:316-333`). Backend: hojas `ACADEMIA_PLAY_PROGRESS` y `ACADEMIA_PLAY_COMPLETIONS` (`prod/43_Academia_Play.js:514`, `:885-886`).
- Los 12 juegos fijos guardan mejor porcentaje e intentos con `academiaPlaySaveProgress`; el backend rechaza cualquier otro `game_id` (`APLAY_ALLOWED_GAMES`, `:520-524`, `:615`).
- Los juegos del banco curricular solo se registran si el estudiante saca 100 % (`academia_play.jsx:1554`; backend `academiaPlayMarkCompletion`, "solo_se_guarda_100"). Por debajo de 100 % queda únicamente en ese navegador. No hay intentos ni resultado parcial en backend.
- Cambiar de dispositivo: recupera lo sincronizado; pierde todo intento del banco por debajo de 100 %.
- Interrumpir una actividad: se pierde; el avance vive en el estado del componente y no hay punto de retomar.
- Guardado fallido: queda en "pendiente" sin cola ni reintento (`:1556-1580`).
- Repetir: conserva el mejor porcentaje y suma intentos.
- Consecuencia: hoy no se puede distinguir iniciada / completada / intentos / resultado para el contenido curricular. Hace falta un contrato nuevo (sección 6).

### B. Identidad y nivel activo — CONFIRMADO (E0)

- El laboratorio **no usa el nivel del estudiante**. Arranca en `'B1'` fijo (`academia_play.jsx:1377-1378`) y el estudiante cambia de nivel con pestañas (`:1645`). `academiaPlayBankCatalog` devuelve todos los niveles sin filtrar.
- El `usuario` que recibe viene de la sesión guardada al iniciar sesión (`src/login.jsx:263`, `sessionStorage an_usuario`). Si lo cambian de grupo, ese dato queda viejo hasta el próximo ingreso. Otras pantallas lo recalculan con datos frescos (`src/student_dashboard.jsx:618`, `src/student_portal.jsx:184`); el laboratorio no.
- Regla para el laboratorio nuevo: el nivel se resuelve con una lectura fresca al backend, nunca con la copia de sesión. Qué endpoint usar queda por verificar en Fase E.

### C. Estado funcional

| Componente | Decisión | Evidencia |
|---|---|---|
| Backend de progreso y sus hojas | Reutilizar, ampliar con contrato nuevo | `prod/43:576-657` |
| Banco curricular, importador y validación (`ACADEMIA_PLAY_BANK`, `CONFIG_UNIDADES` con objetivo por unidad, columna `STATUS`) | Reutilizar: es la base de "editar sin programador" | `prod/43:887-912`, `academiaPlayBankImport` |
| Panel admin del banco y tablero admin | Reutilizar | `academia_play.jsx:1833`, `:1959` |
| `apPost` y sesión | Reutilizar | `academia_play.jsx:357-385` |
| `APChoiceRunner` | Reparar o sustituir: no baraja opciones | No existe `Math.random` en el archivo; opciones en orden A–D del banco (`:666`) |
| `apCorrectIndex` | Reparar: si `CORRECT_OPTION` viene vacío o inválido, la correcta pasa a ser la A | `:598-601` |
| `APMatchRunner` | Reparar: la columna derecha siempre sale en el mismo orden alfabético, se memoriza | `:48-49`, `:1106` |
| `APOrderRunner` | Reparar: si `WORDS_TO_ORDER` viene vacío, las palabras aparecen ya ordenadas | `:603-611`, `:640-655` |
| Catálogo fijo `AP_GAMES` / `AP_FLOWS` | Retirar después: contenido metido en el código | `:64-246` |
| Vista del estudiante (catálogo de tarjetas) | Sustituir por la dirección creativa | Sección 3 |

No verificado: si en la hoja del banco la respuesta correcta está siempre en la A (HIPÓTESIS, hay que leer la hoja) y el desalineado visual del pareo (requiere navegador con sesión). Lo confirmado es que el código no baraja en ningún caso.

### D. English Lab Live — por separado

- Sondeo cada 4 s (`src/english_lab_live.jsx:546`) contra Apps Script, que lee hojas completas en cada consulta (`prod/44`). La desincronización que se vivió es estructural: cada estudiante ve la pregunta con hasta 4 s más latencia de diferencia.
- Los puntos dependen del tiempo de respuesta (`TIME_MS`, `prod/44:777`), lo que premia velocidad de red, no inglés.
- Hoy está oculto para estudiantes por CSS (`campus.html:26`).
- Recomendación: **no es prioridad**. No cambiar de proveedor todavía. Si se retoma, primero medir con un grupo real cuántos entran y con qué latencia, y quitar el puntaje por tiempo. El progreso individual no depende de Live.

### E. Otros hallazgos que condicionan el plan

| ID | Hallazgo | Estado | Sev. |
|---|---|---|---|
| EL2-SEC-01 | `_aplayKey_` toma `cedula`, `codigo` y `user_key` del cuerpo de la petición antes que de la sesión (`prod/43:535-543`). Un estudiante autenticado podría leer o escribir el progreso de práctica de otro enviando otra cédula (`academiaPlayGetProgress`, `SaveProgress`, `MarkCompletion`). La respuesta incluye nombre y cédula de la fila. | CONFIRMADO en código (E0); despliegue sin verificar | P2 |
| EL2-CUR-01 | `src/syllabus.jsx:90-93`: Básico II, Intermedio I e Intermedio II son copias de las lecciones de Básico I. El repo solo tiene sílabus real de Básico I. | CONFIRMADO (E0) | P2, bloquea Fase D de esos niveles |
| EL2-CUR-02 | En Básico I una unidad no siempre son dos lecciones (unidades 8, 9, 11, 13, 15 y 16 tienen una). | CONFIRMADO (E0) | Informativo |
| EL2-CI-01 | `scripts/qa_cs21a202_source_truth.mjs` hace fallar cualquier PR que toque `src/english_lab*` o `styles/english_lab*`. Integrar el laboratorio nuevo al campus exige escribir primero su propio contrato de verificación. `src/academia_play.jsx` no está cubierto por esa regla. | CONFIRMADO (E1, ejecutado) | Condiciona Fase E |

EL2-SEC-01 no se corrige en esta pasada: es backend y va por release controlado. Corresponde a `campus-security-privacy-auditor` confirmarlo y al supervisor de entrega programarlo. El contrato nuevo (sección 6) nace sin ese defecto.

## 3. Fase B · Dirección creativa: Northbound

**Idea central.** El estudiante llega a Port Hazel, una ciudad inventada donde nadie habla español. Cada unidad del programa es un episodio de su vida ahí, y cada episodio se resuelve haciendo cosas con el inglés: registrarse, deletrear su nombre, presentar a alguien. Los cuatro niveles son cuatro etapas de esa vida: *Arrival* (Básico I), *Settling In* (Básico II), *Making It Work* (Intermedio I), *Taking the Lead* (Intermedio II).

**Por qué esta y no otra.**

- Frente a una colección de minijuegos (lo actual): no hay razón para volver. Aquí hay una historia que avanza y un pasaporte que se llena.
- Frente a un mundo de fantasía o RPG: caro en arte, difícil de mantener e infantil para adultos. Aquí el arte es tipografía, color y señalética; no hay ilustraciones que producir por unidad.
- Frente a un camino de lecciones estilo Duolingo: aquello es práctica de ítems sueltos. Aquí cada escena es una situación comunicativa completa, que es lo que enseña una academia conversacional.
- Es viable: una escena es una lista de pasos en datos; los pasos son cinco mecánicas reutilizables.

**Lo que la hace propia.** El estudiante juega con su nombre real: lo deletrea, lo dice, lo oye. El reloj de la escena cambia la hora y el cielo, y eso decide qué saludo corresponde. Los errores típicos del hispanohablante (E/I, G/J, B/V) se explican por nombre, no solo se marcan.

**Identidad visual.** Terminal de llegadas de noche: azul institucional llevado a noche, tarjetas de papel tipo pase de abordar, rojo institucional solo en la acción principal, ámbar de señalética para foco y progreso. Se reconoce como de la Academia sin parecer panel administrativo.

**Etapas de un episodio.** Descubrir (reconocer con apoyo) → Practicar (producir con pistas a pedido) → Aplicar (conversación completa armando y escribiendo) → Reto (todo junto, sin pistas). Todas abiertas y repetibles; el orden es recomendación, no candado.

**Cómo cambia la dificultad por nivel** (tipo de tarea, no cantidad): B1 elegir, deletrear y armar frases cortas; B2 completar y reordenar dentro de diálogos; I1 decisiones con consecuencias en la conversación y narrar; I2 respuestas abiertas, reformular y elegir registro. I1 e I2 necesitarán mecánicas nuevas; no se diseñan hasta validar B1.

**Recompensa.** Un sello por escena completada; dorado con 8 de cada 10 a la primera. No hay puntos, ni tiempo, ni ranking. Se registran por separado: iniciada, completada, intentos, resultado y habilidades.

**Habla.** Sin reconocimiento de voz. El paso `say` pide decir la frase en voz alta y no la califica. La voz del personaje usa la síntesis del navegador; si no existe, aparecen pistas escritas del sonido de cada letra. La voz grabada de la docente puede reemplazarla después.

## 4. Fase C · Ficha de la primera experiencia

| Campo | Valor |
|---|---|
| Nivel · unidad | Básico I · Unidad 1 |
| Fuente curricular | `src/syllabus.jsx`, lecciones 1 (alfabeto y saludos) y 2 (presentaciones y cortesía) |
| Episodio | *Arrival Night* · Hazel Street Hostel |
| Objetivos | Deletrear nombres con el alfabeto; saludar y despedirse según hora y persona; presentarse y usar please, thank you, you're welcome |
| Estado académico | `BORRADOR IA` |

| Escena | Habilidad | Mecánica | Qué produce el estudiante | Criterio de éxito | Retroalimentación |
|---|---|---|---|---|---|
| 1 Descubrir · *The right hello* | Lectura, escucha | `choice` con reloj | Elige el saludo según hora y formalidad (5) | Acertar; se cuenta si fue a la primera | Cada opción errada explica por qué no calza |
| 2 Practicar · *Spell it for me* | Escucha, escritura | `spell` | Escribe 4 nombres deletreados y deletrea el suyo | Letras exactas | Marca letra por letra y nombra la confusión (E/I, G/J, B/V) |
| 3 Aplicar · *Check-in* | Lectura, escritura, habla | `choice`, `build`, `spell`, `say`, `type` | Arma "My name is…", deletrea, agradece, dice una frase en voz alta, escribe "You're welcome" | Frase correcta | Dice si sobra una palabra, si es el orden o la ortografía |
| 4 Reto · *The mix-up* | Escucha, lectura, escritura | Todas, sin pistas | Corrige una etiqueta mal escrita, presenta a Leo, cierra la conversación | Igual, con un intento más antes de ver la respuesta | Igual |

Alternativa sin audio: pistas escritas del sonido de cada letra. Sin micrófono: no se usa. Teclado: todo es botón o campo de texto.

## 5. Decisiones de arquitectura

1. **Contenido como datos** (`lab2_content.js`): nivel → episodio → escena → pasos. Agregar una unidad es agregar datos.
2. **Cinco tipos de paso** (`lab2_steps.js`): `choice`, `spell`, `build`, `type`, `say`, más `line` para narración. Contrato: recibe `{ step, ctx }` y emite `onDone({ firstTry, tries, review })`. Un paso no sabe de niveles ni usuarios. Un tipo desconocido se puede saltar, no rompe la escena.
3. **JS plano, sin JSX ni Babel.** El campus compila JSX en el navegador con un Babel de 3 MB. El laboratorio nuevo usa `React.createElement` directo y pesa 74 KB en total. Sigue siendo un componente React (`window.EnglishLab2View`) montable en el router del campus.
4. **Guardado detrás de un adaptador** (`LAB2.store`): hoy local; el de backend se conecta ahí sin tocar los juegos.
5. **Ubicación `prototipos/english_lab_2/`**: fuera de `src/` y sin referencia desde `campus.html`. No es parte del campus en ejecución. La integración pasa por EL2-CI-01.
6. **Formato del contenido frente al banco actual**: el banco guarda ítems sueltos por juego; Northbound necesita escenas con pasos ordenados. Pendiente decidir si se amplía el banco (nuevos `ITEM_TYPE` y orden) o se agrega una hoja de escenas. Es la decisión de arquitectura abierta más importante.

## 6. Contrato de progreso propuesto (sin implementar en backend)

Hoja nueva, separada de las académicas. La identidad sale **solo de la sesión**; el cuerpo no puede elegir de quién es el registro.

- `englishLab2GetProgress({ token })` → `{ ok, scenes: { <scene_id>: registro } }` del usuario de la sesión. Docente: además `cod_grupo`, validado contra sus grupos.
- `englishLab2SaveScene({ token, scene_id, event, first_try, total, client_ts, resume })` con `event` = `start` | `progress` | `complete`.
- Registro por escena: `started`, `completed`, `attempts`, `best_first_try`, `last_first_try`, `total`, `skills`, `last_at`, `resume { step, log }`.
- El `scene_id` debe existir en el contenido publicado. Reintento idempotente por `client_ts`.

Requiere release controlado y autorización. Hasta entonces el prototipo guarda en el navegador.

## 7. Trabajo terminado y verificado

| Elemento | Estado | Evidencia |
|---|---|---|
| Diagnóstico A–E | Terminado | E0, referencias arriba |
| Dirección creativa | Propuesta, pendiente de aprobación | Sección 3 |
| Episodio B1-U01, 4 escenas, 21 pasos interactivos | Construido y jugado | E1 |
| Prueba automática `qa_lab2_e1.mjs` | 9 grupos pasan | E1, Chrome real, página servida desde el repo |

Lo que la prueba E1 demuestra: entrada con nombre; 4 escenas completas; error con explicación específica; resultado y lista de repaso; repetir mejora el mejor resultado y suma intento; salir a medias, recargar y retomar en el mismo paso; opciones barajadas; teléfono de 375 px sin desplazamiento lateral; sin voz aparecen las pistas; un paso resuelto solo con teclado; cero errores de consola; cero llamadas a Apps Script.

Lo que **no** está probado: sesión real del campus, guardado en backend, voz en navegadores reales (Safari, Firefox, Android), lector de pantalla, contraste medido, conexión lenta, y el contenido con una docente.

## 8. Avance con base medible

| Medida | Valor |
|---|---|
| Preguntas de diagnóstico respondidas con evidencia | 5 de 5 (E0) |
| Unidades jugables de Básico I | 1 de 16 |
| Unidades jugables de los otros tres niveles | 0; sin sílabus en el repo no se puede fijar el total |
| Unidades revisadas por docente | 0 |
| Integración con el campus (sesión, nivel, backend, publicación) | 0 de 4 |

## 9. Pendientes y bloqueos

1. Aprobación de Leonardo de la dirección creativa.
2. Revisión docente de B1-U01, en especial la tabla de sonidos de letras y las respuestas aceptadas.
3. Capacidad semanal de revisión docente: desconocida; fija el ritmo de la Fase D.
4. Sílabus real de Básico II, Intermedio I e Intermedio II (EL2-CUR-01).
5. Decisión 6 de la sección 5 (banco ampliado u hoja de escenas).
6. Release controlado del contrato de progreso y corrección de EL2-SEC-01.
7. Contrato de verificación propio para integrar al campus (EL2-CI-01).
8. Auditorías independientes: `campus-academic-ai-auditor`, `campus-accessibility-auditor`, `campus-qa-engineer`. Quien construyó no certifica.

## 10. Archivos

- `00_DOCUMENTACION/ENGLISH_LAB_2_ESTADO.md` (este)
- `prototipos/english_lab_2/index.html`, `lab2.css`, `lab2_content.js`, `lab2_core.js`, `lab2_steps.js`, `lab2_app.js`, `qa_lab2_e1.mjs`

No se modificó ningún archivo existente del campus.

## 11. Siguiente tarea prioritaria

Que una docente juegue B1-U01 y marque correcciones; con eso se ajusta el contenido y se construye la Unidad 2 para comprobar que agregar una unidad es solo agregar datos.

## REVISIÓN CRUZADA — CHATGPT

Entrega 1 · 2026-11-11 · rama `feat/english-lab-2-fase-abc`.

Cómo revisar sin reinvestigar: leer las secciones 2 a 6; abrir `prototipos/english_lab_2/` en la rama; para jugarlo, `python3 -m http.server 4173` en la raíz y abrir `/prototipos/english_lab_2/index.html`; para repetir la prueba, `node prototipos/english_lab_2/qa_lab2_e1.mjs`.

Preguntas concretas:

1. **EL2-SEC-01**: ¿coincide la lectura de `_aplayKey_` en `campus_backend/prod/43_Academia_Play.js:535-543`? ¿El código desplegado (versión 494) es el mismo?
2. **Banco**: ¿en `ACADEMIA_PLAY_BANK` la columna `CORRECT_OPTION` está siempre en A? ¿Hay filas con `WORDS_TO_ORDER` vacío?
3. **Arquitectura**: ¿ampliar el banco con tipos de paso y orden, o una hoja de escenas aparte? ¿Qué rompe cada opción en el importador y su validación?
4. **Ubicación**: `prototipos/` evita tocar `src/english_lab*`, que el control de CI bloquea. ¿Es lectura correcta de la intención de ese control, o el prototipo debía pasar por él?
5. **JS plano en lugar de JSX**: ¿algún problema para montarlo como `LazyRoute` en `src/app.jsx`?
6. **Pedagogía**: ¿la tabla `letterSounds` y las trampas E/I, G/J, B/V son correctas para hispanohablantes? ¿Las listas `accept` de los pasos `type` dejan fuera respuestas válidas?
7. **Dirección creativa**: ¿qué mecánica haría falta en Intermedio I y II que estos cinco tipos de paso no cubren?
8. **Nivel activo**: ¿qué endpoint devuelve el nivel fresco del estudiante sin depender de `an_usuario`?

## 12. Corte de continuidad ChatGPT · 11-nov-2026 CR · prepublicación

**Reanudación tras pausa de Claude, sin fusionar ni tocar Apps Script.** Se continúa en la misma rama `feat/english-lab-2-fase-abc`, PR #762 en borrador. Main de referencia permanece `120775d`; los commits siguientes pertenecen únicamente al PR.

### Cambios nuevos en este bloque

- **CSS aislado:** `lab2.css` deja de aplicar reglas a `:root`, `html` y `body` globales; solo `.l2-root` y `body.l2-standalone`. Prepara integración sin sobrescribir estilos del campus.
- **Cambio de identidad:** `lab2_app.js` remonta el estado de juego al variar la clave del usuario, evitando reutilizar el estado de la identidad previa en el mismo componente.
- **Writing:** `lab2_core.js` agrega `normEnglish`, que preserva apostrofes en contracciones; `lab2_steps.js` lo utiliza. Se retiran del contenido las aceptaciones explícitas de `youre welcome` como equivalente ortográficamente correcto. El contenido sigue en BORRADOR IA.
- **Fonética y speaking:** se corrige la descripción engañosa de Z y se explicita que el botón oral registra práctica declarada, no pronunciación verificada.
- **CI reproducible:** nueva workflow `.github/workflows/qa-english-lab2-preview.yml` ejecuta sintaxis y la prueba Playwright aislada `qa_lab2_e1.mjs`. Se diagnosticaron problemas de infraestructura en la instalación de Chromium sobre Ubuntu 26.04 y en el shell de la imagen; se adaptó a la imagen Playwright Ubuntu Noble con Bash. **E1 verificada: 12/12 grupos PASS** con Playwright Chromium en contenedor Ubuntu Noble sobre el código real servido localmente (run #43143419077; SHA de ejecución `89906ef`). Incluye cambio de identidad, presentación comercial y CTA WhatsApp. No es E2 de usuario autenticado ni E3 del dominio público.
- **Presentación promocional de seis pantallas:** `prototipos/english_lab_2/presentacion.html` enlaza a demo aislada, WhatsApp institucional 8686-0097 y acceso existente a login. Explicita que Northbound está en desarrollo y no genera resultados académicos.

### Gating de la prueba humana

1. Workflow `Northbound English Lab 2 Preview QA` y `English LAB Source Truth Guard` exitosos en **el SHA final**.
2. QA de contenido, enlaces y vistas móviles; revisar que no se expongan datos reales, tokens, contraseñas ni endpoints de escritura.
3. Autorizar por separado publicar el prototipo **independiente** en GitHub Pages a través de `main`. Aunque la página tiene `noindex`, **no es privada ni protegida por sesión**; cualquier persona con el enlace podrá entrar. Usar solo nombres ficticios.
4. Tras publicar, verificar el URL público exacto y realizar prueba humana desde móvil/escritorio. **No considerar esto integración autenticada al campus.**
5. La integración con rol, sesión, nivel y progreso de backend queda bloqueada por la revisión de identidad/ACL del backend, el source-truth-guard de English Lab y el release controlado.

**Estado actual:** cambios guardados en rama; NO fusionado; NO desplegado; vista previa dentro de GitHub Pages **todavía no disponible**. Las correcciones de backend y Unidad 2 no se tocaron en esta pasada. El criterio de éxito es un flujo de demo seguro, no una afirmación de progreso académico persistente.

**REVISIÓN CRUZADA — CHATGPT:** se confirmó E0 en `campus_backend/prod/43_Academia_Play.js` que `_aplayKey_` prioriza identificadores provenientes del navegador. No se ha establecido equivalencia con el despliegue Apps Script ni se han probado accesos cruzados reales. No usar el contrato actual para Northbound sin corrección y pruebas controladas.

## 13. Reto semanal 001 — The Corner Cup Interview (11/12-nov-2026)

**Estado:** prototipo y anteproyecto en PR #762, rama `feat/english-lab-2-fase-abc`; aún no hay fusión ni E3 público.

### Entrega para Natalia y docentes

- `prototipos/english_lab_2/BRIEF_NATALIA_RETO_001.md`: brief con escenario, decisiones visuales, revisión académica y criterios de aceptación.
- `reto-semana.html`, `reto_001_content.js`, `reto_001.css`: demo ficticia, Port Hazel / The Corner Cup, 4 escenas; 3 principales B1/U1 y 1 bonus claramente etiquetado como adelanto de U3 y U8. Reutiliza 5 motores existentes, sin Apps Script ni alumnos reales.
- `?revision=1`: formulario de observaciones para el equipo. El texto se copia manualmente para compartir; no se envía a ningún backend.
- `src/northbound_weekly_pilot_cta.js`: propuesta técnica del futuro CTA junto a matrícula y dock; **NO integrada al login productivo**. El archivo `login.html` se ha restaurado al contenido idéntico de main para conservar los invariantes de CI. En el piloto los revisores entran por enlace directo.
- `qa_lab2_e1.mjs`: añade recorrido real navegador del reto, test de CTA piloto y test de login ordinario. Registrar el resultado final de CI antes de considerar PASS.

### Control de acceso

El repositorio es público y GitHub Pages no controla acceso a una ruta. `noindex`, `?reto=piloto` y `?revision=1` **no son seguridad**. Para garantizar solo Natalia, Dirección y docentes, se necesita autenticación mediante servidor/proxy externo. Alternativa a decidir: enlace no anunciado con datos totalmente ficticios, aceptando que cualquiera con la URL puede abrirlo. Nunca publicar un PIN en JavaScript ni tratar el parámetro piloto como credencial.

### Cola futura (sin fechas prometidas)

| Reto | Situación | Sílabus | Estado |
|---|---|---|---|
| W001 | Mi primera entrevista en la cafetería | B1/U1, bonus U3 y U8 | Prototipo |
| W002 | Comprar un souvenir | B1/U6 | Cola |
| W003 | Pedir en una cafetería | B1/U9 | Cola |
| W004 | Encontrar la estación | B1/U11 | Cola |
| W005 | Plan de fin de semana | B1/U7 | Cola |
| W006 | Narrar una experiencia de viaje | B1/U14 | Cola |

**Cadencia:** no comprometer un juego semanal sin capacidad de revisión docente. «Reto Northbound» puede servir de marca sin una frecuencia fija.

**Definición de piloto completo:** CI PASS sobre SHA final, control de acceso acorde con la decisión de Dirección, publicación real verificable E3, feedback de Natalia y docentes, y cero datos o escrituras productivas.

## 14. Publicación técnica del piloto — 11-nov-2026 CR

- **PR #762 MERGED** (squash): `d6399a53a2232558e45e3116e2af51a9506af0a0` en `main`. Archivos agregados; `login.html`, `src/login.jsx`, su compilado y Apps Script no se alteraron.
- **E1 confirmado:** 15/15 grupos Playwright Chromium sobre el código servido localmente (run `43147104168`), incluyendo 4 escenas del reto, móvil 390px, alternativas sin voz, regreso, separaciones de identidad, presentación y login intacto.
- **Controles del PR:** Source Truth Guard PASS, Audit delivery PASS y Virtual Campus Review PASS antes de fusionar.
- **GitHub Pages:** workflow `43147390828` completado SUCCESS para `d6399a5`; entorno declarado `https://anorteamericana-ship-it.github.io/campus-virtual/`.
- **Enlace candidato de revisión:** `https://anorteamericana-ship-it.github.io/campus-virtual/prototipos/english_lab_2/reto-semana.html?revision=1`.
- **Límite de evidencia:** no se obtuvo lectura HTTP directa del archivo ya publicado por restricciones de red de los verificadores externos; la publicación Pages está certificada como job, pero la ruta exacta no tiene readback E3 ni prueba humana. No declarar ambas como PASS.
- **Acceso:** la ruta es pública, no listada y no indexable por solicitud, pero **NO PRIVADA**; no cuenta con control de identidad. No compartir con público ni calificar producción académica. El enlace en login normal no fue activado.
- **Próxima aceptación:** Dirección y Natalia abren la URL en su navegador; docente revisa correspondencia curricular; registran observaciones; luego se planifica activación pública del CTA/escenarios. Si se exige acceso sólo para tres identidades, implementar puerta de acceso real antes de compartir el piloto.

**Matriz piloto por hitos:** anteproyecto 1/1, prototipo jugable 1/1, E1 aislado 1/1, despliegue Pages 1/1, readback URL 0/1, revisión humana 0/1, acceso privado por identidad 0/1. Total operacional 4/7 (57,1 %). No equivale a avance de 16 unidades ni a integración del Campus.

## 15. Aventura 001 audiovisual — 11-nov-2026 CR (Claude)

**Línea base:** `main` `50e7ed9`. **Rama:** `feat/northbound-cafe-audiovisual`. **Estado:** desarrollo, PR borrador, sin fusionar ni publicar.

### Video 001 «Bienvenido a The Corner Cup»

| Dato | Valor |
|---|---|
| ¿Video generado por IA? | **NO.** Había una herramienta de video generativo disponible (Canva conectado). Consume el límite mensual de IA de la cuenta; Leonardo decidió no usarla. |
| Qué es | Animación 2D original dibujada con Canvas y codificada con ffmpeg. Es un archivo de video real, no una animación CSS dentro de la página, pero no es material filmado ni generativo. |
| Archivos | `prototipos/english_lab_2/media/corner_cup_intro.mp4` (1280×720, 10,0 s, 30 fps, H.264 Main, 1,14 MB, sin audio) · `corner_cup_intro_480.mp4` (854×480, 0,52 MB) · `corner_cup_poster.jpg` (54 KB) |
| Fuente reproducible | `media_src/corner_cup_scene.html` + `media_src/render_video_001.mjs` (13 s de render) |
| Reproducción verificada | Chrome real: 1280×720, duración 10,0 s, avanza, en silencio (E1) |
| Límite | Estilo ilustrado plano, sin personajes con rostro. No alcanza calidad cinematográfica; eso requiere video generativo o producción. |

Corrección de coherencia hecha durante el trabajo: el primer borrador era de noche; la historia ocurre a las 10:15 a. m. y enseña *Good morning*, así que la escena es de mañana.

### Qué cambió en la experiencia (`aventura-001.html`, aislada; `reto-semana.html` queda intacta)

- **Entrada:** video → portada «Tu primera entrevista en inglés» → nombre → «Comenzar aventura» → entra directo al episodio. El video se ve una sola vez por navegador; se omite con botón o Escape; con movimiento reducido o ahorro de datos no se descarga.
- **La escena contesta:** cada opción equivocada tiene una reacción del personaje en inglés (`react`) antes de la explicación en español, y cada acierto una continuación (`then`). Se puede reintentar siempre.
- **Decisión con continuidad:** paso nuevo `pick` (sin respuesta incorrecta). Sam ofrece café, té o agua; la elección vuelve en un diálogo posterior (`{drink}`) y en el recuerdo final. Sobrevive a recargar.
- **Escuchar primero:** `listen: true` deja el texto detrás de «Ver subtítulos»; nunca se quita.
- **Personajes:** retratos SVG de Ms. Rivera y Sam con tres expresiones (neutral, sonríe, extrañada) ligadas a la respuesta.
- **Recuerdo:** vaso de la cafetería con el nombre del estudiante y la bebida elegida, y aviso de la próxima historia sin fecha.
- **Sonido:** campanilla de puerta, murmullo, tazas, vapor de la máquina, acierto, error suave y fin de escena. Todo sintetizado en el navegador (Web Audio): cero archivos, cero licencias. Controles independientes de Voz, Ambiente y Efectos, con memoria. El ambiente baja al 18 % mientras habla un personaje. Nada suena antes del primer clic.
- **Voces:** síntesis del dispositivo, con perfil distinto por personaje (voz preferida si existe, tono como respaldo) y botón «Más lento». **No es voz profesional** y cambia entre equipos; no se pudo escuchar en esta prueba (el navegador de pruebas no tiene voces instaladas).

### Cambios en motores compartidos (aditivos)

`lab2_core.js`: `LAB2.on/emit`, `LAB2.flags` con `{clave}` en textos, perfil de voz por personaje y silencio. `lab2_steps.js`: `Reply`, `mood` y `listen` en `Speaker`, botón «Más lento», eventos `answer`, paso `pick`. `lab2_app.js`: `startEpisode`, eventos `scene-start`, `scene-end`, `step-done`. `lab2.css`: estilos de respuesta y decisión. La prueba existente sigue en 15/15.

### Estado por columna

| Elemento | Implementado | Probado aislado (E1) | Revisado académicamente | Integrado al Campus | Publicado |
|---|---|---|---|---|---|
| Video 001 (animación) | Sí | Sí | No aplica | No | No |
| Portada e introducción | Sí | Sí | No aplica | No | No |
| Reacciones y continuaciones | Sí | Sí | No | No | No |
| Decisión `pick` y recuerdo | Sí | Sí | No | No | No |
| Sonido ambiente y efectos | Sí | Lógica sí; **no escuchado por una persona** | No aplica | No | No |
| Voces por personaje | Sí | Lógica sí; **no escuchadas** | No | No | No |
| Retratos con expresión | Sí | Sí | Pendiente Natalia | No | No |
| Pieza comercial 9:16 | No | No | — | — | — |

**Pruebas:** `qa_aventura_e1.mjs` 12/12 grupos (video real, omitir, portada, tres escenas con errores, continuidad tras recargar, recuerdo, controles de sonido, movimiento reducido, celular 390 px, conexión lenta, video caído, enlaces). `qa_lab2_e1.mjs` 15/15. Control `qa_cs21a202_source_truth` pasa en local.

**Sin probar:** Safari y Firefox, celular físico, lector de pantalla, y sobre todo el oído humano: nadie ha escuchado todavía el ambiente ni las voces.

**Avance de esta pasada (base: 8 entregables de la orden):** video, integración, interacciones, audio, personajes, pruebas y continuidad = 7 hechos; pieza comercial = 0. 7/8 (87,5 %) construidos; 0/8 validados por personas.

### Para Natalia (decisiones que necesitan su ojo)

1. **Estilo del video y de los retratos:** ilustración plana geométrica, sin rostros en el video y con rostro simple en los retratos. ¿Se mantiene, o se busca ilustración con más carácter hecha por ella?
2. **Paleta:** azul institucional de noche + ámbar + rojo solo en la acción principal; el video usa azules de mañana con el interior cálido de la cafetería.
3. **Tipografía:** Barlow Condensed en títulos, Barlow en texto.
4. **Retratos:** están en una sola función (`LAB2.portrait` en `nb_cine.js`). Se pueden sustituir por sus ilustraciones (tres expresiones por personaje) sin tocar el juego.
5. **Video:** si se aprueba usar video generativo o producir uno, se reemplaza el archivo MP4 y el póster; la página no cambia.

### REVISIÓN CRUZADA — CHATGPT · entrega 3

1. ¿Los cambios aditivos a `lab2_steps.js` y `lab2_core.js` rompen algo de `reto-semana.html` que la prueba de 15 grupos no cubre?
2. `pick` cuenta como acierto a la primera en el resultado. ¿Debe quedar fuera del conteo, como debería quedar `say`?
3. *Coffee or tea? It's on the house.* es vocabulario fuera de la Unidad 1. ¿Se acepta como transparente o se marca como adelanto?
4. Las reacciones en inglés (`react`) usan humor y frases sobre el nivel (*That's my line*). ¿Ayudan o distraen en Básico I?
5. Pendiente de la entrega anterior de Claude, guardado sin publicar (`git stash` local, no está en GitHub): clasificación de respuestas escritas (equivalente válido, error conocido, error de ortografía) y `say` fuera del resultado. Hay que rehacerlo sobre este `main`.
6. PR de seguridad `campus_backend#137` (EL2-SEC-01) sigue en borrador; esta aventura no llama a ese backend.

## 16. Aventura 002 «Un recuerdo de Port Hazel» — 12-nov-2026 CR (Claude)

Misma rama y mismo PR borrador (#764). Sin fusionar ni publicar. Contenido en `BORRADOR IA`.

**Qué es.** Segunda historia jugable: sábado 3:30 p. m., tienda Harbor Gifts. Personaje nuevo, Mr. Okafor; reaparece Sam. Básico I, Unidad 2 (`src/syllabus.jsx`, lecciones 3 y 4): nombrar objetos con *this/these* y *a/an*, decir de quién es algo con *my, your, his, her* y *mine*. Repasa la Unidad 1 (saludo de tarde, deletrear el nombre, cortesía).

**Prueba de extensibilidad.** La historia entera es un archivo de datos, `aventura_002_content.js` (3 escenas, 17 pasos calificados). Usa solo tipos de paso que ya existían; la prueba lo comprueba. Fuera de los datos se tocó: `nb_cine.js` (configuración por aventura en `window.NB_CONFIG`, retrato de Mr. Okafor, recuerdo tipo postal) y la fuente del video (una segunda escena con parámetros). Los motores `lab2_*.js` no cambiaron en esta pasada.

**Continuidad entre historias.** El recuerdo de la 001 enlaza a la 002. La 002 reconoce el nombre usado en la 001 y Sam recuerda la bebida que el estudiante pidió ahí (*One tea on Monday?*). La elección del recuerdo (taza, postal o llavero) vuelve en el diálogo y en la postal final. Todo vive en el navegador.

**Video 002.** `media/harbor_gifts_intro.mp4` (1280×720, 10 s, 1,10 MB, sin audio), `harbor_gifts_intro_480.mp4` (0,50 MB), `harbor_gifts_poster.jpg`. Misma técnica que el 001: animación 2D, **no generativa**. `media_src/render_video_001.mjs --scene gifts`.

| Elemento | Implementado | Probado aislado (E1) | Revisado académicamente | Integrado al Campus | Publicado |
|---|---|---|---|---|---|
| Aventura 002, tres escenas | Sí | Sí | No | No | No |
| Video 002 (animación) | Sí | Sí | No aplica | No | No |
| Continuidad 001 → 002 | Sí | Sí | No aplica | No | No |

**Pruebas:** `qa_aventura_e1.mjs` 14/14 (las 12 anteriores más la 002 completa con errores y la 002 en celular). `qa_lab2_e1.mjs` 15/15. Sigue sin probar: Safari, Firefox, celular físico, y el sonido y las voces con oído humano.

**Avance:** 2 de 16 unidades de Básico I con historia jugable; 0 revisadas por docente; 0 integradas al Campus.

**Para revisión docente (Unidad 2):** *Here you are*, *Good to see you again*, *Whose phone is it?* y *half past three* aparecen sin haberse enseñado antes; decidir si se aceptan como exposición o se cambian. Confirmar que *mine* y *yours* corresponden a la lección 4.

### REVISIÓN CRUZADA — CHATGPT · entrega 4

1. ¿El contenido de la 002 calza con el alcance real de la Unidad 2, o adelanta estructuras de unidades posteriores?
2. En las opciones erradas se muestran frases incorrectas a propósito (*It's a umbrella*, *This is postcards*). ¿Es aceptable en Básico I o conviene que los distractores sean siempre frases correctas en contexto equivocado?
3. La continuidad entre historias depende del almacenamiento del navegador con claves por aventura (`nb_flags_001`, `ADV001DEMO`). Al integrar con sesión real debe pasar al contrato de progreso; ¿se agrega un campo de decisiones (`flags`) a ese contrato?
4. `window.NB_CONFIG` como configuración por página: ¿se mantiene o pasa a vivir dentro del contenido del episodio?

## 17. Revisión del ZIP de Claude + integración promocional con video (12-nov-2026)

**Solicitud:** integrar la versión audiovisual ya creada por Claude con la presentación anterior para revisión de Natalia, sin alterar login ni backend.

### Evidencia de origen

- Se recibió `Northbound Aventura 001.zip` (18 entradas, aprox. 3,51 MB descomprimidos). Los blobs Git del material nuevo y medios MP4 en la rama coinciden con los archivos del ZIP. El `index.html` del ZIP se corresponde con la ruta de despliegue `aventura-001.html`, con carga local de React en GitHub en lugar del CDN.
- `corner_cup_intro.mp4`: 10,00 s, H.264 Main, 1280×720, 30 fps, 1,14 MB, sin pista de audio; variante 854×480 de 0,52 MB.
- `harbor_gifts_intro.mp4`: 10,00 s, H.264 Main, 1280×720, 30 fps, 1,10 MB, sin pista de audio; variante 854×480 de 0,50 MB.
- Los videos son animaciones 2D originales generadas con Canvas y codificadas a MP4, NO video de IA generativa ni filmaciones. Ambiente y voces son sintetizados por el navegador; validación humana del sonido pendiente.

### Cambios realizados sobre el PR #764

- `prototipos/english_lab_2/presentacion.html`: preserva las 6 pantallas y la ruta anterior; reemplaza la sección Northbound con tráiler MP4 real, póster, 480p móvil, controles nativos, CTA audiovisual, enlace de comparación con reto original y enlace opcional a la segunda historia.
- `prototipos/english_lab_2/aventura-001.html`: añade navegación de vuelta a la presentación y ficha de revisión audiovisual bajo `?revision=1`, cuyo texto solo se copia a portapapeles.
- `prototipos/english_lab_2/nb_cine.css`: formulario responsive de revisión, aislado del Campus.
- `prototipos/english_lab_2/qa_aventura_e1.mjs`: tres grupos nuevos para video en presentación, ficha de Natalia y modo normal. `.github/workflows/qa-english-lab2-preview.yml`: ejecuta ambas suites en Google Chrome estable con soporte H.264.

### Verificación

- E1 Chrome real sobre archivos HTTP servidos del repositorio: `qa_lab2_e1.mjs` 15/15 y `qa_aventura_e1.mjs` 17/17; total **32/32 PASS**. Workflow `43259993354` en commit `206f3b641a35453a31db97728a2032aeaba3328a`.
- Se comprobó video de 720p reproduciéndose y avanzando, video MP4 decodificado en presentación móvil, historia 002, formulario de observaciones, modo anterior y ausencia de llamadas al backend. `English LAB Source Truth Guard` PASS (`43259993390`).
- NO constituye E3 verificación pública ni prueba de audio percibido; faltan Safari, Firefox, celulares físicos y criterios de Natalia/docente.

### Salida controlada

- Integración de páginas estáticas nuevas, no se altera `login.html`, Apps Script, matrículas, notas, ni progreso oficial. No requiere escribir datos académicos.
- Enlaces objetivo tras merge Pages: `/prototipos/english_lab_2/presentacion.html#northbound` y `/prototipos/english_lab_2/aventura-001.html?revision=1`.
- **No es acceso privado**: el repositorio Pages es público, y los parámetros `revision=1` o noindex no son autenticación. Pilotaje solo con información ficticia.
- Revisión pendiente: Natalia puntúa audiovisual, claridad y escenas; docentes revisan voces/contenido. No anunciar a prospectos sin esos resultados.

**Estado de publicación confirmado (12-nov-2026):** PR #764 **MERGED** en `main` por squash `69df288247b274504c584bb9716120c5371bea29`. GitHub Pages workflow `43260908080` SUCCESS. Readback HTTP HEAD desde el equipo autorizado: `presentacion.html` **200 text/html** (10.770 bytes), `aventura-001.html?revision=1` **200 text/html** (7.722 bytes), `media/corner_cup_intro_480.mp4` **200 video/mp4** (516.707 bytes), `aventura-002.html` **200 text/html** (5.358 bytes). E3 limitada a publicación estática y presencia de recursos; no es prueba humana de audio, ni integración al Campus autenticado.

## 18. Northbound con sonido desde la introducción · cierre técnico 12-nov-2026

**Estado:** piloto audiovisual independiente publicado. Se completó en el PR [#766](https://github.com/anorteamericana-ship-it/campus-virtual/pull/766), fusionado por squash en `main` SHA `b3c58ff6ff77cc2e818b8d6ab93f93ccea19a4c5`. No se tocó `login.html`, el backend Apps Script, expedientes, asistencia, pagos ni notas.

### Entrega técnica

- `nb_intro_audio.js`: banda sonora original generada en tiempo real con Web Audio (capas de acordes suaves, ambiente y campanilla). El MP4 conserva su pista de video sin audio incrustado. El soundtrack se inicia de forma sincronizada al evento `playing` del video.
- `aventura-001.html` y `aventura-002.html` muestran entrada accesible: **Comenzar con sonido**, **Ver video en silencio**, **Omitir video y jugar**. El motor `nb_cine.js` desbloquea el contexto de sonido desde el clic, ofrece `Esc` para omitir, detiene pista al cerrar y evita reproducción sonora automática por políticas del navegador.
- Clave versionada de introducción `nb_intro_sound_v2_seen_<ID>`: los revisores que vieron la demo antigua reciben una muestra de la entrada sonora una vez; después podrán repetirla desde la portada.
- `presentacion.html`: conserva seis pantallas promocionales; el tráiler incorpora elección explícita **Ver tráiler con sonido / Ver en silencio**, botón para silenciar y controles nativos tras la decisión.
- `nb_cine.css`: adaptación móvil, navegación por teclado y estados visuales. Si el video o AudioContext falla, el juego continúa por una ruta silenciosa.
- El sonido inicial es una creación procedimental original. Las **voces** continúan siendo síntesis local del dispositivo (variable por navegador/OS), no audio narrado por actores profesionales.

### Evidencia certificada

- GitHub Actions, Playwright con **Google Chrome real**: `qa_lab2_e1.mjs` **15/15 PASS**, `qa_aventura_e1.mjs` **21/21 PASS**; **36/36 grupos**. Ejecución `43268054501` sobre `0b5bd33c93d7e6b8acb77ab4293cda09517e947e`.
- QA incluye señal de audio no nula medida con AnalyserNode, audio desde el primer tramo al pulsar, video 720p y 480p móvil, pausa/omisión, replay, final natural a los 10 segundos, accesibilidad con movimiento reducido, alternativa sin AudioContext, fallo de video y controles de sonido. Sin llamadas a Apps Script.
- `English LAB Source Truth Guard` PASS sobre el PR y la fusión en `main`. GitHub Pages publicación SUCCESS en workflow `43268565540` para el SHA anterior.
- Lectura HTTP HEAD desde dispositivo conectado: `presentacion.html` 200 (14593 bytes), `aventura-001.html?revision=1` 200 (8958 bytes), `aventura-002.html` 200 (6594 bytes), `nb_intro_audio.js` 200 (6555 bytes), `media/corner_cup_intro_480.mp4` 200 (516707 bytes, video/mp4). Se comprobó GET con `findstr` de los botones de sonido en la web publicada.

### Rutas públicas para revisión Natalia

- Presentación: `https://anorteamericana-ship-it.github.io/campus-virtual/prototipos/english_lab_2/presentacion.html#northbound`.
- Juego 001 y feedback de Natalia: `https://anorteamericana-ship-it.github.io/campus-virtual/prototipos/english_lab_2/aventura-001.html?revision=1`.
- Juego 002: `https://anorteamericana-ship-it.github.io/campus-virtual/prototipos/english_lab_2/aventura-002.html`.

**Limitaciones:** GitHub Pages es público para cualquier persona con la URL; `revision=1` no es autorización ni privacidad. No se anunció a alumnos. El QA automatizado no demuestra la percepción humana de la mezcla, la calidad de voz o el desempeño en Safari/iPhone físico. Deben evaluarlo Natalia y un docente antes de invitar prospectos. E3 de recursos estáticos confirmado; integración con cuenta/sesión de Campus todavía NO.

**Resultado de esta pasada:** 6/6 operaciones técnicas cerradas (módulo sonoro, entrada al juego, presentación, alternativas/fallback, E1 y Pages+readback). **0/2 revisiones humanas** completadas (Natalia y docente). No expresar 100 % del producto completo; la extensión a más unidades sigue en cola.

## 19. Ciudad Guaria — vista institucional exclusiva de Dirección (12-nov-2026)

**Solicitud:** revisión previa del propietario antes de invitar a Natalia, Raquel y docentes. Ciudad definitiva `Ciudad Guaria`, café definitivo `Café La Esquina`; tienda de Aventura 002 `Detalles de la Plaza` como denominación creativa provisional.

**Identidad sustentada en código institucional:** `styles/tokens.css`: navy `#002F6C`, rojo `#DA291C`, crema `#F3EEE6`, familia Poppins; símbolo real `assets/academy_a.svg`, con trazo curvo central. No inventar otra A ni usar dorado/granate obsoletos.

**Candidato de revisión (no sustituye lanzamiento existente):** `prototipos/english_lab_2/presentacion-guaria.html`. Se reduce a tres bloques: hero audiovisual y un único CTA para jugar, `Tu historia empieza con una decisión` con cuatro etapas integradas, y cierre de matrícula institucional. Se eliminan de esta vista la pantalla redundante de Campus, las comparaciones con el formato antiguo, explicaciones técnicas de MP4 y el botón redundante para ver silencioso. Se mantiene opción `Saltar tráiler` durante reproducción y se pasa a nombre y juego sin repetir película.

**Continuidad y aislamiento:** `guaria-001.html`, `guaria-002.html` y motor original del Lab; identificadores curriculares y pasos conservados. Guardado exclusivo `GP001REVIEW`, `GP002REVIEW`; elección en `nb_flags_gpr001`, sin tocar `ADV001DEMO`, `ADV002DEMO`, las URLs `aventura-001.html`/`aventura-002.html` ni archivos de progreso publicados. La adaptación de textos visibles vive en `guaria-content.js` y la capa cinematográfica candidata `guaria_cine.js`. Esta es una vista previa; migración definitiva sin duplicación de motor se decide tras aprobación.

**Medios originales del candidato:** `guaria_cafe_intro.mp4` y `guaria_gifts_intro.mp4`, con versiones 480p y pósteres actualizados. Proveniencia reproducible: `media_src/guaria_scene.html`, `render_guaria.mjs`, `render_guaria_posters.mjs` y script de preparación. Son animaciones 2D Canvas/ffmpeg, no IA generativa. Web Audio original por activación del usuario, respetando políticas del navegador; video de fondo es silencioso. No se publican marcas comerciales ajenas.

**QA local ya observado (Google Chrome real sobre HTTP local):** `qa_guaria_preview.mjs` **7/7 grupos PASS**, incluyendo marca/3 secciones, vídeo con señal de audio no nula, CTA→tráiler→saltar→nombre→episodio real, primera escena, ausencia de llamadas al backend, ancho 390px sin overflow y Aventura 002. Verificación CI GitHub en PR #769 antes del merge. QA histórico separado de 15+21 grupos permanece como puerta de regresión.

**Compuerta:** publicar la ruta de candidato solo tras CI y comprobar GET/HEAD del dominio GitHub Pages. **No distribuir a evaluadores** hasta que Leonardo revise diseño, ritmo y nombres. El enlace del candidato es público para quien lo conozca y `noindex` no lo convierte en privado. No tocar login, Apps Script, datos, matrículas, notas o pagos.

## 17. North City: una sola ciudad y un solo juego de nombres — 12-nov-2026 CR (Claude)

**Línea base:** `main` `94bf6f9`. **Rama:** `feat/northbound-north-city`. PR borrador, sin fusionar. Autorizado por Leonardo el 12-nov (pasos 1 a 4).

**Decisión de Leonardo:** se descarta «Ciudad Guaria». La ciudad es **North City**, la cafetería **North Coffee** y la tienda **City Gifts**. Es una ciudad donde se habla inglés; quien llega de Costa Rica es el estudiante. Motivo: una ciudad tica donde le hablan inglés contradice la premisa, y Guaria era un reemplazo de texto sobre los mismos edificios.

**Se conserva del candidato de ChatGPT:** paleta oficial (`#002F6C`, `#DA291C`, `#F3EEE6`), Poppins, la A institucional y la presentación de tres secciones.

### Qué cambió

| Tema | Antes | Ahora |
|---|---|---|
| Nombres | Port Hazel en las fuentes; Guaria aplicada encima con `guaria-content.js` al cargar | North City escrito directamente en contenido, páginas, pruebas y fuente del video. Sin capa de reemplazo |
| Capa audiovisual | `guaria_cine.js` generado desde `nb_cine.js` por un script | Un solo `nb_cine.js` con la paleta oficial |
| Páginas | `presentacion-guaria.html`, `guaria-001/002.html` | `north-city.html`, `north-001.html`, `north-002.html`. Las tres rutas Guaria redirigen |
| Entrada al juego | Nombre → lista con cuatro botones «Jugar» → escena | Nombre → primera escena pendiente (`autoPlay`). Si ya terminó todo, ve la lista |
| Tamaño en el juego | Opciones de ~17 px, retrato de 74 px | Opciones de 22 px, pregunta de 18 px, retrato de 104 px (medido en la prueba) |
| Portada | El rótulo quemado en el video asomaba detrás del título | Video de fondo propio sin rótulo ni fundidos: `media/north_city_hero.mp4` (0,75 MB) |
| Botón principal | «Jugar esta versión con video» | «Jugar la primera historia» |
| Tarjetas de nivel | Texto de 13 px | Texto más grande; la primera dice qué se puede jugar hoy |
| Videos | Rótulos de Guaria | Regenerados con NORTH COFFEE, CITY GIFTS y NORTH CITY, colores oficiales. Mismos nombres de archivo (`corner_cup_*`, `harbor_gifts_*`) |

Las páginas del piloto (`reto-semana.html`, `aventura-001/002.html`, `presentacion.html`) siguen existiendo y ahora muestran también North City. Siguen ahí porque las pruebas de CI se apoyan en ellas; retirarlas es el paso siguiente y exige migrar esas pruebas.

### Archivos que quedaron sin uso (NO borrados: requieren aprobación de la lista exacta)

`guaria-content.js`, `guaria_cine.js`, `prepare_guaria_game.py`, `media_src/guaria_scene.html`, `media_src/prepare_guaria_media.py`, `media_src/render_guaria.mjs`, `media_src/render_guaria_posters.mjs`, `media/guaria_cafe_intro.mp4`, `media/guaria_cafe_intro_480.mp4`, `media/guaria_cafe_poster.jpg`, `media/guaria_gifts_intro.mp4`, `media/guaria_gifts_intro_480.mp4`, `media/guaria_gifts_poster.jpg` (3,5 MB en total). Ninguna página los carga ya.

### Estado

| Elemento | Implementado | Probado aislado (E1) | Revisado por personas | Integrado al Campus | Publicado |
|---|---|---|---|---|---|
| Nombres North City en todo | Sí | Sí | No | No | No |
| Páginas `north-*` y redirecciones | Sí | Sí | No | No | No |
| Entrada directa y letra grande | Sí | Sí | No | No | No |
| Videos regenerados y fondo de portada | Sí | Reproducción sí; vistos tres cuadros | No | No | No |

**Pruebas (Chrome real):** `qa_north_city.mjs` 9/9, `qa_aventura_e1.mjs` 21/21, `qa_lab2_e1.mjs` 15/15. **Sin probar:** sonido con oído humano, Safari, Firefox, celular físico, 320 px y tableta en el juego (sí en la presentación antes del cambio).

**Pendiente de decisión:** técnica de video. La animación por código llegó a su techo. Opciones: ilustraciones de Natalia montadas en el mismo sistema (recomendada), o video generativo con costo sobre el límite de IA.

### REVISIÓN CRUZADA — CHATGPT · entrega 5

1. La auditoría de «Ciudad Guaria» que se pidió queda sin objeto: el concepto se retiró. Si se audita, que sea sobre `north-city.html` y `north-001/002.html`.
2. Las claves de avance pasaron de `GP001REVIEW` a `NC001PLAY`. Quien probó Guaria empieza de cero; ¿importa para alguna revisión en curso?
3. `autoPlay` vive en `lab2_app.js` y solo se activa desde `north-game.js`. ¿Debe ser el comportamiento por defecto también en las páginas del piloto?
4. ¿Se aprueba la lista de archivos sin uso para borrarlos?

## 18. Voces grabadas por línea — 12-nov-2026 CR (Claude)

Misma rama y PR borrador (#770). Motivo: Leonardo escuchó la voz del dispositivo y la calificó de robótica.

- **Qué cambió:** cada línea de personaje de las dos historias y las 26 letras tienen ahora un archivo de audio propio. «Escuchar» reproduce ese archivo; la síntesis del dispositivo queda solo como respaldo si el archivo falla. «Más lento» reproduce el mismo archivo al 78 % sin cambiar el tono.
- **Cómo se generaron:** Kokoro-82M (licencia Apache-2.0) ejecutado localmente con `kokoro-onnx`. Sin servicio en línea y sin costo. **Son voces sintéticas neuronales, no grabaciones de personas.** Ms. Rivera `af_heart`, Sam `am_michael`, Mr. Okafor `am_onyx`, modelo de frase `af_sarah`.
- **Archivos:** `media/voice/*.mp3` (122 clips, 222 s, 1,2 MB en total; se pide solo el que se toca), `voice_manifest.js` (generado), `media_src/make_voices.py` (reproducible).
- **Nombre del estudiante:** no se puede grabar. Las líneas que lo llevan como vocativo se grabaron sin él («Thank you, {name}.» suena «Thank you.»). El subtítulo sí lo muestra: hay una diferencia pequeña entre audio y texto en esas líneas.
- **Pruebas:** `qa_north_city.mjs` 10/10 (clip servido y sonando, lento, silencio, ambiente que cede, 100 % de líneas con archivo), `qa_aventura_e1.mjs` 21/21, `qa_lab2_e1.mjs` 15/15.
- **Sin validar:** nadie ha escuchado los 122 clips. Las letras sueltas son el punto de mayor riesgo (un motor de voz puede leer «A.» como artículo). Requiere oído humano, idealmente de una docente.
- **Motor de pronunciación:** se revisó el repo y **no existe** ninguno (no hay reconocimiento de voz ni uso de micrófono en `src/`, `modulos/` ni `campus.html`; `pronunciation_lab` en `academia_play.jsx` es una entrada de catálogo). El paso oral sigue siendo autodeclarado. Opción sin costo pendiente de decisión: reconocimiento de voz del navegador para medir si la frase se entendió (no mide pronunciación fonema por fonema, no funciona en Firefox y envía el audio al proveedor del navegador).
- **Retratos:** Leonardo los considera infantiles. Pendiente de decisión: ilustraciones de Natalia o imágenes generadas.
