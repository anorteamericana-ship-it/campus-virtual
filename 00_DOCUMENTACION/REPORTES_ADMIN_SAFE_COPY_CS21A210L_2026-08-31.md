# CS21A210L · Reportes Admin · errores y copy seguros

Fecha: 31-ago-2026

## Base exacta
- PR #228 / `fix/conape-cobranza-safe-copy-cs21a210k`
- commit: `bfa8ad5b0c7ba248360a2a49bd201cfdca30de86`
- preimagen `src/reportes_admin.jsx`: `66ca9c38f5e5ec77cf949566e7cd36f3f40e31f5`

## Superficie efectiva
`src/app.jsx` registra `reportes` como ruta lazy y `src/sidebar.jsx` la expone en el menú Admin. No es código histórico inerte.

## Hallazgos corregidos
1. La carga del panel enviaba `e.message || String(e)` directamente a la UI.
2. El encabezado visible mostraba `F38 · Dirección`, identificador interno sin valor operativo.

## Corrección mínima
- `repSafeUserError()` mantiene el detalle técnico en consola y presenta fallback seguro al operador;
- el catch de carga cruza esa frontera;
- `F38 · Dirección` pasa a `Dirección académica`.

## Contratos preservados
- `getReportesAdministrativos`;
- token de sesión en body POST;
- `detalle: true`;
- asignación `setData(r)`;
- liberación de loading en `finally`;
- KPIs, prioridades, grupos, docentes, certificados, mora, exámenes, cierres y notas;
- estados académicos `CA`, `APR/CNV`, `REP`;
- CSV, copiar resumen e impresión;
- Apps Script / ACL / main / PROD intactos.

## Evidencia
Bootstrap `33441156704`: **SUCCESS en primer intento**.
- verificó ancestry exacta desde #228;
- verificó preimagen funcional `66ca9c38...`;
- aplicó exactamente las tres sustituciones;
- guard CS21A210L: PASS;
- regresión CS21A210K: PASS;
- regresión CS21A210J: PASS;
- `git diff --check`: PASS;
- source temporal verificado: commit `6b34e81999ad34fc9f678cf8019e11e777ac0e63`, blob funcional `501aec6531451fbb25eb555966386914de49a7ea`.

Después del bootstrap la rama se reconstruye desde el árbol exacto de #228 como un único commit final con cuatro rutas: 1 funcional + guard + workflow + documentación. Los artefactos bootstrap no forman parte del candidato final.

## Estado de evidencia
- E0: sí.
- E1 source/QA: sí para bootstrap; QA final/PR debe permanecer verde antes del checkpoint canónico.
- E2 autenticado/runtime: NO ejecutado.
- backend modular QA vigente: NO verificado.
- PROD: NO tocado.

**SOURCE/QA ONLY · NO PROD · NO AUTO-MERGE**
