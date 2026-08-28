# English LAB LIVE v2 · isolated core

Status: **E1-E10 GREEN ON BRANCH / QA BACKEND @37 SMOKE PASS / NOT PROD**.

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

The isolated runtime is connected through the exact-v2 route boundary and the accumulated outer QA bridge. The stable production deployment remains out of scope and unchanged.

### E10 · visible teacher/student shell

- `src/english_lab_live_v2.jsx` publishes the teacher and student views for the four-game catalog.
- Word Search renders and validates explicit 14 × 14 rows, while preserving compound labels such as `phone number` and placing their letters contiguously as `PHONENUMBER`.
- Hangman reveal replaces the masked pattern instead of appending a second answer board.
- Quiz questions/options and room header/actions use separate semantic groups.
- A visible backend timeout offers a safe retry that reuses the original mutation `request_id`.
- Zero-participant teacher rehearsal remains intentional; participant joins change the room revision and refresh the projected count.
- `scripts/qa_cs21a202_source_truth.mjs` guards the canonical v2 source/loader path and rejects browser tests that fabricate or patch the served HTML/code.

## Synthetic gates

Run the complete core workflow locally through the scripts under `scripts/qa_english_lab_live_v2_*.mjs`.

The dedicated AuthAdapter gate is:

```bash
node scripts/qa_english_lab_live_v2_auth_adapter.mjs
```

Run `.github/workflows/qa-english-lab-live-v2-core.yml` plus the strict source-truth guard on the exact branch head before advancing the draft PR.

## Remaining release gates

- run authenticated teacher/student browser regression against the same QA deployment;
- verify all four games at desktop and approximately 390 px;
- run the deferred 15/20/25-student burst only if it is explicitly returned to scope;
- keep Memory Match `FROZEN_DEFERRED_NON_BLOCKING`;
- do not advance to production until the draft PR, required checks, runtime evidence and human review are complete.

Before any future QA write or deployment, repeat fresh `clasp deployments` plus read-only `clasp pull` and compare the live QA source/deployment again. PROD remains out of scope.
