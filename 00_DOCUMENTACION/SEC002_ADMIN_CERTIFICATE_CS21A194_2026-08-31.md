# CS21A194 · SEC-002 · certificado privado en Admin

Fecha: 2026-08-31

## Base exacta

- PR base: #214 · `security/admin-private-conape-docs-cs21a193`
- SHA base: `48b1772b80510cb07efe2f7eb601b74519b44bf9`
- `main` observado: `53df524d0a9eab867d3b307b3e633f366af92a63`

## Hallazgo

`src/admin_students.jsx` abre certificados mediante `data.url` en tres rutas:

1. localizar un certificado ya registrado;
2. regenerar un certificado conservando el mismo registro;
3. generar un certificado nuevo.

Además, una muestra de tres certificados reales en Drive mostró en los tres casos `shared=true` con permiso `anyone / reader` y descubrimiento deshabilitado. Esto confirma acceso por enlace sin autenticación para esa muestra.

No se incluyen nombres, códigos, cédulas ni IDs de archivos en este documento.

## Contrato privado reutilizado

No se crea un endpoint nuevo. Se reutiliza el contrato SEC-002 histórico ya preparado para #110/#132:

`descargarMiCertificadoPrivado`

El delta histórico autoriza `student`, `admin` y `superadmin`; la restricción de expediente propio aplica al rol `student`. La respuesta privada prevista contiene `data_base64`, `mime_type`, `size_bytes`, `sha256` y nombre del archivo.

El endpoint todavía **no está instalado/verificado en el Apps Script QA acumulado vigente**. Issue #111 sigue siendo el gate de backend.

## Cambio frontend propuesto

Solo `src/admin_students.jsx`:

- Admin usa `descargarMiCertificadoPrivado` para abrir el PDF;
- valida MIME `application/pdf`;
- limita a 2 MB;
- comprueba tamaño anunciado vs bytes recibidos;
- valida firma `%PDF-`;
- valida SHA-256 cuando WebCrypto está disponible;
- crea Blob/ObjectURL temporal y lo revoca;
- elimina `window.open(data.url)` y el enlace `href={certResult.url}`;
- generación/regeneración siguen llamando `generarCertificado` sin alterar reglas de negocio.

## ACL

**No se cambia ningún ACL en este corte.**

Orden obligatorio:

1. migrar consumidor frontend;
2. portar endpoint privado mínimo al Apps Script QA actual conforme Issue #111;
3. E2 admin positiva y negativa;
4. privatizar una copia QA/controlada de certificado;
5. repetir E2 sin dependencia de enlace público;
6. retirar ACL en lote solo con evidencia y release separado;
7. producción requiere autorización explícita.

## E2 requerido

- Admin abre certificado existente por respuesta privada;
- regeneración conserva el mismo registro y luego abre por ruta privada;
- certificado nuevo se genera y luego se abre por ruta privada;
- MIME/tamaño/firma/hash inválidos fallan cerrado;
- usuario sin permiso no obtiene otro expediente;
- después de privatizar una copia QA, la experiencia sigue funcionando;
- no se modifica `main` ni producción durante QA.

Estado: **SOURCE MIGRATION CANDIDATE · BACKEND QA ENDPOINT PENDING · E2 PENDING · ACL UNCHANGED · NO PROD · NO AUTO-MERGE**
