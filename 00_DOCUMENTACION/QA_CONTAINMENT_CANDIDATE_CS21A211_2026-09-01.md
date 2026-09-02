# CS21A211 · candidato de contención QA · 2026-09-01

## Línea base

- Repositorio: `anorteamericana-ship-it/campus-virtual`
- `main` observado: `53df524d0a9eab867d3b307b3e633f366af92a63`
- Padre de este candidato: PR #267 / `qa/auth-e2-readonly-secret-scope-cs21a210bo@ea8e6e00fd8bb0eaf48cca77b42719f2a927948b`
- Apps Script QA canónico: `1GMHihGwnX_-sIS101rRlUoYpAH2HSKyms8lx6L9z7bjb_45YDn-ph6WD`
- Deployment QA canónico: `AKfycbxEAQ9lAg1Nv0ASX30MAVOzD7IZvwwqSI9MYcNaMhOQ`, observado por `clasp deployments` en `@HEAD`
- Snapshot fuente: `QA_HEAD_20260901_215804Z`
- Fuente: 71 archivos / aggregate SHA-256 `3e384ac34930e6a936a3f930db8819bd80124ef59f522ac1b5b11fee8f881ec6`
- Candidato offline: 71 archivos / aggregate SHA-256 `afe85193b614ea12720590feede855a8975965e1c195ae13feb97f2fce885220`
- Patch repo normalizado LF SHA-256: `795a25e973d56c9b54ea4b547c74fc8a27df2f63a546886486314ca27fe09d0e`
- Patch local de referencia SHA-256: `5f6c227c00bb25cb7fd0ed6afcab63cc58d79e366e69ae5867e63f5745cb7605`

La diferencia entre los dos hashes de patch es únicamente de empaquetado: el archivo local de referencia conserva CRLF en el lado removido de `99_QA_Staging_Guard.js`; los fragmentos versionados por GitHub están normalizados a LF. El candidato aplicado y su aggregate son idénticos semánticamente.

**Este PR versiona solo el patch, su manifest, contrato QA y documentación. No sube una copia de los 71 archivos de Apps Script.**

## Evidencia que motiva el candidato

### P0-01 · frontera frontend QA → PROD

E3 desplegada confirmada por lectura local del DOM en el Web App QA autenticado:

- `PAGE_TITLE=Campus Virtual · Academia Norteamericana · QA`
- `CURRENT_HOST=script.google.com`
- `PROD_DEPLOYMENT_OCCURRENCES=13`

El `index.html` del mismo HEAD contiene esas 13 referencias al deployment productivo. No se ejecutó ninguna mutación para demostrar impacto.

### P0-02 · aislamiento incompleto de recursos externos

El snapshot QA tenía Sheets principal/operativo QA, pero varios destinos externos seguían codificados con IDs vivos ajenos a la frontera QA:

- root de documentos;
- documentos de estudiantes;
- plantillas/padrón;
- documentos docentes;
- backup CONAPE;
- hoja de proformas;
- spreadsheets CONAPE 4/5/6/7.

El candidato elimina esos IDs como destinos ejecutables y los reemplaza por Script Properties `QA_STAGING_*`. Los IDs productivos sobreviven únicamente como denylist explícita en el guard/instalador, nunca como fallback.

## Archivos que cambiaría Apps Script

El patch toca exactamente 8 archivos del snapshot:

1. `01_Router.js`
2. `02_Auth_Sesiones_Usuarios.js`
3. `10_Estudiantes.js`
4. `41_CONAPE_Auditoria_Finanzas.js`
5. `46_English_LAB_Accesos_Demo_Docentes.js`
6. `98_Instalacion_QA_CS21A144.js`
7. `99_QA_Staging_Guard.js`
8. `index.html`

Los hashes before/after están congelados en `patches/apps-script/CS21A211_QA_CONTAINMENT.manifest.json`.

## Cambio 1 · Web App self URL

`01_Router.js` obtiene la URL del servicio con `ScriptApp.getService().getUrl()`, valida la forma `/macros/s/.../exec` y la inyecta al template como `CAMPUS_SELF_URL`.

`index.html` define una sola `CAMPUS_APPS_SCRIPT_URL` a partir de esa variable y los 13 aliases legacy apuntan a ella. El Deployment ID de PROD queda en **0 ocurrencias** en el candidato `index.html`.

No existe fallback a PROD: una self URL inválida falla cerrado con `QA_WEBAPP_SELF_URL_INVALID`.

## Cambio 2 · recursos externos fail-closed

Se vuelven property-driven:

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

`41_CONAPE_Auditoria_Finanzas.js` deja de imponer IDs PROD para 4/5/6/7 y resuelve esos recursos en runtime desde `CONAPE_SHEET_IDS`. Los contratos de 6-historial y 7-morosidad validan que exista un ID configurado, no que sea el ID productivo histórico.

`PADRON_FOLDER_ID === PLANTILLAS_FOLDER_ID` **no se declara bug**. Puede configurarse al mismo folder QA si así corresponde; en Drive real se observaron `padron_*.txt` junto a plantillas.

## Cambio 3 · guard QA primario fail-closed

`99_QA_Staging_Guard.js` pasa de blacklist lexical como frontera primaria a una política conservadora:

1. verifica master/operativo QA;
2. verifica recursos externos contra Script Properties y rechaza IDs conocidos de PROD;
3. normaliza la unión de `query.fn`, `body.fn`, `query.action`, `body.action`;
4. si hay más de un selector distinto devuelve `qa_route_ambiguous`;
5. conserva ELV2 como frontera secundaria cuando el símbolo existe;
6. permite únicamente LAB explícito y una allowlist core mínima ya auditada;
7. conserva el regex peligroso como defensa secundaria;
8. todo endpoint restante falla cerrado con `qa_endpoint_not_allowlisted`.

Esto cierra la clase de bypass `?fn=lectura` + `body.fn=mutación` y la superficie invisible por `action`.

### Allowlist core inicial

- sesión: `iniciarSesion`, `validarSesion`, `cerrarSesion`;
- `getInfoGeneral`;
- estudiante: `getEstudiante`, `getEvaluacionesEstudiante`, `getAsistenciaEstudiante`, `getEstadoConape`;
- docente: `getCalendarioDocente`, `getGrupoEstudiantes`;
- superadmin: `getAdminDashboard`.

No existe wildcard `get*`: algunos `get*` tienen side effects estructurales.

## Instalador QA

`98_Instalacion_QA_CS21A144.js` queda como configurador de propiedades, no como creador de infraestructura:

- no crea folders;
- no crea archivos;
- no crea spreadsheets;
- no crea deployments;
- exige que todos los IDs externos se entreguen explícitamente;
- rechaza IDs productivos conocidos;
- conserva el mismo deployment QA y prohíbe un `/exec` paralelo.

## Pruebas E0/E1 ejecutadas offline

Sobre el snapshot exacto:

- `node --check`: **PASS** en los 7 `.js` modificados;
- patch portable `patch --dry-run -p1`: **PASS**;
- aplicación del patch sobre una copia nueva del snapshot: **PASS**;
- aggregate resultante después de reaplicar el patch: `afe85193b614ea12720590feede855a8975965e1c195ae13feb97f2fce885220`, idéntico al candidato;
- PROD deployment en candidato `index.html`: **0**;
- aliases legacy → `CAMPUS_APPS_SCRIPT_URL`: **13/13**;
- IDs PROD de recursos externos: no quedan como destinos ejecutables en los archivos modificados; solo aparecen en denylists del guard/instalador;
- simulación del guard con stubs: **PASS** para lectura core, route ambiguity, dangerous block, default deny, `action` mismatch, ELV2 ausente y rechazo de recurso PROD.

### GitHub Actions

Checkpoint verde del patch exacto: `3ea959538d5ff8dd00a33bff4186f8e5d5169912`.

- `QA Containment Candidate CS21A211` run `33585824339`: **SUCCESS**.
- `English LAB Source Truth Guard` run `33585824360`: **SUCCESS**.

HEAD documental final: `5d710dd43382f6e1b62369af2f640d70e7e750ae`.

- `QA Containment Candidate CS21A211` run `33586026446`: **SUCCESS**.
- `English LAB Source Truth Guard` run `33586026464`: **SUCCESS**.

El contrato CI verifica los hashes por archivo lógico del patch, la integridad del manifest, los 13 aliases self-route y los invariantes fail-closed del guard.

## Importante · por qué NO está autorizado instalar aún

Este candidato es **PATCH OFFLINE LISTO PARA REVISIÓN**, no un release Apps Script listo para apretar `Implementar`.

Faltan dos gates deliberados:

1. **provisionar/identificar recursos QA externos separados** para las 11 Script Properties anteriores. Este trabajo puede implicar Drive/Sheets writes y requiere autorización release-controlada separada;
2. **ampliar la allowlist exacta** usando la matriz semántica completa de endpoints. El default deny actual es seguro, pero bloquearía rutas legítimas del QA legacy que todavía no estén clasificadas.

No se debe degradar el default deny para “hacer pasar” la UI.

## Hallazgos P1/P2 que este patch NO intenta arreglar

Quedan como backlog separado, no se mezclan en este P0 de contención:

- contraseñas en texto plano + ausencia de rate limit de login;
- ACL históricas `ANYONE_WITH_LINK` y migración de consumidores privados;
- semilla `CONFIG_BECAS` 50%/60% vs regla canónica 25%/50%;
- `examGetPublicExamPayload` fail-open sin sesión;
- autorización de wrappers externos al gate central;
- idempotencia/lock de `registrarPagoCampus`;
- lock de English LAB v1 answers;
- endpoints `verificar*` sin auth;
- performance/observabilidad y `catch(){}` vacíos.

## Estado

**PATCH OFFLINE READY · E0/E1 PASS · NO APPS SCRIPT WRITE · NO DEPLOY · NO PROD · NO DRIVE ACL/DATA WRITE · NO MERGE.**
