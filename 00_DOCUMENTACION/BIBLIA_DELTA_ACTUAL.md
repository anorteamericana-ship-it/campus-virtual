# BIBLIA DELTA ACTUAL — F98.4-Z6-CS21A37

Esta Biblia Delta fija las reglas aprobadas hasta el corte del 10-jul-2026.

## 1. Versiones

- Backend canónico: CS21A34.
- Frontend activo: CS21A37.
- Toda modificación de backend se entrega como `Code.gs` completo.
- No instalar fragmentos ni afirmar despliegue sin evidencia.

## 2. Texto WA de Seguimiento inmediato

- El botón se llama `WA Solicitar pago`.
- Solo prepara texto; la imagen se adjunta manualmente.
- El texto base es:

> ¡Buenas noticias [Nombre]! 🥳
>
> CONAPE nos ha informado que el desembolso ya fue acreditado en su cuenta.
>
> Le solicitamos realizar el pago a la Academia a la mayor brevedad posible, para mantener su expediente al día y evitar atrasos en el desembolso del rubro de sostenimiento.

- El nombre debe ser el nombre de pila, no el primer apellido.
- Al pulsar WA se consulta `getEstudiante` para obtener la deuda vigente del nivel.
- B1, B2 e I1 agregan nivel, bimestre/cuatrimestre y monto.
- I2 se identifica como último nivel y agrega el monto vigente incluyendo los rubros pendientes que correspondan.
- Si no existe monto confirmable, se conserva el texto base sin inventar una cifra.
- Un movimiento `Aplicado en sistema` no puede mostrar un mensaje para solicitar pago; debe indicar `Aplicado · no enviar cobro`.
- El botón no envía automáticamente ni modifica datos.

## 3. Origen del monto WA

Monto pendiente del nivel:

- Matrícula pendiente.
- Cuotas pendientes.
- Certificado pendiente.
- En I2: Programa Completo y TOEIC pendientes cuando correspondan.

Fuente principal: `getEstudiante`. Respaldo: `collections.rows` con coincidencia por código + nivel. `appliedAmount` no representa el costo del nivel y no debe usarse para este mensaje.

## 4. Aplicar pago dentro de Consulta individual · CS21A36

- El botón `Pago` no saca al usuario de Consulta individual.
- Existe una sola búsqueda de comprobante por intento.
- Se revalida al seleccionar y antes de confirmar.
- Matrícula, Cuotas, Certificado, Programa Completo y TOEIC usan controles `− / +`.
- Los cargos especiales requieren monto exacto y `CARGO_ID`.
- Los intentos históricos son de solo lectura.
- Después de aplicar se refresca la misma ficha.

El frontend no escribe directamente en hojas financieras. Apps Script conserva la autoridad sobre grupo, intento, deuda, saldo, reglas, recibos, rollback, idempotencia y sincronización CONAPE. Nunca se mueven pagos entre niveles o intentos.

## 5. Fuente oficial de morosidad CONAPE

El único origen válido para clasificar Seguimiento inmediato es:

- Spreadsheet ID `1Q9QTNc2009M6PqbNW2_WjYBOlqCMhiBjrenun88L5yg`.
- Archivo `7-morosidad`.
- Pestaña `Hoja 1`.

Regla: 01–04=P1, 05–08=P2, 09–12=P3; `NO`=aplicado, `SI`=pendiente y sin fila exacta=revisión.

## 6. Detalle revisado preservado

- `DATOS.COMENTARIO_ADMIN` vacío: botón beige.
- Cualquier contenido: botón violeta con `✓ REVISADO · CON SEGUIMIENTO`.
- Esta señal no modifica pagos, mora ni clasificación CONAPE.

## 7. Reglas críticas generales

- No modificar directamente `DATOS`, `ESTATUS`, `GRUPOS`, `INTENTOS_ACADEMICOS` o CONAPE desde estas interfaces.
- No crear triggers automáticos para CONAPE.
- No confundir código guardado con producción desplegada.
- Antes de producción, ejecutar QA con nombre, monto, bimestre, cuatrimestre, I2 y movimiento ya aplicado.