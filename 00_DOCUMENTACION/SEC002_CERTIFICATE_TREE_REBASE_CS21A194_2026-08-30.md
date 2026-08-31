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

El source estudiante ya tiene `descargarMiCertificadoPrivado`. CS21A160 había documentado correctamente que esa operación no estaba instalada en el Code canónico observado durante ese corte.

## Corrección de evidencia backend

PR #110 documentó y verificó un delta portable de 5 hunks:

`qa/sec002_private_certificate_delta.patch`

Ese delta **sí define** `descargarMiCertificadoPrivado` y lo registra para:

- `student`;
- `admin`;
- `superadmin`.

Para `student` revalida ownership. El piloto además exige PDF, máximo 2 MiB, rate limit 5/minuto, SHA-256 y respuesta base64 autenticada sin `url`, `folder_url`, `search_url` ni `file_id` exitosos.

La distinción correcta es:

- **contrato histórico privado: DEFINIDO Y VERIFICADO**;
- **runtime canónico/modular vigente: NO INSTALADO / NO CONFIRMADO, pendiente Issue #111**.

`generarCertificado` y `buscarCertificadoExistente` siguen siendo operaciones URL-based; la entrega privada es una operación separada.

## Orden obligatorio

1. obtener snapshot modular QA fresco;
2. reconciliar/portar el delta privado verificado sobre el source modular exacto;
3. confirmar en runtime QA autorización student/admin/superadmin y ownership student;
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
- endpoints runtime;
- producción.

**CONTRACT ONLY · P1 OPEN · HISTORICAL PRIVATE CONTRACT DEFINED · CURRENT RUNTIME PENDING #111 · NO ACL CHANGE · NO PROD · NO AUTO-MERGE**
