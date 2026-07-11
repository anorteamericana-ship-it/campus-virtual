# PROMPT DE CONTINUIDAD — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

Copiar desde la línea siguiente al iniciar otro chat.

---

Estoy trabajando en CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA, Costa Rica. Continúa desde F98.4-Z6-CS21A41.

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
- Frontend integral: CS21A41.
- Apps Script no cambió.
- campus.html carga el estilo de identidad y el módulo CONAPE con versión CS21A41.
- El componente de movimientos y texto WA continúa en CS21A40.

## Seguimiento inmediato

- El código del estudiante aparece como primer elemento de cada fila.
- El código usa un campo azul grande de solo lectura.
- Al pulsar el campo, el valor completo queda seleccionado.
- Debajo aparecen nombre, cédula y Seguimiento/Revisado.
- El acceso Consulta continúa usando el código separado.
- La tabla permanece sin desplazamiento horizontal.
- La columna WA continúa visible.
- La columna Desembolso permanece eliminada.

## Mensaje WA preservado

- Usa emoticono seguro generado por Unicode.
- WhatsApp usa negritas con un solo asterisco.
- Usa nombre de pila, monto confirmado y bimestre/cuatrimestre.
- I2 se presenta como último nivel.
- Si no hay monto confirmable, no inventa una cifra.
- En aplicados muestra No enviar.
- No envía automáticamente ni escribe hojas.

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

CS21A41 está guardado en GitHub main, pero producción no está confirmada. Ejecutar QA visual del código, Consulta, tabla completa y WA.

---
