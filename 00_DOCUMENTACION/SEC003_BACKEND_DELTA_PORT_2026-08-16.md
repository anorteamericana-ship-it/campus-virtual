# SEC-003 · Port seguro del delta backend sobre QA acumulado

Fecha original: 2026-08-16  
Reconciliación de política: 2026-08-21  
Estado: **DELTA V2 PREPARADO · SALA_MIXTA_AUTORIZADA · NO INSTALADO**

## Por qué existe este documento

El primer candidato SEC-003 fue generado como un `Code.gs` completo a partir de una base canónica observada de julio. Ese archivo completo **no debe reemplazar** el backend del proyecto Apps Script QA actual.

Issue #78 documenta que el proyecto QA acumuló capas posteriores. Reemplazarlo con un candidato completo histórico puede eliminar trabajo posterior de English LAB y otras superficies.

La unidad correcta de port sigue siendo el **delta SEC-003 sobre `Code.gs`**, no el archivo completo.

## Decisión de producto incorporada en V2

El usuario autorizó explícitamente la política:

`SALA_MIXTA_AUTORIZADA`

Un estudiante autenticado y matriculado puede entrar a una sala `LAB-####` válida aunque la sala pertenezca a otro grupo. Esto permite sesiones combinadas, Club I CAN y actividades especiales.

La V2 elimina únicamente la restricción histórica de pertenencia al mismo grupo. Se conservan:

- sesión Campus obligatoria;
- rol `student`;
- código de estudiante matriculado derivado de sesión;
- identidad/nombre derivados de sesión;
- room code existente;
- player state y leaderboard autenticados;
- anti-forjado de identidad;
- ocultamiento de `correct`/`explanation` durante ronda OPEN;
- controles docentes restringidos a roles autorizados.

## Artefacto portable vigente

`qa/sec003_codegs_live_auth_delta.patch`

El delta histórico se extrajo entre:

- base observada: `Code.gs` SHA-256 `d24fc63c59e60ba92808d4d870f4eb95e35bb6f1c158a130229b187a66e35d37`;
- candidato histórico V1: SHA-256 `02fe9adab5e9fa260a7b335e030597458ab85ddf5038bc2e22a14fe39ccfe47e`.

La **V2 vigente ya no es byte-exacta al candidato V1**, de forma deliberada: el helper de autorización de sala fue reconciliado a `SALA_MIXTA_AUTORIZADA`.

El archivo completo V1 queda únicamente como evidencia histórica. **No reconstruirlo ni instalarlo** para recuperar la vieja restricción `MISMO_GRUPO`.

La V2 mantiene 7 hunks y afecta la misma superficie funcional:

- helper `_elivePlayerState_`;
- `englishLabLiveJoinRoom`;
- `englishLabLiveGetPlayerState`;
- definición histórica de `englishLabLiveSubmitAnswer`;
- redefinición efectiva CS20D de `englishLabLiveSubmitAnswer`;
- `englishLabLiveGetLeaderboard`;
- `englishLabLiveGetQuestionBankMeta`;
- helpers de autenticación/proyección player-safe.

No hay cambios a endpoints `englishLabMemoryMatch*`, timers, sincronización, estado o motor de Memory Match.

## QA fuente actualizada

- `scripts/qa_sec003_backend_delta_portable.mjs` verifica estructura/markers y frontera Memory Match.
- `scripts/qa_sec003_english_lab_live_backend_candidate.mjs` ahora exige que:
  - una sesión inválida falle antes de I/O;
  - identidad forjada sea ignorada;
  - estudiante sin código matriculado falle;
  - estudiante autenticado del mismo grupo pueda entrar;
  - estudiante autenticado de **otro grupo también pueda entrar** a una sala válida;
  - el join mixto siga escribiendo únicamente identidad canónica de sesión;
  - OPEN no filtre respuesta correcta y CLOSED pueda revelar;
  - leaderboard y metadata sigan autenticados.

## Procedimiento correcto en Apps Script QA

Antes de cualquier instalación manual:

1. abrir el proyecto Apps Script QA correcto, no producción;
2. respaldar el `Code.gs` **actual del proyecto QA en ese momento** y registrar el proyecto completo;
3. enumerar archivos `.gs` y wrappers `doPost` efectivos;
4. confirmar que las capas acumuladas esperadas siguen presentes;
5. comprobar que las preimágenes de los 7 hunks todavía coinciden con el `Code.gs` QA actual;
6. si alguna preimagen difiere, **detenerse** y reconciliar; no forzar el patch;
7. aplicar exclusivamente las líneas SEC-003 V2 al `Code.gs` actual;
8. no modificar ningún archivo/capa Memory Match;
9. ejecutar QA offline y regresiones acumuladas English LAB;
10. conservar el mismo deployment ID/URL QA;
11. ejecutar smokes autenticados: estudiante mismo grupo, estudiante otro grupo, sin token, identidad forjada, docente;
12. inspeccionar JSON OPEN/CLOSED antes de considerar promoción.

## Gate de seguridad

No instalar si ocurre cualquiera de estos casos:

- `Code.gs` QA actual no conserva las preimágenes esperadas;
- el cambio requiere editar un endpoint `englishLabMemoryMatch*`;
- el diff de instalación incluye archivos ajenos sin razón documentada;
- el deployment no corresponde al `/exec` QA canónico;
- no existe backup/rollback previo;
- reaparece la restricción `MISMO_GRUPO` sin una nueva decisión explícita del usuario.

**NO PROD · NO REEMPLAZO COMPLETO DE BACKEND · MEMORY MATCH FROZEN · SALA_MIXTA_AUTORIZADA.**
