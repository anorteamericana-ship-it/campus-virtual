# Apps Script — backend completo de continuidad

## Versión objetivo

`F98.4-Z6-CS21A46`

El archivo productivo es `Code.gs` y se reemplaza completo. El backend grande no se almacena en GitHub; este README registra su identidad.

## Integridad declarada

- Entrega: `ENTREGA_F98_4_Z6_CS21A46_SOLO_DESEMBOLSO_ACADEMICO_01.zip`
- Ruta interna: `AppsScript/Code.gs`
- Tamaño: 2,879,996 bytes
- SHA-256: `6cd638901f75ff56c4bc5f100be0203de05f82aa01a8b1f838f2c95bc7433568`
- Sintaxis: aprobada con `node --check` sobre copia `.js`
- Producción: no verificada

## Frontend vigente relacionado

F98.4-Z6-CS21A51 modifica únicamente el visor docente de libros y `campus.html`.

- Corrige el salto U01–U16 del Student Book usando el PDF directo con el visor nativo del navegador.
- Básico I → U09 muestra el contenido SB 58 mediante la página PDF 64.
- No modifica Apps Script.
- No modifica pagos, certificados, CONAPE, calendario ni hojas académicas.
- El backend objetivo continúa siendo CS21A46.

## Cambio CS21A46 preservado

- Interpreta `FECHA_ULT_DESEMBOLSO` como número de desembolso, mes y año.
- Seguimiento inmediato usa únicamente el número `01`.
- Los números `02`, `03` y superiores permanecen en logs para auditoría.
- Un movimiento posterior no crea, reemplaza ni cierra el seguimiento académico `01`.
- Usa caché `MASTER_DASH_CS21A46_V1`.

## Funciones preservadas

- Consulta individual fresca CS21A42.
- Certificados reconciliados: pago separado de emisión.
- Pagos con bloqueo, `REQUEST_ID`, journal e idempotencia.
- Lectura directa de `7-morosidad`.
- Resumen académico desde `6-historial`.
- No mover pagos entre niveles o intentos.
- No crear triggers automáticos de CONAPE.

Preparado o respaldado no significa desplegado. Confirmar nueva implementación y pruebas antes de declarar producción.
