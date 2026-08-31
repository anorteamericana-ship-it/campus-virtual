# CS21A210V · Solicitudes administrativas · errores seguros

Fecha: 31-ago-2026

## Base
- PR #235 · CS21A210T
- base exacta: `0b1cbce6b221d25e5367f8d6abaff3607966f2ba`
- preimagen canónica `src/solicitudes_unificadas.jsx`: `4cef6b3e4f4fd290a104251b5a3356e9c308d6d3`

## Ownership
`src/app.jsx` monta explícitamente `src/solicitudes_unificadas.jsx` dentro de `F96_LAZY.solicitudes`.

Existe `src/SOLICI~2.JSX`, pero no hay referencia desde el loader/router actual y su contenido no es idéntico al canónico (por ejemplo conserva otra forma de `f92Post`). Se trata como snapshot/duplicado no montado y queda deliberadamente fuera de este corte.

## Hallazgo
CS21A210U V3, ejecutado después de T, confirmó 90 hallazgos en 25 archivos y 7 cruces crudos en la superficie canónica de Solicitudes:
1. carga compacta de reposiciones del estudiante;
2. carga de la vista de reposiciones del estudiante;
3. envío de justificación/comprobante;
4. carga administrativa de reposiciones;
5. resolución administrativa de reposiciones;
6. carga comercial de solicitudes de usuario gratis;
7. resolución comercial de solicitudes de usuario gratis.

## Cambio
Se agrega `f92SafeUserError(raw, fallback, context)` para conservar detalle técnico solo en consola y mostrar fallbacks operativos específicos por acción.

Se eliminan los siete `setError(e.message)` del archivo canónico.

## Contratos preservados
- POST + token en body mediante `f92Post`;
- `reposMiEstadoF92`;
- `reposEnviarSolicitudF92`;
- `reposListarSolicitudesF92`;
- `reposResolverSolicitudF92`;
- `freeUserListarSolicitudes`;
- `freeUserResolverSolicitud`;
- payload de evidencia: reposición, tipo, motivo, referencia, base64, MIME y nombre;
- payload de resolución admin: acción, nota y referencia;
- filtros/limit de usuario gratis;
- evento `an:free-user-solicitudes-changed`;
- integración con `PanelSuspensiones` y `SolicitudesPagoView`.

## Evidencia
Primer bootstrap `33447901489`: **FAIL antes de modificar source**. La preimagen exacta pasó; el patcher abortó porque una línea repetida aparecía varias veces y la regla inicial exigía unicidad global. No se publicó source funcional ni se abrió PR.

Se endureció únicamente el patcher para validar el número exacto de ocurrencias restantes y reemplazarlas en orden canónico, sin relajar ningún guard funcional.

Segundo bootstrap `33447946908`: **SUCCESS completo**:
- preimagen exacta;
- patch anclado;
- guard CS21A210V;
- regresiones T/R/P;
- diff hygiene;
- scope funcional exactamente `src/solicitudes_unificadas.jsx`.

Source temporal validado: `d7a4e3804ea0a34b648a582ebb41e4d50ceeb775`.
Blob funcional validado: `2526fa414ea049662414a1f69e1345fb46072c7c`.

La rama final se reconstruye como un único commit directo sobre #235 con 4 rutas: 1 funcional + guard + workflow + documentación. Ambos bootstraps y el patcher quedan fuera del candidato final.

## Estado
- E0: sí.
- E1 source/QA: bootstrap sí; QA final/PR debe cerrar checkpoint.
- E2 autenticado/runtime: NO.
- `BACKEND CURRENT SNAPSHOT UNVERIFIED`: vigente.
- Apps Script / ACL / main / PROD: no tocados.

**SOURCE/QA ONLY · CANONICAL MOUNTED FILE ONLY · NO PROD · NO AUTO-MERGE**
