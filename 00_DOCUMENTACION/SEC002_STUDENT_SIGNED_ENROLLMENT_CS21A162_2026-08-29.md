# CS21A162 · SEC-002 · Matrícula firmada privada del estudiante

Fecha: 2026-08-29

## Base

- Stack: PR #133 / `security/sec002-payment-receipt-private-cs21a161`
- `main` de referencia: `53df524d0a9eab867d3b307b3e633f366af92a63`
- Alcance: **frontend/source only**.

## Problema

El flujo privado de matrícula firmada necesitaba dos consumidores distintos:

1. Ventas/Admisiones, ya preparado en CS21A159;
2. el propio estudiante dentro de `Documentos y ayuda`.

El segundo consumidor faltaba en la fuente moderna.

## Cambio

Solo `src/student_experience.jsx`:

- añade `_studentPrivateSignedPdfF984()`;
- utiliza únicamente el token de la sesión; no acepta código/cédula arbitrarios del navegador para seleccionar otro estudiante;
- llama `descargarMatriculaFirmadaPrivada` por POST;
- exige `application/pdf`;
- máximo 9 MB;
- valida tamaño anunciado;
- valida firma `%PDF-`;
- verifica SHA-256 cuando Web Crypto está disponible;
- crea `Blob` y `ObjectURL` temporal, luego lo revoca;
- añade `StudentSignedEnrollmentPrivateF984` a la pestaña `Programa y documentos`.

## Backend canónico observado

El `Code.gs` canónico fue revisado directamente en Drive durante CS21A159 y actualmente no contiene `descargarMatriculaFirmadaPrivada`.

Por ello este corte **NO declara runtime operativo**. El endpoint backend mínimo debe portarse al Apps Script QA acumulado actual con la autorización por rol/ownership del delta histórico de PR #110:

- estudiante: solo su propio expediente;
- ventas: solo prospectos de su cartera;
- admin/superadmin: alcance administrativo.

## ACL

Sin cambios en este corte. Orden obligatorio:

1. endpoint privado mínimo en Apps Script QA acumulado;
2. E2 estudiante propio positiva;
3. E2 estudiante ajeno negativa;
4. E2 Ventas propia/ajena;
5. verificar PDF/tamaño/hash;
6. retirar ACL pública solo en QA;
7. repetir E2;
8. producción en release separado y autorizado.

## QA estática

- `scripts/qa_sec002_student_signed_enrollment_cs21a162.mjs`
- `.github/workflows/qa-sec002-student-signed-enrollment-cs21a162.yml`

El guard exige token de sesión, MIME PDF, 9 MB, `%PDF-`, SHA-256, Blob/ObjectURL y montaje de la tarjeta privada en `Documentos y ayuda`.

## Estado

**SOURCE MIGRATED · STATIC QA · BACKEND QA ENDPOINT PENDING · ACL UNCHANGED · NO PROD**
