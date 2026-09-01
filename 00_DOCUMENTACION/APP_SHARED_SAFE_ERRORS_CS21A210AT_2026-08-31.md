# CS21A210AT · app.jsx · frontera compartida de errores segura

Fecha local: 2026-08-31

## Base final
- PR base: #247 · `fix/importador-bcr-wiring-cs21a210as`
- base exacta: `ec757e4bc32e5d3a0d7d720143806d9371a79630`
- preimagen `src/app.jsx`: `d57cf007013beca1b1830d2993ad69be8e049f64`
- source candidato funcional validado por bootstrap: `aa168e6fe6939e5292a4d232a2a10fe12680efd9`
- blob funcional `src/app.jsx`: `aa878e413646de138d43e5731f2c9afa6c7a42cb`

## Hallazgo
El inventario V3 posterior a AP dejó 4 findings en `src/app.jsx`. La revisión de data-flow confirmó que los cuatro alcanzaban UI:
1. carga de reposiciones para docente/admin → bloque visible `error`;
2. acción sobre una reposición → mismo bloque visible `error`;
3. carga de evaluaciones del estudiante → `StudentEvaluationSectionF984N` renderiza `state.error`;
4. verificación de disponibilidad de examen escrito → `WrittenSessionCardF929` renderiza `state.error`.

`src/app.jsx` es el root vigente cargado por `campus.html`; estos findings no son aliases ni copias legacy.

## Corrección funcional
Se agrega `appSafeUserErrorF91(raw, fallback, context)` y se enrutan por esa frontera los cuatro sinks.

Política:
- mensajes humanos/no técnicos se conservan;
- códigos técnicos y diagnóstico de Apps Script/backend/endpoint, HTTP, JSON, token, request/file id, stack/exception, SHA/MIME/base64 y nombres de endpoints internos se ocultan;
- el detalle técnico queda únicamente en `console.warn`;
- para diagnóstico técnico se presenta un fallback contextual amigable.

Fallbacks:
- reposiciones/listado: `No pudimos consultar las reposiciones. Intentá nuevamente.`
- reposiciones/acción: `No pudimos completar la operación de reposición. Intentá nuevamente.`
- evaluaciones del estudiante: `No pudimos cargar tus evaluaciones. Intentá nuevamente.`
- examen escrito docente: `No pudimos verificar la disponibilidad del examen escrito. Intentá nuevamente.`

## Contrato congelado
AT no cambia:
- `appPostF91` ni POST/token;
- `reposListarExamenes`;
- `reposResolverExamen`;
- `reposResolverSolicitudF92`;
- `reposProgramarEscrito`;
- `reposCoordinarOralF926`;
- `getMisNotasF921`;
- `examGetCronogramaExamAvailability`;
- filtros y estados de reposición;
- evaluación oral/escrita;
- wiring BCR CS21A210AS;
- English LAB;
- backend, Apps Script, Drive ACL, main ni PROD.

El guard AT revierte helper + cuatro sustituciones y exige reconstruir exactamente la preimagen `d57cf007013beca1b1830d2993ad69be8e049f64`.

## Bootstrap y aprendizaje de guards heredados
### Run 1 · `33460537327` · FAIL controlado
Pasaron patch AT, parser JSX y reconstrucción exacta. Falló únicamente el guard heredado AS porque pinneaba todo `app.jsx` al blob pre-AS y bloqueaba cualquier evolución legítima posterior aunque el wiring BCR siguiera intacto.

### Run 2 · `33460664347` · FAIL controlado
AT volvió a pasar. AS ya era route-local, pero una aserción global `^\s*banco:` contó propiedades `banco` de otros objetos del archivo compartido. Log exacto: `Unexpected duplicate banco route.` No existía una ruta F96_LAZY duplicada.

### Run 3 · `33460779818` · SUCCESS funcional/guards
Pasaron patch AT, parser JSX, guard AT, guard AS descendant-safe, AP, AN, AL, AJ, hygiene y scope funcional. Actions generó el source candidato `aa168e6...`.

## Corrección posterior de evidencia V3
Durante la revisión de AU se detectó un defecto de **tooling de QA**, no del patch funcional AT:
- `scripts/audit_raw_user_error_surface_v3_cs21a210s.mjs` existía en ramas históricas de auditoría pero no estaba integrado en la línea final;
- los pasos `node ... | tee ...` no usaban `set -o pipefail`;
- por eso un `MODULE_NOT_FOUND` de Node podía quedar oculto detrás del código 0 de `tee`.

Esto invalida únicamente la afirmación inicial de que los runs AT anteriores habían ejecutado V3. No invalida parser, patch, reconstrucción exacta ni guards AT/AS/AP/AN/AL/AJ.

### AU intento 1 · `33461118553` · evidencia inválida detectada
El log mostró `MODULE_NOT_FOUND` para `scripts/audit_raw_user_error_surface_v3_cs21a210s.mjs`; el reporte persistido quedó vacío. Se rechazó esa medición.

### AU intento 2 · `33461233821` · medición V3 válida
Se restauró el scanner exacto histórico blob `1f8c3ba22af2745eb153473c1e321cb61f430819` y se activó `set -o pipefail`.
El reporte real produjo:
- `DIRECT_RAW_SINK_FINDINGS=57`
- `FILES_WITH_FINDINGS=13`
- `CUSTOM_SETTER_FINDINGS=19`
- `src/app.jsx` ya no aparece.

La serie comparable queda, por tanto:
`79 → 76 → 74 → 71 → 70 → 69 → 68 → 66 → 64 → 61 → 57`.

## Tooling V3 ahora reproducible
La forma final AT integra el scanner V3 exacto como tooling del repositorio y el workflow QA:
- verifica con `git hash-object` que el scanner sea exactamente `1f8c3ba22af2745eb153473c1e321cb61f430819`;
- usa `set -o pipefail` antes de `node ... | tee`;
- exige el encabezado esperado del reporte;
- falla si V3 vuelve a reportar `src/app.jsx`.

Así un fallo del scanner ya no puede presentarse como QA verde.

## Guard AS endurecido
`qa_importador_bcr_wiring_cs21a210as.mjs` protege su contrato sin congelar todo `app.jsx`:
- ruta efectiva AS exacta;
- ruta vieja ausente;
- vecindad `buscador → banco → aplicar_pago`;
- reversión local exacta;
- `LazyRoute` mantiene `ImportadorBancario`;
- `loadMany` mantiene carga secuencial;
- CS21A114 mantiene exposición, override inmediato, helper AH, token y endpoints/integridad.

## Forma final del draft
Un único commit directo sobre #247 contiene:
1. `src/app.jsx` funcional validado;
2. scanner V3 exacto reproducible;
3. guard AT;
4. guard AS descendant-safe;
5. workflow QA AT con pipefail;
6. esta documentación.

Patcher y workflow bootstrap quedan fuera de la historia final.

## Límites
- E0: sí.
- E1 source/QA: solo después de revalidar la punta final y todos los checks del PR tras integrar el scanner real.
- E2 autenticado/runtime: NO demostrado.
- `BACKEND CURRENT SNAPSHOT UNVERIFIED`: vigente.
- main / PROD / Apps Script / Drive ACL: no tocados.

**DRAFT · SOURCE/QA ONLY · SHARED APP ERROR BOUNDARY · REPRODUCIBLE V3 TOOLING · NO BACKEND WRITE · NO PROD · NO AUTO-MERGE**
