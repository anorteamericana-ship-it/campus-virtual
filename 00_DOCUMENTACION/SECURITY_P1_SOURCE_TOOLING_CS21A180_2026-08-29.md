# CS21A180 · candidato consolidado P1 seguridad · source + tooling · 2026-08-29

## Base

- candidato base: PR #151
- head base exacto al crear la rama: `5d12fa2443d8a323c770e6e8277e0dcc0171d6fb`
- `main` observado: `53df524d0a9eab867d3b307b3e633f366af92a63`

## Objetivo

Consolidar, sin activar runtime, tres piezas modernas del frente P1 de seguridad:

1. SEC-001 source integrado ya contenido en #151;
2. SEC-004 moderno #135;
3. tooling read-only de snapshot Apps Script QA #150.

Esto reduce dispersión y deja una sola rama capaz de demostrar qué está listo en source y qué sigue bloqueado por runtime/backend.

## SEC-001

Se preserva CS21A179:

- contraseña visible mínima 6 en inscripción;
- OIDC provider-neutral `enabled:false`;
- adapter descargado de `login.html`;
- login vigente sigue usando `iniciarSesion`;
- server policy, rate limiting, IdP real, MFA y runtime siguen pendientes.

## SEC-004

Se incorpora exactamente #135 / CS21A163:

- contrato V3 genérico, sin helpers person-specific;
- `_sec004DemoIdentityAdapter_(session)` requerido;
- ausencia/fallo del adaptador autenticado => `sec004_policy_unbound`;
- ruta demo desconocida => `demo_read_only`;
- scope forjado => `demo_read_only`;
- allowlist de lectura estrecha;
- guard exterior debe ser el `doPost` efectivo más externo;
- no se afirma instalación QA ni cambio PROD.

El artefacto `apps_script_patches/ZZ_SEC004_DEMO_READONLY_OUTER_GUARD_V3.gs` continúa siendo **patch/source candidate**, no archivo instalado.

## Snapshot QA

Se incorpora exactamente #150 / CS21A178:

- exporter read-only por `clasp clone-script`;
- mínimo 37 archivos;
- baseline 01/44/95/99;
- SHA-256 individual + agregado;
- inventario `doPost`;
- sin `push`, deploy o login automático;
- snapshot real todavía pendiente de ejecutar en el entorno con sesión clasp autorizada.

## Relación con Issue #111

CS21A180 no elimina el gate. Lo convierte en una secuencia reproducible:

1. ejecutar CS21A178 read-only y congelar HEAD QA;
2. revisar manifest, archivos y wrappers;
3. reconciliar SEC-001/002/004 contra esa fuente exacta;
4. plan/diff sin escritura;
5. runtime QA solamente con autorización y sobre el mismo proyecto/deployment;
6. PROD separado.

## Lo que NO se declara resuelto

- SEC-001 server-side;
- SEC-002 endpoints/ACL/E2;
- SEC-004 instalado/runtime;
- E2 Sales;
- B1 visual;
- English LAB multiusuario;
- producción.

## Estado

**CONSOLIDATED SECURITY SOURCE/TOOLING CANDIDATE · RUNTIME BACKEND PENDING · NO APPS SCRIPT WRITE · NO PROD · NO AUTO-MERGE.**
