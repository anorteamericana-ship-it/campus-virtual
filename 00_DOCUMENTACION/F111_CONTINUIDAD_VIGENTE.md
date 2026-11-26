# F111 - continuidad vigente 25-nov-2026

- Base frontend main 09f6d91759a58b3c401882fd48902ec17f0198ec, PR #818. PR #816 CORE @512 claves B2 A 0526 y campos independientes versionados; #817 panel fijo; #818 limpieza de mensajes.
- CORE @512 53 archivos, QUIZ @510 38, preview @505. No publicar Git main del backend como si fuera PROD. La copia local quiz510/prod tenia 48 archivos y no era identica a @510. Export exacto reconstruido.
- Candidato `temporal/examenes_docente_ca_20261125/candidate_oral_retry_20261125`: base_512, base_510, core, quiz, RELEASE_GATE.json, qa_oral_quiz.cjs. Un archivo modificado por motor: 02_Auth_Sesiones_Usuarios.js y 75_F111_WQ_Progress_QA.js. No dejar HEAD con motor QUIZ.
- Oral 0826: 14/15 guardados con CIERRE_PENDIENTE_NOTA y programa_solicitado_no_coincide, O1 vacio. 17199 92/100, 13.8/15. Dos ceros requieren confirmacion docente. Recuperar rubrica original, programa desde GRUPOS, identidad y permiso, no sobrescribir nota. PDF separado pendiente de verificar.
- Quiz 2 0826: 1 entregado, 2 borradores, 12 sin intento de 15 al corte anterior. @510 ya permite fecha anterior en PROD: causa de expulsion no reproducida en sesion real. Candidato: descubrimiento agrupado, asignacion permanente, orden, recuperacion de carga, guardado y envio incierto. Alcance B1 historico; no habilitar otros niveles ni nuevos PC01 sin certificacion.
- QA servidor 15/15 simulado. Navegador PC02 y PC04 10/10 simulado. Publicacion y primera nota real pendientes. Cero escrituras academicas. Siguiente paso: readback de frontend y motores, confirmacion de nota por Diego y verificar Quiz2 con estudiante.
- Formato permanente: AGENTS.md, Estandar de entregas y continuidad F111. Mantener historial en Git y actualizar este corte sin repetir auditorias cerradas.

## Corte pipeline F111
- Fase 1: validador local de integridad, 21/21 pruebas sinteticas; CORE 53/53 y QUIZ 38/38 verificados contra manifiesto privado, un archivo cambiado por motor. Workflow GitHub de validacion sin credenciales ni despliegue. Ver F111_PIPELINE_RELEASE.md.
- Frontend #819/#820 fusionado, main d2128a8c antes del pipeline, Pages y R48/R50 CI PASS. CORE/QUIZ permanecen @512/@510 al ultimo readback. Bloqueo de publicacion sigue vigente. No escribir notas ni abrir/cerrar quizzes para probar.

- P1: PR #821 fusionado, CI main 45754117939 SUCCESS. P2: expediente local de revision coteja reportes de ambos motores con manifiesto privado; 15 pruebas sinteticas nuevas. Caso real: LOCAL_REPORTS_MATCH, BLOCKED, NOT_GRANTED, NOT_PERFORMED. No se autoriza ni despliega nada. Pendiente revision independiente y canal permitido; ver F111_PIPELINE_RELEASE.md.

## Cierre formal del diagnostico - 26-nov-2026

- DIAGNOSTICO CERRADO CON RESERVAS. Base frontend antes de este cierre: main 00b0b043946448e78f29ecd8c3399f8b18ba8c17; PR #816-#822 fusionados. CI pipeline main 45756723313 SUCCESS. Este corte prevalece sobre SHA historicos del encabezado.
- Revision independiente de Claude (09:55-10:40 CR): el error observado el 25-nov ~20:44 CR provino de la capa de seguridad de OpenAI antes de la ejecucion remota; no hubo PID, salida de clasp ni respuesta de Google. No se conoce la regla interna exacta. Logs locales RDC no inspeccionados por Claude; escritura CLASP/OAuth/API no probada. No confundir exclusion como causa de ese evento con certificacion de esos mecanismos.
- Ultimos motores comprobados: CORE @512, QUIZ @510, PREVIEW @505. No nuevos despliegues en este cierre. Candidatos y respaldos exactos preservados en carpeta privada, 53/53 y 38/38 archivos, una modificacion por motor. QA historico 88/88 academico simulado y 36/36 pipeline; no repetir salvo regresion o cambio. Los candidatos no fueron inspeccionados por Claude.
- Riesgo: frontend nuevo y backend anterior. No usar el nuevo control de recuperacion oral hasta publicar y verificar el contrato correcto. No asumir que @512 rechaza todas las variantes sin comprobarlo.
- Estado academico confirmado por Claude en lectura: 14 orales guardados pendientes de sincronizacion, 0 notas oficiales; Quiz 2: 1 entregado, 2 borradores, 12 sin intento. No datos academicos modificados en este cierre.
- RELEASE: BLOCKED / NOT_GRANTED / NOT_PERFORMED en el expediente de revision. El cierre del diagnostico no cierra la incidencia academica ni concede autorizacion de despliegue. No ejecutar la operacion bloqueada por otra herramienta, agente o workflow. Cualquier publicacion requiere canal oficial permitido y revision independiente. Mantener PREVIEW intacto, motores separados, HEAD final CORE, respaldos y readback.
- Siguiente etapa unica: resolver el impedimento por el canal oficial correspondiente, verificar versiones y procedencia de candidatos; despues de una publicacion permitida, certificar primero una nota con confirmacion del docente y verificar una entrega real de Quiz 2. No reabrir diagnostico ni ampliar pipeline sin nueva evidencia.

## Reanudacion frontend independiente - 26-nov-2026
- Base main 41e348a0ecf329e7199c6c486c7b27abf3d86319. Incidencia reproducida: `student_b1_progress_f111.js` escribia el contador sin cambios en el DOM observado, provocando realimentacion de MutationObserver; la lista vacia y el refresco identico tambien generaban trabajo redundante. Se evita reescribir nodos iguales, se estabiliza lista vacia y se protege insercion ante tablist anidado. Cache de campus actualizada.
- QA focalizado `scripts/qa_f111_student_quiz_stability.mjs`: Chromium local 10/10, API sintetica interceptada; control negativo sobre main anterior FAIL en estabilidad del observador. No demuestra causa de todas las expulsiones reales. Sin escrituras academicas. El workflow historico QZ32 UI esta deshabilitado manualmente; no reactivado ni declarado PASS.
- Alcance solo frontend B1 PC02-PC08, no cambia PC01 ni API ni pesos. CORE/QUIZ candidatos privados intactos y publicacion anterior sigue bloqueada. Pendiente readback de Pages y prueba real voluntaria del estudiante.
