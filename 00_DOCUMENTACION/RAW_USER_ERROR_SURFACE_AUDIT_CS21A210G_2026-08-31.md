# CS21A210G · Auditoría automática de errores técnicos visibles

Fecha: 2026-08-31 · Costa Rica

## Base

- Base exacta: PR #224 / `fix/shared-error-state-console-only-cs21a210f`
- SHA base: `ff862ce99db561c1711f929ceae99ddc0d9b6f64`
- Rama de auditoría: `audit/raw-user-error-surface-cs21a210g`

## Objetivo

Barrido de source sobre `src/` para localizar propagaciones directas de errores técnicos hacia sinks visibles sin pasar por una frontera segura.

## Primera pasada

Run `33437128616` con scanner V1: `HIGH_CONFIDENCE_FINDINGS=223`.

La pasada fue útil para descubrir amplitud, pero sobrecontó casos que no son fugas directas, por ejemplo:
- render de `state.error` que puede haber sido sanitizado antes;
- `success.message` y mensajes de negocio;
- códigos de login usados únicamente como llave de un mapa o condición;
- helpers locales como `captureErrorMessage()` ya dedicados a normalización.

La regresión CS21A210F y `git diff --check` pasaron en ese mismo run. El rojo fue exclusivamente el inventario de auditoría.

## Scanner V2

V2 se restringe a flujo **propiedad técnica cruda → sink visible directo**.

Marca:
- `setError`, `setErr`, `setErrLocal`, `setPrefillError`, notice/message/toast/alert con `.message` o `.error` directos;
- `setState/setData/dispatch` solo cuando una propiedad `error/err/message/msg/notice` recibe directamente `.message/.error`;
- `window.alert` con propiedad técnica cruda.

Excluye deliberadamente:
- render downstream de `state.error` por sí solo;
- `r.mensaje` de éxito/negocio si no se combina con `r.error`;
- `console.*` y `throw new Error(...)` internos;
- sinks envueltos en helpers reconocidos `*SafeUserError`, `normalizarMensajeErrorCampus`, `captureErrorMessage`, etc.;
- códigos backend que solo se comparan o se usan como índice de `ERR_MSG[data.error]`.

El análisis sigue siendo conservador: cada resultado V2 debe revisarse manualmente antes de modificar código.

## Política de reparación

No habrá reemplazo masivo. Los hallazgos confirmados se agruparán por superficie funcional y se corregirán con:
1. frontera segura local o compartida;
2. copy estable para UI;
3. diagnóstico en consola;
4. invariantes de endpoint/token/transporte;
5. guard específico + regresiones heredadas;
6. PR solo después de bootstrap verde.

## Límites

- Auditoría E0 de source.
- Esta rama no cambia funcionalidad.
- No Apps Script.
- No Drive ACL.
- No PROD.
- No merge automático.
