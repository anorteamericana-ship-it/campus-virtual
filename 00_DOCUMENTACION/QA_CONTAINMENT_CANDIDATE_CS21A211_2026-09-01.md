# CS21A211 · candidato de contención QA · checkpoint CS21A211C · 2026-09-02

## Línea base

- Repositorio: `anorteamericana-ship-it/campus-virtual`
- `main` observado: `53df524d0a9eab867d3b307b3e633f366af92a63`
- Padre: PR #267 / `qa/auth-e2-readonly-secret-scope-cs21a210bo@ea8e6e00fd8bb0eaf48cca77b42719f2a927948b`
- Apps Script QA canónico: `1GMHihGwnX_-sIS101rRlUoYpAH2HSKyms8lx6L9z7bjb_45YDn-ph6WD`
- Deployment QA canónico: `AKfycbxEAQ9lAg1Nv0ASX30MAVOzD7IZvwwqSI9MYcNaMhOQ` (`@HEAD` observado)
- Snapshot: `QA_HEAD_20260901_215804Z`
- Source: 71 archivos / aggregate `3e384ac34930e6a936a3f930db8819bd80124ef59f522ac1b5b11fee8f881ec6`
- Candidate CS21A211C: 71 archivos / aggregate `6c1c79c04994f2c10a5c4feee03c275e1664a003497a1febb0ca0add8a960bc1`
- Patch GitHub LF: `7afa18e38cbe1e6a8031b959034c492d85f0213f121f82a3cd2476d5aa4782a4`
- Patch local referencia: `3a0af2ca2bab30cba2a7de2d3c6ac299fd9d453e8a201850c2f50580373ee4c3`

La diferencia entre hashes del patch sigue siendo únicamente de empaquetado CRLF/LF del lado removido del guard; el candidato aplicado es el mismo.

## P0 que motiva el candidato

### P0-01 · frontend QA → PROD

E3 observada en el Web App QA autenticado:

- `PAGE_TITLE=Campus Virtual · Academia Norteamericana · QA`
- `CURRENT_HOST=script.google.com`
- `PROD_DEPLOYMENT_OCCURRENCES=13`

El candidato reemplaza las 13 URLs literales por una única self URL inyectada desde `ScriptApp.getService().getUrl()`. No hay fallback PROD.

### P0-02 · recursos externos fuera de frontera QA

Se vuelven property-driven 11 recursos externos:

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

Documento detallado: `00_DOCUMENTACION/ENDPOINT_MANUAL_REVIEW_CS21A211C_2026-09-02.md`.

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

Los últimos cuatro son lecturas utilizadas por el `index.html` legacy servido por Apps Script y quedaron manualmente revisadas. Siguen sujetas al mapa de roles del router después de que el guard delega.

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

## E0/E1

Sobre el snapshot exacto:

- 71/71 archivos preservados;
- patch aplicable sobre la fuente congelada;
- candidate aggregate reproducido: `6c1c79c04994f2c10a5c4feee03c275e1664a003497a1febb0ca0add8a960bc1`;
- PROD deployment en candidato `index.html`: 0;
- aliases self URL: 13/13;
- contrato CI exige que `getEstudiante`, `getAdminDashboard` sigan bloqueados y que las cuatro lecturas legacy auditadas estén en la allowlist exacta.

## Gates que siguen bloqueando instalación

1. Provisionar/identificar recursos QA externos separados para las 11 Script Properties. Esto puede implicar Drive/Sheets writes y requiere autorización release-controlada separada.
2. Configurar esas properties y comprobar fail-closed contra IDs QA, nunca PROD.
3. Reejecutar E2/E3 solamente después de que la frontera externa QA exista realmente.
4. E4 permanece fuera de este candidato.

## Fuera de alcance

Passwords plaintext/rate-limit, ACL históricas públicas, CONFIG_BECAS 50/60, exam fail-open, wrappers externos al gate central, idempotencia de pagos, locks English LAB v1, `verificar*` sin auth, performance/observabilidad.

## Estado

**PATCH OFFLINE READY · CS21A211C · 49/49 RUTAS MANUALES CERRADAS · E0/E1 PASS · NO APPS SCRIPT WRITE · NO DEPLOY · NO PROD · NO DRIVE ACL/DATA WRITE · NO MERGE.**
