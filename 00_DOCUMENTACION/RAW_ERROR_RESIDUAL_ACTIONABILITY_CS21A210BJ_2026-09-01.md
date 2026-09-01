# CS21A210BJ · Cierre de accionabilidad residual V4

Base exacta: PR #261 / `36f542fda4c7c55df9d07d980f986ecb4b166296`.

## Objetivo
Cerrar la clasificación de los residuos del scanner V4 antes de seguir parchando por conteo. Este corte es auditoría/QA únicamente: 0 rutas funcionales modificadas.

## Snapshot V4 esperado
V4 queda congelado en **22 findings / 11 archivos / 2 custom setters** para esta punta.

Clasificación:
- `src/english_lab_live.jsx` · 7 · `EFFECTIVE_VISIBLE_BUT_SOURCE_TRUTH_BLOCKED`. El arreglo #257 demostró el parche local, pero su PR falló el English LAB Source Truth Guard en esta base porque no existe `scripts/qa_cs21a202_source_truth.mjs`. No se debilita el gate ni se recupera silenciosamente CS21A202/#70.
- `src/admin_students.jsx` · 2 · `ALREADY_SANITIZED_AT_RENDER`. Son los dos setters de certificado preservados deliberadamente por CS21A210BG; el guard BG exige la frontera segura.
- `src/examenes_bundle.jsx` + `src/examenes_modes.jsx` · 1+1 · `UNMOUNTED`. Corresponden a `TeacherBackendReviewPanel`; el guard BB exige que el panel no esté montado.
- `src/cronograma.jsx` · 1 · `EFFECTIVE_NOT_RAW_VISIBLE`. La excepción se guarda internamente, pero el render efectivo colapsa cualquier error a `No se pudo cargar el cronograma.`.
- `src/importador_banco.jsx` · 1 · `SHADOWED_BY_OVERRIDE`. La ruta `banco` carga base y luego CS21A114; el guard AS demuestra instalación secuencial del override seguro antes del render.
- `MATRIC~3.JSX`, `PANEL_~1.JSX`, `SOLICI~2.JSX`, `ADMIN_~4.JSX` · 8 combinados · `NO_PRIMARY_RUNTIME_REF_IN_CHECKED_ENTRYPOINTS`. No autoriza borrado.
- `src/syllabus_views (1).jsx` · 1 · `NO_PRIMARY_RUNTIME_REF_IN_CHECKED_ENTRYPOINTS`; el canonical cargado sigue siendo `src/syllabus_views.jsx`.

El falso positivo `sessionStorage.setItem(...)` de English LAB Gratis ya no aparece en V4. El hallazgo indirecto BH `state.message -> AccessMessage` sigue vigente y separado del inventario directo.

## Dictamen
**No queda un siguiente parche funcional seguro derivable del contador V4.** El único grupo claramente efectivo todavía crudo es English LAB Live y permanece bloqueado por Source Truth. Seguir bajando el contador tocando Admin Students, Exámenes no montado, Cronograma, base BCR o aliases legacy sería una mala corrección.

El siguiente avance de mayor valor debe salir de este scanner y atacar un gate real: E2 autenticado, snapshot Apps Script QA vigente, o una decisión explícita sobre reconciliar CS21A202/#70. Este documento no autoriza ninguna de esas escrituras ni una recuperación de Memory Match.

E0: sí. E1 source/QA: sujeto al guard BJ. E2: NO. `BACKEND CURRENT SNAPSHOT UNVERIFIED` vigente.
