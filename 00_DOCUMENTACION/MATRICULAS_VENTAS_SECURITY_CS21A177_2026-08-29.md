# CS21A177 · candidato integrado Ventas/Matrículas · 2026-08-29

## Base

- candidato global base: PR #141 / `integration/release-probe-ventas-b1-cs21a169`
- head base observado: `858be40ed7f40fa321b22b818087e28115fdf334`
- `main` observado: `53df524d0a9eab867d3b307b3e633f366af92a63`

## Objetivo

Consolidar en un solo candidato no productivo los cortes modernos posteriores a #141 que afectan Ventas/Matrículas:

- #145 · CS21A173 · errores seguros + grupos reales fail-closed;
- #146 · CS21A174 · contrato SEC-002 de identidad histórica;
- #147 · CS21A175 · proformas sin enlace público en WhatsApp;
- #148 · CS21A176 · Matrículas Admin solo lectura donde no existe persistencia + errores seguros.

La rama se crea inicialmente desde #148 y luego incorpora exactamente #146. #145 y #147 ya son ancestros de #148.

## Contratos que deben coexistir

### Ventas

- ningún fallback real a `DEMO_GRUPOS`;
- grupo tentativo obsoleto se limpia;
- errores técnicos no se convierten en copy visible;
- entrega privada de `docs_extra`/matrícula firmada continúa como source candidate, backend pendiente;
- proformas ya no distribuyen URL pública por WhatsApp.

### Matrículas Admin

- ficha general no aparenta una persistencia que no existe;
- datos generales quedan en solo lectura hasta endpoint real;
- `Guardar nota` de Ventas sigue operativo;
- errores técnicos quedan en consola;
- proformas usan transición manual de adjunto WhatsApp;
- identidad/título históricos continúan inventariados como legacy SEC-002, sin ampliar ACL.

### SEC-002 identidad histórica

El merge debe preservar el contrato CS21A174:

- consumidores Ventas + Matrículas Admin;
- `FOTO_CED_FRENTE`, `FOTO_CED_DORSO`, `FOTO_TITULO`;
- backend privado todavía pendiente;
- no consumer switch antes del backend;
- no ACL change;
- Issue #111 sigue siendo gate del Apps Script QA modular.

## Lo que este candidato NO resuelve

- no instala endpoints privados de Apps Script;
- no retira ACL Drive;
- no convierte la descarga staff de proformas a Blob/ObjectURL;
- no implementa edición general de prospectos;
- no completa E2 Sales autenticado;
- no completa E2 multiusuario English LAB;
- no completa E2 visual B1 Student Book;
- no toca PROD.

## Gate integrado

`QA Matriculas Ventas Security CS21A177` ejecuta:

1. CS21A173;
2. CS21A174;
3. CS21A175;
4. CS21A176;
5. integración Ventas CS21A166;
6. SEC-002 Ventas private delivery CS21A159;
7. aserciones cruzadas CS21A177.

## Estado

**INTEGRATION CANDIDATE · SOURCE/QA ONLY · BACKEND SEC-002 PENDING · E2 PENDING · NO PROD · NO AUTO-MERGE.**
