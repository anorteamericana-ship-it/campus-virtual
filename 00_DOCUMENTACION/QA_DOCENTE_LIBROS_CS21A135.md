# QA Docente · Navegación de libros · CS21A135

Fecha: 18 de julio de 2026

## Incidencia observada

La botonera U01–U16 aparecía al abrir Libros de texto, pero después de alternar SB, TB y WB podía desaparecer y no volver a mostrarse.

La captura permitió identificar que la pantalla regresaba al visor antiguo CS21A58: ese visor incluye el botón **Imágenes Drive** y condiciona la botonera a `realType === 'SB'`. Por diseño histórico, TB y WB quedaban sin navegación por unidad.

## Causa técnica

Dos instaladores envolvían `MaterialesView` después de cargas diferidas:

- CS21A75 intentaba instalar el visor institucional actual después de 20 ms.
- CS21A58 volvía a instalar el visor anterior después de 30 ms.

El wrapper actual no conservaba la marca `__cs21a58books`. Por eso el instalador viejo consideraba que todavía debía ejecutarse, se colocaba por fuera del visor nuevo y tomaba nuevamente el control de Libros/Biblioteca.

## Corrección

`src/teacher_books_unit_guard_cs21a134.js`, versión interna CS21A135:

1. Se convierte en autoridad final de Libros/Biblioteca para docente.
2. Marca el wrapper con `__cs21a135BookAuthority`, `__cs21a75UnitStarts`, `__cs21a60UnitStarts` y `__cs21a58books`.
3. Revisa periódicamente si otro módulo sustituyó `MaterialesView` y recupera la autoridad sin recargar la página.
4. Mantiene U01–U16 visibles para SB, TB y WB.
5. No modifica la pantalla del estudiante.
6. No escribe en Drive y no modifica Apps Script.

## Saltos U01–U16

Mapas centrales de respaldo:

- B1 SB: `8,14,22,28,36,42,50,56,64,70,78,84,92,98,106,112`
- B1 TB: `25,33,43,51,61,69,79,87,97,105,115,123,133,141,151,159`
- B1 WB: `5,11,17,23,29,35,41,47,53,59,65,71,77,83,89,95`
- B2 SB: `22,28,36,42,50,56,64,70,78,84,92,98,106,112,120,126`
- B2 TB: `27,35,45,53,63,71,81,89,99,107,117,125,135,143,153,161`
- B2 WB: `6,12,18,24,30,36,42,48,54,60,66,72,78,84,90,96`
- I1 SB: `8,14,22,28,36,42,50,56,64,70,78,84,92,98,106,112`
- I1 TB: `27,35,45,53,63,71,81,89,99,107,117,125,135,143,153,161`
- I1 WB: `6,12,18,24,30,36,42,48,54,60,66,72,78,84,90,96`
- I2 SB: `10,16,24,30,38,44,52,58,66,72,80,86,94,100,108,114`
- I2 TB: `27,35,45,53,63,71,81,89,99,107,117,125,135,143,153,161`
- I2 WB: `5,11,17,23,29,35,41,47,53,59,65,71,77,83,89,95`

Los mapas completos recibidos desde backend siguen teniendo prioridad. El respaldo solo completa valores ausentes. Las dos secuencias heredadas conocidas y desalineadas de B1 SB sí se sustituyen explícitamente.

B2 SB requiere respaldo frontend porque su manifiesto `book.json` no contiene `unitStarts`.

## Diseño visual

La fila de unidades ahora se presenta como un panel de navegación:

- encabezado **Saltos oficiales del libro / Navegación por unidad**;
- tarjeta individual para cada unidad;
- número de página visible dentro de cada control;
- tema azul para SB, granate para TB y verde para WB;
- unidad activa con aro dorado y profundidad;
- elevación y sombra al pasar el puntero;
- desplazamiento horizontal claro en pantallas pequeñas;
- efecto de paso de página restaurado para Anterior, Siguiente y saltos U01–U16.

## Validación automática

La prueba simula:

- los 12 libros con 16 saltos válidos;
- manifiesto vacío de B2 SB;
- mapas parciales de TB/WB;
- corrección de las dos secuencias antiguas de B1 SB;
- preservación de una calibración completa futura;
- aislamiento del estudiante;
- reinstalación tardía del visor CS21A58;
- recuperación de la autoridad CS21A135;
- instalación del acabado visual.

## QA autenticado pendiente

Con una cuenta docente real:

1. Abrir B1 SB y alternar varias veces SB → TB → WB → SB.
2. Repetir en B2, I1 e I2.
3. Confirmar que la fila nunca desaparece.
4. Probar U01, U02, U08, U09 y U16 de cada libro.
5. Probar Anterior/Siguiente después de un salto.
6. Entrar y salir de Libros de texto y Biblioteca.
7. Confirmar que el estudiante conserva únicamente SB y WB.

No se modificó `Code.gs`, no se publicó Apps Script y no se escribieron cambios en los manifiestos de Drive.
