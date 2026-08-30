# CS21A200I · Portal estudiante · errores seguros

Fecha: 2026-08-30  
Base: PR #197 · `fix/lazy-loader-safe-errors-cs21a200h` @ `fe2c882416fad86a6c096ecb2b18668d013fe810`

## Hallazgo

`src/student_portal.jsx` usa un fallback honesto:

1. consulta `getPortalEstudianteCompleto`;
2. si no está disponible, intenta `getEstudiante`;
3. si el fallback sí responde, monta el portal con `modo:'fallback_frontend'`.

Cuando ambas respuestas fallaban, el componente colocaba directamente `d.error || base.error` en `ErrorState`.

## Cambio

Se agrega `studentPortalSafeUserError(raw, fallback, context)` únicamente en esa frontera visible.

- mensajes técnicos/máquina/backend/HTTP/JSON/token/red se ocultan al estudiante y quedan en consola;
- mensajes humanos seguros pueden conservarse;
- el fallback final estable es `No pudimos cargar tu portal. Intentá de nuevo.`

## Invariantes

No cambia:

- `getPortalEstudianteCompleto`;
- fallback `getEstudiante`;
- `modo:'fallback_frontend'`;
- datos académicos/financieros;
- `deriveStudentAccess`;
- copy de sesión sin código;
- copy de error de conexión;
- botón Reintentar;
- Apps Script;
- Drive ACL;
- producción.

## Límite

Este corte no modifica reglas de acceso ni interpreta el comportamiento fail-open de `student_access.jsx`. Esa autorización depende de evidencia server-side actual y sigue vinculada al snapshot fresco de Issue #111.

**DRAFT · SAFE UI BOUNDARY ONLY · NO PROD**
