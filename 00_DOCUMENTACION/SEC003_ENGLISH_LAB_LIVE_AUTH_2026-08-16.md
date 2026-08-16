# SEC-003 · English LAB Live · sesión, identidad y secreto de respuesta

**Fecha:** 2026-08-16  
**Rama frontend:** `fix/sec003-english-lab-live-auth`  
**Base exacta:** PR #85 head `49eb9fb8b9286d7de238ba46a0fcf9d07d7d7d8d`  
**Estado:** `CANDIDATO QA · BACKEND NO INSTALADO · NO PROD`

## 1. Límite de alcance

Este corte corrige únicamente el camino **English LAB Live no-Memory**.

Memory Match:

- no se edita;
- no se modifica ningún endpoint `englishLabMemoryMatch*`;
- no se modifica sincronización, timers, estado, motor ni tablero;
- PR #85 continúa manteniéndolo fuera de la nueva entrada visible;
- Issue #78 continúa siendo la frontera de autoridad.

El diff del candidato backend se verificó para no contener líneas modificadas con marcadores `Memory Match`, `MEMORY_MATCH` o `englishLabMemoryMatch`.

## 2. Qué estaba realmente mal

La auditoría resumía dos síntomas: jugador sin sesión y respuesta correcta expuesta.

Ambos se confirmaron, pero el segundo tenía una ruta menos obvia.

### 2.1 Jugador sin sesión

Los endpoints de jugador tienen wrappers propios de `doPost` y, en la fuente observada, interceptan antes del router general:

- `englishLabLiveJoinRoom`;
- `englishLabLiveGetPlayerState`;
- `englishLabLiveSubmitAnswer`;
- `englishLabLiveGetLeaderboard`.

El frontend enviaba token mediante `postLive`, pero esas funciones no lo validaban.

`_elivePlayerCode_(body)` aceptaba directamente:

- `player_id`;
- `cod_estudiante`;
- `codigo`;
- `cedula`;
- y si no existía ninguno generaba `TMP-*`.

`_eliveUpsertPlayer_` aceptaba también nombre y equipo suministrados por navegador.

Consecuencia: enviar token desde el navegador no equivalía a tener autorización server-side.

### 2.2 Respuesta correcta expuesta durante ronda abierta

`_eliveQuestionForPlayer_()` **ya hacía una parte correctamente**:

- mientras la ronda estaba abierta eliminaba `correct`;
- eliminaba `explanation`;
- al cerrar la ronda permitía reveal.

Pero `_elivePlayerState_()` devolvía simultáneamente:

- `question:_eliveQuestionForPlayer_(room)` — saneado;
- `room:_eliveRoomPublic_(room)` — no saneado.

`_eliveRoomPublic_()` parsea `CURRENT_QUESTION_JSON` completo y lo coloca en `room.current_question`.

Por tanto, durante una ronda abierta el navegador podía recibir la respuesta correcta en:

`room.current_question.correct`

incluso aunque `question.correct` hubiese sido eliminado.

Ese era el leak real.

## 3. Hallazgo adicional

`englishLabLiveGetQuestionBankMeta()` ejecutaba:

1. `_eliveEnsureSheets_()`;
2. `_eliveCs20fSeedIfEmpty_()`;

sin autenticación previa.

Aunque el resultado de metadata no entrega las respuestas del banco, un endpoint de lectura podía crear/sembrar infraestructura anónimamente. El candidato exige auth docente antes de setup/seed.

## 4. Contrato nuevo

Versionado en:

`security/sec003_english_lab_live_contract.json`

Para jugador Live:

- sesión Campus obligatoria;
- rol exacto `student`;
- `sesion.codigo` matriculado obligatorio;
- la sala debe pertenecer a uno de los grupos de la sesión;
- `player_id`, código/cédula, nombre y equipo enviados por navegador no son autoridad;
- player ID canónico = `sesion.codigo`;
- nombre canónico = `sesion.nombre`.

El candidato no depende de los flags `estudiante_gratis` / `perfil_pre_matricula` porque `validarSesion()` observado no los reconstruye desde la hoja de sesiones. La condición `student + codigo + grupo de la sala` es verificable en la sesión persistida.

## 5. Proyección segura de sala

Se añade `_eliveRoomForPlayer_(room)`:

1. obtiene la proyección pública normal de la sala;
2. reemplaza `current_question` por `_eliveQuestionForPlayer_(room)`.

Resultado:

### Ronda OPEN

No se entrega `correct` ni `explanation` en:

- `state.question`;
- `state.room.current_question`.

### Ronda CLOSED

El reveal sigue permitido y el frontend existente puede marcar respuesta correcta/explicación.

Los endpoints de control docente no se degradan: conservan sus rutas de pregunta completa.

## 6. Identidad canónica

Se añaden helpers de seguridad:

- `_eliveAuthStudent_`;
- `_eliveStudentCanRoom_`;
- `_elivePlayerBodyFromSession_`;
- `_eliveAuthRoomViewer_`;
- `_eliveRoomForPlayer_`.

### Join

`englishLabLiveJoinRoom`:

- valida sesión antes de inicializar Sheets;
- exige student + código;
- resuelve sala;
- exige pertenencia al grupo;
- hace upsert con identidad de sesión.

### Player state

`englishLabLiveGetPlayerState`:

- ignora `player_id` suministrado por navegador;
- busca únicamente `auth.codigo`.

### Submit

Se endurecen **las dos definiciones** observadas de `englishLabLiveSubmitAnswer`:

- la histórica CS20C;
- la redefinición efectiva CS20D de puntuación rápida.

Esto evita dejar una implementación insegura que pudiera reactivarse por cambio de orden/modularización.

Ambas:

- autentican student;
- verifican grupo;
- canonizan identidad antes del upsert;
- mantienen la corrección/puntuación en servidor.

### Leaderboard

`englishLabLiveGetLeaderboard` deja de ser anónimo.

Permite:

- student del grupo de la sala;
- teacher autorizado para la sala;
- admin/superadmin.

Devuelve proyección de sala player-safe.

## 7. UI en la rama apilada sobre PR #85

`src/english_lab_live.jsx` cambia únicamente la identidad visible del jugador:

- nombre tomado de la sesión y read-only;
- código tomado de la sesión y read-only;
- elimina `(opcional para demo)`;
- elimina edición de nombre/código;
- elimina fallback de `liveStudentCode()` a cédula/identificación;
- si falta `codigo` matriculado, falla antes de intentar el join.

El código de sala sigue siendo editable.

El renderer de respuesta cerrada (`question.correct`) se conserva: la frontera correcta es que el backend no envíe ese campo durante OPEN.

## 8. Candidato backend QA

Fuente base observada:

`BACKUP_PRE_SEC001_Code_2026-08-16.gs`

Base SHA-256:

`d24fc63c59e60ba92808d4d870f4eb95e35bb6f1c158a130229b187a66e35d37`

Candidato Drive:

`SEC003_ENGLISH_LAB_LIVE_AUTH_QA_CANDIDATE_2026-08-16.gs`

Drive ID:

`1nZ2dYIAQ8y0v3nco8334prmrTxou_6em`

Tamaño verificado después de descargarlo nuevamente:

`2.974.861 bytes`

SHA-256 verificado después de round-trip Drive:

`02fe9adab5e9fa260a7b335e030597458ab85ddf5038bc2e22a14fe39ccfe47e`

El archivo completo pasa sintaxis JavaScript.

## 9. Pruebas backend ejecutadas offline

PASS:

1. Join exige auth student.
2. GetPlayerState exige auth student.
3. Submit histórico exige auth student.
4. Submit efectivo CS20D exige auth student.
5. Submit efectivo usa identidad canónica.
6. Leaderboard exige viewer autenticado.
7. Leaderboard usa room player-safe.
8. Question-bank meta autentica antes de setup/seed.
9. PlayerState ya no devuelve `_eliveRoomPublic_` crudo.
10. OPEN elimina `question.correct`.
11. OPEN elimina `question.explanation`.
12. OPEN elimina `room.current_question.correct`.
13. OPEN elimina `room.current_question.explanation`.
14. CLOSED conserva reveal.
15. Sesión inválida rechazada.
16. Teacher no puede autenticarse como jugador.
17. Student sin `codigo` matriculado rechazado.
18. Student matriculado aceptado.
19. Grupo de sesión correcto aceptado.
20. Grupo ajeno rechazado.
21. `player_id` forjado ignorado.
22. nombre forjado ignorado.
23. autoasignación de team desde navegador ignorada en este corte.
24. Join sin auth se detiene antes de `_eliveEnsureSheets_`.
25. Join autenticado llega al upsert.
26. Join escribe identidad canónica.
27. Join a grupo ajeno falla antes del upsert.
28. Diff SEC-003 no toca marcadores Memory Match.

Prueba reproducible:

`scripts/qa_sec003_english_lab_live_backend_candidate.mjs`

## 10. Frontend QA

Versionado:

`scripts/qa_sec003_english_lab_live_frontend.mjs`

El cambio se aplicó mediante workflows temporales fail-closed que:

- exigieron una preimagen exacta;
- modificaron solo `src/english_lab_live.jsx`;
- ejecutaron el gate;
- ejecutaron `git diff --check`;
- fallaban si el diff mencionaba Memory Match.

Ambos workflows temporales fueron eliminados después de sus ejecuciones exitosas.

## 11. Qué NO está hecho todavía

- el candidato no está instalado en Apps Script QA;
- no existe nuevo deployment QA;
- no se ha probado estudiante real QA contra `/exec` con estas funciones;
- no se ha probado teacher real QA después del cambio backend;
- no se ha hecho deploy productivo;
- no se ha modificado Memory Match;
- no se ha fusionado PR #85 ni esta rama.

La limitación es la misma ya documentada en SEC-001/002: la integración disponible puede leer/respaldar archivos de Drive y GitHub puede probar un `/exec` ya publicado, pero esta sesión no dispone de una acción Apps Script/clasp para instalar source o crear deployment.

## 12. Gate antes de merge/promoción

1. instalar este candidato en el proyecto Apps Script QA correcto;
2. confirmar deployment QA exacto;
3. ejecutar student QA del grupo correcto;
4. comprobar que DevTools/JSON OPEN no contiene `correct` ni `explanation` en ninguna de las dos rutas de pregunta;
5. intentar join sin token;
6. intentar join con student de otro grupo;
7. intentar `player_id`/nombre/código forjado;
8. intentar leaderboard sin token y desde otro grupo;
9. cerrar ronda y confirmar reveal correcto;
10. probar teacher crear/iniciar/lanzar/cerrar sin regresión;
11. ejecutar el harness autenticado de PR #85;
12. revisar que Memory Match siga sin cambios;
13. solo entonces considerar SEC-003 listo para consolidación.
