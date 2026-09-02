# CS21A211D · recursos externos QA aislados · 2026-09-02

## Alcance

Provisionamiento release-controlado de recursos vacíos y privados para cerrar la frontera P0-02 del candidato CS21A211. No se copió información productiva ni datos personales.

## Línea base

- `main`: `53df524d0a9eab867d3b307b3e633f366af92a63`.
- PR de contención: #268 / `fix/qa-containment-cs21a211`.
- Apps Script QA canónico: `1GMHihGwnX_-sIS101rRlUoYpAH2HSKyms8lx6L9z7bjb_45YDn-ph6WD`.
- Deployment QA canónico: `AKfycbxEAQ9lAg1Nv0ASX30MAVOzD7IZvwwqSI9MYcNaMhOQ`.
- Snapshot: `QA_HEAD_20260901_215804Z` / aggregate `3e384ac34930e6a936a3f930db8819bd80124ef59f522ac1b5b11fee8f881ec6`.

## Recursos creados

Root privado:

`CAMPUS_QA_CS21A211_ISOLATED_RESOURCES`

Carpetas QA:

1. `01_DOCUMENTOS_QA`
2. `02_DOCUMENTOS_ESTUDIANTES_QA`
3. `03_PLANTILLAS_QA`
4. `04_PADRON_QA`
5. `05_DOCUMENTOS_DOCENTES_QA`
6. `06_CONAPE_BACKUP_QA`

Spreadsheets QA vacíos:

1. `QA_CS21A211_PROFORMAS`
2. `QA_CS21A211_CONAPE_4_ESTUDIANTES`
3. `QA_CS21A211_CONAPE_5_PLAN_ESTUDIOS`
4. `QA_CS21A211_CONAPE_6_HISTORIAL`
5. `QA_CS21A211_CONAPE_7_MOROSIDAD`

Mapa operativo privado adicional:

`QA_CS21A211_RESOURCE_MAP`

El mapa guarda internamente la relación exacta `QA_STAGING_* → recurso`. Los IDs completos no se versionan en este repositorio público.

## Privacidad verificada

La enumeración directa del root después de crear/mover los recursos reportó para los 6 folders, los 5 spreadsheets y el resource map:

- `shared=false`;
- `source_visibility_status=not_shared`;
- sin ACL pública creada por este proceso.

El root también fue verificado como `shared=false` y con permiso de propietario únicamente.

## Datos

- No se copió contenido desde carpetas productivas.
- No se duplicaron hojas productivas.
- Los cinco spreadsheets operativos fueron creados vacíos.
- El folder de padrón permanece vacío deliberadamente; no se copia el padrón productivo mientras ese flujo no forme parte del E2 autorizado.
- El folder de plantillas permanece vacío deliberadamente por la misma razón.

## Script Properties requeridas

El resource map privado contiene los valores para:

- `QA_STAGING_DOCUMENTOS_FOLDER_ID`
- `QA_STAGING_DOCUMENTOS_ESTUDIANTES_FOLDER_ID`
- `QA_STAGING_PLANTILLAS_FOLDER_ID`
- `QA_STAGING_PADRON_FOLDER_ID`
- `QA_STAGING_DOCUMENTOS_DOCENTES_ROOT_ID`
- `QA_STAGING_CONAPE_BACKUP_FOLDER_ID`
- `QA_STAGING_PROFORMAS_SHEET_ID`
- `QA_STAGING_CONAPE_4_ESTUDIANTES_ID`
- `QA_STAGING_CONAPE_5_PLAN_ID`
- `QA_STAGING_CONAPE_6_HISTORIAL_ID`
- `QA_STAGING_CONAPE_7_MOROSIDAD_ID`

## Límite explícito de aislamiento

CS21A211D aísla **destinos escribibles** de documentos/CONAPE. El snapshot todavía contiene IDs de activos oficiales usados como fuente de solo lectura, por ejemplo carpetas de libros/audios y `PLANTILLA_IDS`. Esos activos no se copian ni se alteran en este gate y los endpoints mutantes de documentos continúan default-deny.

Antes de cualquier E4 documental estrictamente aislada se deberán crear plantillas QA/sintéticas y volver property-driven esos IDs de fuente. No copiar padrón/PII productivo para resolver este gate.

## Integridad del candidato

CS21A211E corrigió un off-by-one en el hunk full-file del guard antes de cualquier push. El candidato vigente es:

- 71 archivos / 4,688,555 bytes;
- aggregate `6c1c79c04994f2c10a5c4feee03c275e1664a003497a1febb0ca0add8a960bc1`;
- patch LF `20aebc28ecc42b550f6d1b03a02314674d130d6825faa40c4685bfea5d423768`;
- guard 10,400 bytes / SHA `fd48510ff0601854afc27d0c5dbf5fb450e3a73518282f4efab89f6cf9ac9a5a`;
- 7/7 JS modificados pasan `node --check` tras aplicación real del patch.

## Estado

**RECURSOS QA AISLADOS PROVISIONADOS · PRIVADOS · VACÍOS · SIN DATOS PROD · SCRIPT PROPERTIES AÚN NO CONFIGURADAS.**

Siguiente gate: configurar las 11 Script Properties en el proyecto Apps Script QA canónico usando el mapa privado; luego re-clonar `@HEAD`, verificar source aggregate `3e384ac3...`, aplicar solo el patch `20aebc28...`, verificar candidate aggregate `6c1c79c0...`, hacer `clasp push` sin `--force` al mismo proyecto QA y reejecutar E2/E3. No crear deployment paralelo. No PROD.
