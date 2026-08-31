# CS21A210X · Matrículas · errores seguros

Fecha: 31-ago-2026

## Base
- PR #236 · CS21A210V
- base exacta: `15b13f7ba812ea03f73d734989aba0320a043f70`
- preimagen `src/matriculas.jsx`: `fec187d8b9d296d6884fc2c736175257e300d587`

## Hallazgo
CS21A210W V3, ejecutado después de V, confirmó 83 hallazgos en 24 archivos y 4 cruces crudos en `src/matriculas.jsx`:
- carga de prospectos: respuesta backend;
- carga de prospectos: excepción de transporte;
- guardado de matrícula/estatus: respuesta backend;
- guardado de matrícula/estatus: excepción de transporte.

## Frontera SEC-004 preservada
PR #217 / CS21A198B demostró y corrigió que `MAT_DEMO` debía ser solo lectura. La punta actual conserva ese hardening:
- demo no consulta `getGruposDisponibles` real;
- `confirmar()` falla cerrado antes de `actualizarEstatus`;
- acciones/modales operativos no se montan en demo.

CS21A210X no cambia esa política y ejecuta el guard histórico `qa_sec004_matriculas_preview_readonly_cs21a198b.mjs` como regresión obligatoria.

## Cambio
Se agrega `matriculasSafeUserError(raw, fallback, context)`:
- detalle técnico queda solo en consola;
- prospectos usan copy estable;
- guardado usa copy estable.

Se eliminan exactamente los cuatro cruces inventariados por V3 en el archivo.

## Contratos preservados
- `getProspectos` POST + token + `decay_pre_matricula:true`;
- `getGruposDisponibles`;
- `actualizarEstatus`;
- `MAT_DEMO`;
- frontera `previewReadOnly`;
- seis montajes operativos requieren `!MAT_DEMO`;
- Apps Script, ACL, main y PROD sin cambios.

## Observación fuera de alcance
`useProspectos()` contiene actualmente dos guards `if (MAT_DEMO)` idénticos y consecutivos. Es redundancia source-side, no una fuga de error. Se documenta para una limpieza posterior y no se mezcla con este corte de seguridad/copy.

## Evidencia
Bootstrap `33448390422`: **SUCCESS completo**:
- preimagen exacta;
- patch X;
- guard X;
- SEC004 Matrículas preview readonly PASS;
- regresiones V/T PASS;
- diff hygiene PASS;
- scope funcional exactamente `src/matriculas.jsx`.

Source temporal validado: `519e8b329b8874da0f3eae70b09200e25a466607`.
Blob funcional validado: `de33e1fb46c87b1e5674a2f44e3e107e313720a6`.

La rama final se reconstruye como un único commit directo sobre #236 con 4 rutas: 1 funcional + guard + workflow + documentación. Patcher/bootstrap quedan fuera del candidato final.

## Estado
- E0: sí.
- E1 source/QA: bootstrap sí; QA final/PR debe cerrar checkpoint.
- E2 autenticado/runtime: NO.
- `BACKEND CURRENT SNAPSHOT UNVERIFIED`: vigente.
- PROD/main: NO tocados.

**SOURCE/QA ONLY · SEC-004 DEMO READ-ONLY PRESERVED · NO PROD · NO AUTO-MERGE**
