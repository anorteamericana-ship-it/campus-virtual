# Campus Virtual · Academia Norteamericana

## Estado consolidado actual

Base vigente de continuidad: **F98.4-Z6-CS21A99**.

Este repositorio contiene el frontend del Campus Virtual y la documentación operativa necesaria para continuar el proyecto sin reconstruir contexto.

### Versiones vigentes

- **Frontend global:** rama `main`.
- **Consulta individual · Poner al día:** `F98.4-Z6-CS21A99`.
- **Panel Maestro CONAPE:** `F98.4-Z6-CS21A98`.
- **Calendario académico Superadmin:** `F98.4-Z6-CS21A88`.
- **Backend integral entregado:** `F98.4-Z6-CS21A99`.
- **Semáforo CONAPE:** acumulativo por desembolso, colaborativo entre operadores y reiniciado al cerrar el ciclo.
- **Filtro de grupos:** docente, días, horario y consecutivo desde la hoja oficial `GRUPOS`.
- **MÁSCARA de Keylor:** protegida, sin cambios y separada de expedientes reales.
- **Deployment público de CS21A99:** no confirmado; no asumir que está publicado hasta actualizar Apps Script y verificar producción.

## Leer primero

1. `00_DOCUMENTACION/INDICE_VIGENTE_CS21A99.md`
2. `00_DOCUMENTACION/ESTADO_CONSOLIDADO_F98_4_Z6_CS21A99.md`
3. `00_DOCUMENTACION/AUDITORIA_FLUJO_PUESTA_AL_DIA_CS21A99.md`
4. `00_DOCUMENTACION/FUENTES_DE_VERDAD_Y_CONTRATOS.md`
5. `00_DOCUMENTACION/HANDOFF_NUEVO_CHAT_CS21A99.md`
6. `00_DOCUMENTACION/ROADMAP_VISUAL_PRIORIZADO.md`

Los documentos con numeraciones anteriores se conservan como historial técnico; no representan la versión vigente.

## Cambio principal CS21A99

El flujo administrativo para actualizar un estudiante pasó a un asistente de tres pasos:

1. aprobar el nivel y activar el siguiente localmente;
2. aplicar el comprobante con detalle de precios, cuotas, total bancario y saldo restante;
3. decidir si se sincroniza CONAPE una sola vez.

Los antiguos parches superpuestos de estatus A28, A29 y A95 ya no se cargan desde `campus.html`. Sus archivos históricos se conservan temporalmente para trazabilidad. El módulo de pago inline A36 permanece disponible como respaldo.

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

La próxima entrega funcional debe usar **F98.4-Z6-CS21A100**.
