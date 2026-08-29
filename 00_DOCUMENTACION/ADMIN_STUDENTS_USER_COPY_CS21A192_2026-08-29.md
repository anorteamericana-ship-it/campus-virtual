# CS21A192 · Admin Estudiantes · copy operativo sin nombres internos

Fecha: 2026-08-29
Base exacta: PR #163 / `72edf804366b8a184b94b397f365b40b9c19ea5e`

## Alcance

Después de CS21A191, la frontera de errores ya es segura. Este corte atiende únicamente texto técnico no-error que todavía era visible al admin/superadmin.

Se retiran referencias de implementación como:
- APOLLO;
- hojas 4–7 de CONAPE;
- Apps Script / Backend F24;
- hoja `SEGUIMIENTO_ESTUDIANTES`;
- `DATOS · COMENTARIO_ADMIN`;
- coordinación Apps Script/GitHub;
- `REG_CERTIFICADOS` y `ESTATUS` en tooltips/instrucciones;
- `Cruzando DATOS, ESTATUS, GRUPOS...`;
- identificador visual `Control F98.3-C`.

## Semántica preservada

El nuevo copy sigue informando correctamente:
- si CONAPE quedó pendiente o actualizado;
- si la bitácora es oficial o un respaldo temporal de navegador;
- que el comentario es interno y de administración;
- que un certificado conserva su número al regenerarse;
- que el estado académico no se cambia en operaciones de regeneración;
- que los cierres y notas actualizan el registro académico;
- que un cambio de grupo solo afecta el expediente confirmado.

## No cambia

No se modifica lógica, endpoints, payloads, localStorage, sincronización CONAPE, certificados, comentarios, cambios de grupo, cierres, notas, Apps Script, Drive ACL ni producción.

## QA

`qa_admin_students_user_copy_cs21a192.mjs` exige el nuevo copy operativo, prohíbe las cadenas internas auditadas y verifica que endpoints/acciones críticas y la frontera CS21A191 sigan presentes.

Estado: `COPY ONLY · NO BUSINESS LOGIC CHANGE · NO PROD`.
