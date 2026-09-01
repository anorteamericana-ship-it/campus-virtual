# CS21A210BM · Sales E2 sobre integración verde actual

Fecha: 2026-09-01 · Costa Rica

## Base exacta
- PR padre: #264 · CS21A210BL
- base: `candidate/green-spine-integration-cs21a210bl`
- SHA de arranque: `62ab4712740a9c00e6e275d3c19890a9cabc1e60`

## Propósito
Portar únicamente el harness QA Sales E2 de CS21A170 a la integración acumulada actualmente verde, sin arrastrar la cadena histórica de #142 ni modificar runtime.

## Alcance
Se agregan solo:
- `scripts/real_qa_sales_e2_cs21a170.mjs`;
- `scripts/qa_sales_e2_contract_cs21a170.mjs`;
- `.github/workflows/qa-sales-e2-staging-cs21a170.yml`;
- este documento.

No se modifica `src/**`, backend, endpoints, Apps Script, datos ni producción.

## Seguridad
- El E2 autenticado NO corre en pull request.
- `workflow_dispatch` requiere `authenticated=true`.
- Writes están apagados por defecto (`execute_writes=false`).
- El runner rechaza staging si coincide con la URL productiva.
- Antes del login exige `QA_STAGING_CS21A138` y `writes_guarded=true`.
- El modo write requiere doble opt-in y queda fuera del corte BM.
- No se versionan ni copian credenciales QA.

## Estado esperado del corte
E1: validar sintaxis y contrato fail-closed sobre la base real #264.
E2: permanece pendiente hasta que GitHub Actions disponga de las identidades QA dedicadas de forma segura.

**DRAFT · QA ONLY · NO MERGE A MAIN · NO PROD · NO WRITES**
