# CS21A211B · matriz semántica de endpoints Apps Script QA · 2026-09-01

## Línea base

- Snapshot: `QA_HEAD_20260901_215804Z`.
- Source files: **71**.
- Source aggregate SHA-256: `3e384ac34930e6a936a3f930db8819bd80124ef59f522ac1b5b11fee8f881ec6`.
- Matriz generada: **351 selectores ejecutables × 21 columnas**.
- CSV de trabajo SHA-256: `9903f63d0dff8adbc8280fcb30cc7e42c6c147a7abbd3b62b461eeb8a4ed547d`.
- Evidencia: **E0 ESTÁTICA** salvo referencias históricas a E2 ya registradas por separado.

La matriz no fuerza el total externo de 365. Sobre el snapshot exacto se resuelven 351 selectores ejecutables y **351/351 handlers quedan resueltos**. La diferencia `365 - 351 = 14` permanece como discrepancia metodológica a reconciliar; no se inventan filas para completar una cifra previa.

## Selectores por transporte

| selector_kind | cantidad |
| --- | ---: |
| `fn` | 332 |
| `elv2_action` | 11 |
| `action` REBECA | 7 |
| `fn_alias` | 1 |
| **Total** | **351** |

## Guard QA actual observado

| resultado del guard histórico | cantidad |
| --- | ---: |
| `ALLOW_DELEGATE` | 187 |
| `BLOCK_qa_write_blocked` | 95 |
| `ALLOW_LAB_DESIGN` | 69 |
| **Total** | **351** |

Esto confirma que la blacklist léxica histórica deja pasar una superficie muy superior a las lecturas auditadas y, simultáneamente, bloquea lecturas legítimas por coincidencia de nombre.

## Política CS21A211B propuesta

Después de revisar la matriz contra el patch de contención:

| decisión | cantidad |
| --- | ---: |
| `BLOCK_DEFAULT_DENY` | 262 |
| `ALLOW_LAB_EXPLICIT` | 69 |
| `ELV2_SECONDARY_BOUNDARY` | 11 |
| `ALLOW_CORE_EXACT` | 9 |
| **Total** | **351** |

No existe wildcard `get*`.

### Allowlist core exacta resultante

1. `iniciarSesion`
2. `validarSesion`
3. `cerrarSesion`
4. `getInfoGeneral`
5. `getEvaluacionesEstudiante`
6. `getAsistenciaEstudiante`
7. `getEstadoConape`
8. `getCalendarioDocente`
9. `getGrupoEstudiantes`

Los tres endpoints de sesión tienen side effects técnicos/de autenticación conocidos y se mantienen porque forman el lifecycle de sesión QA. No se presentan como lecturas puras.

## Dos correcciones surgidas de la matriz

### `getAdminDashboard` · DEFAULT DENY

La primera versión del candidato CS21A211 lo había allowlisteado como lectura. La revisión exacta encontró:

`getAdminDashboard → getResumenPagosCampus → getOrCreatePagosCampus`

Si `PAGOS_CAMPUS` no existe, el camino alcanza `insertSheet` + `appendRow`. Por tanto, no es una lectura pura garantizada y queda `BLOCK_DEFAULT_DENY` hasta que exista un camino no-creador o una precondición E4 aislada y demostrada.

### `getEstudiante` · DEFAULT DENY

La revisión manual encontró un side effect más serio que el clasificador inicial no representó correctamente:

`getEstudiante → _akEnriquecerFicha_ → _aqEnsureIntentSnapshots_`

La cadena puede crear/actualizar snapshots financieros de intentos mediante `_akEnsureSheet_`, `_akAppendObj_` y `_akSetObjRow_`. Además `_akGetCargos_` usa `_akEnsureSheet_`, que puede crear una hoja ausente y completar headers.

Por tanto, `getEstudiante` **no debe formar parte de una allowlist de lectura QA** mientras conserve ese comportamiento. Queda `BLOCK_DEFAULT_DENY` aunque una ejecución previa haya respondido correctamente cuando las estructuras ya existían.

## Clasificación de efectos

| effect_class | cantidad |
| --- | ---: |
| `BUSINESS_WRITE_CANDIDATE` | 281 |
| `READ_PURE_CANDIDATE` | 31 |
| `UNKNOWN` | 18 |
| `READ_WITH_TECHNICAL_SIDE_EFFECT` | 11 |
| `READ_WITH_AUTH_SIDE_EFFECT` | 6 |
| `AUTH_WRITE` | 2 |
| `READ_WITH_BUSINESS_SIDE_EFFECT` | 1 |
| `READ_PURE` | 1 |
| **Total** | **351** |

`UNKNOWN` no significa inseguro ni seguro: son rutas de dispatcher común que requieren revisión manual antes de permitirlas.

## Autorización observada

| auth_gate | cantidad |
| --- | ---: |
| `router_central_role_map` | 172 |
| `handler_reaches_validarSesion` | 134 |
| `wrapper_or_handler_review` | 15 |
| `public_intentional` | 12 |
| `elv2_campus_auth_adapter` | 11 |
| `rebeca_custom_auth` | 7 |
| **Total** | **351** |

La existencia del mapa central no cubre automáticamente wrappers externos que interceptan antes del router; cada uno sigue requiriendo prueba de autorización propia.

## Qué demuestra y qué no demuestra

Demuestra en E0:

- inventario reproducible de selectores del snapshot exacto;
- handler resuelto para 351/351;
- diferencia entre la política histórica y el default-deny propuesto;
- rutas con sinks de escritura transitivos detectados por el análisis;
- dos falsos permisos del candidato inicial (`getAdminDashboard`, `getEstudiante`) corregidos antes de instalación.

No demuestra:

- que los 281 candidatos de escritura muten en todas las condiciones;
- que los 31 `READ_PURE_CANDIDATE` sean automáticamente aptos para allowlist;
- orden runtime global de cada wrapper;
- E2/E3/E4 del candidato CS21A211;
- aislamiento real de Drive/Sheets hasta provisionar y configurar los recursos QA externos.

## Test plan E0–E4

### E0 · estática

1. Aplicar el patch solo sobre `QA_HEAD_20260901_215804Z`.
2. Reproducir candidate aggregate.
3. Validar que el frontend no contiene el Deployment ID PROD.
4. Validar 11 propiedades QA externas obligatorias y denylist PROD.
5. Validar unión `query.fn`, `body.fn`, `query.action`, `body.action`.
6. Rechazar selectores ambiguos.
7. Confirmar allowlist core de exactamente 9 nombres.
8. Confirmar `getAdminDashboard` y `getEstudiante` ausentes de la allowlist.
9. Source Truth English LAB sin regresión.

### E1 · sintética

Con stubs y sin recursos reales:

- core permitido → delega;
- endpoint no listado → `qa_endpoint_not_allowlisted`;
- selector peligroso → `qa_write_blocked`;
- selector ambiguo → `qa_route_ambiguous`;
- `action` discrepante → bloqueado;
- ELV2 ausente → no tumba todo POST;
- ID externo PROD → `qa_ids_invalidos`;
- propiedad QA externa faltante → fail-closed.

### E2 · autenticada lectura / lifecycle técnico

Solo después de provisionar recursos QA aislados:

- login student/teacher/superadmin QA;
- `validarSesion` por rol;
- `getInfoGeneral`;
- `getEvaluacionesEstudiante`, `getAsistenciaEstudiante`, `getEstadoConape`;
- `getCalendarioDocente`, `getGrupoEstudiantes`;
- `cerrarSesion` y verificar invalidación de sesión.

`getEstudiante` y `getAdminDashboard` quedan deliberadamente fuera de E2 hasta tener rutas no-creadoras o precondiciones controladas.

### E3 · desplegada lectura

Usar únicamente el deployment QA canónico existente, sin crear `/exec` paralelo:

- UI Apps Script QA debe contener **0** referencias al deployment PROD;
- todas las llamadas de la UI deben volver al mismo deployment QA;
- confirmar que endpoints no allowlisteados fallan cerrado;
- confirmar que recursos Drive/Sheets resueltos pertenecen al sandbox QA.

### E4 · escritura controlada

No ejecutar dentro de este candidato. Requiere autorización separada y sandbox comprobado. Antes de cualquier E4:

- IDs externos QA verificados;
- datos sintéticos QA;
- request IDs/idempotencia donde aplique;
- respaldo y reversión;
- ninguna escritura contra PROD.

## Veredicto

**MATRIZ E0 GENERADA · 351/351 HANDLERS RESUELTOS · ALLOWLIST CORE REDUCIDA A 9 · NO DEPLOY · NO PROD · NO E4.**
