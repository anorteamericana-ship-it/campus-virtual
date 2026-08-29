# CS21A185 · Materiales docentes · frontera de acceso y errores seguros

Fecha: 2026-08-29
Base exacta: PR #156 / `7bb7bd37372657ba2c725f891cc039bf2994df7e`

## Hallazgo

`campus.html` carga `teacher_cs21a.jsx` y `teacher_cs21a_docs_viewer.jsx` para el Campus. El viewer especializado solo reemplaza `MaterialesView` para `u.rol === 'teacher'`; para otros roles conserva la vista base.

Sin embargo, los IDs y URLs de Drive de planeamientos/materiales docentes están embebidos en JavaScript estático y se abren/descargan directamente desde Drive.

## Evidencia Drive completa de raíces docentes

Se verificó metadata, en modo lectura, de las **12/12 carpetas raíz** que `teacher_cs21a.jsx` asigna a los cuatro niveles:

- B1: Plan de Estudio, Planeamiento por lección, Material del curso;
- B2: Plan de Estudio, Planeamiento por lección, Material del curso;
- I1: Plan de Estudio, Planeamiento por lección, Material del curso;
- I2: Plan de Estudio, Planeamiento por lección, Material del curso.

Resultado: **12/12** contienen permiso `type=anyone`, `role=reader`, `allowFileDiscovery=false`.

También se verificó un PDF real de lección dentro del árbol: presenta el mismo `anyone/reader`.

Por lo tanto ya no se trata de una muestra parcial: el patrón público-por-enlace cubre la totalidad de las raíces docentes que el frontend referencia para plan, planeamiento y material del curso.

No se registran aquí correos ni identidades individuales de las ACL; no son necesarios para demostrar el riesgo.

## Interpretación

La restricción actual es de interfaz, no del recurso: quien obtenga uno de esos enlaces puede leer el material aunque no tenga una sesión docente.

`allowFileDiscovery=false` evita descubrimiento/listado público, pero **no convierte el enlace en acceso autenticado**.

## Clasificación

- SEC-005 · control de acceso de materiales institucionales docentes.
- P1 acceso/control por enlace.
- No es SEC-002 PII: no se está clasificando el planeamiento como documento personal.

### Fuera de este P1

Los recursos institucionales generales (por ejemplo reglamentos, bienvenida o guías de Zoom/contingencias) deben clasificarse por su audiencia propia. No se consideran automáticamente privados solo porque también aparezcan en el menú docente.

## Por qué no se retira `anyone` aquí

El frontend actual depende de esos enlaces directos. Quitar ACL antes de disponer de retrieval autenticado rompería el flujo docente.

Orden obligatorio:
1. snapshot modular QA fresco (Issue #111);
2. localizar router/backend efectivo;
3. manifest/retrieval autenticado para teacher/admin/superadmin;
4. E2 docente permitido y rol ajeno denegado;
5. retirar `anyone` únicamente en QA;
6. repetir E2;
7. recién entonces considerar release.

## Cambio funcional permitido ahora

`teacher_cs21a.jsx` todavía convertía errores backend/red en texto visible dentro del resumen de asistencia. CS21A185 agrega un helper de error seguro y reemplaza únicamente esa exposición. No modifica endpoints, payloads, permisos, grupos, notas, asistencia ni writes.

## Límite

Este corte **no declara privados los materiales** y no toca ACL de Drive.

Estado esperado: `P1 12/12 RAÍCES DOCUMENTADO · SAFE COPY NOW · PRIVATE/ROLE-BOUND DELIVERY PENDING · NO PROD`.
