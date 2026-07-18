# Matriz de entrega por rol · CS21A131

Fecha de corte: 18 de julio de 2026  
Repositorio: `anorteamericana-ship-it/campus-virtual`  
Base revisada: `main` posterior a CS21A130

## Objetivo

Esta matriz identifica qué ruta, componente, archivos y contratos de backend sostienen cada opción visible de **Estudiante**, **Docente** y **Superadmin**. No autoriza borrar archivos: una ruta puede depender de componentes globales, wrappers, parches DOM o del cargador diferido aunque el nombre parezca antiguo.

## Fuentes de verdad frontend

- Entrada publicada: `campus.html`.
- Router y mapa diferido: `src/app.jsx` → `F96_LAZY`.
- Menú base docente/superadmin: `src/sidebar.jsx`.
- Menú final del estudiante matriculado: `src/student_menu_academic_cs21a120.jsx` y su guard.
- Cargador: `src/lazy_loader.jsx`.
- Backend consumido: `window.APPS_SCRIPT_URL`, definido en `src/data.jsx`.

## Estado del backend observado

El archivo de Drive observado se identifica como `F98.4-Z6-CS21A79`, no CS21A64. Sus huellas y contratos críticos están en `BACKEND_OBSERVADO_CS21A131.json`.

Bloqueos comprobados:

1. No existe `getAccesoContenidoEstudiante`; la autorización acumulativa cae al fallback del frontend.
2. No existen los endpoints de reserva semanal CS21A122: `getICANPortalEstudiante`, `reservarICANSesionEstudiante`, `cancelarReservaICANEstudiante` y `getICANDocenteReservas`.
3. Sí existen `getBibliotecaNivelEstudiante`, `getAudioPistaEstudiante`, `getMaterialLeccion`, `getEstudiante`, `getICANEstudiante`, `getEvaluacionesEstudiante` y `getSesionClaseEstudiante`.
4. Esto describe el archivo canónico observado en Drive; todavía no demuestra qué revisión está desplegada en la URL de Apps Script.

---

# 1. Estudiante

El estudiante matriculado no usa el menú base de `sidebar.jsx`: `student_menu_academic_cs21a120.jsx` lo reemplaza por el menú académico final.

| Menú visible | Ruta efectiva | Componente / archivos principales | Backend o fuente principal | Estado de entrega |
|---|---|---|---|---|
| Mi Perfil | `#perfil_estudiante` | `student_menu_academic_cs21a120.jsx` → `PerfilView`; `student_modules.jsx` | Sesión + `getEstudiante` mediante hooks compartidos | Requiere QA autenticado de lectura y fotografía |
| Información General del Programa | `#info_programa` | `program_info_shared_cs21a119.jsx` | Documentos institucionales configurados en frontend/Drive | Funcional reportado por usuario |
| Resumen Académico | `#resumen_academico` | `student_portal.jsx`, `student_academic_summary_core_cs21a113.js`, `student_academic_summary_dom_cs21a113.js` | Expediente académico, evaluaciones, asistencia e I CAN | Funcional reportado; falta prueba completa por nivel |
| Calendario académico | ruta estándar `cronograma_grupo` / `mi_curso` | bundle `student_course`: `vista_docente.jsx`, `cronograma_todos.jsx`, `cronograma_grupo.jsx`, `syllabus_views.jsx`, `student_experience.jsx`; cleanup CS21A126 | `getGrupoInfo`, `getFechasGrupo`, `getMaterialLeccion`, sesión de estudiante | Funcional reportado; revisar carga lenta/error de módulo |
| Evaluaciones | `evaluaciones` | bundle `student_evaluations`: solicitudes, `student_modules.jsx`, `student_experience.jsx`; panel de exámenes en `app.jsx` | `getEvaluacionesEstudiante` y endpoints de exámenes/reposiciones | Funcional reportado; QA de oral/escrito pendiente |
| Tareas | inserción DOM después de Evaluaciones | `student_tasks_menu_cs21a126.js` + CSS | Ninguno actualmente; estado vacío honesto | Visible, pero todavía no es un módulo operativo |
| Club I CAN | `ican` | `syllabus_views.jsx` + `ican_participation_cs21a122.js` | Legacy: `getICANEstudiante`; objetivo: endpoints CS21A122 | **Parcial**: avance visible, inscripción semanal bloqueada por backend faltante |
| English LAB | `academia_play` | `academia_play.jsx`, `english_lab_free_access_cs21a66.js` | Contratos English LAB y permisos de sesión | Funcional reportado; revisar piloto y acceso directo |
| Syllabus | `#syllabus_estudiante` | visor de `student_menu_academic_cs21a120.jsx` | PDF de Drive configurado | Funcional reportado |
| Planeamiento por lección | `#planeamiento_estudiante` | `student_content_access_cs21a125.jsx`, catálogo CS21A130, CSS CS21A129 | 128 PDFs estudiantiles de Drive | Corregido; QA visual y permisos por 01/16/17/32 pendiente |
| Plan de Estudio | `#plan_estudio_estudiante` | `student_content_access_cs21a125.jsx` / visor académico | PDF de Drive por nivel | Funcional reportado |
| Cronograma general | `#cronograma_general_estudiante` | visor de `student_menu_academic_cs21a120.jsx` | PDF institucional de Drive | Funcional reportado |
| Libros y Audios | `#libros_audios_estudiante` | `student_books_proxy_cs21a126.jsx`, `book_unit_starts_cs21a60.jsx`, `student_content_access_cs21a125.jsx` | `getBibliotecaNivelEstudiante`, `getAudioPistaEstudiante`; `getAccesoContenidoEstudiante` deseado | Funcional visual; falta QA binario/permisos y backend de acceso |
| Recursos adicionales | `#recursos_adicionales` | `additional_resources_panel_cs21a68.jsx`, `student_content_access_cs21a125.jsx` | `getBibliotecaNivelEstudiante` | Funcional reportado |
| Pagos y estado de cuenta | `pagos` | `student_modules.jsx` + solicitudes de pago | expediente financiero y movimientos reales | Funcional reportado por usuario |
| Certificados | `certificados` | `student_modules.jsx`; integridad administrativa separada | documentos/certificados del expediente | Funcional reportado por usuario |

## Hallazgo visual CS21A131

`student_unified.css` pintaba el fondo del shell y `campus_d_compact.css` volvía a pintar el mismo arte dentro de `.campus-d-root`. La capa `delivery_stabilization_cs21a131.css` elimina solo la segunda composición en Mi Campus y deja una base neutra; no modifica las demás pantallas ni roles.

---

# 2. Docente

El router docente vive en `app.jsx`; el menú visible se define en `sidebar.jsx` y recibe ajustes de orden/etiqueta por archivos CS21A.

| Menú visible | Ruta efectiva | Componente / bundle principal | Backend principal | Estado de entrega |
|---|---|---|---|---|
| Mi Perfil | `perfil` | `PerfilView` de `student_modules.jsx`, mejorado por `teacher_profile_cs21a76.jsx` | perfil/sesión docente y documentos obligatorios | Requiere QA autenticado de foto y datos |
| Mis Grupos | `grupos` | `GruposView`; bundle `teacher_views` | `getCalendarioDocente`, datos de grupo y sesión activa | Prioridad alta de QA |
| Biblioteca del Programa | `materiales` | `MaterialesView` en `syllabus_views.jsx`; visor/libros compartidos CS21A59–75 | `teacherBooksOpenImageBook`, `teacherBooksOpenPdf`, `teacherBooksReadRange` | Revisar rol exacto y que no aparezcan controles superadmin |
| English LAB | `academia_play` | `academia_play.jsx` | permisos English LAB | Piloto; requiere QA docente |
| English LAB Live | `english_lab_live` | `english_lab_live.jsx` | endpoints Live | Marcado Nuevo; no asumir estable sin prueba |
| Exámenes | `examenes` / `examen_oral` | panel en `app.jsx`, `ExamenOralView` y módulos de examen | sesiones, rúbricas, cierre y notas oficiales | Flujo crítico; QA completo obligatorio |
| Cronograma Inglés Conversacional | `cronograma_grupo` | `CronogramaDocenteSeguroF82`; bundle `teacher_views` | `getFechasGrupo`, cierre de lección, asistencia, PC, materiales | Flujo crítico; QA de cierre sin doble envío |
| Club I CAN | `ican` | `ClubICANDocenteView` + wrapper CS21A122 | base I CAN existente; `getICANDocenteReservas` faltante | **Parcial**: agenda base; listado nuevo por reservas bloqueado |
| Comunicados | `mensajes` | `MensajesView` en `student_modules.jsx` | contratos de comunicados | Requiere QA de lectura/publicación según permisos |
| Mis pendientes | `mi_panel_docente` | `VistaDocente`; bundle `vista_docente` | `getTareasPendientesDocente` y agenda docente | Requiere validar carga y contadores |

---

# 3. Superadmin

En `app.jsx`, tanto `admin` como `superadmin` usan el rol visual `admin`; `rolReal` conserva la autorización exacta. Las operaciones exclusivas deben validar **superadmin también en backend**, no solo esconder botones.

| Menú visible | Ruta efectiva | Componente / bundle principal | Backend principal | Estado de entrega |
|---|---|---|---|---|
| Mi Perfil | `perfil` | `AdminPerfilView`; `admin_views.jsx` | sesión/perfil administrativo | QA pendiente |
| Panel Maestro | `dashboard` | `AdminMasterDashboard`; charts/dashboard y parches CS21A27–118 | múltiples consultas maestras, CONAPE, cobranza y métricas | Alto riesgo por cantidad de parches; revisar por secciones |
| Consulta individual | `buscador` | `BuscadorEstudiantes`; `buscador.jsx`, `admin_students.jsx` | `getConsultaIndividualFresh`, `getEstudianteFresh`, comentarios/estado | Flujo crítico; conservar frescura y pagos por nivel |
| Calendario académico | `calendario_grupo` | `CalendarioGrupoOperativo`; bundle calendario | grupos, fechas, seguimiento, suspensiones | Flujo crítico; QA de todos los grupos |
| Supervisión | `supervision` | `PanelAdminSupervision`; bundle supervisión | `getDocentesAtrasados`, cobertura y solicitudes | Endpoint pesado; comprobar spinner/timeout |
| English LAB | `academia_play` | `academia_play.jsx` | permisos staff | Piloto |
| Grupos | `grupos` | `AdminGruposView`; `admin_views.jsx` | grupos y estados operativos | QA pendiente |
| Estudiantes | `estudiantes` | `AdminEstudiantesView`; bundle y parches rápidos CS21A42/99/102 | listado, actualización académica, pagos, CONAPE | Flujo crítico; revisar cada edición rápida |
| Matrículas | `matriculas` | `MatriculasView`; tres archivos de matrícula | matrícula, aperturas, certificados/documentos | Flujo crítico; QA de escritura y duplicados |
| Exámenes | `examenes` | panel administrativo de exámenes | revisión/cierre/notas oficiales | QA obligatorio |
| Auditoría académica | `auditoria_academica` | `AuditoriaAcademicaView` | `getAuditoriaAcademicaGrupo` | Lectura; QA por grupo/nivel |
| Inscripción pública | `inscripcion_admin` | `InscripcionAdminView` | configuración/formulario público | Solo superadmin; QA de permisos y publicación |
| Prematrículas | `prematriculas` | `FreeUserRequestsAdminView` | `freeUserListarSolicitudes` y flujo de prospectos | QA pendiente |
| Solicitudes | `solicitudes` | `SolicitudesUnificadasView` | solicitudes de pago y suspensiones | QA de resolver/rechazar sin doble acción |
| CONAPE y Cobranza | `conape_cobranza` | `ConapeCobranzaView` + panel maestro | seguimiento, historial, morosidad y WhatsApp | Muy sensible; no simplificar sin pruebas de integridad |
| Importar banco | `banco` | `ImportadorBancario`; versión canónica normalizada por lazy loader | importación/validación bancaria | Requiere verificar backend CS21A123/124 antes de entrega |
| Aplicar pago | `aplicar_pago` | `AplicarPago` + guard de comprobante | comprobantes, saldo, aplicación atómica | Flujo financiero crítico |
| Reportes | `reportes` | `ReportesAdminView` | reportes administrativos | QA pendiente |
| Diagnóstico interno | `diagnostico_interno` | `DiagnosticoInternoView` | diagnóstico de hojas/columnas/endpoints | Útil para entrega; QA pendiente |
| Permisos y roles | `permisos_roles` | `PermisosRolesView` | auditoría de roles/permisos | QA y revisión de seguridad obligatoria |

## Opciones que hoy NO se pueden entregar como funcionales

El menú superadmin todavía declara como `proximamente` y deshabilita:

- Finanzas.
- Docentes.
- Horas docentes.
- Club I CAN administrativo.
- Configuración.

Para una entrega limpia hay dos decisiones válidas: construirlas y probarlas, o esconderlas del paquete de entrega. Presentarlas como funcionales sería incorrecto. No deben eliminarse hasta confirmar que ninguna ruta o proceso interno las referencia.

---

# 4. Plan seguro para limpiar `Code.gs`

No se debe recortar el archivo por nombres aparentemente antiguos. El `Code.gs` observado tiene más de 52 mil líneas, wrappers sucesivos y helpers compartidos. Una eliminación manual puede dejar una función visible pero romper una dependencia indirecta.

Orden recomendado:

1. Congelar una copia y hash del archivo canónico observado.
2. Ejecutar QA real de cada menú y registrar los endpoints efectivamente llamados.
3. Cruzar esos endpoints con el router `doPost`, permisos y dependencias internas.
4. Detectar funciones top-level duplicadas y wrappers que sustituyen definiciones anteriores.
5. Construir un grafo `endpoint → funciones auxiliares → hojas/Drive/propiedades`.
6. Preparar un candidato limpio sin cambiar reglas de negocio.
7. Validar sintaxis, rutas, permisos, lecturas y escrituras sensibles.
8. Probarlo en una implementación separada antes de reemplazar producción.
9. Solo después entregar un único `Code.gs` completo, con tamaño, hash, respaldo y versión verificables.

## Criterio de entrega

Un menú se considera entregable únicamente cuando:

- carga sin error con sesión real del rol;
- no muestra datos inventados;
- sus endpoints existen en la versión desplegada;
- los permisos se validan en backend;
- la acción de escritura se confirma una sola vez;
- móvil y escritorio son utilizables;
- recargar, volver atrás y cambiar de menú no duplican componentes ni solicitudes.
