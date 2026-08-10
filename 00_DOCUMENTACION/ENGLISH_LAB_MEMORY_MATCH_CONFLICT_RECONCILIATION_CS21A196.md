# CS21A196 · Memory Match conflict reconciliation

## Incidente real que motiva esta rama

QA autenticada `LAB-6254` (docente + Naty + Chu) mostró que un jugador podía revelar varias cartas dentro de un mismo turno después de un rechazo de sincronización.

## Causa confirmada

1. CS192 bumpea `state_revision` dentro del JSON escrito por `_elive180SetCells_`.
2. El objeto `pkg` que 99K devuelve al navegador queda con la revisión previa a esa escritura.
3. La siguiente mutación nace desde una revisión atrasada y puede recibir `state_conflict`.
4. `postLive` convertía ese rechazo de dominio en excepción y perdía el `room_package` canónico.
5. `applyCandidate` también rechazaba todo `ok:false`.
6. El componente liberaba `syncing/pairPending` al terminar la promesa y el tablero podía reabrirse.

## Alcance CS21A196

- La respuesta de DISCOVER_CARD y SUBMIT_PAIR adopta la revisión efectivamente escrita sin una segunda lectura de Sheets.
- Rechazos con `room_package` se conservan como resultados de dominio y se aplican al live state.
- `state_conflict` se reintenta una sola vez con la revisión canónica recibida.
- `busy` del adaptador se pasa al tablero y bloquea clicks durante toda la mutación/retry.
- `pairPendingRef` sólo se libera por el mismo interaction epoch.
- Un rechazo `ok:false` nunca se publica al relay compartido CS195.

## Lo que NO hace

- No agrega `attempt_id`.
- No cambia reglas de puntos/turno.
- No cambia permisos.
- No toca Hangman, Sentence Order, notas, pagos ni producción.
- No resuelve todavía TTL de salas ni avatares.
- No declara que Apps Script escale a 25; eso se medirá después.

## Gate

Antes de QA autenticada:
1. verificador acumulativo CS183→196;
2. test de coherencia de revisión;
3. browser test: conflicto R2→R3 + retry; tercera carta siempre bloqueada;
4. regresiones CS189/190/192/194/195 y Hangman;
5. paquete aislado puerto 4196.

QA autenticada:
- sala nueva, docente + Naty + Chu;
- 20 turnos;
- ninguna tercera carta;
- mismatch visible en los tres;
- match +1 y conserva turno;
- cero refrescos manuales.
