# CS21A200B · Recursos Didácticos · errores seguros

Fecha: 2026-08-30
Base: PR #190 · `integration/admin-security-consolidated-cs21a200a`
Base SHA: `9816d91a4457a66d348849edeb9ff9304a817a3d`

## Superficie efectiva
`campus.html` carga varias capas históricas de Recursos Didácticos. La ruta final admin/superadmin queda determinada por:

- `src/book_unit_starts_cs21a60.jsx`, que publica `window.__AN_BOOK_RESOURCES_COMPONENT__ = BookResourcesCS21A60`;
- `src/admin_resources_direct_cs21a74.js`, que monta ese componente directamente cuando la ruta de recursos está abierta.

Por tanto CS21A200B corrige el componente efectivo y no modifica capas heredadas CS21A59/61 que quedan por debajo del wrapper final.

## Hallazgo
`BookResourcesCS21A60` convertía `reason.message` directamente en UI en tres rutas:

1. carga del libro (`teacherBooksOpenImageBook`);
2. guardado de inicio de unidad (`superadminBooksSetUnitStart`);
3. actualización del libro (`adminBooksRefreshOpenBook`).

El transporte puede producir detalle técnico de Apps Script, HTTP, JSON, token, endpoint, red o excepciones.

## Cambio
Se agrega `bookResourcesSafeUserError(raw, fallback, context)` y se aplica únicamente antes de escribir el error visible.

Los mensajes humanos de negocio se conservan cuando son seguros. El detalle técnico queda en `console.warn` y la UI recibe un fallback operativo específico.

## Preservado
- `teacherBooksOpenImageBook`;
- `superadminBooksSetUnitStart`;
- `adminBooksRefreshOpenBook`;
- superadmin como único rol que calibra inicios;
- admin/superadmin como roles que actualizan el libro;
- datos, páginas, unit starts, Drive IDs, libros, audios y navegación;
- Apps Script, Drive ACL y producción.

## Límite
Este corte no altera la política de acceso de los archivos Drive ni resuelve los P1 SEC-002 documentales. Es una frontera de error UI del visor efectivo.

**NO PROD · NO AUTO-MERGE**
