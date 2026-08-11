# CS21A198 · Quiz Time B1-U01 · Candidato QA

Estado: **QA_CANDIDATE_NOT_FINAL**

## Alcance construido

- B1-U01 como única unidad habilitada.
- 25 ítems curriculares canónicos: 5 VOCAB, 5 GRAM, 5 SPEAK, 5 LISTEN, 5 READ.
- Ronda: 10 preguntas, exactamente 2 por área, sin repetir SOURCE_ITEM_ID.
- Backend Apps Script autoritativo; `correct_option` se mantiene privado hasta `REVEAL`.
- Cliente Live docente/estudiante.
- Gateway aditivo sobre English LAB Live; permite alternar Quiz Time / juegos históricos.
- Loader canónico CS198 exige contrato, motor, Live API y gateway.
- Polling serial para Quiz Time; Memory Match conserva su dueño autoritativo CS192.
- UI responsive proyector 1440×900 / móvil 390×844.
- Backend acumulativo: `99_CS21A198_QUIZ_TIME_B1U01_COMPLETO.gs`.
- Puerto QA: `4198`.

## CI validado para el paquete entregable

Run: `31455655377`
Head validado: `b3de43e67bcbca2b0b6e8d52584377e96c4ade9a`
Conclusión: **success**.

Gates superados:
- contrato curricular y secreto de respuesta;
- contrato Apps Script;
- integración Live canónica;
- ensamblado acumulativo CS198;
- sintaxis del Apps Script completo;
- no modificación de Memory Match / Hangman / Sentence Order;
- render visual desktop y mobile;
- construcción del paquete QA.

Artifact oficial: `CAMPUS_QA_CS21A198_CANDIDATO_QUIZ_TIME_B1U01`
Artifact SHA-256: `60daa6aff811882c59959782bd9e691c5d5312573eea8d342a94070566ed543e`

ZIP interno SHA-256 verificado tras descarga: `4782967771f9a1df8a8b7d86448a120faf8765855ca6fd80c00aaa20d42d2c99`

Los commits posteriores a ese head son únicamente documentación de QA y no forman parte del ZIP ya validado.

## QA autenticada pendiente

1. Instalar backend completo CS198 únicamente en Apps Script QA, preservando el mismo `/exec` QA.
2. Ejecutar `verificarQuizTimeCS21A198()` y confirmar `ok:true`.
3. Abrir frontend fresco con `ABRIR_CAMPUS_QA_CS21A198.cmd`; debe usar `127.0.0.1:4198`.
4. Docente crea sala B1-U01 pero no inicia.
5. Naty y Chu ingresan; docente debe ver exactamente 2 participantes.
6. Iniciar y completar las 10 preguntas.
7. Confirmar misma pregunta/reloj/reveal/ranking en las tres vistas y cobertura 2×5 áreas.
8. Confirmar que ningún estudiante recibe clave correcta antes de REVEAL.
9. Regresión rápida Memory Match, Sentence Order y Hangman.

No autoriza merge ni producción.
