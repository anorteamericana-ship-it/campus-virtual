# SEC-004 · Cuentas demo globalmente solo lectura

**Fecha:** 2026-08-16  
**Base Git:** `main@67108928e953fbf044dbcd916dc34a5dd5f1e570`  
**Rama:** `fix/sec004-demo-readonly-foundation`  
**Estado:** `CANDIDATO QA · NO INSTALADO · NO DEPLOY · NO PROD`

## 1. Problema confirmado

Las cuentas demo tenían protecciones parciales, pero no una garantía global.

La fuente observada mostraba:

- el login demo podía devolver `demo:true` / `read_only:true`;
- la fila creada en `SESIONES` no persistía esos atributos;
- `validarSesion()` reconstruía rol, código, cédula, grupos y vigencia, pero no recuperaba universalmente el estado demo;
- existía un interceptor de escrituras simuladas para el docente demo, pero solo conocía un subconjunto de endpoints;
- después del dispatcher principal existen múltiples wrappers adicionales de `doPost`;
- una mutación como `recalcularNotaFinalOficial` no estaba cubierta por la protección demo parcial.

Por tanto, deshabilitar botones o agregar más nombres a un interceptor local no constituye una frontera de seguridad.

## 2. Decisión: guard global fail-closed

El candidato añade un wrapper **al final absoluto de `Code.gs`**.

En la fuente observada existen 18 asignaciones/capas `doPost`; el candidato verifica que SEC-004 sea la última.

Para una sesión demo:

1. valida la sesión;
2. re-deriva server-side si es demo a partir de identidades sintéticas canónicas;
3. aplica aislamiento de alcance;
4. permite únicamente una allowlist pequeña de lecturas con ruta sintética comprobada;
5. permite las escrituras simuladas ya existentes del docente solo después de validar alcance y únicamente cuando el interceptor devuelve un resultado sintético sin persistencia real;
6. permite `cerrarSesion` como mantenimiento de la propia sesión;
7. cualquier ruta desconocida, nueva, mutante o no clasificada devuelve `demo_read_only`.

La UI puede usar `read_only` para deshabilitar controles, pero **el servidor es la autoridad**.

Contrato versionado:

`security/sec004_demo_readonly_contract.json`

## 3. No se migró el esquema de SESIONES

No hace falta agregar columnas demo a `SESIONES` para obtener una frontera global.

El candidato envuelve `validarSesion()` y, después de validar el token normal, re-identifica:

- docente demo por su marcador sintético canónico;
- estudiante demo por el código sintético del expediente demo.

Si corresponde, vuelve a agregar:

- `demo:true`;
- `read_only:true`;
- `demo_kind`;
- `demo_policy_version`.

Las sesiones reales se devuelven sin modificación.

Esto reduce el riesgo de una migración de esquema en un backend monolítico y hace que una sesión demo no dependa de que el flag sobreviva al login.

## 4. Credenciales demo fuera del código

El backend observado contenía secretos demo literales.

El candidato los elimina y usa exclusivamente Script Properties:

- `SEC004_DEMO_STUDENT_SECRET`;
- `SEC004_DEMO_TEACHER_SECRET`.

Reglas:

- mínimo 20 caracteres configurados;
- si la propiedad falta o es demasiado corta, ese login demo queda deshabilitado;
- no existe contraseña fallback en el source;
- los valores anteriores deben considerarse comprometidos y **no deben reutilizarse**;
- no se guarda ningún secreto nuevo en Git, Drive de documentación ni este informe.

## 5. Hallazgo crítico: varias “lecturas” escriben

Durante la construcción inicial se propuso una allowlist más amplia de 41 rutas. Se descartó después de revisar efectos transitivos.

Ejemplos confirmados:

### `getPerfilDocenteCS21A76`

Puede llamar helpers que crean carpetas y escriben metadata docente. No es read-only real.

### `examReviewInbox`

Puede ejecutar setup de hojas de exámenes antes de leer. No es read-only real.

### `getPortalEstudianteCompleto`

El portal productivo llama `examGetStudentLivePanel`; la cadena observada puede inicializar hojas de examen. El wrapper demo anterior llamaba **primero al portal real** y solo después agregaba `demo/read_only`.

### Academia Play

Lecturas como progreso/banco/resumen pueden asegurar o crear hojas/cabeceras antes de devolver datos.

### Sesión de clase estudiante

La lectura puede asegurar estructuras de sesiones docentes.

Por esto, el criterio final no es “el nombre empieza por get”. Una ruta demo queda permitida solo si existe evidencia de short-circuit sintético antes de tocar datos reales.

## 6. Portal estudiantil demo 100% sintético

Se reemplaza el wrapper anterior por `_sec004DemoStudentPortal_()`.

Para un código demo, el portal se construye con:

- ficha sintética;
- asistencia sintética;
- evaluaciones sintéticas;
- retroalimentación sintética;
- I CAN sintético;
- calendario/lecciones sintéticas.

Exámenes se devuelven explícitamente:

`enabled:false · assigned:false · demo:true · read_only:true`

El flujo demo no llama:

- al portal productivo antes del short-circuit;
- `examGetStudentLivePanel`;
- `_examSetupSheetsInternal_`.

Una prueba dinámica demuestra que el portal demo produce cero llamadas al portal real/setup de exámenes; un código real continúa delegando al portal canónico.

## 7. Allowlist final: 23 rutas

La primera lista de 41 fue reducida a 23.

### Compartidas

- `validarSesion`
- `getInfoGeneral`

### Docente demo · sesión / máscara

- `getDocenteGruposActuales`
- `getGruposDocenteActuales`
- `getDocenteSesionActivaF87`

### Docente demo · grupo sintético requerido

- `getDocenteGrupoPanelF80`
- `getDocenteGrupoPanelF79`
- `getAsistenciaDetalleGrupoF77`
- `getDocenteSesionClaseF77`
- `getEstudiantesParaCierre`
- `getLeccionCerradaDetalle`
- `getGrupoInfo`
- `getGrupoEstudiantes`
- `getAsistenciaGrupoCompleta`

### Docente demo · identidad docente sintética requerida

- `getCalendarioDocente`
- `getTareasPendientesDocente`

### Docente demo · estudiante sintético requerido

- `getEvaluacionesEstudiante`
- `getRetroalimentacionEstudiante`

### Estudiante demo

- `getPortalEstudianteCompleto`
- `getEstudiante`
- `getAsistenciaEstudiante`
- `getICANEstudiante`
- `getFechasGrupo`

Todo lo demás falla cerrado para demo salvo `cerrarSesion` y las mutaciones de presentación que el interceptor existente demuestra como simuladas.

## 8. Aislamiento de alcance

Permitir una lectura no basta: también debe impedirse que un demo use esa ruta para consultar datos reales.

### Student demo

- todo código solicitado debe ser exactamente `sesion.codigo`;
- toda cédula debe ser exactamente `sesion.cedula`;
- todo grupo debe ser el grupo sintético derivado del código;
- portal/ficha/asistencia/I CAN exigen código explícito;
- fechas exigen grupo sintético explícito;
- omitir el identificador requerido también falla cerrado.

### Teacher demo

- grupos: únicamente grupos demo;
- códigos: únicamente estudiantes sintéticos;
- cédulas: únicamente cédulas sintéticas;
- identidad docente: únicamente docente demo;
- si una ruta clasificada necesita grupo/código/docente y el request lo omite, falla cerrado.

Esto evita que una cuenta demo se convierta en un lector de expedientes reales aunque la operación sea técnicamente GET/read.

## 9. Rutas read-like bloqueadas deliberadamente

Hasta crear adaptadores sintéticos sin side effects permanecen bloqueadas, entre otras:

- `getPerfilDocenteCS21A76`;
- `examReviewInbox`;
- `getMisCertificadosEstado` — hasta integrar SEC-002 no destructivo;
- `getSesionClaseEstudiante`;
- `getEstudianteFresh`;
- `getComprobantes`;
- `getEstadoConape`;
- `academiaPlayGetProgress`;
- `academiaPlayBankGetGame`;
- `academiaPlayCompletionSummary`;
- `getBibliotecaNivelEstudiante`;
- `getAudioPistaEstudiante`;
- `oralGetPanelDocente`;
- `oralGetResumenGrupo`;
- `oralGetEvaluacion`.

Una demo parcialmente degradada es preferible a declarar “solo lectura” mientras una lectura puede crear hojas o alcanzar datos reales.

## 10. Candidato backend QA

Base:

`BACKUP_PRE_SEC001_Code_2026-08-16.gs`

Base SHA-256:

`d24fc63c59e60ba92808d4d870f4eb95e35bb6f1c158a130229b187a66e35d37`

Candidato:

`SEC004_DEMO_READONLY_QA_CANDIDATE_2026-08-16.gs`

Drive ID:

`1wwXtROufx5ZMj1A9yYIsgF29vaff-_7X`

Tamaño después de round-trip Drive:

`2.983.662 bytes`

SHA-256 después de round-trip Drive:

`b4775e8d615d2e59409a1b9eb1587b0f325767e4e54b7ef7384447fcbe75904f`

El archivo descargado nuevamente pasa sintaxis JavaScript y conserva el mismo SHA local.

El `Code.gs` productivo no fue modificado.

## 11. Diff del candidato

Contra la copia canónica observada:

- 6 hunks;
- 286 adiciones;
- 14 eliminaciones;
- cambios concentrados en:
  1. configuración de secreto estudiantil demo;
  2. validación de secreto estudiantil;
  3. portal demo sintético;
  4. configuración de secreto docente demo;
  5. validación de secreto docente;
  6. guard global final.

No se editan motores English LAB/Memory Match ni lógica productiva de notas/pagos para usuarios reales.

## 12. QA

Harness versionado:

`scripts/qa_sec004_demo_readonly_backend_candidate.mjs`

El paquete local completo ejecutó 63 aserciones y finalizó PASS. Entre los casos cubiertos:

- secretos literales ausentes;
- propiedades obligatorias y mínimo de longitud;
- reanotación de sesión teacher/student demo;
- sesión real intacta;
- guard SEC-004 como último `doPost`;
- unknown route fail-closed;
- `recalcularNotaFinalOficial` bloqueado;
- upload docente tardío bloqueado;
- portal demo sin setup de exámenes;
- acceso demo a grupo real bloqueado;
- acceso demo a estudiante real bloqueado;
- acceso demo a docente real bloqueado;
- ausencia de parámetros sintéticos requeridos bloqueada;
- Academia Play read-with-setup bloqueada;
- mutación financiera estudiantil bloqueada;
- certificado status bloqueado hasta SEC-002;
- mutación real con sesión no-demo continúa delegando;
- ruta pública sin token continúa delegando;
- logout demo continúa funcionando.

## 13. Lo que todavía NO está hecho

- el candidato no está instalado en Apps Script QA;
- no existe deployment QA nuevo;
- las dos Script Properties nuevas no están configuradas;
- no se han rotado credenciales en un runtime real;
- no se han recorrido manualmente todos los menús demo en navegador con este backend;
- no se ha probado que las escrituras simuladas sigan siendo cómodas para la presentación después del guard externo;
- no se ha hecho deploy productivo.

La conexión disponible permite respaldar y verificar el archivo, pero no instalar/deployar source en Apps Script.

## 14. Gate de QA antes de considerar merge/promoción

1. instalar el candidato únicamente en el proyecto Apps Script QA correcto;
2. configurar **secretos nuevos y distintos** en las dos Script Properties; nunca reutilizar los anteriores;
3. confirmar deployment QA exacto;
4. login demo student y teacher;
5. confirmar `demo:true/read_only:true` después de `validarSesion`, no solo en login;
6. recorrer las 23 rutas permitidas con parámetros sintéticos;
7. intentar cada ruta permitida con grupo/código/cédula/docente real y exigir `demo_read_only`;
8. probar mutaciones representativas de cada área y una ruta inventada;
9. confirmar que no aparecen filas/hojas/carpetas/documentos nuevos en APOLLO/OPERATIVO/Drive;
10. confirmar que el portal demo no crea hojas de exámenes;
11. probar acciones docentes simuladas y verificar cero persistencia real;
12. regresión con cuentas reales student/teacher/admin;
13. solo después decidir si las funciones bloqueadas necesitan adaptadores sintéticos adicionales.

SEC-004 permanece **abierto** hasta ese QA real y un deployment autorizado.
