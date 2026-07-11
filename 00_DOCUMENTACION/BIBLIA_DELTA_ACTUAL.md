# BIBLIA DELTA ACTUAL — F98.4-Z6-CS21A40

Esta Biblia Delta fija las reglas aprobadas hasta el corte del 10-jul-2026.

## 1. Versiones

- Backend canónico: CS21A34.
- Frontend activo: CS21A40.
- Toda modificación de backend se entrega como `Code.gs` completo.
- No instalar fragmentos ni afirmar despliegue sin evidencia.

## 2. Mensaje WhatsApp de Seguimiento inmediato

- El botón se llama `WA Pago`.
- Solo prepara texto; la imagen se adjunta manualmente.
- El emoticono debe generarse con `String.fromCodePoint(0x1F389)` para producir `🎉` sin riesgo de `�`.
- WhatsApp usa negrita con un solo asterisco: `*texto*`.
- No usar `**texto**`.
- El saludo completo debe ir en negrita.
- Deben resaltarse la confirmación de acreditación, la solicitud de prontitud, el estado al día y el monto.

Texto base:

> *¡Buenas noticias, [Nombre]! 🎉*
>
> CONAPE nos ha informado que el *desembolso ya fue acreditado en su cuenta.*
>
> Le solicitamos realizar el pago a la Academia *a la mayor brevedad posible*, para mantener su expediente *al día* y evitar atrasos en el desembolso del rubro de sostenimiento.

Monto normal:

> *Monto correspondiente a [nivel] ([bimestre/cuatrimestre]): ₡[monto].*

Monto I2:

> *Monto correspondiente al último nivel, Intermedio II ([bimestre/cuatrimestre]): ₡[monto].*

## 3. Reglas dinámicas del mensaje

- Usa el nombre de pila.
- Consulta `getEstudiante` para obtener el monto pendiente vigente.
- Identifica bimestre o cuatrimestre.
- I2 se presenta como último nivel.
- Si no existe monto confirmable, no inventa una cifra.
- Un movimiento `Aplicado en sistema` muestra `No enviar`.
- No envía automáticamente ni escribe en hojas.

## 4. Identidad y vista compacta preservadas

- Nombre del estudiante grande y código/cédula destacados.
- La tabla debe caber completa sin scroll horizontal.
- La columna `Desembolso` no se muestra.
- Las columnas vigentes son: Estudiante, Movimiento, Periodo/nivel, Campus, Detectado y WA.
- `DATOS.COMENTARIO_ADMIN` vacío → `✎ Seguimiento`.
- Cualquier contenido → `✓ Revisado`.

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
- Antes de producción, probar el emoji, las negritas, el monto normal, I2 y un movimiento aplicado.
