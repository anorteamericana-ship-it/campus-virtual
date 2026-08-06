# CS21A183 · Release Candidate QA exacto

## Estado validado el 2026-08-06

- Apollo principal: PASS de preflight curricular.
- Apollo QA staging: PASS de preflight curricular.
- Apps Script QA: PASS manual.
- Cadena verificada: CS21A176 → CS21A180 → CS21A181 → CS21A183 → CS21A183-APOLLO-QA-FIX.
- Fuente curricular QA: `QA_STAGING_MASTER_ID`.
- `CONFIG_UNIDADES`: 64 unidades activas.
- `ACADEMIA_PLAY_BANK`: 320 ítems `GRAM_02` activos de tipo `ORDER`.
- Cinco ítems completos por unidad: PASS.
- Límite válido por sala: 3–5 oraciones.
- Deployment Apps Script QA: actualizado después del PASS manual.
- QA autenticada docente + dos estudiantes + móvil: pendiente.

## Composición Apps Script QA validada

En un único archivo `99_CS21A183_SENTENCE_ORDER_COMPLETO` se instaló en este orden:

1. `99_ACTUALIZACION_QA_CS21A183.gs`
2. `99B_VALIDACION_CURRICULAR_CS21A183.gs`
3. `99C_FIX_FUENTE_APOLLO_QA_CS21A183.gs`

El archivo está después de `98_ACTUALIZACION_QA_CS21A181`.

## Resultado final del verificador

```text
ok=true
version=CS21A183
sentence_order_live_supported=true
curriculum_guard=true
curriculum_units=64
active_gram_02_items=320
five_items_per_unit=true
curriculum_rows_complete=true
curriculum_source_required=true
curriculum_acknowledgement_required=true
duplicate_response_preserves_state=true
sentence_count_limits=3-5
curriculum_source=QA_STAGING_MASTER_ID
curriculum_source_fix=CS21A183-APOLLO-QA-FIX
```

## Workflow canónico

`.github/workflows/cs21a183-release-candidate.yml`

Este workflow valida exactamente la composición desplegada en QA: contratos acumulados, hotfix 99C fail-closed, frontend aislado, Playwright, paquete con 99 + 99B + 99C, manifiesto SHA-256 y smoke en puerto 4181.

## Regla de liberación

No fusionar ni desplegar producción hasta obtener:

1. Release Candidate CI verde.
2. QA autenticada docente + dos estudiantes para Memory Match y Sentence Order.
3. Validación móvil.
4. Prueba progresiva 2 → 5 → 10 → 25 clientes.
5. Release PR único contra `main` con rollback documentado.
