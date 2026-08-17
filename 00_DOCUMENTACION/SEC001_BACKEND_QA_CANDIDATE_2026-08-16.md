# SEC-001 · Candidato backend QA · política de alta

**Fecha:** 2026-08-16
**Estado:** `CANDIDATO QA NO INSTALADO · NO DEPLOY · SEC-001 SIGUE ABIERTO`

## Fuente

Archivo canónico observado en Drive:

- nombre: `Code.gs`;
- tamaño observado antes del trabajo: `2.971.957` bytes;
- `modified_time`: `2026-07-21T16:12:53.556Z`;
- SHA-256 de la copia descargada: `d24fc63c59e60ba92808d4d870f4eb95e35bb6f1c158a130229b187a66e35d37`.

El original no fue modificado.

## Respaldo

Antes de editar se creó dentro de `QA_STAGING_CAMPUS_2026-07-19`:

`BACKUP_PRE_SEC001_Code_2026-08-16.gs`

Drive ID:

`1D0vMdxe6oxdT5WI0MjnFZwhIGYKeS4ZI`

## Candidato separado

Se creó otra copia, también dentro del folder QA:

`SEC001_AUTH_QA_CANDIDATE_2026-08-16.gs`

Drive ID:

`1dgA7ONpZPEhbXshQ9jkZN5fkqPtcY2rn`

Tamaño:

`2.973.323` bytes

SHA-256 descargado después de subirlo:

`c1f8946078afa2974f3b71156079c33c8e9d27a17c4d81651f78df3711b319c7`

La descarga posterior coincide con el SHA local previo a la subida.

## Diff exacto

El candidato añade únicamente una política server-side inmediatamente antes de `crearUsuarioEstudiante`:

- `SEC001_PASSWORD_MIN_LENGTH = 15`;
- `SEC001_PASSWORD_MAX_LENGTH = 128`;
- `_sec001ValidateNewPassword_(value)`;
- `verificarSec001PoliticaClave()` read-only;
- llamada a `_sec001ValidateNewPassword_(body.clave)` al inicio de `crearUsuarioEstudiante`.

No se modifican:

- `iniciarSesion`;
- `getUsuario`;
- `validarSesion`;
- tokens de sesión;
- cuentas demo;
- prospectos gratuitos;
- fallback de login estudiante legacy;
- English LAB;
- Memory Match;
- Ventas;
- Drive sharing;
- rutas `doPost`;
- producción.

## Resultado de validación offline

1. El archivo canónico original pasa `node --check`.
2. El candidato completo pasa `node --check`.
3. Los anchors de inserción aparecen exactamente una vez.
4. El helper exacto del candidato se ejecutó aislado con límites:
   - 14 caracteres → rechazo;
   - 15 → aceptación;
   - 16 → aceptación;
   - 128 → aceptación;
   - 129 → rechazo.
5. Se ejecutó exactamente `crearUsuarioEstudiante` con una clave de 14 caracteres y un stub de `SpreadsheetApp` que habría fallado al primer I/O. Resultado:
   - `error = clave_no_cumple_politica`;
   - `SpreadsheetApp.openById` invocado `0` veces.

## Qué corrige

Evita que una llamada directa al endpoint público eluda la nueva validación del frontend para crear **nuevas** inscripciones con una contraseña inferior al mínimo.

## Qué NO corrige

Este candidato todavía guarda la contraseña aceptada en `PROSPECTOS.CLAVE`, por lo que **no cierra SEC-001**.

Tampoco:

- migra cuentas existentes;
- elimina `USUARIOS.clave` legible;
- elimina `PROSPECTOS.CLAVE` legible;
- cambia el login de prospecto gratuito;
- cambia el fallback estudiante basado en código;
- implementa KDF adaptativa;
- implementa rate limiting;
- implementa MFA de personal;
- demuestra ningún deployment QA.

## Gate antes de instalar en Apps Script QA

1. Identificar el proyecto Apps Script QA vigente y confirmar que NO es el productivo.
2. Confirmar el deployment QA que se actualizaría y registrar su versión/ID.
3. Comparar el source guardado en ese proyecto con el SHA/fuente de este candidato; no asumir que son iguales.
4. Instalar solo si el proyecto QA corresponde al backend que se pretende probar.
5. Ejecutar `verificarSec001PoliticaClave()` desde editor QA y exigir `ok:true` / `version:SEC001-AUTH-POLICY-1`.
6. Probar POST QA con 14 y 15 caracteres sin usar datos productivos.
7. No promover a producción como “arreglo SEC-001”; sigue siendo únicamente SEC-001A.
