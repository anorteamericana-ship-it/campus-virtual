# CS21A210AT · app.jsx · frontera compartida de errores segura

Fecha local: 2026-08-31

## Base final
- PR base: #247 · `fix/importador-bcr-wiring-cs21a210as`
- base exacta: `ec757e4bc32e5d3a0d7d720143806d9371a79630`
- preimagen `src/app.jsx`: `d57cf007013beca1b1830d2993ad69be8e049f64`
- source candidato validado por Actions: `aa168e6fe6939e5292a4d232a2a10fe12680efd9`
- blob funcional candidato `src/app.jsx`: `aa878e413646de138d43e5731f2c9afa6c7a42cb`

## Hallazgo
La medición V3 posterior a AP dejó 4 findings en `src/app.jsx`. La revisión de data-flow confirmó que los cuatro sí alcanzaban UI:
1. carga de reposiciones para docente/admin → bloque visible `error`;
2. acción sobre una reposición → mismo bloque visible `error`;
3. carga de evaluaciones del estudiante → `StudentEvaluationSectionF984N` renderiza `state.error`;
4. verificación de disponibilidad de examen escrito → `WrittenSessionCardF929` renderiza `state.error`.

`src/app.jsx` es el root vigente cargado por `campus.html`; estos findings no son aliases ni copias legacy.

## Corrección
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
Pasaron:
- patch exacto AT;
- parser JSX;
- guard AT + reconstrucción exacta.

Falló únicamente el guard heredado AS: todavía exigía que, al revertir la línea `banco`, todo `app.jsx` coincidiera con el blob pre-AS. Ese supuesto bloqueaba cualquier evolución legítima posterior del mismo archivo aunque el wiring BCR siguiera intacto.

### Run 2 · `33460664347` · FAIL controlado
Se convirtió AS a contrato descendant-safe y route-local. AT volvió a pasar, pero una nueva aserción `^\s*banco:` era demasiado amplia y contó propiedades `banco` de otros objetos del archivo compartido. El log exacto fue `Unexpected duplicate banco route.`

No había una ruta F96_LAZY duplicada. Se eliminó únicamente esa aserción sobreamplia.

### Run 3 · `33460779818` · SUCCESS completo
Pasaron:
- patch exacto AT;
- parser JSX;
- guard AT + reconstrucción SHA exacta;
- guard AS descendant-safe;
- AP I CAN;
- AN vista docente;
- AL Ventas calendario;
- AJ matrículas calendario;
- scanner V3 sin ninguna referencia a `src/app.jsx`;
- diff hygiene;
- scope funcional exacto `src/app.jsx`;
- generación del source candidato.

## Guard AS endurecido
El guard heredado `qa_importador_bcr_wiring_cs21a210as.mjs` permanece actualizado para validar su contrato sin congelar todo `app.jsx`:
- una única coincidencia de la ruta efectiva AS exacta;
- ruta vieja ausente;
- vecindad exacta `buscador → banco → aplicar_pago`;
- reversión local exacta de la línea AS;
- `LazyRoute` mantiene `ImportadorBancario`;
- `loadMany` mantiene carga secuencial;
- CS21A114 mantiene exposición, override inmediato, helper AH, token y endpoints/integridad.

Esto no relaja la protección BCR; elimina acoplamiento accidental a cambios no relacionados en el mismo archivo compartido.

## Estado de la métrica
El bootstrap exitoso probó que el scanner V3 idéntico ya no reporta `src/app.jsx`. Por tanto, el siguiente inventario comparable debe reflejar la eliminación de sus 4 findings; esa reducción se medirá en un corte de auditoría separado y no se infiere como E2.

## Forma final
La rama final se reconstruye como un único commit directo sobre #247 con:
1. `src/app.jsx` funcional validado;
2. guard AT;
3. guard AS descendant-safe actualizado;
4. workflow QA final AT;
5. esta documentación.

Patcher y workflow bootstrap quedan fuera de la historia final.

## Límites
- E0: sí.
- E1 source/QA: solo después de QA final + checks del PR.
- E2 autenticado/runtime: NO demostrado.
- `BACKEND CURRENT SNAPSHOT UNVERIFIED`: vigente.
- main / PROD / Apps Script / Drive ACL: no tocados.

**DRAFT · SOURCE/QA ONLY · SHARED APP ERROR BOUNDARY · NO BACKEND WRITE · NO PROD · NO AUTO-MERGE**
