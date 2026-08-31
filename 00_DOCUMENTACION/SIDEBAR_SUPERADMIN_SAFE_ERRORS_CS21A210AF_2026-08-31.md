# CS21A210AF · Sidebar superadmin · error seguro en Modo prueba

Fecha: 2026-08-31

## Base
- PR #240 / `fix/student-content-access-safe-errors-cs21a210ad`
- base exacta: `822ea08a8181b6c58e23df857a605aeeacbc43b5`
- preimagen `src/sidebar.jsx`: `13177b4377a77bf8fc19577c2b21ea3d94424454`

## Hallazgo
CS21A210AE V3 midió **71 hallazgos / 20 archivos**. En `src/sidebar.jsx`, el panel `Modo prueba · superadmin` enviaba `data.error` directamente a `errMsg`, y `errMsg` se renderiza en pantalla.

## Corrección
- `data.error` ya no llega a la UI;
- el detalle original queda únicamente en `console.warn`;
- el operador recibe: `No pudimos cargar ese estudiante. Verificá el código e intentá de nuevo.`

## Fronteras congeladas
AF no cambia:
- gate `rolEfectivo === 'superadmin'`;
- montaje `{esSuperadmin && <ModoPruebaPanel />}`;
- endpoint `getEstudiante`;
- token dentro del body de `postSidebar`;
- `an_modo_prueba` y preservación de la sesión original;
- `setSesion(nuevaIdentidad)`;
- evento `an:session-changed`;
- composición de la identidad estudiante/docente;
- menús, rutas, English LAB, pagos ni contenido estudiantil.

## Evidencia
Bootstrap `33452366226`: **SUCCESS completo**:
- preimagen exacta PASS;
- patch exacto PASS;
- parser JSX PASS;
- guard AF PASS;
- reconstrucción exacta de la preimagen PASS;
- regresión AD PASS;
- regresión AB PASS;
- regresión Z PASS;
- diff hygiene PASS;
- scope funcional exacto `src/sidebar.jsx` PASS.

Source temporal validado por Actions: `62fa13c52fa06916f22e26d3fd9131bff600cc23`.
Blob funcional validado: `c0ebdd64b1c9765a008273a1059fd211c9e80adb`.

La rama final se reconstruye como un único commit directo sobre #240; patcher/bootstrap quedan fuera.

## Nota de auditoría
`src/cronograma.jsx` conserva `e.message` en estado interno, pero el valor no se renderiza: salvo el sentinel `sin_sesion`, la UI muestra siempre copy fijo. Se clasifica como falso positivo de visibilidad y no se modifica en AF.

## Límite
- E0: sí.
- E1 source/QA: sí una vez que commit final y checks de PR estén verdes.
- E2 autenticado/runtime: no demostrado.
- `BACKEND CURRENT SNAPSHOT UNVERIFIED`: vigente.
- Apps Script, Drive ACL, main y PROD: no tocados.

**DRAFT · SOURCE/QA ONLY · SUPERADMIN GATE FROZEN · NO BACKEND · NO ACL · NO PROD · NO AUTO-MERGE**
