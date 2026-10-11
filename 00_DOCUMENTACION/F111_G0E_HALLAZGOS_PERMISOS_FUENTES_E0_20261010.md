# F111 · G0-E — Permisos, propiedad de expediente y fuentes de datos

**Corte:** 10-oct-2026 · E0 estático. Referencias: `campus-virtual/main` @ `553fac61`; `campus_backend/main` @ `ef817145`. PR documental [#501](https://github.com/anorteamericana-ship-it/campus-virtual/pull/501), maestro [#499](https://github.com/anorteamericana-ship-it/campus-virtual/issues/499).

## Resultado medible

CSV asociado: `F111_G0E_ENDPOINTS_PERMISOS_DATOS_E0_20261010.csv` con **37 endpoints** rastreados a su primera guardia, política de propiedad, fuente de datos conocida/indirecta, efecto y tipo de prueba aún pendiente. Son 37 rutas revisadas **en código**, no 37 ensayos E2 ni cobertura exhaustiva de `doPost`/`doGet`.

Verificación de integridad documental: 37 filas/10 columnas; los archivos backend citados se encontraron en el árbol `main` (0 referencias inexistentes). No se inspeccionaron secretos ni se invocaron endpoints de producción. La determinación de ejecución real requiere comparar Apps Script desplegado y pruebas aisladas.

## G0-E01 — P0 POTENCIAL, seguridad de caché Panel Maestro

**Cadena de evidencia E0:**

1. La ruta final `doPost(e)` atiende `getsuperadminmasterdashboard` directamente en `prod/01_Router.js` ~4787, antes de delegar al dispatcher central y sin ejecutar la autorización común.
2. `getSuperAdminMasterDashboard` en `prod/40_QA_Smoke_Base.js` ~711 **sí valida** `_esAdminOSuperadmin(body)` antes de leer caché/hojas.
3. `prod/48_CONAPE_Performance_Acceso_Academico.js` ~47–57 **reemplaza** `getSuperAdminMasterDashboard` por un wrapper que consulta caché global `CS21A98_MASTER_FRESH` (o STALE cuando `allowStale`) y devuelve el valor **antes** de invocar el método base que sí comprueba la sesión.
4. El panel base contiene información administrativa agregada desde DATOS, PAGOS, PROSPECTOS, ESTATUS, GRUPOS, ASISTENCIA, EXAM_ATTEMPTS y otras fuentes, aunque su función de sanitización también reduce partes del payload. El impacto exacto requiere revisión del JSON cacheado.

**Conclusión:** en `main` existe una vía condicionada por caché poblada donde una ruta directa parece devolver resultados sin comprobar sesión en el wrapper. **No se confirmó explotación, respuesta no autorizada, ni si el deployment @460 contiene idéntico código.** No probar contra producción. Priorizar revisión G1, corrección fail-closed y ensayo E1 con CacheService falso y sesiones válidas/inválidas; impedir cualquier retorno de caché antes de autorizar. Para E2 usar solo staging y datos ficticios.

## G0-E02 — P1, consulta pública que modifica GRUPOS

`getGruposDisponibles(params)` (`prod/10_Estudiantes.js` ~2509–2569) es allowlist pública POST sin sesión (`prod/01_Router.js` ~2397–2442). Si no existe la columna `DISPONIBLE_INSCRIPCION`, ejecuta `ws.getRange(...).setValue(...)` al leer el catálogo. La condición podría no presentarse en producción; **no afirmar que hoy esté escribiendo**. Separar provisión de esquema administrativa de la consulta pública antes de clasificarlo para E2 read-only. Ensayo E4 con GRUPOS ficticia sin encabezado.

## G0-E03 — P1, consultas de exámenes que preparan configuración

`examGetStudentLivePanel` (`prod/02_Auth_Sesiones_Usuarios.js` ~467), `examGetStudentAssignment` (`prod/13_Examenes.js` ~635) y `examGetCronogramaExamAvailability` (`prod/02_Auth_Sesiones_Usuarios.js` ~447) llaman `_examSetupSheetsInternal_` si pasan sus guardias. La preparación (`prod/02_Auth...` ~124–223) usa caché/PropertiesService, puede crear hojas, añadir claves a `EXAM_CONFIG` y cambiar `STUDENT_EXAMS_ENABLED`, `TEACHER_REAL_REVIEW_ENABLED`, `EXAM_PUSH_TO_NOTAS_ENABLED` a `YES` cuando no estaban listos.

Por tanto **no son lecturas puras para una base recién provisionada o desactualizada**. Tampoco está demostrado que hoy toquen la configuración: la bandera/caché puede evitar la rama. E4 controlado con una copia aislada de configuración. No automatizar cambios de opciones reales durante la auditoría.

## G0-E04 — P1, alcance docente de ficha estudiantil

En `prod/01_Router.js` ~1912–2020, `getEstudiante` figura en `estudianteCampus` (student/teacher/admin/superadmin). `_an4406_validarPropiedadPost_` ~2175–2330 aplica código propio a `student` pero no tiene restricción de código/roster específicamente para `teacher` en este endpoint; las protecciones docentes listan operaciones por grupo diferentes. La ficha se construye con `getEstudiante(codigo)` en `prod/40_QA_Smoke_Base.js` ~1330 y wrappers caché/demos de `prod/43` y `46`.

**Decisión pendiente de política:** confirmar si el docente debe poder consultar fichas de estudiantes fuera de sus grupos y qué campos personales/financieros debe ver. Esto es una **brecha potencial de alcance**, no un acceso indebido demostrado: la política institucional autorizada aún no está documentada y el deployment no se probó. E1 con autorización docente-grupo y E2 de rechazo entre dos grupos ficticios.

## G0-E05 — P1, lecturas con sincronización/vencimientos

`reposMiEstadoF92` (student) invoca helpers de sincronización y `_reposF91_set_` (`prod/02_Auth...` ~10739–10779); `reposListarSolicitudesF92` (admin) también procesa vencimientos. Una pestaña de resultados o solicitudes **puede modificar ESTADO**, así que no son candidatos de E2 de solo lectura. Su control de sesión sí existe en los handlers (`_reposF92_studentAuth_`, `_reposF92_adminAuth_`). Se necesita E4 con comparación antes/después e idempotencia.

## G0-E06 — Controles positivos localizados

- **Docente F100:** `getAsistenciaBorradorF100` y `guardarAsistenciaBorradorF100` se protegen mediante `_f100Session_` con `_f77_authTeacher_`, `_f77_canGroup_`, sesión ABIERTA, ID exacto y docente asignado (`prod/53_Asistencia_Borrador_Docente.js` ~25–150). El guardado usa lock, versión `REVISION`, roster y límites de comentarios: candidato E4 para concurrencia, no prueba completa de cumplimiento.
- **Calendario y pendientes docentes:** la guardia central comprueba `_sec006cDocenteCoincideSesion_` si el rol es docente (`prod/01_Router.js` ~2300–2310), aunque los handlers de `prod/11_Docentes_Clases.js` reciben `cod_docente` directamente.
- **Mis Notas F921:** usa `_reposF92_studentAuth_` y toma código de sesión (`prod/02_Auth_Sesiones_Usuarios.js` ~10698), no del código suministrado como autorización.
- **Descarga certificada:** `descargarMiCertificadoPrivado` verifica `_auth_session`, rol, igualdad de código para estudiante y límite de 5 solicitudes por minuto (`prod/10_Estudiantes.js` ~8067–8158). La ACL de Drive y una sesión ajena siguen pendientes de prueba.
- **Prospectación Ventas existente:** `getConapeProspectacionVentas` filtra cartera por asesor tomado de sesión (`prod/50_CONAPE_Prospectacion_V1.js` ~963); el router también fuerza asesor en lecturas de panel de Ventas.
- **Auditoría CONAPE manual:** `auditarMorosidadConapeManual` delega en `_conapeBdStudentAudit_`/`_conapeBdGlobalAudit_`, y ambos comprueban `_conapeAxAuth_` (`prod/41_CONAPE_Auditoria_Finanzas.js` ~1687/1724). No declararlo bypass por no ver un guard en el wrapper.

## G0-E07 — Fuentes y rutas aún sin cierre

| Fuente | Operaciones conocidas | Riesgo / falta |
|---|---|---|
| **SHEET_ID (APOLLO)** | DATOS, ESTATUS, GRUPOS, PROSPECTOS, USUARIOS, PAGOS | control de propiedad, inicialización y consultas masivas |
| **OPERATIVO_ID** | CALENDARIO_LECCIONES, DOCENTE_ASISTENCIA_BORRADOR, PROGRESS_CHECK, EXAM_CONFIG/ATTEMPTS, REPOSICIONES | lecturas que sincronizan o crean hoja, locks y tiempos de carga |
| **DriveApp** | certificados PDF, matrícula firmada, biblioteca | sesión propia, ACL privadas, denegación a expediente ajeno |
| **CacheService/PropertiesService** | Panel Maestro, EXAM_SETUP_READY, certificados, fichas | autorización antes de responder caché; posible escritura de propiedades desde GET lógico |
| **CONAPE Sheets externas** | 4-estudiantes, 5-plan, 6-historial, 7-morosidad | auditorías delegadas, sincronizaciones con escritura |
| **Railway / servicios externos** | aún sin traza completa desde rutas inventariadas | **NO VERIFICADO**; no afirmar conexión de estos endpoints |

## Puertas de verificación siguientes

1. **G1 prioritario (no desplegar desde auditoría):** preparar guard fail-closed en el wrapper de caché administrativa y prueba E1 de token vacío, rol estudiante/docente/ventas y admin válido, tanto FRESH como STALE. Determinar si la instancia desplegada contiene esta cadena con evidencia segura de versión antes de publicar.
2. Clasificar/aislar `getGruposDisponibles` y `_examSetupSheetsInternal_` para que las consultas no creen o modifiquen configuración; E4 con copia ficticia y snapshot previo.
3. Resolver por escrito la política de acceso docente a `getEstudiante`; luego probar propiedad por grupo y minimización PII.
4. Completar recorrido de todos los `doPost` encadenados, incluidos wrappers `prod/48`, y GET públicos; verificar rutas efectivas y fuentes transitivas (no solo función inmediata).
5. Ejecutar E2 autenticado **solo con cuentas de ensayo** en staging para operaciones demostrablemente de lectura, E4 aislado para escrituras/cachés. Medir latencia en G6.

**Estado:** G0-E parcial documentado. PR #501 continúa DRAFT; no se fusionó, desplegó ni ejecutó operación real. Ni SIFA ni nuevas funciones CONAPE forman parte de este trabajo.
