# CS21A210E · Estudiante · frontera compartida de perfil sobre punta vigente

Fecha: 2026-08-31 · Costa Rica

## Base exacta

- Base: PR #222 / `integration/secondary-safe-errors-current-tip-cs21a210d`
- SHA base: `a815c05306bc946383f1e19d0fb099f85c1667da`
- `src/primitives.jsx` base: `e322131d81fb828c78995400dcf4dc4be5da9eb8`
- Rama candidata: `fix/student-shared-profile-safe-errors-cs21a210e`

## Hallazgo recuperado de CS21A200J

La rama histórica `fix/student-shared-profile-safe-errors-cs21a200j` quedó incompleta. Sus commits finales agregaron el guard y la documentación que describen la corrección, pero nunca modificaron `src/primitives.jsx`.

El defecto sigue presente en #222: cuando `getEstudiante` responde `ok:false`, el hook compartido `useEstudiante(codigo)` ejecuta `setError(d.error)`. Ese estado llega a Mis Notas, Pagos y Perfil mediante el wrapper vigente `useEstudianteDeSesion()`.

## Corrección funcional

Se reconstruye el cambio que J documentó pero no persistió:

- se agrega `studentSharedProfileSafeUserError(raw, fallback, context)`;
- códigos y mensajes técnicos se registran en consola y no llegan a la UI;
- mensajes humanos de negocio pueden conservarse;
- `getEstudiante ok:false` usa `No pudimos cargar tu información. Intentá de nuevo.` como fallback seguro.

No cambia endpoint, token, transporte, cache, reload, copy de red, estructura de datos ni consumidores.

## Prueba de no-regresión exacta

Debido a que `primitives.jsx` es un archivo compartido amplio, CS21A210E no se conforma con checks de strings. El guard nuevo:

1. elimina en memoria el bloque helper exacto;
2. revierte la única línea `setError(...)` nueva a la línea anterior;
3. recalcula el Git blob SHA;
4. exige volver exactamente a `e322131d81fb828c78995400dcf4dc4be5da9eb8`, el blob de #222.

El blob funcional candidato permanece `764a1583692de05fc5909b1939add71282605cde`.

También se conserva el contrato histórico CS21A200J, pero su detección de consumidores se repara para la arquitectura actual: las vistas `NotasView`, `PagosView` y `PerfilView` llaman `useEstudianteDeSesion()`, y ese wrapper llama `useEstudiante(codigo)`.

## Bootstrap inicial y corrección QA

Primer candidato funcional: `05a5c7f9059fdc76a128edabd13404da4511eea9`.

Run `33435231937`: **FAIL** en el primer paso del guard nuevo con `expected at least 3 shared consumers, found 0`.

La causa no fue el source funcional. El guard heredado buscaba literalmente `window.useEstudiante(codigo)`, una forma que ya no existe en `student_modules.jsx`. La punta vigente usa:

- `NotasView` → `useEstudianteDeSesion()`;
- `PagosView` → `useEstudianteDeSesion()`;
- `PerfilView` → `useEstudianteDeSesion()`;
- `useEstudianteDeSesion()` → `useEstudiante(codigo)`.

Se corrigen únicamente los dos guards para seguir esta cadena efectiva. No se modifica el blob funcional `src/primitives.jsx` ni se relaja ninguna frontera de seguridad. La rama se reescribe desde el SHA exacto de #222 como un único commit antes de abrir PR.

## Scope exacto

Cinco rutas:
1. `src/primitives.jsx`
2. `scripts/qa_student_shared_profile_safe_errors_cs21a200j.mjs`
3. `scripts/qa_student_shared_profile_safe_errors_current_tip_cs21a210e.mjs`
4. `.github/workflows/qa-student-shared-profile-safe-errors-cs21a210e.yml`
5. `00_DOCUMENTACION/STUDENT_SHARED_PROFILE_SAFE_ERRORS_CURRENT_TIP_CS21A210E_2026-08-31.md`

Una ruta funcional y cuatro de QA/documentación. Cero borrados.

## Deuda separada descubierta

`ErrorState` en el mismo `primitives.jsx` aún permite desplegar detalle técnico mediante `Ver detalle para soporte`. Esa conducta contradice la regla vigente de mantener diagnósticos técnicos solo en consola. **No se corrige dentro de CS21A210E** para no mezclar el alcance recuperado de J con una frontera transversal distinta; queda como siguiente corte de auditoría.

## Evidencia y límites

- E0: fuente + prueba de reconstrucción exacta.
- E1: únicamente después de Actions verde del candidato y PR.
- E2: NO demostrado.

No demuestra backend Apps Script modular vigente, autorización server-side, Drive ACL ni producción.

## Fronteras

- NO PROD
- NO AUTO-MERGE
- NO Apps Script write/push/deploy
- NO Drive ACL changes
- NO material deletions
- NO cambio de main
