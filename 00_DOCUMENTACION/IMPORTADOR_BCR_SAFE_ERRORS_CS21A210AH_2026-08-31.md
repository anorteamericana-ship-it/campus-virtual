# CS21A210AH · Importador BCR efectivo · errores seguros

Fecha: 2026-08-31

## Base
- PR #241 / `fix/sidebar-superadmin-safe-errors-cs21a210af`
- base exacta: `758d96aed5d99b9e7bb40e1b94f7dfa9045764ba`
- preimagen `src/importador_banco_integridad_cs21a114.jsx`: `8f7495f21c4da95eae9fc180c67e9d778f89195e`

## Ownership efectivo
`src/importador_banco_loader_cs21a114.js` carga `src/importador_banco_integridad_cs21a114.jsx` y CS21A114 reemplaza dinámicamente `window.ImportadorBancario` cuando está disponible el módulo original. La documentación `README_F98_4_Z6_CS21A114_IMPORTADOR_BCR.md` identifica este archivo como el frontend de integridad vigente.

## Hallazgo
CS21A210AG V3 midió **70 hallazgos / 19 archivos** y reportó un sink raw en este archivo. La revisión manual completa encontró otras dos fronteras visibles no detectadas por V3:
- validación/previsualización: `String(e?.message||e)` y copy técnico sobre Code.gs/Apps Script;
- lectura de archivo: `err.message` concatenado a UI;
- confirmación/importación: `String(e?.message||e)`.

Por lo tanto AH sanea la frontera completa, no solo la línea inventariada.

## Corrección
Se incorpora `bank114SafeUserError(raw, fallback, context)`:
- detalle original únicamente en `console.warn`;
- nunca devuelve texto arbitrario del backend;
- solo conserva tres mensajes locales conocidos: sesión administrativa ausente, archivo sin movimientos válidos y cambio concurrente durante revisión;
- cualquier otro error usa copy estable según contexto.

Se elimina de UI el mensaje técnico que indicaba publicar `Code.gs CS21A114` en Apps Script.

## Integridad bancaria congelada
AH no cambia:
- token administrativo;
- `previsualizarExtractoBanco`;
- `importarExtracto`;
- estados `NUEVO`, `YA_EXISTE`, `DUPLICADO_ARCHIVO`, `CONFLICTO`, `CONFLICTO_ARCHIVO`, `DEBITO`, `INVALIDO`;
- manejo especial `conflictos_bancarios`;
- reanálisis de todos los movimientos cuando la base cambia;
- selección exclusiva de movimientos `NUEVO`;
- confirmación final mediante `data.agregados_docs`;
- parser BCR ni montos;
- loader CS21A114;
- instalación dinámica `window.ImportadorBancario = window.ImportadorBancarioCS21A114`.

## Evidencia bootstrap
Run `33452943679`: **SUCCESS completo**:
- preimagen exacta PASS;
- patch exacto PASS;
- parser JSX PASS;
- guard AH + contrato CS21A114 PASS;
- reconstrucción exacta del blob base PASS;
- regresión AF PASS;
- regresión AD PASS;
- regresión AB PASS;
- diff hygiene PASS;
- scope funcional exacto `src/importador_banco_integridad_cs21a114.jsx` PASS.

Source temporal validado por Actions: `bc91c9e865d813d74762ed7234425a900e06ab06`.
Blob funcional validado: `2e1b2a3dda50fd1d56ddd23d7246ecb731841b64`.

La rama final se reconstruye como un único commit directo sobre #241; patcher/bootstrap quedan fuera.

## Límites
Este corte no demuestra que los endpoints backend estén instalados o funcionales en el deployment QA actual. No se toca Apps Script ni se usa el snapshot histórico CS21A114 para instalar backend.

- E0: sí.
- E1 source/QA: sí una vez que commit final y PR estén verdes.
- E2 autenticado/runtime: no demostrado.
- `BACKEND CURRENT SNAPSHOT UNVERIFIED`: vigente.
- Apps Script, Drive ACL, main y PROD: no tocados.

**DRAFT · SOURCE/QA ONLY · BANK INTEGRITY CONTRACT FROZEN · NO BACKEND WRITE · NO PROD · NO AUTO-MERGE**
