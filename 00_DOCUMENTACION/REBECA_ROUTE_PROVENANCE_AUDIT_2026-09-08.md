# Rebeca · procedencia de las 7 rutas post-containment · auditoría E0/E1

Base exacta: PR #280 / `4f44fc55badf17e3b8d852ba27273e09c071fcf6`.

## Hallazgo nuevo
La superficie Rebeca post-containment contiene siete selectors, pero GitHub actual no aporta el mismo nivel de procedencia contractual para los siete.

CS21A90 histórico documenta explícitamente `agentGetCommercialConfig` y `agentResolveContactContext`, incluyendo HMAC, replay/cache y proyección pública/privacidad. En cambio, `agentGetPaymentStatus`, `agentGetRoutingDirectory`, `agentSubmitEnrollmentRequest`, `agentUpdateProspectProgress` y `agentReportPayment` aparecen en `ENDPOINT_MANUAL_REVIEW_CS21A211C_2026-09-02.md`, cuyo origen declarado es el snapshot local `QA_HEAD_20260901_215804Z` / aggregate `3e384ac34930e6a936a3f930db8819bd80124ef59f522ac1b5b11fee8f881ec6`.

En la fuente versionada buscable actual, `agentGetPaymentStatus` no aparece fuera de CS21A211C; la misma regla de procedencia debe aplicarse a las otras rutas sin contrato histórico versionado. Esto **no invalida** la clasificación CS21A211C: sí impide promover inventario detectado en un snapshot local a contrato de handler demostrado sin congelar el source exacto que produjo esa matriz.

## Consecuencia para R0/R1
Antes de diseñar o habilitar R1, cada selector debe tener una fila de procedencia:

`selector -> archivo rehearsal exacto -> símbolo/handler -> wrapper/auth previo -> side effects técnicos/negocio -> proyección pública -> evidencia/hash`.

Clasificación provisional:
- `agentGetCommercialConfig`: `HISTORICAL_CONTRACT_PRESENT · CURRENT_HANDLER_SOURCE_BLOCKED`.
- `agentResolveContactContext`: `HISTORICAL_CONTRACT_PRESENT · CURRENT_HANDLER_SOURCE_BLOCKED`.
- las otras cinco: `SNAPSHOT_INVENTORY_PRESENT · CURRENT_HANDLER_SOURCE_BLOCKED · CONTRACT_NOT_VERSIONED`.

No se debe escribir una frontera secundaria que delegue por nombre solamente. La allowlist R1 podrá contener únicamente selectors cuyo handler y cadena HMAC/timestamp/nonce/replay/rate/cache/proyección estén congelados desde el rehearsal actual.

## Privacidad
La garantía histórica de CS21A90 para Contact Context excluye cédula, correo completo, teléfono completo, dirección, claves, documentos y notas libres. Esa garantía **no debe extenderse por analogía** a `agentGetPaymentStatus` o `agentGetRoutingDirectory`; sus respuestas públicas deben inventariarse campo por campo desde el source rehearsal antes de R1.

## PASS / STOP
PASS E0 de esta auditoría: distinguir claramente contrato histórico, inventario de snapshot y source actual faltante.

STOP R1 mientras falte `90_REBECA_V8_Routing.js` (o el archivo efectivo equivalente) del rehearsal con hash y orden de wrappers. STOP también si cualquiera de las cinco rutas sin contrato versionado no puede vincularse a un handler exacto o si su respuesta pública no puede minimizarse por allowlist positiva de campos.

No se habilita ninguna ruta, no se modifica backend ni containment. E2/E3/E4: NO.
