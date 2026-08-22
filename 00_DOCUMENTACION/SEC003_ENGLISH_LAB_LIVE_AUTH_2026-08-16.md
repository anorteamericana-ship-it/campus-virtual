# SEC-003 · English LAB Live · sesión, identidad y secreto de respuesta

**Fecha original:** 2026-08-16  
**Reconciliación de política:** 2026-08-21  
**Rama fuente:** `fix/sec003-english-lab-live-auth`  
**Estado:** `SOURCE V2 · SALA_MIXTA_AUTORIZADA · BACKEND NO INSTALADO · NO PROD`

## 1. Límite de alcance

Este corte corrige únicamente el camino **English LAB Live no-Memory**.

Memory Match:

- no se edita;
- no se modifica ningún endpoint `englishLabMemoryMatch*`;
- no se modifica sincronización, timers, estado, motor ni tablero;
- estado vigente `FROZEN_DEFERRED_NON_BLOCKING`;
- Issue #78 continúa siendo la frontera de autoridad.

## 2. Qué estaba realmente mal

La auditoría confirmó dos problemas principales:

1. los endpoints de jugador podían interceptar `doPost` sin validar realmente la sesión aunque el frontend enviara token;
2. `_elivePlayerState_()` podía devolver `room.current_question.correct` durante ronda OPEN a través de `_eliveRoomPublic_()` aunque `question.correct` ya hubiese sido eliminado.

También se detectó que `englishLabLiveGetQuestionBankMeta()` podía ejecutar setup/seed antes de autenticar.

## 3. Contrato V2

Versionado en:

`security/sec003_english_lab_live_contract.json`

Para jugador Live:

- sesión Campus obligatoria;
- rol exacto `student`;
- `sesion.codigo` matriculado obligatorio;
- `player_id`, código/cédula, nombre y equipo enviados por navegador no son autoridad;
- player ID canónico = `sesion.codigo`;
- nombre canónico = `sesion.nombre`;
- política de sala = **`SALA_MIXTA_AUTORIZADA`**.

### Decisión de producto

Un estudiante autenticado y matriculado puede entrar a una sala `LAB-####` válida aunque pertenezca a otro grupo.

Esto preserva sesiones combinadas, Club I CAN y actividades especiales.

Se elimina únicamente la antigua condición de “mismo grupo”. La sala sigue necesitando existir y la identidad sigue derivándose de la sesión.

## 4. Proyección segura de sala

`_eliveRoomForPlayer_(room)`:

1. obtiene la proyección pública normal;
2. reemplaza `current_question` por `_eliveQuestionForPlayer_(room)`.

Durante OPEN no se entrega `correct` ni `explanation` ni en `state.question` ni en `state.room.current_question`. Durante CLOSED el reveal sigue permitido.

## 5. Identidad canónica y autorización

Helpers SEC-003:

- `_eliveAuthStudent_`;
- `_eliveStudentCanRoom_`;
- `_elivePlayerBodyFromSession_`;
- `_eliveAuthRoomViewer_`;
- `_eliveRoomForPlayer_`.

### Join

`englishLabLiveJoinRoom`:

- valida sesión antes de inicializar Sheets;
- exige student + código matriculado;
- resuelve sala válida;
- **no exige coincidencia de grupo**;
- hace upsert únicamente con identidad de sesión.

### Player state

`englishLabLiveGetPlayerState` ignora `player_id` del navegador y busca únicamente `auth.codigo`.

### Submit

Se endurecen las dos definiciones observadas de `englishLabLiveSubmitAnswer`:

- histórica CS20C;
- redefinición efectiva CS20D.

Ambas autentican student, validan sala, canonizan identidad y mantienen corrección/puntuación en servidor.

### Leaderboard

Deja de ser anónimo.

Permite:

- student autenticado/matriculado con una sala válida, incluso si la sala pertenece a otro grupo;
- teacher autorizado para la sala;
- admin/superadmin.

Devuelve proyección player-safe.

### Question-bank metadata

`englishLabLiveGetQuestionBankMeta()` autentica docente antes de `_eliveEnsureSheets_()` / seed.

## 6. UI fuente

`src/english_lab_live.jsx` conserva el endurecimiento de identidad visible:

- nombre tomado de sesión y read-only;
- código tomado de sesión y read-only;
- elimina fallback a cédula/identificación;
- si falta `codigo` matriculado, falla antes del join;
- el código de sala sigue editable.

## 7. Candidato backend histórico vs delta vigente

El candidato completo V1 de 2026-08-16 queda únicamente como evidencia histórica y **no debe instalarse**.

El artefacto vigente es:

`qa/sec003_codegs_live_auth_delta.patch`

La V2 mantiene el endurecimiento de sesión/identidad/anti-leak, pero diverge deliberadamente del candidato histórico en la política de acceso a sala: **otro grupo permitido**.

No reemplazar el proyecto QA acumulado con un `Code.gs` histórico completo.

## 8. QA fuente V2

Pruebas esperadas:

1. Join exige auth student.
2. GetPlayerState exige auth student.
3. Ambas definiciones de Submit exigen auth student.
4. Submit usa identidad canónica.
5. Leaderboard exige viewer autenticado.
6. Question-bank meta autentica antes de setup/seed.
7. OPEN elimina `correct`/`explanation` en ambas proyecciones.
8. CLOSED conserva reveal.
9. Sesión inválida rechazada.
10. Teacher no puede autenticarse como jugador.
11. Student sin `codigo` matriculado rechazado.
12. Student matriculado aceptado.
13. Student del mismo grupo aceptado.
14. Student matriculado de **otro grupo también aceptado** en sala válida.
15. `player_id`/nombre forjados ignorados.
16. autoasignación de team del navegador ignorada.
17. Join sin auth se detiene antes de `_eliveEnsureSheets_`.
18. Join mixto escribe identidad canónica de sesión.
19. Diff SEC-003 no toca Memory Match.

Prueba reproducible:

`scripts/qa_sec003_english_lab_live_backend_candidate.mjs`

## 9. Qué NO está hecho todavía

- la V2 no está instalada en Apps Script QA;
- no se ha probado estudiante real QA contra `/exec` con estas funciones;
- no se ha probado teacher real QA después del cambio backend;
- no se ha hecho deploy productivo;
- no se ha modificado Memory Match.

## 10. Gate antes de promoción

1. exportar/congelar el proyecto Apps Script QA acumulado ACTUAL;
2. enumerar todos los `.gs` y wrappers `doPost` efectivos;
3. verificar preimágenes del delta V2;
4. portar exclusivamente los hunks SEC-003 V2;
5. conservar mismo deployment QA;
6. probar student mismo grupo;
7. probar student matriculado de otro grupo y confirmar join permitido;
8. probar sin token;
9. probar identidad forjada;
10. inspeccionar JSON OPEN/CLOSED;
11. probar teacher sin regresión;
12. confirmar diff cero de Memory Match;
13. solo entonces considerar SEC-003 listo para consolidación.

**NO PROD · NO BACKEND COMPLETO HISTÓRICO · SALA_MIXTA_AUTORIZADA.**
