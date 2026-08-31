# Security current candidate · 2026-08-31

## Objetivo

Consolidar la fuente más fuerte disponible sin mezclar ramas completas incompatibles ni declarar runtime/producción como resueltos.

## Autoridades exactas

- Base operativa/UI: PR #198 @ `1f2f17c98b1309018b20ad897b6ebc05f01cc93e`.
- `src/admin_students.jsx`: PR #201 @ `d3f0a2f36d95a71b55b7604cd67398c0d1beeff6`.
- Evidencia ACL SEC-002 de certificado/identidad/proforma: PR #205 @ `95ea46b0a32fb844f480052b0f24fd12b846874a`.

No se hace merge completo de #201 ni #205. Se importan únicamente los artefactos exactos definidos por el bootstrap.

## Razón de la composición

#198 contiene la línea más amplia de correcciones source/UI y los contratos SEC-005/SEC-006.

#201 contiene una versión más fuerte de `admin_students.jsx`:
- constancia/carta académica por bytes privados y fail-closed;
- certificados admin vía `descargarMiCertificadoPrivado`;
- validación MIME, base64, 2 MiB, firma `%PDF-` y SHA-256 cuando está disponible;
- error seguro para documentos comunes.

#205 contiene evidencia Drive más reciente:
- árbol legacy de certificados: P1 público por enlace;
- identidad: publisher histórico público demostrado, ACL actual `NOT_PROVEN`;
- proformas: 3/3 muestras recientes `anyone/reader`.

El contrato de certificado se reconcilia porque #205 describe consumidores URL que ya fueron migrados en #201. La evidencia ACL no se debilita: el frontend puede estar migrado en source y el árbol Drive seguir siendo P1 público al mismo tiempo.

## Estado honesto por clase

### Certificados
- Frontend admin: `SOURCE_MIGRATED_PRIVATE_RUNTIME_UNPROVEN`.
- Endpoint privado en deployment QA actual: pendiente Issue #111.
- Árbol Drive legacy: P1 público por enlace según evidencia.
- Cierre SEC-002: NO.

### Identidad / título
- Publisher histórico `ANYONE_WITH_LINK`: demostrado.
- ACL de objetos actuales representativos: `NOT_PROVEN`.
- Endpoint privado: pendiente Issue #111.

### Proformas
- 3/3 muestras recientes: `anyone/reader`.
- WhatsApp dejó de propagar enlace público.
- Descarga staff privada: pendiente.

### SEC-005 / SEC-006
Permanecen abiertos. No se cambia ninguna ACL.

## Gates de release que siguen abiertos

1. Snapshot modular QA Apps Script vigente y orden efectivo.
2. Port/reconcile de endpoints privados sobre esa fuente exacta.
3. E2 autenticado admin/superadmin/student y negativos de rol/ownership.
4. Inventario completo de ACL antes de cualquier remoción.
5. Migración ACL + verificación de acceso anónimo denegado.

## No cambia

- `main`;
- Apps Script;
- deployment;
- Drive ACL;
- producción;
- datos reales.

**SOURCE CANDIDATE ONLY · RUNTIME GATES OPEN · NO PROD · NO AUTO-MERGE**
