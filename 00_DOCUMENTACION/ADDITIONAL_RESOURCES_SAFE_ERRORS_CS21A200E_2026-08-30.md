# CS21A200E · Recursos adicionales · errores seguros

Fecha: 2026-08-30
Base: PR #193 · `fix/admin-additional-resources-route-cs21a200d`
Base SHA: `46323b1796efa977bcdb9278bb40ba85c48e3ca8`

## Superficie efectiva
CS21A200D corrige la ruta admin/superadmin para montar `window.AdditionalResourcesPanel`. Estudiante/docente ya acceden al mismo componente mediante el wrapper de `MaterialesView`.

Por tanto `AdditionalResourcesPanel` es una frontera compartida entre los roles que pueden abrir Recursos adicionales.

## Hallazgo
El transporte `post()` puede producir errores técnicos por:
- URL Apps Script ausente;
- JSON inválido;
- HTTP no exitoso;
- `data.mensaje/data.error` del backend;
- timeout/red.

El `catch` convertía `error.message` directamente en `state.error`, que luego se renderiza en `role=alert`.

## Cambio
Se agrega `additionalResourcesSafeUserError(raw,fallback,context)` y se aplica únicamente en esa frontera visible.

- mensaje humano seguro: se conserva;
- detalle técnico: `console.warn` + fallback `No se pudieron cargar los recursos. Intentá de nuevo.`

## Preservado
- `getBibliotecaNivelEstudiante`;
- vista estudiante/docente según rol;
- selector de nivel admin/superadmin;
- cache del catálogo;
- `itemUrl()`;
- `window.open()` de los recursos;
- `window.AdditionalResourcesPanel`;
- routing CS21A200D;
- Apps Script, Drive ACL y producción.

## Límite
Las URLs del catálogo quedan **sin cambios** en este corte. Su política de acceso se clasificará con evidencia de Drive/backend antes de decidir si deben seguir siendo enlaces directos o migrarse a otra entrega.

**NO PROD · NO AUTO-MERGE**
