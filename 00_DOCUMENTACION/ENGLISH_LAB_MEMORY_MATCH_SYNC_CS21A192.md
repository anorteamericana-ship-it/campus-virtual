# English LAB Memory Match · sincronización autoritativa CS21A192

Fecha del incidente: 2026-08-08
Sala observada: `LAB-9317`
Estado: **candidato de desarrollo para QA/STAGING**
Producción y `main`: **sin cambios autorizados**

## Veredicto

La prueba autenticada de `LAB-9317` confirma un defecto funcional de sincronización, no un problema cosmético. Docente, Chu y Naty recibieron estados distintos de la misma sala: diferentes cartas abiertas, diferentes tiempos y, durante la transición, diferentes representaciones del turno.

CS21A190 resolvió la limpieza de una carta temporal dentro de una respuesta, pero no garantizó que los tres clientes consumieran la misma revisión autoritativa ni que una respuesta anterior quedara impedida de reemplazar una posterior. CS21A192 debe cerrar ese contrato.

El objetivo verificable es:

> Para una misma sala y una misma `state_revision`, docente, Chu y Naty deben renderizar exactamente el mismo turno, jugador activo, deadline, intento temporal, cartas visibles y parejas ganadas. Ningún cliente puede retroceder a una revisión anterior.

## Evidencia reproducible de `LAB-9317`

Las dos capturas aportadas corresponden a la misma sala, el mismo tablero de 6 parejas y tres paneles simultáneos:

- izquierda: Naty;
- centro: Chu en ventana incógnita;
- derecha: control docente.

### Captura 1

| Panel | Tiempo visible | Turno visible | Tablero visible |
|---|---:|---|---|
| Naty | `0s` | `Esperando turno: Chu` | una carta abierta: `teacher` |
| Chu | `0s` | `Tu turno: Chu` | dos cartas abiertas: `teacher` y `student` |
| Docente | `0s` | `Jugando ahora: Chu` | todas las cartas ocultas |

Resultado esperado: los tres paneles debían mostrar el mismo intento temporal.
Resultado observado: coexistieron tres versiones visuales incompatibles del tablero.

### Captura 2

| Panel | Tiempo visible | Turno visible | Tablero visible |
|---|---:|---|---|
| Naty | `4s` | `Tu turno: Naty` | dos cartas abiertas: `número de teléfono` y `manzana` |
| Chu | `3s` | `Esperando turno: Naty` | todas las cartas ocultas |
| Docente | no visible por desplazamiento | panel de control de la misma sala | todas las cartas ocultas |

Resultado esperado: después de confirmar el turno 2, todos debían compartir el mismo deadline y el mismo `active_attempt`.
Resultado observado: aun cuando Chu y Naty coincidían en el jugador activo, diferían en el tiempo y en las cartas abiertas; el control docente conservaba otro tablero.

### Alcance de esta evidencia

La evidencia confirma:

- divergencia entre tres clientes autenticados;
- divergencia de reloj de al menos un segundo dentro del mismo turno;
- revelado local que no coincide con el snapshot docente;
- transición de timeout que no converge de forma atómica.

La evidencia no demuestra todavía:

- comportamiento con 25 estudiantes;
- estabilidad prolongada de Apps Script;
- aptitud para producción;
- que un workflow verde reproduzca la sesión autenticada.

## Causas exactas

Las referencias de línea de este informe fueron verificadas contra los archivos actuales del candidato CS21A192. En esta tabla, los comportamientos CS21A177–190 siguen presentes como capas históricas del ensamblado, pero CS21A192 los intercepta o reemplaza en ejecución donde se indica más adelante.

| Causa | Archivo y línea | Efecto observable |
|---|---|---|
| El snapshot vivo histórico se conserva tres segundos. | `apps_script_patches/97_ACTUALIZACION_QA.gs:546`, `:750-758` | Antes de CS21A192, polls diferentes podían recibir el mismo paquete envejecido aunque el turno ya hubiera cambiado. |
| `server_now` se inserta antes de guardar el snapshot en caché. | `apps_script_patches/97_ACTUALIZACION_QA.gs:731` | La hora del servidor envejece dentro del objeto cacheado. |
| El runtime histórico calcula `offsetMs` restando la hora local de recepción a ese `server_now`. | `src/english_lab_games/english_lab_runtime_cs21a173.js:31-45`, `:81-87` | La edad del caché y la latencia de cada navegador podían convertirse en desfases distintos del cronómetro. |
| La vista estudiantil conserva un polling general cada cuatro segundos para otros juegos. | `src/english_lab_live.jsx:577-579` | Antes de la exclusión Memory Match de la línea `577`, un productor externo al juego podía competir por el mismo estado. |
| El adaptador clásico conserva otro polling, desde 550 ms. | `src/english_lab_games/english_lab_live_memory_match_classic_sync_adapter_cs21a189.jsx:74-112` | Antes del adaptador CS21A192, el ciclo clásico podía competir con el polling exterior. |
| El guard cliente histórico conserva lecturas durante 750 ms. | `src/english_lab_games/english_lab_live_sync_guard_cs21a177.js:10`, `:219-243` | Una lectura podía resolverse desde una copia reciente pero ya superada. CS21A192 invalida ese caché antes de cada poll y mutación. |
| El polling usa `setInterval`. | `src/english_lab_games/english_lab_live_memory_match_classic_sync_adapter_cs21a189.jsx:105` | La frecuencia se programa sin convertir la finalización de la lectura anterior en el origen de la siguiente. |
| El adaptador clásico no ordena respuestas por revisión. | `src/english_lab_games/english_lab_live_memory_match_classic_sync_adapter_cs21a189.jsx:80-96` | Una respuesta iniciada antes podía terminar después y reemplazar un estado más nuevo. |
| La UI CS21A189 conserva un estado `optimistic` de cartas. | `src/english_lab_games/memory_match_classic_sync_cs21a189.jsx:217-236`; puntos de selección `:256-297` | Sin `authoritativeOnly`, el jugador que hace clic puede ver una carta antes que docente y observador. CS21A192 pasa `authoritativeOnly={true}` en `src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx:372-382`. |
| Si no obtiene `ScriptLock`, el backend histórico devuelve la fila encontrada antes del lock. | `apps_script_patches/97_ACTUALIZACION_QA.gs:766-776` | Un cliente puede recibir deliberadamente un turno vencido. |
| CS21A190 avanza el turno y limpia el reveal mediante un segundo lock. | `apps_script_patches/99L_FIX_MEMORY_MATCH_TIMEOUT_CLEANUP_QA_CS21A190.gs:32-64`, especialmente `:39-40` | El turno nuevo y la limpieza no forman una sola transacción; si el segundo lock falla se devuelve el estado intermedio. |
| La sanitización defensiva CS21A190 puede limpiar solamente la copia de respuesta. | `apps_script_patches/99L_FIX_MEMORY_MATCH_TIMEOUT_CLEANUP_QA_CS21A190.gs:19-29`, `:69-80` | Dos endpoints podían producir respuestas distintas sin una única revisión persistida que las ordenara. |

Estas causas son acumulativas. Reducir el intervalo, quitar un spinner o agregar otro `refresh` no resuelve la carrera.

## Contrato autoritativo CS21A192

### Una revisión monotónica

El paquete Memory Match publica `state_revision` tanto en `room_package` como en `shared_state`.

La revisión aumenta dentro de la misma escritura de `CURRENT_QUESTION_JSON` cuando cambia cualquier elemento visible o decisorio:

- inicio o fase de la ronda;
- jugador o equipo activo;
- deadline;
- primera carta revelada;
- segunda carta y fase mismatch;
- pareja ganada;
- limpieza del intento temporal;
- timeout;
- cierre o finalización.

La capa interna candidata implementa este incremento en:

- cálculo y actualización de revisión en `apps_script_patches/99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192.gs:35-42`, `:85-97`;
- wrapper de escritura `_elive180SetCells_` en las líneas `101-119`.

`board_version` sigue describiendo cambios del tablero, y `turn_number` sigue describiendo turnos. Ninguno sustituye por sí solo a `state_revision`, que ordena el snapshot completo.

### Timeout y limpieza en una sola transición

`_cs21a192AdvanceAndNormalize_` realiza:

1. comprobación rápida de transición vencida;
2. adquisición de `LockService.getScriptLock()`;
3. refetch de la sala dentro del lock;
4. nueva comprobación con la fila fresca;
5. avance del turno vencido;
6. limpieza del `active_attempt` incompatible o expirado;
7. incremento de `board_version` cuando corresponde;
8. una única escritura revisionada;
9. invalidación del caché;
10. liberación del lock;
11. bitácora fuera de la sección crítica.

Después de anexar los eventos de timeout/limpieza se invalida otra vez la
misma revisión cacheada. Así, un poll que se haya intercalado entre la escritura
del estado y la bitácora no conserva durante el TTL un panel de eventos anterior.

Ubicación candidata: `apps_script_patches/99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192.gs:153-254`.

Si el lock no se obtiene, el endpoint devuelve `state_transition_busy` y `retry_after_ms`. No devuelve como válido el row vencido. El reemplazo del helper histórico está en las líneas `258-267`.

### Snapshot canónico común

Docente y estudiantes pasan por `_cs21a192CanonicalSnapshot_`:

- control docente: líneas `380-402`;
- estado estudiante: líneas `404-437`;
- constructor canónico: líneas `341-365`.

El caché deja de usar una clave constante por sala y usa `sala + state_revision`. Una lectura antigua solo puede completar la clave de su propia revisión; no puede contaminar una revisión posterior.

`server_now`, `server_now_ms`, `turn_remaining_ms` y `turn_starts_in_ms` se componen después de recuperar la parte cacheada, mediante `_cs21a192FreshEnvelope_` en las líneas `312-337`. Por eso la hora ya no envejece dentro del caché.

`CacheService` es únicamente una optimización. La fuente de verdad sigue siendo la fila persistida y revisionada.

### Precondiciones de cada jugada dentro del lock

Cada acción CS21A192 envía `expected_state_revision` y `expected_turn_number` (`src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx:325-344`). El submit real de `apps_script_patches/99K_MEMORY_MATCH_CLASSIC_SYNC_QA_CS21A189.gs:91-118` comprueba ambos valores después de releer la sala y **dentro del mismo `ScriptLock` que protege la jugada**, antes de normalizar `shared_state`, abrir cartas, sumar puntos o cambiar turno.

La validación acumulativa vive en `_cs21a192ExpectedStateConflict_` de `99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192.gs:58-83`. Si cualquiera de las dos precondiciones ya no coincide, responde:

- `ok:false` y `error:"state_conflict"`;
- `actual_state_revision` y `actual_turn_number`;
- `expected_state_revision` y `expected_turn_number` recibidos;
- `room_package`, `turn_state` y `shared_state` canónicos actuales.

Ese retorno ocurre sin escribir celdas, respuestas, puntos ni bitácora. El backend sí incluye el paquete actual en el JSON de conflicto. Sin embargo, **el cliente actual no mezcla directamente ese paquete**: `postLive` convierte cualquier `ok:false` en error (`src/english_lab_live.jsx:66-84`), el adaptador despierta inmediatamente el polling desde su `catch` (`src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx:325-353`) y adopta la siguiente lectura canónica exitosa. Si CS21A192 no está instalado, el hook de 99K es un no-op por `typeof`, por lo que los paquetes históricos conservan su comportamiento.

### Reglas de aceptación en el cliente

El consumidor CS21A192 aplica estas reglas en `src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx`:

1. una sala nueva reinicia sus contadores locales (`:228-240`);
2. cada respuesta se ordena por la tupla `state_revision`, terminalidad, `turn_number` y `board_version` (`:80-105`);
3. una tupla menor se descarta; en empate también se descartan una secuencia de petición anterior o un `server_now` anterior (`:206-225`);
4. un poll iniciado antes de una mutación no puede reemplazar el resultado posterior (`:206-216`);
5. el polling exterior histórico queda apagado para Memory Match (`src/english_lab_live.jsx:577-579`) y el adaptador mantiene un único dueño recursivo por vista (`:248-319`);
6. la siguiente lectura se agenda en `finally`, después de resolver, fallar o agotar el timeout de la anterior (`:263-302`);
7. al llegar a `0s`, la UI bloquea el tablero y muestra `Sincronizando turno`; no adelanta el turno localmente (`src/english_lab_games/memory_match_classic_sync_cs21a189.jsx:205-215`, `:309-310`);
8. las cartas se pintan desde el snapshot autoritativo porque el adaptador pasa `authoritativeOnly={true}` (`:372-382`);
9. al volver de una pestaña oculta se despierta una lectura inmediata (`:304-318`);
10. `state_transition_busy`, `state_conflict` y cualquier otro `ok:false` no se mezclan como estado; provocan error de la mutación/lectura y una nueva consulta canónica;
11. un fallo de polling es silencioso para la vista y usa backoff acotado (`:51-56`, `:290-301`).

La evolución del reloj visible entre snapshots usa `performance.now()` y una estimación acotada de retorno `RTT/2` (`:132-160`), en vez de depender de cambios posteriores del reloj civil local.

### Ventana autoritativa de mismatch

La ventana histórica de 2,200 ms era menor que la latencia asimétrica de 2,500 ms observada y probada. Aun con revisiones correctas, un panel lento podía recibir el snapshot después de `reveal_until` y no mostrar nunca las dos cartas; ese patrón coincide con la evidencia de `LAB-9317`.

CS21A192 fija la ventana en **6,000 ms** en `apps_script_patches/99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192.gs:8-21`, calculados explícitamente como:

- peor intervalo de polling soportado para 25 participantes: 2,200 ms;
- latencia asimétrica probada: 2,500 ms;
- margen de entrega y render: 1,300 ms.

El tradeoff es deliberado: un mismatch permanece visible 3.8 segundos más que en CS21A189. A cambio, la prueba sintética de tres contextos con latencias 0/800/2,500 ms confirma que los tres alcanzan a compartir el reveal antes del flipback (`scripts/test_memory_match_authoritative_sync_browser_cs21a192.mjs:15`, `:38`, `:165-176`). El deadline `reveal_until` es único y absoluto; el cliente solo deriva el tiempo visible desde ese valor. Esta evidencia de navegador local todavía no equivale a QA autenticada contra Apps Script.

### No se requieren WebSockets

Apps Script Web Apps expone un contrato request/response mediante `doGet`/`doPost`. Para esta escala, un polling no superpuesto, revisionado y adaptativo es suficiente. CS21A192 no introduce un servidor adicional ni cambia la arquitectura de producción.

## Fuentes oficiales aplicadas

- [Google Apps Script · LockService](https://developers.google.com/apps-script/reference/lock/lock-service): `getScriptLock()` impide que dos ejecuciones modifiquen simultáneamente un recurso compartido.
- [Google Apps Script · Lock](https://developers.google.com/apps-script/reference/lock/lock): adquisición, espera, liberación y prevención de colisiones.
- [Google Apps Script · CacheService](https://developers.google.com/apps-script/reference/cache/cache-service): caché temporal; el script cache es común a todos los usuarios y no garantiza persistencia hasta el vencimiento.
- [Google Apps Script · Cache](https://developers.google.com/apps-script/reference/cache/cache): la expiración es una sugerencia y los datos pueden ser expulsados antes.
- [Google Apps Script · Best practices](https://developers.google.com/apps-script/guides/support/best-practices): minimizar llamadas externas y agrupar lecturas/escrituras.
- [Google Apps Script · Quotas](https://developers.google.com/apps-script/guides/services/quotas): 30 ejecuciones simultáneas por usuario y 1,000 por script; la prueba progresiva sigue siendo obligatoria.
- [Google Apps Script · Web Apps](https://developers.google.com/apps-script/guides/web): modelo request/response de `doGet` y `doPost`.
- [React · useEffect](https://react.dev/reference/react/useEffect): las respuestas de red pueden llegar en un orden distinto al de envío y deben ignorarse las obsoletas.
- [MDN · setInterval](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval): para polling remoto recomienda `setTimeout` recursivo cuando la ejecución puede superar el intervalo.
- [MDN · AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController): permite cancelar lecturas que ya no deben modificar la vista.
- [MDN · High precision timing](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/High_precision_timing): `performance.now()` es monotónico y no está sujeto a ajustes del reloj civil.
- [RFC 4330 · SNTPv4](https://www.rfc-editor.org/info/rfc4330/): referencia para estimar offset y latencia con marcas T1–T4 cuando se necesite medir el reloj entre cliente y servidor.

## Límites del candidato

CS21A192 significa **candidato QA**, no liberación.

- No autoriza cambios en producción.
- No autoriza merge a `main`.
- No autoriza reemplazar `Code.gs` ni otro archivo productivo.
- El archivo `99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192.gs` es una capa interna de ensamblado; el usuario no debe pegarla por separado.
- Un verificador `ok:true` comprueba contratos sintéticos, no tres navegadores autenticados.
- CI verde comprueba sintaxis, contratos, pruebas sintéticas y paquete; no demuestra que la Web App QA esté desplegada con esa versión.
- Una ejecución exitosa en Apps Script no demuestra que el frontend esté conectado al deployment actualizado.
- La prueba de tres paneles no sustituye la carga progresiva 2 → 5 → 10 → 15 → 25.
- Un PASS en Individual no sustituye Teams.
- No se debe reutilizar `LAB-9317`; su historial pertenece al backend anterior.

## Instalación correcta en Apps Script QA

### Archivo permitido

Pegar únicamente el archivo completo ensamblado:

`apps_script_patches/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs`

No pegar ni concatenar manualmente:

- `99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192.gs`;
- fragmentos CS21A190;
- bloques individuales;
- una copia parcial obtenida de un diff.

### Procedimiento

1. Confirmar que se está en el proyecto Apps Script QA/STAGING y no en producción.
2. Confirmar que siguen configuradas `QA_STAGING_MASTER_ID` y `QA_STAGING_OPERATIVO_ID`.
3. Abrir el único archivo temporal completo `99_CS21A183_SENTENCE_ORDER_COMPLETO.gs` del proyecto QA.
4. Seleccionar todo su contenido con `Ctrl+A`.
5. Borrar todo.
6. Copiar desde el candidato CS21A192 el archivo completo del mismo nombre.
7. Pegar una sola vez y guardar.
8. No modificar `97_ACTUALIZACION_QA.gs`, `98_ACTUALIZACION_QA_CS21A181.gs` ni producción durante esta instalación.
9. Ejecutar `verificarMemoryMatchStartFixCS21A183()`.
10. Conservar el registro completo, desde `Se inició la ejecución` hasta `Se completó la ejecución`.
11. Solo si el último bloque es CS21A192 y todos los bloques son `ok:true`, editar la implementación Web App QA existente.
12. Elegir una nueva versión de esa misma implementación; conservar exactamente la misma URL `/exec`.
13. No crear otro deployment y no tocar el deployment productivo.
14. Extraer el frontend candidato CS21A192 en una carpeta nueva; no mezclarlo con CS21A190/191.
15. Conectar el frontend candidato a la misma URL `/exec` QA.
16. Crear una sala nueva para la prueba; no restaurar `LAB-9317`.

### Último bloque esperado del verificador

El último JSON debe contener, como mínimo:

```json
{
  "ok": true,
  "version": "CS21A192-MM-CONSISTENCY-1",
  "atomic_timeout_cleanup": true,
  "one_state_write_per_timeout": true,
  "stale_snapshot_resurrection_blocked": true,
  "revision_keyed_snapshot": true,
  "monotonic_state_revision": true,
  "fresh_server_now_outside_cache": true,
  "lock_failure_returns_retry": true,
  "teacher_student_same_snapshot_path": true,
  "expected_state_revision_guard": true,
  "expected_turn_number_guard": true,
  "preconditions_checked_under_submit_lock": true,
  "stale_action_rejected_without_mutation": true,
  "state_conflict_returns_current_package": true,
  "timeout_event_cache_invalidated": true,
  "mismatch_reveal_ms": 6000,
  "mismatch_reveal_budget": {
    "max_poll_ms": 2200,
    "tested_latency_ms": 2500,
    "margin_ms": 1300
  },
  "hangman_router_untouched": true
}
```

Si el último bloque sigue siendo CS21A190, CS21A191 o no contiene estos campos, la instalación CS21A192 no está completa y no debe desplegarse.

## Matriz obligatoria de pruebas

Todas las pruebas usan una sala nueva, B1/U01, 6 parejas, Chu, Naty y control docente. Cada muestra debe registrar:

`state_revision`, `turn_number`, `active_player_id`, `turn_ends_at`, `turn_remaining_ms`, `board_version`, `active_attempt`, `matched_pair_ids` y resultado visible de los tres paneles.

| ID | Escenario | Ejecución | PASS obligatorio |
|---|---|---|---|
| MM192-01 | Tres paneles, red normal | Abrir docente, Chu y Naty; iniciar; observar diez polls. | Revisiones no decrecen; al estabilizar cada revisión, los tres coinciden en turno, jugador, deadline y tablero. |
| MM192-02 | Latencia asimétrica | Aplicar 0 ms al docente, 800 ms a Chu y 2,500 ms a Naty; repetir invirtiendo los perfiles. | Ninguna respuesta lenta resucita una revisión anterior; diferencia del cronómetro después de converger: máximo 1 s. |
| MM192-03 | Respuestas fuera de orden | Retener una respuesta N, aplicar N+1 y luego liberar N. | N se descarta; no cambian turno, cartas ni deadline. |
| MM192-04 | Timeout sin carta | No seleccionar ninguna carta y dejar vencer el turno. | Los tres muestran `Sincronizando turno`, luego una sola revisión nueva y un solo avance al jugador siguiente. |
| MM192-05 | Timeout con primera carta | Abrir una carta con pocos segundos restantes y no elegir la segunda. | Cada cliente oculta `FIRST_REVEALED` al alcanzar el `turn_ends_at` autoritativo, bloquea el tablero y luego adopta la única transición persistida por el backend. |
| MM192-06 | Mismatch cerca del deadline | Abrir dos cartas incorrectas con latencias 0/800/2,500 ms cuando queda poco tiempo. | Los tres muestran simultáneamente ambos reveals dentro de la ventana común de 6,000 ms; luego se cierran y convergen al mismo turno; no existe doble avance por mismatch más timeout. |
| MM192-07 | Pareja correcta | Formar una pareja válida. | La pareja queda visible y ganada en los tres; suma 1 punto; conserva jugador y recibe deadline fresco. |
| MM192-08 | Doble clic/reintento y acción vieja | Repetir la misma acción, liberar respuestas en orden inverso y enviar una jugada con revisión/turno anterior. | La acción válida se aplica una sola vez; el backend rechaza la vieja con `state_conflict` y paquete actual, no muta la sala, y el cliente reconsulta antes de continuar. |
| MM192-09 | Contención de lock | Lanzar lectura docente, dos lecturas estudiante y acción al cruzar el deadline. | Una ejecución persiste la transición; las demás reciben estado nuevo o `state_transition_busy`; ninguna recibe el row vencido como autoritativo. |
| MM192-10 | Pestaña oculta/reanudada | Ocultar Chu durante dos turnos y volver. | Chu solicita estado inmediato y converge sin mostrar turnos o cartas intermedias antiguas. |
| MM192-11 | Recarga y reconexión | Recargar Naty durante primera carta, mismatch y turno nuevo. | Cada recarga adopta la última revisión persistida; no crea otro jugador ni otro turno. |
| MM192-12 | Móvil | Repetir timeout con primera carta a 390 × 844 y objetivo táctil real. | Mismo estado que escritorio, sin controles inaccesibles ni tablero desbordado. |
| MM192-13 | Equipos | Repetir timeout, mismatch y pareja correcta en Teams. | Coinciden equipo/jugador activo; correcta conserva equipo, incorrecta/timeout rota una vez. |
| MM192-14 | Cierre terminal | Probar por separado sala `CLOSED`, ronda `CLOSED`, fase `COMPLETE` y `shared.completed=true` durante polling activo. | Al aplicar cualquiera de los cuatro contratos terminales, esa vista no programa otra lectura; si ya existía un callback pendiente, este termina antes de emitir la petición. |
| MM192-15 | Regresión Ahorcado | Ejecutar verificadores y smoke CS21A191. | Router, endpoints y estado público de Ahorcado permanecen intactos. |

### Contratos de liveness agregados al candidato

- `FIRST_REVEALED` se contrasta contra `turn_ends_at` mediante el reloj autoritativo (`src/english_lab_games/memory_match_classic_sync_cs21a189.jsx:80-96`). Si un snapshot todavía contiene la primera carta al cruzar el deadline, cada panel la oculta localmente y bloquea la jugada; no incrementa `state_revision` ni simula el turno siguiente. El navegador sintético exige que las tres vistas la oculten como máximo un segundo después del deadline (`scripts/test_memory_match_first_reveal_deadline_browser_cs21a192.mjs:39-48`).
- Cada lectura de estado tiene límite de **8,000 ms** (`src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx:12`, `:57-69`, `:279-283`). `postLive` recibe ese mismo límite y usa `AbortController` cuando está disponible (`src/english_lab_live.jsx:66-84`). El fallo de polling no muestra alerta, incrementa backoff hasta un máximo de 8,000 ms y vuelve a consultar; las mutaciones conservan 45,000 ms (mismo adaptador `:13-14`, `:51-56`, `:290-301`, `:325-353`).
- El polling recursivo deja de programar lecturas cuando el estado aplicado indica sala `CLOSED`, ronda `CLOSED`, fase `COMPLETE` o `shared.completed=true`; un callback que ya estuviera pendiente comprueba terminalidad antes de solicitar (`src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx:32-45`, `:258-319`). La prueba sintética verifica exactamente una lectura inicial y cero polls posteriores para cada contrato (`scripts/test_memory_match_terminal_poll_stop_browser_cs21a192.mjs:10-35`).
- Una respuesta tardía no desplaza una tupla de revisión superior. La prueba de recuperación retiene la revisión 1, deja vencer el límite de 8 segundos, adopta la revisión 2 y después libera la 1; la vista permanece en revisión 2 (`scripts/test_memory_match_poll_recovery_browser_cs21a192.mjs:15-49`).
- Estas son pruebas locales de navegador ejecutadas por CI. Validan liveness y ordenamiento del candidato, pero no prueban sesiones autenticadas ni la latencia/capacidad real de Apps Script QA.

### Presupuesto determinista antes de carga autenticada

El harness `scripts/english_lab_memory_match_load_harness_cs21a192.mjs:10-35` es un **modelo aritmético y estático**, no una prueba de carga contra Apps Script. Modela 2/5/10/15/25 estudiantes más una vista docente durante 60 segundos, con latencia de red cero, y combina ese cálculo con comprobaciones de texto del adaptador (`:38-59`): polling recursivo, guard `inFlight`, caché reciente invalidado y polling exterior apagado.

No abre sesiones, no autentica usuarios, no llama la Web App QA y no mide CPU, locks, cuotas ni latencia del backend. `maxConcurrentPollsPerClient:1` es un contrato del modelo respaldado por la estructura del cliente; no es una medición de concurrencia real del servidor.

| Estudiantes | Poll | Solicitudes/minuto maximas | Solicitudes/segundo |
|---:|---:|---:|---:|
| 2 | 550 ms | 330 | 5.50 |
| 5 | 550 ms | 660 | 11.00 |
| 10 | 900 ms | 737 | 12.28 |
| 15 | 1,400 ms | 688 | 11.47 |
| 25 | 2,200 ms | 728 | 12.13 |

El máximo calculado es 12.28 solicitudes/segundo y queda por debajo del umbral interno del modelo de 20 solicitudes/segundo (`:11`, `:55-66`). Ese umbral **no es una capacidad garantizada de Apps Script**. El resultado solo valida el presupuesto sintético del cliente bajo sus supuestos; la progresión autenticada **2 → 5 → 10 → 15 → 25** sigue pendiente y solo debe ejecutarse después del PASS funcional de tres paneles.

## Criterios PASS

### PASS técnico del candidato

Requiere simultáneamente:

- ensamblado exacto del archivo completo 99;
- sintaxis Apps Script/V8 aprobada;
- último verificador `CS21A192-MM-CONSISTENCY-1` con todos los flags esperados;
- pruebas unitarias, de contrato y navegador CS21A192 aprobadas;
- regresiones acumuladas CS21A176–191 aprobadas;
- artefacto construido y verificado por manifiesto;
- workflow CI específico verde.

Este resultado se reporta como **CI aprobado; QA autenticada pendiente**.

### PASS funcional en QA autenticada

Requiere simultáneamente:

- deployment QA actualizado y misma URL `/exec`;
- matriz MM192-01 a MM192-15 completada sin FAIL;
- cero regresiones de `state_revision` por cliente;
- igualdad de turno, jugador activo, deadline, `active_attempt`, cartas visibles y parejas ganadas entre docente, Chu y Naty para cada revisión estable;
- diferencia visible de cronómetro máxima de 1 segundo después de la convergencia;
- exactamente un avance por timeout o mismatch;
- cero cartas temporales sobrevivientes al cambio de turno;
- cero respuestas viejas aplicadas después de una revisión mayor;
- toda jugada con revisión o turno esperado vencido responde `state_conflict` con el paquete canónico actual y cero mutaciones;
- contención de lock resuelta mediante retry, nunca mediante snapshot vencido;
- tablero exclusivamente autoritativo durante la aceptación;
- evidencia guardada: registro Apps Script, versiones, métricas/revisiones y capturas de los tres paneles.

Solo después puede declararse **PASS funcional QA de tres paneles**. Aun así, no autoriza producción ni merge automático.

### FAIL

Cualquiera de estos resultados es FAIL:

- un panel muestra cartas diferentes para la misma revisión;
- un cliente baja de revisión;
- el cronómetro difiere más de 1 segundo una vez convergido;
- un timeout avanza dos veces;
- una carta sobrevive al cambio de turno;
- una jugada con `expected_state_revision` o `expected_turn_number` viejo modifica cualquier estado;
- el docente recibe un tablero distinto al de los estudiantes;
- `state_transition_busy` deja el panel permanentemente bloqueado;
- la sala cerrada vuelve a estado activo;
- el último verificador no es CS21A192.

## Secuencia posterior

1. Completar CI del candidato.
2. Instalar únicamente en QA con el archivo completo 99.
3. Ejecutar el verificador acumulado.
4. Actualizar la misma Web App QA.
5. Ejecutar la matriz con docente, Chu y Naty.
6. Corregir cualquier FAIL en otra rama pequeña.
7. Después del PASS de tres paneles, ejecutar carga progresiva 2 → 5 → 10 → 15 → 25.
8. Mantener producción y `main` sin cambios hasta revisión humana explícita.
