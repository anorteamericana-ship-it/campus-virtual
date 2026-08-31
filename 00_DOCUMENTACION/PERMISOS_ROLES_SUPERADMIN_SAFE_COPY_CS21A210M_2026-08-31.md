# CS21A210M · Permisos y roles · superadmin + presentación segura

Fecha: 31-ago-2026

## Base exacta
- PR #229 / `fix/reportes-admin-safe-copy-cs21a210l`
- commit: `3e6bed99efcdbdfcbe707ae8e1c290271851d4ec`
- preimágenes:
  - `src/app.jsx`: `271414560cbf444835953bd1ea46f5cd722f3ad2`
  - `src/sidebar.jsx`: `ab8cbfc0becdb768d06fe2a852010f5c5a2c0b0d`
  - `src/permisos_roles.jsx`: `8e1340df7d87aa7499edeb80834eda8da772e841`

## Evidencia de intención por rol
`00_DOCUMENTACION/MATRIZ_ENTREGA_ROLES_CS21A131.md` ubica `Permisos y roles` dentro del bloque **Superadmin** y recuerda que operaciones exclusivas deben validar superadmin también en backend.

Estado previo de punta:
- `sidebar.jsx` exponía `permisos_roles` a admin y superadmin;
- `app.jsx` montaba la ruta para cualquier sesión cuyo rol visual fuera `admin`;
- la pantalla publicaba error crudo y presentaba términos/nombres de implementación (`backend`, `Endpoint`, nombres de función, `F42`, roles crudos).

## Corrección source-side
### Defensa en profundidad de rol
- `sidebar.jsx`: la opción solo se crea cuando `esSuperadmin`;
- `app.jsx`: navegación directa/hash con admin normal cae en `NoAutorizadoCampus`; solo `rolReal === 'superadmin'` monta `PermisosRolesView`.

### Presentación operativa
- frontera `prSafeUserError()` para carga;
- nombres de funciones se convierten en acciones operativas mediante `prActionLabel()`;
- roles se presentan mediante `prRoleLabel()`;
- texto dinámico de riesgos/recomendaciones pasa por `prOperatorText()`;
- `Endpoints` → `Acciones protegidas`;
- `Roles backend` → `Roles del sistema`;
- copy de carga/versionado interno se retira;
- CSV exporta etiquetas operativas, no nombres de función crudos.

Los códigos y estructuras originales continúan dentro del estado interno para filtrar/comparar; solo cambia la frontera de presentación.

## Límite crítico de evidencia
La búsqueda del source versionado encuentra `auditoriaRolesPermisos` únicamente en `src/permisos_roles.jsx`; no existe implementación backend versionada que permita demostrar aquí el control server-side del endpoint.

Por tanto:
- el gate frontend es **defensa en profundidad**, no autorización suficiente;
- `BACKEND CURRENT SNAPSHOT UNVERIFIED` permanece vigente;
- no se afirma que admin esté bloqueado server-side;
- la verificación backend debe realizarse con el snapshot modular QA actual antes de release/E2.

## Trazabilidad bootstrap
Primer bootstrap `33441835871`: **FAIL antes de ejecutar el patcher**.
- ancestry exacta y tres preimágenes: PASS;
- error de sintaxis por template literal `${...}` del propio patcher;
- ningún source funcional fue modificado o publicado.

Segundo bootstrap `33442029427`: **FAIL antes de ejecutar el patcher**.
- ancestry exacta y tres preimágenes: PASS;
- cadena multilínea del nuevo gate de `app.jsx` quedó abierta en el patcher;
- ningún source funcional fue modificado o publicado.

Tercer bootstrap `33442212620`: **SUCCESS completo**.
- ancestry y tres preimágenes exactas: PASS;
- patch exacto: PASS;
- guard CS21A210M: PASS;
- regresión CS21A210L: PASS;
- regresión CS21A210K: PASS;
- `git diff --check`: PASS;
- source temporal verificado: commit `133e2f6436d506488a53cd75d2c774dbac574e97`;
- blobs funcionales verificados:
  - `src/app.jsx`: `1ab9a713135971fbc1bc9856eb89d2e01b9d8053`
  - `src/sidebar.jsx`: `c96b6807c3404a4c16e191862b579a3bcb59e12c`
  - `src/permisos_roles.jsx`: `e94af9b8488e048a45aff9ba0d9d3fc6c2d4d383`

Después del bootstrap la rama se reconstruye desde el árbol exacto de #229 como un único commit final con seis rutas: 3 funcionales + guard + workflow + documentación. Los artefactos bootstrap no forman parte del candidato final.

## Contratos preservados
- POST con token en body;
- llamada `auditoriaRolesPermisos`;
- `data.endpoints`, filtros, KPIs, vistas, propiedad, riesgos y recomendaciones como contrato interno;
- pantalla solo lectura;
- Apps Script / Drive ACL / main / PROD intactos.

## Estado de evidencia
- E0: sí.
- E1 source/QA: bootstrap sí; QA final/PR debe quedar verde antes del checkpoint canónico.
- E2 autenticado/runtime: NO.
- autorización backend actual: NO verificada.
- PROD/main: NO tocados.

**DEFENSE IN DEPTH · SOURCE/QA ONLY · BACKEND AUTH UNVERIFIED · NO PROD · NO AUTO-MERGE**
