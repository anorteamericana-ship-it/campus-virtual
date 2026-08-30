# SEC-002 · Admin certificado · consumidor privado source

Fecha: 2026-08-30 · Costa Rica

## Base

- PR base: #199 · entrega privada de constancias/cartas CONAPE.
- Base exacta: `77cb5c9741cb648be960a2aed19e574320d0d0e4`.
- Sin cambios en `main`, Apps Script, Drive ACL ni producción.

## P1 demostrado

El panel administrativo de certificados conserva rutas `data.url -> window.open(...)`, un enlace `certResult.url -> Abrir` y un fallback `search_url -> Buscar en Drive`.

Se inspeccionaron certificados reales en Drive:

- tres certificados recientes de Básico II: `anyone / reader`, `allowFileDiscovery=false`;
- un certificado de Básico I: `anyone / reader`, `allowFileDiscovery=false`;
- la carpeta raíz de certificados B2 inspeccionada también es `anyone / reader`;
- su carpeta superior de grupo conserva el mismo permiso.

Por tanto la exposición por enlace de certificados ya no es una inferencia: es un **P1 SEC-002 real**.

## Regla de seguridad

No retirar ACL primero. El sistema todavía tiene consumidores de URL y la generación dentro de carpetas públicas puede volver a heredar acceso por enlace.

Orden de cierre:

1. endpoint privado autenticado instalado en Apps Script QA vigente;
2. consumidores student/admin migrados;
3. E2 positiva del propio estudiante;
4. E2 negativa contra otro expediente;
5. E2 admin/superadmin;
6. privatizar copia/árbol QA controlado;
7. generar un certificado nuevo y comprobar que NO herede `anyone`;
8. repetir E2;
9. producción en release separado/autorizado.

## Contrato backend reutilizado

El delta histórico `qa/sec002_private_certificate_delta.patch` define `descargarMiCertificadoPrivado` para roles:

- `student`;
- `admin`;
- `superadmin`.

Para estudiante valida ownership. Para todos los roles aplica rate limit, valida PDF/tamaño y devuelve:

- `data_base64`;
- `mime_type`;
- `size_bytes`;
- `sha256`;
- nombre/registro/nivel.

El endpoint **no está instalado en el backend canónico actual**; #132 ya documentó 0 coincidencias en Code.gs. Issue #111 sigue siendo gate para portarlo al snapshot modular QA vigente.

## Cambio source de este corte

Solo `src/admin_students.jsx`:

- `buscarCertificado` deja de usar `buscarCertificadoExistente` como consumidor URL y pide `descargarMiCertificadoPrivado`;
- generar/regenerar conserva `generarCertificado`, pero después obtiene el PDF mediante `descargarMiCertificadoPrivado`;
- valida MIME, base64, tamaño anunciado, límite 2 MiB, firma `%PDF-` y SHA-256;
- abre Blob/ObjectURL temporal y lo revoca;
- deja de guardar/renderizar `data.url` y `search_url` para el certificado admin.

## No cambia

- reglas de elegibilidad;
- consecutivos;
- `REG_CERTIFICADOS`/registro oficial;
- generación masiva;
- endpoint `generarCertificado`;
- archivos existentes;
- ACL;
- Apps Script;
- producción.

## Estado esperado

**SOURCE MIGRATED · P1 ACL STILL OPEN · BACKEND ENDPOINT PENDING #111 · E2 PENDING · NO PROD · NO AUTO-MERGE**
