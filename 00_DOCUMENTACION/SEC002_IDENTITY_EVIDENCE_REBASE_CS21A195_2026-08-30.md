# CS21A195R · SEC-002 · evidencia histórica identidad/título · rebase

Fecha: 2026-08-30 · Costa Rica

## Base

- PR base: #203 · `security/sec002-certificate-tree-rebase-cs21a194`
- SHA base exacta: `843a044d9f5c88336c34bec8ea8a0a791f806f21`
- tipo: **CONTRACT / EVIDENCE ONLY**

## Evidencia incorporada desde PR #187

El backend acumulado histórico read-only demuestra el origen de los campos legacy:

- `FOTO_CED_FRENTE`;
- `FOTO_CED_DORSO`;
- `FOTO_TITULO`.

La inscripción histórica almacenaba estas imágenes bajo el árbol `DOCUMENTOS_ESTUDIANTES/{CEDULA}/INSCRIPCION/{tipo}.jpg` mediante `_guardarFotoProspecto`.

Ese publisher histórico aplicaba `DriveApp.Access.ANYONE_WITH_LINK` + `DriveApp.Permission.VIEW` y devolvía entrega `lh3.googleusercontent.com/d/{file_id}` para que el dashboard pudiera mostrarla.

Por tanto, **el origen histórico de publicación por enlace está probado**.

## Límite de evidencia

No se localizaron objetos actuales representativos por nombre y no se leyó su metadata actual. Por eso el contrato conserva explícitamente:

`current_object_acl = NOT_PROVEN`

No se afirma que hoy sigan públicos ni que ya sean privados.

## Consumidores activos

- Ventas: `src/ventas_parts.jsx` → `vxDriveCandidates(url)` → Drive thumbnail / uc / lh3.
- Matrículas Admin: `src/matriculas_admin.jsx` → `driveCandidates(url)` → mismo patrón.

No se cambian en este corte.

## Flujo moderno separado

PR #118 / PROD @419 resolvió la captura nueva privada. Este corte se refiere únicamente a campos/objetos legacy `FOTO_CED_* / FOTO_TITULO`.

## Contrato privado preservado

Se mantiene sin renombrar la operación propuesta en CS21A174:

`descargarDocumentoIdentidadPrivado`

No se instala ni se conecta antes del snapshot modular QA fresco de Issue #111.

## Gate

1. snapshot modular QA fresco;
2. localizar objetos actuales representativos sin exponer PII;
3. leer ACL real;
4. instalar endpoint privado staff-scoped sobre source modular exacto;
5. E2 Sales own-scope/cross-scope, admin/superadmin y rechazo student/anonymous;
6. migrar ambos consumidores a bytes autenticados + Blob/ObjectURL;
7. escanear acceso Drive/lh3 residual;
8. solo después probar retiro ACL en copias QA.

## No cambia

Frontend runtime, Apps Script, Drive ACL, objetos existentes, datos o producción.

**HISTORICAL PUBLIC SHARING PROVEN · CURRENT ACL NOT PROVEN · NO ACL CHANGE · NO PROD**
