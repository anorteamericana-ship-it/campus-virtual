# CS21A194 · Memory Match tolerante a latencia

## Incidente autenticado

Fecha: 2026-08-10.
Sala de evidencia: `LAB-5137`.
Participantes autenticados: docente + Chu + Naty.

CS21A193 logró la entrada real y la sincronización de tablero/turnos, pero expuso un defecto de jugabilidad: la primera tarjeta se enviaba al backend y el cliente bloqueaba el tablero hasta recibir el ACK autoritativo. Con Apps Script lento, el jugador veía la primera carta cuando quedaban pocos segundos y no alcanzaba a elegir la segunda antes del timeout.

## Causa

`memory_match_classic_sync_cs21a189.jsx` usaba un único estado `syncing` para la mutación de primera carta y la pareja completa. En modo autoritativo la primera carta no se mostraba optimista y las demás tarjetas quedaban deshabilitadas hasta terminar `DISCOVER_CARD`.

La prueba sintética CS21A192 de `FIRST_REVEALED` inyectaba el estado después de tener los tres paneles listos, por lo que no reproducía una mutación real lenta.

## Contrato CS21A194

### Frontend

- La primera tarjeta abre localmente en el jugador activo sin esperar al backend.
- La segunda tarjeta puede seleccionarse mientras `DISCOVER_CARD` sigue en vuelo.
- `SUBMIT_PAIR` queda encadenado a la promesa real de `DISCOVER_CARD`; nunca se envía antes de que el servidor acepte la primera carta.
- El servidor sigue siendo autoritativo. Un rechazo real revierte el estado local optimista.
- Respuestas tardías de un turno anterior no deben limpiar ni modificar el turno nuevo.
- La capa canónica conserva el dueño de polling CS21A192 y cambia únicamente el epoch de `memory_match_classic_sync_cs21a189.jsx` a `CS21A194`.

### Backend QA

Nueva capa append-only: `99P_MEMORY_MATCH_LATENCY_SAFE_QA_CS21A194.gs`.

- Base: `CS21A192-MM-CONSISTENCY-2`.
- Versión nueva: `CS21A194-MM-LATENCY-SAFE-1`.
- Cuando el paquete entra en `FIRST_REVEALED`, `turn_ends_at` debe ser al menos `revealed_at + 30000 ms`.
- La extensión actualiza `turn_state.turn_ends_at`, `state.ends_at` y el respaldo `active_attempt.turn_ends_at` dentro de la misma escritura protegida que persiste la primera carta.
- La extensión es idempotente: repetir la normalización no sigue regalando tiempo.
- No cambia permisos, notas, pagos, certificados, rutas ni Ahorcado.

El ensamblado histórico `99_CS21A183_SENTENCE_ORDER_COMPLETO.gs` se conserva como CS21A192. CS21A194 genera un archivo completo nuevo: `99_CS21A194_MEMORY_MATCH_LATENCY_SAFE_COMPLETO.gs`.

## Pruebas automáticas obligatorias

1. Ensamblado histórico CS21A192 sin modificaciones de contrato.
2. Ensamblado completo CS21A194 con 99P después de 99O.
3. Ejecución acumulativa real de verificadores hasta `CS21A194-MM-LATENCY-SAFE-1`.
4. Browser con ACK `DISCOVER_CARD` deliberadamente lento:
   - primera carta visible localmente en menos de 500 ms;
   - segunda carta visible localmente antes del ACK de la primera;
   - `SUBMIT_PAIR` no llega al backend antes del ACK real de `DISCOVER_CARD`;
   - ambas permanecen visibles durante las esperas de red;
   - después de la respuesta autoritativa el panel converge al estado del servidor.
5. Regresiones CS21A192: consistencia, deadline, recuperación de poll, terminal stop, clásico, timeout/style.
6. Regresión de entrada CS21A193 y Ahorcado CS21A191.

## Gate autenticado

Usar sala NUEVA con docente, Chu y Naty.

- EL194-01: docente ve exactamente 2 estudiantes antes de iniciar.
- EL194-02: los tres cargan automáticamente el mismo tablero al iniciar.
- EL194-03: primera carta del jugador activo responde visualmente de inmediato.
- EL194-04: el jugador puede escoger segunda carta sin esperar la confirmación visual/remota de la primera.
- EL194-05: los tres convergen en las mismas dos cartas, resultado, turno y reloj.
- EL194-06: tras primera carta aceptada existe una ventana autoritativa mínima de 30 segundos para completar la segunda selección.
- EL194-07: timeout produce una sola transición efectiva y no resucita intentos viejos.
- EL194-08: desktop 1440×900 y móvil 390×844 utilizables, sin blank screen, pageerror ni overflow crítico.
- EL194-09: Ahorcado y la entrada canónica CS21A193 no regresan.

## Límites

- No tocar `main` ni producción.
- No instalar 99P suelto en Apps Script.
- No reemplazar backend QA hasta que CI reconstruya y valide el archivo completo CS21A194.
- La instalación posterior, si el gate automático pasa, debe hacerse únicamente en Apps Script QA y versionando el mismo deployment QA `/exec`.
- No fusionar por un PASS sintético; falta QA autenticada.
