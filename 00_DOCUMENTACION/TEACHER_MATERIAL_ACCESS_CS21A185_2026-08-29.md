# CS21A185 · Materiales docentes · frontera de acceso y errores seguros

Fecha: 2026-08-29
Base exacta: PR #156 / `7bb7bd37372657ba2c725f891cc039bf2994df7e`

## Hallazgo

`campus.html` carga `teacher_cs21a.jsx` y `teacher_cs21a_docs_viewer.jsx` para el Campus. El viewer especializado solo reemplaza `MaterialesView` para `u.rol === 'teacher'`; para otros roles conserva la vista base.

Sin embargo, los IDs y URLs de Drive de planeamientos/materiales docentes están embebidos en JavaScript estático y se abren/descargan directamente desde Drive.

Se verificó metadata Drive de tres muestras independientes:
- PDF real de una lección;
- carpeta de planeamientos B1;
- carpeta de planeamientos B2.

Las tres muestran permiso `type=anyone`, `role=reader`, `allowFileDiscovery=false`.

Por lo tanto la restricción actual es de interfaz, no del recurso: quien obtenga el enlace puede leer el material aunque no sea docente.

## Clasificación

- SEC-005 · control de acceso de materiales institucionales docentes.
- P1 acceso/control por enlace.
- No es SEC-002 PII: no se está clasificando el planeamiento como documento personal.

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

Estado esperado: `P1 DOCUMENTADO · SAFE COPY NOW · PRIVATE/ROLE-BOUND DELIVERY PENDING · NO PROD`.
