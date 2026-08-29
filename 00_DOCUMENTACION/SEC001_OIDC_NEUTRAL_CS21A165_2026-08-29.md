# CS21A165 · SEC-001 · OIDC provider-neutral foundation · 2026-08-29

## Base

`main@53df524d0a9eab867d3b307b3e633f366af92a63`

## Por qué no portar #109 literalmente

PR #109 quedó 93 commits detrás de `main`. Su arquitectura útil era correcta en lo esencial —sustituir únicamente la acreditación inicial y conservar la sesión Campus— pero el adaptador source quedó hardcodeado a Auth0 aunque todavía no existe tenant DEV/QA.

CS21A165 rescata la frontera arquitectónica sin seleccionar proveedor desde código.

## Estado actual revalidado

En `main`:

- `login.html` carga `src/data.jsx` y después `src/login.jsx`;
- no carga ningún adaptador managed-auth;
- `src/login.jsx::App.submit` sigue enviando `fn:'iniciarSesion'`, `usuario`, `clave`;
- `finishLogin()` sigue emitiendo el DTO de sesión existente;
- `src/data.jsx::setSesion` guarda la sesión en `sessionStorage.an_usuario`;
- `src/data.jsx::getSessionToken` lee el token desde ese mismo objeto.

Conclusión: el cambio futuro puede reemplazar únicamente el primer factor de acreditación y conservar consumidores/token/autorización actuales.

## Nuevo adaptador V2

`src/auth_provider_sec001_v2.jsx`

Características:

- `enabled:false` por defecto;
- únicamente ambientes `dev` / `qa`;
- sin proveedor hardcodeado;
- sin SDK de vendor;
- sin `client_secret`;
- sin password/clave;
- exige issuer HTTPS, client ID público, redirect URI HTTPS y scope `openid`;
- delega únicamente a `window.SEC001_OIDC_DRIVER` inyectado por un futuro integrador;
- el driver debe implementar `beginLogin`, `resolveCallback`, `getProof`;
- cargar el archivo no hace fetch, redirect, storage write, inicialización SDK ni `setSesion`.

El archivo **NO está cargado por `login.html`** en este corte.

## Contrato de backend V2

`security/sec001_oidc_bridge_contract_v2.json`

Futuro endpoint: `iniciarSesionOidc`.

Invariantes:

- OIDC + Authorization Code with PKCE;
- proveedor/issuer allowlisted server-side;
- la URL de issuer/discovery no se acepta desde el request;
- identidad estable = `PROVIDER_ID + ISSUER + PROVIDER_SUB`;
- mapping debe resolver exactamente un principal local;
- provider role/grupos jamás conceden autorización Campus;
- Apps Script relee cuenta local, activo, rol, grupo y scope;
- respuesta reutiliza el DTO/token Campus actual;
- proof del proveedor no se retorna, persiste ni loguea;
- endpoint con rate limit y replay marker por digest/TTL corto;
- cuenta migrada nunca vuelve al fallback plaintext.

## Gate de routing

No se permite:

- cargar el adaptador en `login.html` antes de runtime QA;
- exponer `iniciarSesionOidc` antes de tener proveedor DEV/QA;
- migrar cuentas reales antes de pruebas ficticias;
- portar backend sobre un snapshot viejo/monolítico de Apps Script.

## Lo que falta

1. seleccionar/configurar proveedor OIDC DEV/QA fuera de código;
2. decidir driver concreto y callback autorizado;
3. exportar el Apps Script QA modular vigente;
4. crear `AUTH_IDENTIDADES` con datos ficticios;
5. implementar `iniciarSesionOidc` sobre esa fuente exacta;
6. validar proof/issuer/sub y mapping;
7. rate limit/replay protection;
8. pruebas negativas de cuenta faltante/ambigua/inactiva y claims forjados;
9. MFA para personal y recovery;
10. migración controlada sin copiar claves plaintext;
11. neutralizar credenciales legibles solo después de confirmar identidad nueva;
12. autorización separada antes de producción.

## Estado

**PROVIDER-NEUTRAL SOURCE FOUNDATION · INERT / UNLOADED · STATIC QA TO RUN · NO TENANT · NO ROUTE · NO APPS SCRIPT CHANGE · NO PROD**
