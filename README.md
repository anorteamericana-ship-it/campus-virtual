# Campus Virtual · Academia Norteamericana

## Estado consolidado actual

Base vigente de continuidad: **F98.4-Z6-CS21A101**.

Este repositorio contiene el frontend del Campus Virtual y la documentación operativa necesaria para continuar el proyecto sin reconstruir contexto.

### Versiones vigentes

- **Frontend global:** rama `main`.
- **Consulta individual · Poner al día:** `F98.4-Z6-CS21A100`.
- **Panel Maestro CONAPE:** `F98.4-Z6-CS21A101`.
- **Calendario académico Superadmin:** `F98.4-Z6-CS21A88`.
- **Backend integral entregado:** `F98.4-Z6-CS21A101`.
- **Semáforo CONAPE:** exclusivo del desembolso académico 01, acumulativo, colaborativo y reiniciado al cerrar el ciclo.
- **Movimientos 02/03:** visibles como contexto; 02 es sostenimiento y 03 es equipo electrónico, sin seguimiento de la Academia.
- **Filtro de grupos:** docente, días, horario y consecutivo desde la hoja oficial `GRUPOS`.
- **MÁSCARA de Keylor:** protegida, sin cambios y separada de expedientes reales.
- **Deployment público de CS21A101:** no confirmado; no asumir que está publicado hasta actualizar Apps Script y verificar producción.

## Leer primero

1. `00_DOCUMENTACION/INDICE_VIGENTE_CS21A101.md`
2. `00_DOCUMENTACION/README_F98_4_Z6_CS21A101.md`
3. `00_DOCUMENTACION/VALIDACION_CS21A101.md`
4. `00_DOCUMENTACION/AUDITORIA_17048_CS21A100.md`
5. `00_DOCUMENTACION/FUENTES_DE_VERDAD_Y_CONTRATOS.md`
6. `00_DOCUMENTACION/ROADMAP_VISUAL_PRIORIZADO.md`

Los documentos con numeraciones anteriores se conservan como historial técnico; no representan la versión vigente.

## Cambio principal CS21A101

`Seguimiento inmediato` distingue los movimientos de CONAPE por su función:

1. **01:** desembolso académico que la Academia debe revisar, cobrar y cerrar;
2. **02:** sostenimiento entregado por CONAPE, visible solo como información;
3. **03:** equipo electrónico entregado por CONAPE, visible solo como información;
4. **04 o superior:** informativo mientras no exista una definición expresa distinta.

Los movimientos 02/03 no generan fila independiente de seguimiento, no muestran la etiqueta `Nuevo desembolso`, no admiten semáforo y no se publican en el canal colaborativo de revisiones.

## Regla principal

Antes de modificar cualquier pantalla o endpoint:

1. identificar la fuente de verdad;
2. auditar el flujo real existente;
3. preservar funciones y rutas vigentes;
4. eliminar código sustituido en lugar de ocultarlo;
5. ejecutar pruebas antes de entregar;
6. distinguir entre **guardado en Git**, **validado**, **publicado en Apps Script** y **probado en producción**;
7. no modificar la MÁSCARA de Keylor salvo autorización expresa del propietario.

## Próxima numeración

La próxima entrega funcional debe usar **F98.4-Z6-CS21A102**.
