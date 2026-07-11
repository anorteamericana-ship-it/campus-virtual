# BIBLIA DELTA ACTUAL — F98.4-Z6-CS21A41

Esta Biblia Delta fija las reglas aprobadas hasta el corte del 10-jul-2026.

## 1. Versiones

- Backend canónico: CS21A34.
- Frontend activo: CS21A41.
- Toda modificación de backend se entrega como `Code.gs` completo.
- No instalar fragmentos ni afirmar despliegue sin evidencia.

## 2. Código primero en Seguimiento inmediato

- El código del estudiante debe ser el primer elemento visible de cada fila.
- Debe aparecer antes del nombre completo.
- Tamaño de referencia en escritorio: 19 px, peso fuerte y fondo azul institucional.
- Debe estar dentro de un campo de solo lectura.
- Al hacer clic, el valor completo queda seleccionado para copiar con `Ctrl + C`.
- El texto seleccionado debe contener únicamente el código, nunca la cédula.
- Debajo se muestran el nombre, la cédula y `Seguimiento` / `Revisado`.
- El ajuste no modifica el código registrado ni ninguna fuente de identidad.

## 3. Vista compacta preservada

- La tabla debe caber completa dentro del panel de escritorio sin scroll horizontal.
- La columna `Desembolso` no debe mostrarse.
- Las columnas vigentes son: Estudiante, Movimiento, Periodo/nivel, Campus, Detectado y WA.
- La primera columna conserva prioridad visual sin ocultar `WA Pago`.
- La fecha detectada permanece compacta.

## 4. Mensaje WhatsApp preservado

- El botón se llama `WA Pago`.
- Solo prepara texto; la imagen se adjunta manualmente.
- El emoticono se genera con `String.fromCodePoint(0x1F389)`.
- WhatsApp usa negrita con un solo asterisco: `*texto*`.
- Usa el nombre de pila.
- Consulta `getEstudiante` para obtener el monto pendiente vigente.
- Identifica bimestre o cuatrimestre.
- I2 se presenta como último nivel.
- Si no existe monto confirmable, no inventa una cifra.
- Un movimiento aplicado muestra `No enviar`.

## 5. Seguimiento y Consulta individual

- `DATOS.COMENTARIO_ADMIN` vacío → `Seguimiento`.
- Cualquier contenido → `Revisado`.
- El acceso `Consulta` debe continuar tomando el código correcto incluso después de separar visualmente código y cédula.
- El botón `Pago` de Consulta individual no saca al usuario del expediente.
- Existe una sola búsqueda de comprobante por intento.
- Se revalida al seleccionar y antes de confirmar.
- Los cargos especiales requieren monto exacto y `CARGO_ID`.
- Los intentos históricos son de solo lectura.

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
- Antes de producción, probar selección/copia del código, Consulta individual, ausencia de scroll y WA visible.
