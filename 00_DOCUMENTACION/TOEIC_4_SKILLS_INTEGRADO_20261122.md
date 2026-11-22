# TOEIC 4-Skills integrado — plan canónico y corte técnico 2026-11-22

## Resultado final solicitado
Dirección entrega un solo enlace HTTPS. El estudiante se identifica de manera segura, resuelve un simulacro de 109 tareas (Listening 45, Reading 45, Speaking 11, Writing 8), sus respuestas se guardan en servidor, los docentes reciben audio/textos, revisan una rúbrica y la Academia consulta resultados. Solo distribuir el enlace definitivo cuando todos los hitos G1–G7 estén cerrados con pruebas, incluida revisión del contenido.

## Fuentes oficiales y contrato
ETS Global integrated 4-Skills: https://www.etsglobal.org/tf/en/test-type-family/toeic-4-skills-tests
ETS Speaking & Writing: https://www.ets.org/toeic/about/speaking-writing.html
TOEIC L&R lineal: 100+100 preguntas; conservar ambas formas existentes A/B (400 ejercicios) sin sustitución.
TOEIC integrado: Listening adaptativo dos etapas (25+20 en 25 min) y Reading adaptativo dos etapas (25+20 en 37 min), Speaking 11 (~20 min), Writing 8 (~60 min). Total ~142 min. No replicar ni insinuar el algoritmo propietario, equating scores, equivalencia TOEIC/CEFR o certificación ETS.
Distribución adaptativa replicada desde estructura publicada ETS, no calibración: L unidad 1 P1=3/P2=4/P3=9/P4=9; L unidad 2 P2=5/P3=9/P4=6; R unidad 1 P5=5/P6=4/P7=16; R unidad 2 P5=7/P6=4/P7=9.
Selección de ruta de práctica: >=68% en unidad 1 = advanced ("upper") usando banco B; otro caso = fundamentals usando A sin repetir. El 68% es heurística local, no umbral oficial ni discriminación calibrada. Selección conserva grupos indivisibles de 3–5 ítems. En Listening los 25 minutos se reparten internamente 14+11 como decisión de práctica NO oficial; en Reading 23+14.
Speaking: 2 lectura, 2 descripción, 3 preguntas, 3 información, 1 opinión. Writing: 5 oraciones (8 minutos compartidos), 2 correos (10m cada uno), 1 ensayo (30m). Los prompts orales siguen en pantalla en la primera versión, no son audios de ETS. El reloj de Speaking es global 20 min y en Writing global 60 min y límites de actividad por bloque; no hay evaluación automática de expresión.

## Inventario, decisiones y riesgos
- Banco previo: forms/form_a.js y form_b.js, 200+200; 112 audios sintéticos, no revisados humanamente por escucha integral; 0/400 reactivos con segunda revisión docente independiente.
- Práctica previa pública: diagnostico-ingles/ (L&R) y toeic-4-skills/ (11 S y 8 W). No modificar sus fuentes ni interfaces de oficio; reutilizar como dependencias.
- Nuevo simulacro en toeic-integrado/ con un único HTML, core.js (selección), app.js (estado, temporizadores, grabación, exportación), style.css. No utiliza CORE/QUIZ F111, Apollo, Sheets, auth ni notas.
- Privacidad piloto: sin cuenta ni nombre; respuestas L&R, textos W y ruta en localStorage de un solo navegador; grabaciones de voz únicamente en RAM de pestaña y descarga individual. Nunca prometer que docente ya recibió el archivo. No protección por servidor; respuestas correctas embebidas en JS público: apto SOLO para simulacro formativo, no examen invigilado.
- Riesgo educativo P1: usar contenido DRAFT sin revisión humana lingüística, audios sin escucha humana, imágenes SVG en lugar de fotos; simulacro no mide formalmente CEFR. Revisión de docente antes de distribuir como producto pedagógico validado.
- Riesgo de datos P1: grabaciones se pierden al recargar/cerrar salvo descarga; progreso W no existe fuera del navegador; dispositivos compartidos y homónimos sin aislamiento. Prohibido afirmar expediente institucional o entrega docente.
- Riesgo funcional P2: Safari/iOS físico y lectores de pantalla sin pruebas, permisos de micrófono, red intermitente, cuotas del navegador, cronómetros pueden variar con suspensión de pestaña; se usa Date.now para límite.
- Riesgo legal: marca TOEIC® con descargo; jamás copiar preguntas ETS/archivos oficiales.

## Plan de cierre y criterios de aceptación
| Gate | Trabajo/criterio | Corte 2026-11-22 |
|---|---|---|
| G1 | Conservar e inventariar A/B 200+200, 112 audios y 11/8 tareas originales | PASS, documentación y fuente |
| G2 | Construir motor L&R integrado, 45/45, 25+20, cuotas por parte, rutas diferenciadas, grupos íntegros y sin repetición | PASS 9/9 QA local |
| G3 | Construir navegación única S/W, grabación real MediaRecorder, textos, temporizadores, retomar intento local, exportación TXT, móvil | PASS 10/10 QA Chrome emulado |
| G4 | Publicar ruta HTTPS estática y probar en dominio final; revisar regresiones L&R y S/W ya publicadas | PENDIENTE; no afirmar URL nueva publicada |
| G5 | Validar material original: 400 L&R + 19 S/W con docente independiente, escucha de 112 audios e inspección de imágenes | PENDIENTE; 0 aprobaciones humanas acreditadas |
| G6 | Backend separado, seguro, con cuentas o acceso individual, carga cifrada de audios/textos, consentimiento/retención/borrado, datos personales mínimos, rúbrica docente y tablero; E2E con estudiantes ficticios | PENDIENTE (requiere proyecto de release controlado, no escribir en producción F111) |
| G7 | QA real multi-dispositivo (Windows Chrome, Android, iOS/Safari), micrófono, red caída, recuperación y privacidad; aprobación académica y administrativa, distribución enlace definitivo | PENDIENTE |

Indicador estrictamente técnico de la **versión formativa local**: G1–G3 3/3 cerrados = 100 % de esa etapa, 3/7 gates de la entrega institucional = 42.9 %. NO extrapolar a "43% del código" ni confundir pilotos publicados anteriores con certificado. QA es con Chrome móvil emulado y micrófono falso, NO prueba humana de grabación en iPhone. E2E institucional = NO.

## Entregable temporal
La ruta canónica propuesta es /campus-virtual/toeic-integrado/. Existe únicamente al publicarse en GitHub Pages y verificarse HTTP200 en https://anorteamerican.com/campus-virtual/toeic-integrado/. No enviar enlace a estudiantes mientras G4–G7 sigan pendientes; compartir solo a revisores para QA formativa con todos los avisos.

## Pasos siguientes sin duplicar trabajo
1. Ejecutar regresión de código fuente, Playwright local y contraste contra distribución oficial. No rehacer los 400 ejercicios.
2. PR pequeño, comprobar CI/Pages, verificar URL HTTPS y funcionalidad en dominio real. Piloto separado de notas/datos F111.
3. Ejecutar revisión docente de banco y audios con bitácora item_id, severidad, resultado y versión; guardar estado APPROVED solo tras revisión independiente.
4. Implementar API independiente: autenticación/acceso, upload con límites, control de MIME, almacenamiento privado, metadatos por intento, consentimiento explícito, políticas de retención/borrado y rúbrica auditable.
5. E2E ficticio profesor/estudiante y QA físico; revisión final; distribuir el enlace institucional único, sin usar marca de certificación ETS.

## Evidencias del corte
Git remote origin/main 32a568c5f487f72ed6b970cb2077fc6e75619405; nueva rama feat/toeic-integrated-4-skills-20261122 creada desde ese HEAD; no cambios en backend/Apollo/F111.
QA local node toeic-integrado/qa_integrado.cjs: 9/9 PASS, selección upper/foundation, sin duplicados y grupos íntegros.
QA local node toeic-integrado/qa_browser.cjs: 10/10 PASS (end-to-end 90 L/R, 11 S, 8 W, MediaRecorder falso, texto persistente, TXT, móvil 390px, 0 POST, 0 excepciones JS). No interpretar micrófono falso como grabación real del estudiante.
