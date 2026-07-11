# BIBLIA DELTA ACTUAL — F98.4-Z6-CS21A36

Esta Biblia Delta fija las reglas aprobadas hasta el corte del 10-jul-2026.

## 1. Versiones

- Backend canónico: CS21A34.
- Frontend activo: CS21A36.
- Toda modificación de backend se entrega como `Code.gs` completo.
- No instalar fragmentos ni afirmar despliegue sin evidencia.

## 2. Aplicar pago dentro de Consulta individual

- El botón `Pago` no debe sacar al usuario de Consulta individual.
- El formulario se abre dentro del intento financiero vigente del nivel seleccionado.
- Debe existir una sola búsqueda de comprobante por intento, no una búsqueda separada por rubro.
- La búsqueda admite número de documento, fecha o descripción.
- Solo se presentan comprobantes con saldo real disponible.
- El comprobante se revalida al seleccionarlo y antes de confirmar.
- Matrícula, Cuotas, Certificado, Programa Completo y TOEIC se configuran con controles `− / +` dentro de sus tarjetas.
- Los cargos especiales pendientes se seleccionan por su registro real, monto exacto y `CARGO_ID`.
- La operación muestra estudiante, nivel, intento, grupo, comprobante, desglose, total y saldo posterior antes de confirmar.
- Después de aplicar, la misma Consulta individual debe refrescarse sin navegar a otra sección.
- Los intentos históricos son estrictamente de lectura.

## 3. Separación de responsabilidades

El frontend CS21A36 solo consulta, presenta y arma la solicitud. No puede escribir directamente en hojas financieras.

Los únicos endpoints permitidos son:

- `getEstudiante`
- `getComprobantes`
- `aplicarPago`

Apps Script conserva la autoridad final para:

- seleccionar el grupo e intento canónicos;
- bloquear `PE`, intentos históricos y grupos inconsistentes;
- calcular la deuda y el máximo por rubro;
- validar el saldo de `BDBANCARIO`;
- aplicar las reglas especiales de certificados, Programa Completo y TOEIC;
- validar cargos especiales por monto exacto;
- escribir en `PAGOS`, `OTROS PAGOS`, `PAGOS_CAMPUS` y `PAGOS_OPERACIONES`;
- actualizar `BDBANCARIO`;
- generar recibos;
- ejecutar rollback si una escritura falla;
- impedir duplicados mediante `request_id`;
- sincronizar CONAPE o dejar una alerta pendiente.

Nunca se deben mover pagos entre niveles o intentos. La interfaz no puede reemplazar las validaciones del backend.

## 4. Patrón contable preservado

Un mismo comprobante bancario puede dividirse entre varios rubros y generar varios recibos:

- Cuotas se registra en `PAGOS`.
- Matrícula, Certificado, Programa Completo, TOEIC y otros conceptos se registran en `OTROS PAGOS` según su cuenta.
- Todos los rubros aplicados quedan reflejados en `PAGOS_CAMPUS`.
- La operación completa queda auditada en `PAGOS_OPERACIONES`.

Ejemplo vigente de Básico II: ₡334.200 = Matrícula ₡20.000 + Cuotas ₡299.200 + Certificado ₡15.000.

## 5. Reglas especiales preservadas

- Certificado se cobra únicamente cuando el nivel y estado lo permiten.
- Programa Completo solo corresponde a I2, respeta nivelación y requisitos académicos y exige el certificado I2 cubierto o incluido en la misma operación.
- TOEIC solo corresponde a I2 y respeta inclusión u omisión administrativa.
- Un cargo especial no admite monto libre: debe aplicarse exactamente por su saldo registrado.
- Un comprobante agotado debe desaparecer de resultados o ser rechazado al revalidar.
- El saldo total seleccionado nunca puede exceder el saldo bancario vigente.

## 6. Fuente oficial de morosidad CONAPE

El único origen válido para clasificar Seguimiento inmediato es:

- Spreadsheet ID `1Q9QTNc2009M6PqbNW2_WjYBOlqCMhiBjrenun88L5yg`.
- Archivo `7-morosidad`.
- Pestaña `Hoja 1`.

La lectura debe abrir directamente ese archivo externo. La regla continúa: 01–04=P1, 05–08=P2, 09–12=P3; `NO`=aplicado, `SI`=pendiente y sin fila exacta=revisión.

## 7. Detalle revisado preservado

- `DATOS.COMENTARIO_ADMIN` vacío: botón beige.
- Cualquier contenido: botón violeta con `✓ REVISADO · CON SEGUIMIENTO`.
- Esta señal no modifica pagos, mora ni clasificación CONAPE.

## 8. Reglas críticas generales

- No modificar directamente `DATOS`, `ESTATUS`, `GRUPOS`, `INTENTOS_ACADEMICOS` o CONAPE desde la interfaz de pago.
- No crear triggers automáticos para CONAPE.
- No confundir código guardado con producción desplegada.
- Antes de producción, ejecutar QA financiero con un comprobante de prueba controlado.