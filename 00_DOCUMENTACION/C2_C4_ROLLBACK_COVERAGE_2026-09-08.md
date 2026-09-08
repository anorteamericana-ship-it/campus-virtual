# Bloque C · C2–C4 · cobertura de rollback y harness E4 · 2026-09-08

Base exacta: PR #277 / `c4a6406dfa9b5a2a960eec3f47bbe3253f459660`.

## Hallazgo E0 nuevo

El harness histórico `scripts/real_qa_authenticated_cs21a138.mjs` **no debe reutilizarse como procedimiento E4 del Bloque C**. Sirve como evidencia histórica de forma de payload y de un replay idempotente de `aplicarPago`, pero no contiene un rollback verificable para las mutaciones que ejecuta.

### C2 · pagos

`reportarPago` en Ventas construye actualmente un payload con `usuario_reporta`, `nombre_reporta`, `origen:'VENDEDOR'`, identidad del estudiante, `tipo_pago`, `nivel`, `numero_comprobante`, `monto_reportado`, `foto_base64`, `foto_mime` y `notas_reporta`. La UI clasifica respuesta `PENDIENTE` o `DUPLICADO`, pero no transporta `request_id`.

Esto implica dos riesgos distintos antes de E4:
1. la evidencia subida puede crear artefactos/filas aun si la respuesta se pierde;
2. el rollback no puede limitarse a BDBANCARIO/PAGOS: debe descubrir y revertir la solicitud/evidencia documental asociada.

`aplicarPago` sí conserva `request_id` y el harness CS21A138 demuestra la intención de replay con el mismo payload y exige `idempotent===true`. Su payload histórico exacto de prueba es `doc`, `cod_estudiante`, `monto_total`, `request_id` y `rubros[{tipo,nivel,monto,grupo}]`, más el marcador QA. Esto **no demuestra el source rehearsal actual** ni un rollback financiero.

**PASS futuro C2**: snapshot antes/después de documento bancario, saldo/aplicado, pagos del estudiante, solicitud reportada, cualquier evidencia/Drive y request-id; replay idéntico no altera montos/filas; rollback restaura snapshot byte/valor-equivalente y elimina solo artefactos del fixture.

**STOP C2**: source efectivo no congelado, documento no QA, request-id ambiguo, respuesta incierta sin consulta previa, rollback basado en “pago inverso”, o evidencia/Drive sin identificador trazable.

### C3 · cerrarLeccionCompleta

El guard histórico CS21A138 valida grupo QA y revisa únicamente `Object.keys(body.asistencias)`. El payload efectivo también puede transportar `retroalimentacion` y `progress_check` por estudiante. Por eso el guard histórico no basta para una prueba E4 actual.

Además, el harness histórico CS21A138 **no ejecuta `cerrarLeccionCompleta`** en su bloque de writes; solo prueba `registrarAsistencia` por separado. No existe allí evidencia de atomicidad ni rollback de cierre compuesto.

**PASS futuro C3** requiere snapshot de estado de lección + asistencia + retroalimentación + progress check de un único grupo/fixture; la unión de todas las identidades de estudiante debe ser QA; una falla parcial debe demostrar transacción atómica o un rollback explícito por cada superficie.

**STOP C3** si el guard inspecciona solo asistencia, si el handler puede cerrar la lección antes de fallar en otra subescritura, o si no existe forma segura de reabrir/restaurar el fixture sin afectar alumnos ajenos.

### C4 · registrarNotaEstatus

El harness histórico escribe una nota con `cod_estudiante`, `grupo`, `nivel:'B1'`, `tipo_eval:'ORAL_1'`, `nota:12`, `leccion_num:9`, `registrado_por:'QA DOCENTE'`, además del marcador QA. No usa `request_id` ni demuestra idempotencia/replay de notas.

La UI docente vigente puede enviar múltiples estudiantes con `Promise.allSettled`; la superficie admin tiene fallback `registrarNotaComponenteOficial -> registrarNotaEstatus`. El primer E4 debe usar **un solo estudiante sintético y un endpoint único**, sin fallback.

**PASS futuro C4**: snapshot exacto de la fila/componente antes; una sola escritura; lectura posterior confirma valor y ownership; rollback restaura ausencia/valor previo sin crear duplicado; si el handler es upsert, se demuestra la clave exacta de upsert.

**STOP C4** si no se conoce si es append/upsert, si el endpoint puede caer por fallback, si se prueban varios estudiantes, o si la restauración requiere borrar por posición de fila sin una clave estable.

## Dictamen

`real_qa_authenticated_cs21a138.mjs` queda clasificado como **HISTORICAL_WRITE_HARNESS_NOT_ROLLBACK_SAFE_FOR_BLOCK_C**. No debe habilitarse con `QA_EXECUTE_WRITES` como atajo para C2–C4.

C0 continúa `BLOQUEADO_HUMANO`; C1–C4 continúan `E4 STOP` hasta obtener source rehearsal exacto, snapshots y rollback completos.

**E0/E1 ONLY · NO MERGE · NO PROD · NO APPS SCRIPT WRITE/DEPLOY · NO SHEETS/DRIVE WRITE · NO PROPERTIES/ACL · NO E2/E3/E4 CLAIMS**
