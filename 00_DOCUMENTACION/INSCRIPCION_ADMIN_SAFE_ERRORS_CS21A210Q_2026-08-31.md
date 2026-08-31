# CS21A210Q · Inscripción pública admin · frontera segura

Fecha: 31-ago-2026

## Base
- PR #232
- base exacta: `10f4fac9cda9a763199cc0661230f27ace1dc06a`
- preimagen `src/inscripcion_admin.jsx`: `410f37379377688ca7834315bca3280fe5a282a4`

## Verificación previa
La ruta ya estaba correctamente limitada a Superadmin en la punta actual:
- sidebar: opción solo para `esSuperadmin`;
- router: `rolReal === 'superadmin'` con `NoAutorizadoCampus` para otros roles.

Q no modifica esos gates.

## Hallazgo
El editor podía enviar detalle técnico a la UI en cuatro operaciones: carga, guardado general, subida de imagen y guardado TOEIC. Además, el guardado TOEIC no tenía una frontera propia para una excepción de transporte.

## Cambio
`src/inscripcion_admin.jsx` incorpora `insAdminSafeUserError()` y copy neutro por operación. El detalle original se conserva únicamente en consola. `saveGrupoToeic()` queda cubierto por `try/catch` tanto para respuesta negativa como para excepción de transporte.

## Contratos preservados
- `getInscripcionAdminConfig`
- `saveInscripcionAdminConfig`
- `uploadInscripcionAdminImage`
- `saveInscripcionGroupToeic`
- POST + token en body
- imagen de hasta 5 MB y tipo imagen
- payload de imagen `base64`, `mime_type`, `nombre_archivo`
- payload TOEIC `codigo`, `toeic`, `toeic_monto`
- contenido, precios, grupos e imágenes sin cambios de lógica
- main/PROD/Apps Script/ACL intactos

## Evidencia
Bootstrap `33444743366`: **SUCCESS**.
Source temporal validado: `b1151f775c0d202da82ff6a8c097db4684651ed7`.
Blob funcional validado: `90140603684b86ce15e6122fa6db39673587dc8c`.

La búsqueda del source versionado solo aporta estos contratos desde el frontend; la comprobación server-side sigue pendiente del snapshot modular QA actual.

Estado: E0 sí · E1 pendiente de QA final/PR · E2 no · no PROD · no auto-merge.
