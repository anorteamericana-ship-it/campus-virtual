# Campus Virtual · Academia Norteamericana

## Estado consolidado actual

Base vigente de continuidad: **F98.4-Z6-CS21A103**.

### Versiones vigentes

- **Frontend global:** rama `main`.
- **Consulta individual · Poner al día:** `F98.4-Z6-CS21A102`.
- **Panel Maestro CONAPE:** `F98.4-Z6-CS21A103`.
- **Calendario académico Superadmin:** `F98.4-Z6-CS21A88`.
- **Backend integral vigente:** `F98.4-Z6-CS21A103`.
- **Semáforo CONAPE:** exclusivo del desembolso académico 01.
- **Movimientos 02/03:** visibles como contexto, sin seguimiento de la Academia.
- **Morosidad del Panel Maestro:** verificada en vivo contra el archivo externo oficial `7-morosidad`.
- **MÁSCARA de Keylor:** protegida y sin cambios.
- **Producción CS21A103:** no confirmada hasta publicar Apps Script y realizar la prueba visual.

## Leer primero

1. `00_DOCUMENTACION/INDICE_VIGENTE_CS21A103.md`
2. `00_DOCUMENTACION/README_F98_4_Z6_CS21A103.md`
3. `00_DOCUMENTACION/VALIDACION_CS21A103.md`
4. `00_DOCUMENTACION/README_F98_4_Z6_CS21A102.md`
5. `00_DOCUMENTACION/FUENTES_DE_VERDAD_Y_CONTRATOS.md`

## Cambio principal CS21A103

El Panel Maestro ya no depende únicamente de la fotografía completa para mostrar `Mora SI/NO`.

Consulta directamente `7-morosidad` al abrir la tabla, cada 20 segundos con la pestaña visible, al recuperar foco y después de una actualización manual. La respuesta cambia solamente el estado de morosidad, el cierre del desembolso 01 y el semáforo correspondiente.

También se actualizaron los parámetros de caché de `campus.html` para que los módulos A101, A102 y A103 no sean sustituidos por copias antiguas del navegador.

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

La próxima entrega funcional debe usar **F98.4-Z6-CS21A104**.
