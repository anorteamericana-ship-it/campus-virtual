# CS21A144 · English LAB para estudiantes al día y salas mixtas

## Base

- Repositorio: `anorteamericana-ship-it/campus-virtual`
- Rama base: `main`
- SHA base: `67108928e953fbf044dbcd916dc34a5dd5f1e570`

## Regla aprobada

1. Un estudiante puede abrir English LAB únicamente cuando el backend confirma:
   - sesión válida de estudiante;
   - matrícula académica activa (`CA`, `APR` o `CNV`);
   - ausencia de mora exigible en los niveles registrados.
2. Una vez autorizado, el estudiante entra a una sala mediante el código `LAB-####`.
3. La sala no se restringe por grupo del estudiante. Un mismo código puede reunir estudiantes de grupos diferentes y del Club I CAN.
4. La identidad del jugador se toma de la sesión autenticada. El backend ignora nombre, cédula o código enviados por el navegador.
5. Prematrícula o una autorización histórica de acceso gratuito ya no sustituyen la condición de estudiante matriculado y al día.

## Archivos

- `src/english_lab_free_access_cs21a66.js`
  - reemplaza el guard histórico por el contrato CS21A144;
  - verifica acceso al abrir English LAB, no en cada carga del Campus;
  - agrega el ingreso por código dentro de English LAB;
  - protege también la pantalla Live y oculta los campos editables de identidad.
- `campus.html`
  - actualiza la versión de caché del guard.
- `apps_script_patches/english_lab_access_cs21a144.gs`
  - parche append-only para staging/entrega backend autorizada;
  - usa `getEstudianteFresh` cuando está disponible para no decidir desde una ficha financiera obsoleta;
  - no reemplaza `Code.gs` ni se despliega automáticamente.
- `scripts/test_english_lab_access_cs21a144.js`
  - valida estáticamente el contrato frontend/backend.

## Validación ejecutada

```bash
node --check src/english_lab_free_access_cs21a66.js
cp apps_script_patches/english_lab_access_cs21a144.gs /tmp/english_lab_access_cs21a144.js
node --check /tmp/english_lab_access_cs21a144.js
node scripts/test_english_lab_access_cs21a144.js
```

Resultado local: 19 comprobaciones aprobadas.

CI del último head validado:

- Audit delivery surface: `success`.
- Validate campus responsive frontend: `success`.
- Virtual Campus Review: `success`.

## Preparación aislada de staging

En la carpeta privada `QA_STAGING_CAMPUS_2026-07-19` se preparó, sin modificar producción:

- una copia intacta del backend fuente;
- `Code_QA_STAGING_CS21A144_COMPLETO.gs`, generado con los dos IDs principales reemplazados por las hojas QA;
- una guardia final que exige las Script Properties `QA_STAGING_MASTER_ID` y `QA_STAGING_OPERATIVO_ID`;
- rechazo de login y tokens cuya identidad no esté marcada `QA-`, `QA_` o grupo `-99XX`;
- bloqueo de operaciones administrativas ajenas a English LAB;
- un manifiesto con tamaño, hash SHA-256 y comprobación de cero referencias a los dos IDs productivos principales.

Hash del archivo completo:

`6cd10faee95a76210e9702bdf1082e7e261edb9cd0e0f4c42ca146d20ff312fa`

El archivo completo de staging pasó validación de sintaxis y su descarga desde Drive coincidió byte por byte, pero todavía no ha sido instalado ni desplegado en Google Apps Script.

## Dataset QA creado

Se crearon cuatro expedientes y cuatro cuentas exclusivamente dentro de `QA_APOLLO_G3_STAGING_2026-07-19`. Las claves permanecen únicamente en el documento privado `CREDENCIALES_QA_CS21A144`; no se registran en GitHub.

| Código | Estado académico | Grupo | Pagos QA | Resultado esperado |
|---|---|---|---:|---|
| `QA-STU-001` | B1 `CA` | `B1-LM69-C3-9926` | ₡364.000 | `AL_DIA`, acceso permitido |
| `QA-STU-002` | B1 `CA` | `B1-LM69-C3-9926` | ₡0 | `CUENTA_PENDIENTE`, deuda esperada ₡364.000 |
| `QA-STU-003` | B1–I2 `PE` | `B1-LM69-C3-9926` | ₡0 | `MATRICULA_NO_ACTIVA` |
| `QA-STU-004` | B1 `CA` | `B1-KJ69-C3-9927` | ₡364.000 | `AL_DIA`, acceso permitido y prueba de sala mixta |

Los casos `001` y `004` tienen matrícula de ₡20.000 y cuatro cuotas por un total de ₡344.000. No se modificó directamente `mora_calculada`: los resultados deben surgir del mismo motor financiero que usa el campus.

Rangos reservados y verificados:

- `DATOS!A163:W163` y `DATOS!A980:W982`;
- `ESTATUS!A875:P886`, además del bloque previo de `QA-STU-001`;
- `USUARIOS!A986:L989`;
- `GRUPOS!A964:AM967`;
- `PAGOS!A1945:M1946`;
- `'OTROS PAGOS'!A972:K973`.

La matriz completa se guardó en el documento privado `DATASET_QA_CS21A144` dentro de la carpeta de staging.

## QA autenticado pendiente

Una vez publicado el Apps Script separado, deben ejecutarse estos casos:

1. `QA-STU-001`: confirmar `AL_DIA` y acceso a English LAB.
2. `QA-STU-002`: confirmar `CUENTA_PENDIENTE` y rechazo.
3. `QA-STU-003`: confirmar `MATRICULA_NO_ACTIVA` y rechazo.
4. `QA-STU-001` y `QA-STU-004`: entrar simultáneamente a la misma sala desde grupos diferentes.
5. Manipular `player_id` y `player_name` en el navegador y confirmar que el backend conserva la identidad de la sesión.
6. Confirmar que el ranking registra los códigos y nombres autenticados.
7. Repetir una sesión con participantes de Club I CAN cuando exista el grupo QA correspondiente.

## Límites

- La prueba automatizada actual es estática; no demuestra el Apps Script desplegado.
- El proyecto Apps Script independiente debe crearse y publicarse manualmente.
- La definición “al día” usa la fuente financiera canónica actual: `mora_calculada`, `moroso`, `mora_exigible`/`deuda_exigible` y `estado_financiero`.
- El PR debe continuar como borrador hasta completar el QA autenticado contra la URL separada de staging.
