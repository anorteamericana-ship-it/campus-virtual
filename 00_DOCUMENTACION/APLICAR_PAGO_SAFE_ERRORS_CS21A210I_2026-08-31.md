# CS21A210I · Aplicar Pago · errores seguros sobre punta vigente

Fecha: 2026-08-31 · Costa Rica

## Base exacta

- Base: PR #225 / `fix/admin-status-safe-errors-cs21a210h`
- SHA base: `b8ca70c26a9fbd3529063650879f2ca4d59a760a`
- `src/aplicar_pago.jsx` base blob: `577b2fa4a4ba940dd07f8e6b7ca441b4947c7acf`
- Rama: `fix/aplicar-pago-safe-errors-cs21a210i`

## Hallazgo

El scanner CS21A210G V2 encontró ocho sinks directos en la pantalla independiente `Aplicar Pago`:

1. `data.error` al buscar estudiante;
2. `e.message` en el catch de búsqueda;
3. `data.error` al cargar comprobantes;
4. `e.message` en el catch de comprobantes;
5. `data.error` al aplicar el pago;
6. `e.message` en el catch de aplicación;
7. `data.error` en el prefill desde accesos rápidos;
8. `e.message` en el catch del prefill.

El transporte `postAP()` puede producir diagnóstico técnico de backend, endpoint, HTML/JSON, HTTP, timeout o red. Esos detalles no deben cruzar a la UI del operador.

## Corrección

Único archivo funcional: `src/aplicar_pago.jsx`.

Se agrega `apSafeUserError(raw, fallback, context)`:
- conserva mensajes humanos de negocio;
- oculta códigos y detalles técnicos mediante `console.warn`;
- usa fallbacks específicos para estudiante, comprobantes, aplicación y acceso rápido.

Los ocho sinks directos pasan por la frontera segura.

## Invariantes

No cambia:
- `postAP()`;
- token en POST body;
- `getEstudiante`;
- `getComprobantes`;
- `aplicarPago`;
- `request_id` e idempotencia;
- documento bancario;
- monto total;
- rubros y cantidades;
- cálculo de saldo;
- certificado / Programa Completo / TOEIC / otros cargos;
- comportamiento de sincronización CONAPE;
- Apps Script;
- Drive ACL;
- `main`;
- producción.

## QA

`qa_aplicar_pago_safe_errors_cs21a210i.mjs` exige:
- helper y logging técnico en consola;
- los ocho sinks crudos retirados;
- cuatro contextos seguros presentes;
- token, endpoints, request_id, monto y rubros preservados;
- CONAPE result behavior preservado;
- scope final exacto de cuatro rutas con `--exact-scope`.

El bootstrap aplica preimágenes exactas. Después de verde, la rama se reconstruye como un único commit sobre #225 sin artefactos bootstrap antes de abrir PR.

## Evidencia

- E0: source + guard.
- E1: pendiente de bootstrap/Actions y checks del PR.
- E2 autenticado/runtime: NO demostrado.

## Fronteras

- NO PROD
- NO AUTO-MERGE
- NO Apps Script write/push/deploy
- NO Drive ACL changes
- NO material deletions
- NO cambio de `main`
