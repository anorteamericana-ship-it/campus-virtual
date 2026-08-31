# CS21A197R · SEC-002 · certificado Admin privado rebasado sobre #205

## Base

- línea canónica: PR #205 / `security/sec002-proforma-acl-rebase-cs21a196`
- base exacta: `95ea46b0a32fb844f480052b0f24fd12b846874a`
- fuente funcional rescatada: PR #200 / `cdeca3c02ced5cfde5c633729e6a0d14dbc2396f`
- evidencia ACL preservada: PR #203 / CS21A194R

## Problema de la divergencia

PR #203 rebasó correctamente sobre #202 la evidencia de que el árbol legado de certificados está publicado por enlace, pero en esa línea el Admin todavía conservaba tres consumidores `data.url -> window.open`.

PR #200, creado en una línea paralela, ya había migrado esos tres consumidores a `descargarMiCertificadoPrivado` con validación de PDF e integridad. Ese cambio funcional era válido, pero no estaba contenido en la punta canónica #205.

CS21A197R reconcilia ambas líneas sin copiar `admin_students.jsx` completo.

## Cambio source

Únicamente se portan los hunks de certificado:

- helper `abrirCertificadoPrivadoAdmin`;
- MIME `application/pdf` obligatorio;
- base64 obligatorio y decodificable;
- tamaño anunciado coherente y límite 2 MiB;
- firma `%PDF-`;
- SHA-256 cuando WebCrypto está disponible;
- Blob/ObjectURL temporal + revoke;
- certificado existente: lectura privada, sin `buscarCertificadoExistente` como consumidor URL;
- regeneración: conserva `generarCertificado`, luego descarga privada;
- primera generación: conserva `generarCertificado`, luego descarga privada;
- desaparecen `certResult.url`, `Buscar en Drive` y `search_url` del bloque de certificado.

No se reemplaza el archivo completo de #200 y no se altera el helper actual de #202 para constancias/cartas CONAPE.

## Estado real de seguridad

La migración es **SOURCE ONLY**.

No se afirma que `descargarMiCertificadoPrivado` esté instalado en el Apps Script modular QA vigente. Issue #111 sigue siendo el gate de runtime.

La evidencia Drive pública de certificados tampoco cambia: el árbol legacy continúa P1 `anyone/reader`. No se modifica ninguna ACL en este corte.

## Gate de release

`BLOCK_UNTIL_PRIVATE_DELIVERY_AND_ACL_MIGRATION_E2`

Antes de release:

1. snapshot modular QA vigente;
2. portar/reconciliar `descargarMiCertificadoPrivado` sobre esa fuente exacta;
3. E2 estudiante propio permitido;
4. E2 estudiante ajeno denegado;
5. E2 admin/superadmin permitido dentro de alcance;
6. anónimo denegado;
7. privatizar copia QA exacta del árbol legacy;
8. generar certificado QA nuevo y demostrar que no hereda `anyone/reader`;
9. repetir E2.

## Fuera de alcance

No Apps Script, no ACL, no proformas, no identidad/título, no reglas de certificado, no consecutivos, no producción, no `main`.
