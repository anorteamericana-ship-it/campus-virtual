# F111 · Conciliación de hallazgos P2, fecha CR y continuidad verificable
**Fecha:** 04-nov-2026, America/Costa_Rica. **Documento de control, no acta de aprobación E2.**
**Fuente de decisiones:** [issue F111 #499](https://github.com/anorteamericana-ship-it/campus-virtual/issues/499).
**Referencia histórica sin sobrescribir:** [corte F111 del 03-nov-2026](F111_CORTE_REAL_CONTINUIDAD_20261103.md).

## 1. Alcance exacto de este corte
- Continúa desde las PR #723, #725, #726, #727, #728, #729 y #730 ya integradas a `main`.
- Inspección **real** del artefacto de GitHub Actions `virtual-campus-review-1443`, ID `13315166186`, run `41816170732` (04-nov-2026), archivo `qa-output/static-report.json`. Este corte NO extrapola resultados a todos los módulos.
- Auditoría original: **P0 0, P1 0, P2 10, P3 2** (estática), más navegador sintético; `P2` significa **riesgo/alerta**, no defecto funcional automáticamente demostrado.
- Se distingue **código/CI**, **paridad HTTP**, **navegador sintético E1** y **sesión auténtica E2**. Una no certifica otra.

## 2. Matriz de los diez P2: clasificación sin ocultar riesgos

| ID original | Superficie | Evidencia textual del artefacto | Veredicto técnico | Acción y estado |
|---|---|---|---|---|
| VQA-001 | `solicitudes_unificadas.jsx` | `v=F98.4A` vs `&deep=F111STUDENTDEEPTABS20261104A` | **Caché por rol/ruta ya revisada** | Normalizar **solo** con URLs y rutas exactas en auditor estático; no altera endpoint. |
| VQA-002 | `student_modules.jsx` | Base vs `&deep` en evaluaciones/documentos estudiantiles | **Caché por rol/ruta ya revisada** | Mismo guard exacto; cualquier otra versión queda P2. |
| VQA-003 | `syllabus_views.jsx` | Base vs `&deep` en curso/documentos estudiantiles | **Caché por rol/ruta ya revisada** | Mismo guard exacto; cero traducciones de documentos fuente. |
| VQA-004 | `cronograma_todos.jsx` | `v=F98.4Z6CM` vs `v=F98.4Z6CK` | **Sin certificar** si la variante CK es necesaria | Mantener P2. Conciliar manifiesto con comportamiento y carga móvil real; no unificar a ciegas. |
| VQA-005 | `cronograma_grupo.jsx` | Base vs `&calendar=F111STUDENTCALEN20261104A` | **Caché estudiantil aprobada** | Guard estricto: solo ruta `student_course` usa variante EN/ES; no afecta instructor/admin. |
| VQA-006 | `getICANPortalEstudiante` | Ausente de `BACKEND_OBSERVADO_CS21A131.json` | **Observación antigua, no despliegue actual** | Mantener P2 hasta readback de backend desplegado; módulo independiente I CAN permanece oculto, asistencia visible. |
| VQA-007 | `getICANDocenteReservas` | Ausente del mismo inventario de julio | **Observación antigua, no despliegue actual** | Mantener P2; verificar permisos y endpoint real antes de activar inscripciones. |
| VQA-008 | Fechas con `toISOString().slice(0,10)` | 12 archivos (incluidos `student_dashboard.jsx` y `cronograma_grupo.jsx`) | **Bug real confirmado en “hoy” estudiantil**; hay otros usos por auditar | Sustituir **solo** las 2 lecturas “hoy” del expediente y 2 del cronograma por día civil de Costa Rica; mantener P2 global por otros archivos. |
| VQA-009 | `window.fetch` | 5 archivos con interceptores/wrappers | **Riesgo de orden/cadena, no prueba de fallo** | Mantener P2; mapear composición y orden sin apagar protecciones. |
| VQA-010 | `MaterialesView` | 12 módulos con asignación/reemplazo de vista | **Riesgo de extensiones superpuestas, no prueba de fallo** | Mantener P2; revisión aislada de precedencia antes de quitar wrappers. |

**Criterio de reconciliación:** los cuatro pares de versiones aprobados (001/002/003/005) se eliminan del contador P2 **únicamente** al verificarse la ruta y ambas URLs exactas; se registran en `reviewed_scoped_cache`, con evidencia. P2 de auditoría estática esperados tras el cambio: **6/10 históricos aún abiertos (60%)**. **4/10 históricos conciliados (40%)** significa reducción de ruido de QA, **no** 40% del Campus corregido.

**Atención:** `BACKEND_OBSERVADO_CS21A131.json` contiene `observed_at: 2026-07-18` y `deployment_confirmed:false`. No afirmar que endpoints faltan HOY por ese documento; requiere readback privado/legítimo, sin exponer datos.

## 3. Corrección focal de fecha y límites

**Causa:** `new Date().toISOString().slice(0,10)` usa día UTC; a las 19:15 de Costa Rica el día UTC ya es el siguiente. Puede desplazar la selección de próxima lección y etiquetas de asistencia. `isoOf(new Date())` arrastraba el mismo error en dos comparaciones de la vista de cronograma.

**Implementación de presentación:** `fechaHoyAcademiaF111(now)` en `src/student_dashboard.jsx` y `hoyCostaRicaCG(now)` en `src/cronograma_grupo.jsx` usan `Intl.DateTimeFormat(..., {timeZone:'America/Costa_Rica'}).formatToParts`. Se cambian exactamente 2 comparaciones en cada componente, sin tocar fechas guardadas ni `isoOf(dd)` de cuadrículas, registros de clase, asistencias, notas o pagos.

**Prueba E1:** `scripts/qa_f111_cr_day_and_scoped_cache_e1.mjs` verifica las dos funciones con cinco instantes UTC alrededor de 18:00 CR, medianoche y Año Nuevo; 10 afirmaciones de fecha, cuatro variantes de caché autorizadas y rechazo explícito de una variante incorrecta. La prueba forma parte de `F111 i18n Preview Safe E1`.

**Propagación:** la versión `&crday=F111CRDAY20261104A` actualiza únicamente los cuatro recursos lazy afectados (dashboard + tres referencias al cronograma) y el cargador `app.jsx` desde `campus.html`. D1 normaliza el mismo token en lectura de trabajo y baseline de `main`, conservando el comparador byte a byte.

**Límite restante:** otros usos de UTC y funciones de `diasEntre` en componentes heredados necesitan auditoría aparte. Esta entrega no convierte todas las fechas del Campus ni certifica dispositivos fuera de Costa Rica.

## 4. Cuadro de avance con denominadores explícitos

| Métrica | Base | Resultado | Interpretación |
|---|---:|---:|---|
| Hallazgos estáticos P2 revisados contra evidencia | 10/10 | 100% de clasificación | No significa que los diez estén arreglados. |
| Pares de versiones aprobados y controlados por ruta | 4/4 | 100% de las cuatro excepciones conocidas | Cambios no autorizados siguen señalados. |
| P2 estáticos históricos que requieren seguimiento | 6/10 | 60% abiertos | P2 004 y 006–010; no se rebajan sin evidencia. |
| Comparaciones “hoy” corregidas por día civil CR | 4/4 | 100% del alcance acotado | Dos dashboard + dos cronograma; no todos los cálculos de fecha. |
| Matriz académica F111 | 16/35 | **45,7% histórico** | 19 hitos permanecen pendientes; no sumar estas PR como hitos académicos. |
| Certificación bilingüe completa E2 | 0/23 rutas | **0% certificado** | EN/ES E1 y HTTP PASS no equivalen a sesión real autenticada. |
| Entrega HTTP precedente (#727–#730) | 17/17 | 100% en último readback anterior | Exige nuevo readback postmerge para este cambio de fecha. |

## 5. Orden de continuidad para no repetir trabajo
1. Validar CI, guard D1, nueva prueba de frontera y `Virtual Campus Review`; documentar resultado final de PR/código SHA.
2. Tras merge, esperar Pages y comprobar origen de nuevo, **17/17**, sin reinterpretar un fallo transitorio de propagación.
3. Ejecutar E2 auténtica controlada (rol estudiante EN/ES, escritorio/móvil) en cronograma 4 vistas, asistencia I CAN visible, comentarios por lección; mantener el módulo independiente no funcional fuera del menú.
4. Conciliar `cronograma_todos` CM/CK y verificar versión backend I CAN antes de tocar operaciones o habilitar reservas.
5. Inventariar los 11+ usos UTC restantes y documentar diferencias de `fetch`/Materiales sin desactivar wrappers.
6. Mantener evidencia mínima: commit, URL de PR, flujo de CI, artefacto, HTTP, pruebas E2 con identidad anonimizada, riesgo y próxima decisión.

## 6. Registro de cambios
- **Código fuente de este corte:** `src/student_dashboard.jsx`, `src/cronograma_grupo.jsx`, `src/app.jsx`, `campus.html`.
- **Pruebas/guardas:** `scripts/virtual_review_static.mjs`, `scripts/qa_f111_cr_day_and_scoped_cache_e1.mjs`, `scripts/qa_f111_0826_student_canonical.mjs`, `scripts/qa_f111_superadmin_single_center_20261017.mjs`, workflow E1.
- **Documentación:** este anexo y issue #499.
- **No tocado:** Apps Script, pagos, notas, asistencia real, matrículas, PDFs, comentarios docentes, grupos INA/SIN INA, roles, ACL, bases de datos.
- **PR de este corte:** [#731](https://github.com/anorteamericana-ship-it/campus-virtual/pull/731), branch `fix/f111-cr-date-boundaries-and-static-triage-20261104`, primer HEAD `80bb3712d7243fed53e45c253b38b77ba7744bac`.
- **Estado de ESTE corte a su apertura:** CI, merge y readback **pendientes**. Los resultados anteriores 17/17 pertenecen a otras PR y no certifican esta versión. La fuente de verdad del cierre será la actualización de issue #499 con run/commit verificables.
