# BIBLIA DELTA ACTUAL — F98.4-Z6-CS21A55

## Estado

- Frontend guardado en `main`: CS21A55.
- Backend completo canónico: CS21A55.
- Base backend preservada: CS21A46.
- Producción no verificada.

## Recursos docentes — visor PDF por rangos

Ruta: Docente → Recursos Didácticos → Libros de texto / Biblioteca digital.

- `src/teacher_cs21a_order_fix.jsx` controla ambas vistas.
- `campus.html` carga PDF.js 3.11.174 y fuerza CS21A55.
- El navegador ya no intenta descargar el PDF directamente desde Drive.
- Apps Script valida la sesión y entrega el PDF en bloques mediante:
  - `teacherBooksOpenPdf`
  - `teacherBooksReadRange`
- PDF.js usa `PDFDataRangeTransport`, conserva el documento en memoria y solicita únicamente los bloques necesarios.
- El visor mantiene dos páginas enfrentadas, ancho completo, navegación, zoom y pantalla completa.
- No vuelve a la lista antigua ni al visor embebido anterior.

## Resolución de libros

- El backend busca SB, TB o WB dentro de la carpeta oficial de cada nivel.
- Descarta archivos cuyo nombre indique ORIGINAL, COPIA, COPY, BACKUP, RESPALDO, OLD o ANTIGUO.
- En Básico I selecciona el Student Book nuevo y deja fuera el archivo ORIGINAL.
- La selección es de solo lectura y queda en caché corta.

## Páginas Apollo G3

Fuente: `APOLLO_G3_LIMPIO_21-04-26` → `DETALLE DEL PROGRAMA` → columna K `Páginas SB`.

- Inicio SB: `2, 8, 16, 22, 30, 36, 44, 50, 58, 64, 72, 78, 86, 92, 100, 106`.
- Destino PDF +6: `8, 14, 22, 28, 36, 42, 50, 56, 64, 70, 78, 84, 92, 98, 106, 112`.
- U01–U16 aparece únicamente en Student Book.
- B1 U09 abre el pliego PDF 64–65.
- No aplicar esta navegación a TB ni WB.

## Integridad del backend

- CS21A55 añade solo lectura de archivos de Drive, manejo de rangos y dos rutas nuevas del dispatcher.
- No escribe pagos, certificados, CONAPE, calendario ni hojas académicas.
- El `Code.gs` completo vigente y su respaldo previo permanecen en la carpeta canónica de Drive.
- Guardar el archivo no equivale a instalarlo ni desplegarlo.

## Seguimiento inmediato preservado

- Columnas: `Código | Estudiante | Resumen académico | Movimiento | Periodo / nivel | WhatsApp`.
- Solo desembolso académico `01`.
- `02/03+` no aparecen ni cierran el `01`.
- Resumen vertical desde `6-historial`.
- Sin scroll horizontal.
- WhatsApp ofrece Mensaje, Alerta y Atención.

## Reglas preservadas

- Aplicación por `7-morosidad`: cédula + año + periodo exactos.
- Certificado pagado y documento emitido son estados separados.
- Consulta individual reconstruye datos frescos después de escribir.
- Nunca mover pagos entre niveles o intentos.
