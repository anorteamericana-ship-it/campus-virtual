# CS21A194 · SEC-002 · certificado privado para admin/superadmin

Fecha: 2026-08-31

## Base
- PR #209 / `security/admin-private-academic-doc-delivery-cs21a193`
- base exacta: `fac327b064a711c9455ffec7b93129445665589c`
- `main` observado: `53df524d0a9eab867d3b307b3e633f366af92a63`

## Hallazgo
`src/admin_students.jsx` conserva tres aperturas administrativas de certificado mediante `data.url -> window.open(...)`: localizar certificado existente, regenerar conservando registro y generar certificado.

## Evidencia ACL
Se inspeccionaron 3 certificados PDF reales de distintos momentos. Los tres reportaron permiso `anyone / reader` con `allowFileDiscovery:false` además del owner. Por tanto existe evidencia directa de **acceso público por enlace en la muestra**.

La muestra no autoriza afirmar que el 100% del corpus tenga la misma ACL, pero sí basta para mantener SEC-002/P1 abierto.

## Endpoint privado ya diseñado
El delta histórico de PR #110 (`qa/sec002_private_certificate_delta.patch`) definió `descargarMiCertificadoPrivado` para roles `student`, `admin`, `superadmin`.

El contrato histórico:
- exige sesión;
- restringe estudiante a su propio código;
- permite a admin/superadmin indicar expediente;
- busca certificado por código/nivel/grupo/registro;
- limita a 2 MiB;
- exige PDF;
- devuelve `data_base64`, tamaño y SHA-256;
- tiene rate limit.

CS21A160 ya migró el frontend estudiante, pero documentó explícitamente que el endpoint no estaba instalado en el backend canónico observado.

## Cambio source CS21A194
El admin deja de:
- abrir `data.url` directamente;
- guardar la URL pública en el estado visual de certificado.

En su lugar solicita `descargarMiCertificadoPrivado` y valida en frontend:
- MIME `application/pdf`;
- máximo 2 MiB;
- firma `%PDF-`;
- `size_bytes` cuando viene informado;
- SHA-256 cuando Web Crypto está disponible;
- Blob/ObjectURL temporal + revocación.

Si el endpoint no está disponible o la respuesta no pasa integridad, falla cerrado con copy estable y conserva el diagnóstico en consola.

## Regla ACL
**No retirar `ANYONE_WITH_LINK` todavía.** El orden seguro es:
1. obtener snapshot modular QA actual por Issue #111 / CS21A178;
2. portar únicamente el delta mínimo de `descargarMiCertificadoPrivado`;
3. E2 estudiante positiva y negativa;
4. E2 admin/superadmin positiva + rol no autorizado negativo;
5. privatizar copias controladas QA;
6. repetir E2 después de retirar ACL;
7. release PROD separado y con autorización explícita.

## Estado
**SOURCE MIGRATED · BACKEND QA PENDING · PUBLIC-BY-LINK DEMONSTRATED IN 3/3 SAMPLES · ACL UNCHANGED · NO PROD**
