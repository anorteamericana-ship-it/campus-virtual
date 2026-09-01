# CS21A210AV · auditoría de rutas efectivas para errores crudos

Fecha local: 2026-08-31

## Base
- PR base: #248 · CS21A210AT.
- base exacta: `c9f3047a66e05b6cea60dda5017917979b3f586f`.
- V3 reproducible en base: `57 findings / 13 archivos`.
- Este corte es auditoría E0/E1; no modifica código funcional.

## Objetivo
Evitar corregir findings del scanner solo para bajar el contador. Cada candidato pequeño se clasifica por ruta/ownership antes de tocar source.

## Resultado
### 1. `src/inscripcion.jsx` · EFFECTIVE_VISIBLE · 5 findings
`inscripcion.html` carga directamente `src/inscripcion.jsx`. Los estados crudos alcanzan UI visible:
- error de lectura de documento (`err`);
- verificación de cédula (`err`);
- carga de grupos (`groupsError`);
- carga global (`globalError`);
- envío de inscripción (`submitError`).

Es el siguiente objetivo atómico recomendado.

### 2. `src/cronograma.jsx` · EFFECTIVE_NOT_RAW_VISIBLE · 1 finding
La ruta `cronograma` sí es efectiva, pero el `e.message` se guarda en estado y la vista final no imprime ese texto: cualquier error distinto de `sin_sesion` muestra únicamente `No se pudo cargar el cronograma.`. No se justifica un patch solo para satisfacer el scanner sin otra evidencia.

### 3. `src/importador_banco.jsx` · SHADOWED_BY_OVERRIDE · 1 finding
La ruta `banco` carga primero el importador base y después `src/importador_banco_integridad_cs21a114.jsx`; CS21A114 reemplaza `window.ImportadorBancario` antes del render. El finding del componente base no se toma como fuga efectiva sin evidencia contraria.

### 4. aliases shortname históricos · NO_PRIMARY_RUNTIME_REF
En `campus.html`, `src/app.jsx` e `inscripcion.html` no hay referencias primarias a:
- `MATRIC~3.JSX`
- `PANEL_~1.JSX`
- `SOLICI~2.JSX`
- `ADMIN_~4.JSX`

Esto no autoriza borrarlos. Solo evita tratarlos como superficie efectiva sin resolver referencias adicionales.

## Guard
`audit_effective_raw_error_routes_cs21a210av.mjs` congela:
- scanner V3 exacto y conteo base 57/13;
- carga efectiva de inscripción pública;
- presencia de los 5 sinks de inscripción y sus consumidores visibles;
- colapso genérico de cronograma;
- wiring BCR con override CS21A114;
- ausencia de referencias primarias a los cuatro aliases históricos.

El workflow AV vuelve a correr además los guards AT y AS.

## Dictamen
La siguiente corrección funcional debe ser una frontera de error para `src/inscripcion.jsx`, no un patch de `cronograma.jsx`, `importador_banco.jsx` ni aliases históricos por contador.

E0: sí. E1: pendiente de Actions del corte. E2: no.
`BACKEND CURRENT SNAPSHOT UNVERIFIED` sigue vigente.
No main, no PROD, no Apps Script, no Drive ACL, no merge, no borrados.
