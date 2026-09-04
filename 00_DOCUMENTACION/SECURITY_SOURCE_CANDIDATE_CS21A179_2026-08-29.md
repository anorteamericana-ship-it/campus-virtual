# CS21A179 · candidato integrado de seguridad source · 2026-08-29

## Base

- candidato base: PR #149
- head base exacto: `db3e2bfe0cfcfe67d27e7bbcaf6d03c813f42882`
- `main` observado: `53df524d0a9eab867d3b307b3e633f366af92a63`

## Objetivo

Agregar al candidato integrado Ventas/Matrículas las dos piezas modernas SEC-001 ya aisladas y verdes:

- #136 · CS21A164 · mínimo visible de contraseña 6;
- #137 · CS21A165 · foundation OIDC neutral, inerte y descargada del login.

Ambas ramas son hermanas basadas en el mismo `main`; CS21A179 las incorpora de forma explícita sobre #149 y verifica su convivencia con CS21A177.

## CS21A164

Solo alinea el formulario público:

- clave mínima de 6 caracteres en el paso de datos;
- `minLength={6}` / `maxLength={128}`;
- segunda validación de 6 antes del submit final.

No es un control suficiente por sí mismo. Backend mínimo, common-password block, rate limiting, eliminación de credenciales legibles, MFA y runtime QA siguen pendientes.

## CS21A165

El adaptador provider-neutral:

- `enabled:false` por defecto;
- solo dev/qa;
- no contiene `client_secret`;
- no hace fetch/storage/session mutation al cargar;
- depende de un driver futuro inyectado explícitamente;
- no está cargado por `login.html`;
- no enruta `iniciarSesionOidc` desde el login vigente.

Por tanto no altera autenticación real hoy.

## Gate integrado

`QA Security Source Candidate CS21A179` exige:

1. guard CS21A164;
2. guard CS21A165;
3. guard integrado CS21A177;
4. aserciones cruzadas de mínimo 6 + OIDC inerte/unloaded + preservación SEC-002/Ventas/Matrículas.

## Lo que NO resuelve

- contraseña server-side;
- rate limit/anti-enumeración;
- almacenamiento/lectura de credenciales existente;
- proveedor/tenant OIDC;
- `AUTH_IDENTIDADES`;
- backend `iniciarSesionOidc`;
- MFA/recovery;
- endpoints privados SEC-002;
- E2 Sales/B1/English LAB;
- PROD.

CS21A178 (#150) queda separado como tooling read-only para obtener el snapshot Apps Script QA requerido por #111 y por cualquier trabajo server-side SEC-001/002.

## Estado

**INTEGRATION SOURCE CANDIDATE · SEC-001 PARTIAL/INERT · SERVER SECURITY PENDING · NO PROD · NO AUTO-MERGE.**
