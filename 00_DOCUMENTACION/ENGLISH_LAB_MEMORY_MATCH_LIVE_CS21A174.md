# CS21A174 · Memory Match conectado al contrato English LAB Live

## Objetivo

Preparar la conexión real de `MEMORY_MATCH` con salas `LAB-####` sin mezclar contenido pedagógico dentro del frontend ni modificar las tablas Live existentes.

Este corte queda apilado sobre CS21A173 y no se fusiona ni despliega automáticamente.

## Fuente de contenido

Google Sheet:

- archivo: `ENGLISH_LAB_GAME_DB_CS21A173`;
- propiedad de Apps Script: `ENGLISH_LAB_GAME_DB_ID`;
- hojas leídas: `QUESTION_BANK` y `ROUND_RULES`.

El backend filtra únicamente filas:

- `GAME_ID = MEMORY_MATCH`;
- `STATUS = ACTIVE`;
- nivel de la sala;
- unidad seleccionada.

No existe vocabulario dentro de `.gs`, `.js` o `.jsx`.

## Banco QA inicial

B1 / Unidad 1 contiene seis pares activos. El módulo exige al menos seis antes de permitir una sala QA.

## Endpoints nuevos

| Endpoint | Rol | Función |
|---|---|---|
| `englishLabMemoryMatchCreateRoom` | docente | crea una sala Live y la marca `MEMORY_MATCH` |
| `englishLabMemoryMatchStartRoom` | docente | compila tarjetas y tiempos desde Sheets |
| `englishLabMemoryMatchGetPlayerState` | estudiante | devuelve el `ROOM_PACKAGE` compacto |
| `englishLabMemoryMatchSubmitPair` | estudiante | valida y registra un intento de par |
| `englishLabMemoryMatchGetRoomControl` | docente | devuelve control, paquete y ranking |
| `englishLabMemoryMatchCloseRound` | docente | cierra la ronda y conserva ranking temporal |

## Persistencia

Se reutilizan las tablas actuales:

- `ENGLISH_LAB_LIVE_ROOMS`;
- `ENGLISH_LAB_LIVE_PLAYERS`;
- `ENGLISH_LAB_LIVE_ANSWERS`;
- `ENGLISH_LAB_LIVE_EVENTS`.

`CURRENT_QUESTION_JSON` almacena un solo `room_package` compacto. No copia el banco completo.

Cada intento de par se registra como JSON compacto en `ANSWER_VALUE`. Los puntos se contabilizan una sola vez por par correcto y jugador.

## Flujo temporal

1. El docente crea la sala.
2. El backend compila pares y reglas una sola vez al iniciar.
3. El paquete incluye `server_now`, `started_at` y `ends_at`.
4. Los clientes calculan el reloj con timestamps del servidor.
5. La primera consulta posterior al vencimiento cambia la ronda a `COMPLETE`.
6. El docente conserva cierre manual como respaldo.

## Adaptador frontend

Archivo:

`src/english_lab_games/english_lab_live_memory_match_adapter_cs21a174.jsx`

Responsabilidades:

- detectar exclusivamente `GAME_CODE = MEMORY_MATCH`;
- extraer `room_package` del estado Live;
- renderizar `MemoryMatchGameCS21A173`;
- enviar pares al endpoint específico;
- delegar los demás juegos al flujo Live existente.

No realiza `fetch` directo ni conoce Google Sheets.

## Instalación QA futura

El módulo Apps Script se agregará como archivo nuevo, nunca reemplazando módulos existentes:

`apps_script_patches/english_lab_memory_match_live_cs21a174.gs`

Después de guardarlo en el proyecto QA se ejecuta:

`instalarEnglishLabMemoryMatchCS21A174`

La función configura únicamente la propiedad que apunta a la base maestra QA y valida seis pares B1/U1.

## Fuera de alcance

- producción;
- notas oficiales;
- pagos, certificados o aprobación;
- Firebase o WebSocket;
- migración completa de las 640 preguntas;
- imágenes y audios definitivos;
- fusión de PRs.

## Próximo corte

Modificar la vista canónica `english_lab_live.jsx` y su carga diferida para:

1. mostrar Memory Match en el selector docente;
2. usar los endpoints CS21A174;
3. renderizar el adaptador en estudiante, docente y proyector;
4. preservar `VOCAB_SPRINT` sin cambios;
5. probar una sala real QA con dos sesiones simultáneas.
