# CS21A210T · Admin views · errores seguros

Fecha: 31-ago-2026

## Base
- PR #234 · CS21A210R
- base exacta: `a9c7e789731748a157538c80faf8348d725d03c4`
- preimagen `src/admin_views.jsx`: `af1ba8af11f2a979cfb22d763586953a2f49ad4a`

## Origen del corte
CS21A210S V3 inventarió 96 cruces crudos en 26 archivos y encontró 6 en `src/admin_views.jsx`:
- dashboard: respuesta backend + excepción;
- perfil administrativo: respuesta backend + excepción;
- sincronización CONAPE: respuesta backend + excepción.

La reconciliación con PR #218 confirmó que esta misma superficie ya tenía hardening SEC-004 para preview solo lectura. Ese contrato se preserva y se congela en el guard T.

## Cambio
Se agrega `adminViewsSafeUserError(raw, fallback, context)`:
- detalle técnico queda solo en consola;
- dashboard muestra copy estable;
- perfil administrativo muestra copy estable;
- sincronización CONAPE muestra copy estable.

Se eliminan exactamente los seis cruces inventariados por V3 en esta superficie.

## Contratos preservados
- `getAdminDashboard`;
- `getMiPerfilAdmin`;
- `sincronizarCONAPE`;
- `adminPreviewMode()`;
- dashboard preview no consulta backend real;
- sincronización CONAPE falla cerrada en preview antes del POST;
- operación real fuera de preview permanece intacta;
- Apps Script, ACL, main y PROD sin cambios.

## Evidencia
Bootstrap `33447366846`: **SUCCESS completo**:
- preimagen exacta;
- patch exacto;
- guard CS21A210T;
- regresiones R/Q/P;
- diff hygiene;
- scope funcional exactamente `src/admin_views.jsx`.

Source temporal validado: `87fbd0a2c2cf3fc33f897ef2d1e63740da4849a1`.
Blob funcional validado: `6a8926561388896768b522f74a6982263a68d830`.

La rama final se reconstruye como un único commit directo sobre #234 con 4 rutas: 1 funcional + guard + workflow + documentación. Patcher/bootstrap quedan fuera del candidato final.

## Estado
- E0: sí.
- E1 source/QA: bootstrap sí; QA final/PR debe cerrar el checkpoint.
- E2 autenticado/runtime: NO.
- `BACKEND CURRENT SNAPSHOT UNVERIFIED`: vigente.
- PROD/main: NO tocados.

**SOURCE/QA ONLY · SEC-004 PREVIEW CONTRACT PRESERVED · NO PROD · NO AUTO-MERGE**
