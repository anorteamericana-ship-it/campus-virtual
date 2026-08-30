# CS21A200H · Lazy loader · frontera de errores segura

Fecha: 2026-08-30  
Base: PR #196 · `fix/student-academic-menu-safe-errors-cs21a200g` @ `fffb95ab655c278c2c2aa42c36531eb83ac026d1`

## Hallazgo

`src/lazy_loader.jsx` mantiene diagnósticos técnicos útiles dentro del cargador (`src`, status HTTP, excepción, archivo) y además los copiaba directamente al estado visual de `LazyModuleView`.

Como `LazyModuleView` es la ruta compartida por estudiante, docente y admin, una falla de carga podía mostrar:

- nombre/ruta interna de archivo;
- status HTTP;
- error de Babel/JavaScript/red;
- nombre interno del componente esperado.

## Alcance

Se agrega `lazySafeUserError(raw, fallback, context)` únicamente para `LazyModuleView`.

La vista recibe copy estable y accionable, mientras el detalle técnico queda en `console.warn`.

## Diagnóstico QA preservado

No se modifica `validateMap()` ni el detalle de `loadOne()`.

Esto es intencional: QA debe seguir pudiendo identificar exactamente qué archivo falló y con qué error. El cambio es solo la frontera que ve el usuario final.

## Carga dinámica

La auditoría de `app.jsx` confirmó que el mapa principal `F96_LAZY` contiene rutas estáticas del repositorio y que las rutas académicas del estudiante también pasan listas fijas. Este corte no agrega allowlist ni cambia el API global del loader porque no se demostró una entrada de `src` controlada por usuario que justifique ese cambio.

## Invariantes

No cambia:

- `loadOne` / `loadMany`;
- `validateMap` / `getStatus`;
- `F96_LAZY`;
- fetch/cache;
- transformación Babel;
- evento `an:lazy-module-loaded`;
- espera de enhancers;
- navegación;
- roles;
- Apps Script;
- Drive ACL;
- producción.

**DRAFT · SHARED UI ERROR BOUNDARY ONLY · NO PROD**
