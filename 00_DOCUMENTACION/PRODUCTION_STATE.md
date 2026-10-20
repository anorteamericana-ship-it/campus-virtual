# CAMPUS VIRTUAL · Estado de producción

## F111 · CONSOLIDACIÓN CANÓNICA — 19/20-oct-2026 (registrado en GitHub)

### F111 — QA ORAL B2 L9 · GATE DE AISLAMIENTO CANÓNICO (20-oct-2026)

- **ACCIÓN SIGUIENTE intentada, SIN ESCRITURAS REALES:** localizados y contrastados Script ID QA `1GMHihGwnX_-sIS101rRlUoYpAH2HSKyms8lx6L9z7bjb_45YDn-ph6WD` y Deployment ID QA histórico `AKfycbxEAQ9lAg1Nv0ASX30MAVOzD7IZvwwqSI9MYcNaMhOQ` en `scripts/release_cs21a211_qa.ps1`, `scripts/export_apps_script_qa_snapshot_cs21a178.ps1` y PR frontend #268. **Drive metadata confirma el proyecto Apps Script QA** titulado `CAMPUS_QA_MODULAR_CS21A144_20260729_180204`, última modificación vista por Drive `2026-09-05T20:22:36Z`, mime `application/vnd.google-apps.script`. Esto NO prueba versión actual de deployment, contenido HEAD ni su aislamiento. Intento de lectura de cuerpo vía Drive fue rechazado con HTTP 403; Browser sin contexto originador y Desktop Commander OFFLINE. **READBACK QA = BLOQUEADO**.
- **P0 RECUPERADO DEL HISTORIAL (NO OMISIÓN):** `00_DOCUMENTACION/QA_CONTAINMENT_CANDIDATE_CS21A211_2026-09-01.md` documenta E3 QA con **13 ocurrencias del deployment PROD** en el frontend QA; además 11 destinos externos requerían guard explícito/property-driven. El PR frontend #268 (contención QA, self-route y fail-closed) está **MERGED** en GitHub, merge SHA `6b747fdbb1aeb4d610ad54ace2ded856fc3f95cc`, pero ninguna evidencia de este corte demuestra push al QA Script ni publicación de las 11 Script Properties; docs históricas dicen `NO APPS SCRIPT PUSH` y properties pendientes. **No tomar MERGED como QA desplegado.** Se localizó `scripts/release_cs21a211_qa.ps1` con mode dry-run sin `-Push` y guardias de hash/version; NO se ejecutó por falta de sesión remota.
- **Readback estructural parcial de Drive (SOLO CABECERAS):** `APOLLO_QA_NUEVA_2026-09-18` tiene `ESTATUS` (17 columnas) y `SESIONES` (14). `CAMPUS_OPERATIVO_QA_2026-09-19` tiene `CALENDARIO_LECCIONES` (18), `ORAL_EVALUACIONES` (44) y `DOCENTE_SESIONES_CLASE` (17). Los encabezados incluyen identificadores de grupo/nivel/lección, estado y nota según la hoja. NO se leyeron filas personales, no se comprobó existencia de docente QA ficticio ni pureza sintética de los datos. Zona horaria persistente: APOLLO QA `America/Los_Angeles` versus OPERATIVO QA `America/Costa_Rica`.
- **DICTAMEN DEL GATE:** **P0 / NO GO a POST QA** hasta demostrar por readback de Apps Script QA (script, HEAD y deployment) que `SHEET_ID`, `OPERATIVO_ID`, carpeta documental, respaldo, plantillas y todos los IDs escribibles son exclusivamente QA y que self-route/default-deny están realmente publicados; corregir desfase horario con cambio controlado solo en QA; verificar cuentas completamente ficticias. Sin estas condiciones, `oralSaveDraft`, `oralCloseEvaluacion`, `oralGeneratePdf` y cierre de L8 no pueden ejecutarse sin riesgo a producción. No usar endpoints PROD, no crear nuevo deployment ni hacer `clasp push --force`.
- **CONTINUIDAD:** QA en memoria oral B2 15/15 PASS preservado, Keylor 23/23 histórico NO repetido; 0 ejecuciones Apps Script QA autenticadas, 0 PDF reales, 0 cambios de notas, 0 escrituras Sheets/Drive, 0 publicaciones. **SIGUIENTE ACCIÓN EJECUTABLE:** restablecer conexión autorizada a QA Script; correr `scripts/export_apps_script_qa_snapshot_cs21a178.ps1` en modo exclusivo de lectura y verificar proyecto/HEAD/deployment y mapa completo de IDs, sin push; si el gate pasa preparar exactamente 1 docente ficticio + 1 alumno CA ficticio + 1 alumno de otro grupo y realizar UNA prueba real L8→L9→nota→PDF/backup en recursos QA con lectura antes/después. Integración y GO/NO GO PROD seguirán pendientes de prueba real.

### F111 — conciliación con PROMPT MAESTRO y recursos QA existentes (20-oct-2026)

- **Prompt maestro anterior, leído completo (898 líneas; corte 20-oct-2026):** instrucciones operativas vigentes: no reiniciar F111; único índice `00_DOCUMENTACION/PRODUCTION_STATE.md`; reutilizar motores, bancos y PR; completar integración/CI/publicación con evidencia; cero pruebas sobre expedientes reales; no confundir código GitHub y Apps Script desplegado. **Avance de gestión: 70% estimativo**, no reemplazar por “5/5 etapas = 100%”. Formato de reportes futuro: avance general y modular, correcciones efectivas, contadores, bloqueos, cinco prioridades y siguiente acción exacta. El prompt era anterior a las etapas L3/L4/L5: sus SHA main, estado inicial PR #529, cifras 114 commits y tareas L2 son registros HISTÓRICOS, no órdenes para reabrir limpieza ya conciliada. Conservar hallazgos más recientes.
- **Nueva evidencia conectada a Drive QA — NO equivale a GAS QA ejecutado:** carpeta existente `CAMPUS_QA_CS21A211_ISOLATED_RESOURCES` https://drive.google.com/drive/folders/1IdSsg04MSPWpfDYqUMhDpfFFtnhdB0uM ; libro `APOLLO_QA_NUEVA_2026-09-18` https://docs.google.com/spreadsheets/d/1K-A7_GUGY8ugtIWd-Pp9_lht0ecimj_6-yyHNs0tf_s/edit ; libro `CAMPUS_OPERATIVO_QA_2026-09-19` https://docs.google.com/spreadsheets/d/1iktH3nUl-6oxsHo0CFATBuqz6DNXf1CFCMqW65CLSKk/edit . Ambos accesibles por metadata de Google Drive. APOLLO QA tiene `ESTATUS,DATOS,GRUPOS,SESIONES,USUARIOS`; operativo QA tiene `CALENDARIO_LECCIONES,DOCENTE_SESIONES_CLASE,ORAL_EVALUACIONES,ORAL_PREGUNTAS_APLICADAS,ORAL_AUDIT_LOG,NOTAS_OFICIALES_LOG`. Existen recursos pero **no se ha verificado que su contenido sea exclusivamente ficticio, que la implementación QA actual los utilice, ni que permitan probar L8/L9**. No escribir en ellos antes de verificar.
- **Riesgo nuevo concreto:** metadata de `APOLLO_QA_NUEVA_2026-09-18` reporta timezone `America/Los_Angeles` mientras `CAMPUS_OPERATIVO_QA_2026-09-19` reporta `America/Costa_Rica`; evaluar impacto en fechas/habilitación L8/L9 y ajustar solo en QA con autorización y control de impacto, antes de certificar. Ambos libros son de septiembre y su estado académico vigente **no está certificado**.
- **Resource map localizado:** `QA_CS21A211_RESOURCE_MAP` https://docs.google.com/spreadsheets/d/152LkG-e5DO870pI2xtZ4psVgEP65StAe2XieriMHx0I/edit contiene once recursos QA de carpetas y CONAPE; no revela por sí mismo Script ID o URL de deployment GAS QA actual. No reutilizar credenciales QA antiguas sin confirmar validez. No se leyó ni difundió el archivo de credenciales.
- **Bloqueo para ejecución real:** no hay acceso conectado autorizado al proyecto/deployment Apps Script QA ni a login docente autenticado; Desktop Commander offline, Browser sin contexto originador. Las 15/15 verificaciones anteriores en memoria permanecen válidas con su alcance restringido. El siguiente paso real exige: identificar Script ID y Deployment ID **QA** (diferentes de PROD), readback de constantes `SHEET_ID`, `OPERATIVO_ID` y todas las carpetas, autenticación de docente ficticio y confirmación de datasets falsos; luego **UNA** prueba integral de L8→L9→borrador→cierre `ORAL_1`→PDF y respaldo QA, con readback antes/después. Si no hay prueba de aislamiento, NO ejecutar POST ni publicar. **NO GO PROD**.
- **No se repitió** Keylor sintético 23/23, no se reconstruyeron bancos 48/48, no se relanzó prueba B2 L9 15/15, no se creó otra documentación ni rama, no hubo escritura en Sheets/Drive/App Script/expedientes. Solo esta actualización documental sobre el PR #532 sin fusionarlo.

### F111 ETAPA 5/5 — QA oral B2 L9 aislado (20-oct-2026)

- **Objetivo nuevo, sin repetir Keylor 23/23:** docente QA ficticio + estudiante ficticio B2/CA, clase L8 simulada → L9 simulada → portal examen `PRACTICA/ORAL_L9` → borrador → lectura → cierre y nota `ORAL_1` → archivo PDF/backup simulado. Mantener bancos originales B2/I1/I2 48/48, no reconstruir ni editar PDFs originales. Frontend ya integrado #521/#523/#524/#525.
- **Prueba puntual EJECUTADA contra funciones REALES extraídas de GitHub backend/main** `fd35c0f2c4a47ed2b25a079a7561c8596f09e8f8` (archivo `prod/02_Auth_Sesiones_Usuarios.js` + `prod/13_Examenes.js`, catálogo frontend `modulos/oral_bancos_ic5.js`): **15/15 PASS**, 0 FAIL. Guardia token inválido; sesión docente L8 bloquea L9; sesión L9 habilita panel B2; único estudiante CA ficticio; guardado/lectura BORRADOR; PDF prematuro bloqueado; cierre `CIERRE_PENDIENTE_NOTA→CERRADO`; rúbrica 20/25 = 80/100 = aporte 12/15, peso oficial 15%; solo un registro `ORAL_1`; cerrado no editable; archivo PDF y respaldo con identificadores distintos; segunda consulta reutiliza archivo; catálogo B2 conserva 16 unidades; sin llamadas a servicios externos. Eventos de evaluación en memoria: `BORRADOR→CIERRE_PENDIENTE_NOTA→CERRADO→PDF_GENERADO`. Evidencia disponible en ejecución de esta conversación; **NO es CI GitHub ni certificado E2E autenticado**. Los archivos PDF de la prueba fueron blobs ficticios, no PDFs reales ni archivos Drive.
- **LÍMITE DE COBERTURA:** `validarSesion`, calendario L8/L9, `SpreadsheetApp`, `DriveApp`, sincronización de nota, locks, PDF y archivo respaldo se simularon deliberadamente. Se ejecutaron controladores reales `oralGetPanelDocente_F90_1`, `oralSaveDraft`, `oralGetEvaluacion`, `oralCloseEvaluacion_F90` y `oralGeneratePdf` contra esas dependencias simuladas. No se certificó el cierre real de L8 ni activación automática L9, dispatcher HTTP completo, persistencia Google, firma/auth real, HTML/PDF real, ni un docente conectado. **QA AUTENTICADO = 0/1**.
- **Preparación del único QA autenticado permitido:** usar proyecto Apps Script QA con **Script ID y Deployment ID propios** previamente aprobados; `SHEET_ID` de APOLLO QA enteramente sintético (ESTATUS CA, DATOS, GRUPOS y sesiones de login), `OPERATIVO_ID` QA (calendario L8/L9, DOCENTE_SESIONES_CLASE, ORAL_EVALUACIONES/PREGUNTAS/AUDIT), `DOCUMENTOS_FOLDER_ID` QA con dos subcarpetas de archivo y respaldo sintéticas; revisar también TODAS las referencias auxiliares a archivos, cachés y carpetas para que no apunten a producción. Un docente ficticio autorizado a grupo B2 + dos alumnos ficticios: QA-ALUMNO-01 CA, QA-ALUMNO-02 grupo ajeno (denegación). Usar tokens emitidos **por login QA real**, nunca tokens PROD. Hacer snapshot antes/después y probar 1/1 recorrido real: L8 cierre → L9 habilitado, banco original B2 U1, /25→15, guardar/leer borrador, cierre, nota una sola vez, PDF auténtico y respaldo en carpetas QA, permisos ajenos rechazados; incluir timeout de cierre sin reintento automático. No usar nombres/códigos/cédulas reales.
- **Bloqueo remoto:** Desktop Commander `DESKTOP-9U2RJRG` OFFLINE; Browser sin contexto originador; Apps Script QA autenticado/Drive QA no accesibles de forma confirmada; no invocar endpoints o recursos de producción. **No se configuró ni desplegó QA**, no hay prueba autenticada ejecutada. Faltan readback de versión PROD, QA auth y PDF real. **NO GO PROD**. No ejecutar `clasp push --force`, no mergear #69/#522 ni mezclar escritos o I CAN.
- **Hechos inalterados:** Keylor sintético 23/23 es evidencia antigua independiente y no se volvió a ejecutar. Módulo oral en frontend #521/#523/#524/#525 MERGED, sin cambios en esta etapa. Cero cambios en notas, grupos, Sheets, Drive, pagos o Apps Script; única escritura autorizada de esta etapa = actualización de este documento canónico en rama PR #532.

### F111 ETAPA 4/5 — matriz G1 vs CONAPE #70 (20-oct-2026)

- **Alcance y base:** GitHub `campus_backend/prod-460` = commit `956bf9ae84c9df7f6378de2e56a373a9dc69d964`; `backend/main` = `fd35c0f2c4a47ed2b25a079a7561c8596f09e8f8` (116 commits ahead/0 behind; 43 archivos, 13 en `prod/`). `prod/48_CONAPE_Performance_Acceso_Academico.js` blob base `e9685a75384b5dad93ee0092399e6c9f25d8f258` → blob main `7a33564a5ac64104cf9f8c746560003d34174746` (79+/2−; Git SHA blob NO equivale a SHA-256 export PROD). La versión **Apps Script HEAD** y la versión **deployment estable PROD** **NO VERIFICADAS**, no inferir de GitHub. Desktop Commander offline; navegador sin contexto de extensión, no hay readback remoto.
- **Parche A G1:** commit `c2a9d3439ecc66d27029dae45c24a84018ae3c61` (+8/−1 en `prod/48`, aprox. líneas 48–56): wrapper `getSuperAdminMasterDashboard=function(body)` llama `_esAdminOSuperadmin(body)` (definición `prod/02_Auth_Sesiones_Usuarios.js`, línea ~3046 en main) **antes** de consultar `_cs21a98CacheGet_` FRESH/STALE; denegar token ausente, revocado, rol student/teacher/ventas, excepción. No modificar base `_cs21a98MasterBase_` ni políticas generales de sesión. Peligro: rollback que quite G1 reabre fuga de caché.
- **Parche B CONAPE #70:** merge `786946dea164a8f7703824fcd8e5e1a31aa6ad96` (+71/−1 en `prod/48`). `_cs21a100OperacionConape_` ~253 devuelve `codigo` del asiento; funciones nuevas `_cs21a100VerifyExistingLines_` ~265 y `_cs21a100IsExtraRowOnlyError_` ~310; wrapper `sincronizarConapePuestaAlDia` ~319 añade guardia de propietario y reconciliación solo para `CONFIRMADO_LOCAL` + error preciso + cotejo 4/5/6/7. Mantener estas cuatro funciones como **una sola unidad lógica**. Lee 4 hojas CONAPE y actualiza `PAGOS_OPERACIONES` mediante `_cs21a99JournalConape_`; NO es una acción enteramente read-only. No volver a ejecutar expediente ya conciliado.
- **QA en GitHub:** run https://github.com/anorteamericana-ship-it/campus_backend/actions/runs/39354601622 `e1-tests SUCCESS`, logs: `F111_CACHE_AUTH_E1_PASS 28`, `F111_MASTER_REAL_AUTH_E1_PASS 17`, `CONAPE_CONCILIACION_4_MAS_1_PASS 6`. **51 aserciones/escenarios reportados en suites sintéticas**, no QA autenticado ni garantía de readback. Bloqueos de prueba: revocación y caché de sesión, columna `CODIGO_ESTUDIANTE` ausente/vacía, titularidad cruzada, error parcialmente sincronizado, rollback de asiento local y preservación de filas históricas.
- **Plan condicional al readback:** obtener por API autorizada de Apps Script solo metadata/versionNumber/deploymentId y export **exacto de versión estable**, luego export HEAD; normalizar LF y calcular SHA-256 de cada archivo; comparar PROD export con `prod-460`, G1, CONAPE #70 y main. Decidir caso A: G1 falta/CONAPE falta → QA G1 primero, CONAPE después; B: G1 ya existe → no reinstalar G1; C: CONAPE existe → no reinstalar CONAPE; D: extra cambios/versiones desconocidas → STOP para conciliación manual. Siempre delta de función contra export real, no subir el archivo completo ni `main`.
- **Rollback** solo tras identificar deployment estable y guardar export + versionNumber anterior verificado: misma ID del deployment, revertir versión únicamente con autorización de release, no `clasp push --force`, nunca crear ID nuevo; validar compatible de login/caché/sesiones y no perder G1. Reversión de código CONAPE **no revierte asientos** del diario ni filas externas; requerir diagnóstico/conciliación con evidencia antes de cualquier corrección de datos. **DICTAMEN NO GO**, cero PROD/SHEETS/DRIVE writes y 0 publicaciones en esta etapa.

### F111 I CAN R2 — integridad y QA, 20-oct-2026

- **Misma rama/PR backend #73 (DRAFT):** https://github.com/anorteamericana-ship-it/campus_backend/pull/73 · HEAD `2d12208bb50cfbba6b06b9276858d868d7777f02`. Sin PR paralelo. 4/4 contratos ya escritos y enrutados. R2 elimina selección arbitraria de primer nivel por asistencia, deniega matrícula CA ambigua o grupo incompatible; exige `DOCENTE_ICAN` exacto por grupo+nivel antes de mostrar lista docente; cambia a historial append-only con `PREV_RESERVA_ID` y `ACCION`, una inserción por transición bajo lock; bandera doble `ICAN_R1_ENV=QA` + `ICAN_R1_WRITES=YES`, apagada por defecto. No se crearon hojas ni se tocaron notas/asistencia.
- **QA código aislado:** 34/34 PASS, 0 fallos, `qa-ican-r1` https://github.com/anorteamericana-ship-it/campus_backend/actions/runs/39452366310 ; Backend E1 y N02 E1 PASS = 3/3 checks. Valida ACL, concurrencia simulada, eventos y bloqueo de PROD. **PASS sintético NO equivale a Apps Script QA autenticado**. No afirmar atomicidad real verificada.
- **QA autenticado aislado NO ejecutado:** preparar Apps Script independiente y dos libros de datos SINTÉTICOS separados; el `SHEET_ID` principal también debe ser QA porque `getICANEstudiante` y `validarSesion` acceden a APOLLO/SESIONES. Schema `ICAN_SESIONES` (10 columnas), `ICAN_RESERVAS` (11, + `PREV_RESERVA_ID`, `ACCION`). Instrucciones detalladas en descripción del mismo PR #73, sin otro documento. Ningún endpoint real invocado.
- **Dictamen:** **NO GO PROD** hasta autenticar perfiles sintéticos, validar Google Sheets y locks reales en ambiente aislado, resolver reglas de cancelación/reprogramación/retención, reconciliar estudiantes con más de una CA y verificar versión exacta del deployment estable. Sin merge, sin publicación ni activación de properties.

### F111 I CAN R1 — corte 20-oct-2026

- **Backend PR #73 DRAFT:** https://github.com/anorteamericana-ship-it/campus_backend/pull/73 — rama `feat/f111-ican-r1-contratos-qa-20261020` (sin fusionar). Cuatro contratos: `getICANPortalEstudiante`, `reservarICANSesionEstudiante`, `cancelarReservaICANEstudiante`, `getICANDocenteReservas`; enrutamiento F92 y almacenamiento separado `ICAN_R1_SS_ID`. No crear hojas, ni conectar reservas con asistencia/notas. `ICAN_R1_WRITES` OFF por defecto; nunca habilitado aquí.
- **CI sintético:** 22/22 PASS, 0 FAIL en https://github.com/anorteamericana-ship-it/campus_backend/actions/runs/39450597662 ; además Backend E1 y F111 N02 E1 PASS (3/3 workflows). Son simulaciones con SpreadsheetApp/LockService falsos, NO prueba con Apps Script autenticado ni producción.
- **Puertas pendientes:** cotejar el nivel/grupo CA cuando coexisten matrículas; validar docente I CAN vs docente general; consolidar bitácora de cambios/retención; política de cancelación; datos de sesiones y libro QA independiente; probar atomicidad y concurrencia reales; certificar versión Apps Script antes de desplegar. **NO GO PROD**. No reabrir L1-L3 ni mezclar con escritos/QZ32.



**Este bloque es el índice operativo vigente** para el proyecto F111 y la limpieza de ramas. Las secciones debajo son **cortes históricos**: no tomar como deployment actual sus frases "sigue en @460", "sigue en @431" o "vigente" sin verificar la versión remota. **No crear otro handoff paralelo.** El detalle histórico del examen oral/escritos permanece en [backend #69, archivo review/F111_HANDOFF_CANONICO_20261019.md](https://github.com/anorteamericana-ship-it/campus_backend/blob/release/f111-d2-escritos-privado-y-notas-20261018/review/F111_HANDOFF_CANONICO_20261019.md), que **no está en backend main**. Este bloque registra los cambios posteriores.

### Fuentes actuales, sin asumir despliegues

- **Campus oficial:** https://anorteamerican.com/campus-virtual/campus.html.
- **Frontend GitHub:** `anorteamericana-ship-it/campus-virtual/main` en commit `2e9c6cd6ac2e5ee7268644d6c2d670b50bc4a673` al iniciar conciliación. GitHub Pages del PR #527: workflow 39363515490 **SUCCESS 3/3**. Se publicó el frontend; acceso autenticado sigue siendo una verificación distinta.
- **Backend GitHub:** `anorteamericana-ship-it/campus_backend/main` en `786946dea164a8f7703824fcd8e5e1a31aa6ad96`, PR #70 CONAPE fusionado. **No representa la versión desplegada de Apps Script**.
- **Apps Script PROD:** Script ID `1kV4wKnD_OU5DPQSawScjPsUbo1MOg_rAHbtpYupSMPkqywIVSQwdV4y2`, Deployment ID estable `AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ`. El corte inmutable `prod-460` consta documentado. En PR backend #64 consta lectura real del 17-oct de un **deployment @462**, posterior al archivo JSON @460 del 9-oct; **la versión exacta hoy sigue sin consulta remota nueva**. Leer deployment antes de release. El delta GitHub `prod-460...backend/main` contiene 114 commits y 13 archivos bajo `prod/`; **PROHIBIDO push integral de main**.
- **Norma de cambios:** frontend pequeño: rama temporal + PR + checks + Pages. Backend/sesiones/pagos/notas: release controlado desde código desplegado real, delta mínimo, misma URL/deployment; no tratar QA como producción.

### F111: hechos completados que NO hay que repetir

| Área | Resultado verificado | Límite |
|---|---|---|
| Orales: frontend #521, #523, #524, #525 | Fusionados; #525 reemplaza guía provisional por bancos originales B2/I1/I2 (48 unidades) | Una prueba autenticada de borrador/cierre/PDF sigue pendiente |
| Poner al día I2: #526 | Fusionado; botón final I2 y salida visual recuperable de CONAPE | No valida por sí mismo deployment backend |
| Niveles proyectados: #527 | Fusionado; muestra nivel calendario sin fabricar matrículas | Grupo 0426 fue seleccionado por error: **no es el de certificados** |
| CONAPE 17079 | Operación concreta conciliada en CAMPUS_OPERATIVO `CONFIRMADO/OK` | Hotfix general backend #70 no confirmado publicado |
| Certificados grupo `B1-LJ69-B1-0226` | I2 APR: 17079 (97), 17107 (70), 17139 (70). Seis consecutivos y seis PDFs localizados en Drive | Falta confirmar apertura autenticada de PDF desde Campus; **no reemitir ni cobrar** |
| Escritos backend #69 / frontend #522 | Candidatos DRAFT, no fusionados ni desplegados | Reconciliar con backend publicado |
| QZ32 backend #61 / frontend #512 | Candidatos DRAFT, Progress Check 0% | No convertir a evaluación ponderada |

### Limpieza de PR y ramas · Ronda L1

Inventario inicial verificado: **544 ramas frontend + 68 backend = 612**; **10 PR abiertos frontend + 32 backend = 42**. Los conteos de ramas incluyen main y otros trabajos históricos, y no equivalen a 612 proyectos.

- **PR cerrados administrativamente por consolidación** (comentario explicativo preservado): frontend **#519, #520** (QA visual sin producción), **#501** (auditoría documental histórica); backend **#67** (QA oral apilada, candidato integrado selectivamente #69), **#64** (banco privado y endpoint ya candidatos en #69), **#63** (saneamiento EX04 consolidado #69). **6 PR cerrados, 0 merges de esas copias, 0 borrados de datos**. Conteo esperado tras L1: 7 frontend + 29 backend = **36 PR abiertos**; validar nuevamente antes de próxima tanda.
- **Ramas fusionadas candidatas a borrado remoto, previa comprobación de que el merge está preservado**: frontend #521 `fix/f111-d3-keylor-oral-rubric-level-bank-20261018`, #523 `hotfix/f111-oral-l9-session-gate-20261019`, #524 `hotfix/f111-b2-oral-guide-20261019`, #525 `fix/f111-oral-bancos-originales-20261019`, #526 `hotfix/f111-i2-conape-cierre-modal-20261019`, #527 `hotfix/f111-i2-proyectado-visible-20261020`; backend #70 `hotfix/conape-conciliar-historial-extra-20261019`. **No se han borrado ramas**: el conector GitHub actual carece de acción `delete ref/branch`; no hacer un `update_ref --force` como sustituto. Borrarlas únicamente por una herramienta que admita `DELETE` cuando haya conexión autorizada.
- **No cerrar ni borrar todavía:** #69 backend y #522 frontend (escritos); #61 backend y #512 frontend (quizzes); #55 backend y #511 frontend (banco privado/oral, revisar diferencia funcional contra #525); #495/#500 frontend y candidatos de INA backend (normativa pendiente); otros PR con cambios académicos/seguridad únicos. No usar `git merge` masivo ni descartar un PR con trabajo único por su antigüedad.
- **Regla de avance:** antes de releer una copia histórica, consultar primero esta tabla, el PR dueño y el runtime. Una vez cerrado un PR por duplicación, **no volver a hacer la misma auditoría** sin evidencia nueva. En cada pasada registrar PR cerrados, ramas realmente eliminadas, PR activos, estado Pages, backend deployment real y próximo cierre.

### Limpieza L2 · Continuación sin reiniciar auditoría

- Backend PR #25, #53 y #66 cerrados con comentarios: #25 condicionaba APR a pagos (contradice política académica); #53 fast path login sin medición A/B ni despliegue aprobado; #66 era un gateway QA sintético aislado, no código en producción. El contenido sigue accesible por los PR.
- Cierres administrativos F111 acumulados: **9** (frontend #501/#519/#520; backend #25/#53/#63/#64/#66/#67). Inventario tras esos cierres: **7 frontend + 26 backend = 33 PR abiertos**, sin contar el PR de mantenimiento L2. No se alteraron candidatos escritos #69/#522 ni quizzes #61/#512.
- El archivo `.github/workflows/f111_prune_merged.yml` de esta misma pasada elimina refs antiguas únicamente si el PR está cerrado, si la rama pertenece al mismo repositorio y si su SHA coincide con el HEAD registrado en el PR. Solo permite ramas fusionadas o archivadas expresamente en la lista; omite main, release y prod. **No afirmar que una rama fue borrada hasta observar el workflow SUCCESS y consultar refs actuales.**
- La lista inicial del workflow frontend corresponde a #501/#519/#520 archivados, y #521/#523/#524/#525/#526/#527/#528 fusionados. En backend requiere permiso/ejecución independiente: el token frontend no opera sobre el otro repositorio. Prohibido usar update_ref --force para simular un borrado.
- Política académica reafirmada: APR depende de nota, asistencia y requisitos académicos, nunca de mora ni deuda. Cobro y CONAPE son circuitos separados.
- Sin escrituras a Apps Script, Sheets, matrículas, certificados ni CONAPE. Versión Apps Script aún pendiente de consulta remota (readback @462 el 17-oct; documento JSON histórico @460 del 9-oct).

### Limpieza L3 · Barrido GitHub de merges antiguos (20-oct-2026)

- **Frontend #529** fusionado SHA 0fa2b03edcfc593ad93fe5e1cb6fb176c656aa3b. Workflow 39371432380 PASS: 10 ramas frontend confirmadas eliminadas (#501/#519/#520/#521/#523/#524/#525/#526/#527/#528). Su rama temporal y la del #529 también desaparecieron al fusionarse. Ningún alumno, pago o backend modificado.
- **Backend #71** fusionado SHA 84dbe90517ffbed553919fa5e9f2b287b1236e4d. Workflow 39371576330 PASS: 7 ramas (#25/#53/#63/#64/#66/#67/#70) eliminadas. La rama de mantenimiento #71 también desapareció al fusionarse.
- **Frontend #530** fusionado SHA 7d7dfe2d97bab2d1d4516cc9180f9ac53e956f0d. Barrido global seguro (solo PR merged, SHA intacto, mismo repo, sin PR abierto; excluye main/release/prod). Workflow [39372079114](https://github.com/anorteamericana-ship-it/campus-virtual/actions/runs/39372079114) **SUCCESS, MERGED_SWEEP_TOTAL=232** ramas adicionales efectivamente borradas.
- **Backend #72** fusionado SHA fd35c0f2c4a47ed2b25a079a7561c8596f09e8f8. Workflow 39372204001 PASS: **30 ramas adicionales** antiguas fusionadas eliminadas (logs `MERGED_SWEEP_DELETED`). Tras el barrido la API listó **31 ramas backend**; los 26 PR todavía abiertos conservan sus candidatos.
- **Cierres PR vigentes:** 9 históricos archivados en L1+L2; abiertos: 7 frontend + 26 backend = 33. #69/#522 escritos y #61/#512 quizzes NO se fusionaron ni eliminaron.
- **Evidencia global L1-L3**: 10 refs frontend + 7 backend eliminadas en listas L1/L2, dos ramas temporales de #529/#71 eliminadas por automatismo, 232 frontend y 30 backend del barrido, más las ramas temporales #530/#72 eliminadas tras merge: **al menos 283 eliminaciones confirmadas**, con historial PR preservado. En consulta de API posterior: **304 ramas frontend + 31 backend = 335** ramas aún existentes (incluye la rama temporal de esta documentación); no inferir cifras desde el conteo histórico 612 porque hay ramas concurrentes nuevas y snapshots de distinto momento. GitHub Pages del frontend #530: [39372078722](https://github.com/anorteamericana-ship-it/campus-virtual/actions/runs/39372078722) SUCCESS.
- **Regla de no-repetición:** NO reexaminar los PR cerrados #501/#519/#520 y #25/#53/#63/#64/#66/#67, ni los fusionados #521/#523/#524/#525/#526/#527/#528/#529/#530 y backend #70/#71/#72. Ya hay evidencia de cierre/merge y sus repositorios conservaron main.
- L3 de borrado de branches fusionadas queda **CERRADA** y no debe reauditarse. Las 335 restantes incluyen PR abiertos, releases, refs huérfanas o PR aún no fusionados: clasificarlas por trabajo único antes de borrar, sin otra campaña indiscriminada. **Siguiente prioridad real:** leer deployment Apps Script efectivo antes de cualquier push. Último readback acreditado @462 el 17-oct; no hay readback más reciente.

### F111 L4 · Conciliación Apps Script sin inventar versión (19-oct-2026 hora CR)

- Rondas L1–L3 quedan CERRADAS; no repetir barridos de merges antiguos. Recuento API de hoy: **303 ramas frontend / 31 backend = 334** y **7 PR frontend / 26 backend = 33 PR abiertos**. Valores de snapshot, no números objetivo de eliminación; las restantes tienen trabajo único o carecen de comprobación de integración. Frontend main `dbe8d3000f14bdc73548ec512b8c95dc75691830`; backend main `fd35c0f2c4a47ed2b25a079a7561c8596f09e8f8`. Esta pasada NO borró refs ni cerró más PR.
- Comparación comprobada por API GitHub `campus_backend/prod-460...main`: **116 commits de adelanto, 13 archivos en `prod/` modificados/agregados y otros 30 archivos**. `main` no corresponde automáticamente al runtime. La versión de deployment activa hoy **NO está acreditada**: último readback escrito @462 el 17-oct; `deploy/README_deploy.md` aún menciona @431, un dato histórico incompatible con los readbacks posteriores.
- **Hallazgo decisivo**: en `prod/48_CONAPE_Performance_Acceso_Academico.js`, la comparación `prod-460...main` incluye DOS cambios funcionales distintos: (A) protección de caché/rol del Panel Maestro (G1), y (B) hotfix conciliación CONAPE #70 (71 líneas añadidas y cambio de código/operación). Por tanto, NO desplegar el archivo entero de main como parche único sin readback del deployment actual: riesgo de incorporar/cambiar código que no pertenece a ese release.
- Backend PR #70 está MERGED, pero `clasp push/deploy` real no verificado. El asiento CONAPE de 17079 ya fue conciliado individualmente en Sheets, con 6 PDF del grupo 0226 existentes. No reescribir pagos ni volver a emitir certificados.
- Bloqueo único para release backend: sesión autorizada del Apps Script de producción (Deploy > Manage deployments sobre deployment estable, leer número de versión y export/readback de dicha versión). La conexión de ChatGPT actual proporciona GitHub y Drive, **no** la lectura autenticada de `script.projects.deployments.list` ni `clasp deployments`, y Browser reporta falta de contexto conectado. No adivinar @463 ni lanzar GitHub Actions de deployment sin credenciales/configuración verificada.
- **Siguiente acción al recibir versión**: comparar por archivo el código de la versión publicada contra snapshot `prod-460` y `main`, preparar delta solo de las funciones necesarias de `48_CONAPE` conservando la protección G1 ya publicada si aplica, y actualizar el mismo Deployment ID. Luego comprobar CONAPE en el Campus real, sin repetir pagos. Continuar orales/escritos/quizzes desde PR candidatos ya clasificados.

### Orden ejecutivo pendiente (sin reabrir fases cerradas)

1. Confirmar/verificar eliminación remota de ramas fusionadas y cerrar PR obsoletos por lotes comprobados. **Solo un inventario canónico aquí.**
2. Consultar deployments Apps Script PROD actuales y hacer delta sobre esa versión antes de publicar #70 u otro backend.
3. Cerrar **una** evaluación oral real docente con borrador, nota y PDF, sin alterar grupo en vivo innecesariamente.
4. Reconciliar y desplegar escritos con pesos INA/SIN INA; conservar integridad de notas.
5. Integrar QZ32 sin ponderación y asociar a Progress Check; cerrar pruebas y branches experimentales luego de publicar.

### Observación puntual de CI

El run GitHub Pages #527 terminó SUCCESS, pero el workflow histórico `F111 D1 HOTFIX · centro superadmin único` falló en main por una aserción de cache-bust con URL antigua. Eso **no** invalida Pages, pero debe corregirse en su gate sin debilitar pruebas de motor. No declarar automáticamente 100% de CI post-merge.

---


## F111 R0 · referencia inmutable de código @460 (13-oct-2026)

**Código desplegado @460:** tag anotado de `campus_backend` **`prod-460`**, commit **`956bf9ae84c9df7f6378de2e56a373a9dc69d964`**. El tag se generó tras el merge R0 #49 y su contenido `prod/` coincide **32/32 SHA-256 normalizado LF**, sin archivos faltantes ni adicionales, con el export independiente de PROD. El despliegue estable de Apps Script sigue en **@460**; no hubo `clasp push` ni deploy.

**Desarrollo ≠ producción:** desde el merge #36 (`f2712c6c55b5a7fdcea570cd8ed30029aa59a15c`), **`campus_backend/main` contiene cambios que NO están desplegados**. Otros merges hacia @461 ampliarán esta diferencia. Nunca llamar a `main` el código exacto de @460; su referencia es `prod-460`.

**F111 · síntoma → causa → prueba → reparación → prevención:** El registro @460 identificaba incorrectamente `backendMain=ef817145…` como 32/32 idéntico a PROD → el 9-oct se comparó PROD contra una carpeta candidata local, no contra la rama main → R0 #49 demostró 7 diferencias; Claude cotejó 32 hashes con export independiente → se fusionó R0 y se fijó el tag anotado `prod-460` en `956bf9ae84c9df7f6378de2e56a373a9dc69d964` → cada puerta compara contenido de `git show prod-460:prod/<archivo>` con PROD y con `git show main:prod/<archivo>`, admitiendo en main únicamente la allowlist del release.


Última verificación operativa de frontend F105: **2026-10-09 ~21:10 -06:00**. Las secciones históricas del corte CONAPE V1 @436 permanecen como evidencia de esa fecha.

## Estado actual · F105 perfil estudiantil y saldo visual (2026-10-09)

- **Backend:** Apps Script deployment estable sigue en **@460**, sin cambios de código ni escrituras financieras.
- **Frontend:** PR **#486** fusionado, commit **9ab6621135497bdac204115dcb09ff40060bdae2**, GitHub Pages **SUCCESS**. En el dominio público campus.html referencia primitives.jsx con cache-bust F105STUDENTPROFILE20261009 y el JS incorpora studentProfileShouldRefresh.
- **Síntoma E2 autenticado:** sesión abierta por más de dos horas retenía en memoria React la ficha antigua; presentaba matrícula pendiente pese a recibo confirmado y grupo correcto en las hojas.
- **Prueba discriminante:** al invalidar solo la copia client-side y volver a consultar el backend @460, pendientes.matricula pasó de ₡10.000 a ₡0 y la tarjeta de seis a cinco rubros. Ningún movimiento bancario se modificó.
- **Prevención F105:** revalidar en focus, visibilitychange, hashchange, online y revisión cada cinco minutos cuando la página está visible; excluir consultas concurrentes y reintentos frecuentes. Prueba sintética scripts/qa_f105_profile_freshness.mjs **PASS**.
- **Pendiente separado:** revisar la exigibilidad de las cuatro cuotas y el certificado futuro. No confundir saldo contractual con mora. F105 no cambia contratos financieros. No declarar FULL_E2E.

## Estado actual · F103 docente (2026-10-09)

- **Backend PROD:** deployment estable `AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ` en **@460**, misma URL. Rollback disponible **@459**; snapshot inmutable de @459 guardado fuera del repositorio.
- **Integridad:** `clasp pull --versionNumber 460` generó 32 archivos; comparación SHA-256 con candidato F103: **32/32 idénticos, 0 diferencias**. 30 JavaScript pasaron `node --check`; manifiesto JSON válido.
- **Alcance backend:** `guardarAsistenciaBorradorF100` acepta `modo=BORRADOR` para avances parciales mientras la sesión permanece abierta; control de revisión/lock y autorización docente. `getDocenteContactosF103` solo devuelve edad, teléfono y correo de alumnos pertenecientes al grupo autorizado; no entrega fecha de nacimiento.
- **Pruebas backend:** QA local F103 (autoguardado, conflictos de revisión, contactos, permisos) PASS; deployment @460 confirmado en `clasp deployments`, HTTP público 200 y POST anónimo de contactos devuelve `{ok:false,error:sesion_invalida}`.
- **Frontend PROD:** PR **#483** fusionado en main, commit `f1dee806471e2dafcb3163d6ce8310f09f559b99`; Pages **SUCCESS**. Dominio público sirve `src/app.jsx` con cache-bust F103 y `src/teacher_views.jsx` con llamada `getDocenteContactosF103`. Mis grupos muestra edad/teléfono/correo, y el panel usa autoguardado parcial con 900 ms de debounce.
- **Evidencia pendiente:** prueba autenticada del docente con grupo real y confirmación de recuperación de borrador al reabrir; ensayo de cierre solo con datos de prueba autorizados; observar error intermitente en navegador. No declarar `FULL_E2E` ni diagnóstico causal del fallo intermitente.

### Nota sobre el historial

El bloque siguiente documenta el **corte histórico @436 de CONAPE Prospectación V1 (2026-10-04)** y no debe confundirse con la versión productiva vigente @460.

## Apps Script PROD

- Script ID: `1kV4wKnD_OU5DPQSawScjPsUbo1MOg_rAHbtpYupSMPkqywIVSQwdV4y2`
- Deployment ID estable: `AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ`
- URL estable: `https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec`
- Version desplegada: **@436**
- Version estable anterior / rollback inmediato conocido-bueno: **@434**. La V1 no usa @435 como rollback operativo sin una verificación separada.
- Release actual: **CONAPE Prospectación V1 · importador CSV + estado actual + eventos persistentes + semáforo 7/14 + panel de Ventas**.
- Reconciliacion backend: **campus_backend/main = 4c5549150cf1fb2cb26cc49db077b2744cf0e6f1**; PR backend **#7** implementó V1 y PR **#8** preservó desembolsos de prospectos vistos por primera vez ya avanzados.
- Promocion backend: el Deployment ID estable fue verificado en **@436**. Readback inmutable: **28/28 archivos**, **26 JS**, **0 drift normalizado**, sintaxis PASS y SHA agregado **1c5c14878ac692d511ee8e6b02da25bcb2759f0bb1ba26285bb7da75276d585f**.
- Frontend vigente: PR **#405** publicó el panel CONAPE Prospectación V1; main productivo verificado: **b0d208730ebe7bd6b87826e458204ad1a6d04315**. Pages SUCCESS y el dominio real sirve ventas_conape_prospectacion_v1.jsx?v=CPV1-20261004.
- Verificacion HTTP/runtime V1: **PASS**. Root Apps Script HTTP **200**; getConapeProspectacionVentas, previsualizarConapeProspectacionCsv e importarConapeProspectacionCsv rechazan acceso anónimo con sesion_requerida.
- Verificación autenticada V1: **PASS para línea base y panel**. Superadmin previsualizó el CSV real de CONAPE con **59 registros**, baseline=true y **0 movimientos persistentes**; luego importó la línea base. CONAPE_PROSPECTACION_ACTUAL quedó con **59 filas** y CONAPE_PROSPECTACION_EVENTOS con **0 eventos**, evitando alertas históricas falsas. El panel filtrado por ASESOR_REF mostró correctamente **1** registro para Camila Solis.
- Límite de evidencia V1: todavía **no ha ocurrido un movimiento CONAPE real posterior a la línea base** para observar en PROD su persistencia y envejecimiento verde 0-6 / amarillo 7-13 / rojo 14+. Esa parte queda cubierta por QA sintético y código, pero no se declara E2E real hasta que ocurra un cambio externo. **FULL_E2E sigue false**.
- Excepción procedimental C2-R10: el `clasp push` normal devolvió `Skipping push`; se terminó usando `clasp push --force` desde la carpeta temporal aislada que contenía únicamente el candidato aprobado. El pull post-push dio **0 drift** contra ese candidato. **Esto no modifica la regla general de no usar `--force`; queda registrado como excepción histórica, no como procedimiento recomendado.**

### CONAPE Prospectación V1 · evidencia de corte @436

- Fuente operativa: reporte Oracle APEX de Prospectación Reclutador con Academia Norteamericana + Plataforma de Servicios + Rows=All.
- CSV real observado: **59 prospectos, 14 columnas**, codificación Windows-1252. El importador valida por encabezado y tipo; no depende de posición.
- Estado actual persistente: CONAPE_PROSPECTACION_ACTUAL, **59 filas** después de la línea base del 2026-10-04 14:45:15 -06:00.
- Eventos persistentes: CONAPE_PROSPECTACION_EVENTOS, **0 filas** inmediatamente después de la línea base; esto es intencional para no convertir historia previa en alertas nuevas.
- Semáforo contractual: **NUEVO 0-6 días, PENDIENTE 7-13 días, VENCIDO 14+ días**, basado en DETECTADO_EN, no en cantidad de refresh.
- Alcance Ventas: getConapeProspectacionVentas filtra rol ventas por PROSPECTOS.ASESOR_REF; admin/superadmin puede usar scope de asesor.
- Separación de dominios: Estado CONAPE externo se muestra separado de ETAPA del Campus; V1 no sobreescribe ETAPA automáticamente.
- El WS viejo GetEstudiantesFinanciados se conserva como segunda fuente; V1 no lo reemplaza ni lo modifica.
- Reclutar Prospectos / automatización APEX **no forma parte de V1**.

### Incidente OAuth histórico resuelto durante el release @419

Después del primer movimiento a @419, login y verificación de cédula devolvieron un error real de backend:

`No cuentas con el permiso para llamar a SpreadsheetApp.openById`

El rollback temporal a @417 reprodujo el mismo error, lo que descartó una regresión específica de @419. `appsscript.json` sí contenía el scope `https://www.googleapis.com/auth/spreadsheets`.

Causa operativa: faltaba/requería renovarse la autorización OAuth del usuario que despliega el Web App (`executeAs: USER_DEPLOYING`). Se ejecutó una función read-only segura desde el editor de Apps Script para forzar la pantalla de autorización y se aprobaron los scopes. Después de eso el Campus volvió a autenticar correctamente. El deployment volvió a @419 y el formulario público real avanzó hasta Paso 5.

Regla futura: si `SpreadsheetApp.openById` devuelve falta de permiso y el error persiste al volver de versión, revisar **OAuth del usuario desplegador** antes de cambiar código o datos.

## Frontend público

- Rama productiva: `main`.
- Frontend productivo publicado/verificado por Pages: **b0d208730ebe7bd6b87826e458204ad1a6d04315** (main, merge de PR #405).
- PR **#395**: Mi Perfil quedó exclusivamente en `#dashboard`; `#perfil` y `#perfil_estudiante` resuelven a dashboard; el estado azul del menú se sincroniza con la ruta visible y contempla clic repetido + Atrás/Adelante.
- PR **#396**: elimina la interferencia residual de `additional_resources_panel_cs21a68.jsx` sobre el sidebar estudiantil; «Recursos adicionales» conserva correctamente el estado azul.
- PR **#398**: C2-R13 corrigió la reapertura privada de matrícula firmada histórica en Ventas; tuvo QA autenticado real PASS antes de este corte.
- PR **#400**: C2-R14 conectó Cédula frente, Cédula dorso y Título a entrega privada y aplicó el ciclo de firma de una sola carga para Ventas.
- PR **#401**: C2-R14C agrega a Admin apertura de la última matrícula firmada y carga de nuevas versiones conservando históricos; no duplica el generador de matrícula.
- PR **#402**: mantenimiento de CI/guards descendant-safe; **sin cambio de runtime**.
- PR **#405**: CONAPE Prospectación V1 en Ventas: panel persistente, estado actual, semáforo 7/14 y carga CSV restringida a admin/superadmin.
- Verificación de publicación V1: GitHub Pages **SUCCESS** sobre b0d20873; el dominio real sirve ventas.html con la referencia CPV1 y src/ventas_conape_prospectacion_v1.jsx HTTP 200 con build CONAPE_PROSPECTACION_V1_UI_20261004.
- PR **#394** queda supersedido por #395; no usar su ruta estudiantil `PerfilView` como referencia funcional.
- PR #118: mergeado; scanner/documentos CONAPE publicados.
- PR #119: mergeado; hotfix visual de tildes/símbolos del Paso 5 + cache-bust.
- PR #115: mergeado después; cambia únicamente documentación/configuración/skills de operación y auditoría, **sin modificar el comportamiento del frontend público**.
- La página pública de inscripción fue abierta en incógnito y alcanzó Paso 5.

No usar un SHA de documentación posterior como prueba de una nueva validación funcional del navegador. Registrar por separado el `main` vigente y el último commit de comportamiento realmente probado cuando difieran.

### Limitación que permanece abierta

Todavía falta una **inscripción controlada completa desde el formulario visual real en PROD**, con envío de frente + dorso + título y verificación posterior de que los tres archivos y `documento_identidad_solicitante.pdf` quedaron privados. Hasta esa prueba no declarar `FULL_BROWSER_E2E=PASS`.

## English LAB · estado de producto

- Memory Match: **FROZEN_DEFERRED_NON_BLOCKING**.
- Memory Match volvió a responsabilidad técnica de ChatGPT, pero no forma parte del camino crítico del cierre actual y no debe reabrirse por iniciativa del agente.
- Los PR #81, #82 y #83 son históricos/evidencia; no son requisitos del release.
- Cierre vigente: Sentence Order + Hangman + Quiz Time + Word Search + shell/routing/mobile.
- Quiz Time: frontend `MITIGATED_CLIENT_SIDE`; Issue #80 mantiene pendiente la idempotencia backend/`attempt_id`.
- El Issue #78 vigente es la fuente canónica para el próximo chat de English LAB.

## GitHub como fuente de verdad

Para cambios de código del Campus, **GitHub es la fuente de verdad de desarrollo**. Drive puede conservar respaldos y artefactos operativos, pero no decide qué código está vigente.

Para Apps Script productivo, la fuente de verdad de runtime es el **Deployment ID estable + versión numérica desplegada**, verificados mediante sesión `clasp` autenticada y/o verificación funcional. El HEAD remoto de Apps Script puede contener cambios no publicados y no equivale a producción por sí solo.

## Regla de actualización

Actualizar este documento y `config/apps-script-production.json` cuando exista evidencia suficiente de:

1. deployment remoto verificado;
2. versión numérica inmutable conocida;
3. el mismo Deployment ID apuntando a esa versión;
4. prueba funcional correspondiente cuando el cambio afecte un flujo real.

## Accesos operativos útiles

Editor Apps Script PROD:
`https://script.google.com/home/projects/1kV4wKnD_OU5DPQSawScjPsUbo1MOg_rAHbtpYupSMPkqywIVSQwdV4y2/edit`

No depender de una URL `/deployments`: devolvió 404 en este proyecto. Usar desde el editor:
`Implementar → Administrar implementaciones`.

## Prohibiciones

- No hacer `clasp push --force`.
- No usar `clasp push --watch` para una liberación ordinaria.
- No desplegar un `Code.gs`/`Código.js` completo viejo sobre una fuente acumulada nueva para cambiar una sola función.
- No usar copias locales antiguas para preparar producción.
- No crear otro Deployment ID para una corrección ordinaria si el existente puede moverse de forma controlada.
- No guardar contraseñas, tokens, cookies ni credenciales en este archivo o en el JSON de configuración.
