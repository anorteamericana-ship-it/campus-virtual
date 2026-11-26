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
