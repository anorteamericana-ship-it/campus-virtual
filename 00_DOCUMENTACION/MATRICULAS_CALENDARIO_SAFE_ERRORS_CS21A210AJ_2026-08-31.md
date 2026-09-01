# CS21A210AJ · Calendario de matrículas · error seguro

Fecha: 2026-08-31

## Base
- PR #242 / `fix/importador-bcr-safe-errors-cs21a210ah`
- base exacta: `d0148d8d7e4026cfa8e2c3c343fbdce7d7c2067a`
- preimagen `src/matriculas_calendario.jsx`: `7c7b01858448f55d8a2e2092d5b569da298c83c0`

## Ownership efectivo
`src/app.jsx` carga explícitamente el canonical `src/matriculas_calendario.jsx` dentro de la ruta `matriculas`. El alias `src/MATRIC~3.JSX` aparece en el inventario V3 pero no es el archivo canonical modificado por AJ.

## Hallazgo
CS21A210AI V3 midió **69 hallazgos / 18 archivos**. El canonical `src/matriculas_calendario.jsx` enviaba `e.message` directamente a `setErr`, y `err` se renderiza en el bloque visible de error del calendario administrativo.

## Corrección
- detalle original queda únicamente en `console.warn`;
- la UI recibe `No pudimos cargar el calendario de matrículas. Intentá nuevamente.`;
- se conserva la cancelación del efecto para no publicar estados después de desmontar/cambiar semana.

## Contrato congelado
AJ no cambia:
- `window.getCalendarioMatriculas(body)`;
- `con_tendencia: true`;
- `semana_inicio` para navegación semanal;
- botón `Reintentar` y `tick`;
- tablas, métricas, tendencias y asesorías;
- naturaleza de solo lectura del componente;
- route ownership de `src/app.jsx`.

## Evidencia bootstrap
Run `33453431267`: gates funcionales **SUCCESS**:
- preimagen exacta PASS;
- patch exacto PASS;
- parser JSX PASS;
- guard AJ PASS;
- reconstrucción exacta de preimagen PASS;
- contrato canonical/solo lectura PASS;
- regresión AH PASS;
- regresión AF PASS;
- regresión AD PASS;
- diff hygiene PASS;
- scope funcional exacto `src/matriculas_calendario.jsx` PASS.

Source temporal validado por Actions: `08b1a56938d0f577690ba07776ec1f2e909d1ddf`.
Blob funcional validado: `a8284e2f2aaece4df2d7cf11ea67648ce51921bc`.

La rama final se reconstruye como un único commit directo sobre #242; patcher/bootstrap quedan fuera.

## Límites
- E0: sí.
- E1 source/QA: sí una vez que commit final y PR estén verdes.
- E2 autenticado/runtime: no demostrado.
- `BACKEND CURRENT SNAPSHOT UNVERIFIED`: vigente.
- Apps Script, Drive ACL, main y PROD: no tocados.

**DRAFT · SOURCE/QA ONLY · READ-ONLY CALENDAR CONTRACT FROZEN · NO BACKEND WRITE · NO PROD · NO AUTO-MERGE**
