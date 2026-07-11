# BIBLIA DELTA ACTUAL — F98.4-Z6-CS21A56

## Estado

- Frontend guardado en `main`: CS21A56.
- Backend completo canónico: CS21A56.
- Base backend preservada: CS21A46.
- Producción no verificada.

## Recursos docentes — visor PDF por rangos

Ruta: Docente → Recursos Didácticos → Libros de texto / Biblioteca digital.

- `src/teacher_cs21a_order_fix.jsx` controla ambas vistas.
- `campus.html` carga PDF.js 3.11.174 y fuerza CS21A56.
- Apps Script valida sesión y entrega rangos mediante `teacherBooksOpenPdf` y `teacherBooksReadRange`.
- PDF.js usa `PDFDataRangeTransport`.
- El visor mantiene dos páginas enfrentadas, ancho completo, navegación, zoom y pantalla completa.
- No vuelve a la lista antigua ni al visor embebido anterior.

## Resolución Drive live

- La carpeta oficial B1 es `1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH`.
- El Student Book activo B1 es `Interchange 5th intro-SB.pdf`, ID `1zVPOGcCca5Ti8M8LtCpEO65-bO0m2_oF`.
- CS21A55 podía conservar durante cinco minutos el ID anterior en caché del script y durante la sesión en caché del navegador.
- CS21A56 elimina la caché del ID resuelto en Apps Script.
- El frontend fuerza una resolución nueva al entrar/cambiar nivel o tipo y añade `Actualizar desde Drive`.
- El ID preferente solo recibe prioridad si sigue apareciendo dentro de la carpeta oficial; en caso contrario se usa el PDF válido más reciente.
- Se descartan ORIGINAL, COPIA, COPY, BACKUP, RESPALDO, OLD y ANTIGUO.
- Cambiar unidad reutiliza el documento abierto; no vuelve a descargarlo.

## Páginas Apollo G3

Fuente: `APOLLO_G3_LIMPIO_21-04-26` → `DETALLE DEL PROGRAMA` → columna K `Páginas SB`.

- Inicio SB: `2, 8, 16, 22, 30, 36, 44, 50, 58, 64, 72, 78, 86, 92, 100, 106`.
- Destino PDF +6: `8, 14, 22, 28, 36, 42, 50, 56, 64, 70, 78, 84, 92, 98, 106, 112`.
- U01–U16 aparece únicamente en Student Book.
- B1 U09 abre el pliego PDF 64–65.
- No aplicar esta navegación a TB ni WB.

## Integridad del backend

- CS21A56 modifica únicamente la resolución del archivo y el refresco del visor.
- No escribe pagos, certificados, CONAPE, calendario ni hojas académicas.
- El `Code.gs` completo vigente y su respaldo previo permanecen en Drive.
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
