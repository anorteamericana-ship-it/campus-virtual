# CS21A210BA · Exámenes · errores seguros en revisión docente

Base exacta: PR #252 / `3d161df00606dab513cb9bce706502a4ca6be433`.

## Alcance
Corrige únicamente los siete sinks backend→UI confirmados por CS21A210AZ dentro de `TeacherWrittenBackendReviewF940` y `TeacherWrittenLiveInbox`, manteniendo sincronizados `src/examenes_modes.jsx` y `src/examenes_bundle.jsx`.

El helper `examTeacherSafeUserError` conserva el detalle crudo solo en consola y entrega copy estable a UI para abrir intento, preparar/cargar revisión, cerrar revisión, push a Mis Notas, reintento de push y bandeja docente.

## Preimagen exacta
- modes: `e9009020f4d081f000205b52028d8907f4b3c8d4`
- bundle: `76e4017b73de426530fca6ed09ae6bf76c195cbf`

## Candidato
- modes: `9d86826c3c3d0ac12e4a915d461e9fcc42be3705`
- bundle: `4ee147afe2c06c3318d075b478a47497994a93dc`

El guard BA revierte helper + siete reemplazos y exige reconstrucción byte por byte de ambas preimágenes.

## Contrato congelado
No cambia endpoints, payloads, scoring, cierre, feedback obligatorio, envío a Mis Notas, permisos, StudentMode, paneles admin, backend, Apps Script, Drive ACL, main ni PROD.

E0 sí. E1 source/QA sujeto a Actions de rama/PR. E2 NO. `BACKEND CURRENT SNAPSHOT UNVERIFIED` vigente.