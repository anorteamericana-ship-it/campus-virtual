# CS21A210F · ErrorState compartido · diagnóstico técnico solo en consola

Fecha: 2026-08-31 · Costa Rica

## Base exacta

- Base: PR #223 / `fix/student-shared-profile-safe-errors-cs21a210e`
- SHA base: `37c79252deed11e4e2b7f4b868cb14fdff43ccd1`
- `src/primitives.jsx` base: `764a1583692de05fc5909b1939add71282605cde`
- Rama candidata: `fix/shared-error-state-console-only-cs21a210f`

## Hallazgo

`ErrorState` es una primitiva compartida por superficies de estudiante, docente y administración. Aunque `normalizarMensajeErrorCampus()` convertía varios errores técnicos a un título estable, conservaba el mensaje crudo en `err.detalle` y ofrecía en la UI:

- `Ver detalle para soporte`;
- `Ocultar detalle técnico`;
- un `<pre>` con el diagnóstico original.

Eso contradice la frontera vigente del Campus: el detalle técnico no debe quedar disponible al usuario u operador desde la interfaz. El diagnóstico puede conservarse en consola para soporte, pero no renderizarse.

No se encontró un PR previo que hubiese retirado esta conducta; #223 la documentó expresamente como siguiente deuda separada.

## Corrección funcional

Únicamente `src/primitives.jsx`:

- `normalizarMensajeErrorCampus()` detecta códigos y marcadores técnicos con una frontera más amplia;
- el mensaje técnico se registra mediante `console.warn('[ErrorState] Detalle técnico oculto al usuario.', { error: raw })`;
- la UI técnica recibe solo `No se pudo cargar este módulo.`;
- los mensajes humanos/no técnicos continúan mostrándose como título;
- se elimina el estado `showDetail`;
- se eliminan los botones de detalle técnico;
- se elimina el `<pre>` con `err.detalle`;
- `Reintentar` permanece exactamente disponible cuando existe `onRetry`;
- el texto de orientación para enviar una captura se conserva.

La frontera incluye, entre otros, Apps Script/script.google, backend/endpoint, stack/exception/trace, errores JS, red/fetch, HTML/JSON/token, autorización, HTTP/status, `request_id`, `file_id`, base64, SHA, MIME y nombres de implementación como DriveApp/spreadsheet/sheet/tabla/hoja, además de códigos técnicos con guiones bajos.

## Prueba de no-regresión exacta

Como `primitives.jsx` es compartido y amplio, el guard CS21A210F define exactamente:

1. el bloque `ErrorState` anterior de #223;
2. el bloque nuevo console-only;
3. cuando corre con `--exact-import`, sustituye en memoria el bloque nuevo por el anterior;
4. recalcula el Git blob SHA;
5. exige recuperar exactamente `764a1583692de05fc5909b1939add71282605cde`.

El blob funcional candidato es `420908f5a9efbdbd6ff948e3ff93741ce543377e`.

Para descendientes, el guard conserva verificaciones semánticas y omite únicamente la igualdad de blob/preimagen propia de F. Esto evita convertir el guard en una barrera artificial contra futuras mejoras legítimas del mismo archivo compartido.

## Bootstrap inicial y hardening de guard heredado

Primer candidato: `cf2a1bcdb15b78011df53a467b0b5093323a630d`.

Run `33436145401`: **FAIL** después de que el guard propio CS21A210F pasó completamente, incluyendo:

- `TECHNICAL_DETAIL_RENDERED=NO`;
- `RETRY_PRESERVED=YES`;
- `PRIMITIVES_PREIMAGE_RECONSTRUCTION=EXACT`;
- `EXACT_IMPORT=VERIFIED`.

El fallo ocurrió en la regresión heredada `qa_student_shared_profile_safe_errors_current_tip_cs21a210e.mjs`: ese guard ejecutaba su reconstrucción exacta y exigía el blob exacto de #223 incluso cuando se llamaba sin `--exact-import` desde un descendiente. Al modificar F legítimamente otra zona de `primitives.jsx`, la reconstrucción de E no podía volver al blob de #222.

La corrección es exclusivamente QA:

- CS21A210E sigue exigiendo su reversión exacta + blob exacto cuando se ejecuta con `--exact-import` en su propio corte;
- cuando un descendiente lo ejecuta sin esa bandera, conserva todos los checks semánticos de helper, frontera, transporte, cache, token, red y consumidores, pero no exige igualdad total de `primitives.jsx`;
- CS21A210F nace con el mismo patrón descendant-safe para evitar repetir esta fragilidad.

El blob funcional `src/primitives.jsx` de F no cambia durante este hardening. La rama se reconstruye desde el SHA exacto de #223 como un solo commit antes de abrir PR.

## Scope exacto final

Cinco rutas:
1. `src/primitives.jsx`
2. `scripts/qa_student_shared_profile_safe_errors_current_tip_cs21a210e.mjs` — hardening QA descendiente, sin cambio funcional;
3. `scripts/qa_shared_error_state_console_only_cs21a210f.mjs`
4. `.github/workflows/qa-shared-error-state-console-only-cs21a210f.yml`
5. `00_DOCUMENTACION/SHARED_ERROR_STATE_CONSOLE_ONLY_CS21A210F_2026-08-31.md`

Una ruta funcional y cuatro de QA/documentación. Cero borrados materiales.

## Evidencia y límites

- E0: source + reversión exacta.
- E1: únicamente después de Actions verde del candidato final y del PR.
- E2: NO demostrado.

Este corte no demuestra backend Apps Script modular vigente, autorización server-side, Drive ACL ni producción.

## Fronteras

- NO PROD
- NO AUTO-MERGE
- NO Apps Script write/push/deploy
- NO Drive ACL changes
- NO material deletions
- NO cambio de main
