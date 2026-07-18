# QA Docente · Libros y Audios · CS21A134

Fecha: 18 de julio de 2026

## Reporte recibido

En el perfil docente:

- Básico I · SB abría unidades desplazadas.
- TB y WB no ofrecían una botonera U01–U16 operativa.
- B2, I1 e I2 · SB conservaban la navegación esperada.

## Causa comprobada

El visor siempre renderiza `UnitButtons`, pero los botones se deshabilitan cuando `unit_starts` no contiene 16 páginas válidas.

El frontend histórico solo tenía respaldo local para SB. TB y WB dependían completamente de que el Apps Script desplegado devolviera la configuración guardada dentro de cada `book.json`.

También se encontró en B1 · SB la secuencia conocida:

`9, 15, 23, 29, 37, 43, 51, 57, 65, 71, 79, 85, 93, 99, 107, 113`

Esa secuencia mueve cada unidad al pliego siguiente. Se restaura la alineación histórica funcional:

`8, 14, 22, 28, 36, 42, 50, 56, 64, 70, 78, 84, 92, 98, 106, 112`

## Solución

`src/teacher_books_unit_guard_cs21a134.js` interviene únicamente la respuesta de `teacherBooksOpenImageBook` cuando la sesión efectiva es docente.

Reglas:

1. Una calibración completa distinta se respeta sin modificaciones.
2. Una secuencia incompleta de TB o WB se completa con el mapa oficial observado en su manifiesto Drive.
3. La secuencia defectuosa conocida de B1 · SB se reemplaza.
4. El estudiante no es modificado y continúa sin acceso a TB.
5. No se escribe en Drive ni se modifica Apps Script.

## Mapas de respaldo docente

- B1 TB: `25,33,43,51,61,69,79,87,97,105,115,123,133,141,151,159`
- B1 WB: `5,11,17,23,29,35,41,47,53,59,65,71,77,83,89,95`
- B2 TB: `27,35,45,53,63,71,81,89,99,107,117,125,135,143,153,161`
- B2 WB: `6,12,18,24,30,36,42,48,54,60,66,72,78,84,90,96`
- I1 TB: `27,35,45,53,63,71,81,89,99,107,117,125,135,143,153,161`
- I1 WB: `6,12,18,24,30,36,42,48,54,60,66,72,78,84,90,96`
- I2 TB: `27,35,45,53,63,71,81,89,99,107,117,125,135,143,153,161`
- I2 WB: `5,11,17,23,29,35,41,47,53,59,65,71,77,83,89,95`

Los valores provienen de los `book.json` oficiales de Drive y se usan solamente como respaldo de lectura.

## Validación automática

`scripts/test_teacher_books_unit_guard_cs21a134.mjs` verifica:

- 16 páginas válidas en cada mapa;
- corrección de B1 · SB;
- preservación de calibraciones completas futuras;
- completado de mapas parciales;
- aislamiento del estudiante;
- integración real con la respuesta `fetch` del endpoint;
- ausencia de cambios sobre otras lecturas.

## QA autenticado pendiente

Con una cuenta docente real comprobar:

- B1/B2/I1/I2;
- SB/TB/WB;
- U01, U02, U08, U09 y U16 de cada libro;
- cambio de tipo sin perder el nivel seleccionado;
- regresar de WB a SB;
- abrir y descargar PDF;
- que el estudiante continúe mostrando únicamente SB y WB.

No se modificó `Code.gs` ni se publicó una nueva versión de Apps Script.
