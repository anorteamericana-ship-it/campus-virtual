# CS21A194R · SEC-002 · árbol legado de certificados · rebase sobre #202

Fecha: 2026-08-30 · Costa Rica

## Base actual

- PR base: #202 · `security/sec002-admin-academic-docs-private-cs21a193`
- SHA base exacta: `9ebf7d77544a35becfd54ae84099e19d2109c480`
- `main`: `53df524d0a9eab867d3b307b3e633f366af92a63`
- tipo: **CONTRACT / AUDIT ONLY**
- severidad: **P1 · OPEN BLOCKER**

## Por qué existe este rebase

PR #186 / CS21A194 hizo una auditoría paralela válida del árbol legado de certificados, pero su guard dependía de un helper privado de otra rama. La pila actual #202 usa `abrirPdfBackend(...,{allowUrl:false})` para constancias/cartas CONAPE.

Este corte conserva la evidencia de #186 y adapta únicamente el guard al source real de #202. No copia cambios funcionales de la rama paralela.

## Evidencia Drive consolidada

La auditoría de #186 registró mediante metadata real:

- raíz legado `DOCUMENTOS_ESTUDIANTES`: `anyone/reader`, link-only;
- al menos 4 carpetas de grupo: 4/4 `anyone/reader`;
- muestra incluye una carpeta creada en agosto de 2026;
- subcarpeta académica de nivel muestreada: `anyone/reader`;
- 3 certificados reales recientes: 3/3 `anyone/reader`;
- una matrícula firmada QA del flujo moderno usada como contraste: owner-only.

En la auditoría actual, independiente de #186, también se revisó metadata de un certificado reciente de agosto y resultó `anyone/reader` con descubrimiento desactivado.

Por tanto el hallazgo es actual y demostrado para el árbol legado de certificados; no debe generalizarse como “todo Drive es público”.

## Consumidores actuales

`src/admin_students.jsx` conserva exactamente tres aperturas directas `data.url -> window.open` relacionadas a certificados:

1. buscar certificado existente;
2. regenerar certificado;
3. generar certificado.

El source estudiante ya tiene `descargarMiCertificadoPrivado`, pero CS21A160 documentó que el endpoint backend no estaba instalado en el Code canónico observado durante ese corte.

## Backend

El monolito histórico inspeccionado no demostró `pdf_base64` para `generarCertificado`/`buscarCertificadoExistente` equivalente a la entrega privada de CS21A193.

No existe en este corte un endpoint staff privado demostrado. Se registra explícitamente como:

`NOT_DEFINED_OR_INSTALLED`

No se inventará un nombre de endpoint antes de obtener el snapshot modular QA fresco de Issue #111.

## Orden obligatorio

1. obtener snapshot modular QA fresco;
2. confirmar/instalar descarga privada del propio estudiante;
3. definir e instalar lectura privada staff-scoped para admin/superadmin;
4. migrar las 3 aperturas admin a bytes autenticados + Blob/ObjectURL;
5. ejecutar E2 positiva/negativa para student/admin/superadmin/anónimo;
6. inventariar exactamente carpetas/archivos del árbol legado afectados;
7. retirar `anyone/reader` solo después de que todos los consumidores requeridos estén verdes;
8. verificar acceso anónimo denegado después de la migración ACL.

## Gate

`BLOCK_UNTIL_PRIVATE_DELIVERY_AND_ACL_MIGRATION_E2`

## No cambia

- `src/**`;
- Apps Script;
- Drive ACL;
- archivos de certificado;
- URLs;
- endpoints;
- producción.

**CONTRACT ONLY · P1 OPEN · NO ACL CHANGE · NO PROD · NO AUTO-MERGE**
