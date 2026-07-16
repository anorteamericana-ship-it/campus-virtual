# Campus Virtual · Academia Norteamericana

## Estado consolidado actual

Base vigente de continuidad: **F98.4-Z6-CS21A102**.

Este repositorio contiene el frontend del Campus Virtual y la documentación operativa necesaria para continuar el proyecto sin reconstruir contexto.

### Versiones vigentes

- **Frontend global:** rama `main`.
- **Consulta individual · Poner al día:** `F98.4-Z6-CS21A102`.
- **Panel Maestro CONAPE:** `F98.4-Z6-CS21A101`.
- **Calendario académico Superadmin:** `F98.4-Z6-CS21A88`.
- **Backend integral vigente:** `F98.4-Z6-CS21A101`.
- **Semáforo CONAPE:** exclusivo del desembolso académico 01, acumulativo, colaborativo y reiniciado al cerrar el ciclo.
- **Movimientos 02/03:** visibles como contexto; 02 es sostenimiento y 03 es equipo electrónico, sin seguimiento de la Academia.
- **Filtro de grupos:** docente, días, horario y consecutivo desde la hoja oficial `GRUPOS`.
- **MÁSCARA de Keylor:** protegida, sin cambios y separada de expedientes reales.

## Leer primero

1. `00_DOCUMENTACION/README_F98_4_Z6_CS21A102.md`
2. `00_DOCUMENTACION/INDICE_VIGENTE_CS21A101.md`
3. `00_DOCUMENTACION/VALIDACION_CS21A101.md`
4. `00_DOCUMENTACION/AUDITORIA_17048_CS21A100.md`
5. `00_DOCUMENTACION/FUENTES_DE_VERDAD_Y_CONTRATOS.md`
6. `00_DOCUMENTACION/ROADMAP_VISUAL_PRIORIZADO.md`

Los documentos con numeraciones anteriores se conservan como historial técnico; no representan la versión vigente.

## Cambio principal CS21A102

Se corrigió el montaje del asistente `Poner al día` en la ruta diferida de Consulta individual.

La versión anterior podía marcar el asistente como instalado antes de que `admin_students.jsx` publicara el modal antiguo. CS21A102 comprueba la función realmente activa y reinstala el asistente después de cargar `admin_students.jsx` o `buscador.jsx`.

También permite continuar expedientes donde el nivel actual ya está `APR` pero el siguiente nivel continúa en `PE`: verifica el nivel aprobado, activa el siguiente en `CA` de forma idempotente y abre el pago sin duplicar intentos.

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

La próxima entrega funcional debe usar **F98.4-Z6-CS21A103**.
