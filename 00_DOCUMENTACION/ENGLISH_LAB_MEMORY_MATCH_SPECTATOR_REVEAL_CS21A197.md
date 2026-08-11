# CS21A197 · Memory Match spectator reveal

Estado: QA candidato, no produccion.
Base: `fix/cs21a196-memory-match-conflict-reconciliation`.

## Incidente que motiva el cambio

QA autenticada CS21A196, sala `LAB-1591`, docente + Naty + Chu:

- la tercera carta ya no se puede abrir durante una pareja pendiente;
- primera y segunda seleccion son mas fluidas;
- pero el actor puede ver ambas cartas bastante antes que el observador/docente;
- el `reveal_until` del mismatch se calculaba con un `now` capturado antes de una escritura potencialmente lenta en `ELIVE_ANSWERS`, por lo que parte de los 6 s se consumia antes de publicar la pareja completa;
- la animacion visual de giro agregaba 420 ms adicionales.

## Contrato CS21A197

1. `now` se refresca despues de persistir la respuesta del intento y antes de calcular `reveal_until` / siguiente turno.
2. El mismatch dispone de **8.5 s** desde ese punto de commit.
3. `pkg.rules.spectator_reveal_ms` publica la ventana real al frontend.
4. Cuando un cliente ya conoce `FIRST_REVEALED` o `MISMATCH_REVEAL`, el adaptador usa polling transitorio a la mitad de su tier, con piso de **250 ms** y sin requests concurrentes.
5. La animacion de la carta pasa de 420 ms a **200 ms**.
6. Durante el mismatch, el timer y banner muestran la cuenta regresiva de las cartas, no la duracion completa del siguiente turno.
7. El siguiente turno sigue empezando en `reveal_until`: no se puede jugar mientras las cartas del mismatch estan visibles.

## Fuera de alcance

- attempt_id / pair_epoch;
- lifecycle/TTL de salas;
- avatares;
- cambio de puntos o reglas de match;
- migracion fuera de Apps Script;
- produccion/main.

## Criterio QA autenticado

Sala nueva, docente + Naty + Chu, sin refresh manual:

- primera carta aparece en los tres;
- al seleccionar la segunda, observador y docente reciben ambas con tiempo util para leer;
- mismatch visible en los tres y countdown de reveal coherente;
- ninguna tercera carta se habilita durante resolucion;
- al cerrarse mismatch, los tres convergen al mismo turno;
- match correcto suma +1 y conserva turno;
- Ahorcado sin regresion.
