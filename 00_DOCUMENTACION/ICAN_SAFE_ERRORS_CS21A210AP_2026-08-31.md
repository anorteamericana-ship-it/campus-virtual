# CS21A210AP · Club I CAN · errores seguros en participación

Fecha local: 2026-08-31

## Base
- PR #245 / `fix/vista-docente-safe-errors-cs21a210an`
- base exacta: `df78b8ffcd64e8866b22c6c2bb110c0842e2ad61`
- preimagen `src/ican_participation_cs21a122.js`: `44428caad352727970e11d271dbf18199b812025`

## Ownership efectivo
`src/student_demo_level_filter_cs21a110.js` inserta explícitamente `src/ican_participation_cs21a122.js?v=F98.4Z6CS21A122`. El workflow histórico `.github/workflows/validate-cs21a122.yml` valida sintaxis, asset CSS y presencia de `getICANPortalEstudiante`.

## Hallazgo
CS21A210AO V3 midió **64 hallazgos / 15 archivos**. En Club I CAN detectó 3 sinks visibles:
1. error de carga del portal estudiante → `data.error` → `StateCard.text`;
2. error al reservar/cancelar → `notice` → aviso visible;
3. error de carga docente → `error` → `StateCard.text`.

La revisión manual encontró además 2 fugas visibles no contadas por V3 que enseñaban al estudiante `backend CS21A122`.

## Corrección
- helper compacto `ican122SafeUserError` mantiene el detalle original solo en `console.warn`;
- carga estudiante: `No pudimos cargar Club I CAN. Intentá nuevamente.`;
- reserva/cancelación: `No pudimos guardar la inscripción. Intentá nuevamente.`;
- carga docente: `No pudimos cargar las inscripciones. Intentá nuevamente.`;
- fallback legacy ya no menciona backend ni identificadores internos;
- estado sin agenda legacy ya no menciona `backend CS21A122`.

## Contrato congelado
AP no cambia:
- `getICANPortalEstudiante`;
- fallback `getICANEstudiante`;
- `reservarICANSesionEstudiante`;
- `cancelarReservaICANEstudiante`;
- `getICANDocenteReservas`;
- método POST y token de sesión;
- código de estudiante;
- cupos, reserva semanal y cancelación;
- historial y puntaje I CAN;
- instalación de `ICANViewNew` y wrapper `ClubICANDocenteView`;
- CSS, loader, backend ni ACL.

El guard revierte únicamente helper + 5 reemplazos y exige reconstruir exactamente la preimagen `44428caad352727970e11d271dbf18199b812025`.

## Evidencia bootstrap
Run `33457634432`: **SUCCESS completo**.
Pasaron:
- preimagen exacta;
- patch exacto;
- `node --check` del módulo y loader;
- guard AP y reconstrucción SHA exacta;
- contrato histórico CS21A122;
- regresiones AN / AL / AJ;
- diff hygiene;
- scope funcional exacto.

Source temporal validado por Actions: `0b8b0e6614f575132e44f5660868f2acd3f00073`.
Blob funcional validado: `a84339c9fc3d9a837d4ad9575e2d06c0b0039774`.

La rama final se reconstruye como un único commit directo sobre #245; patcher/bootstrap quedan fuera.

## Límites
Los documentos históricos verificaron que los endpoints nuevos CS21A122 faltaban en el backend observado. El snapshot backend actual continúa `BACKEND CURRENT SNAPSHOT UNVERIFIED`; AP no afirma disponibilidad runtime ni corrige backend.

- E0: sí.
- E1 source/QA: sí una vez que commit final y PR estén verdes.
- E2 autenticado/runtime: no demostrado.
- Apps Script / Drive ACL / main / PROD: no tocados.

**DRAFT · SOURCE/QA ONLY · I CAN RESERVATION/PARTICIPATION CONTRACT FROZEN · NO BACKEND WRITE · NO PROD · NO AUTO-MERGE**
