# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral/frontend:** F98.4-Z6-CS21A56  
**Backend completo:** F98.4-Z6-CS21A56  
**Base backend preservada:** F98.4-Z6-CS21A46  
**Producción:** no verificada  
**Corte:** 11-jul-2026

## Cambio vigente CS21A56

Ruta: Docente → Recursos Didácticos → Libros de texto / Biblioteca digital.

- Apps Script continúa entregando los PDF por rangos autorizados mediante `teacherBooksOpenPdf` y `teacherBooksReadRange`.
- Se elimina la caché del ID resuelto de SB/TB/WB que podía conservar un archivo reemplazado.
- Básico I / SB usa como ID canónico preferente `1zVPOGcCca5Ti8M8LtCpEO65-bO0m2_oF` dentro de la carpeta oficial `1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH`.
- Si el ID preferente deja de existir en la carpeta, el backend selecciona el PDF válido más reciente y excluye ORIGINAL, COPIA, COPY, BACKUP, RESPALDO, OLD y ANTIGUO.
- El frontend fuerza una nueva resolución al entrar o cambiar nivel/tipo.
- Se añade botón `Actualizar desde Drive` para releer el libro sin reiniciar el Campus.
- El visor conserva dos páginas enfrentadas, ancho completo, navegación, zoom y pantalla completa.
- U01–U16 aparece exclusivamente en Libros de texto cuando está seleccionado SB.
- B1 → SB → U09 solicita PDF 64–65, equivalente a página académica SB 58.
- Cambiar de unidad no vuelve a cargar el documento completo.

## Archivos modificados

- `src/teacher_cs21a_order_fix.jsx`
- `campus.html`
- `Code.gs` completo
- documentación canónica

## Integridad backend

- CS21A56 preserva CS21A46 y CS21A55.
- Solo modifica resolución/lectura de libros docentes.
- No modifica pagos, certificados, CONAPE, calendario, DATOS, ESTATUS, GRUPOS ni INTENTOS_ACADEMICOS.
- Archivo canónico y respaldos: ver `AppsScript/README.md`.

## Seguimiento inmediato preservado

Orden: `Código | Estudiante | Resumen académico | Movimiento | Periodo / nivel | WhatsApp`.

- Solo desembolsos académicos `01`.
- `02`, `03` y superiores no aparecen ni cierran el `01`.
- Resumen vertical desde `6-historial`.
- Sin scroll horizontal.
- WhatsApp visible con Mensaje, Alerta y Atención.

## Pruebas obligatorias

1. Instalar el `Code.gs` completo CS21A56 y crear una implementación nueva.
2. Abrir Docente → Recursos Didácticos → Libros de texto.
3. Confirmar que B1/SB resuelve el ID `1zVPOGcCca5Ti8M8LtCpEO65-bO0m2_oF`.
4. Confirmar que `Actualizar desde Drive` relee el archivo vigente.
5. Confirmar U09 = PDF 64–65.
6. Confirmar que U01–U16 no recarga el PDF completo.
7. Confirmar reglas CONAPE `01` y estudiante `17110`.
