# CS21A210K · CONAPE/Cobranza · errores y copy seguros sobre punta vigente

Fecha: 2026-08-31 · Costa Rica

## Base exacta
- Base: PR #227 / `fix/admin-becas-current-tip-cs21a210j`
- SHA base: `ed69a64aeedd9a858cce129f84c0eec9a9d25b3d`
- `src/conape_cobranza.jsx` base blob: `18f74c6ccc2f3fd6f9b93ef47ab397613b340bd4`
- Rama: `fix/conape-cobranza-safe-copy-cs21a210k`

## Ownership confirmado
`src/app.jsx` registra la ruta lazy efectiva `conape` con `src/conape_cobranza.jsx`, por lo que estas fugas pertenecen a una superficie real del Admin y no a código histórico inerte.

## Hallazgos
1. La carga de `getPanelConapeCobranza` publicaba `e.message` directamente.
2. La sincronización `sincronizarCONAPE` publicaba `e.message` directamente.
3. Un `r.mensaje` de éxito se mostraba sin frontera.
4. La cabecera mostraba `WS CONAPE`, copy de implementación innecesario.
5. La tarjeta Activos CONAPE decía `Estudiantes en DATOS`, exponiendo el nombre interno de una hoja.
6. Tarjetas/copia/CSV podían presentar códigos crudos como `CONAPE_SOLICITUD`, `CONAPE_DOCUMENTOS`, `CON_DESEMBOLSO` y `APROBADO_SIN_DESEMBOLSO`.
7. El CSV usaba nombres de campo internos como encabezados visibles.

## Corrección
Único archivo funcional: `src/conape_cobranza.jsx`.

- `ccSafeUserError()` conserva mensajes humanos y deja diagnóstico técnico solo en consola.
- carga, sincronización y mensaje de éxito pasan por la frontera segura.
- `ccStatusLabel()` traduce códigos únicamente en presentación/exportación; filtros y contrato de datos siguen usando los valores crudos.
- `WS CONAPE` → `Última sincronización CONAPE`.
- `Estudiantes en DATOS...` → `Estudiantes activos con convenio CONAPE.`
- badges de etapa/novedad muestran copy humano.
- CSV usa encabezados humanos y valores presentables.
- el texto copiado de seguimiento usa etapa humanizada.

## Bootstrap inicial abortado y corrección
Primer candidato bootstrap: `1ddb6ab6f0cb7d642a210e10df69ff8d4253bc6e`.

Run `33439525684`: **FAIL antes de cualquier commit/push funcional**.

El patcher confirmó y aplicó en el working tree temporal las primeras cinco preimágenes y abortó en `friendly copied stage: expected exact preimage once, found 0`. La causa fue únicamente un matcher sobreescapado del template literal de la línea copiada. El job se detuvo antes del guard, regresiones y commit; no se preservó source parcial.

Se corrigió únicamente ese matcher y la rama se reescribió desde el SHA base #227.

## Segundo bootstrap
Candidato bootstrap v2: `2bf3837b4d8cae2d7b0bce68fc85b58d2f3da3b6`.

Run `33439694791`: **SUCCESS completo**.

El workflow aplicó todas las preimágenes exactas, ejecutó el guard CS21A210K, regresó CS21A210J y CS21A210I, validó `git diff --check` y publicó el source verificado mediante commit temporal `743a6ae75b5bf9ba05d78c2a4a80adc9ab54b4c6`.

Blob funcional verificado: `fe787055b3e7b690c5c69d2902225ec43aee3868`.

Antes de abrir PR, la rama se reconstruye como un único commit directo sobre #227, conservando solamente:
1. `src/conape_cobranza.jsx`;
2. guard CS21A210K;
3. workflow QA final;
4. esta documentación.

Los artefactos bootstrap no forman parte del candidato final.

## Invariantes
No se modifica:
- `postConapeCobranza()`;
- token en POST body;
- `getPanelConapeCobranza`;
- `sincronizarCONAPE`;
- condiciones de filtros sobre `ws_novedad`/`etapa`;
- KPIs, cálculos, prospectos, estudiantes, grupos o asesores;
- navegación a `calendario_grupo`;
- exportación/copia como funciones;
- Apps Script;
- Drive ACL;
- main;
- producción.

## QA
El guard exige:
- frontera de error segura;
- cero sinks directos `e.message` en carga/sync;
- mensaje de éxito protegido;
- copy `DATOS`/`WS CONAPE` retirado;
- códigos CONAPE humanizados en las superficies guardadas;
- encabezados CSV humanos;
- token, endpoints, filtros, exportación y navegación preservados;
- scope final exacto de cuatro rutas con `--exact-scope`.

## Evidencia
- E0: source + guard + bootstrap exacto verde.
- E1: sujeto al QA del head final reconstruido y checks de PR.
- E2 autenticado/runtime: NO demostrado.

**NO PROD · NO AUTO-MERGE · NO Apps Script write/deploy · NO ACL changes.**
