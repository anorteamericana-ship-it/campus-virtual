# CS21A174 · Memory Match conectado a English LAB Live

## Objetivo

Conectar `MEMORY_MATCH` con salas reales `LAB-####` sin mezclar contenido pedagógico dentro del frontend ni modificar las tablas Live existentes.

Este corte queda apilado sobre CS21A173 y no se fusiona ni despliega automáticamente.

## Fuente de contenido

Google Sheet:

- archivo: `ENGLISH_LAB_GAME_DB_CS21A173`;
- ID QA: `1MhPACxXkx3C9D9VvXcor8UUsGOGfBzCOI8rQf3jl8Mc`;
- propiedad de Apps Script: `ENGLISH_LAB_GAME_DB_ID`;
- hojas leídas: `QUESTION_BANK` y `ROUND_RULES`.

El backend filtra únicamente filas `MEMORY_MATCH`, `ACTIVE`, del nivel y unidad de la sala. No existe vocabulario dentro de `.gs`, `.js` o `.jsx`.

## Integración frontend

- Memory Match aparece en el selector docente;
- el estudiante usa el motor interactivo;
- docente y proyector usan el mismo motor en modo lectura;
- el CSS se carga de forma diferida al abrir English LAB Live;
- los demás juegos conservan sus endpoints anteriores.

## Endpoints

- `englishLabMemoryMatchCreateRoom`
- `englishLabMemoryMatchStartRoom`
- `englishLabMemoryMatchGetPlayerState`
- `englishLabMemoryMatchSubmitPair`
- `englishLabMemoryMatchGetRoomControl`
- `englishLabMemoryMatchCloseRound`

## Persistencia

Se reutilizan:

- `ENGLISH_LAB_LIVE_ROOMS`;
- `ENGLISH_LAB_LIVE_PLAYERS`;
- `ENGLISH_LAB_LIVE_ANSWERS`;
- `ENGLISH_LAB_LIVE_EVENTS`.

`CURRENT_QUESTION_JSON` almacena un solo `room_package` compacto. Cada intento se registra como JSON compacto en `ANSWER_VALUE`. Los puntos se contabilizan una vez por par correcto y jugador.

## Instalación exclusiva QA

Agregar como archivo nuevo, sin reemplazar módulos existentes:

`96_English_LAB_Memory_Match_Live_CS21A174.gs`

Fuente canónica:

`apps_script_patches/english_lab_memory_match_live_cs21a174.gs`

Ejecutar, en este orden:

1. `instalarEnglishLabMemoryMatchCS21A174`
2. `verificarEnglishLabMemoryMatchCS21A174`

El verificador exige al menos seis pares B1/U01 y registra un JSON con `ok:true`.

El paquete descargable se genera mediante:

`.github/workflows/cs21a174-backend-installer-artifact.yml`

Incluye el módulo, guía, versión y `SHA256SUMS.txt`.

## Validación

Candidato funcional validado en `0c6809bf78489bb41794aadfdbcab5d92fa51da2`:

- contrato Live: success;
- motor Memory Match: success;
- frontend QA staging: success;
- revisión integral: success.

Empaquetador de backend QA validado en `5df64caf47f74b8bd2d1417d8103ab70e76f22ca`, run `30971008353`, success.

## Pendiente

- instalar el módulo únicamente en Apps Script QA;
- generar nueva versión del deployment `/exec` QA;
- probar con docente y dos estudiantes;
- confirmar fallback de Vocabulary Sprint;
- mantener PR draft hasta terminar QA manual.

## Fuera de alcance

- producción;
- notas oficiales;
- pagos, certificados o aprobación;
- Firebase o WebSocket;
- migración completa de las 640 preguntas;
- fusión de PRs.
