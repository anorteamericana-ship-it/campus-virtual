# CS21A200G · Menú académico estudiante · errores seguros

Fecha: 2026-08-30  
Base: PR #195 · `security/sec006-additional-resources-public-link-contract-cs21a200f` @ `487aab63a46f026515d1f5ce396715b52794fc5b`

## Hallazgo

La ruta académica efectiva del estudiante `src/student_menu_academic_cs21a120.jsx` tenía cuatro fronteras visibles que podían copiar detalles técnicos a `ErrorCard` o a la línea de audio:

1. lazy-load de pantallas/componentes;
2. Resumen Académico;
3. catálogo de planeamiento/biblioteca;
4. audio privado.

El transporte `post()` puede originar HTTP, JSON inválido, mensajes backend o timeout. El lazy-loader también puede originar nombres internos de componentes/cargador.

## Regla

Se agrega `studentAcademicSafeUserError(raw, fallback, context)` únicamente en la frontera UI:

- mensajes humanos académicos pueden conservarse;
- códigos de máquina y detalles de Apps Script/backend/HTTP/JSON/token/red/componentes internos se registran en consola y no se muestran al estudiante;
- cada operación recibe un fallback estable y accionable.

## Mensajes de negocio preservados

Se mantiene expresamente el branch `response.acceso === false` y su motivo humano. Ejemplo de fallback contractual:

`La biblioteca no está habilitada para tu estado académico.`

No se convierte una restricción académica real en un mensaje genérico si el backend devuelve una explicación humana segura.

## Invariantes

No cambia:

- `getBibliotecaNivelEstudiante`;
- `getAudioPistaEstudiante`;
- token/payload;
- reglas de acceso;
- catálogo;
- nivel/grupo/código;
- audio base64 -> Blob/ObjectURL + revoke;
- rutas de Programa, Recursos adicionales, Syllabus o documentos;
- Apps Script;
- Drive ACL;
- producción.

## Límite

Este corte es higiene de UI/diagnóstico. No reemplaza controles server-side ni cambia la política de acceso. SEC-005/SEC-006 y los gates de Issue #111 permanecen independientes.

**DRAFT · SAFE UI BOUNDARY ONLY · NO PROD**
