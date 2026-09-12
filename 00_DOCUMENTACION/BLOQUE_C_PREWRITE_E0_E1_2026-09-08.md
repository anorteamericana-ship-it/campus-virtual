# Bloque C · auditoría pre-write E0/E1 · 2026-09-08

Base GitHub congelada: `main@6b747fdbb1aeb4d610ad54ace2ded856fc3f95cc`.

## Veredicto ejecutivo

El trabajo E0/E1 puede avanzar, pero **C0-SCHEMA62 no puede declararse verificado desde GitHub**. El checkpoint operativo conocido fuera del repo —Gate B cerrado, rehearsal modular de 27 archivos, aggregate `b2c31d21a086b6acd3959c5ba2faa7138c86d188c6b570c74469d80463a74c95`, `smokeC0MigrateProspectSchema62` y `smokeC0Preflight`— no aparece en `main`, ramas/PRs buscables ni comentarios actuales de Issue #111. Esto es una brecha de trazabilidad, no evidencia de que el checkpoint local sea falso.

Hasta observar la ejecución local del instalador v3, C0 permanece `BLOQUEADO_HUMANO` y C1–C4 permanecen `E0/E1_PREPARADOS · E4_STOP`.

## C0 · PROSPECTOS · contrato 62 runtime / 59 físico / 65 físico esperado

### Evidencia GitHub que sí existe

La historia versionada contiene un delta documental privado que agrega exactamente seis columnas a `PROSPECTOS_HEADERS`:

- `CED_FRENTE_FILE_ID`
- `CED_DORSO_FILE_ID`
- `DOC_IDENTIDAD_FILE_ID`
- `TITULO_FILE_ID`
- `DOC_IDENTIDAD_MODO`
- `TITULO_MODO`

Eso es compatible con una expansión física de 59 → 65 columnas, pero **no prueba** por sí solo que el rehearsal actual tenga 59 columnas ni que su runtime declare 62. El source modular de rehearsal requerido para probar esas cifras no está versionado en esta línea.

### Riesgo principal

`runtime=62`, `physical=59`, `expected physical=65` es una combinación peligrosa si cualquier handler usa posiciones, arrays de longitud fija o `setValues()` con anchos derivados de headers distintos. Antes de E4 hay que demostrar que después de la migración existe una sola definición efectiva de schema y que ningún consumidor sigue trabajando con 59/62 posiciones incompatibles.

### Verificación posterior obligatoria de C0

Después de ejecutar **localmente** `smokeC0MigrateProspectSchema62` sobre el rehearsal autorizado, congelar y devolver evidencia suficiente para comprobar, sin inferencias:

1. identidad del rehearsal: lista de los 27 archivos y aggregate SHA-256 esperado;
2. `PROSPECTOS` antes/después: número de filas y columnas físicas;
3. headers completos antes/después, preservando orden y spelling de las primeras 59 columnas;
4. columnas físicas finales = **65**;
5. las seis columnas privadas esperadas existen **una sola vez** y en el orden contractual;
6. cero headers duplicados o vacíos intermedios introducidos por la migración;
7. mismo número de filas antes/después;
8. ninguna celda de negocio preexistente fuera de la fila de headers cambia por la migración, salvo una transformación explícitamente documentada por el instalador;
9. source rehearsal después de la ejecución conserva los 27 archivos y el mismo aggregate si el instalador es solo de schema de Sheet; si el aggregate cambia, STOP y explicar por qué;
10. ejecutar de nuevo `smokeC0Preflight` y comparar cada invariant con el preflight previo. Cualquier diferencia no explicada = STOP.

### Criterio C0

`PASS` solo si la evidencia observada demuestra 65 columnas físicas, headers exactos/no duplicados, datos previos intactos y preflight íntegro. `STOP` ante mismatch de ancho, reordenamiento, duplicación, mutación de datos, aggregate inesperado o salida ambigua. No reconstruir ni sustituir la ejecución local desde GitHub Actions.

## C1 · crearInscripcionPublica + generarMatricula

### Contrato frontend verificable

`src/inscripcion.jsx` valida cédula, grupo, identidad/contacto, ubicación, tutor si menor, financiamiento/beca, fuente, experiencia, tres documentos y lista de espera. El payload normaliza cédula/nombre/correo, fija `grupo_tentativo`, datos CONAPE, `origen_web:'INSCRIPCION_PUBLICA_IP5A'`, `generar_pdf_identidad_conape:true` y `version_frontend`.

`src/matriculas_admin.jsx` usa POST autenticado para `generarMatricula`; el flujo vigente reemplaza `activarEstudiante` y **no aplica el pago**. La UI continúa luego a Aplicar Pago.

### Invariantes que deben demostrarse en E4, no suponerse

Para un único fixture sintético, y solo tras congelar el source rehearsal exacto:

- `crearInscripcionPublica` no crea duplicados al repetir cédula/solicitud;
- `generarMatricula` produce una sola identidad de estudiante y un solo código estable;
- `ESTATUS`: exactamente cuatro filas del fixture: `B1=CA`, `B2=PE`, `I1=PE`, `I2=PE`;
- `USUARIOS`: una identidad, rol/credencial esperada, sin duplicado;
- `DATOS`: una fila del estudiante, claves de identidad coherentes;
- `LOG_ACTIVACIONES`: una activación atribuible al fixture, no dos por retry;
- `PROSPECTOS`: la fila original queda en estado coherente con conversión, sin segunda fila por la misma identidad;
- un segundo `generarMatricula` debe ser idempotente o rechazar de forma segura **sin nuevas filas ni nuevo código**.

### Riesgos que hoy bloquean E4

1. El handler backend efectivo de rehearsal no está en GitHub; no se puede demostrar desde esta rama qué hojas toca realmente.
2. `crearInscripcionPublica` transporta tres documentos y solicita PDF de identidad. Eso puede producir side effects de Drive además de Sheets. Un rollback que solo borre filas sería incompleto.
3. `generarMatricula` es una transición multihoja. Si falla a mitad, hay riesgo de identidad parcial entre `ESTATUS`, `USUARIOS`, `DATOS`, `LOG_ACTIVACIONES` y `PROSPECTOS`.
4. No hay evidencia GitHub actual de transacción/compensación global para esas cinco superficies.

### Snapshot/rollback requerido para permitir C1 E4

Antes: capturar solo las filas/IDs del fixture sintético en las cinco hojas y cualquier artefacto Drive creado para ese fixture. Después: comparar multiplicidad e invariantes. Rollback: eliminar/restaurar **solo** artefactos trazados al fixture, incluyendo archivos Drive si fueron creados; verificar que todos los contadores y búsquedas vuelvan exactamente al snapshot pre-test. Si no existe una forma segura y exacta de identificar esos artefactos, `STOP` antes de crear el fixture.

## C2 · reportarPago + aplicarPago

### reportarPago

La superficie Ventas envía evidencia, no aplica dinero: `usuario_reporta`, `nombre_reporta`, `origen:'VENDEDOR'`, cédula/código/nombre del estudiante, `tipo_pago`, `nivel`, `numero_comprobante`, `monto_reportado`, `foto_base64`, `foto_mime`, `notas_reporta`. La UI declara que el admin cruza luego el comprobante con `BDBANCARIO` y aplica el pago manualmente.

Riesgo: el archivo base64 implica posible side effect documental/Drive. No usar comprobantes reales. E4 requiere fixture sintético y cleanup del archivo/solicitud generado.

### aplicarPago

El contrato frontend preserva `request_id`, `doc`, `monto_total`, `cod_estudiante` y `rubros`. El harness histórico CS21A138 ya modelaba el criterio correcto: repetir el mismo `request_id` debe devolver idempotencia y no duplicar el pago.

`PASS` futuro: primer apply crea exactamente los efectos esperados; replay idéntico no crea recibo/fila/cargo adicional y reporta idempotencia; monto/rubros/cuadre posterior coinciden. `STOP`: request_id ignorado, segundo recibo, cambio doble de saldo, `doc` ambiguo o side effects no enumerados.

Rollback: no ejecutar hasta conocer en el rehearsal actual todas las hojas/artefactos afectados y una compensación exacta. Un “pago inverso” no se asume equivalente a restaurar el snapshot.

## C3 · cerrarLeccionCompleta

Payload efectivo desde `vista_docente.jsx`:

- `cod_grupo`
- `nivel`
- `leccion`
- `riel`
- `docente_real`
- `registrado_por`
- `asistencias` por estudiante
- `retroalimentacion` por estudiante
- `progress_check` por estudiante
- `nota_docente` opcional

El helper de red agrega `fn:'cerrarLeccionCompleta'` y token de sesión.

Riesgo: una sola acción agrupa cierre de calendario + asistencia + retro + progress check. No permitir E4 hasta enumerar las tablas/hojas exactas que escribe el handler rehearsal y su orden de mutación. Un fallo parcial puede dejar la lección “cerrada” con subdatos incompletos o viceversa.

`PASS` futuro: un único fixture/grupo/lección, snapshots antes/después, todas las subescrituras esperadas una vez, retry seguro definido, y rollback que restaure exactamente estado de lección y filas asociadas. `STOP` ante escritura parcial, cierre duplicado, overwrite de estudiante ajeno o rollback no determinista.

## C4 · registrarNotaEstatus

Payload docente efectivo:

- token
- `cod_estudiante`
- `grupo`
- `nivel`
- `programa`
- `tipo_eval`
- `leccion_num`
- `nota`
- `comentario`
- `registrado_por:'DOCENTE'`

El harness QA histórico modela además una llamada sintética B1/ORAL_1/lección 9. Eso es evidencia histórica de contrato, **no autorización para ejecutar ahora**.

Riesgo: la UI guarda múltiples alumnos con `Promise.allSettled`; una operación de grupo puede quedar parcialmente aplicada. Para E4 inicial usar **un solo estudiante sintético**, no un batch. Antes de repetir la llamada hay que conocer si el backend hace upsert por estudiante+nivel+tipo_eval o append; si no está demostrado, el retry se considera riesgo de duplicado.

`PASS` futuro: una única nota trazada al fixture, lectura posterior consistente, retry con semántica conocida y rollback exacto. `STOP`: fila duplicada, actualización de nivel/grupo incorrecto, mezcla entre `registrarNotaComponenteOficial` y fallback `registrarNotaEstatus`, o ausencia de rollback determinista.

## Frontera Rebeca post-containment · Issue #272

El issue actual clasifica cuatro lecturas Rebeca como `READ_WITH_TECHNICAL_SIDE_EFFECT` y tres mutaciones como `BUSINESS_WRITE`, todas detrás de `BLOCK_DEFAULT_DENY`. La documentación CS21A90 histórica solo demuestra de forma detallada `agentGetCommercialConfig` y `agentResolveContactContext`; no sustituye el source rehearsal vigente de siete rutas.

Hallazgo nuevo: `90_REBECA_V8_Routing.js` tampoco está versionado en `main`. Por tanto R0 no puede cerrarse solo con historia documental. La siguiente evidencia segura debe congelar el archivo exacto del rehearsal y mapear, por selector, en qué orden ocurren: firma HMAC → timestamp/nonce → replay → rate → cache → handler → proyección pública.

Recomendaciones fail-closed para R1:

- verificar firma y expiración antes de cualquier acceso a datos de negocio;
- registrar nonce/replay solo después de una firma válida;
- allowlist exacta de los cuatro selectors de lectura, separada del core;
- proyección pública por allowlist de campos, no por blacklist de PII;
- las tres mutaciones permanecen inalcanzables en R1;
- firma inválida/replay no debe caer a dispatcher general ni a otra frontera secundaria;
- pruebas sintéticas deben verificar que un selector parecido/mal escrito sigue denegado.

## Estado

- C0: `BLOQUEADO_HUMANO · ejecución local v3 pendiente`.
- C1: `E0/E1 PREPARADO · E4 STOP`.
- C2: `E0/E1 PREPARADO · E4 STOP`.
- C3: `E0/E1 PREPARADO · E4 STOP`.
- C4: `E0/E1 PREPARADO · E4 STOP`.
- Rebeca R0: `E0 PARCIAL · source rehearsal exacto no versionado`.
- PROD / Apps Script / Sheets / Drive: no tocados por este corte.
