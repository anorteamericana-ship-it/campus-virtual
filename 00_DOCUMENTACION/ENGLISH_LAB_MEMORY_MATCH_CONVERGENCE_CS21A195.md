# CS21A195 · Memory Match convergence relay

## Evidencia autenticada que origina el cambio

Sala QA CS21A194 `LAB-3103`, docente + Chu + Naty, 2026-08-10.

CS21A194 mejoró la interacción local: el jugador activo puede abrir primera y segunda carta sin esperar el ACK de la primera. Sin embargo las capturas reales mostraron divergencia temporal entre paneles:

- el jugador activo ya mostraba dos cartas y `Sincronizando pareja…`;
- el segundo estudiante todavía mostraba el tablero anterior;
- posteriormente el segundo estudiante recibió las dos cartas mientras el jugador activo ya había avanzado;
- el docente permaneció en el turno anterior con `Sincronizando cambio / Esperando servidor`.

## Causa

El cliente CS21A192 protege contra revisiones que ya sabe que son antiguas, pero no puede detectar por sí solo una lectura que comenzó antes de una mutación y termina después de ella si todavía no conoce la revisión nueva.

Además, cada lectura canónica puede tocar Sheets, presencia, snapshot y bitácora. Bajo latencia real una lectura iniciada antes de una jugada puede tardar suficiente para obligar al navegador a esperar otro ciclo completo.

## Corrección

Nueva capa backend QA `99Q_MEMORY_MATCH_CONVERGENCE_RELAY_QA_CS21A195.gs`.

Contrato: `CS21A195-MM-CONVERGENCE-RELAY-1`.

1. Cada escritura revisionada Memory Match publica inmediatamente en `CacheService` un relay pequeño con `room_package`, `turn_state`, `shared_state` y revisión.
2. El relay nunca puede bajar de revisión.
3. Si una lectura canónica lenta termina con una revisión menor que el relay, antes de responder se superpone el paquete más nuevo sin otra lectura de Sheets.
4. `GetPlayerState` y `GetRoomControl` usan el relay como fast-path mientras el estado no requiera una transición automática.
5. Cada 30 s se permite una lectura completa para refrescar presencia, ranking y metadatos.
6. Si el deadline expiró, el fast-path se desactiva y la ruta canónica CS21A192 realiza el avance de turno bajo lock.
7. Permisos docente y acceso estudiantil se validan antes de responder por relay.
8. Ahorcado, notas, pagos, producción y rutas ajenas a Memory Match no cambian.

## Criterio autenticado

En una sala nueva con docente + Chu + Naty:

- primera y segunda carta siguen siendo inmediatas para el jugador activo;
- los otros dos paneles deben recibir la misma revisión sin quedarse un ciclo completo atrás;
- durante mismatch los tres deben mostrar las mismas dos cartas antes del flip-back;
- tras el flip-back los tres deben converger al mismo turno y jugador;
- ningún panel debe permanecer en `Esperando servidor` cuando otro ya está en el turno siguiente;
- timeout automático continúa produciendo una única transición.

CS21A195 sigue siendo candidato QA. No fusionar ni promover a producción sin PASS autenticado.
