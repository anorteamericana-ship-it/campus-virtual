# CS21A210BD · Clasificación de superficie de errores post-BC

Base exacta: PR #255 / `c018e5c3f6d0a48605c5de5dce4427604e9e8c21`.

## Medición reproducible

V3 post-BC: **28 findings / 12 archivos**. El reporte crudo está en `RAW_USER_ERROR_SURFACE_POST_BC_CS21A210BD_2026-09-01.md`.

## Clasificación por ownership/ruta

### `src/english_lab_live.jsx` · EFFECTIVE_VISIBLE · 7
`src/app.jsx` carga explícitamente `src/english_lab_live.jsx` en `F96_LAZY.english_lab_live`. Los siete `setError(e.message || String(e))` pertenecen a controles activos de docente/estudiante y `error` se proyecta en `<Alert tone="err">`. Es el siguiente candidato funcional legítimo, sujeto a corte aislado y Source Truth Guard.

### `src/admin_students.jsx` · EFFECTIVE_FILE_REQUIRES_DATAFLOW · 7
`F96_LAZY.admin_students` carga el archivo de forma efectiva. Sin embargo, los siete findings pertenecen a estados diferentes (`setResyncEst`, `setCertEstado`, `setRes`) y no deben corregirse en bloque sin demostrar qué subcomponentes/rutas siguen montados después de la consolidación SEC-002.

### `src/cronograma.jsx` · EFFECTIVE_NOT_RAW_VISIBLE · 1
La ruta `cronograma` es efectiva, pero CS21A210AV ya demostró que el valor crudo almacenado por el hook no se presenta literalmente al usuario en la vista vigente. No parchear solo para bajar V3.

### `src/importador_banco.jsx` · SHADOWED_BY_OVERRIDE · 1
La ruta `banco` carga primero el componente base y después `src/importador_banco_integridad_cs21a114.jsx`; CS21A210AS demostró el reemplazo secuencial efectivo. El finding del componente base no es objetivo runtime mientras ese wiring permanezca congelado.

### `src/examenes_bundle.jsx` + `src/examenes_modes.jsx` · UNMOUNTED_LEGACY_PANEL · 2
Los dos findings restantes corresponden a `TeacherBackendReviewPanel`. CS21A210BB/BC congelan que ese panel existe pero no está montado como JSX. No corregir por métrica.

### `src/english_lab_free_access_cs21a66.js` · STORAGE_SINK_FALSE_POSITIVE_FOR_DIRECT_UI · 1
El scanner clasifica `sessionStorage.setItem(...)` como custom setter. La línea materializa estado en cache; no es por sí misma un setter React/UI. El archivo sí está cargado por `campus.html`, por lo que cualquier uso posterior de `state.message` debe auditarse por data-flow antes de decidir un cambio.

### shortnames `ADMIN_~4.JSX`, `MATRIC~3.JSX`, `PANEL_~1.JSX`, `SOLICI~2.JSX` · NO_PRIMARY_RUNTIME_REFERENCE_PROVEN · 8
No aparecen en los entrypoints primarios revisados por AV/app actual. Esto no prueba que sean borrables y no autoriza modificación/borrado.

### `src/syllabus_views (1).jsx` · NON_PRIMARY_DUPLICATE_NAME · 1
`F96_LAZY.syllabus_views` y `student_course` cargan `src/syllabus_views.jsx`, no `src/syllabus_views (1).jsx`. No tocar el duplicado solo por el scanner.

## Decisión

El siguiente corte funcional razonable es **English LAB Live safe error presentation**, no una limpieza masiva de los 28 findings. `admin_students.jsx` requiere una auditoría de subcomponentes separada antes de cualquier modificación.

E0: cerrado para clasificación. E1: audit/source guard. E2: NO. `BACKEND CURRENT SNAPSHOT UNVERIFIED` vigente.
