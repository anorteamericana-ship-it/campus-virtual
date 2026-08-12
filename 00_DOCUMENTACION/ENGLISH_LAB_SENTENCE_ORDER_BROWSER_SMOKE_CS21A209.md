# CS21A209 · Sentence Order browser smoke

## Objetivo

Cerrar el hueco de navegador de Sentence Order sobre el stack vigente CS21A208, sin tocar Apps Script ni producción.

## Base

- Base exacta: `b3c67a9ef157150fafe03b054d774c702d64ce7d` (CS21A208).
- Rama: `test/cs21a209-sentence-order-browser-smoke`.
- Backend QA: se conserva CS21A201 y el mismo `/exec`.
- Estado: QA / Draft; no merge automático, no producción.

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
9. regresión estática CS21A183 y contratos de shell/routing actuales.

## Lo que NO demuestra

- No es QA autenticada contra Apps Script real.
- No es prueba real de concurrencia ni capacidad con 15/20/25 estudiantes.
- No sustituye el smoke humano final docente + estudiante sobre el `/exec` QA.

Las pruebas masivas reales quedan diferidas por decisión del ciclo actual y no bloquean el desarrollo. Los guards sintéticos permanecen activos.
