# CS21A206 · Higiene de contratos QA de English LAB

Fecha de corte: 2026-08-11

## Estado y perímetro

- Base exacta: `CS21A205` @ `a95d5064233dd82f2e581860f87ddb4db9752bb8`.
- Rama: `chore/cs21a206-qa-contract-hygiene`.
- Alcance: pruebas, workflows y documentación únicamente.
- No modifica `src/`, `styles/`, HTML de producto, Apps Script ni backend funcional.
- Backend QA vigente: `CS21A201-CURRICULUM-SOURCE-1`.
- No crear deployment nuevo; conservar la misma URL `/exec` QA.
- `main` y producción permanecen fuera de alcance.

## Motivo

El gate canónico CS21A205 terminó en verde, pero varios workflows históricos se ejecutaron también sobre el head moderno y reportaron rojo por supuestos congelados en la arquitectura de su corte original. CS21A206 corrige los contratos de prueba donde corresponde y evita alterar el producto para satisfacer literales obsoletos.

## Hallazgo 1 · Memory Match CS189/194

`test_memory_match_classic_sync_cs21a189.mjs` exigía una frase exacta antigua del mismatch. El producto vigente conserva la dinámica clásica, pero CS197 mejoró la presentación agregando countdown visible y un reveal mayor para espectadores.

CS21A206 sustituye el assert de copy por invariantes funcionales:

- fase `FIRST_REVEALED`;
- fase `MISMATCH_REVEAL`;
- deadline `reveal_until`;
- bloqueo del siguiente turno mientras `waitingForFlipback` está activo;
- metadata `data-spectator-reveal-ms`;
- flipback y persistencia únicamente de parejas reclamadas.

No se cambia Memory Match.

## Hallazgo 2 · Quiz Time CS198

`qa_cs21a198_quiz_live_integration.mjs` exigía que la superficie compartida `english_lab_live.jsx` continuara cargándose con epoch `CS21A198`. Eso dejó de ser cierto después de integrar juegos posteriores.

CS21A206 conserva el contrato real de Quiz:

- currículo, engine, Live y gateway propios continúan en `CS21A198`;
- `quizTimeEpoch` continúa en `CS21A198`;
- existe exactamente una ruta compartida `english_lab_live.jsx`;
- el gateway de Quiz carga después de esa ruta;
- la respuesta correcta no se embebe en el cliente;
- se conservan los ocho endpoints backend esperados.

No se cambia Quiz Time.

## Hallazgo 3 · Word Search CS200

El workflow histórico de CS200 calculaba su perímetro siempre contra la rama fija CS199 R2. Cuando se ejecutaba sobre un PR posterior, el diff incluía legítimamente todos los cortes CS200→CS205 y producía un falso positivo de "reescritura histórica".

CS21A206 mantiene el guard de seguridad, pero en eventos `pull_request` calcula el alcance contra el `base.sha` real del PR actual. En el branch histórico CS200 conserva la comparación contra CS199 R2.

No se cambia Word Search.

## Hallazgo 4 · Ownership de polling Memory CS192/CS203

El modelo histórico CS192 exigía que el polling exterior estuviera apagado siempre para Memory Match. CS203 cambió correctamente esa arquitectura para resolver presencia e inicio sin F5:

- antes de `room_package`, el docente refresca el lobby/presencia cada 1000 ms;
- antes de `room_package`, el estudiante refresca el lobby cada 1200 ms;
- ambos usan guard `inFlight` para impedir solicitudes superpuestas;
- en cuanto aparece `room_package`, esos effects retornan y dejan de programar lobby polls;
- desde COUNTDOWN/LIVE el adaptador CS192 vuelve a ser dueño único del polling autoritativo.

CS21A206 actualiza el harness para exigir ese handoff explícito. El presupuesto sintético `2/5/10/15/25` se refiere únicamente a la fase activa con `room_package`, no al breve lobby previo.

No se cambia producto ni polling runtime.

## Artifact CS205 · 642 vs 643

La discrepancia de conteo quedó explicada sin cambiar el paquete:

- 643 archivos reales dentro del candidato;
- `SHA256SUMS.txt` contiene 642 entradas;
- el único archivo no incluido en el manifest es `SHA256SUMS.txt` mismo;
- 642/642 hashes verificados;
- 0 faltantes;
- 0 hashes incorrectos;
- ZIP SHA-256: `f9e4f856181e7413fa81930638cca06820cb5e88ae0109f8db19a8fea45c7190`.

Por tanto ambos conteos históricos eran compatibles y no representaban corrupción del artifact.

## Carga

La carga autenticada masiva no bloquea los siguientes cortes de código. Las pruebas con grupos grandes quedan como validación futura de capacidad cuando existan suficientes sesiones QA únicas.

Se conserva el modelo sintético `2/5/10/15/25` únicamente como guard de ingeniería de polling y concurrencia por cliente. No debe presentarse como evidencia de carga real contra Apps Script.

## Gate CS206

El workflow `CS21A206 QA Contract Hygiene` exige:

1. diff sin producto, estilos, HTML ni Apps Script;
2. invariantes Memory Match y handoff lobby→CS192;
3. currículo/backend/balance/integración de Quiz;
4. motor/backend/first-claim/integración de Word Search;
5. contrato estático del shell CS205;
6. reensamblado y sintaxis del backend CS201 sin modificarlo.

## Siguiente corte

Una vez verde CS206, la siguiente rama debe ocuparse de la limpieza visible del Campus, separada de esta higiene QA:

- una sola entrada canónica de English LAB en navegación;
- retirar/ocultar la navegación visual heredada que compite con el shell de cinco juegos;
- conservar código legacy sólo donde todavía sea necesario para compatibilidad;
- no modificar motores ni backend durante esa limpieza.

No merge / no producción hasta QA correspondiente y autorización explícita.
