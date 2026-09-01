# CS21A210BK · Espina de consolidación auditada

Base exacta: PR #262 / `7ceca9c5374416ddc16a293ab6cbabedd8fa3713`.
Main congelado para esta medición: `53df524d0a9eab867d3b307b3e633f366af92a63`.

## Objetivo
Demostrar por ancestry real de Git qué trabajo pertenece a la espina verde actual antes de preparar cualquier candidato de consolidación. Este corte es auditoría/QA únicamente y no modifica runtime.

## Espina mínima exigida
El guard BK exige que la punta #262 contenga, en orden de ancestry, los checkpoints verdes AT/#248, AX/#250, AY/#251, BA/#253, BC/#255, BD/#256, BF/#258, BG/#259, BH/#260, BI/#261 y BJ/#262.

## Exclusiones obligatorias
- PR #257 / CS21A210BE (`add6aacb063d9647321e80655eb747ba7b590ced`) debe **NO** ser ancestro de la espina verde. Su fix English LAB Live sigue bloqueado por Source Truth.
- PR #70 / CS21A202 (`127dc3ca4c23cc3590af8c91ffd33dd350601080`) debe **NO** ser ancestro de la espina verde. Son 20 commits / 12 archivos con recuperación funcional de Memory Match y QA autenticada pendiente; no puede entrar de forma implícita.

El workflow vuelve a traer las refs PR #70/#257 directamente desde GitHub y verifica que sigan apuntando a esos SHAs antes de evaluar ancestry.

## Medición de deriva
BK calcula en CI, sobre los SHAs congelados, commits acumulados y archivos cambiados entre `main` y #262, además de conteos de `src/`, entrypoints, workflows, scripts y documentación. La medición se publica como annotation `CS21A210BK drift metrics` para que el tamaño de integración sea verificable sin confundirlo con autorización de merge.

## Dictamen
Un PASS de BK significa únicamente: **espina verde identificada y ramas bloqueadas excluidas por ancestry**. No significa que el conjunto sea release-ready. Siguen fuera de este gate E2 autenticado, snapshot Apps Script QA vigente, E3/E4, merge y producción.

No autoriza cerrar PRs, borrar ramas, recuperar CS21A202/#70, fusionar #257, mergear a `main`, publicar frontend, tocar Apps Script/backend, cambiar Drive ACL ni PROD.

E0: sí. E1: sujeto al guard BK. E2: NO. `BACKEND CURRENT SNAPSHOT UNVERIFIED` vigente.
