# CS21A198 · Becas Admin · errores y estados seguros

Fecha: 2026-08-29
Base: PR #171 / `fix/admin-aperturas-safe-errors-cs21a197`
Base exacta: `e105cda7f87f3f64c9add01b6808877f21c68495`

## Hallazgos

`src/becas_admin.jsx` mostraba directamente errores backend/red en crear, cargar, editar, activar/desactivar y cambiar visibilidad.

La capa `data.jsx` actual usa `_solpFetch`: en modo real convierte fallos de red a `{ok:false}` y solo usa el store demo cuando demo/preview está explícitamente forzado. Por tanto no se detectó fallback demo silencioso en modo real.

Las cuatro acciones de escritura no tenían `try/catch/finally` en la UI. Con los helpers actuales los errores de red normales suelen resolverse como `ok:false`; aun así, una excepción inesperada o helper ausente/reemplazado podía dejar `enviando`/`busy` activo. Este corte añade liberación defensiva sin modificar la capa de datos.

## Cambio

- agrega `bkSafeUserError`;
- carga y respuestas `ok:false` muestran copy seguro;
- detalles técnicos quedan en consola;
- crear y editar usan `try/catch/finally` y siempre liberan `enviando`;
- activar/desactivar y visibilidad usan `try/catch/finally` y siempre liberan `busy`.

## No cambia

- `getBecas`, `crearBeca`, `editarBeca`, `cambiarBecaActivo`, `cambiarBecaVisibilidad`;
- `_solpFetch` ni el selector demo explícito;
- porcentajes de descuento;
- cupos/vigencia;
- compatibilidad INA/sin INA;
- visibilidad pública;
- regla de no combinar becas;
- backend, Apps Script, Drive o producción.

## Evidencia

E0 automático:
- guard CS21A198;
- regresión CS21A197;
- regresión CS21A196;
- `git diff --check`.

**DRAFT · ERROR/STATE HARDENING ONLY · DEMO ROUTING UNCHANGED · NO PROD · NO AUTO-MERGE**
