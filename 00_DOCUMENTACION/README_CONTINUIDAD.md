# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral/frontend:** F98.4-Z6-CS21A53  
**Backend completo objetivo:** CS21A46  
**Producción:** no verificada  
**Corte:** 11-jul-2026

## Cambio vigente CS21A53

Ruta: Docente → Recursos Didácticos → Libros de texto / Biblioteca digital.

- Un solo componente controla las vistas de libros; el panel antiguo de carpeta Drive ya no se renderiza en esas rutas.
- Se eliminó el observador global que ejecutaba el parche repetidamente.
- PDF.js muestra dos páginas enfrentadas como libro abierto.
- El PDF se guarda en caché de memoria y cambiar U01–U16 solo cambia las páginas renderizadas.
- Existe respaldo mediante Google Drive `/preview` si el navegador bloquea la lectura directa del PDF.
- SB, TB y WB mantienen colores y selección visible.
- U01–U16 pertenece únicamente a SB.
- Fuente pedagógica: `APOLLO_G3_LIMPIO_21-04-26` → `DETALLE DEL PROGRAMA` → columna K `Páginas SB`.
- Inicio SB: `2, 8, 16, 22, 30, 36, 44, 50, 58, 64, 72, 78, 86, 92, 100, 106`.
- Destino PDF +6: `8, 14, 22, 28, 36, 42, 50, 56, 64, 70, 78, 84, 92, 98, 106, 112`.
- B1 U09 solicita SB 58 / PDF 64.

## Fuente de libros

- B1 SB vigente: `Interchange 5th intro-SB.pdf`, ID `1pnR7RoJGkZnx08TlfrEgxEqVRnlrCwea`.
- El ID anterior `13rMmy1ZLpto6SgjSyVyBd3MtivuU19j3` corresponde al archivo `ORIGINAL` y quedó fuera del visor.
- Carpeta oficial B1: `1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH`.
- Totales reales SB: B1 157, B2 188, I1 158, I2 161 páginas.
- Los totales no son iguales. La regla compartida es la navegación por unidades y el desfase +6.
- Subir otro PDF crea otro ID. Para reemplazarlo sin tocar GitHub debe actualizarse el contenido del archivo canónico conservando el mismo ID.
- La detección automática del archivo más reciente dentro de cada carpeta requerirá cambio de backend; no se implementó sin el Code.gs completo CS21A46.

Archivos funcionales modificados:

- `src/teacher_cs21a_order_fix.jsx`
- `campus.html`
- documentación canónica

Apps Script no cambió.

## Seguimiento inmediato preservado

Orden: `Código | Estudiante | Resumen académico | Movimiento | Periodo / nivel | WhatsApp`.

- Solo desembolsos académicos `01`.
- `02`, `03` y superiores no aparecen ni cierran el `01`.
- Resumen académico vertical desde `6-historial`.
- Sin scroll horizontal.
- WA visible con `Mensaje`, `Alerta` y `Atención`.
- Cerrados no envían cobro.

## Backend requerido

- Objetivo: CS21A46.
- Tamaño declarado: 2,879,996 bytes.
- SHA-256 declarado: `6cd638901f75ff56c4bc5f100be0203de05f82aa01a8b1f838f2c95bc7433568`.
- Despliegue no verificado.

## Pruebas obligatorias

1. Confirmar que Libros y Biblioteca ya no muestran la lista antigua de Drive.
2. Confirmar el modo de dos páginas en Chrome.
3. Confirmar que U01–U16 cambia páginas sin volver a descargar el PDF.
4. Básico I → SB → U09 debe mostrar PDF 64 y 65.
5. Confirmar el archivo nuevo de Básico I.
6. Confirmar que el respaldo `/preview` aparece si PDF.js no puede leer Drive.
7. Confirmar reglas CONAPE `01` y estudiante `17110`.
