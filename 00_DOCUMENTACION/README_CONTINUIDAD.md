# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral/frontend:** F98.4-Z6-CS21A55  
**Backend completo:** F98.4-Z6-CS21A55  
**Producción:** no verificada  
**Corte:** 11-jul-2026

## Cambio vigente CS21A55

Ruta: Docente → Recursos Didácticos → Libros de texto / Biblioteca digital.

- El visor deja de solicitar los PDF directamente a Google Drive desde el navegador.
- Apps Script entrega metadatos y bloques de bytes autorizados mediante `teacherBooksOpenPdf` y `teacherBooksReadRange`.
- PDF.js carga únicamente los rangos necesarios y elimina el error CORS `Failed to fetch` de la lectura directa.
- Se conserva el visor de dos páginas, ancho completo, navegación, zoom y pantalla completa.
- SB, TB y WB se resuelven dinámicamente dentro de las carpetas oficiales.
- Se excluyen copias antiguas, originales de respaldo y archivos marcados como backup.
- U01–U16 aparece exclusivamente en Libros de texto cuando está seleccionado SB.
- B1 → SB → U09 solicita PDF 64–65, equivalente a página académica SB 58.
- Biblioteca digital abre TB sin aplicar un mapeo falso de páginas SB.
- El PDF se conserva en memoria y cambiar de unidad no vuelve a cargar el documento completo.

## Archivos modificados

- `src/teacher_cs21a_order_fix.jsx`
- `campus.html`
- `Code.gs` completo
- documentación canónica

## Integridad backend

- Base preservada: CS21A46.
- CS21A55 agrega únicamente lectura autorizada de libros docentes y enrutamiento de los dos endpoints nuevos.
- No modifica pagos, certificados, CONAPE, calendario, DATOS, ESTATUS, GRUPOS ni INTENTOS_ACADEMICOS.
- El archivo completo y su respaldo están en la carpeta canónica de Drive descrita en `AppsScript/README.md`.

## Seguimiento inmediato preservado

Orden: `Código | Estudiante | Resumen académico | Movimiento | Periodo / nivel | WhatsApp`.

- Solo desembolsos académicos `01`.
- `02`, `03` y superiores no aparecen ni cierran el `01`.
- Resumen vertical desde `6-historial`.
- Sin scroll horizontal.
- WhatsApp visible con Mensaje, Alerta y Atención.

## Pruebas obligatorias

1. Instalar el `Code.gs` completo CS21A55 en Apps Script y crear una nueva implementación.
2. Abrir Docente → Recursos Didácticos → Libros de texto.
3. Confirmar que B1 SB carga sin `Failed to fetch`.
4. Confirmar que U09 muestra PDF 64–65.
5. Confirmar que cambiar U01–U16 no descarga ni recarga el libro completo.
6. Confirmar que Biblioteca digital abre TB sin botonera de unidades.
7. Confirmar reglas CONAPE `01` y estudiante `17110`.
