# English LAB Live · Ahorcado · CS21A191

Estado: **candidato de desarrollo en QA/STAGING**. No está desplegado en producción y no está fusionado a `main`.

## Objetivo

Agregar Ahorcado como juego grupal de English LAB Live sin duplicar el motor de salas, identidad, presencia y turnos. El juego usa validación autoritativa del servidor: la respuesta canónica permanece en `SETTINGS_JSON` y no se entrega al estudiante mientras la ronda está abierta.

## Arquitectura

### Registro genérico de juegos

`src/english_lab_games/english_lab_game_registry_cs21a191.js`

Publica metadatos para:
- `MEMORY_MATCH`
- `SENTENCE_ORDER`
- `HANGMAN`

No sustituye los motores históricos. Su función es evitar que futuros juegos vuelvan a introducir contratos completamente separados.

### Motor puro

`src/english_lab_games/hangman_engine_cs21a191.js`

Responsabilidades:
- normalización de palabra/frase;
- alfabeto A–Z;
- espacios, apóstrofos, guiones y puntuación visibles;
- máscara pública;
- apariciones de una letra;
- detección de palabra resuelta;
- puntuación;
- vidas restantes;
- validación del turno en cliente únicamente para UX.

No hace `fetch`, no consulta Sheets y no contiene banco pedagógico.

### Integración Live

`src/english_lab_games/english_lab_hangman_live_cs21a191.jsx`

Docente:
1. abre English LAB Live;
2. selecciona la pestaña **Ahorcado**;
3. selecciona grupo, U01–U16, Individual/Equipos, 3–5 rondas, vidas y tiempo por turno;
4. carga palabras sugeridas;
5. revisa/edita palabra y pista conservando `source_item_id`;
6. confirma la revisión curricular;
7. crea sala `LAB-####`;
8. inicia, controla, avanza y cierra.

Estudiante:
- conserva la entrada estándar de English LAB Live;
- `englishLabLiveJoinRoom` y `englishLabLiveGetPlayerState` son interceptados por backend para una sala `HANGMAN`;
- un observador no destructivo detecta la respuesta y cambia a la vista especializada;
- polling especializado cada 2.5 s, sin polling cuando la pestaña está oculta;
- teclado físico y teclado táctil A–Z.

### Carga canónica de dependencias

`src/english_lab_live_student_dependency_guard_cs21a184.js`

Antes de cargar `english_lab_live.jsx` agrega:
- registro genérico CS21A191;
- motor Ahorcado CS21A191;
- integración Ahorcado CS21A191.

Esto cubre tanto la ruta normal como la entrada desde Academia Play que históricamente cargaba `english_lab_live.jsx` directamente.

### Backend QA

`apps_script_patches/99M_HANGMAN_QA_CS21A191.gs`

Solo QA/STAGING. Funciones:
- `englishLabHangmanSuggestions`
- `englishLabHangmanCreateRoom`
- `englishLabHangmanStartRoom`
- `englishLabHangmanGetRoomControl`
- `englishLabHangmanJoinRoom`
- `englishLabHangmanGetPlayerState`
- `englishLabHangmanAction`
- `englishLabHangmanCloseRound`
- `englishLabHangmanNextRound`
- `englishLabHangmanCloseRoom`
- `verificarHangmanCS21A191`

También enruta las entradas estándar:
- `englishLabLiveJoinRoom`
- `englishLabLiveGetPlayerState`

cuando la sala encontrada tiene `GAME_CODE = HANGMAN`.

## Fuente curricular

CS21A191 separa dos conceptos para no atribuir contenido a una fuente incorrecta:

- **currículo/unidad:** `CONFIG_UNIDADES`, que ya está validado contra Apollo en la cadena CS21A183;
- **contenido jugable inicial:** `QUESTION_BANK`, filas de asociación `MEMORY_MATCH` correspondientes al mismo nivel/unidad.

La sugerencia transforma:
- `PAIR_LEFT` / `STEM` → palabra o frase a descubrir;
- `PAIR_RIGHT` → pista.

Cada elemento conserva `source_item_id`, `source_answer` y `source_clue`. El docente puede editar, pero el backend rechaza una sala si se pierde la referencia a la fuente cargada.

**Importante:** CS21A191 no afirma que `QUESTION_BANK` sea Apollo. La trazabilidad curricular es `CONFIG_UNIDADES`; el contenido jugable se identifica explícitamente como `QUESTION_BANK`. Si posteriormente se define una plantilla de vocabulario canónica directa en `ACADEMIA_PLAY_BANK`, puede sustituirse la fuente sin rehacer el motor.

## Reglas iniciales

- 3–5 palabras/frases por sala.
- 6 errores por defecto; configurable en QA.
- 15 s por turno por defecto; configurable.
- letra correcta: `10 × apariciones`, conserva turno y recibe un turno fresco;
- letra incorrecta: 0 puntos, suma un error y rota turno;
- letra repetida: 0 puntos, no resta vida ni rota;
- resolver correctamente: `100 + 10 × vidas restantes`;
- resolver incorrectamente: suma un error y rota;
- timeout: rota turno, **no** consume vida;
- el backend decide siempre si una acción es válida y si el jugador está en turno;
- `action_key` y `recent_action_keys` protegen contra doble envío/reintento.

## Estados

Sala:
- `CREATED`
- `LIVE`
- `CLOSED`

Ronda:
- `READY`
- `OPEN`
- `CLOSED`

Estado público Ahorcado:
- pista;
- máscara;
- letras utilizadas;
- letras incorrectas;
- errores y máximo;
- turno activo;
- secuencia de acción;
- completado/ganado.

La respuesta canónica no existe en el estado público durante `OPEN`. Solo se agrega al cerrar/completar la ronda.

## Contrato genérico

`schemas/english_lab_game_package_cs21a191.schema.json`

A diferencia del esquema CS21A173, no exige `MEMORY_MATCH` ni `round.cards`. Define una envoltura común `room + state + game_payload` para nuevos juegos.

## Accesibilidad y móvil

`styles/english_lab_hangman_cs21a191.css`

Incluye:
- objetivos táctiles mínimos de 44 px;
- `:focus-visible`;
- teclado físico A–Z;
- `aria-live` en el tablero;
- breakpoints 900, 560 y 390 px;
- respuesta completa mediante input además del teclado de letras.

## Pruebas automáticas

- `scripts/test_english_lab_hangman_engine_cs21a191.mjs`
- `scripts/test_english_lab_hangman_contract_cs21a191.mjs`
- `scripts/test_english_lab_hangman_browser_cs21a191.mjs`
- `.github/workflows/cs21a191-hangman.yml`

Preview sintético sin backend:
`src/english_lab_games/hangman_preview_cs21a191.html`

## Apps Script completo

El usuario **nunca debe pegar 99M manualmente**.

`scripts/assemble_apps_script_cs21a183_complete.mjs` agrega 99M al archivo único:

`apps_script_patches/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs`

La acción del usuario, cuando llegue la QA autenticada, sigue siendo únicamente:
1. abrir el archivo Apps Script objetivo;
2. Ctrl+A;
3. eliminar todo;
4. pegar el archivo completo generado;
5. guardar.

## Gates pendientes antes de PASS funcional

Los tests automáticos pueden declarar PASS de motor/contrato/sintaxis, pero **no sustituyen QA autenticada**.

Cuando se pueda usar Apps Script QA:
1. reemplazar una sola vez el archivo completo;
2. ejecutar `verificarActualizacionQA()` o `verificarHangmanCS21A191()`;
3. docente crea sala B1/U01 con 3 palabras;
4. Chu y Naty ingresan con código normal;
5. iniciar;
6. probar letra correcta → conserva turno;
7. probar letra repetida → sin penalización;
8. probar letra incorrecta → pierde vida y rota;
9. dejar vencer turno → rota sin perder vida;
10. intentar resolver mal;
11. resolver bien;
12. avanzar ronda;
13. comprobar sincronización docente/estudiantes;
14. cerrar sala;
15. repetir Teams y móvil 390 px;
16. luego carga progresiva 2 → 5 → 10 → 15 → 25.

Hasta completar esos gates, el estado correcto es **desarrollo/CI listo; QA autenticada pendiente**, no release aprobado.
