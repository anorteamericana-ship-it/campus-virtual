# CS21A210R · Auditoría Académica · errores seguros

Fecha: 31-ago-2026

## Base
- PR #233
- base exacta: `abab9128d8c52c7470f7ea3fbe89bb8c754d7476`
- preimagen `src/auditoria_academica.jsx`: `ae0bd7141341a7ffe2aa7abad93ecf099f2e43ca`

## Hallazgo
La vista activa de Auditoría Académica es una superficie Admin/Superadmin de supervisión académica declarada como solo lectura.

CS21A210N detectó dos sinks directos, pero la lectura completa encontró cuatro cruces no normalizados:
1. respuesta negativa del preview de cierre: `d.mensaje || d.error`;
2. respuesta negativa de grupos activos: `d.error`;
3. excepción de red de grupos: `e.message` mediante `setErrorGrupos`;
4. error desconocido de la auditoría principal: `res.error`.

Los códigos conocidos `sesion_requerida` y `no_autorizado` ya tenían copy controlado y se preservan.

## Cambio
Se agrega `aaSafeUserError()` para mantener detalle técnico solo en consola y usar fallbacks operativos en los cuatro puntos anteriores.

## Contratos preservados
- `getCierreAcademicoNivelPreview`
- `getGruposActivos`
- `window.fetchAuditoriaAcademicaGrupo({ cod_grupo, nivel })`
- POST + token en body para `postAuditoria`
- niveles B1/B2/I1/I2
- filtros Todas/Cerradas/Pendientes/Con alertas
- mensajes específicos de sesión requerida y no autorizado
- carácter de auditoría solo lectura
- main/PROD/Apps Script/ACL intactos

## Evidencia
Bootstrap `33445108596`: **SUCCESS**.
Source temporal validado: `c7b315ac323d6c2e3ed569feff9875f32bef0dbc`.
Blob funcional validado: `d7a8314c3e8d2afa5415146ab865abedc92a9e4c`.

La rama final se reconstruye directamente sobre #233 como un único commit con 4 rutas: 1 funcional + guard + workflow + documentación. Los artefactos bootstrap quedan fuera del candidato final.

## Estado
- E0: sí.
- E1 source/QA: bootstrap sí; falta QA final/PR para checkpoint canónico.
- E2 autenticado/runtime: NO.
- PROD/main: NO tocados.

**SOURCE/QA ONLY · READ-ONLY AUDIT CONTRACT PRESERVED · NO PROD · NO AUTO-MERGE**
