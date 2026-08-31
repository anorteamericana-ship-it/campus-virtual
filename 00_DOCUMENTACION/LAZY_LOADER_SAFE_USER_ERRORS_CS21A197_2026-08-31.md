# CS21A197 · Lazy loader · errores seguros para usuario

Fecha: 2026-08-31

## Base
- PR #212 / `fix/admin-master-conape-user-copy-cs21a196`
- base exacta: `2f8b24d0f9385c152c43cd652034aa2faea9f143`

## Hallazgo
`LazyModuleView` podía mostrar directamente:
- nombre/ruta de archivo lazy;
- estado HTTP;
- nombre interno del componente;
- `e.message`/excepción;
- nombre del componente como título fallback.

La superficie es transversal: cualquier rol que abra un módulo diferido puede verla.

## Cambio
Solo `LazyModuleView` cambia su frontera visible:
- copy estable: `No pudimos preparar esta pantalla. Recargá e intentá nuevamente.`;
- fallback de título: `Campus Virtual`;
- detalle técnico de componente faltante/excepción va a `console.warn`.

## Diagnóstico preservado
`loadOne()` mantiene sus errores técnicos y `validateMap()` sigue devolviendo archivo + error crudo para auditoría/QA. El objetivo no es esconder problemas a ingeniería, sino evitar exponer internals al usuario final.

## No cambia
- normalización/importador;
- `loadOne`, `loadMany` y orden de carga;
- Babel transform;
- route enhancer readiness;
- `validateMap()`;
- botón Recargar;
- mapa lazy, rutas, roles;
- Apps Script, Drive ACL, `main` o producción.

## Estado
**GLOBAL UI ERROR BOUNDARY · DIAGNOSTICS PRESERVED · NO PROD · NO AUTO-MERGE**