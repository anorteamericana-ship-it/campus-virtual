# PROMPT DE CONTINUIDAD — F98.4-Z6-CS21A53

Usar como base de un nuevo chat:

- `FUENTE_VERDADERA_CAMPUS_VIRTUAL.md`
- `README_CONTINUIDAD.md`
- `BIBLIA_DELTA_ACTUAL.md`
- `SKILL_CAMPUS_VIRTUAL.md`
- `MANIFIESTO_ACTUAL.json`
- `../AppsScript/README.md`

Estado: frontend CS21A53 en GitHub; backend completo objetivo CS21A46; producción no verificada.

## Cambio inmediato vigente

Docente → Recursos Didácticos → Libros de texto / Biblioteca digital:

- Un solo componente controla ambas vistas y evita renderizar el panel antiguo de carpeta Drive.
- PDF.js presenta dos páginas enfrentadas como libro abierto.
- Cada PDF se carga una vez y se reutiliza al cambiar de unidad.
- Drive `/preview` queda como respaldo si el navegador bloquea la lectura directa.
- SB, TB y WB están diferenciados visualmente.
- U01–U16 solo aparece en SB.
- Fuente pedagógica: `APOLLO_G3_LIMPIO_21-04-26`, `DETALLE DEL PROGRAMA`, columna K.
- Inicio SB: `2, 8, 16, 22, 30, 36, 44, 50, 58, 64, 72, 78, 86, 92, 100, 106`.
- Destino PDF +6: `8, 14, 22, 28, 36, 42, 50, 56, 64, 70, 78, 84, 92, 98, 106, 112`.
- B1 U09 debe mostrar el pliego 64–65.
- B1 SB vigente: `Interchange 5th intro-SB.pdf`, ID `1pnR7RoJGkZnx08TlfrEgxEqVRnlrCwea`.
- No usar el archivo B1 `ORIGINAL`, ID `13rMmy1ZLpto6SgjSyVyBd3MtivuU19j3`.
- Totales SB reales: B1 157, B2 188, I1 158, I2 161.
- Subir un PDF separado genera otro ID; para actualizar sin código debe preservarse el ID del archivo canónico.
- Resolución automática por carpeta queda pendiente hasta disponer del Code.gs completo CS21A46.
- Archivos funcionales: `src/teacher_cs21a_order_fix.jsx` y `campus.html`.
- Apps Script no cambió.

Continuidad preservada: solo desembolso académico 01, resumen académico vertical desde 6-historial, tabla sin scroll y WhatsApp con Mensaje, Alerta y Atención. Nunca mover pagos entre niveles o intentos.
