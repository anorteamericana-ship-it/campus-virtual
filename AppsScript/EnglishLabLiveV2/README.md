# English LAB LIVE v2 · isolated core

Status: **E1 GREEN + E2 AUTH ADAPTER GREEN / NOT WIRED / NOT DEPLOYED**.

This directory is the clean-room implementation surface for English LAB LIVE v2. It is deliberately isolated from historical English LAB LIVE runtime code.

## Invariants

- No direct production or QA deployment hooks.
- No `doPost`/`doGet` ownership or wrapper reassignment.
- No legacy LIVE table writes or migrations.
- No Memory Match changes (`FROZEN_DEFERRED_NON_BLOCKING`).
- Browser identity is never authoritative.
- `SALA_MIXTA_AUTORIZADA` remains a product requirement: eligible authenticated students may join a valid mixed room without a same-group restriction.
- No answer/solution/explanation leak during READY, OPEN, or LOCKED.
- V2 storage uses dedicated `ENGLISH_LAB_LIVE_V2_*` tables and resolves columns by header name, never by assumed physical position.

## Current surface

### E1 · isolated server-authoritative core

- `00_Constants.js`: versions, states, capabilities, error codes, reserved fields.
- `01_Clock.js`: server-clock abstraction with injectable test provider.
- `02_CanonicalJson.js`: deterministic JSON representation for idempotency/integrity hashing.
- `03_Schema.js`: exact V2 table contracts and order-independent strict header validation.
- remaining E1 modules: state machine, idempotency, public-view guard, game registry, in-memory store, room/round engines, state service, content resolver and internal Dispatcher.

### E2 · Campus AuthAdapter boundary

- `22_CampusAuthAdapter.js` derives the internal actor from a validated Campus session, never from browser identity fields.
- student LIVE eligibility is read-only and strict against `ESTATUS`: security-critical headers must exist exactly once and only exact `CA` rows grant active enrollment;
- missing or duplicate security headers fail closed with `SCHEMA_UNHEALTHY`;
- `SALA_MIXTA_AUTORIZADA` is preserved: the canonical student home group is a snapshot, not a same-group join restriction;
- teacher authority comes from the canonical server group resolver (`f984z6iTeacherGroupsForSession`) with no fallback to browser/session-provided group claims;
- teacher LIVE authority is granted only when canonical active teacher groups exist;
- admin/superadmin receive explicit `LIVE_CONTROL_ANY` authority;
- runtime `user_id` is pseudonymized with a server-side SHA-256 digest before it can become room ownership/idempotency identity;
- transport extraction removes only `token` / `session_token`; arbitrary or forged extra fields remain in the core request so strict RequestValidation rejects them.

E2 remains **unwired**: this directory still does not own the Campus `doPost`, does not create V2 Sheets, and does not deploy anything.

## Synthetic gates

Run the complete core workflow locally through the scripts under `scripts/qa_english_lab_live_v2_*.mjs`.

The dedicated AuthAdapter gate is:

```bash
node scripts/qa_english_lab_live_v2_auth_adapter.mjs
```

Last code head demonstrated green before this documentation-only commit: `3c5afa21ed766d3ab95d4d8bd574090eeb37da6b`.

- English LAB LIVE v2 Core · run #98 · SUCCESS
- English LAB Source Truth Guard · run #233 · SUCCESS

## Still blocked before QA wiring/write

- physical V2 Sheets Store + initializer;
- real V2 SchemaGuard against Sheets before every write path;
- real `LockService` adapter;
- Campus router wiring using the transport/AuthAdapter boundary;
- real game plugins and curricular ContentResolver authorization;
- runtime QA evidence and burst/performance tests.

Before any future QA write or deployment, repeat fresh `clasp deployments` plus read-only `clasp pull` and compare the live QA source/deployment again. PROD remains out of scope.
