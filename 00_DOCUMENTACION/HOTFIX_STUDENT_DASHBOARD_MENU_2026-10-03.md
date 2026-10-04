# Mi Perfil dashboard and menu hotfix - 2026-10-03

Base: main a976f1ffbbc4a20ccdd7e05e2179dea66a036408.

Mi Perfil now targets dashboard. Both legacy student profile aliases normalize to dashboard and the student map no longer mounts PerfilView. Teacher/admin profile routes remain available.

The academic sidebar derives selection from the URL for both native and custom routes. Content overlays no longer mutate React-owned active classes. History restoration avoids mounting the generic academic overlay over the content-access overlay, and native navigation closes previous overlays. Repeated native clicks do not duplicate history entries.

Validation: scripts/qa_student_dashboard_menu.cjs uses the repository React/Babel assets, actual sidebar/content modules and extracted native navigation/history functions in a synthetic browser harness. It checks a unique active option, repeated clicks, native/custom transitions, Back/Forward, legacy profile hashes, programmatic profile navigation and Tasks transitions. Network is isolated from production; this is not authenticated production QA.

Local results: JSX parse PASS; synthetic Edge browser PASS; delivery audit PASS with four existing warnings (historical backend snapshot endpoints and cronograma cache versions). Backend @432 files/configuration are outside this diff. CI and human review required before publication per AGENTS.md.
