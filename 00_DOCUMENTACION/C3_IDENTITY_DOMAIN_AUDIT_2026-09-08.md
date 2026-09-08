# C3 · dominio de identidad del cierre de lección · auditoría E0/E1

Base exacta: PR #278 / `00cec69010807bc0c67ee79f0d34b280fc372df3`.

## Corrección de clasificación
La observación previa "el guard CS21A138 solo inspecciona `body.asistencias`, no `retroalimentacion`/`progress_check`" es cierta, pero por sí sola no demuestra una fuga en el flujo frontend canónico.

En `src/vista_docente.jsx`, `ModalCierreLeccion` carga un único roster `students`, inicializa `formData` por `e.code`, valida cada estudiante y luego construye `asistencias`, `retroalimentacion` y `progress_check` recorriendo el mismo array `students`. Además, la validación exige retroalimentación no vacía para cada estudiante; cuando aplica Progress Check también exige `pc` para cada estudiante. Por tanto, en el submit canónico:

- `keys(retroalimentacion) = keys(asistencias)` tras validación exitosa;
- cuando `includesPC=true`, `keys(progress_check) = keys(asistencias)`;
- cuando `includesPC=false`, `progress_check` queda vacío.

El guard histórico CS21A138 sigue validando únicamente `Object.keys(body.asistencias)` y exige prefijo `QA-`. Ese guard es suficiente para cubrir el dominio de identidades **solo si** el payload E4 se construye mediante el contrato canónico anterior o un harness que reproduzca explícitamente la misma igualdad/subconjunto de claves.

## Riesgo residual
Un caller directo, harness alternativo o futura UI podría construir `retroalimentacion` o `progress_check` con códigos que no aparezcan en `asistencias`. El guard histórico no rechazaría esos códigos antes de delegar al handler base. No se afirma que el handler efectivo del rehearsal acepte o escriba ese payload: su source exacto sigue pendiente.

Clasificación corregida: **P2 · E0 · gap de defensa/harness**, no P1 demostrado del flujo canónico.

## Gate C3 antes de E4
1. C0-SCHEMA62 debe estar cerrado primero.
2. Congelar source rehearsal efectivo de `cerrarLeccionCompleta` y su wrapper final.
3. Usar un único grupo/roster sintético QA.
4. Exigir antes de POST:
   - `keys(asistencias)` no vacío;
   - todos los códigos con prefijo QA autorizado;
   - `keys(retroalimentacion)` exactamente iguales a `keys(asistencias)`;
   - `keys(progress_check)` iguales a asistencia cuando aplique PC, o vacío cuando no aplique.
5. Snapshot previo de todas las superficies que el handler efectivo pueda tocar.
6. STOP si aparece una identidad fuera del conjunto congelado, un side effect no inventariado o una respuesta incierta sin reconciliación.
7. Rollback debe restaurar cada superficie observada; no reutilizar el harness histórico CS21A138 como prueba de reversibilidad.

No modifica runtime, backend, Apps Script, Sheets/Drive ni ACL. E2/E3/E4: NO.
