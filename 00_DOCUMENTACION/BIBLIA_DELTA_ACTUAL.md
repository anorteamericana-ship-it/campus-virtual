# BIBLIA DELTA ACTUAL — F98.4-Z6-CS21A39

Esta Biblia Delta fija las reglas aprobadas hasta el corte del 10-jul-2026.

## 1. Versiones

- Backend canónico: CS21A34.
- Frontend activo: CS21A39.
- Toda modificación de backend se entrega como `Code.gs` completo.
- No instalar fragmentos ni afirmar despliegue sin evidencia.

## 2. Identidad visible en Seguimiento inmediato

- El nombre del estudiante debe tener prioridad visual dentro de la primera columna.
- Tamaño de referencia en escritorio: 13.5 px, peso fuerte y color azul institucional.
- La línea con cédula y código debe ser legible sin zoom: 10.2 px, peso fuerte, fondo azul claro y borde visible.
- La primera columna debe usar 31% del ancho total.
- En pantallas de hasta 1180 px se permite una reducción moderada de tipografía para conservar la fila completa.
- El ajuste es exclusivamente visual: no cambia la fuente de identidad, la relación con `DATOS` ni el vínculo CONAPE.

## 3. Vista compacta preservada

- La tabla debe caber completa dentro del panel de escritorio sin scroll horizontal.
- La columna `Desembolso` no debe mostrarse.
- Las columnas vigentes son: Estudiante, Movimiento, Periodo/nivel, Campus, Detectado y WA.
- La tabla usa ancho `100%`, `table-layout: fixed` y no fuerza `min-width`.
- Nombres, grupos y metadatos largos pueden usar elipsis; el valor completo permanece en `title`.
- La fecha detectada se presenta en formato compacto y conserva fecha/hora completa en tooltip.

## 4. Botones de seguimiento y WA

- `DATOS.COMENTARIO_ADMIN` vacío → píldora pequeña `✎ Seguimiento`.
- Cualquier contenido → píldora violeta pequeña `✓ Revisado`.
- La nota completa continúa en el modal y persiste entre sesiones.
- El botón de WhatsApp se llama `WA Pago` y permanece visible en su propia columna.
- Un movimiento `Aplicado en sistema` muestra `No enviar` y no permite preparar solicitud de cobro.

## 5. Texto WA preservado

- Solo prepara texto; la imagen se adjunta manualmente.
- Usa el nombre de pila.
- Consulta `getEstudiante` para obtener el monto pendiente del nivel.
- Identifica bimestre o cuatrimestre.
- I2 se presenta como último nivel.
- Si no existe monto confirmable, no inventa una cifra.
- No envía automáticamente ni escribe en hojas.

## 6. Aplicar pago dentro de Consulta individual · CS21A36

- El botón `Pago` no saca al usuario de Consulta individual.
- Existe una sola búsqueda de comprobante por intento.
- Se revalida al seleccionar y antes de confirmar.
- Matrícula, Cuotas, Certificado, Programa Completo y TOEIC usan controles `− / +`.
- Los cargos especiales requieren monto exacto y `CARGO_ID`.
- Los intentos históricos son de solo lectura.
- Después de aplicar se refresca la misma ficha.

El frontend no escribe directamente en hojas financieras. Apps Script conserva la autoridad sobre grupo, intento, deuda, saldo, reglas, recibos, rollback, idempotencia y sincronización CONAPE. Nunca se mueven pagos entre niveles o intentos.

## 7. Fuente oficial de morosidad CONAPE

- Spreadsheet ID `1Q9QTNc2009M6PqbNW2_WjYBOlqCMhiBjrenun88L5yg`.
- Archivo `7-morosidad`.
- Pestaña `Hoja 1`.

Regla: 01–04=P1, 05–08=P2, 09–12=P3; `NO`=aplicado, `SI`=pendiente y sin fila exacta=revisión.

## 8. Reglas críticas generales

- No modificar directamente `DATOS`, `ESTATUS`, `GRUPOS`, `INTENTOS_ACADEMICOS` o CONAPE desde estas interfaces.
- No crear triggers automáticos para CONAPE.
- No confundir código guardado con producción desplegada.
- Antes de producción, ejecutar QA visual confirmando nombre, código, ausencia de scroll y WA visible.
