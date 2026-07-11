# BIBLIA DELTA ACTUAL — F98.4-Z6-CS21A38

Esta Biblia Delta fija las reglas aprobadas hasta el corte del 10-jul-2026.

## 1. Versiones

- Backend canónico: CS21A34.
- Frontend activo: CS21A38.
- Toda modificación de backend se entrega como `Code.gs` completo.
- No instalar fragmentos ni afirmar despliegue sin evidencia.

## 2. Vista compacta de Seguimiento inmediato

- La tabla debe caber completa dentro del panel de escritorio sin scroll horizontal.
- La columna `Desembolso` no debe mostrarse.
- Las columnas vigentes son: Estudiante, Movimiento, Periodo/nivel, Campus, Detectado y WA.
- La tabla usa ancho `100%`, `table-layout: fixed` y no fuerza `min-width`.
- Nombres, grupos y metadatos largos se truncan visualmente con elipsis; el valor completo permanece en `title`.
- La fecha detectada se presenta en formato compacto y conserva fecha/hora completa en tooltip.
- Las filas deben ser bajas y densas, sin perder la identificación del estudiante.

## 3. Botones de seguimiento y WA

- `DATOS.COMENTARIO_ADMIN` vacío → píldora pequeña `✎ Seguimiento`.
- Cualquier contenido → píldora violeta pequeña `✓ Revisado`.
- La nota completa continúa en el modal y persiste entre sesiones.
- El botón de WhatsApp se llama `WA Pago` y debe permanecer visible en su propia columna.
- Un movimiento `Aplicado en sistema` muestra `No enviar` y no permite preparar solicitud de cobro.

## 4. Texto WA preservado

- Solo prepara texto; la imagen se adjunta manualmente.
- Usa el nombre de pila.
- Consulta `getEstudiante` para obtener el monto pendiente del nivel.
- Identifica bimestre o cuatrimestre.
- I2 se presenta como último nivel.
- Si no existe monto confirmable, no inventa una cifra.
- No envía automáticamente ni escribe en hojas.

Texto base:

> ¡Buenas noticias [Nombre]! 🥳
>
> CONAPE nos ha informado que el desembolso ya fue acreditado en su cuenta.
>
> Le solicitamos realizar el pago a la Academia a la mayor brevedad posible, para mantener su expediente al día y evitar atrasos en el desembolso del rubro de sostenimiento.

## 5. Aplicar pago dentro de Consulta individual · CS21A36

- El botón `Pago` no saca al usuario de Consulta individual.
- Existe una sola búsqueda de comprobante por intento.
- Se revalida al seleccionar y antes de confirmar.
- Matrícula, Cuotas, Certificado, Programa Completo y TOEIC usan controles `− / +`.
- Los cargos especiales requieren monto exacto y `CARGO_ID`.
- Los intentos históricos son de solo lectura.
- Después de aplicar se refresca la misma ficha.

El frontend no escribe directamente en hojas financieras. Apps Script conserva la autoridad sobre grupo, intento, deuda, saldo, reglas, recibos, rollback, idempotencia y sincronización CONAPE. Nunca se mueven pagos entre niveles o intentos.

## 6. Fuente oficial de morosidad CONAPE

- Spreadsheet ID `1Q9QTNc2009M6PqbNW2_WjYBOlqCMhiBjrenun88L5yg`.
- Archivo `7-morosidad`.
- Pestaña `Hoja 1`.

Regla: 01–04=P1, 05–08=P2, 09–12=P3; `NO`=aplicado, `SI`=pendiente y sin fila exacta=revisión.

## 7. Reglas críticas generales

- No modificar directamente `DATOS`, `ESTATUS`, `GRUPOS`, `INTENTOS_ACADEMICOS` o CONAPE desde estas interfaces.
- No crear triggers automáticos para CONAPE.
- No confundir código guardado con producción desplegada.
- Antes de producción, ejecutar QA visual sin scroll y confirmar que WA permanece visible.
