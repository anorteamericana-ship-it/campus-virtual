# CS21A210BC · Exámenes · errores seguros en frontera admin efectiva

Base exacta: PR #254 / `6e3fd61d046ff67b33952526f2aadb7219e31111`.

## Alcance

Corrige únicamente la presentación de error de las dos superficies admin demostradas como efectivas por CS21A210BB, manteniendo sincronizados `src/examenes_modes.jsx` y `src/examenes_bundle.jsx`:

1. `ActivationBackendPanel`;
2. `BackendOperationsPanel`.

El helper `examAdminSafeUserError` conserva el detalle crudo solo en consola y entrega copy estable a UI. `TeacherBackendReviewPanel` continúa sin montarse y no se modifica para reducir artificialmente métricas.

## Preimagen exacta

- `src/examenes_modes.jsx`: `9d86826c3c3d0ac12e4a915d461e9fcc42be3705`
- `src/examenes_bundle.jsx`: `4ee147afe2c06c3318d075b478a47497994a93dc`

El guard CS21A210BC reconstruye ambas representaciones desde esas preimágenes y exige igualdad byte por byte con el candidato.

## Contrato congelado

No modifica endpoints, payloads, permisos, ejecución de operaciones administrativas, StudentMode, revisión docente, backend, Apps Script, Drive ACL, `main` ni PROD.

E0: sí. E1: sujeto a Actions. E2: NO. `BACKEND CURRENT SNAPSHOT UNVERIFIED` vigente.
