# English LAB LIVE v2 · isolated core

Status: **E1 / NOT WIRED / NOT DEPLOYED**.

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

## Current E1 surface

- `00_Constants.js`: versions, states, capabilities, error codes, reserved fields.
- `01_Clock.js`: server-clock abstraction with injectable test provider.
- `02_CanonicalJson.js`: deterministic JSON representation for later idempotency/integrity hashing.
- `03_Schema.js`: exact V2 table contracts and order-independent strict header validation.

Run the synthetic contract gate with:

```bash
node scripts/qa_english_lab_live_v2_contracts.mjs
```

This code is not yet connected to the Campus router, Auth, Apps Script QA runtime, Sheets, or any real game plugin.
