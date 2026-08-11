# CS21A200 · Word Search Live unificado

Estado: QA solamente. No producción. Base: CS21A199-R2.

## Objetivo

Integrar Word Search B1-U01 al stack Live sin crear un Apps Script instalable separado por juego. La fuente queda modular, pero `scripts/assemble_apps_script_cs21a200_unified.mjs` genera un único archivo QA acumulativo:

`apps_script_patches/99_CS21A200_ENGLISH_LAB_UNIFIED_COMPLETO.gs`

Ese completo contiene la cadena anterior (Memory Match, Sentence Order, Hangman, Quiz Time) y Word Search CS21A200.

## Currículo inicial

- Nivel: B1
- Unidad: B1-U01 · What's your name?
- Fuente: `CONFIG_UNIDADES` + `ACADEMIA_PLAY_BANK`
- 10 vocablos canónicos
- cuadrícula 14×14
- 3 minutos
- práctica formativa, sin nota oficial

## Contrato autoritativo

El secreto del puzzle (incluyendo `solutions`) se guarda únicamente en `SETTINGS_JSON.word_search_secret`.

El navegador recibe solamente:

- `puzzle_id`
- `grid`
- banco de palabras
- `round_id`
- `round_ends_at`
- `claimed_words`
- ranking/presencia

Nunca recibe `solutions` ni coordenadas objetivo.

Cada acción `CLAIM_WORD` exige:

- `action_id`
- `round_id`
- `puzzle_id`
- `word_id`
- `start {row,col}`
- `end {row,col}`

El `player_id` real se deriva de la sesión autenticada mediante el mismo flujo Live existente.

## Concurrencia

El claim se valida bajo `LockService.getScriptLock()` después de refetch de la sala.

Invariantes:

1. Primer claim válido de una palabra gana.
2. El segundo jugador recibe `word_already_claimed` junto con `room_state` autoritativo.
3. Repetir el mismo `action_id` no duplica la respuesta.
4. `round_id` viejo devuelve `round_stale`.
5. `puzzle_id` viejo devuelve `puzzle_stale`.
6. Un trazo que no coincide exactamente con la solución devuelve `seleccion_invalida`.
7. El cliente no suma una palabra por ACK local; sólo por `claimed_words` del snapshot.
8. Errores transitorios conservan la misma acción para reintento.

## Endpoints QA

- `englishLabWordSearchTeacherData`
- `englishLabWordSearchCreateRoom`
- `englishLabWordSearchStartRoom`
- `englishLabWordSearchGetRoomControl`
- `englishLabWordSearchJoinRoom`
- `englishLabWordSearchGetPlayerState`
- `englishLabWordSearchClaimWord`
- `englishLabWordSearchCloseRoom`

## Loader

CS21A200 añade al manifest canónico:

1. contrato Word Search R2
2. motor R2
3. componente R2
4. estilos CS200
5. cliente Live CS200
6. `english_lab_live.jsx`
7. gateway Quiz CS198
8. gateway multi-juego CS200

Memory Match conserva el dueño autoritativo CS192 y `LATENCY_SAFE_EPOCH=CS21A194`.

## Gate automatizado

El workflow `CS21A200 Word Search Live Unified QA` exige:

- motor R2 determinista;
- 120 seeds y ocurrencia única;
- contrato backend puro;
- first-claim-wins usando el endpoint real con Sheets/Lock sintéticos;
- replay idempotente del mismo `action_id`;
- integración loader/cliente/gateway;
- ensamblado del único Apps Script QA;
- `node --check` del backend acumulativo;
- browser QA R2;
- browser QA Live CS200.

## QA autenticada posterior

Antes de producción se requiere sala real con docente + Naty + Chu:

- docente ve exactamente 2 participantes antes de iniciar;
- los tres ven el mismo puzzle;
- un claim aparece en los tres paneles;
- Naty y Chu intentan la misma palabra casi simultáneamente: un solo ganador;
- el perdedor reconcilia sin marcar punto local;
- F5 no duplica claims;
- reloj converge;
- cierre terminal sin resurrección.
