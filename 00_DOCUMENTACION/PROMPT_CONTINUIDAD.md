# PROMPT DE CONTINUIDAD — F98.4-Z6-CS21A52

Usar como base de un nuevo chat el estado descrito en:

- `FUENTE_VERDADERA_CAMPUS_VIRTUAL.md`
- `README_CONTINUIDAD.md`
- `BIBLIA_DELTA_ACTUAL.md`
- `SKILL_CAMPUS_VIRTUAL.md`
- `MANIFIESTO_ACTUAL.json`
- `../AppsScript/README.md`

Estado: frontend CS21A52 en GitHub; backend completo objetivo CS21A46; producción no verificada.

## Cambio inmediato vigente

Docente → Recursos Didácticos → Libros de texto:

- SB, TB y WB visibles y diferenciados.
- SB incorpora U01–U16.
- Fuente de páginas: `APOLLO_G3_LIMPIO_21-04-26`, pestaña `DETALLE DEL PROGRAMA`, columna K `Páginas SB`.
- Se toma la primera página de cada unidad y se suman 6 páginas para el PDF.
- Inicio SB: `2, 8, 16, 22, 30, 36, 44, 50, 58, 64, 72, 78, 86, 92, 100, 106`.
- Destinos PDF: `8, 14, 22, 28, 36, 42, 50, 56, 64, 70, 78, 84, 92, 98, 106, 112`.
- CS21A51 se descartó porque el origen del `iframe` descargaba el libro y dejaba el visor vacío.
- CS21A52 restaura Google Drive `/preview`; cambiar de unidad no debe descargar el PDF.
- Prueba crítica: Básico I → SB → U09 solicita SB 58 / PDF 64.
- La apertura exacta de página requiere prueba real en navegador.
- No aplicar el mapeo de SB a TB o WB.
- Archivos funcionales: `src/teacher_cs21a_order_fix.jsx` y `campus.html`.
- Apps Script no cambió.

Continuidad preservada: solo desembolso académico 01, resumen académico vertical desde 6-historial, tabla sin scroll y WhatsApp con Mensaje, Alerta y Atención. No mover pagos entre niveles o intentos.