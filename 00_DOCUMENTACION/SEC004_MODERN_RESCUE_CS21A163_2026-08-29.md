# CS21A163 · SEC-004 modern rescue · 2026-08-29

## Fuente de verdad

- `main`: `53df524d0a9eab867d3b307b3e633f366af92a63`.
- PR histórico #108: `fix/sec004-demo-readonly-foundation`, 93 commits detrás de `main`.
- Issue #111: gate transversal para cualquier instalación backend de seguridad sobre el Apps Script QA acumulado.

## Hallazgo

PR #108 no contiene un delta funcional sobre el frontend/backend versionado actual. Sus ocho archivos son artefactos nuevos de diseño, parches históricos y QA. Por tanto, **no corresponde rebasear ni mergear esa rama histórica**.

La arquitectura de #108 además conserva dos supuestos que ya no deben trasladarse como contrato moderno:

1. nombres de helpers demo ligados a identidades/personas concretas;
2. una sentinel específica de una capa English LAB histórica.

El runtime QA observado el 21-ago-2026 fue un proyecto modular de 37 archivos. En esta sesión no se encontró un export completo y fresco posterior a ese checkpoint. Los paquetes CS21A144/CS21A146 hallados en Drive son anteriores y no sirven como base de instalación.

## Rescate moderno

CS21A163 crea un candidato source-only desde `main` actual:

- `apps_script_patches/ZZ_SEC004_DEMO_READONLY_OUTER_GUARD_V3.gs`
- `security/sec004_demo_readonly_contract_v3.json`
- `scripts/qa_sec004_demo_outer_guard_cs21a163.mjs`
- `.github/workflows/qa-sec004-demo-outer-guard-cs21a163.yml`

### Diferencia principal de V3

El guard exterior ya **no conoce ninguna identidad demo concreta**. El backend modular actual debe aportar:

```js
_sec004DemoIdentityAdapter_(session)
```

que resuelve explícitamente:

- si la sesión es demo;
- tipo `student` o `teacher`;
- grupos sintéticos permitidos;
- códigos de estudiante sintéticos permitidos;
- cédulas sintéticas permitidas;
- identidades docentes sintéticas permitidas.

Opcionalmente el backend puede aportar:

```js
_sec004DemoSimulatedWriteAdapter_(fn, body, auth)
```

para simulaciones que ya estén demostradas como 100% sintéticas.

## Fail-closed real

Si `_sec004DemoIdentityAdapter_` falta o falla:

- login autenticado: `sec004_policy_unbound`;
- POST autenticado: `sec004_policy_unbound`;
- request público sin token: delega sin cambios.

La razón es deliberada: si el servidor no puede distinguir de forma canónica una cuenta demo de una real, no debe asumir que una sesión autenticada es segura para escritura.

## Política demo

Para una sesión reconocida como demo:

1. validar scope solicitado contra `session.demo_scope` derivado del adaptador;
2. permitir `cerrarSesion` como bookkeeping;
3. permitir una escritura solo si el adaptador sintético devuelve una respuesta sin tocar datos reales;
4. permitir únicamente lecturas de allowlist explícita;
5. cualquier ruta nueva, mutación no clasificada o scope forjado => `demo_read_only`.

## Orden de proyecto

El archivo debe ser el `doPost` efectivo **exterior** del proyecto completo. El prefijo `ZZ_` no demuestra orden de ejecución.

Antes de instalar:

1. exportar el Apps Script QA completo vigente;
2. hash/manifest de todos los archivos;
3. enumerar todas las reasignaciones `doPost`;
4. portar el adaptador demo en los módulos reales actuales;
5. revalidar la allowlist contra las rutas actuales;
6. instalar el guard después de todas las capas;
7. demostrar que no existe un wrapper posterior.

## Qué NO se rescata como instalable

- el `Code.gs` histórico completo;
- `qa/sec004_codegs_demo_core_delta.patch` como patch literal contra el backend actual;
- la sentinel fija `englishLabWordSearchCreateRoom` como requisito moderno;
- helpers person-specific del guard histórico;
- contraseñas demo literales.

Los cinco hunks demo-core históricos siguen siendo especificación para descubrir responsabilidades equivalentes sobre el snapshot modular vigente, no un parche instalable.

## QA estática

`scripts/qa_sec004_demo_outer_guard_cs21a163.mjs` prueba:

- sintaxis;
- ausencia de helpers/secretos demo person-specific históricos;
- un solo wrapper `doPost`;
- fail-closed si falta el adaptador;
- delegación de tráfico público sin token;
- delegación de sesión real cuando el adaptador resuelve `is_demo=false`;
- bloqueo de ruta demo desconocida;
- lectura demo válida dentro de scope;
- bloqueo de scope forjado;
- escritura demo únicamente mediante adaptador sintético explícito.

## Estado

**SOURCE CANDIDATE · CURRENT MAIN BASE · STATIC QA TO RUN · BACKEND MODULAR SNAPSHOT PENDING · NO APPS SCRIPT CHANGE · NO PROD · NO AUTO-MERGE**
