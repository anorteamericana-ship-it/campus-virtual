# C1 · frontera de retry e idempotencia · 2026-09-08

Base exacta: PR #276 / `6ee9b2880e61c12da730ed6fb7f20d654c75e54b`.

## Hallazgo E0

Las dos escrituras que forman C1 tienen protección contra doble clic dentro de una instancia de UI, pero el payload observable no transporta una identidad estable de operación (`request_id`, idempotency key o equivalente):

- `src/inscripcion.jsx` ejecuta `crearInscripcionPublica` después de `setSubmitting(true)` y envía el payload de inscripción sin clave de operación.
- `src/matriculas_admin.jsx` ejecuta `generarMatricula` después de comprobar `submitting` y envía `cedula`, `grupo`, `beca` y `beca_estado`, también sin clave de operación.

El estado `submitting` reduce concurrencia accidental dentro del mismo componente montado, pero **no resuelve** el caso distribuido: el backend puede completar una escritura y la respuesta perderse; una recarga, reapertura del modal o reintento manual genera una segunda solicitud que el cliente no puede relacionar inequívocamente con la primera.

Esto no demuestra que el backend duplique. El backend efectivo del rehearsal puede tener deduplicación por cédula/estado/constraints. Esa propiedad sigue sin demostrarse y debe congelarse antes de E4.

## Consecuencia para C1 E4

C1 no puede usar como criterio suficiente “el botón se deshabilita mientras envía”. Antes de permitir una escritura controlada se debe obtener del source rehearsal exacto, para **cada handler**, una de estas dos pruebas:

1. idempotencia explícita mediante clave estable de operación; o
2. deduplicación transaccional equivalente, con clave de negocio exacta, estado esperado y comportamiento de replay definido.

Si `crearInscripcionPublica` y `generarMatricula` usan claves distintas, deben auditarse por separado; no asumir que la deduplicación de la inscripción protege la activación/matrícula.

## Escenarios mínimos a congelar antes de E4

### C1A · crearInscripcionPublica
- primer request del fixture sintético;
- respuesta perdida/desconocida **no autoriza retry** hasta consultar snapshot por identidad;
- si la inscripción ya existe, el segundo intento debe devolver la misma entidad o un rechazo seguro sin nueva fila, usuario, carpeta ni documento;
- cualquier PDF/archivo Drive debe conservar identificador trazable para rollback.

### C1B · generarMatricula
- snapshot previo de `PROSPECTOS`, `USUARIOS`, `DATOS`, `ESTATUS`, `LOG_ACTIVACIONES` del fixture;
- después de una respuesta incierta, consultar primero el estado por cédula/código antes de repetir;
- el replay permitido debe conservar un solo código, una identidad, cuatro filas ESTATUS (`B1=CA`, `B2/I1/I2=PE`) y una sola activación;
- si no existe contrato de replay/dedupe demostrable, **STOP**: no probar un segundo POST para “ver qué pasa”.

## Criterio PASS / STOP

`PASS E0/E1` para esta frontera: payloads actuales congelados y ausencia de idempotency key cliente demostrada; plan de verificación server-side definido.

`E4 PASS` futuro requiere evidencia del source rehearsal y un snapshot que demuestre semántica de retry antes de ejecutar un replay. `STOP` si el handler depende solo de UI, si la clave de dedupe es ambigua, si una respuesta perdida obliga a reintentar a ciegas, o si rollback no cubre todas las superficies/Drive.

C0-SCHEMA62 continúa `BLOQUEADO_HUMANO`; este corte no sustituye `smokeC0MigrateProspectSchema62` ni `smokeC0Preflight`.

**E0/E1 ONLY · NO MERGE · NO PROD · NO APPS SCRIPT WRITE/DEPLOY · NO SHEETS/DRIVE WRITE · NO PROPERTIES/ACL · NO E2/E3/E4 CLAIMS**
