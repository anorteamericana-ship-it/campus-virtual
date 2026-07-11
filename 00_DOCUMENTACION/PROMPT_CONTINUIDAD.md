# PROMPT DE CONTINUIDAD — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

Copiar desde la línea siguiente al iniciar otro chat.

---

Estoy trabajando en **CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA**, Costa Rica. Continúa desde **F98.4-Z6-CS21A37**.

## Forma obligatoria

1. Respondé en español directo y asumí trabajo por copy/paste.
2. Antes de modificar, indicá impacto y archivos exactos.
3. Si Apps Script cambia, entregá siempre `Code.gs` completo.
4. Modificá solo los archivos necesarios de `anorteamericana-ship-it/campus-virtual`, rama `main`.
5. No toqués pagos, certificados, `DATOS`, `ESTATUS`, `GRUPOS`, `INTENTOS_ACADEMICOS`, CONAPE o calendario sin análisis de impacto.
6. No movás pagos entre niveles o intentos.
7. No afirmés despliegue si solo hay respaldo o commit.
8. Actualizá la documentación canónica sin copias redundantes.

## Estado vigente

- Backend: **CS21A34**.
- Frontend: **CS21A37**.
- Apps Script no cambió en CS21A37.
- `campus.html` carga `src/admin_master_conape_movements_cs21a25.jsx?v=F98.4Z6CS21A37`.

## Seguimiento inmediato · WA

El botón `WA Solicitar pago` prepara solo texto. La imagen se adjunta manualmente.

Texto base:

> ¡Buenas noticias [Nombre]! 🥳
>
> CONAPE nos ha informado que el desembolso ya fue acreditado en su cuenta.
>
> Le solicitamos realizar el pago a la Academia a la mayor brevedad posible, para mantener su expediente al día y evitar atrasos en el desembolso del rubro de sostenimiento.

Reglas:

- Detectar el nombre de pila en nombres institucionales guardados como apellidos + nombres.
- Consultar `getEstudiante` al pulsar WA.
- Calcular el monto pendiente del nivel con Matrícula + Cuotas + Certificado.
- Para I2 añadir Programa Completo y TOEIC pendientes cuando correspondan.
- Mostrar `bimestre` o `cuatrimestre`.
- Para I2 decir `último nivel`.
- Si el monto no se confirma, abrir el texto base sin cifra.
- En movimientos `Aplicado en sistema`, mostrar `Aplicado · no enviar cobro` y no abrir el mensaje de solicitud.
- No enviar automáticamente, no adjuntar imagen y no escribir hojas.

## Aplicar pago dentro de Consulta individual · CS21A36 preservado

- Una búsqueda de comprobante por intento vigente.
- Búsqueda por documento, fecha o descripción.
- Revalidación al seleccionar y antes de aplicar.
- Controles `− / +` por rubro.
- Cargos especiales con `CARGO_ID` y monto exacto.
- Intentos históricos de solo lectura.
- El frontend solo llama `getEstudiante`, `getComprobantes` y `aplicarPago`.
- Nunca crear una segunda lógica contable ni mover pagos entre niveles o intentos.

## Fuente oficial de morosidad CONAPE

- Spreadsheet ID: `1Q9QTNc2009M6PqbNW2_WjYBOlqCMhiBjrenun88L5yg`
- Archivo: `7-morosidad`
- Pestaña: `Hoja 1`
- Regla: 01–04=P1; 05–08=P2; 09–12=P3; `NO`=aplicado; `SI`=pendiente; sin fila exacta=revisión.

## Cambios anteriores preservados

- CS21A36: aplicar pago dentro de Consulta individual.
- CS21A35: botón Detalle violeta con `✓ REVISADO · CON SEGUIMIENTO`.
- CS21A34: lectura directa del archivo externo oficial `7-morosidad`.
- Backend completo CS21A34 continúa en la carpeta institucional.

## Estado de despliegue

CS21A37 está guardado en GitHub `main`, pero producción no está confirmada. Ejecutar QA con nombre de pila, B2, bimestre, cuatrimestre, I2, monto no confirmable y movimiento ya aplicado.

---