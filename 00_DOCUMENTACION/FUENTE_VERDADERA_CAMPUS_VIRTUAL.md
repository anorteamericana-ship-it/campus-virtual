# FUENTE VERDADERA — F98.4-Z6-CS21A52

Estado canónico: frontend CS21A52 en GitHub, backend completo objetivo CS21A46, producción no verificada.

La continuidad detallada está en `README_CONTINUIDAD.md`, `BIBLIA_DELTA_ACTUAL.md`, `SKILL_CAMPUS_VIRTUAL.md`, `PROMPT_CONTINUIDAD.md`, `MANIFIESTO_ACTUAL.json` y `../AppsScript/README.md`.

## Cambio CS21A52 — visor docente restaurado

- `src/teacher_cs21a_order_fix.jsx` continúa como componente vigente para Biblioteca digital y Libros de texto.
- SB, TB y WB conservan identidad visual reforzada.
- Student Book conserva U01–U16 y el mapeo Apollo G3 de páginas.
- CS21A51 fue descartado porque usó `drive.google.com/uc?export=view`, endpoint que el navegador trató como descarga y dejó el visor vacío.
- CS21A52 elimina ese endpoint del visor y restaura `drive.google.com/file/d/.../preview` dentro del Campus.
- Los botones de unidad reconstruyen el visor embebido con el destino solicitado, sin iniciar una descarga.
- La fuente pedagógica sigue siendo `APOLLO_G3_LIMPIO_21-04-26`, pestaña `DETALLE DEL PROGRAMA`, columna K `Páginas SB`.
- Inicio SB: U01 2, U02 8, U03 16, U04 22, U05 30, U06 36, U07 44, U08 50, U09 58, U10 64, U11 72, U12 78, U13 86, U14 92, U15 100, U16 106.
- Destino PDF: U01 8, U02 14, U03 22, U04 28, U05 36, U06 42, U07 50, U08 56, U09 64, U10 70, U11 78, U12 84, U13 92, U14 98, U15 106, U16 112.
- La apertura exacta de página depende del visor de Google Drive y debe probarse en el navegador; GitHub guardado no equivale a funcionamiento confirmado en producción.

Seguimiento inmediato conserva solo desembolsos académicos 01, resumen académico vertical y tres opciones WA. Nunca mover pagos entre niveles o intentos.