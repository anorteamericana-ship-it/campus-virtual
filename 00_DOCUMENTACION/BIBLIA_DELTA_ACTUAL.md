# BIBLIA DELTA ACTUAL — F98.4-Z6-CS21A42

Esta Biblia Delta fija las reglas aprobadas hasta el corte del 10-jul-2026.

## 1. Versiones

- Backend canónico: CS21A42.
- Frontend activo: CS21A42.
- Toda modificación de backend se entrega como `Code.gs` completo.
- No instalar fragmentos ni afirmar despliegue sin evidencia.

## 2. Consulta individual: lectura real

- `getEstudiante` puede usar un caché corto para rendimiento durante lecturas normales.
- Después de cualquier escritura crítica debe invalidarse el caché individual.
- `getEstudianteFresh` es la ruta obligatoria inmediatamente después de cambiar estatus, aplicar pago, emitir certificado, configurar TOEIC, cambiar grupo o revertir un cambio.
- La ventana de Cambio de estatus no debe cerrarse hasta que la ficha real posterior a la escritura haya sido reconstruida.
- Si la lectura fresca falla, la ventana permanece abierta y muestra el error.
- No usar una recarga total inmediata como sustituto de la lectura real.

## 3. Rendimiento

- `getConsultaIndividualFresh` agrupa ficha, asistencia, comentario administrativo e historial en una sola respuesta.
- Las solicitudes simultáneas de Consulta individual deben compartir la misma lectura agrupada.
- La optimización no puede sustituir datos reales por valores vacíos ni mezclar respuestas de distintos momentos.

## 4. Certificado: dos estados independientes

El panel debe mostrar siempre:

1. **Pago**: `PAGADO` o `PENDIENTE ₡...`.
2. **Documento**: `EMITIDO` o `POR EMITIR`.

Reglas:

- Pago completo sin `REG_CERTIFICADOS` = `Pago PAGADO` + `Documento POR EMITIR`.
- Registro oficial existente = `Documento EMITIDO`.
- Saldo real = `Pago PENDIENTE`.
- Nunca presentar `POR EMITIR` como deuda financiera.
- El certificado puede estar pagado antes de emitirse; son procesos distintos.

## 5. Asignación financiera por intento

- Los movimientos de certificado usan `grupos_certificado_aplicados`.
- Matrícula, cuotas, Programa Completo y TOEIC usan `grupos_pago_aplicados`.
- Una coincidencia exacta del grupo del movimiento con el intento tiene prioridad.
- Si existe un único intento del nivel, se permite una asignación segura a ese intento único.
- Si existen varios intentos y no hay evidencia suficiente, el movimiento queda sin asignar para revisión; nunca se reparte por conveniencia.
- Nunca mover pagos entre niveles o intentos.

## 6. Caso de control 17110

La lectura real esperada es:

- B1 APR, certificado emitido.
- B2 APR, certificado pagado y documento por emitir.
- I1 CA.
- I2 PE.

B2 debe mostrar `Pago PAGADO` y `Documento POR EMITIR`.

## 7. Aplicar pago dentro de Consulta individual

- Una sola búsqueda de comprobante por intento vigente.
- Revalidación al seleccionar y antes de aplicar.
- Controles por rubro.
- Cargos especiales con `CARGO_ID` y monto exacto.
- Intentos históricos de solo lectura.
- El frontend no escribe directamente en hojas financieras.
- Apps Script conserva la autoridad sobre grupo, intento, deuda, saldo, recibos, rollback, idempotencia y CONAPE.

## 8. Seguimiento inmediato preservado

- Código del estudiante primero y seleccionable.
- Tabla sin scroll horizontal.
- Columna `Desembolso` eliminada.
- `WA Pago` visible.
- `Seguimiento` / `Revisado` persiste en `DATOS.COMENTARIO_ADMIN`.
- Mensaje WA con emoticono Unicode seguro y negrita de un asterisco.

## 9. Fuente oficial de morosidad CONAPE

- Spreadsheet ID `1Q9QTNc2009M6PqbNW2_WjYBOlqCMhiBjrenun88L5yg`.
- Archivo `7-morosidad`.
- Pestaña `Hoja 1`.
- Regla: 01–04=P1, 05–08=P2, 09–12=P3; `NO`=aplicado, `SI`=pendiente y sin fila exacta=revisión.

## 10. Reglas críticas generales

- No modificar directamente `DATOS`, `ESTATUS`, `GRUPOS`, `INTENTOS_ACADEMICOS` o CONAPE desde el frontend.
- No crear triggers automáticos para CONAPE.
- No confundir código guardado con producción desplegada.
- Antes de producción, probar el caso 17110, cambio de estatus sin Ctrl+R y una aplicación de pago controlada.
