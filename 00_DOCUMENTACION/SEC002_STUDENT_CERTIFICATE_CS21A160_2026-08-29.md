# CS21A160 · SEC-002 · Certificado privado del estudiante

Fecha: 2026-08-29

## Base

- Stack: PR #131 / `security/sec002-ventas-private-delivery-cs21a159`
- `main` de referencia: `53df524d0a9eab867d3b307b3e633f366af92a63`
- Alcance: **frontend/source only**.

## Problema

La tarjeta `Mis Certificados` todavía abría `row.url` directamente en una pestaña nueva. Esa ruta mantiene la interfaz acoplada a un enlace público de Drive y no permite verificar ownership, tamaño o integridad del PDF en cada apertura.

## Cambio

Solo `src/student_modules.jsx`:

- propaga el código de la sesión a las tarjetas de certificado;
- `Abrir Certificado` deja de ser un `<a href={row.url}>`;
- llama `descargarMiCertificadoPrivado` por POST autenticado;
- exige MIME `application/pdf`;
- limita la respuesta a 2 MB;
- valida firma `%PDF-`;
- valida tamaño anunciado;
- verifica SHA-256 cuando Web Crypto está disponible;
- construye un `Blob` local y un `ObjectURL` temporal;
- revoca el `ObjectURL` después de la apertura.

`row.url` puede seguir llegando dentro del estado actual para determinar que el certificado existe, pero nunca se navega directamente a ese URL desde esta tarjeta.

## Backend canónico observado

El `Code.gs` canónico fue revisado directamente en Drive durante este corte. Actualmente no contiene `descargarMiCertificadoPrivado`.

Por ello este corte **NO declara descarga privada operativa en runtime**. El delta backend histórico de PR #110 es especificación y debe portarse de forma mínima al Apps Script QA acumulado actual; nunca instalar el `Code.gs` histórico completo.

## ACL

Sin cambios en este corte. El orden seguro es:

1. portar endpoint privado mínimo al Apps Script QA acumulado actual;
2. E2 positiva del propio estudiante;
3. E2 negativa intentando otro código/expediente;
4. comprobar PDF, tamaño/hash y experiencia visual;
5. retirar ACL pública únicamente en QA controlado;
6. repetir E2;
7. producción solo mediante release separado y autorización explícita.

## QA estática

- `scripts/qa_sec002_student_certificate_cs21a160.mjs`
- `.github/workflows/qa-sec002-student-certificate-cs21a160.yml`

El guard falla si reaparece `href={row.url}` o si desaparece alguna de las protecciones de MIME, límite, `%PDF-`, SHA-256, Blob/ObjectURL o revocación.

## Estado

**SOURCE MIGRATED · STATIC QA · BACKEND QA ENDPOINT PENDING · ACL UNCHANGED · NO PROD**
