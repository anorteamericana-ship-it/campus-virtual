# CS21A209 · Sentence Order browser smoke

## Objetivo

Cerrar el hueco de navegador de Sentence Order sobre el stack vigente CS21A208, sin tocar Apps Script ni producción.

## Base

- Base exacta: `b3c67a9ef157150fafe03b054d774c702d64ce7d` (CS21A208).
- Rama: `test/cs21a209-sentence-order-browser-smoke`.
- Backend QA: se conserva CS21A201 y el mismo `/exec`.
- Estado: QA / Draft; no merge automático, no producción.

## Hallazgo reproducido y corrección

El primer browser smoke reprodujo un defecto real del cliente: dos eventos `click` síncronos sobre **Enviar respuesta** podían entrar al mismo `submit()` antes de que React reflejara `busy=true`, produciendo dos requests frontend para la misma respuesta (`2 !== 1`).

El backend existente ya protege puntaje/estado con lock y control de respuesta duplicada, por lo que no se modificó Apps Script. La corrección CS21A209 se limita a `src/english_lab_sentence_order_cs21a183.js`:

- `useRef(false)` como lock inmediato por instancia del jugador;
- el lock se toma antes del primer `await` del submit;
- se libera en `finally`;
- se reinicia al cambiar de ronda.

El mismo caso Chromium que falló antes del fix pasa después del cambio y exige exactamente un request de submit.

## Alcance automatizado

El browser smoke usa Chromium y el componente real `src/english_lab_sentence_order_cs21a183.js`. El HTML de preview sólo sustituye el transporte Apps Script por respuestas deterministas para poder ejercitar la UI sin credenciales ni usuarios reales.

Se valida:

1. ingreso del estudiante a una sala `SENTENCE_ORDER`;
2. bloqueo de submit con oración incompleta;
3. movimiento real de tokens y orden mediante `token_id`;
4. envío de todos los `ordered_token_ids` en el orden construido;
5. doble clic síncrono: debe producir un único request de submit;
6. render del resultado autoritativo posterior;
7. ausencia de overflow horizontal a 390 px;
8. montaje único de la consola docente y preservación de la vista Live base;
9. regresión estática CS21A183 y contratos de shell/routing actuales;
10. backend CS21A201 sin cambios y todavía reensamblable/sintácticamente válido.

## Lo que NO demuestra

- No es QA autenticada contra Apps Script real.
- No es prueba real de concurrencia ni capacidad con 15/20/25 estudiantes.
- No sustituye el smoke humano final docente + estudiante sobre el `/exec` QA.

Las pruebas masivas reales quedan diferidas por decisión del ciclo actual y no bloquean el desarrollo. Los guards sintéticos permanecen activos.
