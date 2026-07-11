# PROMPT DE CONTINUIDAD — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

Copiar desde la línea siguiente al iniciar otro chat.

---

Estoy trabajando en CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA, Costa Rica. Continúa desde F98.4-Z6-CS21A40.

## Forma obligatoria

1. Responder en español directo y asumir trabajo por copy/paste.
2. Antes de modificar, indicar impacto y archivos exactos.
3. Si Apps Script cambia, entregar siempre Code.gs completo.
4. Modificar solo los archivos necesarios de anorteamericana-ship-it/campus-virtual, rama main.
5. No tocar pagos, certificados, DATOS, ESTATUS, GRUPOS, INTENTOS_ACADEMICOS, CONAPE o calendario sin análisis de impacto.
6. No mover pagos entre niveles o intentos.
7. No afirmar despliegue si solo existe respaldo o commit.
8. Actualizar la documentación canónica sin copias redundantes.

## Estado vigente

- Backend: CS21A34.
- Frontend integral: CS21A40.
- Apps Script no cambió.
- campus.html carga src/admin_master_conape_movements_cs21a25.jsx con versión F98.4Z6CS21A40.
- El estilo de identidad CS21A39 permanece cargado.

## Mensaje WA corregido

El botón WA Pago prepara solo texto. La imagen se adjunta manualmente.

- El emoticono se genera con String.fromCodePoint(0x1F389) y debe verse como el icono de celebración, nunca como el carácter de reemplazo.
- WhatsApp usa negrita con un solo asterisco a cada lado del texto.
- No usar asteriscos dobles.
- El saludo, la confirmación del desembolso, la prontitud, el estado al día y el monto deben resaltarse.
- Usa el nombre de pila.
- Consulta getEstudiante al pulsar WA.
- No inventa monto.
- En aplicados muestra No enviar.
- No envía automáticamente ni escribe hojas.

## Seguimiento inmediato preservado

- Nombre grande y código/cédula destacados.
- Sin scroll horizontal.
- Columna Desembolso eliminada.
- Columnas: Estudiante, Movimiento, Periodo/nivel, Campus, Detectado y WA.
- Seguimiento, Revisado y WA Pago permanecen compactos.

## Aplicar pago dentro de Consulta individual preservado

- Una búsqueda de comprobante por intento vigente.
- Revalidación al seleccionar y antes de aplicar.
- Controles por rubro.
- Cargos especiales con CARGO_ID y monto exacto.
- Intentos históricos de solo lectura.
- El frontend solo llama getEstudiante, getComprobantes y aplicarPago.
- Nunca crear una segunda lógica contable ni mover pagos entre niveles o intentos.

## Fuente oficial de morosidad CONAPE

- Spreadsheet ID: 1Q9QTNc2009M6PqbNW2_WjYBOlqCMhiBjrenun88L5yg
- Archivo: 7-morosidad
- Pestaña: Hoja 1
- Regla: 01-04=P1; 05-08=P2; 09-12=P3; NO=aplicado; SI=pendiente; sin fila exacta=revisión.

## Estado de despliegue

CS21A40 está guardado en GitHub main, pero producción no está confirmada. Ejecutar QA confirmando emoticono, negritas, monto, I2 y No enviar.

---
