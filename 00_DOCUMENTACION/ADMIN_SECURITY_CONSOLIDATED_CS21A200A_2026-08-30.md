# CS21A200A · Admin · candidato consolidado de seguridad y operación

Fecha: 2026-08-30

## Base canónica

Base exacta: PR #188 / `security/sec002-proforma-public-acl-contract-cs21a196` @ `5a49384572ee69e680da8db8dd88d160f817f1b5`.

Esta base conserva la línea SEC-002 fuerte:
- #185 · entrega privada fail-closed de constancias y cartas CONAPE;
- #186 · árbol legado de certificados público por enlace, contract-only;
- #187 · evidencia histórica identidad/título legacy;
- #188 · proformas actuales públicas por enlace, contract-only.

## Problema de integración

Durante la auditoría se desarrollaron en paralelo varias mejoras admin válidas sobre otras ramas. Fusionar esas ramas completas volvería a introducir implementaciones duplicadas de la entrega PDF y mezclaría historiales incompatibles.

CS21A200A no hace merges completos. Copia por SHA fijado únicamente los **11 archivos funcionales únicos** cuyo estado final ya fue probado en sus ramas fuente.

## Fuentes exactas

### #175 @ `cf92c89cc0521634c6ab672f3bcc4fc77afe24ab`
- `src/admin_master_dashboard.jsx`

### #184 @ `147bac6ef6a790621bd333f8527dcc5dacac9f2a`
Estado final R2 del Panel Maestro CONAPE:
- `src/admin_master_conape_data_cs21a96.jsx`
- `src/admin_master_conape_review_core_cs21a96.jsx`
- `src/admin_master_conape_view_cs21a96.jsx`
- `src/admin_master_conape_wa_cs21a96.jsx`
- `src/admin_master_conape_review_state_cs21a96.jsx`
- `src/admin_master_conape_multisort_cs21a109.jsx`

### #177 @ `07988ed9227514ad8ae63599bd662e937f6fcb4e`
- `src/panel_admin_supervision.jsx`
- `src/panel_suspensiones.jsx`
- `src/aperturas_admin_cs21a20.jsx`

### #178 @ `806c9fabc5b0e16a4faa7fc51af29be10f8bf3ee`
- `src/admin_students_inline_payment_cs21a36.jsx`

## Deliberadamente excluido

No se copia `src/admin_students.jsx` desde #172/#179 ni desde ninguna variante paralela. La versión autoritativa de esta superficie es la de #185→#188, que:
- exige bytes privados;
- valida PDF/MIME/firma/tamaño;
- no navega a Drive como fallback en las rutas cubiertas.

## QA obligatorio del bootstrap

Antes de empujar el candidato, el runner debe:
1. verificar base exacta #188;
2. verificar que los cuatro SHAs fuente existan;
3. copiar exactamente los 11 archivos por `git show <SHA>:<path>`;
4. ejecutar guards originales de #175, #177 y #178;
5. ejecutar guards originales R2 de #180, #181, #182, #183 y #184 contra el estado final de #184;
6. ejecutar guards SEC-002 #185/#186/#187/#188 y regresiones CS21A192/191 de la base;
7. ejecutar el guard cruzado CS21A200A;
8. ejecutar `git diff --check`;
9. autoeliminar el bootstrap;
10. empujar solo si todo está verde.

## Qué preserva

- Cobranza desde `data.collections.rows`;
- sincronización y morosidad CONAPE con estados veraces;
- errores seguros del Panel Maestro y sus acciones;
- Supervisión, Suspensiones/Reprogramaciones y Aperturas;
- persistencia real de Aperturas;
- pagos inline e idempotencia;
- línea SEC-002 fuerte de #188;
- blockers honestos de certificados, identidad legacy y proformas.

## Qué NO cambia

- Apps Script;
- Drive ACL;
- producción;
- `main`;
- endpoints;
- reglas académicas;
- reglas financieras;
- CONAPE;
- certificados/proformas legacy.

Estado: **DRAFT CANDIDATE · SOURCE/QA ONLY · E2/BACKEND/ACL PENDING · NO PROD · NO AUTO-MERGE**.
