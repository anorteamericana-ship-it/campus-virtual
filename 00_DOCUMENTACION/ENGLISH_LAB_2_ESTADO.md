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
