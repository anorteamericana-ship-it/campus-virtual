# Campus Virtual · Academia Norteamericana

## Estado consolidado actual

Base vigente de continuidad: **F98.4-Z6-CS21A106**.

### Versiones vigentes

- **Frontend global:** rama `main`.
- **Consulta individual · Poner al día:** `F98.4-Z6-CS21A102`.
- **Panel Maestro CONAPE:** `F98.4-Z6-CS21A106`.
- **Backend integral vigente:** `F98.4-Z6-CS21A103`.
- **Tabla agrupada y columna Detectado:** `F98.4-Z6-CS21A104`.
- **Semáforo estable:** `F98.4-Z6-CS21A105`.
- **Enlace académico de movimientos:** `F98.4-Z6-CS21A106`.
- **MÁSCARA de Keylor:** protegida y sin cambios.

## Leer primero

1. `00_DOCUMENTACION/README_F98_4_Z6_CS21A106.md`
2. `00_DOCUMENTACION/VALIDACION_CS21A106.md`
3. `00_DOCUMENTACION/README_F98_4_Z6_CS21A105.md`
4. `00_DOCUMENTACION/README_F98_4_Z6_CS21A104.md`
5. `00_DOCUMENTACION/FUENTES_DE_VERDAD_Y_CONTRATOS.md`

## Cambio principal CS21A106

`Seguimiento inmediato` ya no depende exclusivamente del nivel calculado a partir del grupo futuro.

Cada desembolso académico 01 se enlaza primero con `6-historial` mediante:

```text
cédula + año + periodo cuatrimestral
```

Esto restaura `Periodo / nivel`, `Detectado` y `WhatsApp` para movimientos que existían en CONAPE pero aparecían vacíos en la tabla agrupada.

Cuando no exista una coincidencia segura, el movimiento se muestra como **Nivel por confirmar** en lugar de desaparecer.

CS21A106 es una corrección frontend. No modifica Apps Script, pagos, expedientes, hojas CONAPE ni la MÁSCARA de Keylor.

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

La próxima entrega funcional debe usar **F98.4-Z6-CS21A107**.
