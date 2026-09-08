# Rebeca · semántica del containment antes de R1 · auditoría E0/E1

Base exacta: PR #281 / `6606c5e34dfb58637c47c5c8c20204a0770f535e`.

## Hallazgo nuevo
El containment CS21A211 vigente es seguro hoy por su frontera `default-deny`, pero `_qa144DangerousFn_` es una **denylist léxica**, no un clasificador semántico de lectura vs escritura.

La expresión versionada incluye términos como `pago|payment|...|actualizar|...|matricula|...`, por lo que clasifica según substrings del selector. Al aplicarla a las siete rutas Rebeca inventariadas:

| selector | contrato CS21A211C | `_qa144DangerousFn_` |
|---|---|---|
| `agentGetCommercialConfig` | lectura con side effects técnicos | false |
| `agentGetPaymentStatus` | lectura con side effects técnicos | **true** |
| `agentGetRoutingDirectory` | lectura con side effects técnicos | false |
| `agentResolveContactContext` | lectura con side effects técnicos | false |
| `agentSubmitEnrollmentRequest` | business write | **false** |
| `agentUpdateProspectProgress` | business write | **false** |
| `agentReportPayment` | business write | true |

Por tanto hay dos tipos de desacople:
1. **false positive semántico**: `agentGetPaymentStatus` es lectura según CS21A211C, pero cae en `qa_write_blocked` por contener `payment`;
2. **false negative semántico**: `agentSubmitEnrollmentRequest` y `agentUpdateProspectProgress` son mutaciones según CS21A211C, pero la denylist no las reconoce como peligrosas.

Esto no abre hoy las dos mutaciones: al no estar en la allowlist estricta, terminan en `qa_endpoint_not_allowlisted`. La seguridad actual depende del **default-deny posterior**, no de que `_qa144DangerousFn_` modele correctamente el negocio.

## Riesgo para R1
Sería una mala idea reutilizar `_qa144DangerousFn_` como criterio para decidir qué rutas Rebeca pueden delegarse. Una futura allowlist secundaria construida como “si no es dangerous, permitir” podría tratar como lectura una mutación cuyo nombre no coincide con la regex.

R1 debe partir de una clasificación positiva por selector, separada en dos conjuntos contractuales:
- `READ_ALLOWLIST`: solo handlers demostrados de lectura, con proyección pública de campos y side effects técnicos inventariados;
- `WRITE_DENYLIST`/bloqueo explícito: toda mutación Rebeca permanece cerrada hasta un gate E4 separado.

No se debe inferir mutabilidad por nombre. Cada fila sigue requiriendo el source rehearsal exacto, handler, auth/wrappers, side effects y respuesta pública definidos en #281.

## Severidad y evidencia
`P2 · CONFIRMADO · E0` para diseño de containment/R1. No es P1/P0 porque las mutaciones siguen bloqueadas por default-deny en la frontera actual y no hay evidencia de handler alcanzado.

## PASS / STOP
PASS E0: demostrar byte/source la regex vigente y su clasificación real sobre los siete selectors.

STOP R1 si el diseño propuesto usa `_qa144DangerousFn_` para distinguir lecturas de escrituras, o si cualquier mutación entra en una allowlist de delegación antes de demostrar su contrato y gate independiente.

`R0_HANDLER_SOURCE=BLOCKED`; R1/R2/R3 continúan STOP. C0-SCHEMA62 continúa `BLOQUEADO_HUMANO`. No se modifica containment, backend ni runtime. E2/E3/E4: NO.
