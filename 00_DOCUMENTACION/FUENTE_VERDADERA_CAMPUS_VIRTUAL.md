# FUENTE VERDADERA — F98.4-Z6-CS21A53

Estado canónico: frontend CS21A53 guardado en GitHub; backend completo objetivo CS21A46; producción no verificada.

La continuidad detallada está en `README_CONTINUIDAD.md`, `BIBLIA_DELTA_ACTUAL.md`, `SKILL_CAMPUS_VIRTUAL.md`, `PROMPT_CONTINUIDAD.md`, `MANIFIESTO_ACTUAL.json` y `../AppsScript/README.md`.

## Cambio CS21A53 — libros docentes consolidados

- Archivos funcionales: `src/teacher_cs21a_order_fix.jsx` y `campus.html`.
- Apps Script no cambió.
- Se elimina del flujo visible de Libros/Biblioteca el panel de carpeta embebida anterior; un único componente controla ambas vistas.
- Se retiró el `MutationObserver` global del parche anterior para evitar reinstalaciones repetidas.
- El visor principal usa PDF.js y presenta dos páginas enfrentadas como libro abierto.
- Cada PDF se carga una sola vez por sesión y se reutiliza al cambiar de unidad; la botonera no vuelve a descargar el archivo.
- Si el navegador bloquea la lectura directa de Drive, se muestra `/preview` como respaldo para no dejar una pantalla vacía.
- SB, TB y WB mantienen botones visibles y diferenciados.
- Solo SB muestra U01–U16.
- Fuente pedagógica: `APOLLO_G3_LIMPIO_21-04-26`, pestaña `DETALLE DEL PROGRAMA`, columna K `Páginas SB`.
- Inicio SB: `2, 8, 16, 22, 30, 36, 44, 50, 58, 64, 72, 78, 86, 92, 100, 106`.
- Destino PDF con desfase +6: `8, 14, 22, 28, 36, 42, 50, 56, 64, 70, 78, 84, 92, 98, 106, 112`.

## Fuente Drive vigente

Los archivos se leen desde IDs reales de las carpetas docentes oficiales. Básico I ya no usa `Interchange 5th intro-SB ORIGINAL.pdf`; usa el archivo actual `Interchange 5th intro-SB.pdf`, ID `1pnR7RoJGkZnx08TlfrEgxEqVRnlrCwea`, dentro de la carpeta `1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH`.

Totales verificados de Student Book: B1 157 páginas, B2 188, I1 158 e I2 161. No son iguales; lo común es el mapeo de unidades y el desfase +6.

Subir un archivo nuevo a la carpeta crea otro ID y no sustituye automáticamente el archivo canónico. Para actualizar sin modificar GitHub se debe reemplazar el contenido/versionado del mismo archivo conservando su ID. La resolución automática por carpeta queda pendiente hasta disponer del backend CS21A46 completo para modificarlo con seguridad.

Seguimiento inmediato conserva solo desembolsos académicos 01, resumen vertical y tres opciones WA. Nunca mover pagos entre niveles o intentos.
