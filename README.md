# Campus Virtual · Academia Norteamericana

## Estado consolidado actual

Base vigente de continuidad: **F98.4-Z6-CS21A98**.

Este repositorio contiene el frontend del Campus Virtual y la documentación operativa necesaria para continuar el proyecto sin reconstruir contexto.

### Versiones vigentes

- **Frontend global:** rama `main`.
- **Panel Maestro CONAPE:** `F98.4-Z6-CS21A98`.
- **Calendario académico Superadmin:** `F98.4-Z6-CS21A88`.
- **Backend integral entregado:** `F98.4-Z6-CS21A98`.
- **Semáforo CONAPE:** acumulativo por desembolso, colaborativo entre operadores y reiniciado al cerrar el ciclo.
- **Filtro de grupos:** docente, días, horario y consecutivo desde la hoja oficial `GRUPOS`.
- **Deployment público de CS21A98:** no confirmado; no asumir que está publicado hasta actualizar Apps Script y verificar producción.

## Leer primero

1. `00_DOCUMENTACION/INDICE_VIGENTE_CS21A98.md`
2. `00_DOCUMENTACION/ESTADO_CONSOLIDADO_F98_4_Z6_CS21A98.md`
3. `00_DOCUMENTACION/FUENTES_DE_VERDAD_Y_CONTRATOS.md`
4. `00_DOCUMENTACION/HANDOFF_NUEVO_CHAT_CS21A98.md`
5. `00_DOCUMENTACION/ROADMAP_VISUAL_PRIORIZADO.md`

Los documentos con numeraciones anteriores se conservan como historial técnico; no representan la versión vigente.

## Regla principal

Antes de modificar cualquier pantalla o endpoint:

1. identificar la fuente de verdad;
2. auditar el flujo real existente;
3. preservar funciones y rutas vigentes;
4. eliminar código sustituido en lugar de ocultarlo;
5. ejecutar pruebas antes de entregar;
6. distinguir entre **guardado en Git**, **validado**, **publicado en Apps Script** y **probado en producción**.

## Próxima numeración

La próxima entrega funcional debe usar **F98.4-Z6-CS21A99**.
