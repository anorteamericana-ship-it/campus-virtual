# C2 PAGOS · REBASE DE CONTRATO SOBRE MAIN · 2026-09-11

## Baseline

- Repositorio: `anorteamericana-ship-it/campus-virtual`.
- Base: `main@67f8ad61d89cebba38204145d41165f4ca61e43c`.
- Evidencia: E0 código actual + E1 histórica donde se indique expresamente.
- Esta unidad no ejecuta Apps Script, no toca Sheets/Drive de negocio y no realiza pagos.

## Precondición de C1B antes de C2 E4

El rehearsal histórico de C1B no puede usarse como baseline financiero porque reutilizó un `codigo_estudiante` ya presente en superficies históricas/financieras y generó fórmulas `REDONDEAR/SUMA` inválidas. Ambas causas fueron corregidas después en PROD.

Antes de cualquier C2 E4, el candidato modular exacto debe demostrar que conserva:

1. generador global v2 que considera todas las superficies contractuales de código;
2. productor de `ESTATUS.NOTA` con `ROUND(SUM(...),0)`;
3. ausencia de regresión de los hotfixes LIVE posteriores a C1B.

No se concede PASS funcional nuevo a C1B por mera existencia de los fixes en otro runtime.

## Contrato actual de `reportarPago`

`ReportarPagoModal` envía evidencia de negocio: número de comprobante, monto reportado y evidencia de imagen/base64 cuando existe. No se observa `request_id` ni otra clave de idempotencia en esta superficie.

Consecuencias:

- crea una solicitud/evidencia PENDIENTE; no equivale a aplicar dinero;
- un timeout o respuesta incierta no autoriza un retry ciego;
- antes de repetir debe consultarse el estado de la solicitud/evidencia;
- el rollback E4 debe contemplar la fila/solicitud y todo artefacto Drive creado, identificado por fixture/file ID exactos, no solo por `codigo_estudiante`.

## Contrato actual de `aplicarPago`

Las superficies actuales de aplicación financiera conservan `request_id`. Existe evidencia histórica E1 de replay idempotente con el mismo `request_id`.

Eso reduce el riesgo de doble aplicación, pero **idempotencia no es rollback**. El harness histórico no demuestra restauración del estado financiero posterior a una aplicación.

El primer C2 E4 exige antes del write:

- fixture sintético exclusivo;
- `request_id` único congelado;
- documento bancario sintético/QA, nunca movimiento real;
- snapshot exacto de todas las superficies tocadas por el handler efectivo;
- aliases reales de identidad, incluyendo `PAGOS_CAMPUS.CODIGO_EST` y `CEDULA` cuando correspondan;
- rollback implementado y probado sobre la identidad exacta del fixture;
- reread + diff posterior atribuible solamente al fixture.

Ante respuesta incierta: consultar estado por `request_id`/fixture antes de reintentar.

## Dictamen

- C2 E0/E1: **HABILITADO**.
- `reportarPago` E4: **STOP** hasta idempotencia/consulta-de-estado + rollback de evidencia demostrados.
- `aplicarPago` E4: **STOP** hasta rollback financiero demostrado, pese a conservar `request_id`.
- No reutilizar `scripts/real_qa_authenticated_cs21a138.mjs` como procedimiento E4: su replay histórico no restaura el estado escrito.
- PR #278 conserva valor histórico de auditoría, pero está apilado sobre ramas viejas y no debe fusionarse mecánicamente al `main` actual.

## Próxima unidad segura

Congelar el source efectivo backend de `reportarPago` y `aplicarPago` del candidato modular/rehearsal actual y enumerar, por handler, cada hoja/Drive/journal que puede mutar. Solo después construir el rollback C2 específico y un harness E1 que pruebe guardas sin ejecutar writes reales.
