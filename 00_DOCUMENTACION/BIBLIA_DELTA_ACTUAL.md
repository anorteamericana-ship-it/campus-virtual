# BIBLIA DELTA ACTUAL — F98.4-Z6-CS21A58

## Estado

- Frontend guardado en `main`: CS21A58.
- Backend completo canónico: CS21A58.
- Base backend preservada: CS21A56 / CS21A46.
- Producción no verificada.

## Recursos docentes — visor WebP tipo libro

Ruta: Docente → Recursos Didácticos → Libros de texto / Biblioteca digital.

- `src/teacher_cs21a_order_fix.jsx` controla ambas vistas.
- `campus.html` ya no carga PDF.js.
- Apps Script entrega el manifiesto mediante `teacherBooksOpenImageBook`.
- El frontend muestra dos imágenes por pliego.
- Solo se cargan las dos hojas visibles y se precargan las dos siguientes.
- El orden sale de `book.json.pages[]`.
- No se calcula la siguiente página sumando uno al nombre del archivo.
- Si falta una página original, el visor continúa con la siguiente entrada del arreglo.
- El libro inicia con las dos primeras entradas.
- Si el total es impar, la última hoja se acompaña con una hoja vacía.
- U01 tiene brillo animado antes de la primera selección.
- Cambiar nivel o tipo reinicia el libro y limpia la unidad seleccionada.

## Unidades SB

El mapa actual es provisional y debe validarse visualmente.

- B1: `6, 12, 20, 26, 34, 40, 48, 54, 62, 68, 76, 82, 90, 96, 104, 110`.
- B2: `22, 28, 36, 42, 50, 56, 64, 70, 78, 84, 92, 98, 106, 112, 120, 126`.
- I1: `8, 14, 22, 28, 36, 42, 50, 56, 64, 70, 78, 84, 92, 98, 106, 112`.
- I2: `10, 16, 24, 30, 38, 44, 52, 58, 66, 72, 80, 86, 94, 100, 108, 114`.

La búsqueda localiza la primera entrada cuyo `source_page` sea igual o mayor al objetivo y forma el pliego por posición par del arreglo.

No aplicar esta navegación a TB ni WB.

## Drive de imágenes

- Total: 2.051 WebP.
- B1: 492; B2: 528; I1: 514; I2: 517.
- B1 SB/TB/WB ya usan el mismo esquema que los otros niveles.
- Los PDF duplicados fueron retirados.
- El PDF oficial continúa siendo la fuente de Abrir/Descargar.

## Acceso

- Docente/admin: SB, TB y WB.
- Estudiante: SB y WB.
- Teacher Book no debe exponerse en la vista estudiantil.
- La integración estudiantil todavía no forma parte del frontend CS21A58.

## Integridad

- Backend: 2.899.463 bytes.
- SHA-256: `d3505496b8e953d4fd0849a7a5af102760a452caa43d41bc9a7055006897ca87`.
- Cambio de solo lectura.
- No modifica pagos, certificados, CONAPE, calendario ni hojas académicas.
- Guardar GitHub o Drive no equivale a publicar producción.

## Reglas preservadas

- Solo desembolso académico 01.
- 02/03+ no aparecen ni cierran el 01.
- Resumen vertical desde `6-historial`.
- Nunca mover pagos entre niveles o intentos.
