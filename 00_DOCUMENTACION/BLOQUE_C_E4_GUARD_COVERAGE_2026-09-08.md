# Bloque C · cobertura real del guard QA antes de E4 · 2026-09-08

Base apilada: PR #274 / `6508a21363bd21b424a16483f0c56f722392aa6e`.
Evidencia: **E0 estática sobre artefactos versionados**. No demuestra el source rehearsal actual.

## Hallazgo principal

El archivo histórico/versionado `qa/apps_script_qa_guard_cs21a138.gs` **no puede reutilizarse como prueba suficiente para habilitar E4 de C1–C4**. Su cobertura es parcial y asimétrica.

### C1 · crearInscripcionPublica + generarMatricula

El guard CS21A138 no envuelve ninguno de estos dos handlers. Por tanto, aunque el guard esté presente y `writes_guarded:true`, eso no demuestra contención de C1.

**STOP E4** hasta congelar el source rehearsal efectivo y demostrar una frontera específica para ambos handlers, incluyendo:
- fixture sintético inequívoco;
- deduplicación/idempotencia;
- superficies Sheets exactas;
- side effects Drive/documentales de `crearInscripcionPublica`;
- rollback completo y trazable.

### C2 · reportarPago + aplicarPago

`aplicarPago` sí está envuelto históricamente por CS21A138. Exige:
- `qa_confirmation=QA_STAGING_CS21A138`;
- estudiante con prefijo `QA-`;
- coincidencia de Sheets autorizadas por Script Properties;
- `doc`/`documento` iniciado en `QA`.

Sin embargo `reportarPago` **no está envuelto** por ese guard. El flujo reporta evidencia con foto base64 y puede crear solicitud/artefacto documental. Por tanto, `writes_guarded:true` tampoco basta para declarar C2 completo protegido.

**STOP E4 de reportarPago** hasta disponer de guard específico y rollback de solicitud/archivo. `aplicarPago` sigue STOP hasta conocer side effects reales y compensación exacta del rehearsal.

### C3 · cerrarLeccionCompleta

CS21A138 envuelve `cerrarLeccionCompleta` y exige grupo QA `-99XX`. Pero su validación de estudiantes solo inspecciona:

`Object.keys(body.asistencias || {})`

El payload frontend efectivo contiene tres mapas por estudiante:
- `asistencias`;
- `retroalimentacion`;
- `progress_check`.

El guard histórico no demuestra que los keys de `retroalimentacion` y `progress_check` tengan prefijo `QA-`. Si el handler base consume esos mapas de forma independiente, un payload mixto podría pasar la frontera histórica con asistencia QA y un estudiante no-QA presente solo en retro/progress.

Esto se clasifica **P1 · RIESGO CONFIRMADO DEL GUARD HISTÓRICO · E0**. No se afirma explotabilidad ni comportamiento del rehearsal actual porque falta su source exacto.

Antes de C3 E4, el guard efectivo debe comprobar el conjunto unido de códigos alcanzables en los tres mapas y rechazar cualquier identidad fuera del fixture QA. También debe definir qué ocurre con mapas vacíos, keys inesperadas y diferencias entre conjuntos.

### C4 · registrarNotaEstatus

CS21A138 sí envuelve `registrarNotaEstatus` con `student:true, group:true`: estudiante `QA-` y grupo `-99XX` son precondiciones. Esto es una cobertura más fuerte que C1/C2-reportarPago y que C3, pero todavía no demuestra:
- que el wrapper sea la última definición efectiva del rehearsal;
- semántica de upsert vs append;
- rollback;
- ausencia de otro handler de nota alcanzable sin guard.

Además existe otra superficie frontend administrativa que intenta `registrarNotaComponenteOficial` y cae a `registrarNotaEstatus` si la primera función no es reconocida. El primer E4 debe fijar **un solo endpoint explícito**, un solo estudiante sintético y no depender de fallback automático.

## Implicación para smokeC0/C1–C4

El PASS de C0-SCHEMA62 no autoriza por sí mismo C1–C4. Después de C0 y del rerun de `smokeC0Preflight`, la secuencia correcta sigue siendo:

1. congelar source rehearsal exacto;
2. comprobar qué wrappers son últimas definiciones efectivas;
3. demostrar cobertura por handler y por cada identidad/sink del payload;
4. snapshot de artefactos exactos;
5. recién entonces considerar E4 individual.

## Criterios PASS/STOP actualizados

- **C1:** STOP mientras `crearInscripcionPublica` y `generarMatricula` no tengan frontera rehearsal demostrada.
- **C2 reportarPago:** STOP; guard histórico no lo cubre.
- **C2 aplicarPago:** cobertura histórica parcial PASS E0, pero E4 STOP por source/rollback no demostrados.
- **C3:** STOP; el guard histórico valida solo `asistencias`, no la unión `asistencias + retroalimentacion + progress_check`.
- **C4:** cobertura histórica de identidad/grupo PASS E0; E4 STOP hasta demostrar wrapper efectivo, semántica de escritura y rollback.

## Límites

No se modificó runtime, Apps Script, Sheets, Drive, Properties, ACL ni deployments. No se usaron PII ni credenciales. E2/E3/E4: **NO**.
