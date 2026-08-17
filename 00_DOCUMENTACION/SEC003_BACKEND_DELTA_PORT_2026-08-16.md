# SEC-003 · Port seguro del delta backend sobre QA acumulado

Fecha: 2026-08-16
Estado: **DELTA EXTRAÍDO Y VERIFICADO · NO INSTALADO**

## Por qué existe este documento

El primer candidato SEC-003 fue generado como un `Code.gs` completo a partir de la base canónica observada de julio. Ese archivo completo **no debe reemplazar** el backend del proyecto Apps Script QA actual.

Issue #78 documenta que el proyecto QA actual conserva el backend base y además ya incorporó `99_CS21A201_ENGLISH_LAB_UNIFIED_COMPLETO.gs` y otros artefactos de diagnóstico. Reemplazar el proyecto con el candidato completo de julio podría eliminar la pila acumulada English LAB/Memory Match.

La unidad correcta de port es el **delta SEC-003 sobre `Code.gs`**, no el archivo completo.

## Artefacto portable

`qa/sec003_codegs_live_auth_delta.patch`

El delta se extrajo entre:

- base: `Code.gs` SHA-256 `d24fc63c59e60ba92808d4d870f4eb95e35bb6f1c158a130229b187a66e35d37`;
- candidato SEC-003: SHA-256 `02fe9adab5e9fa260a7b335e030597458ab85ddf5038bc2e22a14fe39ccfe47e`.

Resultado del diff: **7 hunks**.

Superficie afectada:

- helper `_elivePlayerState_`;
- `englishLabLiveJoinRoom`;
- `englishLabLiveGetPlayerState`;
- definición histórica de `englishLabLiveSubmitAnswer`;
- redefinición efectiva CS20D de `englishLabLiveSubmitAnswer`;
- `englishLabLiveGetLeaderboard`;
- `englishLabLiveGetQuestionBankMeta`;
- cinco helpers nuevos de autenticación/proyección player-safe.

No hay cambios a endpoints `englishLabMemoryMatch*`, timers, sincronización, estado o motor de Memory Match.

## Reproducción local del delta

Se aplicó `qa/sec003_codegs_live_auth_delta.patch` sobre una copia byte-exacta del `Code.gs` base.

Resultado:

- patch aplicado sin conflicto;
- SHA-256 resultante: `02fe9adab5e9fa260a7b335e030597458ab85ddf5038bc2e22a14fe39ccfe47e`;
- `cmp` contra el candidato Drive: **EXACT MATCH**.

Esto demuestra que el candidato completo puede reconstruirse a partir del base + los 7 hunks y que no hace falta tratar 2,97 MB como una unidad de reemplazo.

## Procedimiento correcto en Apps Script QA

Antes de cualquier instalación manual:

1. abrir el proyecto Apps Script QA correcto, no producción;
2. respaldar el `Code.gs` **actual del proyecto QA en ese momento**;
3. confirmar que `99_CS21A201_ENGLISH_LAB_UNIFIED_COMPLETO.gs` y cualquier capa posterior siguen presentes;
4. comprobar que las preimágenes de los 7 hunks todavía coinciden con el `Code.gs` QA actual;
5. si alguna preimagen difiere, **detenerse** y reconciliar manualmente; no forzar el patch;
6. aplicar exclusivamente las líneas SEC-003 al `Code.gs` actual;
7. no modificar ningún archivo/capa Memory Match;
8. volver a ejecutar las pruebas offline SEC-003 y las regresiones acumuladas English LAB;
9. limpiar testers temporales antes de versionar el web-app;
10. actualizar la implementación QA existente conservando el mismo deployment ID/URL; no crear un `/exec` paralelo;
11. realizar los smokes autenticados de estudiante/docente y la inspección OPEN/CLOSED antes de considerar promoción.

## Limitación de esta sesión

La integración disponible puede inspeccionar GitHub/Drive y verificar el `/exec` ya publicado, pero no dispone de una acción Apps Script/clasp con permiso para editar el source del proyecto o crear/actualizar una versión de deployment.

Por tanto, **este delta no está instalado** y no se afirma cierre runtime de SEC-003.

## Gate de seguridad

No instalar si ocurre cualquiera de estos casos:

- `Code.gs` QA actual no conserva las preimágenes esperadas;
- el cambio requiere editar un endpoint `englishLabMemoryMatch*`;
- el diff de instalación incluye archivos ajenos a `Code.gs` sin una razón documentada;
- el deployment que se piensa actualizar no corresponde al `/exec` QA canónico;
- no existe backup/rollback previo.

**NO PROD · NO REEMPLAZO COMPLETO DE BACKEND · MEMORY MATCH READ-ONLY.**
