# CS21A211C · revisión manual de 49 rutas ambiguas / candidatas de lectura · 2026-09-02

## Línea base

- Snapshot: `QA_HEAD_20260901_215804Z`.
- Source aggregate SHA-256: `3e384ac34930e6a936a3f930db8819bd80124ef59f522ac1b5b11fee8f881ec6`.
- Matriz CS21A211C local: `351 × 21`.
- CSV SHA-256: `5d698c268369f8c8090747c7c8dc72967e9151d32ef5bc763dc871a4da755c68`.
- Evidencia: **E0 ESTÁTICA**.
- Alcance manual de este checkpoint: los 31 `READ_PURE_CANDIDATE` + los 18 `UNKNOWN` de CS21A211B.

## Resultado de la revisión manual

| clasificación final | cantidad |
| --- | ---: |
| `READ_PURE` | 30 |
| `READ_WITH_TECHNICAL_SIDE_EFFECT` | 5 |
| `READ_WITH_AUTH_SIDE_EFFECT` | 1 |
| `BUSINESS_WRITE` | 13 |
| **Total revisado manualmente** | **49** |

La revisión manual encontró un falso `READ_PURE_CANDIDATE`: `getOperacionesPagoReversibles`. Su camino real usa `_apEnsureJournal_(OPERATIVO_ID)`, que puede crear la hoja `PAGOS_OPERACIONES` y sembrar headers. Queda default-deny.

## Allowlist exacta después de la revisión

1. `cerrarsesion`
2. `getasistenciaestudiante`
3. `getcalendariodocente`
4. `getcomprobantes`
5. `getestadoconape`
6. `getevaluacionesestudiante`
7. `getgrupoestudiantes`
8. `getgrupoinfo`
9. `getinfogeneral`
10. `getnovedadesconape`
11. `getradiografiagrupo`
12. `iniciarsesion`
13. `validarsesion`

Los cuatro nombres agregados en CS21A211C son lecturas del `index.html` legacy realmente servido por Apps Script y fueron revisados manualmente:

- `getGrupoInfo` → `11_Docentes_Clases.js` → lectura de `GRUPOS`, sin sink de escritura.
- `getComprobantes` → `10_Estudiantes.js` → lectura de `BDBANCARIO`; `SpreadsheetApp.flush()` sin mutación previa en el handler.
- `getNovedadesConape` → `01_Router.js` → lectura de `CONAPE_SYNC`, sin sink de escritura.
- `getRadiografiaGrupo` → `10_Estudiantes.js` → agregación de DATOS/ESTATUS/GRUPOS/PAGOS/logs, sin sink de escritura alcanzable en el camino revisado.

Los cuatro siguen delegando al router/autorización existente; el guard no sustituye el mapa de roles.

`getEstudiante` y `getAdminDashboard` permanecen **fuera** de la allowlist por side effects estructurales ya demostrados.

## 49 rutas revisadas

| selector | transporte | clasificación final | política | evidencia resumida |
| --- | --- | --- | --- | --- |
| `agentgetcommercialconfig` | `action` | `READ_WITH_TECHNICAL_SIDE_EFFECT` | `BLOCK_DEFAULT_DENY` | Read business data; HMAC replay/rate/data caches mutate technical cache state. |
| `agentgetpaymentstatus` | `action` | `READ_WITH_TECHNICAL_SIDE_EFFECT` | `BLOCK_DEFAULT_DENY` | Read business data; HMAC replay/rate/data caches mutate technical cache state. |
| `agentgetroutingdirectory` | `action` | `READ_WITH_TECHNICAL_SIDE_EFFECT` | `BLOCK_DEFAULT_DENY` | Read business data; HMAC replay/rate/data caches mutate technical cache state. |
| `agentreportpayment` | `action` | `BUSINESS_WRITE` | `BLOCK_DEFAULT_DENY` | Authenticated Rebeca business mutation. |
| `agentresolvecontactcontext` | `action` | `READ_WITH_TECHNICAL_SIDE_EFFECT` | `BLOCK_DEFAULT_DENY` | Read business data; HMAC replay/rate/data caches mutate technical cache state. |
| `agentsubmitenrollmentrequest` | `action` | `BUSINESS_WRITE` | `BLOCK_DEFAULT_DENY` | Authenticated Rebeca business mutation. |
| `agentupdateprospectprogress` | `action` | `BUSINESS_WRITE` | `BLOCK_DEFAULT_DENY` | Authenticated Rebeca business mutation. |
| `closeroom` | `elv2_action` | `BUSINESS_WRITE` | `ELV2_SECONDARY_BOUNDARY` | ELV2 room/round/attempt lifecycle mutation. |
| `closeround` | `elv2_action` | `BUSINESS_WRITE` | `ELV2_SECONDARY_BOUNDARY` | ELV2 room/round/attempt lifecycle mutation. |
| `createroom` | `elv2_action` | `BUSINESS_WRITE` | `ELV2_SECONDARY_BOUNDARY` | ELV2 room/round/attempt lifecycle mutation. |
| `getstate` | `elv2_action` | `READ_WITH_AUTH_SIDE_EFFECT` | `ELV2_SECONDARY_BOUNDARY` | ELV2 state read; authenticated through session lifecycle. |
| `joinroom` | `elv2_action` | `BUSINESS_WRITE` | `ELV2_SECONDARY_BOUNDARY` | ELV2 room/round/attempt lifecycle mutation. |
| `lockround` | `elv2_action` | `BUSINESS_WRITE` | `ELV2_SECONDARY_BOUNDARY` | ELV2 room/round/attempt lifecycle mutation. |
| `openround` | `elv2_action` | `BUSINESS_WRITE` | `ELV2_SECONDARY_BOUNDARY` | ELV2 room/round/attempt lifecycle mutation. |
| `prepareround` | `elv2_action` | `BUSINESS_WRITE` | `ELV2_SECONDARY_BOUNDARY` | ELV2 room/round/attempt lifecycle mutation. |
| `revealround` | `elv2_action` | `BUSINESS_WRITE` | `ELV2_SECONDARY_BOUNDARY` | ELV2 room/round/attempt lifecycle mutation. |
| `startroom` | `elv2_action` | `BUSINESS_WRITE` | `ELV2_SECONDARY_BOUNDARY` | ELV2 room/round/attempt lifecycle mutation. |
| `submitattempt` | `elv2_action` | `BUSINESS_WRITE` | `ELV2_SECONDARY_BOUNDARY` | ELV2 room/round/attempt lifecycle mutation. |
| `auditoriarolespermisos` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `diagnosticosistemainterno` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `getasesoresactivos` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `getasistenciagrupocompleta` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `getcalendariomatriculas` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `getcierreacademiconivelpreview` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `getcomentarioadminestudiante` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `getcomprobantes` | `fn` | `READ_PURE` | `ALLOW_CORE_EXACT` | Sheet read; `flush()` only, no preceding mutation in path. |
| `getestudiantesparacierre` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `getfechasgrupo` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `getgrupoinfo` | `fn` | `READ_PURE` | `ALLOW_CORE_EXACT` | Handler + named callees reviewed; no write sink found. |
| `geticanestudiante` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `getleccioncerradadetalle` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `getlecciondetalle` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `getmaterialleccion` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `getmoragrupos` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `getnovedadesconape` | `fn` | `READ_PURE` | `ALLOW_CORE_EXACT` | Handler + named callees reviewed; no write sink found. |
| `getoperacionespagoreversibles` | `fn` | `READ_WITH_TECHNICAL_SIDE_EFFECT` | `BLOCK_DEFAULT_DENY` | `_apEnsureJournal_` can create/seed `PAGOS_OPERACIONES`. |
| `getprospectosasesor` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `getradiografiagrupo` | `fn` | `READ_PURE` | `ALLOW_CORE_EXACT` | Handler + named callees reviewed; no write sink found. |
| `getreportesadministrativos` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `getresumennotasoficialesestudiante` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `getresumenventas` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `getretroalimentacionestudiante` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `gettareaspendientesdocente` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `gettodosestudiantes` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `previsualizarextractobanco` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Preview read; `flush()` only, no preceding mutation in path. |
| `revisionacademicaasistidaf61` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `revisionacademicaasistidaf62` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `verificarcedulaexiste` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |
| `verificarcedulainscripcion` | `fn` | `READ_PURE` | `BLOCK_DEFAULT_DENY` | Handler + named callees reviewed; no write sink found. |

## UNKNOWN resueltos

### REBECA

- `agentGetCommercialConfig`, `agentGetPaymentStatus`, `agentGetRoutingDirectory` y `agentResolveContactContext` son lecturas de negocio con estado técnico: HMAC/replay/rate/data cache usa `CacheService` y locks. No se agregan a la allowlist core.
- `agentSubmitEnrollmentRequest`, `agentUpdateProspectProgress` y `agentReportPayment` son mutaciones de negocio autenticadas. Quedan default-deny por el guard primario de contención.

### ELV2

- `getState` es lectura del estado del LAB v2, pero la frontera secundaria autentica mediante el lifecycle de sesión; se clasifica `READ_WITH_AUTH_SIDE_EFFECT`.
- Las otras 10 acciones ELV2 (`createRoom`, `joinRoom`, `startRoom`, `prepareRound`, `openRound`, `lockRound`, `revealRound`, `submitAttempt`, `closeRound`, `closeRoom`) mutan estado de sala/ronda/intento.
- Las 11 permanecen detrás de `ELV2_SECONDARY_BOUNDARY`; no se trasladan a la allowlist core.

## Política candidata global después de CS21A211C

| decisión | cantidad |
| --- | ---: |
| `BLOCK_DEFAULT_DENY` | 258 |
| `ALLOW_LAB_EXPLICIT` | 69 |
| `ALLOW_CORE_EXACT` | 13 |
| `ELV2_SECONDARY_BOUNDARY` | 11 |
| **Total** | **351** |

## Gate pendiente

La clasificación manual de estas 49 rutas ya no bloquea por sí sola la allowlist mínima. Antes de cualquier instalación siguen faltando:

1. provisionar/identificar los 11 recursos externos QA separados;
2. verificar esas Script Properties contra el guard fail-closed;
3. ejecutar E1 sobre el patch actualizado;
4. solo después, E2/E3 contra el mismo deployment QA canónico;
5. E4 permanece fuera de este candidato.

## Veredicto

**49/49 RUTAS MANUALMENTE REVISADAS · 30 READ_PURE · 13 BUSINESS_WRITE · 6 READS CON SIDE EFFECT TÉCNICO/AUTH · ALLOWLIST CORE 13 · NO DEPLOY · NO PROD · NO E4.**
