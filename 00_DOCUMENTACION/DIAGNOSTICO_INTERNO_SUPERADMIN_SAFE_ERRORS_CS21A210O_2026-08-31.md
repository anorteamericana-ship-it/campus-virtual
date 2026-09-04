# CS21A210O · Diagnóstico interno · superadmin + errores seguros

Fecha: 31-ago-2026

## Base exacta
- PR #230 / `fix/permisos-roles-superadmin-safe-copy-cs21a210m`
- commit: `02ddcae16429436f7bbf5ab8f8181f91f8ab6322`
- preimágenes:
  - `src/app.jsx`: `1ab9a713135971fbc1bc9856eb89d2e01b9d8053`
  - `src/sidebar.jsx`: `c96b6807c3404a4c16e191862b579a3bcb59e12c`
  - `src/diagnostico_interno.jsx`: `35b5dd09e7ffd05a5438070bc57d1820e8ded257`

## Hallazgo de acceso
`00_DOCUMENTACION/MATRIZ_ENTREGA_ROLES_CS21A131.md` ubica `Diagnóstico interno` dentro del bloque **Superadmin**.

En la punta previa:
- `sidebar.jsx` exponía `diagnostico_interno` a admin normal y superadmin;
- `app.jsx` montaba `DiagnosticoInternoView` sin gate de `rolReal`;
- la pantalla contiene una acción sensible `aplicarCorreccionMorosidadConapeManual`, además de auditorías/lecturas internas.

La búsqueda del source versionado no encuentra implementaciones server-side de `diagnosticoSistemaInterno`, `auditarArchivosCONAPE`, `auditarMorosidadConapeManual` ni `aplicarCorreccionMorosidadConapeManual`; aparecen únicamente como contratos frontend. Por tanto la autorización backend actual de esos endpoints permanece **NO VERIFICADA**.

## Hallazgo de frontera visible
El scanner CS21A210N detectó un sink directo en esta pantalla, pero la lectura completa encontró tres catches que publicaban el detalle técnico:
- `setError(e.message||String(e))`;
- dos `setMoraError(e.message||String(e))` no cubiertos por el scanner V2 porque usa nombres de setters conocidos.

## Corrección source-side
1. `src/app.jsx`: solo `rolReal === 'superadmin'` monta `DiagnosticoInternoView`; admin normal cae en `NoAutorizadoCampus`.
2. `src/sidebar.jsx`: la opción se crea solo cuando `esSuperadmin`.
3. `src/diagnostico_interno.jsx`: helper `diagnosticoSafeUserError()` conserva detalle técnico en consola y devuelve copy neutro para:
   - diagnóstico general/CONAPE;
   - auditoría manual de morosidad;
   - aplicación de corrección manual de morosidad.

## Contratos preservados
- POST con token en body;
- `diagnosticoSistemaInterno`;
- `auditarArchivosCONAPE`;
- `auditarMorosidadConapeManual`;
- `aplicarCorreccionMorosidadConapeManual`;
- confirmación explícita antes de escritura;
- motivo mínimo de 10 caracteres;
- `firma_actual` y `cantidad_actual` para controlar la corrección sobre el estado observado;
- Apps Script / datos / Drive ACL / main / PROD intactos.

## Límite crítico de evidencia
El gate frontend es defensa en profundidad. **NO** prueba autorización server-side. `BACKEND CURRENT SNAPSHOT UNVERIFIED` continúa vigente y debe verificarse antes de release/E2, especialmente por la acción de morosidad.

## Trazabilidad bootstrap
Bootstrap `33443739584`: **SUCCESS completo**.
- ancestry exacta desde #230: PASS;
- tres preimágenes exactas: PASS;
- patch: PASS;
- guard CS21A210O: PASS;
- regresión CS21A210M: PASS;
- regresión CS21A210L: PASS;
- `git diff --check`: PASS.

Source temporal validado: `e4ed5f763787688a6362da1220f3d9bc52c6b925`.
Blobs funcionales validados:
- `src/app.jsx`: `933e70943993c970b3f73218c5f29e18f3519a6b`
- `src/sidebar.jsx`: `13177b4377a77bf8fc19577c2b21ea3d94424454`
- `src/diagnostico_interno.jsx`: `a5a086278048b142036e69416b8ae8ccffb675db`

Después del bootstrap la rama se reconstruye desde el árbol exacto de #230 como un único commit final con seis rutas: 3 funcionales + guard + workflow + documentación. Los artefactos bootstrap no forman parte del candidato final.

## Estado
- E0: sí.
- E1 source/QA: bootstrap sí; QA final/PR debe quedar verde antes del checkpoint canónico.
- E2 autenticado/runtime: NO.
- autorización backend: NO verificada.
- PROD/main: NO tocados.

**DEFENSE IN DEPTH · SOURCE/QA ONLY · BACKEND AUTH UNVERIFIED · NO PROD · NO AUTO-MERGE**
