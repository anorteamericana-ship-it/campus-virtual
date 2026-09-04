# CS21A211 · candidato de contención QA · checkpoint CS21A211E · 2026-09-02

## Línea base

- Repositorio: `anorteamericana-ship-it/campus-virtual`
- `main` observado: `53df524d0a9eab867d3b307b3e633f366af92a63`
- Padre: PR #267 / `qa/auth-e2-readonly-secret-scope-cs21a210bo@ea8e6e00fd8bb0eaf48cca77b42719f2a927948b`
- Apps Script QA canónico: `1GMHihGwnX_-sIS101rRlUoYpAH2HSKyms8lx6L9z7bjb_45YDn-ph6WD`
- Deployment QA canónico: `AKfycbxEAQ9lAg1Nv0ASX30MAVOzD7IZvwwqSI9MYcNaMhOQ` (`@HEAD` observado)
- Snapshot: `QA_HEAD_20260901_215804Z`
- Source: 71 archivos / 4,677,234 bytes / aggregate `3e384ac34930e6a936a3f930db8819bd80124ef59f522ac1b5b11fee8f881ec6`
- Candidate corregido: 71 archivos / 4,688,555 bytes / aggregate `6c1c79c04994f2c10a5c4feee03c275e1664a003497a1febb0ca0add8a960bc1`
- Patch GitHub LF: `20aebc28ecc42b550f6d1b03a02314674d130d6825faa40c4685bfea5d423768`
- Patch local mixed-line-ending de referencia: `a98a42c7ce07ab87f5e3198fb26ec59125e032c9e716435bad631fe4db8c7a53`

El aggregate `9cba15a7...` y el patch previo `7afa18e...` quedan superseded: el hunk full-file de `99_QA_Staging_Guard.js` declaraba 208 líneas nuevas aunque contenía 209, por lo que el aplicador omitía el `};` final. CS21A211E corrige el hunk a `+1,209`, reconstruye un guard de 10,400 bytes / SHA-256 `fd48510ff0601854afc27d0c5dbf5fb450e3a73518282f4efab89f6cf9ac9a5a` y pasa sintaxis.

## P0 que motiva el candidato

### P0-01 · frontend QA → PROD

E3 observada en el Web App QA autenticado:

- `PAGE_TITLE=Campus Virtual · Academia Norteamericana · QA`
- `CURRENT_HOST=script.google.com`
- `PROD_DEPLOYMENT_OCCURRENCES=13`

El candidato reemplaza las 13 URLs literales por una única self URL inyectada desde `ScriptApp.getService().getUrl()`. No hay fallback PROD.

### P0-02 · destinos externos fuera de frontera QA

Se vuelven property-driven 11 destinos escribibles externos:

- `QA_STAGING_DOCUMENTOS_FOLDER_ID`
- `QA_STAGING_DOCUMENTOS_ESTUDIANTES_FOLDER_ID`
- `QA_STAGING_PLANTILLAS_FOLDER_ID`
- `QA_STAGING_PADRON_FOLDER_ID`
- `QA_STAGING_DOCUMENTOS_DOCENTES_ROOT_ID`
- `QA_STAGING_CONAPE_BACKUP_FOLDER_ID`
- `QA_STAGING_PROFORMAS_SHEET_ID`
- `QA_STAGING_CONAPE_4_ESTUDIANTES_ID`
- `QA_STAGING_CONAPE_5_PLAN_ID`
- `QA_STAGING_CONAPE_6_HISTORIAL_ID`
- `QA_STAGING_CONAPE_7_MOROSIDAD_ID`

Los IDs productivos conocidos quedan solo como denylist; nunca como fallback.

## Recursos QA aislados · CS21A211D

Ya se provisionó un root privado `CAMPUS_QA_CS21A211_ISOLATED_RESOURCES` con:

- 6 folders QA separados;
- 5 Google Sheets QA vacíos para proformas y CONAPE 4/5/6/7;
- `QA_CS21A211_RESOURCE_MAP` privado con la relación exacta `QA_STAGING_* → recurso`.

Verificación: root y recursos observados `shared=false` / `not_shared`; no se copió PII, padrón, plantillas ni datos productivos.

Residual explícito: el snapshot aún contiene IDs de **activos oficiales de solo lectura** (por ejemplo libros/audios y `PLANTILLA_IDS`). No son destinos escribibles de CS21A211. Los endpoints mutantes capaces de crear/copiar documentos permanecen default-deny. Una futura E4 documental estrictamente aislada deberá provisionar plantillas QA/sintéticas y hacer esos IDs de fuente property-driven.

## Archivos Apps Script que cambiaría

1. `01_Router.js`
2. `02_Auth_Sesiones_Usuarios.js`
3. `10_Estudiantes.js`
4. `41_CONAPE_Auditoria_Finanzas.js`
5. `46_English_LAB_Accesos_Demo_Docentes.js`
6. `98_Instalacion_QA_CS21A144.js`
7. `99_QA_Staging_Guard.js`
8. `index.html`

## Guard QA primario

`99_QA_Staging_Guard.js`:

1. valida master/operativo QA;
2. valida los 11 recursos externos y rechaza IDs PROD;
3. normaliza `query.fn`, `body.fn`, `query.action`, `body.action`;
4. selectores distintos → `qa_route_ambiguous`;
5. conserva ELV2 como frontera secundaria;
6. LAB explícito + allowlist core exacta;
7. regex peligroso queda como defensa secundaria;
8. el resto → `qa_endpoint_not_allowlisted`.

## CS21A211C · revisión manual de rutas

Se revisaron manualmente los 31 `READ_PURE_CANDIDATE` y 18 `UNKNOWN` de CS21A211B: **49/49**.

Resultado:

- 30 `READ_PURE`;
- 5 `READ_WITH_TECHNICAL_SIDE_EFFECT`;
- 1 `READ_WITH_AUTH_SIDE_EFFECT`;
- 13 `BUSINESS_WRITE`.

Hallazgo adicional: `getOperacionesPagoReversibles` no es lectura pura garantizada porque llama `_apEnsureJournal_(OPERATIVO_ID)`, capaz de crear/sembrar `PAGOS_OPERACIONES`.

## Allowlist core exacta · 13

- `iniciarSesion`
- `validarSesion`
- `cerrarSesion`
- `getInfoGeneral`
- `getEvaluacionesEstudiante`
- `getAsistenciaEstudiante`
- `getEstadoConape`
- `getCalendarioDocente`
- `getGrupoEstudiantes`
- `getGrupoInfo`
- `getComprobantes`
- `getNovedadesConape`
- `getRadiografiaGrupo`

Permanecen deliberadamente fuera:

- `getEstudiante`: puede crear/actualizar snapshots financieros o estructura faltante;
- `getAdminDashboard`: puede crear `PAGOS_CAMPUS` vía `getOrCreatePagosCampus`;
- `getOperacionesPagoReversibles`: puede crear/sembrar el journal operativo.

No existe wildcard `get*`.

## Política de 351 selectores

- 258 `BLOCK_DEFAULT_DENY`;
- 69 `ALLOW_LAB_EXPLICIT`;
- 13 `ALLOW_CORE_EXACT`;
- 11 `ELV2_SECONDARY_BOUNDARY`.

## E0/E1 · CS21A211E

Reproducción local contra el snapshot exacto:

- 71/71 archivos preservados;
- `patch --dry-run`: PASS;
- aplicación real: PASS;
- `node --check`: 7/7 JS modificados PASS;
- guard final: 10,400 bytes / SHA `fd48510ff0601854afc27d0c5dbf5fb450e3a73518282f4efab89f6cf9ac9a5a`;
- candidate aggregate: `6c1c79c04994f2c10a5c4feee03c275e1664a003497a1febb0ca0add8a960bc1`;
- PROD deployment en candidato `index.html`: 0;
- aliases self URL: 13/13.

CI endurecido valida cardinalidad de todos los hunks y reconstruye/syntax-checkea el guard completo. HEAD funcional `80fa786815a317712ad3e3c929b4015c20943194`:

- `QA Containment Candidate CS21A211` run `33669762856`: SUCCESS;
- `GUARD_RECONSTRUCTED_SYNTAX=PASS`;
- `English LAB Source Truth Guard` run `33669762842`: SUCCESS.

HEAD documental/workflow posterior `5867f11aa497836972b11c668335ee861ba758d8`:

- QA Containment run `33670473086`: SUCCESS;
- English LAB Source Truth run `33670473140`: SUCCESS.

## Gate siguiente

1. Configurar las 11 Script Properties del resource map privado en el **proyecto QA canónico**.
2. Re-clonar inmediatamente `@HEAD` y exigir source aggregate `3e384ac3...` antes de cualquier push.
3. Aplicar únicamente patch `20aebc28...` y exigir candidate aggregate `6c1c79c0...`.
4. `clasp push` solo al Script ID QA canónico, sin `--force`, conservando el mismo deployment `@HEAD` y sin `/exec` paralelo.
5. Verificar `qa_external_resources_ok=true`, self-route, default-deny y E2/E3.
6. E4 de negocio permanece fuera de este candidato.

## Fuera de alcance

Passwords plaintext/rate-limit, ACL históricas públicas, CONFIG_BECAS 50/60, exam fail-open, wrappers externos al gate central, idempotencia de pagos, locks English LAB v1, `verificar*` sin auth, performance/observabilidad.

## Estado

**PATCH CORREGIDO · RECURSOS QA AISLADOS LISTOS · E0/E1 PASS · SCRIPT PROPERTIES AÚN NO CONFIGURADAS · NO APPS SCRIPT PUSH · NO PROD · NO MERGE.**
