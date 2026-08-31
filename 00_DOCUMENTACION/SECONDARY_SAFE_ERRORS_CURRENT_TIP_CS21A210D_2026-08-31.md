# CS21A210D · Superficies secundarias · errores seguros sobre punta vigente

Fecha: 2026-08-31 · Costa Rica

## Base exacta

- Base: PR #221 / `fix/admin-master-conape-truth-boundary-cs21a210c`
- SHA base: `954f7df752651b81efe655b8ad3e030971704b0a`
- Rama: `integration/secondary-safe-errors-current-tip-cs21a210d`
- `main` observado durante la auditoría: `53df524d0a9eab867d3b307b3e633f366af92a63`

## Objetivo

Reconciliar sobre la punta vigente únicamente correcciones funcionales ya validadas de la cadena secundaria #191–#198 que todavía faltan, evitando importar ramas completas o pisar versiones posteriores.

## Prueba de preimagen exacta

Antes de importar cada blob se verificó que el archivo actual de #221 coincide exactamente con el blob padre sobre el que se aplicó la corrección histórica. Por tanto, el reemplazo no descarta evolución intermedia de la línea vigente.

| Superficie | PR fuente | Blob #221 / preimagen | Blob validado a importar |
|---|---:|---|---|
| Libros / inicios de unidad | #191 | `ce7f673f41f67b2ab59253b206c37c50381083ad` | `5abdab2412938e33ffcae1ea042463909ed25db2` |
| Cronograma por rol | #192 | `54b9191880cc6d6ac1c62d69822ca25e64d5fb2d` | `b4b29b4a3910f05c21505a1bca872ae5f008baa4` |
| Ruta Admin Recursos adicionales | #193 | `657d68c33ef45939687a7a39100e05a5bcd3fc91` | `d7d6d0b87aa3e803eac15b683b6121ce6c164ba2` |
| Panel Recursos adicionales | #194 | `c54fd3076c512e0e8b228b0e5a63f00bb16141f2` | `0cde70aa72f879c03df865f07179861561239745` |
| Menú académico estudiante | #196 | `f1ae4248fed6b5cd413c989d64e4f3a55fae03d5` | `af8730ad3a133aa8ec7553deebe97d1d59f2c727` |
| Portal estudiante | #198 | `0d0d3aaa0e982581f35e37e3da331e5e7ab33ce2` | `a0f02e3006124e92d1cbce13f8832c3c80d98cd3` |

## Qué corrige

- Libros: errores de carga, guardado del inicio de unidad y actualización dejan de mostrar excepción técnica.
- Cronograma: docente/admin/estudiante reciben copy operativo; se elimina de UI el fallback que nombraba `APOLLO.GRUPOS` y la columna `DOCENTE`.
- Admin Recursos adicionales: la ruta efectiva diferencia Libros/Audios de Recursos adicionales en lugar de montar siempre el visor de libros.
- Recursos adicionales: el error visible del catálogo pasa por frontera segura.
- Menú estudiante: lazy routes, resumen, catálogo/planeamiento y audio privado dejan de escribir `error.message` directamente en tarjetas visibles.
- Portal estudiante: el fallo combinado `getPortalEstudianteCompleto` → `getEstudiante` deja de publicar `d.error/base.error` al `ErrorState`.

## Exclusiones deliberadas

### #197 · lazy loader

NO se importa el blob histórico `727b94e115396698e20d3cf1219ed745847e947e`.

La punta #221 ya contiene una versión posterior `CS21A124`, blob `46f90c843560c74dfda022afbaf650b5fce75572`, que ya mantiene diagnóstico técnico en consola y copy genérico en UI, además de lógica posterior de `waitForRouteEnhancers`. Reemplazarla por #197 sería una regresión. CS21A210D exige que ese blob moderno permanezca exacto.

### #195 · SEC-006

#195 es evidencia/contrato, no fuente funcional. La auditoría histórica detectó enlaces públicos de Recursos adicionales y mantiene el gate `BLOCK_UNTIL_ROLE_BOUND_DELIVERY_AND_ACL_E2`. CS21A210D NO cambia ACL ni intenta resolver SEC-006 sin backend/E2.

### CS21A200J

La rama `fix/student-shared-profile-safe-errors-cs21a200j` quedó incompleta: su cadena final contiene guard/documentación pero no el cambio funcional esperado en `src/primitives.jsx`. No se trata como fuente validada ni se importa en este corte.

## Bootstrap previo al PR

Primer candidato: `0e50988477c7d2bb6c223f0efacf0688b11ba3eb`, run `33433105880`.

Pasaron:
- guard CS21A210D con importación exacta de los seis blobs;
- regresión CS21A210C;
- regresión CS21A210A.

El run se detuvo en el step rotulado SEC-002 porque el workflow nuevo invocaba por error un nombre inexistente: `scripts/qa_sec002_admin_errors_cs21a194.mjs`. La punta vigente no contiene ese archivo. Los guards canónicos reales, ya utilizados por #221, son:
- `scripts/qa_sec002_admin_academic_docs_cs21a193.mjs`
- `scripts/qa_sec002_admin_certificate_cs21a194.mjs`

Por tanto, no se modificó source ni se relajó SEC-002: se corrigió únicamente el workflow para ejecutar ambos guards reales. El candidato se reconstruye desde el SHA exacto de #221 como un único commit antes de abrir PR.

## Scope exacto

Nueve rutas:
1. `src/book_unit_starts_cs21a60.jsx`
2. `src/cronograma_grupo.jsx`
3. `src/admin_resources_direct_cs21a74.js`
4. `src/additional_resources_panel_cs21a68.jsx`
5. `src/student_menu_academic_cs21a120.jsx`
6. `src/student_portal.jsx`
7. `scripts/qa_secondary_safe_errors_current_tip_cs21a210d.mjs`
8. `.github/workflows/qa-secondary-safe-errors-current-tip-cs21a210d.yml`
9. `00_DOCUMENTACION/SECONDARY_SAFE_ERRORS_CURRENT_TIP_CS21A210D_2026-08-31.md`

Seis rutas funcionales y tres de QA/documentación. Cero borrados.

## Evidencia y límites

- E0: fuente exacta reconciliada + guard semántico.
- E1: únicamente después de Actions verde del candidato y del PR.
- E2: NO demostrado.

No demuestra backend Apps Script modular vigente, SEC-004 server-side, SEC-006 ACL role-bound ni producción.

## Fronteras

- NO PROD
- NO AUTO-MERGE
- NO Apps Script write/push/deploy
- NO Drive ACL changes
- NO material deletions
- NO cambio de main
