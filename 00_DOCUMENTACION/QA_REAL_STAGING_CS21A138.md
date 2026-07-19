# QA real de staging · CS21A138

Fecha de preparación: 19 de julio de 2026.

## Objetivo

Probar con backend y Drive reales los flujos de Estudiante, Docente y Superadmin sin escribir en las hojas productivas.

## Aislamiento creado

En Drive existe una carpeta privada `QA_STAGING_CAMPUS_2026-07-19` con dos copias:

- `QA_APOLLO_G3_STAGING_2026-07-19`.
- `QA_CAMPUS_OPERATIVO_STAGING_2026-07-19`.

Las copias contienen registros claramente identificados con prefijo `QA-` y un grupo de prueba terminado en `-99XX`. No deben compartirse públicamente porque son copias de hojas operativas.

## Backend de staging

Se generó un `Code_QA_STAGING_CS21A138.gs` a partir del backend canónico observado. Sus dos IDs principales apuntan exclusivamente a las copias QA.

Al final debe conservarse `qa/apps_script_qa_guard_cs21a138.gs`. Esa capa:

- añade el marcador `QA_STAGING_CS21A138` a `getInfoGeneral`;
- comprueba las propiedades `QA_STAGING_MASTER_ID` y `QA_STAGING_OPERATIVO_ID`;
- bloquea pagos, notas, evaluaciones, asistencia y cierres sin confirmación explícita;
- rechaza estudiantes que no comiencen con `QA-`;
- rechaza grupos que no terminen en `-99XX`;
- rechaza comprobantes bancarios que no comiencen con `QA`.

## Paso manual obligatorio

Google Apps Script no está conectado como herramienta de escritura en esta conversación. Por eso debe hacerse una sola acción manual:

1. Crear un proyecto Apps Script separado.
2. Pegar el contenido completo de `Code_QA_STAGING_CS21A138.gs`.
3. Configurar en Script Properties:
   - `QA_STAGING_MASTER_ID`: ID de la copia QA maestra.
   - `QA_STAGING_OPERATIVO_ID`: ID de la copia QA operativa.
4. Desplegarlo como aplicación web de staging.
5. Guardar la URL únicamente en el secreto GitHub `QA_STAGING_APPS_SCRIPT_URL`.

Nunca reemplazar el deployment productivo con este archivo.

## Prueba real de lectura

Workflow: `Real QA Staging CS21A138`.

El job `real-readonly`:

- consulta mediante GET los endpoints públicos reales de Apps Script;
- comprueba los doce PDFs oficiales de SB, TB y WB;
- no envía token, usuario, contraseña o POST;
- genera JSON y Markdown como artefactos.

## Prueba autenticada

El job `authenticated-staging` solo se habilita manualmente y requiere secretos. Realiza:

- inicio de sesión real de Estudiante, Docente y Superadmin;
- lecturas reales de expediente, evaluaciones, calendario, grupos y pagos;
- seis escenarios de Chromium: móvil y escritorio;
- redirección transparente de las solicitudes del frontend local al Apps Script de staging;
- capturas y errores de consola.

## Escrituras controladas

La casilla `execute_writes` permanece desactivada por defecto. Al habilitarla, y únicamente después de validar el marcador de staging, se prueba:

1. Pago QA de matrícula.
2. Reenvío del mismo pago para confirmar idempotencia.
3. Nota QA `ORAL_1`.
4. Asistencia QA.
5. Lectura posterior del estudiante para comprobar persistencia.

No se prueba una escritura si la URL coincide con producción o si el backend no demuestra que ambas hojas son las copias autorizadas.

## Secretos necesarios

- `QA_STAGING_APPS_SCRIPT_URL`
- `QA_STUDENT_USER`
- `QA_STUDENT_PASS`
- `QA_TEACHER_USER`
- `QA_TEACHER_PASS`
- `QA_SUPERADMIN_USER`
- `QA_SUPERADMIN_PASS`
- `QA_STUDENT_CODE`
- `QA_GROUP_CODE`
- `QA_BANK_DOCUMENT`

No registrar valores reales en commits, issues, logs o capturas.

## Dos dispositivos

La revisión automatizada usa dos perfiles independientes de Chromium:

- móvil de 390 × 844;
- escritorio de 1440 × 900.

Esto prueba sesiones y UI independientes, pero no sustituye la última confirmación física desde un teléfono y una computadora conectados simultáneamente.
