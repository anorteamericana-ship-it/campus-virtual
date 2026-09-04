# CS21A210AS · Importador BCR · wiring determinista del reemplazo seguro

Fecha local: 2026-08-31

## Base
- PR #246 / `fix/ican-safe-errors-cs21a210ap`
- base exacta: `2337bd0f4a159a2ae1f1a25a0e14aca4cae0ec29`
- preimagen `src/app.jsx`: `933e70943993c970b3f73218c5f29e18f3519a6b`

## Causa confirmada por AR
CS21A210AR auditó el wiring actual y confirmó:
- `campus.html` no carga `student_academic_summary_runtime_cs21a113b.js`, el loader 114 ni la implementación de integridad;
- la ruta `banco` de `src/app.jsx` cargaba únicamente `src/importador_banco.jsx`;
- la única referencia runtime al loader 114 estaba dentro de `student_academic_summary_runtime_cs21a113b.js`;
- ese runtime CS21A113B no tenía ninguna referencia runtime que lo cargara;
- AH/CS21A114 seguía sano y su contrato de instalación seguía verde.

Evidencia AR:
- run `33458452595`: SUCCESS;
- reporte persistido en `00_DOCUMENTACION/IMPORTADOR_BCR_WIRING_CS21A210AR_REPORT.txt` del branch de auditoría;
- head de reporte: `c9b144d19d7413ff8a2164f88ae75e7765d51523`.

Conclusión: la implementación segura CS21A114 existía pero estaba huérfana respecto de la ruta bancaria vigente.

## Corrección
La dependencia `F96_LAZY.banco` cambia de:

`src/importador_banco.jsx`

a carga secuencial:
1. `src/importador_banco.jsx`;
2. `src/importador_banco_integridad_cs21a114.jsx`.

`LazyModuleView` conserva `loadMany()` secuencial (`await loadOne` por archivo). Al ejecutar la segunda dependencia, CS21A114 ve que `window.ImportadorBancario` ya existe y ejecuta `bank114Install()`, sustituyéndolo por `window.ImportadorBancarioCS21A114` antes de que `LazyModuleView` resuelva/renderice el componente.

No se usa `importador_banco_loader_cs21a114.js` dentro de la lista de ruta porque ese loader inicia un `fetch` interno asíncrono y no ofrece una promesa a `loadMany`; eso podría dejar una carrera entre instalación y renderizado.

## Contrato congelado
AS no cambia:
- componente solicitado por la ruta: `ImportadorBancario`;
- `LazyRoute` ni `LazyModuleView`;
- orden secuencial de `loadMany`;
- normalización del importador base a CS21A124;
- `window.ImportadorBancarioCS21A114`;
- override `window.ImportadorBancario = window.ImportadorBancarioCS21A114`;
- `bank114SafeUserError` de AH;
- token administrativo;
- `previsualizarExtractoBanco`;
- `importarExtracto`;
- manejo `conflictos_bancarios`;
- clasificación NUEVO / YA_EXISTE / DUPLICADO / CONFLICTO;
- Apps Script, backend, BDBANCARIO, Drive ACL, main y PROD.

El guard de AS revierte exclusivamente la línea `F96_LAZY.banco` y exige reconstruir exactamente la preimagen `933e70943993c970b3f73218c5f29e18f3519a6b`.

## Evidencia bootstrap
Run `33458894185`: **SUCCESS completo**.
Pasaron:
- preimagen exacta;
- patch exacto de una sola ruta;
- parser JSX de `app.jsx` e implementación CS21A114;
- guard AS y reconstrucción SHA exacta;
- guard AH;
- regresiones AP / AN / AL / AJ;
- diff hygiene;
- scope funcional exacto `src/app.jsx`.

Source temporal validado por Actions: `03a4aa259fcb158fa15e22caa8e9804013848295`.
Blob funcional validado de `src/app.jsx`: `d57cf007013beca1b1830d2993ad69be8e049f64`.

La rama final se reconstruye como un único commit directo sobre #246; patcher/bootstrap quedan fuera.

## Sobre el inventario V3
`src/importador_banco.jsx` puede seguir apareciendo en el contador bruto porque V3 escanea archivos fuente sin modelar el override runtime. AS corrige la superficie efectiva; no modifica el archivo base solo para mejorar la métrica.

## Límites
- E0: sí.
- E1 source/QA: sí una vez que commit final y PR estén verdes.
- E2 autenticado/runtime: no demostrado.
- `BACKEND CURRENT SNAPSHOT UNVERIFIED`: vigente.
- Apps Script / Drive ACL / main / PROD: no tocados.

**DRAFT · SOURCE/QA ONLY · BCR INTEGRITY ROUTE WIRING · NO BACKEND WRITE · NO PROD · NO AUTO-MERGE**
