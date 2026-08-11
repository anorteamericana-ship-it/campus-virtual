# CS21A199 · Word Search · Básico I U01

Estado: FRONTEND FOUNDATION / QA ONLY. No Apps Script nuevo, no producción, no nota oficial.

## Objetivo

Construir Word Search como el siguiente juego del English LAB, reutilizando `ACADEMIA_PLAY_BANK` y dejando el contrato listo para una consolidación posterior en **un único Apps Script** junto con Memory Match, Sentence Order, Hangman y Quiz Time.

## Fuente curricular B1-U01

Se utilizan las diez fuentes de vocabulario activas de la Unidad 1:

- `VOCAB_01`: hello, goodbye, name, teacher, student.
- `VOCAB_02`: phone number, email, zero, please, thanks.

`phone number` se presenta al estudiante como frase normal, pero se codifica `PHONENUMBER` dentro de la cuadrícula.

Objetivo curricular: reconocimiento visual, ortografía y asociación básica de significado. Fuente: `APOLLO_G3 · ACADEMIA_PLAY_BANK`.

## Reglas CS199

- 10 palabras por tablero.
- Cuadrícula base 14×14.
- Direcciones B1: E, S, SE, SW.
- El estudiante puede seleccionar el mismo trazo en cualquiera de los dos sentidos.
- No se introducen palabras escritas al revés en B1-U01.
- Cada término objetivo debe existir exactamente una vez en el tablero final; el motor reintenta el relleno si las letras aleatorias crean una ocurrencia accidental.
- Una selección válida debe ser horizontal, vertical o diagonal recta.
- Práctica formativa, no nota oficial.

## Arquitectura frontend

- `src/english_lab_games/word_search_curriculum_contract_cs21a199.js`
  - filtra únicamente B1-U01 / VOCAB / VOCAB_01 + VOCAB_02;
  - transforma las filas de banco en vocabulario público;
  - valida 10 fuentes únicas.
- `src/english_lab_games/word_search_engine_cs21a199.js`
  - generador determinista por semilla;
  - colocación y relleno;
  - detección de ocurrencias accidentales;
  - geometría de selección;
  - contrato futuro `CLAIM_WORD`.
- `src/english_lab_games/word_search_game_cs21a199.jsx`
  - UI mouse/touch;
  - banco de palabras y traducciones;
  - progreso, tiempo y puntos locales de preview;
  - responsive.
- `styles/word_search_cs21a199.css`.
- `src/english_lab_games/word_search_preview_cs21a199.html`.

## Contrato para el Apps Script unificado futuro

No se implementa backend en CS199. La consolidación posterior debe mantener un paquete autoritativo por sala con estructura conceptual:

```json
{
  "game_id": "WORD_SEARCH",
  "room_code": "LAB-0000",
  "round_id": "...",
  "phase": "WAITING|OPEN|COMPLETE|CLOSED",
  "puzzle_id": "...",
  "grid": [["A"]],
  "words": [{"word_id":"VOC-B1-U01-001","label":"hello","hint_es":"hola"}],
  "claimed_words": [{"word_id":"...","player_id":"...","claimed_at":"..."}],
  "scores": {},
  "state_revision": 1
}
```

Mutación prevista:

```json
{
  "action": "CLAIM_WORD",
  "action_id": "...",
  "game_id": "WORD_SEARCH",
  "puzzle_id": "...",
  "word_id": "...",
  "start": {"row":0,"col":0},
  "end": {"row":0,"col":4}
}
```

El servidor debe recalcular la línea y validar contra la solución autoritativa; nunca confiar en que el cliente diga que una palabra es correcta. `action_id` debe ser idempotente. Si dos alumnos reclaman la misma palabra, sólo la primera mutación válida obtiene el punto y todos reciben el mismo snapshot actualizado.

## Decisión de integración

CS199 **no añade Word Search al selector Live todavía**. Esto es deliberado: el usuario solicitó terminar primero el código de los juegos y después preparar un único Apps Script. Activar un selector sin backend produciría una ruta visible pero incompleta.

Cuando se consolide el backend:

1. agregar Word Search al registro genérico de juegos;
2. cargar las 10 fuentes desde `ACADEMIA_PLAY_BANK`;
3. construir puzzle una sola vez al iniciar ronda y persistir la solución sólo en estado autoritativo;
4. exponer al alumno únicamente grid + banco de palabras + claims;
5. validar `CLAIM_WORD` en servidor;
6. integrar ranking/presencia comunes;
7. activar gateway/selector;
8. QA autenticada docente + Naty + Chu.

## Gate CS199

`scripts/qa_cs21a199_word_search.mjs` prueba 120 semillas, 10 palabras, 14×14, ocurrencia única, trazos directos/inversos y ausencia de `solutions` en el puzzle público.

Workflow: `CS21A199 Word Search Frontend QA`.
