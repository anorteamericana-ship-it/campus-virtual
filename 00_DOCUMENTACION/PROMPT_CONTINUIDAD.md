# PROMPT DE CONTINUIDAD — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

Copiar desde la línea siguiente al iniciar otro chat.

---

Estoy trabajando en **CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA**, Costa Rica. Continúa desde **F98.4-Z6-CS21A38**.

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
- Frontend: **CS21A38**.
- Apps Script no cambió en CS21A38.
- `campus.html` carga `src/admin_master_conape_movements_cs21a25.jsx?v=F98.4Z6CS21A38`.

## Seguimiento inmediato compacto

- No debe existir scroll horizontal en la tabla principal.
- La columna `Desembolso` fue eliminada.
- Columnas vigentes: Estudiante, Movimiento, Periodo/nivel, Campus, Detectado y WA.
- La tabla usa ancho total, `table-layout: fixed` y no fuerza `min-width`.
- Nombres y grupos largos usan elipsis con contenido completo en tooltip.
- `✎ Seguimiento` y `✓ Revisado` son botones pequeños dentro de la celda del estudiante.
- El botón final se llama `WA Pago` y debe permanecer visible.
- Movimientos aplicados muestran `No enviar`.

## Texto WA preservado

El botón prepara solo texto. La imagen se adjunta manualmente.

Texto base:

> ¡Buenas noticias [Nombre]! 🥳
>
> CONAPE nos ha informado que el desembolso ya fue acreditado en su cuenta.
>
> Le solicitamos realizar el pago a la Academia a la mayor brevedad posible, para mantener su expediente al día y evitar atrasos en el desembolso del rubro de sostenimiento.

Reglas:

- Detectar el nombre de pila.
- Consultar `getEstudiante` al pulsar WA.
- Calcular el monto pendiente del nivel.
- Mostrar bimestre o cuatrimestre.
- Para I2 decir `último nivel`.
- Si el monto no se confirma, abrir el texto base sin cifra.
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

## Estado de despliegue

CS21A38 está guardado en GitHub `main`, pero producción no está confirmada. Ejecutar QA visual en el Panel Maestro y confirmar ausencia de scroll, columna WA visible y botones compactos.

---
