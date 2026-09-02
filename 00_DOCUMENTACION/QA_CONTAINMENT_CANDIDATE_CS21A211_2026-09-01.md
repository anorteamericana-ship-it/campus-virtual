# CS21A211 · candidato de contención QA · 2026-09-01

## Línea base

- Repositorio: `anorteamericana-ship-it/campus-virtual`.
- `main` observado: `53df524d0a9eab867d3b307b3e633f366af92a63`.
- Padre: PR #267 / `qa/auth-e2-readonly-secret-scope-cs21a210bo@ea8e6e00fd8bb0eaf48cca77b42719f2a927948b`.
- Apps Script QA canónico: `1GMHihGwnX_-sIS101rRlUoYpAH2HSKyms8lx6L9z7bjb_45YDn-ph6WD`.
- Deployment QA canónico: `AKfycbxEAQ9lAg1Nv0ASX30MAVOzD7IZvwwqSI9MYcNaMhOQ`, observado por `clasp deployments` en `@HEAD`.
- Snapshot fuente: `QA_HEAD_20260901_215804Z`.
- Fuente: 71 archivos / aggregate SHA-256 `3e384ac34930e6a936a3f930db8819bd80124ef59f522ac1b5b11fee8f881ec6`.
- Candidato offline corregido: 71 archivos / aggregate SHA-256 `3187a43b726ad62556f1eec43cdd91bb16a7cec93e83ebaad643d832382422d0`.
- Patch repo normalizado LF SHA-256: `70d2bee058ef5b6b6e9b97d0d82251d9165dc0f7cf79864ac498caac86a35deb`.
- Patch local de referencia SHA-256: `fa6806f5a2bf9abbcc56dfb73d726f8e2a062256e101380cba2412d9d643e32d`.

La diferencia entre los dos hashes de patch es únicamente de empaquetado CRLF/LF en el lado removido de `99_QA_Staging_Guard.js`; el candidato aplicado es el mismo cambio lógico. Este PR versiona el patch, manifest, contratos QA y documentación, no una segunda copia de los 71 archivos Apps Script.

## Evidencia que motiva el candidato

### P0-01 · frontera frontend QA → PROD

E3 de lectura confirmada en el Web App QA autenticado:

- `PAGE_TITLE=Campus Virtual · Academia Norteamericana · QA`;
- `CURRENT_HOST=script.google.com`;
- `PROD_DEPLOYMENT_OCCURRENCES=13`.

El `index.html` del mismo HEAD contiene las 13 referencias al deployment productivo. No se ejecutó ninguna mutación para demostrar impacto.

### P0-02 · recursos externos fuera de la frontera QA

El snapshot QA tenía master/operativo QA, pero conservaba IDs vivos para documentos, estudiantes, plantillas/padrón, documentos docentes, backup CONAPE, proformas y spreadsheets CONAPE 4/5/6/7. El candidato sustituye esos destinos ejecutables por Script Properties `QA_STAGING_*`; los IDs productivos sobreviven únicamente como denylist explícita en guard/instalador.

## Archivos Apps Script que cambiaría el patch

1. `01_Router.js`
2. `02_Auth_Sesiones_Usuarios.js`
3. `10_Estudiantes.js`
4. `41_CONAPE_Auditoria_Finanzas.js`
5. `46_English_LAB_Accesos_Demo_Docentes.js`
6. `98_Instalacion_QA_CS21A144.js`
7. `99_QA_Staging_Guard.js`
8. `index.html`

Los hashes before/after exactos están congelados en `patches/apps-script/CS21A211_QA_CONTAINMENT.manifest.json`.

## Cambio 1 · Web App self-route

`01_Router.js` obtiene `ScriptApp.getService().getUrl()`, exige una URL `/macros/s/.../exec` válida y la inyecta al template como `CAMPUS_SELF_URL`. `index.html` define una única `CAMPUS_APPS_SCRIPT_URL`; los 13 aliases legacy apuntan a esa URL. El Deployment ID PROD queda en 0 ocurrencias en el candidato. No existe fallback a PROD.

## Cambio 2 · recursos externos fail-closed

Propiedades obligatorias:

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

`PADRON_FOLDER_ID === PLANTILLAS_FOLDER_ID` no se declara defecto: el Drive observado contiene `padron_*.txt` junto a plantillas, por lo que ambos pueden apuntar al mismo folder QA si esa es la topología controlada.

## Cambio 3 · guard QA primario fail-closed

`99_QA_Staging_Guard.js`:

1. verifica master/operativo QA;
2. verifica los 11 recursos externos y rechaza IDs conocidos de PROD;
3. normaliza `query.fn`, `body.fn`, `query.action`, `body.action`;
4. devuelve `qa_route_ambiguous` si hay selectores distintos;
5. conserva ELV2 como frontera secundaria cuando el símbolo existe;
6. permite LAB explícito y una allowlist core exacta;
7. conserva el regex peligroso solo como defensa secundaria;
8. todo lo restante falla cerrado con `qa_endpoint_not_allowlisted`.

### Allowlist core corregida · 9 endpoints

- lifecycle de sesión: `iniciarSesion`, `validarSesion`, `cerrarSesion`;
- `getInfoGeneral`;
- estudiante: `getEvaluacionesEstudiante`, `getAsistenciaEstudiante`, `getEstadoConape`;
- docente: `getCalendarioDocente`, `getGrupoEstudiantes`.

No existe wildcard `get*`.

### Correcciones surgidas de CS21A211B

La matriz semántica completa del snapshot está documentada en `00_DOCUMENTACION/ENDPOINT_MATRIX_CS21A211B_2026-09-01.md`.

Dos rutas que la primera versión del candidato había considerado lectura quedan ahora deliberadamente fuera:

- `getAdminDashboard`: alcanza `getResumenPagosCampus → getOrCreatePagosCampus`; puede crear `PAGOS_CAMPUS` con `insertSheet`/`appendRow`.
- `getEstudiante`: alcanza `_akEnriquecerFicha_ → _aqEnsureIntentSnapshots_` y `_akGetCargos_ → _akEnsureSheet_`; puede crear/actualizar snapshots financieros de intentos o estructuras faltantes.

Ambas quedan `BLOCK_DEFAULT_DENY` hasta existir un camino no-creador o una prueba E4 aislada con precondiciones controladas.

## Instalador QA

`98_Instalacion_QA_CS21A144.js` queda como configurador de properties:

- no crea folders;
- no crea archivos;
- no crea spreadsheets;
- no crea deployments;
- exige IDs externos explícitos;
- rechaza IDs productivos conocidos;
- conserva el mismo deployment QA y prohíbe un `/exec` paralelo.

## Pruebas E0/E1

Sobre el snapshot exacto:

- `node --check`: PASS en los 7 `.js` modificados;
- `patch --dry-run -p1`: PASS;
- aplicación completa del patch: PASS;
- candidate aggregate reproducido: `3187a43b726ad62556f1eec43cdd91bb16a7cec93e83ebaad643d832382422d0`;
- PROD deployment en candidato `index.html`: 0;
- aliases legacy self-route: 13/13;
- IDs PROD externos: no quedan como destinos ejecutables en los archivos modificados; solo como denylist;
- contrato CI exige que `getAdminDashboard` y `getEstudiante` no formen parte de la allowlist;
- simulación del guard: core permitido, ambiguity block, `action` mismatch, dangerous block, default deny, ELV2 ausente y recurso PROD rechazado.

## Matriz CS21A211B

Sobre 71 archivos se extraen **351 selectores ejecutables**, con 351/351 handlers resueltos:

- 332 `fn`;
- 11 `elv2_action`;
- 7 `action` REBECA;
- 1 `fn_alias`.

La política candidata queda: 262 default deny, 69 LAB explícitos, 11 frontera ELV2 y 9 core exactos. La cifra externa de 365 no se fuerza: queda una discrepancia metodológica de 14 por reconciliar con evidencia, no con filas inventadas.

## Por qué NO está autorizado instalar todavía

Faltan gates deliberados:

1. provisionar/identificar recursos QA externos separados para las 11 Script Properties; puede implicar writes Drive/Sheets y requiere autorización release-controlada separada;
2. continuar la clasificación manual de `READ_PURE_CANDIDATE`/`UNKNOWN` antes de ampliar la allowlist;
3. reejecutar E2/E3 solo después de que la frontera de recursos externos exista realmente.

No se debe degradar el default deny para hacer pasar la UI.

## Hallazgos P1/P2 fuera de este patch

Siguen separados: passwords plaintext/rate-limit, ACL históricas públicas, CONFIG_BECAS 50/60, exam fail-open, wrappers fuera del gate central, idempotencia de pagos, locks English LAB v1, `verificar*` sin auth y performance/observabilidad.

## Estado

**PATCH OFFLINE READY · E0/E1 PASS · NO APPS SCRIPT WRITE · NO DEPLOY · NO PROD · NO DRIVE ACL/DATA WRITE · NO MERGE.**
