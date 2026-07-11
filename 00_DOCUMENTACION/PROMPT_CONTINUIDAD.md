# PROMPT DE CONTINUIDAD — F98.4-Z6-CS21A55

Usar como base de un nuevo chat:

- `FUENTE_VERDADERA_CAMPUS_VIRTUAL.md`
- `README_CONTINUIDAD.md`
- `BIBLIA_DELTA_ACTUAL.md`
- `SKILL_CAMPUS_VIRTUAL.md`
- `MANIFIESTO_ACTUAL.json`
- `../AppsScript/README.md`

Estado: frontend CS21A55 en GitHub; backend completo CS21A55 en el archivo canónico de Drive; producción no verificada.

## Cambio inmediato vigente

Docente → Recursos Didácticos → Libros de texto / Biblioteca digital:

- El navegador no descarga ni intenta leer directamente los PDF desde Drive.
- Apps Script entrega los archivos por rangos autorizados mediante `teacherBooksOpenPdf` y `teacherBooksReadRange`.
- PDF.js usa `PDFDataRangeTransport` y solicita únicamente los bloques requeridos.
- El visor presenta dos páginas, ancho completo, navegación, zoom y pantalla completa.
- La selección SB/TB/WB se resuelve dentro de las carpetas oficiales y excluye copias antiguas y respaldos.
- U01–U16 aparece solo en Libros de texto + Student Book.
- Inicio SB: `2, 8, 16, 22, 30, 36, 44, 50, 58, 64, 72, 78, 86, 92, 100, 106`.
- Destino PDF +6: `8, 14, 22, 28, 36, 42, 50, 56, 64, 70, 78, 84, 92, 98, 106, 112`.
- B1 U09 debe mostrar PDF 64–65.
- Biblioteca digital/TB no muestra la botonera SB.
- No existe retorno a la lista anterior ni al visor `/preview`.

## Backend

- Partir siempre del `Code.gs` canónico registrado en `AppsScript/README.md`.
- CS21A55 preserva íntegramente CS21A46 y añade únicamente el proxy de lectura PDF y dos rutas.
- Crear respaldo antes de cada edición.
- Entregar siempre un único `Code.gs` completo.
- No modificar pagos, certificados, CONAPE, calendario ni hojas académicas para este módulo.

## Prueba inmediata

1. Copiar el `Code.gs` completo CS21A55 en Apps Script.
2. Guardar y crear una implementación nueva.
3. Hacer Ctrl+F5 en el Campus.
4. Abrir Libros de texto → B1 → SB → U09.
5. Confirmar PDF 64–65 sin descarga ni `Failed to fetch`.

Continuidad preservada: solo desembolso académico 01, resumen vertical desde 6-historial, tabla sin scroll y WhatsApp con Mensaje, Alerta y Atención. Nunca mover pagos entre niveles o intentos.
