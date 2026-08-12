# CS21A210 · Quiz Time browser smoke

## Alcance

CS21A210 valida exclusivamente el riesgo de doble envío síncrono en **Quiz Time** sobre el head exacto de CS209:

`7a20207444c47c7b64471b637626be502d10b5c6`

No cambia Apps Script, `/exec`, scoring, currículo, routing ni el contrato de payload.

## Riesgo observado por lectura de flujo

`StudentSession.answer()` usaba `busy` y `localSelected` como guardas React. Dos eventos `click` despachados en el mismo tick podían entrar antes del rerender y alcanzar `englishLabQuizTimeAnswer` dos veces. `actionsRef` sí era síncrono, por lo que ambos intentos reutilizaban el mismo `action_id`.

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

## Evidencia rojo → verde

### Rojo reproducido

Workflow run **31563768227**, head `63c8696b1e2d112c6a681a4f496648f7a51e0952`:

- Chromium emitió **2** `englishLabQuizTimeAnswer` en el mismo tick.
- Ambos payloads reutilizaron el mismo `action_id`.
- El primer payload llevó `option_id: A` y el segundo `option_id: B`.
- `question_id` y `expected_state_revision: 210` fueron iguales en ambos.
- El gate falló exactamente en `observado=2`.

Esto confirmó el defecto del cliente antes de cambiar `StudentSession`.

### Fix mínimo

`StudentSession` incorpora `submitQuestionRef`, un candado síncrono por `questionId`:

- se toma antes del primer `await`;
- bloquea un segundo submit para la misma pregunta aunque React todavía no haya rerenderizado;
- se reinicia al cambiar de pregunta;
- se libera en error solamente cuando el backend no devuelve una respuesta canónica ya aceptada;
- no cambia `Engine.buildAnswerAction`, payload, scoring, polling ni backend.

### Verde

Workflow run **31564077870**, head `9e07328ac4ef5876d2518074fe6574a25fbc31fa`:

- Quiz Time Chromium smoke: PASS;
- doble clic síncrono: **1 submit**;
- primer toque A preservado;
- contrato de payload preservado;
- vista 390×844 sin overflow;
- shell browser regression: PASS;
- contratos estáticos Quiz Time: PASS;
- navegación/shell actuales: PASS;
- backend CS201 sin cambios y ensamblable: PASS.

La corrida intermedia **31563955514** ya confirmó `answerCalls: 1`; falló únicamente porque el preview aislado no replicaba el `* { box-sizing: border-box; }` global de `styles/campus.css`. Se corrigió solo el preview QA para reflejar el entorno real del Campus; no se tocó el CSS del producto.

## Perímetro permitido y realizado

- `.github/workflows/qa-cs21a210-quiz-time-browser-smoke.yml`
- `00_DOCUMENTACION/ENGLISH_LAB_QUIZ_TIME_BROWSER_SMOKE_CS21A210.md`
- `scripts/test_english_lab_quiz_time_browser_cs21a210.mjs`
- `src/english_lab_games/quiz_time_preview_cs21a210.html`
- `src/english_lab_games/english_lab_quiz_time_live_cs21a198.jsx`

Diff del producto en Quiz Time: **6 adiciones / 4 eliminaciones** dentro de `StudentSession`; no hay otros archivos productivos modificados por CS210.

## Backend

CS21A210 exige `git diff --exit-code` sobre `apps_script_patches/` y vuelve a ensamblar CS201 como evidencia de que el backend permanece intacto. No hay nuevo deployment ni cambio de `/exec`.
