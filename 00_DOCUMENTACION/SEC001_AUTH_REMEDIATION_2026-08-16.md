# SEC-001 · Remediación de autenticación

**Fecha:** 2026-08-16
**Base Git:** `main@67108928e953fbf044dbcd916dc34a5dd5f1e570`
**Rama:** `fix/sec001-auth-policy-foundation`
**Estado:** `EN PROGRESO · NO CERRADO · NO DEPLOY`

## 1. Objetivo

Cerrar SEC-001 sin sustituir una debilidad por otra ni mezclar la remediación con English LAB, Memory Match, Speak LAB, Ventas o limpieza de ramas.

Este corte fija primero el contrato y una prueba de regresión. No declara resuelta la autenticación hasta que exista evidencia del backend QA, migración y protección contra intentos repetidos.

## 2. Evidencia confirmada

### Frontend vigente

`src/inscripcion.jsx` acepta actualmente una contraseña de cuatro caracteres mediante una validación equivalente a:

- clave presente;
- `length < 4` => error;
- texto visible `clave mínima de 4 caracteres`.

El login envía `usuario` y `clave` a `iniciarSesion` para verificación en servidor. Enviar una contraseña por HTTPS al verificador no es por sí mismo el defecto; el problema crítico es cómo se valida y almacena después.

### Backend canónico observado en Drive

La copia canónica observada `Code.gs`:

- recibe `body.clave` en `iniciarSesion`;
- delega en `getUsuario(usuario, clave)`;
- compara la credencial almacenada directamente con la cadena recibida;
- guarda la contraseña elegida durante inscripción en `PROSPECTOS.CLAVE`;
- durante activación lee esa misma `PROSPECTOS.CLAVE` y la traslada al registro de usuario;
- contiene además una ruta legacy de estudiante que compara el código del estudiante como credencial.

Por tanto, SEC-001 no puede cerrarse con un cambio cosmético en el formulario.

## 3. Respaldo antes de backend

Antes de preparar una migración se copió el archivo canónico observado a la carpeta QA existente:

- origen: `Code.gs` de Drive, 2.971.957 bytes;
- copia: `BACKUP_PRE_SEC001_Code_2026-08-16.gs`;
- destino: `QA_STAGING_CAMPUS_2026-07-19`;
- el original no fue modificado.

Este respaldo no demuestra qué revisión exacta está desplegada en producción o QA. Deployment y archivo guardado continúan siendo estados distintos.

## 4. Contrato adoptado

La política de este corte queda versionada en `security/sec001_auth_contract.json`.

Para contraseña como factor único:

- mínimo: 15 caracteres;
- soportar al menos 64 caracteres;
- no imponer combinaciones arbitrarias de mayúscula/minúscula/número/símbolo;
- permitir administradores de contraseñas y pegado;
- bloquear contraseñas comunes o comprometidas;
- aplicar rate limiting o control equivalente contra intentos repetidos.

En almacenamiento:

- no guardar texto claro;
- no sustituirlo por SHA-256 rápido sin sal;
- usar un verificador adaptativo apropiado o un proveedor de identidad administrado;
- nunca registrar ni devolver la contraseña original.

## 5. Decisión técnica importante

**No se implementará un hash casero rápido en Apps Script únicamente para hacer desaparecer la columna `CLAVE`.**

Eso produciría una falsa sensación de cierre. Antes de escoger la implementación del verificador se debe demostrar que el runtime elegido soporta de forma razonable un mecanismo adaptativo y su operación/migración, o mover la autenticación a un proveedor administrado.

La sesión existente y su token son un problema separado de la contraseña. No se debe romper el esquema de sesiones mientras se migra la credencial sin una prueba explícita.

## 6. Prueba de regresión inicial

`scripts/qa_sec001_password_policy.mjs` comprueba el formulario de inscripción y actualmente debe permanecer **ROJO** contra la base vulnerable porque:

- detecta la regla de 4 caracteres;
- exige mínimo de 15 en validación;
- exige `minLength >= 15` en el input;
- preserva `autocomplete="new-password"`.

No convertir un test rojo en verde eliminando la validación. Debe existir una política explícita.

## 7. Próximas fases de SEC-001

### SEC-001A · Alta

1. actualizar la política del formulario sin reescribir el archivo completo por un mecanismo inseguro;
2. validar también en servidor;
3. añadir blocklist y límites server-side.

### SEC-001B · Verificador y almacenamiento QA

1. identificar/verificar el backend QA exacto y su deployment;
2. escoger proveedor administrado o verificador adaptativo adecuado;
3. preparar una copia QA del backend completa, no un wrapper aislado;
4. impedir nuevas escrituras legibles en `PROSPECTOS.CLAVE` / `USUARIOS.clave`;
5. conservar compatibilidad únicamente mediante una migración temporal, acotada y auditable.

### SEC-001C · Migración

1. inventariar cuentas activas y demos sin publicar secretos;
2. migrar o forzar restablecimiento;
3. retirar fallback legacy por fecha/versión explícita;
4. demostrar que ninguna cuenta activa conserva credencial legible.

### SEC-001D · Protección contra abuso

1. respuesta uniforme para credenciales inválidas;
2. rate limiting por cuenta y señal adicional adecuada;
3. prueba negativa repetida en QA;
4. trazabilidad sin registrar contraseña ni token.

## 8. Criterio de cierre

SEC-001 solo pasa a `CERRADO` cuando exista evidencia de:

- política de alta correcta;
- backend QA que no guarda contraseñas legibles;
- verificación mediante mecanismo administrado/adaptativo;
- migración o reset de cuentas existentes;
- abuso repetido limitado;
- no enumeración material de cuentas;
- regresiones de login por rol;
- deployment QA identificado;
- autorización humana separada antes de producción.

## 9. Límites de esta rama

No modificar:

- Memory Match / PR #83;
- English LAB hub / PR #85;
- Speak LAB / PR #104;
- agentes / PR #105;
- producción;
- deployment de Apps Script;
- ramas históricas;
- datos reales de estudiantes.
