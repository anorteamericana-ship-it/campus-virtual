# CS21A199 · Admin · Finanzas inline · errores seguros

Fecha: 2026-08-29
Base canónica: PR #177 · `integration/admin-secondary-surfaces-cs21a198` · `07988ed9227514ad8ae63599bd662e937f6fcb4e`

## Hallazgo

`src/admin_students_inline_payment_cs21a36.jsx` aplica pagos reales desde Consulta individual y renderiza el estado `error` directamente en la interfaz.

Cuatro fronteras convertían excepciones en texto visible mediante `e.message`:

1. carga financiera de `getEstudiante`;
2. búsqueda de comprobantes;
3. selección/refresco de un comprobante;
4. aplicación de pago.

`postInline()` puede producir detalles técnicos como backend, timeout, endpoint, respuesta JSON inválida o códigos de transporte, por lo que esos detalles podían cruzar hasta el operador.

## Cambio

Se agrega `inlineFinanceSafeUserError(raw, fallback, context)` únicamente en la frontera de presentación.

Se preservan los mensajes humanos de negocio generados por el propio flujo, por ejemplo:
- intento histórico / grupo financiero vigente;
- comprobante agotado o sin saldo;
- cambio de saldo antes de aplicar;
- validaciones de rubros y montos.

Se ocultan de UI códigos y detalles técnicos de backend/red/HTTP/token/endpoints; el detalle queda en consola.

## No cambia

- `postInline`;
- `getEstudiante`;
- `getComprobantes`;
- `aplicarPago`;
- request_id / idempotencia;
- documento bancario, monto total o rubros enviados;
- reglas de certificado/programa/TOEIC;
- selección de cargos;
- confirmación previa;
- CONAPE sync;
- Apps Script, Drive ACL o producción.

## Evidencia esperada

- cuatro catches usan fallbacks específicos;
- no queda `e.message` directo hacia `setError` en las rutas guardadas;
- endpoints y payload de aplicación permanecen intactos;
- regresión CS21A198 y Panel Maestro canónico;
- `git diff --check`.

**DRAFT · UI ERROR BOUNDARY ONLY · PAYMENT LOGIC UNCHANGED · NO PROD · NO AUTO-MERGE**
