# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral/frontend:** F98.4-Z6-CS21A57  
**Backend completo:** F98.4-Z6-CS21A56  
**Base backend preservada:** F98.4-Z6-CS21A46  
**Producción:** no verificada  
**Corte:** 11-jul-2026

## Cambio vigente CS21A57

Ruta: Docente → Recursos Didácticos → Libros de texto / Biblioteca digital.

- Cualquier libro inicia en PDF 1.
- La portada se muestra sola en la página derecha.
- El siguiente pliego es 2–3; después 4–5, 6–7 y así sucesivamente.
- Se elimina el corrimiento visual del primer pliego.
- U01 queda resaltado con animación hasta que el docente seleccione una unidad.
- Al cambiar de nivel, SB/TB/WB o volver a entrar, el visor regresa a la portada.
- La fuente pedagógica continúa siendo Apollo G3, columna K `Páginas SB`.
- Desfases reales verificados por archivo:
  - B1: `+5`; U01 PDF 7, pliego 6–7.
  - B2: `+20`; U01 PDF 22, pliego 22–23.
  - I1: `+6`; U01 PDF 8, pliego 8–9.
  - I2: `+8`; U01 PDF 10, pliego 10–11.
- U01–U16 solo aparece en Student Book.
- Cambiar de unidad reutiliza el documento abierto.
- Backend CS21A56 permanece sin cambios y continúa sirviendo rangos autorizados.

## Archivos modificados

- `src/teacher_cs21a_order_fix.jsx`
- `campus.html`
- documentación canónica

Apps Script no cambió.

## Seguimiento inmediato preservado

Orden: `Código | Estudiante | Resumen académico | Movimiento | Periodo / nivel | WhatsApp`.

- Solo desembolsos académicos `01`.
- `02`, `03` y superiores no aparecen ni cierran el `01`.
- Resumen vertical desde `6-historial`.
- Sin scroll horizontal.
- WhatsApp visible con Mensaje, Alerta y Atención.

## Pruebas obligatorias

1. Hacer Ctrl+F5 después de publicar el frontend.
2. Abrir cualquier SB/TB/WB y confirmar inicio en PDF 1.
3. Confirmar portada sola y siguiente pliego 2–3.
4. Confirmar que U01 brilla antes de seleccionar unidad.
5. Confirmar B1 → SB → U01 = pliego 6–7.
6. Confirmar que cambiar unidad no recarga el PDF completo.
7. Confirmar reglas CONAPE `01` y estudiante `17110`.