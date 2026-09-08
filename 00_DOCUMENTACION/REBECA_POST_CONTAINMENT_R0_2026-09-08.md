# Rebeca · frontera post-containment R0 · 2026-09-08

Base exacta: PR #273 / `14048346d5392a1ff0f9208bf9c42c07713ff019` sobre `main@6b747fdbb1aeb4d610ad54ace2ded856fc3f95cc`.

## Alcance

E0/E1 estático solamente. Este corte **no habilita Rebeca**, no modifica Apps Script funcional y no demuestra HMAC/runtime del handler histórico.

## Lo que sí puede demostrarse desde el containment versionado

El guard CS21A211 ejecuta, antes de delegar un POST:

1. parsea `fn`/`action` desde query y body;
2. exige que IDs/recursos QA sean válidos;
3. rechaza routing ambiguo cuando aparecen selectors distintos;
4. ofrece primero la frontera English LAB v2 si existe;
5. delega solo `englishlab*`, `academiaplay*`, `freeuserenglishlabaccess` o la allowlist core explícita;
6. rutas no delegadas que coinciden con el regex peligroso reciben `qa_write_blocked`;
7. cualquier otra ruta no allowlisted recibe `qa_endpoint_not_allowlisted`.

La allowlist GET es también explícita y no contiene rutas `agent*`.

## Siete rutas Rebeca actuales

La revisión manual CS21A211C clasifica:

### Lecturas con side effect técnico

- `agentGetCommercialConfig`
- `agentGetPaymentStatus`
- `agentGetRoutingDirectory`
- `agentResolveContactContext`

Las cuatro están fuera de las allowlists del guard primario, por lo que hoy quedan bloqueadas antes del handler Rebeca y antes de poder demostrar HMAC/replay/rate/cache end-to-end.

### Escrituras de negocio

- `agentSubmitEnrollmentRequest`
- `agentUpdateProspectProgress`
- `agentReportPayment`

Las tres quedan bloqueadas. Hay una diferencia útil para pruebas negativas: `agentReportPayment` contiene `payment` y cae en el regex peligroso, por lo que el error estático esperado es `qa_write_blocked`; `agentSubmitEnrollmentRequest` y `agentUpdateProspectProgress` no coinciden con el regex español/financiero actual y caen en el default `qa_endpoint_not_allowlisted`. **No se debe escribir una prueba que exija el mismo código de error para las tres; la invariancia importante es que ninguna llegue al handler.**

## Hallazgo R0-BOUNDARY-001

`CONFIRMADO · E0 · P2 de preparación`: la contención actual no tiene una frontera secundaria específica para Rebeca. El default-deny es correcto, pero una futura R1 no debe “simplemente agregar agent* a la allowlist core”, porque eso saltaría la separación requerida entre lecturas HMAC con estado técnico y lecturas Campus ordinarias.

## Hallazgo R0-BOUNDARY-002

`CONFIRMADO · E0 · P2 de QA`: los códigos de rechazo actuales no son uniformes entre las tres mutaciones Rebeca. Esto no es un defecto de seguridad —todas permanecen bloqueadas—, pero sí un caso límite para la batería R1/R3: probar acceso/side effects, no solo strings de error.

## R1 · contrato negativo preparado

Antes de habilitar una sola lectura, la prueba sintética debe congelar el source rehearsal exacto de `90_REBECA_V8_Routing.js` y demostrar:

- firma ausente → rechazo, cero lectura de negocio;
- firma inválida → rechazo, cero handler;
- timestamp expirado → rechazo;
- nonce repetido → rechazo;
- selector desconocido o typo → rechazo del guard secundario;
- `fn` y `action` distintos → `qa_route_ambiguous` en el guard primario;
- los cuatro selectors permitidos se comparan por igualdad exacta, no prefijo/regex amplio;
- las tres mutaciones permanecen inalcanzables incluso con HMAC válido;
- la proyección pública usa allowlist positiva de campos y excluye PII/secretos/notas libres;
- cache/rate/replay no permiten que una identidad/phone context contamine otra.

## Gate pendiente para cerrar R0

Falta una sola clase de evidencia: source rehearsal exacto de `90_REBECA_V8_Routing.js` (hash + contenido o snapshot verificable). La documentación CS21A90 de julio es histórica y solo detalla dos de las siete rutas actuales; no puede sustituir esa preimagen.

Estado: `R0_CONTAINMENT_BOUNDARY=PASS_E0`; `R0_HANDLER_SOURCE=BLOCKED`; `R1/R2/R3=STOP`.
