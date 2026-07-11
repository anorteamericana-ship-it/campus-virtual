# BIBLIA DELTA ACTUAL — F98.4-Z6-CS21A57

## Estado

- Frontend guardado en `main`: CS21A57.
- Backend completo canónico: CS21A56.
- Base backend preservada: CS21A46.
- Producción no verificada.

## Recursos docentes — visor PDF por pliegos

Ruta: Docente → Recursos Didácticos → Libros de texto / Biblioteca digital.

- `src/teacher_cs21a_order_fix.jsx` controla ambas vistas.
- `campus.html` carga PDF.js 3.11.174 y fuerza CS21A57.
- Apps Script CS21A56 entrega rangos mediante `teacherBooksOpenPdf` y `teacherBooksReadRange`.
- El documento se conserva abierto al navegar entre unidades.
- Cualquier libro inicia en PDF 1.
- La portada ocupa la página derecha; la izquierda queda vacía.
- Los pliegos siguientes son 2–3, 4–5, 6–7, etc.
- Se elimina el corrimiento de una página del visor anterior.
- U01 presenta brillo animado hasta la primera selección.
- Al cambiar nivel o tipo de libro se limpia la unidad seleccionada y se vuelve a la portada.

## Páginas Apollo G3 y desfases reales

Fuente impresa: `APOLLO_G3_LIMPIO_21-04-26` → `DETALLE DEL PROGRAMA` → columna K `Páginas SB`.

Inicios impresos: `2, 8, 16, 22, 30, 36, 44, 50, 58, 64, 72, 78, 86, 92, 100, 106`.

El desfase no es común entre archivos:

- B1: `+5`; U01 PDF 7, visible en pliego 6–7.
- B2: `+20`; U01 PDF 22, visible en pliego 22–23.
- I1: `+6`; U01 PDF 8, visible en pliego 8–9.
- I2: `+8`; U01 PDF 10, visible en pliego 10–11.

No aplicar este mapeo a TB ni WB.

## Resolución Drive vigente

- Carpeta B1: `1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH`.
- SB B1 activo: `1zVPOGcCca5Ti8M8LtCpEO65-bO0m2_oF`.
- Se mantienen las reglas de exclusión de ORIGINAL, COPIA, COPY, BACKUP, RESPALDO, OLD y ANTIGUO.

## Integridad

- CS21A57 es frontend-only.
- No modifica Apps Script, pagos, certificados, CONAPE, calendario ni hojas académicas.
- Guardar GitHub no equivale a publicar producción.

## Seguimiento inmediato preservado

- Columnas: `Código | Estudiante | Resumen académico | Movimiento | Periodo / nivel | WhatsApp`.
- Solo desembolso académico `01`.
- `02/03+` no aparecen ni cierran el `01`.
- Nunca mover pagos entre niveles o intentos.