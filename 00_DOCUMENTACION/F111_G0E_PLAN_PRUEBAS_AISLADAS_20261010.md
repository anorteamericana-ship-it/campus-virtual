# F111 · G0-E — Plan de pruebas aisladas y puerta de seguridad

**Versión base:** frontend `553fac61`, backend `ef817145` (main, 10-oct-2026). **Esta es una ESPECIFICACIÓN de pruebas, no resultados PASS.** Realizar E1 mocks y E4 en copias de Sheets/Drive antes de cualquier E2 autenticado o producción.

## Reglas comunes

- Nada de estudiantes, cédulas, teléfonos, pagos o certificados reales. Fixtures `EST_FICTICIO_01`, `EST_FICTICIO_02`, `GRUPO_QA_A`, `GRUPO_QA_B` y dos docentes ficticios no superpuestos.
- No usar token del administrador en código, logs o archivos. Configurar sesiones de ensayo inyectadas por mocks; para E2 usar staging autorizado sin copiar claves reales.
- Capturar **antes/después de Sheets/Drive** con contadores de mutación. Los `get*` que lleguen a `setValue`, `appendRow`, `insertSheet`, `setProperty` o sincronizaciones deben marcarse «lectura con efectos» aunque devuelvan `ok:true`.
- Cualquier prueba que requiera mutación corre E4 con respaldo e identidad ficticia, nunca en producción.
- Una rama, un hallazgo, una prueba. No mezclar con títulos SIFA ni nuevos flujos CONAPE.

## Batería mínima antes de cerrar G0/G1

| ID | Prioridad | Ruta/función | Preparación y acción | Resultado esperado |
|---|---|---|---|---|
| **E1-01** | P0 | `getSuperAdminMasterDashboard` / wrapper cache | Cache FRESH prealimentada con objeto ficticio. Solicitud sin token y con roles student/teacher/ventas. | **DENEGADO siempre**, cero filtración de campos de cache, ninguna lectura de fuente. |
| **E1-02** | P0 | misma, STALE | Cache FRESH vacía, STALE poblada, `allowStale:true` sin token o rol no admin. | **DENEGADO**; no retorno del stale antes de auth. |
| **E1-03** | P0 | misma, admin autorizado | Sesión admin válida, FRESH y STALE falsos separados. | Responde solo lo previsto por rol; cada respuesta atribuye sesión verificada. |
| **E1-04** | P1 | `getEstudiante` / rol teacher | Docente A asignado a GRUPO_QA_A consulta alumno B en GRUPO_QA_B. | Resultado debe ajustarse a política aprobada; si se restringe por grupo, negar y no revelar PII financiera. |
| **E4-05** | P1 | `getGruposDisponibles` | GRUPOS ficticia sin `DISPONIBLE_INSCRIPCION`; consulta pública. | Registrar mutación actual; tras guard propuesto, consulta no crea columnas. |
| **E4-06** | P1 | `examGetStudentLivePanel` | EXAM_CONFIG ficticia incompleta; caché/PropertiesService falsos. | Identificar escrituras de `_examSetupSheetsInternal_`; separar instalación admin de lectura estudiante. |
| **E4-07** | P1 | `examGetStudentAssignment` / availability | Misma configuración; alumno ficticio sin examen asignado. | No se habilitan exámenes ni se crea contenido por una consulta. |
| **E4-08** | P1 | `reposMiEstadoF92` | Reposición pendiente ficticia + nota oficial ya registrada; abrir pantalla dos veces. | Cambios esperados auditados una vez y idempotentes; sin duplicados ni efectos al usuario ajeno. |
| **E4-09** | P1 | `reposListarSolicitudesF92` | Reposiciones con vencimientos ficticios. | Identificar/limitar cambios por lectura; locking y auditoría. |
| **E4-10** | P1 | `guardarAsistenciaBorradorF100` | Dos pestañas docente A con revisión 0; guardar ambas para misma sesión. | Primera incrementa revisión; segunda devuelve conflicto, ninguna pérdida de comentario del primero. |
| **E2-11** | P1 | `getCalendarioDocente` / `getTareasPendientesDocente` | Token docente A y `cod_docente` de B (fixtures staging). | Denegado con cero filas de B. |
| **E2-12** | P1 | `descargarMiCertificadoPrivado` | Token estudiante A, `codigo` B, Drive privado ficticio. | Denegado antes de retornar bytes, nombre de archivo o id ajeno. |
| **E2-13** | P1 | `getConapeProspectacionVentas` | Dos asesores ficticios con prospectos distintos. | Ventas A no ve la cartera de B; Admin ve solo su política autorizada. |
| **E1-14** | P1 | capas `doPost` | Recorrer las 28 capas encontradas y crear fixtures por acción con token inválido. | Cada ruta debe rechazarla en un handler o dispatcher verificable; ningún wrapper puede devolver cache/data antes de auth. |

## Condiciones de bloqueo de publicación

1. No habilitar flujo de Panel Maestro con caché si falla E1-01 o E1-02. El arreglo pertenece a G1 y debe probarse antes de merge/deploy.
2. No clasificar G0 como completada mientras queden endpoints con **propiedad desconocida** o fuentes transitivas sin identificar; documentar explícitamente excepciones y aprobaciones.
3. No ejecutar E2 de «solo lectura» con ninguna ruta de efectos: `getGruposDisponibles` en esquema incompleto, panel de exámenes en setup, `reposMiEstadoF92`, listados que procesan vencimientos, sincronizaciones.
4. E2 necesita comprobación de deployment (versión Apps Script efectiva), sesión, propietario y capturas/audit log. E4 exige rollback y Sheets/Drive aislados.

## Punto de reanudación de las 8 p. m.

Al recibir «cómo vamos», cotejar [issue #499](https://github.com/anorteamericana-ship-it/campus-virtual/issues/499), [PR #501](https://github.com/anorteamericana-ship-it/campus-virtual/pull/501), sha actual de main y estado de los borradores F111. Reportar: hallazgos P0/P1, evidencias E0, QA E1 que **realmente** se haya ejecutado, y qué sigue. **No indicar que se trabajó en segundo plano entre turnos.**

**Estado actual:** plan listo; pruebas anteriores enumeradas siguen PENDIENTES, no PASS.
