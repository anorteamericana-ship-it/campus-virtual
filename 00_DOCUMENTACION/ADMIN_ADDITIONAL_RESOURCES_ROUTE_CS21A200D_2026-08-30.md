# CS21A200D · Admin · ruta efectiva de Recursos adicionales

Fecha: 2026-08-30
Base: PR #192 · `fix/cronograma-safe-errors-cs21a200c`
Base SHA: `1f15cf76188a838269bd136d5284d0b7d92f4d6d`

## Hallazgo
`additional_resources_panel_cs21a68.jsx` inyecta el botón `Recursos adicionales` junto a `Libros y Audios` para cualquier sidebar con rol válido, incluidos admin/superadmin. Al pulsarlo:

1. guarda `an_resources_panel_mode_cs21a68 = additional`;
2. emite `an:resources-panel-mode`;
3. hace click en la ruta base de libros.

Sin embargo la ruta final admin CS21A75 (`admin_resources_direct_cs21a74.js`) solo resolvía `window.__AN_BOOK_RESOURCES_COMPONENT__` y no leía ese modo. Por tanto un admin/superadmin podía activar `Recursos adicionales` pero terminar viendo el visor de Libros y Audios.

## Corrección
La ruta directa admin ahora:
- lee `an_resources_panel_mode_cs21a68`;
- escucha `an:resources-panel-mode`;
- resuelve `window.AdditionalResourcesPanel` cuando el modo es `additional`;
- mantiene `window.__AN_BOOK_RESOURCES_COMPONENT__` cuando el modo es `books`;
- espera mediante el mismo mecanismo de readiness si el componente adicional aún no terminó de cargar;
- presenta texto de carga específico según el modo.

## Preservado
- `AdditionalResourcesPanel` original de estudiante/docente;
- navegación base y botón Libros y Audios;
- visor `BookResourcesCS21A60`;
- `initialType: SB` y `adminMode: true` del visor de libros;
- roles, niveles, catálogo y enlaces de recursos;
- Apps Script, Drive ACL y producción.

## Límite
Este corte corrige **routing/rendering**. No modifica todavía la frontera de error de `AdditionalResourcesPanel` ni clasifica la política ACL de sus URLs de catálogo.

**NO PROD · NO AUTO-MERGE**
