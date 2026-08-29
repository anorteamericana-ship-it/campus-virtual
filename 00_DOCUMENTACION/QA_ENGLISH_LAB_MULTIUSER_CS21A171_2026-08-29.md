# CS21A171 · English LAB LIVE v2 · E2 multiusuario · 2026-08-29

## Objetivo

Convertir el gate manual pendiente de PR #121 en una prueba repetible y fail-closed con **1 docente QA + 1 estudiante QA** sobre el deployment English LAB QA, sin tocar PROD.

Este corte parte de `#121@c09328886287903fbad0833b59b52d4934d8e67c`. No modifica el candidato original, Apps Script, tablas, contenido curricular ni shell productivo; agrega únicamente infraestructura QA.

La compatibilidad de #121 con el `main` actual ya fue demostrada separadamente por CS21A167. Por eso este harness se mantiene apilado sobre #121 para que su diff sea exclusivamente QA.

## Contrato de transporte confirmado

El shell vigente usa:

- `api_version: english_lab_live.v2`;
- POST `text/plain;charset=utf-8` directo al URL Apps Script;
- `token` Campus en el body;
- `request_id` para toda acción mutante;
- `room_id`, `room_code`, `round_id`, `client_seen_revision` cuando corresponden;
- `payload` para datos de acción.

El runtime v2 elimina únicamente `token/session_token`, autentica el token con el AuthAdapter Campus y deriva actor/rol/capabilities exclusivamente del servidor.

## Por qué Sentence Order primero

Sentence Order permite probar la cadena completa sin conocer ni extraer la respuesta correcta:

1. el backend publica tokens visibles en orden mezclado;
2. si por casualidad ese orden coincidiera con la solución, el plugin lo rota explícitamente;
3. el harness envía ese orden visible como respuesta válida pero incorrecta;
4. antes de `REVEAL` no deben existir `answer_sentence`, `answer_token_ids`, `viewer_result` ni estado privado;
5. tras `REVEAL` debe aparecer el resultado propio con `is_correct=false`, `points_awarded=0` y ranking persistido.

Esto comprueba scoring/ranking y privacidad sin leer secretos de contenido.

## Flujo E2 exacto

1. comprobar que la URL QA no coincide con `APPS_SCRIPT_URL` productiva;
2. `getInfoGeneral` debe demostrar `QA_STAGING_CS21A138`, `qa_staging`, `master_match`, `operational_match` y `writes_guarded`;
3. login real de docente, rol devuelto `teacher`;
4. login real de estudiante, rol devuelto `student`;
5. docente crea sala en el grupo QA canónico;
6. participante inicial debe ser 0;
7. estudiante ejecuta `joinRoom` por código;
8. docente y estudiante deben ver `participant_count=1` y la misma `state_revision`;
9. docente inicia sala;
10. docente prepara `SENTENCE_ORDER` con contenido `APOLLO_PLAY_V1:<nivel>:<nivel>-U<unidad>:SENTENCE_ORDER`;
11. docente abre ronda por 120 segundos;
12. estudiante ve ronda OPEN sin respuestas privadas;
13. estudiante envía el orden visible de tokens;
14. el mismo `request_id` se reenvía y debe responder `replayed=true` sin duplicar intento;
15. antes de reveal, estudiante mantiene `has_submitted=true`, `response_count=1` y ninguna respuesta/corrección privada;
16. docente bloquea ronda;
17. docente revela ronda;
18. estudiante debe recibir respuesta, resultado propio, 0 puntos para este intento incorrecto y ranking `rank=1`;
19. docente y estudiante deben conservar la misma revisión;
20. docente cierra ronda;
21. docente cierra sala;
22. ambos actores deben ver sala CLOSED y el participante debe persistir.

## Limpieza ante fallo

Si el flujo falla después de crear la sala, el runner intenta obtener el estado controlador actual y ejecutar `closeRoom` con `QA_CS21A171_CLEANUP`.

La limpieza es best-effort: si también falla, el reporte conserva el hallazgo y el run queda bloqueado.

## Identidades QA reutilizadas

CS21A171 **no crea un segundo juego de secretos**. El workflow mapea los secretos canónicos ya definidos por `Real QA Staging CS21A138`:

- `QA_STAGING_APPS_SCRIPT_URL` → URL English LAB QA;
- `QA_TEACHER_USER` / `QA_TEACHER_PASS` → docente QA;
- `QA_STUDENT_USER` / `QA_STUDENT_PASS` → estudiante QA;
- `QA_GROUP_CODE` → grupo QA.

Dentro del runner se proyectan a nombres `QA_LAB_*` únicamente para mantener aislado el contrato del harness.

La confirmación `CS21A171_STAGING_ONLY` no es una credencial: el workflow la genera únicamente dentro del job E2 después de que el evento ya cumplió una de las condiciones explícitas de ejecución.

No se deben reutilizar credenciales productivas.

## Ejecución segura mientras el workflow no está en main

GitHub `workflow_dispatch` de un workflow nuevo depende de su presencia en la rama por defecto. Como este corte **no se va a mergear solo para poder probarlo**, se conserva una vía de ejecución controlada en la rama:

- el job contractual corre en pushes normales;
- el job E2 **no** corre por pull request;
- el job E2 por push solo corre si el mensaje del commit contiene exactamente `[RUN_ELV2_E2_CS21A171]`;
- aun con ese marcador, faltando cualquier secreto canónico el job aborta antes de tocar el LAB;
- el runner vuelve a bloquear si la URL coincide con PROD o si el backend no demuestra el marcador staging y `writes_guarded=true`.

Si en el futuro el workflow existe en `main`, también podrá ejecutarse por `workflow_dispatch` con `authenticated=true`.

## Evidencia que este corte puede cerrar

Con un PASS real:

- join autenticado de estudiante;
- participant_count real;
- sincronización de revisión docente/estudiante;
- submitAttempt persistente;
- idempotencia de submit;
- anti-leak antes de reveal;
- score propio al reveal;
- leaderboard/rank;
- cierre y persistencia final.

## Lo que seguirá pendiente después del primer PASS

- repetir E2 a ~390 px en navegador real docente/estudiante;
- extender runtime E2 a Hangman, Quiz Time y Word Search si queremos una evidencia multiusuario por cada plugin;
- carga 15/20/25 estudiantes continúa `DEFERRED_NON_BLOCKING` según #121;
- Memory Match continúa `FROZEN_DEFERRED_NON_BLOCKING`;
- PROD sigue fuera de alcance.

## Estado

**QA INFRASTRUCTURE · FAIL-CLOSED · NO PROD · E2 SOLO POR TRIGGER EXPLÍCITO.**

No autoriza merge de #121, publicación frontend ni nuevo deployment Apps Script.
