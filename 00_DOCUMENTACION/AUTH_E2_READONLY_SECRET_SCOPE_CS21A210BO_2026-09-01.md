# CS21A210BO · E2 autenticado read-only · alcance de secretos

Fecha: 2026-09-01

## Base

- PR padre: #264 / CS21A210BL
- base: `candidate/green-spine-integration-cs21a210bl`
- SHA base: `8a2d0227b52a345fdf21fe2b2fb9e9c8ff4706ba`

## Problema detectado

El runner autenticado CS21A138 exige `QA_BANK_DOCUMENT` en su lista general de variables aunque ese valor solo se utiliza dentro del bloque `if (executeWrites)` para el payload de `aplicarPago`.

Exigir un identificador de banco para una corrida autenticada read-only mezcla requisitos de lectura con requisitos de escritura y obliga a configurar un secreto que no aporta nada a E2 read-only.

## Solución BO

Se agrega un workflow manual independiente `Real QA Authenticated Readonly CS21A210BO` que:

- exige URL QA explícita;
- exige identidades QA student / teacher / superadmin;
- exige código de estudiante y grupo QA;
- fija `QA_EXECUTE_WRITES=NO` sin input que permita cambiarlo;
- usa una sentinel no sensible `CS21A210BO_READONLY_UNUSED` para satisfacer la compatibilidad del runner heredado con `QA_BANK_DOCUMENT`;
- no exige ni consume un secreto `QA_BANK_DOCUMENT` real;
- conserva el runner mutante original intacto detrás de `CS21A138_STAGING_ONLY`;
- ejecuta browser QA contra frontend local aislado y redirige las llamadas productivas observadas hacia la URL staging explícita.

## Secretos necesarios para E2 read-only

- `QA_STAGING_APPS_SCRIPT_URL` — ya configurado y probado por Real QA readonly.
- `QA_STUDENT_USER`
- `QA_STUDENT_PASS`
- `QA_TEACHER_USER`
- `QA_TEACHER_PASS`
- `QA_SUPERADMIN_USER`
- `QA_SUPERADMIN_PASS`
- `QA_STUDENT_CODE`
- `QA_GROUP_CODE`

`QA_BANK_DOCUMENT` **no pertenece al conjunto read-only**. Solo debe configurarse si en el futuro existe autorización explícita para probar la ruta mutante de pagos.

## Gate automático

`qa_auth_e2_readonly_contract_cs21a210bo.mjs` falla si:

- el workflow deja de fijar `QA_EXECUTE_WRITES=NO`;
- aparece un input `execute_writes`;
- el preflight read-only vuelve a exigir `QA_BANK_DOCUMENT`;
- desaparece el guard `CS21A138_STAGING_ONLY` del runner heredado.

## Límites

- QA only.
- Sin merge a `main`.
- Sin Apps Script push/deploy.
- Sin PROD.
- Sin pagos, notas, asistencia ni cierres.
- Sin credenciales versionadas.
