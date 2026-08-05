# CS21A173 · English LAB Memory Match

## Objetivo

Crear el primer motor visual nuevo de English LAB sin repetir el patrón lento observado en la revisión manual de `LAB-2618`.

Este corte **no toca producción**, no modifica Apps Script y no cambia el juego live existente. Se apoya en el candidato QA del PR #44 y queda aislado en su propia rama/PR.

## Decisiones obligatorias

1. El contenido pedagógico no vive en JSX/JS.
2. Google Sheets es la fuente editable de catálogo, reglas, contenido y recursos.
3. El navegador recibe únicamente un `ROOM_PACKAGE` compacto.
4. El motor no consulta Sheets ni Apps Script directamente.
5. El tiempo se calcula con timestamps del servidor.
6. El docente puede pausar o intervenir, pero el flujo normal debe ser automático.
7. El modo equipos admite turno, capitán, puntos y miembros.
8. El motor debe funcionar mientras el estudiante mantiene Zoom abierto.

## Fuente de datos

Google Sheet maestra:

- nombre: `ENGLISH_LAB_GAME_DB_CS21A173`;
- ID: `1MhPACxXkx3C9D9VvXcor8UUsGOGfBzCOI8rQf3jl8Mc`;
- hojas relevantes: `GAME_CATALOG`, `ROUND_RULES`, `TEAM_MODES`, `QUESTION_BANK`, `ASSET_LIBRARY`, `SESSION_TEMPLATES`, `RUNTIME_SCHEMA` y `CLAUDE_PROMPTS`.

El ID se documenta aquí para QA y migración. No se incrusta en el motor visual.

## Archivos canónicos

- `src/english_lab_games/english_lab_runtime_cs21a173.js`
  - normaliza reglas y paquetes;
  - calcula reloj con offset del servidor;
  - produce submissions compactos;
  - no hace red ni conoce contenido.

- `src/english_lab_games/memory_match_engine_cs21a173.jsx`
  - renderiza tarjetas de texto, imagen o audio;
  - modo individual y equipos;
  - teclado, ARIA y reducción de movimiento;
  - reporta `onReady`, `onSubmit`, `onTimeout` y `onComplete`;
  - no contiene vocabulario ni preguntas.

- `styles/english_lab_memory_match_cs21a173.css`
  - diseño visual responsive;
  - tarjetas 3D;
  - vista apta para proyector y laptop.

- `schemas/english_lab_room_package_cs21a173.schema.json`
  - contrato compacto para la sala;
  - máximo 24 tarjetas;
  - no permite bancos completos.

## Preview QA

El constructor de staging ya copia `src`, `assets`, `styles` y `vendor`. Por eso la vista y el fixture viven dentro de esas carpetas y entran automáticamente en el próximo ZIP.

URL esperada después de construir el staging de esta rama:

```text
http://127.0.0.1:4173/src/english_lab_games/memory_match_preview_cs21a173.html
```

La vista usa una única fuente QA separada:

```text
assets/english_lab/qa/memory_match_room_cs21a173.json
```

El fixture es exclusivamente QA y demuestra que el contenido está separado del motor. No es cargado por `campus.html` ni por una sala real.

## Flujo automático previsto

1. Sala creada.
2. Cuenta regresiva de 5 segundos.
3. `phase=OPEN` con `started_at` y `ends_at` del servidor.
4. El cliente calcula el tiempo restante usando el offset recibido.
5. Se envía únicamente el par seleccionado.
6. El backend actualiza puntos/turno.
7. `phase=REVEAL` durante 3 segundos.
8. Siguiente ronda después de 2 segundos.

## Tiempos iniciales

| Nivel | Individual | Equipos |
|---|---:|---:|
| B1 | 30 s | 45 s |
| B2 | 25 s | 35 s |
| I1 | 20 s | 30 s |
| I2 | 15 s | 25 s |

Los valores definitivos vienen de `ROUND_RULES`, no del componente.

## Seguridad y rendimiento

- cero credenciales;
- cero URL productiva;
- cero escrituras académicas;
- cero banco de preguntas dentro del bundle;
- precarga máxima prevista: dos rondas;
- el componente no usa `fetch`, `SpreadsheetApp` ni `google.script`;
- el workflow falla si detecta contenido pedagógico de muestra dentro del motor.

## Próximo PR

El siguiente corte debe conectar este registro de motores a `EnglishLabLiveStudentView` y `EnglishLabLiveTeacherView` solo cuando `room.game_id === "MEMORY_MATCH"`, manteniendo intacto el flujo `VOCAB_SPRINT` como fallback.
