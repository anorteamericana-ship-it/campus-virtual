# FUENTE VERDADERA — F98.4-Z6-CS21A57

Estado canónico: frontend CS21A57 guardado en GitHub; backend completo CS21A56 conservado en el archivo canónico de Drive; producción no verificada.

## Componentes vigentes

- `src/teacher_cs21a_order_fix.jsx`
- `campus.html`
- `Code.gs` completo CS21A56 de Drive, sin cambios en esta entrega

## Cambio CS21A57 — pliegos físicos y unidades reales

- Todo SB/TB/WB inicia en la portada PDF 1.
- La portada se muestra sola a la derecha; no se empareja con PDF 2.
- La navegación continúa con pliegos 2–3, 4–5, 6–7, etc.
- Esto elimina el corrimiento visual atribuido a una segunda página duplicada.
- En Student Book, U01 parpadea hasta que el docente seleccione una unidad.
- Al cambiar nivel o tipo de libro se vuelve a PDF 1 y se reactiva la invitación de U01.
- Las páginas impresas de Apollo G3 se conservan, pero cada PDF usa su desfase real:
  - B1 `+5`
  - B2 `+20`
  - I1 `+6`
  - I2 `+8`
- B1 U01 apunta a PDF 7 y se visualiza como pliego 6–7.
- U01–U16 solo aparece en Student Book.
- Apps Script no cambia; permanecen `teacherBooksOpenPdf` y `teacherBooksReadRange` de CS21A56.

## Fuente Drive vigente

- Carpeta oficial B1: `1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH`.
- Student Book B1 activo: `Interchange 5th intro-SB.pdf`, ID `1zVPOGcCca5Ti8M8LtCpEO65-bO0m2_oF`.

## Reglas preservadas

- Solo desembolso académico `01` en Seguimiento inmediato.
- `02/03+` no cierran el `01`.
- Resumen vertical desde `6-historial`.
- Nunca mover pagos entre niveles o intentos.
- Guardado no significa desplegado.