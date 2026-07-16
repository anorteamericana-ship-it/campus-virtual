# Campus Virtual · Academia Norteamericana

## Estado consolidado actual

Base vigente de continuidad: **F98.4-Z6-CS21A105**.

### Versiones vigentes

- **Frontend global:** rama `main`.
- **Consulta individual · Poner al día:** `F98.4-Z6-CS21A102`.
- **Panel Maestro CONAPE:** `F98.4-Z6-CS21A105`.
- **Calendario académico Superadmin:** `F98.4-Z6-CS21A88`.
- **Backend integral vigente:** `F98.4-Z6-CS21A103`.
- **Tabla agrupada y columna Detectado:** `F98.4-Z6-CS21A104`.
- **Semáforo CONAPE:** estable, colaborativo y exclusivo del desembolso académico 01.
- **Movimientos 02/03:** visibles como contexto, sin seguimiento de la Academia.
- **Morosidad:** verificada en vivo contra `7-morosidad`.
- **MÁSCARA de Keylor:** protegida y sin cambios.

## Leer primero

1. `00_DOCUMENTACION/README_F98_4_Z6_CS21A105.md`
2. `00_DOCUMENTACION/INDICE_VIGENTE_CS21A104.md`
3. `00_DOCUMENTACION/README_F98_4_Z6_CS21A104.md`
4. `00_DOCUMENTACION/README_F98_4_Z6_CS21A103.md`
5. `00_DOCUMENTACION/FUENTES_DE_VERDAD_Y_CONTRATOS.md`

## Cambio principal CS21A105

El semáforo ya no puede ser borrado por una fotografía anterior del dashboard ni por la reconstrucción periódica de morosidad en vivo.

Al hacer clic:

1. el punto se refleja inmediatamente;
2. Apps Script confirma la escritura;
3. el valor confirmado queda protegido durante la propagación;
4. el canal colaborativo continúa consultando cambios;
5. solo un cierre oficial reinicia el ciclo a cero.

La auditoría confirmó que los clics anteriores sí quedaron guardados en `CONAPE_MOVIMIENTOS_LOG`; el fallo era visual.

CS21A105 es una corrección frontend. No modifica Apps Script, pagos, expedientes, hojas CONAPE ni la MÁSCARA de Keylor.

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

La próxima entrega funcional debe usar **F98.4-Z6-CS21A106**.
