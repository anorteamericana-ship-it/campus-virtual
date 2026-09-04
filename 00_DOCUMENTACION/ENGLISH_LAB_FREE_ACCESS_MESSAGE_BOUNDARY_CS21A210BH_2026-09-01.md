# CS21A210BH · English LAB Gratis · auditoría de frontera de mensajes

Base exacta: PR #259 / `564a341445cdfba90fd40ded9198c48b09785e54`.

## Motivo
El scanner V3 residual marca una línea en `src/english_lab_free_access_cs21a66.js` asociada a `sessionStorage.setItem(...)`. Esa línea aislada sí es un falso positivo como setter UI, pero la conclusión previa "no hay fuga visible" era demasiado amplia: el archivo contiene otras rutas de data-flow que proyectan texto backend/sesión a la UI de English LAB Gratis.

## Ownership efectivo
`campus.html` carga directamente `src/english_lab_free_access_cs21a66.js?v=F98.4Z6CS13`.

Preimágenes congeladas en #259:
- `src/english_lab_free_access_cs21a66.js`: blob `75525ac6f6606c77b736070e5b12824d239f48b7`;
- `campus.html`: blob `c1a3b3b9bb44593b311bf674a771335e5c517ca4`.

## Data-flow efectivo
`AccessMessage` construye el cuerpo visible con:

`current.message || 'Tu prematrícula todavía no ha sido aprobada...'`

Ese `current.message` puede provenir de cuatro fronteras no sanitizadas de forma local:
1. sesión inicial: `user.english_lab_gratis_mensaje` dentro de `baseState(user)`;
2. priming externo: `source.mensaje || source.english_lab_gratis_mensaje` dentro de `primeAccess(input)`;
3. respuesta exitosa de `freeUserEnglishLabAccess`: `response.mensaje` dentro de `checkAccess()`;
4. error de transporte/backend: `post()` lanza `data.mensaje || data.error || HTTP ...`, el catch copia `error.message` a `state.message`.

La proyección es efectiva cuando el usuario es free/prematrícula y `access.allowed !== true`; `AcademiaPlayViewCS21A71` retorna entonces `AccessMessage`.

## Clasificación
- El finding V3 puntual sobre `sessionStorage.setItem(...)`: **FALSE_POSITIVE_SCANNER** como sink UI.
- La superficie completa `state.message -> AccessMessage`: **EFFECTIVE_VISIBLE** por data-flow.
- Severidad propuesta E0: P2 hasta demostrar el contenido real del backend desplegado; puede revelar texto técnico arbitrario si el endpoint responde `error`/`mensaje` no apto para usuario.

## Restricción de corrección
No se modifica `src/english_lab_free_access_cs21a66.js` en este corte. El workflow global `.github/workflows/qa-english-lab-source-truth-guard.yml` falla cerrado si cambia `src/english_lab*` y no existe `scripts/qa_cs21a202_source_truth.mjs` en la base. Esa condición está vigente en #259.

Por tanto, el siguiente fix funcional queda bloqueado junto con la decisión CS21A202 ya documentada; no corresponde eludir el guard ni fabricar un sustituto reducido.

## Contrato congelado
Este corte no cambia `freeUserEnglishLabAccess`, cache/sessionStorage, TTL, detección de free user, menú English LAB, `AcademiaPlayView`, autorización, payload/token, Apps Script, Drive ACL, `main` ni PROD.

E0: cerrado. E1: audit/source guard. E2: **NO**.
`BACKEND CURRENT SNAPSHOT UNVERIFIED` vigente.
