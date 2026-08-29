# CS21A191 · Admin Estudiantes · frontera segura de errores

Fecha: 2026-08-29
Base exacta: PR #162 / `ea4d6d4fc8ecde93e04dc129d1f7c1458188a9bf`

## Hallazgo

`src/admin_students.jsx` concentra varias superficies admin/superadmin y mantenía errores backend/red visibles en:
- carga de grupos;
- radiografía de estudiantes;
- cambio de estatus + reintento CONAPE;
- proyección de siguiente nivel;
- cierre académico;
- sincronización CONAPE por grupo;
- certificados;
- ficha individual y calificaciones;
- simulación/ejecución de cambio de grupo;
- comentario interno;
- historial y documentos de cambios;
- agenda individual.

Los orígenes incluían `data.error`, `r.error`, `d.error`, `e.message`, HTTP/respuesta inválida propagada desde `postAdminStudents` y mensajes de excepción en `alert()`.

## Cambio

Se agrega `adminStudentsSafeUserError(raw, fallback, context)` en la frontera frontend.

El helper:
- conserva mensajes humanos de negocio;
- oculta códigos internos, HTTP, backend/endpoints, Apps Script, tokens, errores de red/excepción y nombres de operaciones internas;
- conserva el detalle técnico en `console.warn` para diagnóstico.

Los endpoints y operaciones existentes no se alteran.

## Límite deliberado

Este corte es de **safe error boundary**. No limpia todavía copy técnico no-error como:
- `hojas 4, 5, 6 y 7`;
- `Backend F24` / `Apps Script F24`;
- `DATOS · COMENTARIO_ADMIN`;
- mensajes de compatibilidad GitHub/Apps Script.

Ese copy se audita por separado para no mezclar semántica funcional con filtrado de errores.

## QA

El guard CS21A191 exige el helper, fallbacks principales, ausencia de patrones crudos demostrados y preservación de endpoints críticos de dashboard, radiografía, cierre, cambio de grupo y CONAPE.

Estado: `SAFE ERRORS ONLY · BUSINESS LOGIC UNCHANGED · NO PROD`.
