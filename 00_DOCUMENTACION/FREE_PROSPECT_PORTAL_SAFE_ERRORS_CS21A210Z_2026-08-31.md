# CS21A210Z · Portal de prematrícula · errores seguros

Fecha: 2026-08-31

## Base
- PR #237 / `fix/matriculas-safe-errors-cs21a210x`
- base exacta: `bdafd4fe1f5c0c88acd1b3bf0c4c06c2a8735d61`
- preimagen funcional `src/prospect_free_student.jsx`: `20eab6a6e711794b9acf761354e98ea845ed861d`

## Hallazgo
CS21A210Y V3 midió 79 hallazgos / 23 archivos y registró tres cruces crudos en `src/prospect_free_student.jsx`:
1. carga de `freeUserMiPerfil`;
2. solicitud `QUIERO_MATRICULARME`;
3. solicitud `HABLAR_ASESOR`.

El módulo ya tenía `freeStudentSafeError()` para errores backend, pero los `catch` publicaban `e.message` directamente. Una excepción de transporte podía por tanto llegar sin filtrar a la UI.

## Corrección
Se agrega `freeStudentVisibleError(error, fallback, context)`:
- registra el detalle técnico solo en consola;
- trata fallos de transporte/red con copy estable;
- reutiliza `freeStudentSafeError()` para mensajes backend ya filtrados;
- elimina los tres `setError(e.message)` inventariados.

Fallbacks:
- perfil: `No pudimos cargar tu información. Intentá nuevamente o contactá a tu asesor.`
- entrada English LAB: `No se pudo solicitar la entrada. Intentá nuevamente.`
- contacto con asesor: `No se pudo contactar al asesor. Intentá nuevamente.`

## Contratos preservados
- `freeUserMiPerfil`;
- `freeUserCrearSolicitud`;
- tipos `QUIERO_MATRICULARME` y `HABLAR_ASESOR`;
- token en body vía `freeStudentPost`;
- `window.anEnglishLabFreeAccess.prime`;
- `window.anEnglishLabFreeAccess.get`;
- evento `an:english-lab-free-access`;
- evento `an:free-user-solicitudes-changed`;
- navegación `academia_play`;
- WhatsApp directo al asesor cuando existe número.

## English LAB source truth
El primer bootstrap `33449324992` falló después de que preimagen, patch y guard Z pasaran. La causa fue de QA: el workflow intentó ejecutar `scripts/qa_cs21a202_source_truth.mjs`, archivo ausente en esta punta. No se publicó source funcional.

Se corrigió exclusivamente el wiring de QA para reproducir la política del guard global:
- si el script estricto local existe, se ejecuta;
- si no existe, Z falla si intenta modificar `src/english_lab`, `styles/english_lab` o browser runtime;
- el workflow global `English LAB Source Truth Guard` continúa como autoridad en PR.

Segundo bootstrap `33449494017`: SUCCESS completo:
- preimagen exacta PASS;
- patch Z PASS;
- guard Z PASS;
- frontera English LAB PASS;
- regresión X PASS;
- regresión V PASS;
- `git diff --check` PASS;
- scope funcional exacto `src/prospect_free_student.jsx` PASS.

Source temporal validado por Actions: `56f7a15381b9cc72e23f9fef6f3ea33b0e1181f5`.
Blob funcional validado: `2b73868e613deb8a7ca7e95c19a6b1323839c221`.

## Límite de evidencia
- E0: sí.
- E1 source/QA: sí una vez que el commit final y sus checks terminen verdes.
- E2 autenticado/runtime: no demostrado por este corte.
- `BACKEND CURRENT SNAPSHOT UNVERIFIED`: vigente.
- Apps Script, Drive ACL, `main` y PROD: no tocados.

**SOURCE/QA ONLY · NO PROD · NO AUTO-MERGE**
