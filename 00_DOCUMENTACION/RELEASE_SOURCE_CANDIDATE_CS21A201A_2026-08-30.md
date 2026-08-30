# CS21A201A · Candidato integrado source/QA de seguridad y roles

Fecha: 2026-08-30

## Base directa

PR #141 / `integration/release-probe-ventas-b1-cs21a169` @ `858be40ed7f40fa321b22b818087e28115fdf334`.

El árbol de CS21A200A/#190 es descendiente directo de esa base: **216 commits adelante / 0 atrás** antes de agregar este guard final.

CS21A201A no modifica producto respecto de #190. Su propósito es aplanar la pila de PRs y demostrar en una sola candidata que todas las mejoras source/QA desde #141 conviven juntas.

## Incluido en el árbol

### Ventas / Matrículas
- errores seguros Ventas;
- grupos reales fail-closed;
- proformas WhatsApp sin URL pública;
- Matrículas Admin fail-closed donde no existe persistencia real;
- contrato identidad histórica.

### SEC-001
- contraseña mínima visible de 6 caracteres;
- foundation OIDC provider-neutral, inerte y no conectada al login;
- runtime/server-side/rate-limit/MFA siguen pendientes.

### SEC-004
- contrato demo read-only moderno;
- patch source `ZZ_SEC004_DEMO_READONLY_OUTER_GUARD_V3.gs` no instalado;
- tooling snapshot Apps Script QA estrictamente read-only.

### SEC-002 estudiante/admin/docente
- certificado privado estudiante source;
- comprobante de pago privado source;
- matrícula firmada privada estudiante source;
- errores seguros en consumidores;
- perfil docente foto/CV/INA activo y blocker privado explícito;
- materiales docentes SEC-005 con 12/12 raíces públicas por enlace documentadas;
- constancias/carta CONAPE admin por bytes privados fail-closed;
- árbol legado de certificados público por enlace documentado;
- identidad/título legacy: publisher histórico público probado, ACL actual no probada;
- proformas actuales: muestras reales públicas por enlace, migración privada pendiente.

### Docente
- carga/sesión/asistencia sin errores técnicos visibles;
- acciones de clase/notas/asistencia con copy seguro;
- copy sin nombres internos.

### Admin / Superadmin
- Poner al día con frontera de errores segura;
- CONAPE sin nombres internos;
- `admin_students.jsx` con errores/copy saneados;
- Panel Maestro global/Cobranza preservado;
- Panel Maestro CONAPE R2: errores seguros + refresh veraz + copy efectivo;
- Supervisión, Suspensiones/Reprogramaciones y Aperturas seguras;
- Finanzas inline segura e idempotencia preservada.

## Perímetro funcional exacto desde #141

El guard CS21A201A exige exactamente **30 archivos bajo `src/`** en el diff. Si aparece otra superficie funcional, falla.

También exige que el único `.gs` añadido/modificado desde #141 sea:
`apps_script_patches/ZZ_SEC004_DEMO_READONLY_OUTER_GUARD_V3.gs`.

Ese archivo es un patch/source candidate; no es prueba de instalación ni cambio del runtime Apps Script.

## Fuera de esta candidata

- English LAB v2 / PR #121 y su QA multiusuario;
- infraestructura E2 Sales #142;
- infraestructura E2 English LAB #143;
- analyzer snapshot #144;
- instalación Apps Script;
- cambios de Drive ACL;
- producción.

## Gates que siguen abiertos

1. Issue #111: snapshot modular Apps Script QA fresco.
2. E2 Sales autenticado.
3. E2 de documentos privados por rol/scope/ownership.
4. E2 docente para materiales privados antes de retirar ACL.
5. E2 visual B1 Student Book.
6. English LAB multiusuario real.
7. SEC-001 server-side / anti-bruteforce / IdP / MFA.
8. SEC-004 adapter/install/runtime.
9. Migración ACL de certificados/proformas/materiales solo después de private delivery + E2.

## Política de publicación

**NO MERGE / NO PROD / NO APPS SCRIPT WRITE / NO ACL CHANGE** hasta decisión explícita y gates correspondientes.
