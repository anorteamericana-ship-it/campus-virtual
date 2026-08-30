# CS21A197 · Lazy loader · errores seguros

Fecha: 2026-08-29

## Hallazgo

`src/lazy_loader.jsx` es una frontera transversal: carga módulos diferidos para estudiante, docente y administración.

La lógica interna genera diagnósticos útiles como:

- ruta del archivo que no cargó;
- status HTTP;
- nombre interno del componente;
- `e.message`.

El problema era que `LazyModuleView` convertía esos detalles directamente en `state.error` y los mostraba al usuario.

## Cambio

Se agrega `reportLazyFailure(error, context)` para conservar diagnóstico en consola.

La interfaz usa un único mensaje estable:

> No pudimos preparar esta pantalla. Recargá e intentá nuevamente.

Se aplica tanto cuando:

1. los archivos cargan pero el componente esperado no se publica;
2. la carga/transformación/espera lanza una excepción.

## Diagnóstico preservado

No se cambia:

- `loadOne()` ni su error con ruta/status;
- `validateMap()` ni su colección de errores detallados para QA;
- mapa `F96_LAZY_MAP`;
- archivos cargados;
- orden de carga;
- Babel transform;
- tiempos de espera;
- componentes/rutas.

## No cambia

Navegación, roles, backend, Apps Script, Drive ni producción.
