# CS21A210AL · Ventas · calendario y matrículas con errores seguros

Fecha: 2026-08-31

## Base
- PR #243 / `fix/matriculas-calendario-safe-errors-cs21a210aj`
- base exacta: `818a729ba11eacc85ef6b23d48246c7ea79ec045`
- preimagen `src/ventas_calendario.jsx`: `b9b11b349d8f25d7352cf20904adc0e2e2c4e794`

## Ownership efectivo
`ventas.html` carga estáticamente `src/ventas_calendario.jsx` antes de `src/ventas_dashboard.jsx`.
El dashboard vigente monta `window.MiMatriculasMes`; `MiCalendarioSemanal` permanece exportado/cargado pero no está montado por el dashboard actual.

## Hallazgo
CS21A210AK V3 midió **68 hallazgos / 17 archivos** y detectó dos sinks `e.message` en este módulo:
- calendario semanal: frontera latente cargada, actualmente no montada por dashboard;
- matrículas mensuales: frontera runtime vigente y visible.

La revisión manual encontró además una tercera fuga visible no detectada por V3: el aviso mensual mostraba al asesor la palabra `backend` y el endpoint `getCalendarioMatriculas`.

## Corrección
Se incorpora `ventasCalendarioSafeUserError(raw, fallback, context)`:
- detalle original únicamente en `console.warn`;
- nunca devuelve texto técnico arbitrario a UI;
- semanal: `No pudimos cargar tu calendario. Intentá nuevamente.`;
- mensual: `No pudimos cargar tus matrículas. Intentá nuevamente.`.

El aviso técnico mensual se reemplaza por:
`Mostrando solo la semana actual. La vista mensual completa todavía no está disponible.`

## Contrato congelado
AL no cambia:
- carga de `src/ventas_calendario.jsx` desde `ventas.html`;
- montaje vigente `<window.MiMatriculasMes asesor={scopeAsesor} />`;
- export de `MiCalendarioSemanal`;
- exactamente dos llamadas a `window.getCalendarioMatriculas`;
- `asesor_filtro`;
- `con_tendencia: false`;
- `mes: mesISO` en vista mensual;
- reintento mediante `tick`;
- agrupación `mmExtraerPorFecha` / `mmConstruirSemanas`;
- autenticación, roles, sesión y scope de Ventas;
- `data.jsx`, backend y Apps Script.

## Evidencia bootstrap
Run `33455509776`: **SUCCESS completo**:
- preimagen exacta PASS;
- patch exacto de tres fronteras PASS;
- parser JSX PASS;
- guard AL + reconstrucción exacta PASS;
- Ventas safe-user CS21A173 PASS;
- Matrículas/Ventas security CS21A177 PASS;
- Ventas integration CS21A166 PASS;
- Sales auth REL-002 CS21A155 PASS;
- regresión AJ PASS;
- diff hygiene PASS;
- scope funcional exacto `src/ventas_calendario.jsx` PASS.

Source temporal validado por Actions: `15c862f2de90cbbcb3a19430a26f2c98d8cbea6f`.
Blob funcional validado: `e90369535f4bb70d16f0dcbbdee061a0761f9a8b`.

La rama final se reconstruye como un único commit directo sobre #243; patcher/bootstrap quedan fuera.

## Clasificación de auditoría relacionada
- `src/syllabus_views (1).jsx` se clasifica legacy/no-runtime: `app.jsx` carga el canonical `src/syllabus_views.jsx`, que ya usa una frontera controlada.
- no se modifica la copia `(1)` para reducir artificialmente la métrica.

## Límites
- E0: sí.
- E1 source/QA: sí una vez que commit final y checks de PR estén verdes.
- E2 autenticado/runtime: no demostrado.
- `BACKEND CURRENT SNAPSHOT UNVERIFIED`: vigente.
- Apps Script, Drive ACL, main y PROD: no tocados.

**DRAFT · SOURCE/QA ONLY · SALES AUTH/SCOPE FROZEN · NO BACKEND WRITE · NO PROD · NO AUTO-MERGE**
