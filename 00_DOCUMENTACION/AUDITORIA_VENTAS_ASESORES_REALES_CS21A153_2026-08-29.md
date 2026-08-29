# CS21A153 · Ventas usa asesores reales desde USUARIOS

Fecha: 2026-08-29 · Costa Rica

## Base congelada

- Repositorio: `anorteamericana-ship-it/campus-virtual`
- `main`: `53df524d0a9eab867d3b307b3e633f366af92a63`
- Rama: `feature/ventas-asesores-reales-cs21a153`
- Alcance: frontend Ventas solamente. Sin Apps Script, datos, pagos, ACL ni PROD.

## Evidencia backend

El `Code.gs` canónico observado en Drive ya contiene `getAsesoresActivos()` desde v4.28.0.

Contrato observado:

- fuente: hoja `USUARIOS`;
- filtro: `rol === ventas` y `activo === TRUE`;
- salida por asesor: `nombre`, `telefono`, `wa_link`, `cedula`;
- disponible por GET y POST;
- ya utilizado por el flujo público de inscripción.

No se crea endpoint nuevo en este corte.

## Problema encontrado

`src/ventas_data.jsx` exporta `ASESORES_V` con nombres demo y `src/ventas_dashboard.jsx` lo usaba directamente en el selector `Ver como asesor` de admin/superadmin.

Además, mientras no existía selección, `scopeAsesor` caía al nombre del usuario administrativo. Eso mezcla identidad administrativa con scope comercial y puede pedir el dashboard de un asesor inexistente.

## Cambio CS21A153

`src/ventas_dashboard.jsx` ahora:

1. consulta `getAsesoresActivos` cuando el rol es admin/superadmin;
2. usa únicamente nombres devueltos por backend en operación real;
3. selecciona el primer asesor activo válido al completar la carga;
4. no llama `getDashboardVentas` para supervisor hasta resolver un asesor real;
5. muestra un estado neutral si la lista no puede cargarse y conserva el detalle técnico solo en consola;
6. permite `ASESORES_V` únicamente dentro de `?preview=` explícito.

## Deliberadamente fuera de alcance

- PR #113 sigue siendo dueño de:
  - token automático en `postVentas()`;
  - `scopeAsesor` para `MiMatriculasMes`;
  - `scopeAsesor` para `ProspectoDrawer`.
- PR #123 sigue siendo dueño de limpieza UX Prospectos/Ventas.
- PR #124 sigue siendo dueño de aislamiento DEMO/QA operativo.
- No se elimina todavía `ASESORES_V` ni los datasets DEMO porque `?preview=` sigue siendo una superficie explícita de diseño.

## QA source

Guard: `scripts/qa_ventas_asesores_reales_cs21a153.mjs`

Debe comprobar:

- presencia de `getAsesoresActivos`;
- fuente React `asesoresReales`;
- `ASESORES_V` con una sola referencia y solo condicionada por `previewKey`;
- ausencia del selector directo `window.ASESORES_V.map(...)`;
- ausencia del fallback legacy `asesorView || usuario.nombre` para supervisor real;
- espera explícita antes de cargar dashboard sin scope real.

## Evidencia pendiente

- E2 autenticada con admin/superadmin: lista debe coincidir con usuarios ventas activos;
- cambiar entre dos asesores y confirmar que el dashboard se recarga con cada scope;
- comprobar asesor desactivado: no debe aparecer;
- validar estado cuando endpoint falla: ningún nombre demo debe mostrarse;
- cerrar junto con #113 para que dashboard, matrículas y drawer compartan el mismo scope.

## Estado

**SOURCE FIXED · QA SOURCE · NO PROD · E2/E3 PENDING**
