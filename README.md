# Campus Virtual · Academia Norteamericana

## Estado consolidado actual

Base vigente de continuidad: **F98.4-Z6-CS21A104**.

### Versiones vigentes

- **Frontend global:** rama `main`.
- **Consulta individual · Poner al día:** `F98.4-Z6-CS21A102`.
- **Panel Maestro CONAPE:** `F98.4-Z6-CS21A104`.
- **Calendario académico Superadmin:** `F98.4-Z6-CS21A88`.
- **Backend integral vigente:** `F98.4-Z6-CS21A103`.
- **Semáforo CONAPE:** exclusivo del desembolso académico 01.
- **Movimientos 02/03:** visibles como contexto, sin seguimiento de la Academia.
- **Morosidad:** verificada en vivo contra `7-morosidad`.
- **MÁSCARA de Keylor:** protegida y sin cambios.

## Leer primero

1. `00_DOCUMENTACION/INDICE_VIGENTE_CS21A104.md`
2. `00_DOCUMENTACION/README_F98_4_Z6_CS21A104.md`
3. `00_DOCUMENTACION/VALIDACION_CS21A104.md`
4. `00_DOCUMENTACION/README_F98_4_Z6_CS21A103.md`
5. `00_DOCUMENTACION/FUENTES_DE_VERDAD_Y_CONTRATOS.md`

## Cambio principal CS21A104

`Seguimiento inmediato` presenta una sola ficha por estudiante dentro de cada sección pendiente o cerrada.

Los distintos desembolsos académicos 01 se conservan como movimientos independientes, pero quedan alineados con el nivel correspondiente dentro de la misma ficha. La tabla incorpora una columna separada **Detectado**, con valores como `D-10/7`, ordenable desde el encabezado o desde el selector de orden.

El conteo visible diferencia estudiantes y movimientos, evitando mostrar dos movimientos como si fueran dos estudiantes.

CS21A104 es una corrección frontend. No modifica Apps Script, pagos, expedientes, hojas CONAPE ni la MÁSCARA de Keylor.

## Regla principal

Antes de modificar cualquier pantalla o endpoint:

1. identificar la fuente de verdad;
2. auditar el flujo real existente;
3. preservar funciones y rutas vigentes;
4. eliminar código sustituido en lugar de ocultarlo;
5. ejecutar pruebas antes de entregar;
6. distinguir entre guardado, validado, publicado y probado en producción;
7. no modificar la MÁSCARA de Keylor salvo autorización expresa.

## Próxima numeración

La próxima entrega funcional debe usar **F98.4-Z6-CS21A105**.
