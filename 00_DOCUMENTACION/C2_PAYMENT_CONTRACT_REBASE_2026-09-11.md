# C2 PAGOS · REBASE DE CONTRATO SOBRE MAIN · 2026-09-11

## Baseline

- Repositorio: `anorteamericana-ship-it/campus-virtual`.
- Base inicial: `main@67f8ad61d89cebba38204145d41165f4ca61e43c`.
- Rebase C2 integrado en `main@0b3e46388c83d5dea363d756942adeca263f60e9`.
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

## Frontera de resultado incierto / retry

El `request_id` solo protege contra replay si la misma operación conserva la misma clave después de un timeout, una respuesta inválida o un `{ok:false}`. Generar una clave nueva después de una respuesta incierta destruiría la garantía de idempotencia y permitiría que una aplicación ya ejecutada se enviara como una operación distinta.

El contrato frontend queda congelado así:

- `src/aplicar_pago.jsx`: crea `request_id` antes del POST; un HTTP 200 con `data.ok !== true` retorna por error sin limpiar la clave; la limpia únicamente después de `data.ok === true`.
- `src/admin_students_inline_payment_cs21a36.jsx`: `postInline` lanza error si HTTP o `data.ok` no son exitosos; por tanto el reset posterior al `await` solo corre tras éxito confirmado.
- En la superficie inline, un cambio real del payload invalida la clave anterior mediante `payloadSignature`; reintentar exactamente el mismo payload después de un error conserva la misma clave mientras el componente siga montado.
- Cerrar/recrear la UI no constituye verificación de estado. Ante resultado incierto, el procedimiento operativo sigue siendo consultar backend/fixture antes de iniciar un nuevo intento.

El gate `qa_c2_payment_contract_main_20260911.mjs` debe fallar si el reset del `request_id` se mueve antes de la comprobación de éxito o si la superficie inline deja de fallar cerrada ante `data.ok !== true`.

## Límite actual del source backend

GitHub `main` demuestra las superficies frontend y los harness/guards históricos, pero no contiene como source versionado el Apps Script efectivo de `CAMPUS_MODULAR_REHEARSAL_QA_CS21A211`. El conector Drive disponible permite verificar el checkpoint y la identidad documental del rehearsal, pero no recuperar sus 27 fuentes Apps Script como archivos de código.

Por eso todavía **no** se declara congelado el inventario de side effects backend de `reportarPago`/`aplicarPago`. Antes de C2 E4 debe existir un fresh clone/read del rehearsal efectivo y deben registrarse hashes + definición efectiva de ambos handlers y cada superficie que mutan. Inferir ese inventario desde PR #278 o desde frontend sería una mala sustitución de evidencia runtime.

## Dictamen

- C2 E0/E1: **HABILITADO**.
- `reportarPago` E4: **STOP** hasta idempotencia/consulta-de-estado + rollback de evidencia demostrados.
- `aplicarPago` E4: **STOP** hasta rollback financiero demostrado, pese a conservar `request_id`.
- `aplicarPago` retry con el mismo payload: la clave debe conservarse ante resultado incierto; no se genera una operación nueva por conveniencia.
- No reutilizar `scripts/real_qa_authenticated_cs21a138.mjs` como procedimiento E4: su replay histórico no restaura el estado escrito.
- PR #278 conserva valor histórico de auditoría, pero está apilado sobre ramas viejas y no debe fusionarse mecánicamente al `main` actual.

## Próxima unidad segura

Congelar el source efectivo backend de `reportarPago` y `aplicarPago` del candidato modular/rehearsal actual y enumerar, por handler, cada hoja/Drive/journal que puede mutar. Solo después construir el rollback C2 específico y un harness E1 que pruebe guardas sin ejecutar writes reales.
