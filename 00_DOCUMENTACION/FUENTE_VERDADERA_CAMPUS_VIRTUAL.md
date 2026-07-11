# FUENTE VERDADERA — F98.4-Z6-CS21A55

Estado canónico: frontend CS21A55 guardado en GitHub; backend completo CS21A55 respaldado en la carpeta canónica de Drive; producción no verificada.

## Componentes vigentes

- `src/teacher_cs21a_order_fix.jsx`
- `campus.html`
- `Code.gs` completo

## Cambio CS21A55

- Apps Script entrega los libros por rangos autorizados para evitar el bloqueo CORS de Google Drive.
- Endpoints: `teacherBooksOpenPdf` y `teacherBooksReadRange`.
- PDF.js mantiene dos páginas enfrentadas, ancho completo, zoom, navegación y pantalla completa.
- El backend selecciona SB, TB y WB dentro de las carpetas oficiales y excluye copias antiguas y respaldos.
- U01–U16 aparece únicamente en Student Book.
- U09 dirige a PDF 64–65, equivalente a SB 58 con el desfase +6.
- Biblioteca digital y Teacher Book no usan el mapeo de páginas SB.
- Es un cambio de solo lectura: no modifica pagos, certificados, CONAPE, calendario ni hojas académicas.

## Integridad

La identidad completa del backend, su tamaño, hash y ubicación están registrados en `AppsScript/README.md` y `MANIFIESTO_ACTUAL.json`.

## Reglas preservadas

- Solo desembolso académico `01` en Seguimiento inmediato.
- `02/03+` no cierran el `01`.
- Resumen vertical desde `6-historial`.
- Nunca mover pagos entre niveles o intentos.
- Guardado no significa desplegado.
