# F111 · G0-D — Subpestañas, navegación dinámica y exámenes

**Corte E0:** 10-oct-2026. Fuente `campus-virtual/main` `553fac61` y `campus_backend/main` `ef817145`. **24 filas** en `F111_G0D_SUBPESTANAS_ACCIONES_E0_20261010.csv`; son rutas/acciones estáticas, no pruebas funcionales. `PR #501` únicamente documentación, sin modificaciones de código productivo.

## Subpestañas del estudiante comprobadas por código

| Ruta principal | Subpestañas que renderiza | Evidencia | Clasificación |
|---|---|---|---|
| Mi curso | Cronograma, Materiales, **Tareas** | `src/student_experience.jsx` 44–75 | Tareas = Próximamente explícito; cronograma/materiales usan componentes `window.*` globales a probar con lazy-loader |
| Evaluaciones | Próximas y activas, Resultados, Reposiciones | `src/student_experience.jsx` 76–102 | Resultados monta NotasView; Reposiciones monta SolicitudesEstudianteView; Próximas usa renderUpcoming y el iframe de exámenes |
| Documentos y ayuda | Programa y documentos, **Avisos**, Ayuda y contactos | `src/student_experience.jsx` 239–268 | Avisos = Próximamente explícito; Programa incluye descarga privada `descargarMatriculaFirmadaPrivada` |
| Resultados | Selector nivel B1/B2/I1/I2 y filtros Todo/Orales/Escritos/Progress Check | `src/student_modules.jsx` 535–589 | Filtros UI no constituyen verificaciones de nota oficial |

### Dependencias dinámicas y rutas antiguas

`src/app.jsx` `F96_LAZY` (~64–127) incluye cargas diferidas distintas para `student_course`, `student_evaluations`, `student_documents`. La tabla `STUDENT_ROUTE_ALIASES_F984` (~130–139) reconduce nombres antiguos: `solicitudes_estudiante` → `evaluaciones/reposiciones`, `notas` → `evaluaciones/resultados`, `tareas` → `mi_curso/tareas`. **No clasificar** estos alias como rutas rotas sin contrastar la normalización. Tampoco afirmar que las dependencias diferidas cargan exitosamente sin una prueba de navegador.

## Hallazgos de efectos y permisos

**G0-D01 · Abrir Resultados puede disparar escritura (estático CONFIRMADO).** `NotasView` (`src/student_modules.jsx` 493–529) monta efectos separados: uno llama `getMisNotasF921` y otro `reposMiEstadoF92`; el segundo invoca reconciliación con `_reposF91_set_` en `campus_backend/main` (`prod/02_Auth_Sesiones_Usuarios.js` 10743–10779). Por ello no se puede ejecutar la subpestaña de Resultados como prueba E2 estrictamente de solo lectura sin aislar el estado.

**G0-D02 · Documentos firmados requieren evidencia E2.** `StudentSignedEnrollmentPrivateF984` (`src/student_experience.jsx` 165–235) pide `descargarMatriculaFirmadaPrivada` por POST con token, valida MIME/bytes y opcional SHA256 en navegador. El frontend no sustituye la validación de pertenencia en backend; probar propio/ajeno y las ACL efectivas sobre Drive con cuentas de ensayo.

**G0-D03 · Exámenes escritos, iframe (E0).** `src/app.jsx` `ExamenesIframePanel` monta `modulos/examenes.html?view=...`; `src/examenes_app.jsx` 117–185 exige iframe con sesión en parent, usa lista de vistas permitidas (student/teacher/admin) y bloquea roles cruzados. `examPostLive` (líneas 207–249) obtiene token y URL del parent. Debe verificarse además autorización efectiva **por endpoint** en backend para `examGetStudentLivePanel`, `examGetStudentAssignment`, `examStartAttempt`, `examSaveAttemptDraft`, `examSubmitAttempt` y `examHeartbeatAttempt`; un bloqueo visual no es protección suficiente. Inicio/guardado/entrega no son pruebas E2 de lectura, sino **E4 con datos ficticios**.

**G0-D04 · Autoguardado docente es escritura (E0).** `src/teacher_views.jsx` 969–1025 carga y guarda `getAsistenciaBorradorF100` / `guardarAsistenciaBorradorF100`. Debe ensayarse idempotencia, revisión y cierre de sesión en E4. No confundir con guardar asistencia final.

**G0-D05 · Pendientes docente tiene tres pestañas.** `src/vista_docente.jsx` ~395–425: `Próximas`, `Histórico`, `PRE-Campus`; la vista utiliza `fetchCalendarioDocente` y `fetchTareasPendientesDocente` (`src/data.jsx` líneas ~30–46). Completar Progress Check (`vista_docente.jsx` ~969) llama `completarProgressCheckCerradoF98Z6K`; en `prod/02_Auth_Sesiones_Usuarios.js` ~2628 valida `_f77_authTeacher_` y `_f77_canGroup_` antes de registrar datos. `postCerrarLeccionCompleta` (~1138) es otra ruta de escritura. Son casos E4 a aislar.

**G0-D06 · Comunicados docente es solo placeholder activo visualmente.** `src/app.jsx` ruta `mensajes` monta `MensajesView`; `src/student_modules.jsx` ~639 define esta vista con `EmptyState` indicando que los comunicados estarán próximamente disponibles. Esto no es un fallo de backend comprobado, pero **no debe contarse como funcionalidad implementada**. El equivalente estudiantil `Avisos` también está marcado explícitamente Próximamente.

**G0-D07 · Precaución notas INA en MAIN.** `NotasView` en `src/student_modules.jsx` aún calcula `totalPuntos` y `avgLevel` de las filas del frontend y muestra “evaluaciones registradas X/7” (`~535–589`). El contrato histórico de escritos INA 5/15 sigue pendiente en ramas F111 no fusionadas; no utilizar esta vista como evidencia de corrección de ponderación en producción. Las reglas oficiales de pesos se verifican en G2, no se infieren de la UI.

## Siguientes controles de G0

- [ ] Cruzar `src/data.jsx` y `src/examenes_modes.jsx`/HTML embebido para identificar **todos** los handlers dinámicos y transiciones de exámenes.
- [ ] Verificar E0 de cada handler en backend: sesión, rol, propiedad, fuente Sheets/Drive, actividad de escritura y posibilidad de inicialización silenciosa.
- [ ] Analizar Admin/Ventas/Visitante con la misma granularidad de botón que Estudiante y Docente, incluyendo GET y prefijos no literales.
- [ ] Preparar E2 real **solo lectura** con cuentas ficticias en staging, excluyendo `reposMiEstadoF92` y todo endpoint con efecto; E4 para borradores/exámenes/cierres sobre Sheets aisladas.
- [ ] Separar MAIN y stacks F111 aún en PR. No se declara G0 terminada y no hubo despliegue.

**Fuera de alcance:** crear grupos o automatizar SIFA, nuevas funciones de CONAPE o modificación de datos académicos y financieros reales.
