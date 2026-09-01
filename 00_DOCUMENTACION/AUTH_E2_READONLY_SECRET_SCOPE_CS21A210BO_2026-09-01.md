# CS21A210BO · E2 autenticado read-only · alcance de secretos

Fecha: 2026-09-01
Estado: DRAFT / QA ONLY / NO PROD / NO WRITES

## Base

- PR padre: #264 / CS21A210BL
- base: `candidate/green-spine-integration-cs21a210bl`
- SHA base: `8a2d0227b52a345fdf21fe2b2fb9e9c8ff4706ba`

## Propósito

Separar el E2 autenticado de lectura del flujo mutante heredado y validar estudiante, docente y superadmin contra el Web App QA sin exigir secretos de escritura.

## Seguridad BO

- URL QA explícita por `QA_STAGING_APPS_SCRIPT_URL`.
- La URL se rechaza si coincide con la URL Apps Script productiva del frontend.
- `QA_EXECUTE_WRITES=NO` queda fijo en los workflows BO.
- El runner BO especializado no contiene operaciones de pago, notas, asistencia ni cierres.
- `QA_BANK_DOCUMENT` no se requiere ni consume.
- Antes de transmitir usuarios o contraseñas se validan localmente:
  - `QA_STUDENT_CODE` con prefijo `QA-`;
  - `QA_GROUP_CODE` con sufijo `-99XX`;
  - las tres cuentas con prefijo `qa_`.
- Después se ejecuta una única prueba pública/read-only `getInfoGeneral` y se exige el contrato nativo QA CS21A144:
  - `qa_staging === true`;
  - `qa_marker === QA_STAGING_CS21A144`;
  - `qa_ids_ok === true`;
  - `qa_properties_configured === true`.
- Solo si todo lo anterior pasa se transmiten las credenciales QA para login y lecturas E2.

## Secretos necesarios para E2 read-only

- `QA_STAGING_APPS_SCRIPT_URL`
- `QA_STUDENT_USER`
- `QA_STUDENT_PASS`
- `QA_TEACHER_USER`
- `QA_TEACHER_PASS`
- `QA_SUPERADMIN_USER`
- `QA_SUPERADMIN_PASS`
- `QA_STUDENT_CODE`
- `QA_GROUP_CODE`

`QA_BANK_DOCUMENT` **no pertenece al conjunto read-only**.

## Por qué NO se usa `getGruposDisponibles` como identidad del entorno

El run manual #211 (`33547954511`) sobre el deployment que Apps Script muestra actualmente bajo `Activa` demostró:

- Real QA GET-only: **APTO 15/15**;
- `getInfoGeneral`, `getInscripcionPublicConfig` y `getGruposDisponibles`: JSON HTTP 200;
- `getInfoGeneral` expone las claves QA nativas esperadas;
- el grupo QA sentinel configurado no aparece en el catálogo de `getGruposDisponibles`;
- el runner BO se detuvo antes de enviar usuarios o contraseñas.

El catálogo de grupos puede filtrar por estado/visibilidad y no es una prueba estable de identidad del deployment. El proof nativo de `getInfoGeneral` fue diseñado explícitamente para staging CS21A144 y es más fuerte.

## Evidencia run #211

- run: `33547954511`
- HEAD: `7f9de06545e1c1132f0b6ed7ba7efd8271f65994`
- `real-readonly`: APTO 15/15, P0/P1/P2/P3 = 0;
- `authenticated-staging`: BLOQUEADO antes de credenciales por sentinel de grupo ausente;
- cero writes; cero PROD.

## HEAD corregido

El runner y sus contratos fueron corregidos para usar el proof nativo QA antes del primer login.

Checks sobre `cc24830f6ef12d546f33fc522fbdcc6d7acefa08`:

- QA Auth E2 Readonly Secret Scope CS21A210BO run `33548532085`: **SUCCESS**.
- English LAB Source Truth Guard run `33548532056`: **SUCCESS**.

## Límites

- QA only.
- Sin merge a `main`.
- Sin Apps Script push/deploy.
- Sin PROD.
- Sin pagos, notas, asistencia ni cierres.
- Sin credenciales versionadas.

## Siguiente gate

Ejecutar de nuevo `Real QA Staging CS21A138` seleccionando la rama BO, con autenticado habilitado y writes desmarcado. El job autenticado usa el runner BO especializado y permanece exclusivamente read-only.
