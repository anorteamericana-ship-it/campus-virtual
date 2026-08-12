# CS21A210 · Quiz Time browser smoke

## Alcance

CS21A210 valida exclusivamente el riesgo de doble envío síncrono en **Quiz Time** sobre el head exacto de CS209:

`7a20207444c47c7b64471b637626be502d10b5c6`

No cambia Apps Script, `/exec`, scoring, currículo, routing ni el contrato de payload.

## Riesgo observado por lectura de flujo

`StudentSession.answer()` usa `busy` y `localSelected` como guardas React. Dos eventos `click` despachados en el mismo tick pueden entrar antes del rerender y alcanzar `englishLabQuizTimeAnswer` dos veces. `actionsRef` sí es síncrono, por lo que ambos intentos pueden reutilizar el mismo `action_id`.

La prueba CS210 no asume que el backend dedupe. Su contrato es más estricto: **el navegador debe emitir un solo submit por pregunta ante doble interacción síncrona**.

## Prueba real de navegador

`scripts/test_english_lab_quiz_time_browser_cs21a210.mjs` abre Chromium a 390×844 y monta el `StudentSession` real mediante `src/english_lab_games/quiz_time_preview_cs21a210.html`.

Playwright intercepta únicamente un endpoint local ficticio. No hay llamadas a Apps Script ni escrituras oficiales.

Secuencia:

1. Carga una pregunta OPEN de `QT-210` para `QA-STU-007`.
2. Confirma cuatro opciones habilitadas.
3. Despacha `click` sobre A y B en el mismo tick de JavaScript.
4. Retarda 180 ms la respuesta del mock para mantener la primera petición en vuelo.
5. Exige exactamente un `englishLabQuizTimeAnswer`.
6. Exige que el primer toque A sea el único payload.
7. Verifica `action`, `room_code`, `player_id`, `question_id`, `option_id`, `expected_state_revision` y `action_id`.
8. Verifica estado bloqueado posterior y ausencia de overflow horizontal a 390 px.

## Criterio rojo → verde

Antes del arreglo, esta prueba debe poder demostrar el defecto si existen dos solicitudes. El fix solo será aceptado cuando la misma prueba pase sin cambiar el backend ni relajar las aserciones.

## Perímetro permitido

- `.github/workflows/qa-cs21a210-quiz-time-browser-smoke.yml`
- `00_DOCUMENTACION/ENGLISH_LAB_QUIZ_TIME_BROWSER_SMOKE_CS21A210.md`
- `scripts/test_english_lab_quiz_time_browser_cs21a210.mjs`
- `src/english_lab_games/quiz_time_preview_cs21a210.html`
- `src/english_lab_games/english_lab_quiz_time_live_cs21a198.jsx` únicamente si la reproducción roja confirma el defecto.

## Backend

CS21A210 exige `git diff --exit-code` sobre `apps_script_patches/` y vuelve a ensamblar CS201 como evidencia de que el backend permanece intacto.
