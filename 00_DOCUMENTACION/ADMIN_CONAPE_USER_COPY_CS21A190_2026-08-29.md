# CS21A190 · Admin CONAPE · copy operativo sin nombres internos

Fecha: 2026-08-29
Base exacta: PR #161 / `2f774d27a5982f7aeb35ed532611d952fe62b3c4`

## Hallazgo

El asistente admin/superadmin `Poner al día` mostraba al operador la frase:

`Se ejecutará una sola sincronización de las hojas 4–7...`

`hojas 4–7` describe una implementación interna y no agrega valor operativo al usuario.

## Cambio

Se reemplaza únicamente por:

`Se actualizará CONAPE una sola vez. Después se recargará automáticamente este mismo estudiante hasta mostrarlo actualizado.`

## Garantías

No cambian:
- `sincronizarConapePuestaAlDia`;
- botón `Actualizar CONAPE ahora`;
- botón `Dejar CONAPE pendiente`;
- payloads, request IDs o idempotencia;
- pagos, estatus o expediente académico;
- sanitizador CS21A189;
- Apps Script, Drive ACL o producción.

## QA

`scripts/qa_admin_conape_user_copy_cs21a190.mjs` exige:
- copy nuevo presente;
- frase interna `hojas 4–7` ausente;
- acciones CONAPE preservadas;
- endpoint de sincronización preservado;
- frontera de errores CS21A189 preservada.

Estado: `COPY ONLY · NO LOGIC CHANGE · NO PROD`.
