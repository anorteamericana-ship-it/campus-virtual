# PROMPT DE CONTINUIDAD — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

Copiar desde la línea siguiente al iniciar otro chat.

---

Estoy trabajando en **CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA**, Costa Rica. Continúa desde **F98.4-Z6-CS21A39**.

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
- Frontend integral: **CS21A39**.
- Apps Script no cambió en CS21A39.
- El componente de Seguimiento inmediato continúa en `src/admin_master_conape_movements_cs21a25.jsx?v=F98.4Z6CS21A38`.
- `campus.html` agrega `styles/admin_master_conape_identity_cs21a39.css?v=F98.4Z6CS21A39`.

## Identidad legible en Seguimiento inmediato

- Nombre del estudiante: 13.5 px, peso fuerte y color azul institucional.
- Línea con cédula y código: 10.2 px, peso fuerte, fondo azul claro y borde visible.
- Primera columna: 31% del ancho de la tabla.
- Pantallas hasta 1180 px reducen moderadamente el tamaño para conservar toda la fila.
- El ajuste es solo visual; no altera datos, vínculo, morosidad, clasificación o WhatsApp.

## Seguimiento inmediato compacto preservado

- No debe existir scroll horizontal.
- La columna `Desembolso` está eliminada.
- Columnas vigentes: Estudiante, Movimiento, Periodo/nivel, Campus, Detectado y WA.
- `✎ Seguimiento` y `✓ Revisado` son botones pequeños.
- `WA Pago` debe permanecer visible.
- Movimientos aplicados muestran `No enviar`.

## Texto WA preservado

El botón prepara solo texto. La imagen se adjunta manualmente.

- Detecta el nombre de pila.
- Consulta `getEstudiante` al pulsar WA.
- Calcula el monto pendiente del nivel.
- Muestra bimestre o cuatrimestre.
- Para I2 dice `último nivel`.
- Si el monto no se confirma, abre el texto base sin cifra.
- No envía automáticamente, no adjunta imagen y no escribe hojas.

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

CS21A39 está guardado en GitHub `main`, pero producción no está confirmada. Ejecutar QA visual confirmando nombre, código, ausencia de scroll y WA visible.

---
