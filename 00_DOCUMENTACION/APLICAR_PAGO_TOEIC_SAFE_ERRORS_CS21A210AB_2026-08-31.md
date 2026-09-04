# CS21A210AB · Aplicar Pago · TOEIC · errores seguros

Fecha: 2026-08-31

## Base
- PR #238 / `fix/free-prospect-portal-safe-errors-cs21a210z`
- base exacta: `b0117d06435fd4b96a57a979c046ce6ed145117e`
- preimagen `src/aplicar_pago.jsx`: `68f3da185a347827298c5e2220fb2eb744fdbb87`

## Hallazgo
CS21A210AA V3 midió **76 hallazgos / 22 archivos** y encontró dos cruces raw en `ToeicDecisionAP`:
1. respuesta backend de `configurarToeicEstudiante` → `data.error`;
2. excepción de transporte → concatenación de `e.message`.

`src/aplicar_pago.jsx` ya conserva el hardening CS21A210I validado en PR #226, incluyendo `apSafeUserError`. Los dos sinks actuales pertenecen al bloque TOEIC añadido después, por lo que este corte extiende la frontera existente sin reprogramar el flujo de pagos.

## Corrección
- agrega `configurarToeicEstudiante` al filtro técnico de `apSafeUserError`;
- respuesta backend TOEIC pasa por `apSafeUserError`;
- excepción TOEIC pasa por `apSafeUserError`;
- los fallbacks empiezan con `Error` para conservar el tono visual rojo existente.

## Contratos congelados
- `postAP()` / POST text/plain;
- token en body;
- `configurarToeicEstudiante`;
- payload `codigo`, `omitido`, `motivo`;
- motivo obligatorio al omitir;
- condición `cobrable` y bloqueo si TOEIC ya está pagado;
- actualización de `data.ficha` a `estData`;
- mensajes de éxito de TOEIC;
- semántica general de pagos y guard CS21A210I.

## Evidencia
Bootstrap exacto `33450110495`: **SUCCESS completo**:
- preimagen exacta PASS;
- patch AB PASS;
- guard AB PASS;
- regresión CS21A210I PASS;
- regresión CS21A210Z PASS;
- `git diff --check` PASS;
- scope funcional exacto `src/aplicar_pago.jsx` PASS.

Source temporal validado por Actions: `dd30816a3ed4ea35b4b1e8eefd5b614321f3da1e`.
Blob funcional validado: `5f67af62d0551a130a2af2f438b626eaa7ee4bd2`.

La rama final se reconstruye como un único commit directo sobre #238; patcher/bootstrap quedan fuera.

## Límite
- E0: sí.
- E1 source/QA: sí una vez que el commit final y checks de PR queden verdes.
- E2 autenticado/runtime: no demostrado.
- `BACKEND CURRENT SNAPSHOT UNVERIFIED`: vigente.
- Apps Script, Drive ACL, `main` y PROD: no tocados.

**SOURCE/QA ONLY · PAYMENT SEMANTICS PRESERVED · NO PROD · NO AUTO-MERGE**
