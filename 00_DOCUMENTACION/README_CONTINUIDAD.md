# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral:** F98.4-Z6-CS21A52  
**Frontend GitHub:** CS21A52  
**Backend completo objetivo:** CS21A46  
**Producción:** no verificada  
**Corte:** 11-jul-2026

## Cambio vigente CS21A52

Docente → Recursos Didácticos → Libros de texto:

- SB, TB y WB mantienen botones visibles y diferenciados.
- Student Book mantiene U01–U16.
- Fuente: `APOLLO_G3_LIMPIO_21-04-26`, pestaña `DETALLE DEL PROGRAMA`, columna K `Páginas SB`.
- Inicio SB: `2, 8, 16, 22, 30, 36, 44, 50, 58, 64, 72, 78, 86, 92, 100, 106`.
- Destino PDF con desfase de 6 hojas: `8, 14, 22, 28, 36, 42, 50, 56, 64, 70, 78, 84, 92, 98, 106, 112`.
- CS21A51 usó una dirección que el navegador trató como descarga y dejó el visor vacío.
- CS21A52 elimina esa dirección y restaura el visor embebido de Google Drive.
- Los botones de unidad reconstruyen el visor sin iniciar descargas.
- La apertura exacta de página requiere prueba real en el navegador.
- La navegación por unidades no se aplica a TB ni WB.

Archivos funcionales:

- `src/teacher_cs21a_order_fix.jsx`
- `campus.html`

Apps Script no cambió.

## Seguimiento inmediato preservado

Orden:

`Código | Estudiante | Resumen académico | Movimiento | Periodo / nivel | WhatsApp`

- Solo desembolsos académicos `01`.
- `02`, `03` y superiores quedan en auditoría y no cierran el `01`.
- Código primero, grande y seleccionable.
- Resumen académico vertical desde `6-historial`.
- Sin scroll horizontal.
- WA visible con `1 Mensaje`, `2 Alerta`, `3 Atención`.
- Cerrados no envían cobro.

## Backend requerido

- Objetivo: CS21A46.
- Tamaño declarado: 2,879,996 bytes.
- SHA-256 declarado: `6cd638901f75ff56c4bc5f100be0203de05f82aa01a8b1f838f2c95bc7433568`.
- Despliegue no verificado.

## Pruebas obligatorias

1. Confirmar que los libros vuelven a verse dentro del Campus.
2. Confirmar que U01–U16 no descargan el PDF.
3. Básico I → SB → U09 debe intentar abrir SB 58 / PDF 64.
4. Confirmar que TB y WB no muestran navegación SB.
5. Confirmar reglas CONAPE `01`.
6. Probar estudiante `17110`.